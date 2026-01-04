import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { mealPlans, mealVotes, userPreferences, users, magicLinkTokens, dishVotes, type Meal } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { randomBytes } from "crypto";
import { sendMagicLinkEmail } from "./_core/mailjet";
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
          sessionToken, // Return token so frontend can store it
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
    
    // Request magic link
    requestMagicLink: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          name: z.string().min(1).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Generate secure random token
        const token = randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Store token in database
        await db.insert(magicLinkTokens).values({
          token,
          email: input.email,
          name: input.name || null,
          expiresAt,
        });

        // Generate magic link URL
        // Always use HTTPS URLs for email links (clickable in all email clients)
        // The /auth/verify page will automatically try to open the app on mobile
        const baseUrl = process.env.EXPO_PUBLIC_WEB_URL || ctx.req.headers.origin || `https://${ctx.req.headers.host}`;
        const magicLink = `${baseUrl}/auth/verify?token=${token}`;

         // Send magic link via Mailjet
        console.log("============================" );
        console.log("Magic Link Generated:");
        console.log("Email:", input.email);
        console.log("Link:", magicLink);
        console.log("Expires:", expiresAt.toISOString());
        console.log("============================");
        
        const emailSent = await sendMagicLinkEmail(
          input.email,
          input.name || null,
          magicLink,
          15
        );

        if (!emailSent) {
          console.error("[requestMagicLink] Failed to send email via Mailjet");
          console.log("[requestMagicLink] Magic link available in console logs above");
          // Don't throw error - allow user to get link from console in development
          // throw new Error("Failed to send magic link email");
        }
        
        console.log(`[Auth] Magic link sent to ${input.email}, expires at ${expiresAt.toISOString()}`);

        return {
          success: true,
          message: `Magic link sent to ${input.email}. Check your inbox!`,
        };
      }),
    
    // Verify magic link token
    verifyMagicLink: publicProcedure
      .input(
        z.object({
          token: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Find token in database
        const result = await db
          .select()
          .from(magicLinkTokens)
          .where(eq(magicLinkTokens.token, input.token))
          .limit(1);
        
        const tokenRecord = result[0];

        if (!tokenRecord) {
          throw new Error("Invalid or expired magic link");
        }

        // Check if token is expired
        if (new Date() > tokenRecord.expiresAt) {
          throw new Error("Magic link has expired");
        }

        // Check if token has been used
        if (tokenRecord.used === 1) {
          throw new Error("Magic link has already been used");
        }

        // Mark token as used
        await db
          .update(magicLinkTokens)
          .set({ used: 1 })
          .where(eq(magicLinkTokens.id, tokenRecord.id));

        // Create or get user
        const openId = `magic-${tokenRecord.email}`;
        await db
          .insert(users)
          .values({
            openId,
            email: tokenRecord.email,
            name: tokenRecord.name || tokenRecord.email.split("@")[0],
            loginMethod: "magic-link",
          })
          .onDuplicateKeyUpdate({
            set: {
              lastSignedIn: new Date(),
            },
          });

        // Get the user
        const userResult = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
        const user = userResult[0];

        if (!user) throw new Error("Failed to create user");

        // Create session token using SDK
        const sessionToken = await sdk.createSessionToken(openId, {
          name: user.name || "",
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
          sessionToken,
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

  // FamilyPlate meal planning routes
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
          familyName: z.string().optional(),
          familySize: z.number().min(1).max(20),
          cuisines: z.array(z.string()).max(5),
          flavors: z.array(z.string()),
          dietaryRestrictions: z.string().optional(),
          country: z.string().optional(),
          // Food preference frequencies (0-4)
          meatFrequency: z.number().min(0).max(4).optional(),
          chickenFrequency: z.number().min(0).max(4).optional(),
          fishFrequency: z.number().min(0).max(4).optional(),
          vegetarianFrequency: z.number().min(0).max(4).optional(),
          veganFrequency: z.number().min(0).max(4).optional(),
          spicyFrequency: z.number().min(0).max(4).optional(),
          kidFriendlyFrequency: z.number().min(0).max(4).optional(),
          healthyFrequency: z.number().min(0).max(4).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const existing = await db.select().from(userPreferences).where(eq(userPreferences.userId, ctx.user.id)).limit(1);
        
        if (existing[0]) {
          await db.update(userPreferences)
            .set({
              familyName: input.familyName || null,
              familySize: input.familySize,
              cuisines: JSON.stringify(input.cuisines),
              flavors: JSON.stringify(input.flavors),
              dietaryRestrictions: input.dietaryRestrictions || null,
              country: input.country || "UAE",
              meatFrequency: input.meatFrequency !== undefined ? input.meatFrequency : 3,
              chickenFrequency: input.chickenFrequency !== undefined ? input.chickenFrequency : 3,
              fishFrequency: input.fishFrequency !== undefined ? input.fishFrequency : 3,
              vegetarianFrequency: input.vegetarianFrequency !== undefined ? input.vegetarianFrequency : 2,
              veganFrequency: input.veganFrequency !== undefined ? input.veganFrequency : 1,
              spicyFrequency: input.spicyFrequency !== undefined ? input.spicyFrequency : 2,
              kidFriendlyFrequency: input.kidFriendlyFrequency !== undefined ? input.kidFriendlyFrequency : 2,
              healthyFrequency: input.healthyFrequency !== undefined ? input.healthyFrequency : 3,
              updatedAt: new Date(),
            })
            .where(eq(userPreferences.id, existing[0].id));
          return { success: true };
        } else {
          await db.insert(userPreferences).values({
            userId: ctx.user.id,
            familyName: input.familyName || null,
            familySize: input.familySize,
            cuisines: JSON.stringify(input.cuisines),
            flavors: JSON.stringify(input.flavors),
            dietaryRestrictions: input.dietaryRestrictions || null,
            country: input.country || "UAE",
            meatFrequency: input.meatFrequency !== undefined ? input.meatFrequency : 3,
            chickenFrequency: input.chickenFrequency !== undefined ? input.chickenFrequency : 3,
            fishFrequency: input.fishFrequency !== undefined ? input.fishFrequency : 3,
            vegetarianFrequency: input.vegetarianFrequency !== undefined ? input.vegetarianFrequency : 2,
            veganFrequency: input.veganFrequency !== undefined ? input.veganFrequency : 1,
            spicyFrequency: input.spicyFrequency !== undefined ? input.spicyFrequency : 2,
            kidFriendlyFrequency: input.kidFriendlyFrequency !== undefined ? input.kidFriendlyFrequency : 2,
            healthyFrequency: input.healthyFrequency !== undefined ? input.healthyFrequency : 3,
          });
          return { success: true };
        }
      }),

    // Generate meal plan using AI
    generatePlan: protectedProcedure
      .input(z.object({ weekStartDate: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const prefsResult = await db.select().from(userPreferences).where(eq(userPreferences.userId, ctx.user.id)).limit(1);
      const prefs = prefsResult[0];
      
      if (!prefs) {
        throw new Error("Please complete onboarding first");
      }
      
      const cuisines = prefs.cuisines ? JSON.parse(prefs.cuisines) : [];
      const flavors = prefs.flavors ? JSON.parse(prefs.flavors) : [];
      
      // Build food frequency preferences (0=Never, 1=Rarely, 2=Sometimes, 3=Often, 4=Always)
      const frequencyMap: Record<number, string> = {
        0: "never",
        1: "rarely",
        2: "sometimes",
        3: "often",
        4: "always",
      };
      
      const preferences: string[] = [];
      if (prefs.meatFrequency !== undefined && prefs.meatFrequency !== 3) {
        preferences.push(`red meat (beef, pork, lamb): ${frequencyMap[prefs.meatFrequency]}`);
      }
      if (prefs.chickenFrequency !== undefined && prefs.chickenFrequency !== 3) {
        preferences.push(`chicken and poultry: ${frequencyMap[prefs.chickenFrequency]}`);
      }
      if (prefs.fishFrequency !== undefined && prefs.fishFrequency !== 3) {
        preferences.push(`fish and seafood: ${frequencyMap[prefs.fishFrequency]}`);
      }
      if (prefs.vegetarianFrequency !== undefined && prefs.vegetarianFrequency > 2) {
        preferences.push(`vegetarian meals: ${frequencyMap[prefs.vegetarianFrequency]}`);
      }
      if (prefs.veganFrequency !== undefined && prefs.veganFrequency > 1) {
        preferences.push(`vegan meals: ${frequencyMap[prefs.veganFrequency]}`);
      }
      if (prefs.spicyFrequency !== undefined && prefs.spicyFrequency !== 2) {
        preferences.push(`spicy dishes: ${frequencyMap[prefs.spicyFrequency]}`);
      }
      if (prefs.kidFriendlyFrequency !== undefined && prefs.kidFriendlyFrequency > 2) {
        preferences.push(`kid-friendly meals: ${frequencyMap[prefs.kidFriendlyFrequency]}`);
      }
      if (prefs.healthyFrequency !== undefined && prefs.healthyFrequency !== 3) {
        preferences.push(`healthy/light meals: ${frequencyMap[prefs.healthyFrequency]}`);
      }
      
      const frequencyText = preferences.length > 0 
        ? `\n- Food frequency preferences: ${preferences.join(", ")}`
        : "";
      
      // Fetch dish votes for taste signals
      const dishVotesResult = await db.select().from(dishVotes)
        .where(eq(dishVotes.userId, ctx.user.id))
        .orderBy(desc(dishVotes.createdAt))
        .limit(50); // Get last 50 votes
      
      const likedDishes = dishVotesResult.filter(v => v.liked).map(v => v.dishName);
      const dislikedDishes = dishVotesResult.filter(v => !v.liked).map(v => v.dishName);
      
      // Parse taste profile if available
      let tasteProfile: any = null;
      if (prefs.tasteProfile) {
        try {
          tasteProfile = JSON.parse(prefs.tasteProfile);
        } catch (e) {
          console.error("Failed to parse taste profile", e);
        }
      }
      
      // Fetch last 4 weeks of meal history to avoid repeats
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
      const historyResult = await db.select().from(mealPlans)
        .where(and(
          eq(mealPlans.userId, ctx.user.id),
          // Only get recent plans
        ))
        .orderBy(desc(mealPlans.createdAt))
        .limit(4);
      
      const recentMealNames: string[] = [];
      historyResult.forEach(plan => {
        const meals: Meal[] = JSON.parse(plan.meals);
        meals.forEach(meal => recentMealNames.push(meal.name));
      });
      
      // Build taste signals text for prompt
      let tasteSignalsText = "";
      
      if (likedDishes.length > 0) {
        tasteSignalsText += `\n- User likes these dishes: ${likedDishes.slice(0, 10).join(", ")}`;
      }
      
      if (dislikedDishes.length > 0) {
        tasteSignalsText += `\n- User dislikes these dishes: ${dislikedDishes.slice(0, 10).join(", ")}`;
      }
      
      if (tasteProfile) {
        if (tasteProfile.cuisineWeights && Object.keys(tasteProfile.cuisineWeights).length > 0) {
          const topCuisines = Object.entries(tasteProfile.cuisineWeights)
            .sort(([,a]: any, [,b]: any) => b - a)
            .slice(0, 5)
            .map(([cuisine, weight]) => `${cuisine} (${((weight as number) * 100).toFixed(0)}%)`);
          if (topCuisines.length > 0) {
            tasteSignalsText += `\n- Preferred cuisines: ${topCuisines.join(", ")}`;
          }
        }
        
        if (tasteProfile.proteinWeights && Object.keys(tasteProfile.proteinWeights).length > 0) {
          const topProteins = Object.entries(tasteProfile.proteinWeights)
            .sort(([,a]: any, [,b]: any) => b - a)
            .slice(0, 5)
            .map(([protein, weight]) => `${protein} (${((weight as number) * 100).toFixed(0)}%)`);
          if (topProteins.length > 0) {
            tasteSignalsText += `\n- Preferred proteins: ${topProteins.join(", ")}`;
          }
        }
        
        if (tasteProfile.spiceLevelPreference !== undefined) {
          const spiceLevels = ["mild", "mild-medium", "medium", "medium-hot", "hot"];
          tasteSignalsText += `\n- Spice preference: ${spiceLevels[Math.min(4, Math.max(0, tasteProfile.spiceLevelPreference))]}`;
        }
      }
      
      let avoidRepeatsText = "";
      if (recentMealNames.length > 0) {
        avoidRepeatsText = `\n\nIMPORTANT: Avoid repeating these recently generated meals: ${recentMealNames.join(", ")}`;
      }
      
      const prompt = `Generate a 7-day DINNER meal plan for a family of ${prefs.familySize}.

IMPORTANT: Generate ONLY complete main course meals suitable for dinner. DO NOT include:
- Desserts (cookies, cakes, pastries, sweet treats)
- Snacks or appetizers
- Breakfast items
- Side dishes only

Each meal must be a substantial, complete dinner with protein and vegetables.

Preferences:
- Cuisines: ${cuisines.join(", ") || "Any"}
- Flavors: ${flavors.join(", ") || "Balanced"}
- Dietary restrictions: ${prefs.dietaryRestrictions || "None"}${frequencyText}${tasteSignalsText}${avoidRepeatsText}

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
      
      // Use provided weekStartDate or calculate default
      let weekStartDate: string;
      if (input.weekStartDate) {
        weekStartDate = input.weekStartDate;
      } else {
        // Default: calculate current week's Monday
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(now);
        monday.setDate(now.getDate() + diff);
        weekStartDate = monday.toISOString().split("T")[0];
      }
      
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
      
      const votesByDay: Record<string, { upvotes: number; downvotes: number; voters: Array<{ name: string; vote: string }> }> = {};
      votes.forEach(vote => {
        if (!votesByDay[vote.mealDay]) {
          votesByDay[vote.mealDay] = { upvotes: 0, downvotes: 0, voters: [] };
        }
        if (vote.voteType === "up") {
          votesByDay[vote.mealDay].upvotes++;
        } else {
          votesByDay[vote.mealDay].downvotes++;
        }
        // Add voter details if voterName exists (shared voting)
        if (vote.voterName) {
          votesByDay[vote.mealDay].voters.push({
            name: vote.voterName,
            vote: vote.voteType === "up" ? "👍" : "👎"
          });
        }
      });
      
      const mealsWithVotes = meals.map(meal => ({
        ...meal,
        upvotes: votesByDay[meal.day]?.upvotes || 0,
        downvotes: votesByDay[meal.day]?.downvotes || 0,
        voters: votesByDay[meal.day]?.voters || [],
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
        
        // Get user preferences to fetch family name
        const prefsResult = await db.select().from(userPreferences).where(eq(userPreferences.userId, plan.userId)).limit(1);
        const prefs = prefsResult[0];
        
        const meals = JSON.parse(plan.meals);
        const votes = await db.select().from(mealVotes).where(eq(mealVotes.mealPlanId, plan.id));
        
        const votesByDay: Record<string, { upvotes: number; downvotes: number; voters: Array<{ name: string; vote: string }> }> = {};
        votes.forEach(vote => {
          if (!votesByDay[vote.mealDay]) {
            votesByDay[vote.mealDay] = { upvotes: 0, downvotes: 0, voters: [] };
          }
          if (vote.voteType === "up") {
            votesByDay[vote.mealDay].upvotes++;
          } else {
            votesByDay[vote.mealDay].downvotes++;
          }
          // Add voter details if voterName exists
          if (vote.voterName) {
            votesByDay[vote.mealDay].voters.push({
              name: vote.voterName,
              vote: vote.voteType === "up" ? "👍" : "👎"
            });
          }
        });
        
        const mealsWithVotes = meals.map((meal: any) => ({
          ...meal,
          upvotes: votesByDay[meal.day]?.upvotes || 0,
          downvotes: votesByDay[meal.day]?.downvotes || 0,
          voters: votesByDay[meal.day]?.voters || [],
        }));
        
        return {
          id: plan.id,
          weekStartDate: plan.weekStartDate,
          meals: mealsWithVotes,
          familyName: prefs?.familyName || null,
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
            .set({ 
              voteType: input.voteType,
              voterName: input.voterName,
            })
            .where(eq(mealVotes.id, existingVote[0].id));
        } else {
          await db.insert(mealVotes).values({
            mealPlanId: input.mealPlanId,
            mealDay: input.mealDay,
            userId: voterHash,
            voterName: input.voterName,
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
        
        // Build food frequency preferences (0=Never, 1=Rarely, 2=Sometimes, 3=Often, 4=Always)
        const frequencyMap: Record<number, string> = {
          0: "never",
          1: "rarely",
          2: "sometimes",
          3: "often",
          4: "always",
        };
        
        const preferences: string[] = [];
        if (prefs.meatFrequency !== undefined && prefs.meatFrequency !== 3) {
          preferences.push(`red meat (beef, pork, lamb): ${frequencyMap[prefs.meatFrequency]}`);
        }
        if (prefs.chickenFrequency !== undefined && prefs.chickenFrequency !== 3) {
          preferences.push(`chicken and poultry: ${frequencyMap[prefs.chickenFrequency]}`);
        }
        if (prefs.fishFrequency !== undefined && prefs.fishFrequency !== 3) {
          preferences.push(`fish and seafood: ${frequencyMap[prefs.fishFrequency]}`);
        }
        if (prefs.vegetarianFrequency !== undefined && prefs.vegetarianFrequency > 2) {
          preferences.push(`vegetarian meals: ${frequencyMap[prefs.vegetarianFrequency]}`);
        }
        if (prefs.veganFrequency !== undefined && prefs.veganFrequency > 1) {
          preferences.push(`vegan meals: ${frequencyMap[prefs.veganFrequency]}`);
        }
        if (prefs.spicyFrequency !== undefined && prefs.spicyFrequency !== 2) {
          preferences.push(`spicy dishes: ${frequencyMap[prefs.spicyFrequency]}`);
        }
        if (prefs.kidFriendlyFrequency !== undefined && prefs.kidFriendlyFrequency > 2) {
          preferences.push(`kid-friendly meals: ${frequencyMap[prefs.kidFriendlyFrequency]}`);
        }
        if (prefs.healthyFrequency !== undefined && prefs.healthyFrequency !== 3) {
          preferences.push(`healthy/light meals: ${frequencyMap[prefs.healthyFrequency]}`);
        }
        
        const frequencyText = preferences.length > 0 
          ? `\n- Food frequency preferences: ${preferences.join(", ")}`
          : "";
        
        // Parse existing meals
        const meals: Meal[] = JSON.parse(plan.meals);
        const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        const dayName = dayNames[input.dayIndex];
        
        // Get list of existing meal names to avoid duplicates
        const existingMealNames = meals
          .filter((_, idx) => idx !== input.dayIndex) // Exclude the meal being replaced
          .map(m => m.name)
          .join(", ");
        
        // Generate a single new meal
        const prompt = `Generate 1 dinner recipe for ${dayName} for a family of ${prefs.familySize}.

Preferences:
- Cuisines: ${cuisines.join(", ") || "Any"}
- Flavor profiles: ${flavors.join(", ") || "Any"}
- Dietary restrictions: ${prefs.dietaryRestrictions || "None"}${frequencyText}

IMPORTANT:
- Generate a COMPLETELY DIFFERENT meal from these existing meals in the week: ${existingMealNames}
- DO NOT generate any variation or similar version of the existing meals
- Choose a different protein, cooking method, and cuisine style
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
  
  // Dish votes for personalization
  dishVotes: router({
    save: protectedProcedure
      .input(
        z.object({
          dishName: z.string().min(1).max(255),
          liked: z.boolean(),
          context: z.enum(["onboarding", "meal_plan", "regenerate"]).default("meal_plan"),
          metadata: z.object({
            cuisine: z.string().optional(),
            protein: z.string().optional(),
            spice_level: z.enum(["low", "medium", "high"]).optional(),
            cooking_time: z.string().optional(),
            difficulty: z.enum(["Easy", "Medium", "Hard"]).optional(),
          }).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { dishVoteService } = await import("./services/DishVoteService");
        
        if (!ctx.user) throw new Error("Not authenticated");
        
        const result = await dishVoteService.saveDishVote({
          userId: ctx.user.id,
          dishName: input.dishName,
          liked: input.liked,
          context: input.context,
          metadata: input.metadata,
        });
        
        return result;
      }),
      
    getAll: protectedProcedure
      .input(
        z.object({
          context: z.enum(["onboarding", "meal_plan", "regenerate"]).optional(),
          limit: z.number().int().positive().max(100).optional(),
          offset: z.number().int().nonnegative().optional(),
        }).optional()
      )
      .query(async ({ ctx, input }) => {
        const { dishVoteService } = await import("./services/DishVoteService");
        
        if (!ctx.user) throw new Error("Not authenticated");
        
        const votes = await dishVoteService.getDishVotes(ctx.user.id, input || {});
        return votes;
      }),
      
    getStats: protectedProcedure
      .query(async ({ ctx }) => {
        const { dishVoteService } = await import("./services/DishVoteService");
        
        if (!ctx.user) throw new Error("Not authenticated");
        
        const stats = await dishVoteService.getVoteStats(ctx.user.id);
        return stats;
      }),
      
    getTasteProfile: protectedProcedure
      .query(async ({ ctx }) => {
        const { dishVoteService } = await import("./services/DishVoteService");
        
        if (!ctx.user) throw new Error("Not authenticated");
        
        const profile = await dishVoteService.getTasteProfile(ctx.user.id);
        return profile;
      }),
      
    computeTasteProfile: protectedProcedure
      .mutation(async ({ ctx }) => {
        const { dishVoteService } = await import("./services/DishVoteService");
        
        if (!ctx.user) throw new Error("Not authenticated");
        
        const profile = await dishVoteService.updateTasteProfile(ctx.user.id);
        return { success: true, profile };
      }),
  }),
});

export type AppRouter = typeof appRouter;
