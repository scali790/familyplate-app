import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { mealPlans, mealVotes, userPreferences, users, type Meal } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { sdk } from "./_core/sdk";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    simpleLogin: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          name: z.string().min(1),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Create a simple openId from email
        const openId = `simple-${input.email}`;

        // Upsert user
        await db
          .insert(users)
          .values({
            openId,
            email: input.email,
            name: input.name,
            loginMethod: "simple",
          })
          .onDuplicateKeyUpdate({
            set: {
              name: input.name,
              lastSignedIn: new Date(),
            },
          });

        // Get the user
        const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
        const user = result[0];

        if (!user) throw new Error("Failed to create user");

        // Create session token using SDK
        const sessionToken = await sdk.createSessionToken(openId, {
          name: input.name,
          expiresInMs: 365 * 24 * 60 * 60 * 1000, // 1 year
        });

        // Set cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: 365 * 24 * 60 * 60 * 1000,
        });

        return {
          success: true,
          user: {
            id: user.id,
            openId: user.openId,
            name: user.name,
            email: user.email,
            loginMethod: user.loginMethod,
            lastSignedIn: user.lastSignedIn,
          },
        };
      }),
  }),

  // EasyPlate meal planning routes
  mealPlanning: router({
    // Get user preferences
    getPreferences: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return null;
      
      const result = await db.select().from(userPreferences).where(eq(userPreferences.userId, ctx.user.id)).limit(1);
      const prefs = result[0] || null;
      
      if (!prefs) return null;
      
      return {
        ...prefs,
        cuisines: prefs.cuisines ? JSON.parse(prefs.cuisines) : [],
        flavors: prefs.flavors ? JSON.parse(prefs.flavors) : [],
      };
    }),

    // Save user preferences
    savePreferences: protectedProcedure
      .input(
        z.object({
          familySize: z.number().min(1).max(20),
          cuisines: z.array(z.string()).max(5),
          flavors: z.array(z.string()),
          dietaryRestrictions: z.string().optional(),
          country: z.string().optional(),
          // Food preference toggles
          includeMeat: z.boolean().optional(),
          includeChicken: z.boolean().optional(),
          includeFish: z.boolean().optional(),
          includeVegetarian: z.boolean().optional(),
          includeVegan: z.boolean().optional(),
          includeSpicy: z.boolean().optional(),
          includeKidFriendly: z.boolean().optional(),
          includeHealthy: z.boolean().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const existing = await db.select().from(userPreferences).where(eq(userPreferences.userId, ctx.user.id)).limit(1);
        
        if (existing[0]) {
          await db.update(userPreferences)
            .set({
              familySize: input.familySize,
              cuisines: JSON.stringify(input.cuisines),
              flavors: JSON.stringify(input.flavors),
              dietaryRestrictions: input.dietaryRestrictions || null,
              country: input.country || "UAE",
              includeMeat: input.includeMeat !== undefined ? (input.includeMeat ? 1 : 0) : 1,
              includeChicken: input.includeChicken !== undefined ? (input.includeChicken ? 1 : 0) : 1,
              includeFish: input.includeFish !== undefined ? (input.includeFish ? 1 : 0) : 1,
              includeVegetarian: input.includeVegetarian !== undefined ? (input.includeVegetarian ? 1 : 0) : 1,
              includeVegan: input.includeVegan !== undefined ? (input.includeVegan ? 1 : 0) : 1,
              includeSpicy: input.includeSpicy !== undefined ? (input.includeSpicy ? 1 : 0) : 1,
              includeKidFriendly: input.includeKidFriendly !== undefined ? (input.includeKidFriendly ? 1 : 0) : 1,
              includeHealthy: input.includeHealthy !== undefined ? (input.includeHealthy ? 1 : 0) : 1,
              updatedAt: new Date(),
            })
            .where(eq(userPreferences.id, existing[0].id));
          return { success: true };
        } else {
          await db.insert(userPreferences).values({
            userId: ctx.user.id,
            familySize: input.familySize,
            cuisines: JSON.stringify(input.cuisines),
            flavors: JSON.stringify(input.flavors),
            dietaryRestrictions: input.dietaryRestrictions || null,
            country: input.country || "UAE",
            includeMeat: input.includeMeat !== undefined ? (input.includeMeat ? 1 : 0) : 1,
            includeChicken: input.includeChicken !== undefined ? (input.includeChicken ? 1 : 0) : 1,
            includeFish: input.includeFish !== undefined ? (input.includeFish ? 1 : 0) : 1,
            includeVegetarian: input.includeVegetarian !== undefined ? (input.includeVegetarian ? 1 : 0) : 1,
            includeVegan: input.includeVegan !== undefined ? (input.includeVegan ? 1 : 0) : 1,
            includeSpicy: input.includeSpicy !== undefined ? (input.includeSpicy ? 1 : 0) : 1,
            includeKidFriendly: input.includeKidFriendly !== undefined ? (input.includeKidFriendly ? 1 : 0) : 1,
            includeHealthy: input.includeHealthy !== undefined ? (input.includeHealthy ? 1 : 0) : 1,
          });
          return { success: true };
        }
      }),

    // Generate meal plan using AI
    generatePlan: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const prefsResult = await db.select().from(userPreferences).where(eq(userPreferences.userId, ctx.user.id)).limit(1);
      const prefs = prefsResult[0];
      
      if (!prefs) {
        throw new Error("Please complete onboarding first");
      }
      
      const cuisines = prefs.cuisines ? JSON.parse(prefs.cuisines) : [];
      const flavors = prefs.flavors ? JSON.parse(prefs.flavors) : [];
      
      // Build food exclusions list based on user preferences
      const exclusions: string[] = [];
      if (!prefs.includeMeat) exclusions.push("red meat (beef, pork, lamb)");
      if (!prefs.includeChicken) exclusions.push("chicken and poultry");
      if (!prefs.includeFish) exclusions.push("fish and seafood");
      if (!prefs.includeVegetarian) exclusions.push("vegetarian-only meals");
      if (!prefs.includeVegan) exclusions.push("vegan-only meals");
      if (!prefs.includeSpicy) exclusions.push("spicy dishes");
      if (!prefs.includeKidFriendly) exclusions.push("kid-friendly specific meals");
      if (!prefs.includeHealthy) exclusions.push("explicitly healthy/light meals");
      
      const exclusionText = exclusions.length > 0 
        ? `\n- EXCLUDE these categories: ${exclusions.join(", ")}`
        : "";
      
      const prompt = `Generate a 7-day meal plan for a family of ${prefs.familySize}.

Preferences:
- Cuisines: ${cuisines.join(", ") || "Any"}
- Flavors: ${flavors.join(", ") || "Balanced"}
- Dietary restrictions: ${prefs.dietaryRestrictions || "None"}${exclusionText}

Return a JSON object with a "meals" array containing exactly 7 meal objects with these fields:
- day: string (Monday through Sunday)
- name: string
- description: string (1-2 sentences)
- prepTime: string (e.g. "30 mins")
- cookTime: string (e.g. "45 mins")
- difficulty: string (Easy, Medium, or Hard)
- ingredients: array of strings (list all ingredients with quantities)
- instructions: array of strings (step-by-step cooking instructions)
- tags: array of strings (categorize each recipe with relevant tags from: meat, beef, pork, lamb, chicken, poultry, turkey, fish, seafood, shrimp, salmon, vegetarian, vegan, pasta, soup, stew, salad, breakfast, dessert, spicy, healthy, light, kid-friendly, vegetables, fruits)

IMPORTANT: For tags, analyze each recipe and add 2-4 relevant tags. For example:
- A chicken curry would have tags: ["chicken", "spicy"]
- A salmon pasta would have tags: ["fish", "pasta", "healthy"]
- A vegetable soup would have tags: ["vegetarian", "soup", "vegetables", "healthy"]`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a meal planning assistant. Return only valid JSON." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      });
      
      const content = typeof response.choices[0]?.message?.content === 'string' 
        ? response.choices[0].message.content 
        : "{}";
      const parsed = JSON.parse(content);
      const meals: Meal[] = (Array.isArray(parsed) ? parsed : parsed.meals || []).map((m: any) => ({
        ...m,
        tags: m.tags || [],
        upvotes: 0,
        downvotes: 0,
      }));
      
      if (meals.length !== 7) {
        throw new Error("Failed to generate 7 meals");
      }
      
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diff);
      const weekStartDate = monday.toISOString().split("T")[0];
      
      await db.insert(mealPlans).values({
        userId: ctx.user.id,
        weekStartDate,
        meals: JSON.stringify(meals),
      });
      
      return { success: true, meals, weekStartDate };
    }),

    // Get current meal plan
    getCurrentPlan: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return null;
      
      const planResult = await db.select().from(mealPlans)
        .where(eq(mealPlans.userId, ctx.user.id))
        .orderBy(desc(mealPlans.createdAt))
        .limit(1);
      const plan = planResult[0];
      
      if (!plan) return null;
      
      const meals: Meal[] = JSON.parse(plan.meals);
      const votes = await db.select().from(mealVotes).where(eq(mealVotes.mealPlanId, plan.id));
      
      const votesByDay: Record<string, { upvotes: number; downvotes: number }> = {};
      votes.forEach(vote => {
        if (!votesByDay[vote.mealDay]) {
          votesByDay[vote.mealDay] = { upvotes: 0, downvotes: 0 };
        }
        if (vote.voteType === "up") {
          votesByDay[vote.mealDay].upvotes++;
        } else {
          votesByDay[vote.mealDay].downvotes++;
        }
      });
      
      const mealsWithVotes = meals.map(meal => ({
        ...meal,
        upvotes: votesByDay[meal.day]?.upvotes || 0,
        downvotes: votesByDay[meal.day]?.downvotes || 0,
      }));
      
      return {
        id: plan.id,
        weekStartDate: plan.weekStartDate,
        meals: mealsWithVotes,
      };
    }),

    // Vote on a meal
    vote: protectedProcedure
      .input(
        z.object({
          mealPlanId: z.number(),
          mealDay: z.string(),
          voteType: z.enum(["up", "down"]),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const existingVote = await db.select().from(mealVotes)
          .where(
            and(
              eq(mealVotes.mealPlanId, input.mealPlanId),
              eq(mealVotes.mealDay, input.mealDay),
              eq(mealVotes.userId, ctx.user.id),
            )
          )
          .limit(1);
        
        if (existingVote[0]) {
          await db.update(mealVotes)
            .set({ voteType: input.voteType })
            .where(eq(mealVotes.id, existingVote[0].id));
        } else {
          await db.insert(mealVotes).values({
            mealPlanId: input.mealPlanId,
            mealDay: input.mealDay,
            userId: ctx.user.id,
            voteType: input.voteType,
          });
        }
        
        return { success: true };
      }),

    // Get shared meal plan (public, no auth required)
    getSharedPlan: publicProcedure
      .input(z.object({ planId: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;
        
        const planId = parseInt(input.planId);
        if (isNaN(planId)) return null;
        
        const planResult = await db.select().from(mealPlans).where(eq(mealPlans.id, planId)).limit(1);
        const plan = planResult[0];
        if (!plan) return null;
        
        const meals = JSON.parse(plan.meals);
        const votes = await db.select().from(mealVotes).where(eq(mealVotes.mealPlanId, plan.id));
        
        const votesByDay: Record<string, { upvotes: number; downvotes: number }> = {};
        votes.forEach(vote => {
          if (!votesByDay[vote.mealDay]) {
            votesByDay[vote.mealDay] = { upvotes: 0, downvotes: 0 };
          }
          if (vote.voteType === "up") {
            votesByDay[vote.mealDay].upvotes++;
          } else {
            votesByDay[vote.mealDay].downvotes++;
          }
        });
        
        const mealsWithVotes = meals.map((meal: any) => ({
          ...meal,
          upvotes: votesByDay[meal.day]?.upvotes || 0,
          downvotes: votesByDay[meal.day]?.downvotes || 0,
        }));
        
        return {
          id: plan.id,
          weekStartDate: plan.weekStartDate,
          meals: mealsWithVotes,
        };
      }),

    // Vote on shared meal plan (public, no auth required)
    voteShared: publicProcedure
      .input(
        z.object({
          mealPlanId: z.number(),
          mealDay: z.string(),
          voteType: z.enum(["up", "down"]),
          voterName: z.string(),
        }),
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // For shared voting, we use voterName as a pseudo-userId
        // We'll store it as a negative number hash to distinguish from real user IDs
        const voterHash = -Math.abs(input.voterName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
        
        const existingVote = await db.select().from(mealVotes)
          .where(
            and(
              eq(mealVotes.mealPlanId, input.mealPlanId),
              eq(mealVotes.mealDay, input.mealDay),
              eq(mealVotes.userId, voterHash),
            )
          )
          .limit(1);
        
        if (existingVote[0]) {
          await db.update(mealVotes)
            .set({ voteType: input.voteType })
            .where(eq(mealVotes.id, existingVote[0].id));
        } else {
          await db.insert(mealVotes).values({
            mealPlanId: input.mealPlanId,
            mealDay: input.mealDay,
            userId: voterHash,
            voteType: input.voteType,
          });
        }
        
        return { success: true };
      }),

    // Regenerate a single meal in a meal plan
    regenerateMeal: protectedProcedure
      .input(
        z.object({
          mealPlanId: z.number(),
          dayIndex: z.number(), // 0-6 for Monday-Sunday
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Get existing meal plan
        const planResult = await db.select().from(mealPlans).where(eq(mealPlans.id, input.mealPlanId)).limit(1);
        const plan = planResult[0];
        if (!plan) throw new Error("Meal plan not found");
        
        // Get user preferences
        const prefsResult = await db.select().from(userPreferences).where(eq(userPreferences.userId, ctx.user.id)).limit(1);
        const prefs = prefsResult[0];
        
        if (!prefs) {
          throw new Error("Please set your preferences first");
        }
        
        const cuisines = prefs.cuisines ? JSON.parse(prefs.cuisines) : [];
        const flavors = prefs.flavors ? JSON.parse(prefs.flavors) : [];
        
        // Build food exclusions list based on user preferences
        const exclusions: string[] = [];
        if (!prefs.includeMeat) exclusions.push("red meat (beef, pork, lamb)");
        if (!prefs.includeChicken) exclusions.push("chicken and poultry");
        if (!prefs.includeFish) exclusions.push("fish and seafood");
        if (!prefs.includeVegetarian) exclusions.push("vegetarian-only meals");
        if (!prefs.includeVegan) exclusions.push("vegan-only meals");
        if (!prefs.includeSpicy) exclusions.push("spicy dishes");
        if (!prefs.includeKidFriendly) exclusions.push("kid-friendly specific meals");
        if (!prefs.includeHealthy) exclusions.push("explicitly healthy/light meals");
        
        const exclusionText = exclusions.length > 0 
          ? `\n- EXCLUDE these categories: ${exclusions.join(", ")}`
          : "";
        
        // Parse existing meals
        const meals: Meal[] = JSON.parse(plan.meals);
        const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        const dayName = dayNames[input.dayIndex];
        
        // Generate a single new meal
        const prompt = `Generate 1 dinner recipe for ${dayName} for a family of ${prefs.familySize}.

Preferences:
- Cuisines: ${cuisines.join(", ") || "Any"}
- Flavor profiles: ${flavors.join(", ") || "Any"}
- Dietary restrictions: ${prefs.dietaryRestrictions || "None"}${exclusionText}

IMPORTANT:
- Generate a DIFFERENT meal from the existing ones in the week
- Return a JSON object with this structure:
{
  "meal": {
    "day": "${dayName}",
    "name": "Recipe Name",
    "description": "Brief description (2-3 sentences)",
    "prepTime": "X mins",
    "cookTime": "X mins" or "X hour(s) Y mins",
    "difficulty": "Easy" or "Medium" or "Hard",
    "ingredients": ["ingredient 1", "ingredient 2", ...],
    "instructions": ["step 1", "step 2", ...],
    "tags": ["tag1", "tag2", ...] (categorize with 2-4 relevant tags from: meat, beef, pork, lamb, chicken, poultry, turkey, fish, seafood, shrimp, salmon, vegetarian, vegan, pasta, soup, stew, salad, breakfast, dessert, spicy, healthy, light, kid-friendly, vegetables, fruits)
  }
}

Return ONLY the JSON object, no markdown formatting, no code blocks, no explanations.`;
        
        const aiResponse = await invokeLLM({
          messages: [
            { role: "user", content: prompt },
          ],
        });
        
        const content = aiResponse.choices[0]?.message?.content || "{}";
        let result;
        try {
          // Handle multimodal content (extract text if array)
          const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
          // Remove markdown code blocks if present
          const jsonStr = contentStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          result = JSON.parse(jsonStr);
        } catch (e) {
          console.error("Failed to parse AI response:", content);
          throw new Error("Failed to generate meal");
        }
        
        // Replace the meal at the specified day index
        meals[input.dayIndex] = {
          ...result.meal,
          tags: result.meal.tags || [],
        };
        
        // Update meal plan in database
        await db.update(mealPlans)
          .set({ meals: JSON.stringify(meals) })
          .where(eq(mealPlans.id, input.mealPlanId));
        
        return {
          success: true,
          meal: result.meal,
        };
      }),

    // Generate shopping list from meal plan
    generateShoppingList: protectedProcedure
      .input(
        z.object({
          mealPlanId: z.number(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Get meal plan
        const planResult = await db.select().from(mealPlans).where(eq(mealPlans.id, input.mealPlanId)).limit(1);
        const plan = planResult[0];
        if (!plan) throw new Error("Meal plan not found");
        
        // Get user preferences for country
        const prefsResult = await db.select().from(userPreferences).where(eq(userPreferences.userId, ctx.user.id)).limit(1);
        const prefs = prefsResult[0];
        const country = prefs?.country || "UAE";
        
        // Parse meals
        const meals: Meal[] = JSON.parse(plan.meals);
        
        // Extract all ingredients
        const allIngredients = meals.flatMap(meal => meal.ingredients);
        
        // Calculate week end date (6 days after start)
        const startDate = new Date(plan.weekStartDate);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        
        // Format dates
        const formatDate = (date: Date) => {
          const month = date.toLocaleString('en-US', { month: 'short' });
          const day = date.getDate();
          return `${month} ${day}`;
        };
        
        const weekRange = `${formatDate(startDate)} - ${formatDate(endDate)}`;
        
        // Use AI to consolidate, localize, and categorize ingredients
        const prompt = `You are a shopping list assistant. Given a list of ingredients from a weekly meal plan, your task is to:

1. Consolidate duplicate ingredients (e.g., "2 onions" + "1 onion" = "3 onions")
2. Localize ingredients for ${country} (adjust units to metric/imperial based on country, suggest local brands/products)
3. Group ingredients into categories: Produce, Dairy & Eggs, Meat & Seafood, Pantry & Spices, Other
4. Use simple, searchable ingredient names (e.g., "Tomatoes" not "Fresh UAE tomatoes", "Chicken Breast" not "Boneless skinless chicken breast")

Ingredients:
${allIngredients.map((ing, i) => `${i + 1}. ${ing}`).join('\n')}

Return a JSON object with this structure:
{
  "categories": [
    {
      "name": "Produce",
      "items": [
        {
          "name": "Tomatoes",
          "quantity": "2 kg",
          "localNote": "Fresh UAE tomatoes",
          "estimatedPrice": "AED 8-12"
        }
      ]
    }
  ]
}

IMPORTANT: 
- Keep ingredient "name" field simple and searchable (1-2 words max)
- Use "localNote" for additional details
- DO NOT include storeLinks in the response
- Return ONLY the JSON object, no markdown formatting, no code blocks, no explanations.`;
        
        const aiResponse = await invokeLLM({
          messages: [
            { role: "user", content: prompt },
          ],
        });
        
        const content = aiResponse.choices[0]?.message?.content || "{}";
        let shoppingList;
        try {
          // Handle multimodal content (extract text if array)
          const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
          // Remove markdown code blocks if present
          const jsonStr = contentStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          shoppingList = JSON.parse(jsonStr);
        } catch (e) {
          console.error("Failed to parse AI response:", content);
          throw new Error("Failed to generate shopping list");
        }
        
        return {
          success: true,
          shoppingList,
          country,
          weekRange,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
