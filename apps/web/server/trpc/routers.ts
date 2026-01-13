import { publicProcedure, protectedProcedure, router } from "./init";
import { getDb } from "../db/client";
import { mealPlans, mealVotes, userPreferences, users, magicLinkTokens, mealRegenerationQuota, mealHistory, type Meal } from "../db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
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
                  required: ["day", "mealType", "name", "description", "prepTime", "cookTime", "difficulty", "tags", "emoji", "recipeId", "kidFriendly", "spiceLevel"],
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
        const insertResult = await db.insert(mealPlans).values({
          userId: ctx.user.id,
          weekStartDate: weekStart,
          meals: JSON.stringify(meals),
        }).returning({ id: mealPlans.id });
        
        const newMealPlanId = insertResult[0]?.id;

        // Auto-close any open voting sessions for previous meal plans
        if (newMealPlanId) {
          await db.execute(
            sql`UPDATE vote_sessions 
                SET status = 'closed', 
                    closed_reason = 'meal_plan_changed', 
                    closed_at = NOW() 
                WHERE user_id = ${ctx.user.id} 
                AND meal_plan_id != ${newMealPlanId} 
                AND status = 'open'`
          );
          console.log('[generatePlan] Auto-closed open voting sessions for previous meal plans');
        }

        return { success: true, meals };
      }),

    // Generate partial meal plan (only specific meal type)
    generatePartialPlan: protectedProcedure
      .input(z.object({ mealType: z.enum(["breakfast", "lunch", "dinner"]) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        console.log("[generatePartialPlan] START", { mealType: input.mealType });

        // Get user preferences
        const prefsResult = await db
          .select()
          .from(userPreferences)
          .where(eq(userPreferences.userId, ctx.user.id))
          .limit(1);

        const prefs = prefsResult[0];
        if (!prefs) {
          throw new Error("Please complete onboarding first");
        }

        // Check if meal type is in preferences, if not add it
        const currentMealTypes = typeof prefs.mealTypes === "string" ? JSON.parse(prefs.mealTypes) : (prefs.mealTypes || []);
        if (!currentMealTypes.includes(input.mealType)) {
          console.log(`[generatePartialPlan] Adding ${input.mealType} to user preferences`);
          const updatedMealTypes = [...currentMealTypes, input.mealType];
          await db
            .update(userPreferences)
            .set({ mealTypes: JSON.stringify(updatedMealTypes) })
            .where(eq(userPreferences.userId, ctx.user.id));
        }

        // Parse JSON fields
        const parsedPrefs = {
          ...prefs,
          mealTypes: [input.mealType], // Only generate for this meal type
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

        // Get recent meal history
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

        // Build prompt
        const promptData = buildMealGenerationPrompt(parsedPrefs as any, undefined, recentMealNames);
        const prompt = formatPromptForAI(promptData);

        // Expected count: 7 meals for one meal type
        const expectedMealCount = 7;

        // Define JSON Schema
        const mealPlanSchema = {
          name: "meal_plan",
          strict: true,
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
                      enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
                      description: "Day of the week"
                    },
                    mealType: {
                      type: "string",
                      enum: ["breakfast", "lunch", "dinner"],
                      description: "Type of meal"
                    },
                    name: {
                      type: "string",
                      description: "Name of the dish"
                    },
                    description: {
                      type: "string",
                      description: "Short description (1-2 sentences, max 200 chars)"
                    },
                    prepTime: {
                      type: "string",
                      description: "Preparation time (e.g., '10 mins')"
                    },
                    cookTime: {
                      type: "string",
                      description: "Cooking time (e.g., '25 mins')"
                    },
                    difficulty: {
                      type: "string",
                      enum: ["easy", "medium", "hard"],
                      description: "Difficulty level"
                    },
                    tags: {
                      type: "array",
                      items: { type: "string" },
                      description: "Tags like cuisine, protein type, dietary info"
                    },
                    emoji: {
                      type: "string",
                      description: "Single emoji representing the dish"
                    },
                    recipeId: {
                      type: "string",
                      description: "Unique recipe ID (e.g., 'mon-breakfast-001')"
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
                  required: ["day", "mealType", "name", "description", "prepTime", "cookTime", "difficulty", "tags", "emoji", "recipeId", "kidFriendly", "spiceLevel"],
                  additionalProperties: false
                }
              }
            },
            required: ["meals"],
            additionalProperties: false
          }
        };

        // Call OpenAI
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
          temperature: 0.6,
          outputSchema: mealPlanSchema,
        });

        // Parse response
        let meals: Meal[];
        try {
          const content = aiResponse.choices[0]?.message?.content;
          if (!content) throw new Error("No content in AI response");

          // Ensure content is a string
          const contentString = typeof content === 'string' ? content : JSON.stringify(content);

          // Remove markdown code fences if present
          const cleanedContent = contentString.replace(/```json\n?|```\n?/g, "").trim();
          const parsed = JSON.parse(cleanedContent);
          meals = parsed.meals || parsed;

          // Validate meal count
          if (meals.length !== expectedMealCount) {
            console.warn(`[generatePartialPlan] Expected ${expectedMealCount} meals, got ${meals.length}`);
          }

          // Validate required fields
          meals.forEach((meal, index) => {
            if (!meal.name || !meal.description || !meal.prepTime || !meal.cookTime) {
              throw new Error(`Meal at index ${index} is missing required fields`);
            }
          });
        } catch (e) {
          const errorMessage = e instanceof Error ? e.message : "Unknown error";
          console.error("[generatePartialPlan] Failed to parse AI response:", errorMessage);
          throw new Error(`Failed to parse AI response: ${errorMessage}`);
        }

        // Get current meal plan
        const currentPlanResult = await db
          .select()
          .from(mealPlans)
          .where(eq(mealPlans.userId, ctx.user.id))
          .orderBy(desc(mealPlans.createdAt))
          .limit(1);

        const currentPlan = currentPlanResult[0];
        if (!currentPlan) {
          throw new Error("No existing meal plan found. Please generate a full plan first.");
        }

        // Merge new meals with existing meals (replace meals with same day+mealType)
        const existingMeals: Meal[] = typeof currentPlan.meals === "string" ? JSON.parse(currentPlan.meals) : currentPlan.meals;
        
        // Remove existing meals for this meal type
        const filteredMeals = existingMeals.filter(m => m.mealType !== input.mealType);
        
        // Add new meals
        const mergedMeals = [...filteredMeals, ...meals];

        // Update meal plan
        await db
          .update(mealPlans)
          .set({
            meals: JSON.stringify(mergedMeals),
          })
          .where(eq(mealPlans.id, currentPlan.id));

        console.log("[generatePartialPlan] SUCCESS", { mealType: input.mealType, mealsAdded: meals.length });

        return { success: true, meals: mergedMeals };
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

    // Get recipe details (on-demand generation)
    getRecipeDetails: protectedProcedure
      .input(z.object({ 
        recipeId: z.string(),
        mealPlanId: z.number().optional() 
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        console.log("[getRecipeDetails] START", { recipeId: input.recipeId });

        // 1. Get current meal plan
        const planResult = await db
          .select()
          .from(mealPlans)
          .where(eq(mealPlans.userId, ctx.user.id))
          .orderBy(desc(mealPlans.createdAt))
          .limit(1);

        const plan = planResult[0];
        if (!plan) throw new Error("No meal plan found");

        const meals: Meal[] = typeof plan.meals === "string" ? JSON.parse(plan.meals) : plan.meals;
        const meal = meals.find((m) => m.recipeId === input.recipeId);
        if (!meal) throw new Error("Meal not found");

        // 2. Check if details already exist
        if (meal.ingredients && meal.ingredients.length > 0 && meal.instructions && meal.instructions.length > 0) {
          console.log("[getRecipeDetails] Details already cached");
          return {
            ingredients: meal.ingredients,
            instructions: meal.instructions,
          };
        }

        // 3. Generate details via OpenAI
        console.log("[getRecipeDetails] Generating details via OpenAI");
        const details = await generateRecipeDetails({
          name: meal.name,
          description: meal.description,
          tags: meal.tags,
          prepTime: meal.prepTime,
          cookTime: meal.cookTime,
          difficulty: meal.difficulty || "medium",
        });

        // 4. Update meal in array
        meal.ingredients = details.ingredients;
        meal.instructions = details.instructions;

        // 5. Save updated meal plan to DB
        await db
          .update(mealPlans)
          .set({ meals: JSON.stringify(meals) })
          .where(eq(mealPlans.id, plan.id));

        console.log("[getRecipeDetails] Details generated and cached");
        return {
          ingredients: details.ingredients,
          instructions: details.instructions,
        };
      }),
  }),

  // Public Voting Sessions (Family Voting via Share Link)
  voteSessions: router({
    // Create new voting session (Manager only)
    create: protectedProcedure
      .input(
        z.object({
          mealPlanId: z.number(),
          maxVoters: z.number().default(10),
          expiresInDays: z.number().default(7),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Check for existing open session for this meal plan
        const existingResult = await db.execute(
          sql`SELECT id, expires_at FROM vote_sessions 
              WHERE user_id = ${ctx.user.id} 
              AND meal_plan_id = ${input.mealPlanId} 
              AND status = 'open' 
              AND expires_at > NOW() 
              ORDER BY created_at DESC 
              LIMIT 1`
        );

        if (existingResult.length > 0) {
          const existing = existingResult[0] as any;
          const shareUrl = `${ctx.baseUrl}/vote/${existing.id}`;
          console.log("[voteSessions.create] Reusing existing session", { sessionId: existing.id, shareUrl });
          return {
            sessionId: existing.id,
            shareUrl,
            expiresAt: existing.expires_at,
          };
        }

        // Load meal plan to get meals
        const mealPlanResult = await db.execute(
          sql`SELECT meals FROM meal_plans WHERE id = ${input.mealPlanId} AND user_id = ${ctx.user.id}`
        );
        
        if (mealPlanResult.length === 0) {
          throw new Error("Meal plan not found");
        }
        
        const mealPlan = mealPlanResult[0] as any;
        let meals: any[] = [];
        
        // Parse meals from meal plan
        if (mealPlan.meals) {
          try {
            meals = typeof mealPlan.meals === "string" ? JSON.parse(mealPlan.meals) : mealPlan.meals;
            if (typeof meals === "string") meals = JSON.parse(meals);
            if (!Array.isArray(meals)) meals = [];
          } catch (err) {
            console.error('[voteSessions.create] Failed to parse meals:', err);
            meals = [];
          }
        }
        
        console.log('[voteSessions.create] Loaded meals count:', meals.length);

        // Generate UUID for new session
        const sessionId = randomBytes(16).toString("hex");
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);

        // Create session with meals snapshot
        await db.execute(
          sql`INSERT INTO vote_sessions (id, user_id, meal_plan_id, meals, status, max_voters, expires_at) 
              VALUES (${sessionId}, ${ctx.user.id}, ${input.mealPlanId}, ${JSON.stringify(meals)}, ${'open'}, ${input.maxVoters}, ${expiresAt.toISOString()})`
        );

        const shareUrl = `${ctx.baseUrl}/vote/${sessionId}`;

        console.log("[voteSessions.create] New session created", { sessionId, shareUrl });

        return {
          sessionId,
          shareUrl,
          expiresAt: expiresAt.toISOString(),
        };
      }),

    // Get public session info (no auth)
    getPublic: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Get session with family name
        const sessionResult = await db.execute(
          sql`SELECT vs.*, mp.meals, mp.week_start_date, up.family_name 
           FROM vote_sessions vs 
           JOIN meal_plans mp ON vs.meal_plan_id = mp.id 
           JOIN users u ON vs.user_id = u.id
           LEFT JOIN user_preferences up ON u.id = up.user_id
           WHERE vs.id = ${input.sessionId}`
        );

        if (sessionResult.length === 0) {
          throw new Error("Session not found");
        }

        const session = sessionResult[0] as any;

        // Check if expired
        const isExpired = new Date() > new Date(session.expires_at);
        const isOpen = session.status === "open" && !isExpired;

        // Get current voter count
        const voterCountResult = await db.execute(
          sql`SELECT COUNT(DISTINCT voter_name) as count FROM public_meal_votes WHERE vote_session_id = ${input.sessionId}`
        );
        const currentVoterCount = parseInt((voterCountResult[0] as any).count || "0");

        // Parse meals and add formatted day names
        let meals = session.meals;
        
        // Handle double-encoded JSON (string -> string -> array)
        if (typeof meals === "string") {
          try {
            meals = JSON.parse(meals);
            // Check if still a string (double-encoded)
            if (typeof meals === "string") {
              meals = JSON.parse(meals);
            }
          } catch (err) {
            console.error('[voteSessions.getPublic] Failed to parse meals:', err);
            meals = [];
          }
        }
        
        // Ensure meals is an array
        if (!Array.isArray(meals)) {
          console.error('[voteSessions.getPublic] meals is not an array after parsing:', typeof meals);
          meals = [];
        }
        
        console.log('[voteSessions.getPublic] Parsed meals count:', meals.length);
        
        // Add formatted day display (e.g., "Monday, Jan 13")
        const weekStart = new Date(session.week_start_date);
        const mealsWithDays = meals.map((meal: any) => {
          if (meal.day) {
            const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            const dayIndex = dayOrder.indexOf(meal.day.toLowerCase());
            if (dayIndex !== -1) {
              const mealDate = new Date(weekStart);
              mealDate.setDate(weekStart.getDate() + dayIndex);
              const formattedDay = mealDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric' 
              });
              return { ...meal, dayFormatted: formattedDay };
            }
          }
          return meal;
        });

        return {
          sessionId: session.id,
          status: session.status,
          closedReason: session.closed_reason,
          closedAt: session.closed_at,
          isOpen,
          isExpired,
          expiresAt: session.expires_at,
          maxVoters: session.max_voters,
          currentVoterCount,
          weekStartDate: session.week_start_date,
          familyName: session.family_name,
          meals: mealsWithDays,
        };
      }),

    // Get voting results (Manager only)
    getResults: protectedProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Verify session belongs to user
        const sessionResult = await db.execute(
          sql`SELECT * FROM vote_sessions WHERE id = ${input.sessionId} AND user_id = ${ctx.user.id}`
        );

        if (sessionResult.length === 0) {
          throw new Error("Session not found or unauthorized");
        }

        // Get session meals for names
        const session = sessionResult[0] as any;
        let meals: any[] = [];
        if (session.meals) {
          try {
            meals = typeof session.meals === "string" ? JSON.parse(session.meals) : session.meals;
            if (typeof meals === "string") meals = JSON.parse(meals);
            if (!Array.isArray(meals)) meals = [];
          } catch (err) {
            console.error('[getResults] Failed to parse meals:', err);
            meals = [];
          }
        }

        // Create meal lookup map (recipeId -> name)
        const mealNames: Record<string, string> = {};
        console.log('[getResults] Parsed meals count:', meals.length);
        meals.forEach((meal: any) => {
          console.log('[getResults] Meal:', { recipeId: meal.recipeId, name: meal.name });
          if (meal.recipeId && meal.name) {
            mealNames[meal.recipeId] = meal.name;
          }
        });
        console.log('[getResults] mealNames lookup:', mealNames);

        // Get all votes
        const votesResult = await db.execute(
          sql`SELECT meal_id, voter_name, reaction, created_at 
           FROM public_meal_votes 
           WHERE vote_session_id = ${input.sessionId} 
           ORDER BY created_at DESC`
        );

        const votes = votesResult as any[];

        // Aggregate by meal
        const mealAggregates: Record<string, { up: number; neutral: number; down: number; score: number; name: string }> = {};
        const voterBreakdown: Record<string, Array<{ mealId: string; reaction: string }>> = {};

        votes.forEach((vote) => {
          // Meal aggregates
          if (!mealAggregates[vote.meal_id]) {
            console.log('[getResults] Creating aggregate for meal_id:', vote.meal_id, 'name:', mealNames[vote.meal_id]);
            mealAggregates[vote.meal_id] = { 
              up: 0, 
              neutral: 0, 
              down: 0, 
              score: 0,
              name: mealNames[vote.meal_id] || vote.meal_id
            };
          }
          if (vote.reaction === "up") {
            mealAggregates[vote.meal_id].up++;
            mealAggregates[vote.meal_id].score++;
          } else if (vote.reaction === "down") {
            mealAggregates[vote.meal_id].down++;
            mealAggregates[vote.meal_id].score--;
          } else if (vote.reaction === "neutral") {
            mealAggregates[vote.meal_id].neutral++;
          }

          // Voter breakdown
          if (!voterBreakdown[vote.voter_name]) {
            voterBreakdown[vote.voter_name] = [];
          }
          voterBreakdown[vote.voter_name].push({
            mealId: vote.meal_id,
            reaction: vote.reaction,
          });
        });

        return {
          status: session.status,
          closedReason: session.closed_reason,
          closedAt: session.closed_at,
          mealAggregates,
          voterBreakdown,
          totalVoters: Object.keys(voterBreakdown).length,
        };
      }),

    // Close session (Manager only)
    close: protectedProcedure
      .input(z.object({ sessionId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db.execute(
          sql`UPDATE vote_sessions 
              SET status = 'closed', 
                  closed_reason = 'manual', 
                  closed_at = NOW() 
              WHERE id = ${input.sessionId} 
              AND user_id = ${ctx.user.id}`
        );

        console.log('[voteSessions.close] Session closed manually', { sessionId: input.sessionId });
        return { success: true };
      }),

    // Reset votes (Manager only)
    reset: protectedProcedure
      .input(z.object({ sessionId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Verify ownership
        const sessionResult = await db.execute(
          sql`SELECT * FROM vote_sessions WHERE id = ${input.sessionId} AND user_id = ${ctx.user.id}`
        );

        if (sessionResult.length === 0) {
          throw new Error("Session not found or unauthorized");
        }

        // Delete all votes
        await db.execute(
          sql`DELETE FROM public_meal_votes WHERE vote_session_id = ${input.sessionId}`
        );

        return { success: true };
      }),

    // Regenerate link (Manager only)
    regenerate: protectedProcedure
      .input(z.object({ mealPlanId: z.number(), expiresInDays: z.number().default(7) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Close old sessions for this meal plan
        await db.execute(
          sql`UPDATE vote_sessions SET status = 'closed' WHERE meal_plan_id = ${input.mealPlanId} AND user_id = ${ctx.user.id}`
        );

        // Create new session
        const sessionId = randomBytes(16).toString("hex");
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);

        await db.execute(
          sql`INSERT INTO vote_sessions (id, user_id, meal_plan_id, status, max_voters, expires_at) 
           VALUES (${sessionId}, ${ctx.user.id}, ${input.mealPlanId}, 'open', 10, ${expiresAt.toISOString()})`
        );

        const shareUrl = `${ctx.baseUrl}/vote/${sessionId}`;

        return { sessionId, shareUrl, expiresAt: expiresAt.toISOString() };
      }),
  }),

  // Public Meal Votes (no auth required)
  publicVotes: router({
    // Upsert vote (no auth)
    upsert: publicProcedure
      .input(
        z.object({
          sessionId: z.string(),
          voterName: z.string().min(2).max(32),
          mealId: z.string(),
          reaction: z.enum(["up", "neutral", "down"]),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Sanitize voter name
        const sanitizedName = input.voterName.trim().substring(0, 32);

        // Check session status
        const sessionResult = await db.execute(
          sql`SELECT status, expires_at, max_voters FROM vote_sessions WHERE id = ${input.sessionId}`
        );

        if (sessionResult.length === 0) {
          throw new Error("Session not found");
        }

        const session = sessionResult[0] as any;
        const isExpired = new Date() > new Date(session.expires_at);

        if (session.status !== "open" || isExpired) {
          throw new Error("Voting session is closed");
        }

        // Check max voters limit
        const voterCountResult = await db.execute(
          sql`SELECT COUNT(DISTINCT voter_name) as count FROM public_meal_votes WHERE vote_session_id = ${input.sessionId}`
        );
        const currentVoterCount = parseInt((voterCountResult[0] as any).count || "0");

        // Check if this is a new voter
        const existingVoterResult = await db.execute(
          sql`SELECT COUNT(*) as count FROM public_meal_votes WHERE vote_session_id = ${input.sessionId} AND voter_name = ${sanitizedName}`
        );
        const isExistingVoter = parseInt((existingVoterResult[0] as any).count || "0") > 0;

        if (!isExistingVoter && currentVoterCount >= session.max_voters) {
          throw new Error("Maximum voters reached");
        }

        // Upsert vote (update if exists, insert if not)
        await db.execute(
          sql`INSERT INTO public_meal_votes (vote_session_id, meal_id, voter_name, reaction, updated_at) 
           VALUES (${input.sessionId}, ${input.mealId}, ${sanitizedName}, ${input.reaction}, NOW()) 
           ON CONFLICT (vote_session_id, meal_id, voter_name) 
           DO UPDATE SET reaction = ${input.reaction}, updated_at = NOW()`
        );

        console.log("[publicVotes.upsert] Vote saved", {
          sessionId: input.sessionId,
          voter: sanitizedName,
          mealId: input.mealId,
          reaction: input.reaction,
        });

        return { success: true };
      }),

    // Get voter's current votes (no auth)
    getForVoter: publicProcedure
      .input(z.object({ sessionId: z.string(), voterName: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const votesResult = await db.execute(
          sql`SELECT meal_id, reaction FROM public_meal_votes 
           WHERE vote_session_id = ${input.sessionId} AND voter_name = ${input.voterName.trim()}`
        );

        const votes: Record<string, string> = {};
        votesResult.forEach((row: any) => {
          votes[row.meal_id] = row.reaction;
        });

        return { votes };
      }),
  }),
});

