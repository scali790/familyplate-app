import { publicProcedure, protectedProcedure, router } from "./init";
import { getDb } from "../db/client";
import { mealPlans, mealVotes, userPreferences, users, magicLinkTokens, mealRegenerationQuota, mealHistory, type Meal } from "../db/schema";
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
          mealTypes: typeof prefs.mealTypes === "string" ? JSON.parse(prefs.mealTypes) : prefs.mealTypes,
          cuisines: typeof prefs.cuisines === "string" ? JSON.parse(prefs.cuisines) : prefs.cuisines,
          flavors: typeof prefs.flavors === "string" ? JSON.parse(prefs.flavors) : prefs.flavors,
          dietaryRestrictions:
            typeof prefs.dietaryRestrictions === "string"
              ? JSON.parse(prefs.dietaryRestrictions)
              : prefs.dietaryRestrictions,
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

        // Calculate expected meal count
        const mealTypes = (parsedPrefs.mealTypes || []) as string[];
        const expectedMealCount = 7 * mealTypes.length;

        // Define JSON Schema for structured output
        const mealPlanSchema = {
          name: "meal_plan",
          schema: {
            type: "object",
            properties: {
              meals: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    day: {
                      type: "string",
                      enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
                    },
                    mealType: {
                      type: "string",
                      enum: ["breakfast", "lunch", "dinner"]
                    },
                    name: { type: "string" },
                    description: { type: "string" },
                    prepTime: { type: "string" },
                    cookTime: { type: "string" },
                    difficulty: {
                      type: "string",
                      enum: ["easy", "medium", "hard"]
                    },
                    tags: {
                      type: "array",
                      items: { type: "string" }
                    },
                    emoji: { type: "string" },
                    recipeId: { type: "string" },
                    ingredients: {
                      type: "array",
                      items: { type: "string" },
                      description: "List of ingredients with quantities (e.g., '2 chicken breasts', '1 tbsp olive oil')"
                    },
                    instructions: {
                      type: "array",
                      items: { type: "string" },
                      description: "Numbered cooking instructions (4-8 steps, short sentences)"
                    },
                    kidFriendly: {
                      type: "boolean",
                      description: "Whether this meal is suitable for kids"
                    },
                    spiceLevel: {
                      type: "string",
                      enum: ["mild", "medium", "spicy"],
                      description: "Spice level of the dish"
                    }
                  },
                  required: ["day", "mealType", "name", "description", "prepTime", "cookTime", "difficulty", "tags", "emoji", "recipeId", "ingredients", "instructions"],
                  additionalProperties: false
                }
              }
            },
            required: ["meals"],
            additionalProperties: false
          },
          strict: true
        };

        // Call OpenAI with JSON Schema
        const aiResponse = await invokeLLM({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful meal planning assistant. Generate diverse, family-friendly recipes with complete cooking instructions. " +
                "For each meal, provide: " +
                "1) A clear list of ingredients with quantities (e.g., '2 chicken breasts', '1 tbsp olive oil') " +
                "2) 4-8 numbered cooking steps with short, clear sentences " +
                "3) Accurate prep and cook times " +
                "4) Appropriate difficulty level and tags",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.6,  // Lower temperature for more consistent output
          outputSchema: mealPlanSchema,
        });

        let meals: Meal[];
        try {
          let content = aiResponse.choices[0]?.message?.content;
          if (!content || typeof content !== "string") {
            throw new Error("No valid content in AI response");
          }

          // Remove markdown code fences if present
          content = content.trim();
          if (content.startsWith("```json")) {
            content = content.replace(/^```json\s*/, "").replace(/\s*```$/, "");
          } else if (content.startsWith("```")) {
            content = content.replace(/^```\s*/, "").replace(/\s*```$/, "");
          }

          const parsed = JSON.parse(content);
          
          // Handle both direct array and {meals: [...]} format
          meals = Array.isArray(parsed) ? parsed : parsed.meals;

          if (!Array.isArray(meals)) {
            throw new Error("Parsed content is not an array");
          }

          // Validate meal count
          if (meals.length !== expectedMealCount) {
            console.warn(`[generatePlan] Expected ${expectedMealCount} meals, got ${meals.length}`);
            // Don't throw - allow partial plans for now
          }

          // Validate each meal has required fields
          meals.forEach((meal, idx) => {
            if (!meal.day || !meal.mealType || !meal.name) {
              throw new Error(`Meal at index ${idx} is missing required fields`);
            }
          });

        } catch (e) {
          const errorMessage = e instanceof Error ? e.message : "Unknown error";
          console.error("[generatePlan] Failed to parse AI response:", errorMessage);
          throw new Error(`Failed to parse AI response: ${errorMessage}`);
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

    // Check regeneration quota
    checkRegenerationQuota: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const today = new Date().toISOString().split("T")[0];
      const quotaResult = await db
        .select()
        .from(mealRegenerationQuota)
        .where(and(eq(mealRegenerationQuota.userId, ctx.user.id), eq(mealRegenerationQuota.date, today)))
        .limit(1);

      const quota = quotaResult[0];
      const used = quota?.count || 0;
      const limit = 2; // Free tier limit
      const remaining = Math.max(0, limit - used);

      return {
        used,
        limit,
        remaining,
        canRegenerate: remaining > 0,
      };
    }),

    // Regenerate single meal
    regenerateSingleMeal: protectedProcedure
      .input(
        z.object({
          mealIndex: z.number(), // Index in meals array
          day: z.string(), // e.g., "monday"
          mealType: z.string(), // e.g., "dinner"
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // 1. Check quota
        const today = new Date().toISOString().split("T")[0];
        const quotaResult = await db
          .select()
          .from(mealRegenerationQuota)
          .where(and(eq(mealRegenerationQuota.userId, ctx.user.id), eq(mealRegenerationQuota.date, today)))
          .limit(1);

        const quota = quotaResult[0];
        const used = quota?.count || 0;
        const limit = 2; // Free tier

        if (used >= limit) {
          throw new Error("QUOTA_EXCEEDED");
        }

        // 2. Get current meal plan
        const planResult = await db
          .select()
          .from(mealPlans)
          .where(eq(mealPlans.userId, ctx.user.id))
          .orderBy(desc(mealPlans.createdAt))
          .limit(1);

        const plan = planResult[0];
        if (!plan) throw new Error("No meal plan found");

        const meals: Meal[] = typeof plan.meals === "string" ? JSON.parse(plan.meals) : plan.meals;
        const oldMeal = meals[input.mealIndex];
        if (!oldMeal) throw new Error("Meal not found");

        // 3. Save old meal to history
        await db.insert(mealHistory).values({
          userId: ctx.user.id,
          mealName: oldMeal.name,
          mealData: JSON.stringify(oldMeal),
          reason: "regenerated",
        });

        // 4. Get user preferences
        const prefsResult = await db
          .select()
          .from(userPreferences)
          .where(eq(userPreferences.userId, ctx.user.id))
          .limit(1);

        const prefs = prefsResult[0];
        if (!prefs) throw new Error("Preferences not found");

        const parsedPrefs = {
          ...prefs,
          cuisines: typeof prefs.cuisines === "string" ? JSON.parse(prefs.cuisines) : prefs.cuisines,
          flavors: typeof prefs.flavors === "string" ? JSON.parse(prefs.flavors) : prefs.flavors,
          dietaryRestrictions:
            typeof prefs.dietaryRestrictions === "string"
              ? JSON.parse(prefs.dietaryRestrictions)
              : prefs.dietaryRestrictions,
          chickenFrequency: prefs.chickenFrequency ?? 2,
          redMeatFrequency: prefs.redMeatFrequency ?? 2,
          fishFrequency: prefs.fishFrequency ?? 2,
          vegetarianFrequency: prefs.vegetarianFrequency ?? 2,
        };

        // 5. Get meal history to avoid repeats
        const historyResult = await db
          .select()
          .from(mealPlans)
          .where(eq(mealPlans.userId, ctx.user.id))
          .orderBy(desc(mealPlans.createdAt))
          .limit(4);

        const recentMealNames: string[] = [];
        historyResult.forEach((p) => {
          const m: Meal[] = typeof p.meals === "string" ? JSON.parse(p.meals) : p.meals;
          m.forEach((meal) => recentMealNames.push(meal.name));
        });

        // 6. Generate new meal with AI
        const prompt = `Generate ONE ${input.mealType} meal for ${input.day}.

User Preferences:
- Family Size: ${parsedPrefs.familySize}
- Cuisines: ${parsedPrefs.cuisines.join(", ")}
- Flavors: ${parsedPrefs.flavors.join(", ")}
- Dietary Restrictions: ${parsedPrefs.dietaryRestrictions?.join(", ") || "None"}
- Chicken Frequency: ${parsedPrefs.chickenFrequency}/4
- Red Meat Frequency: ${parsedPrefs.redMeatFrequency}/4
- Fish Frequency: ${parsedPrefs.fishFrequency}/4
- Vegetarian Frequency: ${parsedPrefs.vegetarianFrequency}/4

Avoid these recent meals:
${recentMealNames.slice(0, 20).join(", ")}

Return ONLY a JSON object (no markdown, no extra text) with this structure:
{
  "name": "Meal Name",
  "description": "Brief description",
  "prepTime": "15 mins",
  "cookTime": "30 mins",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": ["step 1", "step 2"],
  "tags": ["protein-type", "dietary-style"]
}`;

        const aiResponse = await invokeLLM({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a meal planning assistant. Generate ONE meal as valid JSON.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.9, // Higher for more variety
        });

        let newMeal: Meal;
        try {
          const content = aiResponse.choices[0]?.message?.content;
          if (!content || typeof content !== "string") {
            throw new Error("No valid content in AI response");
          }
          newMeal = JSON.parse(content);
        } catch (e) {
          throw new Error("Failed to parse AI response");
        }

        // 7. Replace meal in plan
        meals[input.mealIndex] = newMeal;

        // 8. Update meal plan
        await db
          .update(mealPlans)
          .set({ meals: JSON.stringify(meals) })
          .where(eq(mealPlans.id, plan.id));

        // 9. Update quota
        if (quota) {
          await db
            .update(mealRegenerationQuota)
            .set({ count: used + 1, updatedAt: new Date() })
            .where(eq(mealRegenerationQuota.id, quota.id));
        } else {
          await db.insert(mealRegenerationQuota).values({
            userId: ctx.user.id,
            date: today,
            count: 1,
          });
        }

        return {
          success: true,
          newMeal,
          quotaUsed: used + 1,
          quotaRemaining: limit - (used + 1),
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
