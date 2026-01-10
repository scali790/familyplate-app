import { publicProcedure, protectedProcedure, router } from "./init";
import { getDb } from "../db/client";
import { mealPlans, mealVotes, userPreferences, users, magicLinkTokens, type Meal } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { randomBytes } from "crypto";
import { sendMagicLinkEmail } from "../services/mailjet";
import { sdk } from "../services/sdk";
import { savePreferencesSchema } from "../schemas/preferences";
import { buildMealGenerationPrompt, formatPromptForAI } from "../services/promptBuilder";
import { invokeLLM } from "../services/llm";

const COOKIE_NAME = "manus_session";

export const appRouter = router({
  auth: router({
    // Get current user
    me: publicProcedure.query((opts) => opts.ctx.user),

    // Request magic link
    requestMagicLink: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          name: z.string().min(1).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const token = randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        await db.insert(magicLinkTokens).values({
          email: input.email,
          name: input.name || input.email.split("@")[0],
          token,
          expiresAt,
          used: false,
        });

        const webUrl = process.env.EXPO_PUBLIC_WEB_URL || "http://localhost:3000";
        const magicLink = `${webUrl}/auth/verify?token=${token}`;

        const emailSent = await sendMagicLinkEmail(
          input.email,
          input.name || input.email.split("@")[0],
          magicLink
        );

        if (!emailSent) {
          console.log(`[Magic Link] ${magicLink}`);
        }

        return { success: true };
      }),

    // Verify magic link (will be called from separate route handler)
    verifyMagicLink: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db
          .select()
          .from(magicLinkTokens)
          .where(eq(magicLinkTokens.token, input.token))
          .limit(1);

        const tokenData = result[0];

        if (!tokenData) {
          throw new Error("Invalid or expired magic link");
        }

        if (tokenData.used) {
          throw new Error("This magic link has already been used");
        }

        if (new Date() > tokenData.expiresAt) {
          throw new Error("This magic link has expired");
        }

        // Mark token as used
        await db
          .update(magicLinkTokens)
          .set({ used: true })
          .where(eq(magicLinkTokens.id, tokenData.id));

        // Create or get user
        const openId = `magic-${tokenData.email}`;

        await db
          .insert(users)
          .values({
            openId,
            email: tokenData.email,
            name: tokenData.name || tokenData.email.split("@")[0],
            loginMethod: "magic-link",
          })
          .onConflictDoUpdate({
            target: users.openId,
            set: {
              name: tokenData.name || tokenData.email.split("@")[0],
              lastSignedIn: new Date(),
            },
          });

        const userResult = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
        const user = userResult[0];

        if (!user) throw new Error("Failed to create user");

        // Create session token
        const sessionToken = await sdk.createSessionToken(openId, {
          name: user.name,
          expiresInMs: 365 * 24 * 60 * 60 * 1000, // 1 year
        });

        return {
          success: true,
          sessionToken,
          user: {
            id: user.id,
            openId: user.openId,
            name: user.name,
            email: user.email,
          },
        };
      }),
  }),

  preferences: router({
    // Get user preferences
    getPreferences: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, ctx.user.id))
        .limit(1);

      const prefs = result[0];
      if (!prefs) return null;

      return {
        ...prefs,
        cuisines: typeof prefs.cuisines === "string" ? JSON.parse(prefs.cuisines) : prefs.cuisines,
        flavors: typeof prefs.flavors === "string" ? JSON.parse(prefs.flavors) : prefs.flavors,
        dietaryRestrictions:
          typeof prefs.dietaryRestrictions === "string"
            ? JSON.parse(prefs.dietaryRestrictions)
            : prefs.dietaryRestrictions,
      };
    }),

    // Save user preferences
    savePreferences: protectedProcedure
      .input(savePreferencesSchema)
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const existing = await db
          .select()
          .from(userPreferences)
          .where(eq(userPreferences.userId, ctx.user.id))
          .limit(1);

        const prefsData = {
          userId: ctx.user.id,
          familyName: input.familyName || null,
          familySize: input.familySize,
          cuisines: JSON.stringify(input.cuisines),
          flavors: JSON.stringify(input.flavors),
          dietaryRestrictions: input.dietaryRestrictions
            ? JSON.stringify(input.dietaryRestrictions)
            : null,
          country: input.country || "UAE",
          chickenFrequency: input.chickenFrequency,
          redMeatFrequency: input.redMeatFrequency,
          fishFrequency: input.fishFrequency,
          vegetarianFrequency: input.vegetarianFrequency,
          updatedAt: new Date(),
        };

        if (existing[0]) {
          await db
            .update(userPreferences)
            .set(prefsData)
            .where(eq(userPreferences.id, existing[0].id));
        } else {
          await db.insert(userPreferences).values(prefsData);
        }

        return { success: true };
      }),
  }),

  mealPlanning: router({
    // Generate meal plan
    generatePlan: protectedProcedure
      .input(z.object({ weekStartDate: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const prefsResult = await db
          .select()
          .from(userPreferences)
          .where(eq(userPreferences.userId, ctx.user.id))
          .limit(1);

        const prefs = prefsResult[0];
        if (!prefs) {
          throw new Error("Please complete onboarding first");
        }

        // Parse JSON fields
        const parsedPrefs = {
          ...prefs,
          cuisines: typeof prefs.cuisines === "string" ? JSON.parse(prefs.cuisines) : prefs.cuisines,
          flavors: typeof prefs.flavors === "string" ? JSON.parse(prefs.flavors) : prefs.flavors,
          dietaryRestrictions:
            typeof prefs.dietaryRestrictions === "string"
              ? JSON.parse(prefs.dietaryRestrictions)
              : prefs.dietaryRestrictions,
        };

        // Get recent meal history to avoid repeats
        const historyResult = await db
          .select()
          .from(mealPlans)
          .where(eq(mealPlans.userId, ctx.user.id))
          .orderBy(desc(mealPlans.createdAt))
          .limit(4);

        const recentMealNames: string[] = [];
        historyResult.forEach((plan) => {
          const meals: Meal[] =
            typeof plan.meals === "string" ? JSON.parse(plan.meals) : plan.meals;
          meals.forEach((meal) => recentMealNames.push(meal.name));
        });

        // Build prompt using Prompt Builder service
        const promptData = buildMealGenerationPrompt(parsedPrefs, undefined, recentMealNames);
        const prompt = formatPromptForAI(promptData);

        // Call OpenAI
        const aiResponse = await invokeLLM({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful meal planning assistant. Generate diverse, family-friendly dinner recipes.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.8,
        });

        let meals: Meal[];
        try {
          meals = JSON.parse(aiResponse.content);
        } catch (e) {
          throw new Error("Failed to parse AI response");
        }

        // Save meal plan
        const weekStart = input.weekStartDate || new Date().toISOString().split("T")[0];
        await db.insert(mealPlans).values({
          userId: ctx.user.id,
          weekStartDate: weekStart,
          meals: JSON.stringify(meals),
        });

        return { success: true, meals };
      }),

    // Get current meal plan
    getCurrentPlan: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(mealPlans)
        .where(eq(mealPlans.userId, ctx.user.id))
        .orderBy(desc(mealPlans.createdAt))
        .limit(1);

      const plan = result[0];
      if (!plan) return null;

      const meals: Meal[] = typeof plan.meals === "string" ? JSON.parse(plan.meals) : plan.meals;

      return {
        id: plan.id,
        weekStartDate: plan.weekStartDate,
        meals,
        createdAt: plan.createdAt,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