// Helper function to generate recipe details
async function generateRecipeDetails(meal: {
  name: string;
  description: string;
  tags: string[];
  prepTime: string;
  cookTime: string;
  difficulty: string;
}): Promise<{ ingredients: string[]; instructions: string[] }> {
  const recipeDetailsSchema = {
    name: "recipe_details",
    schema: {
      type: "object",
      properties: {
        ingredients: {
          type: "array",
          items: { type: "string" },
          description: "List of ingredients with quantities (e.g., '2 chicken breasts', '1 tbsp olive oil')"
        },
        instructions: {
          type: "array",
          items: { type: "string" },
          description: "Numbered cooking instructions (4-8 steps, short sentences)"
        }
      },
      required: ["ingredients", "instructions"],
      additionalProperties: false
    },
    strict: true
  };

  const prompt = `Generate detailed recipe instructions for this meal:

Meal Name: ${meal.name}
Description: ${meal.description}
Cuisine/Tags: ${meal.tags.join(", ")}
Prep Time: ${meal.prepTime}
Cook Time: ${meal.cookTime}
Difficulty: ${meal.difficulty}

Provide:
1. A complete list of ingredients with specific quantities (e.g., "2 chicken breasts", "1 tbsp olive oil")
2. Clear, numbered cooking instructions (4-8 steps)

Output as JSON with "ingredients" and "instructions" arrays.`;

  const aiResponse = await invokeLLM({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a helpful cooking assistant. Generate detailed recipe ingredients and instructions based on the meal information provided."
      },
      { role: "user", content: prompt }
    ],
    temperature: 0.5,
    max_tokens: 1500,
    outputSchema: recipeDetailsSchema,
  });

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
  return {
    ingredients: parsed.ingredients,
    instructions: parsed.instructions,
  };
}

export type AppRouter = typeof appRouter;
