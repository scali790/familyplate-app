import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { mealPlans, mealVotes, userPreferences, type Meal } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

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
      
      const prompt = `Generate a 7-day meal plan for a family of ${prefs.familySize}.

Preferences:
- Cuisines: ${cuisines.join(", ") || "Any"}
- Flavors: ${flavors.join(", ") || "Balanced"}
- Dietary restrictions: ${prefs.dietaryRestrictions || "None"}

Return a JSON object with a "meals" array containing exactly 7 meal objects with these fields:
- day: string (Monday through Sunday)
- name: string
- description: string (1-2 sentences)
- prepTime: string (e.g. "30 mins")
- difficulty: string (Easy, Medium, or Hard)`;

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
  }),
});

export type AppRouter = typeof appRouter;
