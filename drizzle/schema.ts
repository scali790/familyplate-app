import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * User Preferences Table
 * Stores family meal planning preferences
 */
export const userPreferences = mysqlTable(
  "user_preferences",
  {
    id: int("id").primaryKey().autoincrement(),
    userId: int("user_id").notNull(),
    familySize: int("family_size").notNull().default(2),
    cuisines: text("cuisines"), // JSON string
    flavors: text("flavors"), // JSON string
    dietaryRestrictions: text("dietary_restrictions"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
);

/**
 * Meal Plans Table
 * Stores generated 7-day meal plans
 */
export const mealPlans = mysqlTable(
  "meal_plans",
  {
    id: int("id").primaryKey().autoincrement(),
    userId: int("user_id").notNull(),
    weekStartDate: varchar("week_start_date", { length: 10 }).notNull(),
    meals: text("meals").notNull(), // JSON string
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
);

/**
 * Meal Votes Table
 * Tracks family votes on meals
 */
export const mealVotes = mysqlTable(
  "meal_votes",
  {
    id: int("id").primaryKey().autoincrement(),
    mealPlanId: int("meal_plan_id").notNull(),
    mealDay: varchar("meal_day", { length: 10 }).notNull(),
    userId: int("user_id").notNull(),
    voteType: varchar("vote_type", { length: 10 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
);

export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewUserPreferences = typeof userPreferences.$inferInsert;
export type MealPlan = typeof mealPlans.$inferSelect;
export type NewMealPlan = typeof mealPlans.$inferInsert;
export type MealVote = typeof mealVotes.$inferSelect;
export type NewMealVote = typeof mealVotes.$inferInsert;

export interface Meal {
  day: string;
  name: string;
  description: string;
  prepTime: string;
  difficulty: string;
  upvotes: number;
  downvotes: number;
}
