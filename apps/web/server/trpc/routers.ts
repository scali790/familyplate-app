import { publicProcedure, protectedProcedure, router } from "./init";
import { getDb } from "../db/client";
import { mealPlans, mealVotes, userPreferences, users, magicLinkTokens, mealHistory, mealRegenerationQuota, type Meal } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { randomBytes } from "crypto";
import { sendMagicLinkEmail } from "../services/mailjet";
// sdk removed - using DB-backed sessions
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
      .mutation(async ({ input, ctx }) => {
        try {
          console.log("[requestMagicLink] START", { email: input.email, baseUrl: ctx.baseUrl });
          
          const db = await getDb();
          if (!db) {
            console.error("[requestMagicLink] Database not available");
            throw new Error("Database not available");
          }
          console.log("[requestMagicLink] Database connected");

          const token = randomBytes(32).toString("hex");
          const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
          console.log("[requestMagicLink] Token generated", { tokenLength: token.length });

          await db.insert(magicLinkTokens).values({
            email: input.email,
            name: input.name || input.email.split("@")[0],
            token,
            expiresAt,
            used: false,
          });
          console.log("[requestMagicLink] Token saved to database");

          // Use baseUrl from context (extracted from Request headers)
          const magicLink = `${ctx.baseUrl}/auth/verify?token=${token}`;
          console.log("[requestMagicLink] Magic link generated", { magicLink });

          console.log("[requestMagicLink] Calling sendMagicLinkEmail...");
          const emailSent = await sendMagicLinkEmail(
            input.email,
            input.name || input.email.split("@")[0],
            magicLink
          );
          console.log("[requestMagicLink] sendMagicLinkEmail returned", { emailSent });

          if (!emailSent) {
            console.log(`[Magic Link] Email failed, logging link: ${magicLink}`);
          }

          console.log("[requestMagicLink] SUCCESS");
          return { success: true };
        } catch (error: any) {
          console.error("[requestMagicLink] ERROR:", error);
          console.error("[requestMagicLink] Error stack:", error?.stack);
          throw error;
        }
      }),

    // Note: Magic link verification is handled by /app/auth/verify/route.ts
    // which sets the session cookie and redirects to dashboard
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
        console.log('[savePreferences] START', {
          userId: ctx.user.id,
          email: ctx.user.email,
          inputKeys: Object.keys(input),
        });
        
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
          mealTypes: JSON.stringify(input.mealTypes),
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
          cookingTime: input.cookingTime,
          spiceLevel: input.spiceLevel,
          kidFriendly: input.kidFriendly,
          commonDislikes: input.commonDislikes ? JSON.stringify(input.commonDislikes) : null,
          customDislikes: input.customDislikes || null,
          updatedAt: new Date(),
        };

        if (existing[0]) {
          console.log('[savePreferences] Updating existing preferences', { prefsId: existing[0].id });
          await db
            .update(userPreferences)
            .set(prefsData)
            .where(eq(userPreferences.id, existing[0].id));
        } else {
          console.log('[savePreferences] Inserting new preferences');
          await db.insert(userPreferences).values(prefsData);
        }

        console.log('[savePreferences] SUCCESS', {
          userId: ctx.user.id,
          familySize: input.familySize,
          mealTypesCount: input.mealTypes.length,
          cuisinesCount: input.cuisines.length,
        });
        
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

        // Parse JSON fields and map null to defaults
        const parsedPrefs = {
          ...prefs,
          mealTypes: (typeof prefs.mealTypes === "string" ? JSON.parse(prefs.mealTypes) : prefs.mealTypes) as string[],
          cuisines: (typeof prefs.cuisines === "string" ? JSON.parse(prefs.cuisines) : prefs.cuisines) as string[],
          flavors: (typeof prefs.flavors === "string" ? JSON.parse(prefs.flavors) : prefs.flavors) as string[],
          dietaryRestrictions:
            (typeof prefs.dietaryRestrictions === "string"
              ? JSON.parse(prefs.dietaryRestrictions)
              : prefs.dietaryRestrictions) as string[],
          chickenFrequency: prefs.chickenFrequency ?? 2,
          redMeatFrequency: prefs.redMeatFrequency ?? 2,
          fishFrequency: prefs.fishFrequency ?? 2,
          vegetarianFrequency: prefs.vegetarianFrequency ?? 2,
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
        const promptData = buildMealGenerationPrompt(parsedPrefs as any, undefined, recentMealNames);
        const prompt = formatPromptForAI(promptData);

        // Call OpenAI with compact meal schema
        const aiResponse = await invokeLLM({
          model: "gpt-4o-2024-08-06",  // Snapshot model for json_schema support
          messages: [
            {
              role: "system",
              content:
                "You are a helpful meal planning assistant. Generate diverse, family-friendly meal plans. Return COMPACT meal objects (no ingredients/instructions). Always return valid JSON array.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.8,
        });

        let meals: Meal[];
        try {
          const content = aiResponse.choices[0]?.message?.content;
          if (!content || typeof content !== "string") {
            throw new Error("No valid content in AI response");
          }
          const parsed = JSON.parse(content);
          // Handle both array and wrapper object formats
          meals = Array.isArray(parsed) ? parsed : (parsed.meals || []);
        } catch (e) {
          throw new Error(`Failed to parse AI response: ${e}`);
        }

        // Validate we got correct number of meals based on selected meal types
        const expectedMealCount = parsedPrefs.mealTypes.length * 7;
        if (!Array.isArray(meals) || meals.length !== expectedMealCount) {
          throw new Error(`Expected ${expectedMealCount} meals (${parsedPrefs.mealTypes.join(", ")} × 7 days), got ${meals?.length || 0}`);
        }

        // Validate all meals have required mealType
        const invalidMeals = meals.filter(m => !parsedPrefs.mealTypes.includes(m.mealType));
        if (invalidMeals.length > 0) {
          throw new Error(`Some meals have invalid mealType. Expected one of: ${parsedPrefs.mealTypes.join(", ")}`);
        }

        // Save meal plan
        const weekStart = input.weekStartDate || new Date().toISOString().split("T")[0];
        await db.insert(mealPlans).values({
          userId: ctx.user.id,
          weekStartDate: weekStart,
          meals: JSON.stringify(meals),
        });

        // Update meal history for rotation tracking
        const now = new Date();
        for (const meal of meals) {
          // Check if meal already exists in history
          const existingHistory = await db
            .select()
            .from(mealHistory)
            .where(
              and(
                eq(mealHistory.userId, ctx.user.id),
                eq(mealHistory.mealName, meal.name),
                eq(mealHistory.mealType, meal.mealType)
              )
            )
            .limit(1);

          if (existingHistory.length > 0) {
            // Update existing history
            await db
              .update(mealHistory)
              .set({
                lastServed: now,
                timesServed: existingHistory[0].timesServed + 1,
                updatedAt: now,
              })
              .where(eq(mealHistory.id, existingHistory[0].id));
          } else {
            // Insert new history
            await db.insert(mealHistory).values({
              userId: ctx.user.id,
              mealName: meal.name,
              mealType: meal.mealType,
              lastServed: now,
              timesServed: 1,
              isFavorite: false,
              totalUpvotes: 0,
              totalDownvotes: 0,
              totalNeutralVotes: 0,
              cuisine: meal.tags?.find((t) => parsedPrefs.cuisines.includes(t)) || null,
              tags: JSON.stringify(meal.tags || []),
            });
          }
        }

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
