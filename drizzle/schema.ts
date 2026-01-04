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
    familyName: varchar("family_name", { length: 100 }), // Optional family name for personalization
    familySize: int("family_size").notNull().default(2),
    cuisines: text("cuisines"), // JSON string
    flavors: text("flavors"), // JSON string
    dietaryRestrictions: text("dietary_restrictions"),
    country: varchar("country", { length: 3 }).default("UAE"), // ISO country code for shopping list localization
    // Localization fields
    language: varchar("language", { length: 5 }).default("en").notNull(), // ISO 639-1 language code
    units: varchar("units", { length: 10 }).default("metric").notNull(), // metric or imperial
    currency: varchar("currency", { length: 3 }).default("USD").notNull(), // ISO 4217 currency code
    // Food preference frequency (0=Never, 1=Rarely, 2=Sometimes, 3=Often, 4=Always)
    meatFrequency: int("meat_frequency").notNull().default(3), // Default: Often
    chickenFrequency: int("chicken_frequency").notNull().default(3),
    fishFrequency: int("fish_frequency").notNull().default(3),
    vegetarianFrequency: int("vegetarian_frequency").notNull().default(2), // Default: Sometimes
    veganFrequency: int("vegan_frequency").notNull().default(1), // Default: Rarely
    spicyFrequency: int("spicy_frequency").notNull().default(2),
    kidFriendlyFrequency: int("kid_friendly_frequency").notNull().default(2),
    healthyFrequency: int("healthy_frequency").notNull().default(3),
    // Derived taste profile
    tasteProfile: text("taste_profile"), // JSON with derived preference weights
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

/**
 * Dish Votes Table
 * Stores individual user taste signals for personalization
 */
export const dishVotes = mysqlTable(
  "dish_votes",
  {
    id: int("id").primaryKey().autoincrement(),
    userId: int("user_id").notNull(),
    dishName: varchar("dish_name", { length: 255 }).notNull(),
    liked: int("liked").notNull(), // 1 = thumbs up, 0 = thumbs down
    context: varchar("context", { length: 50 }).default("meal_plan").notNull(),
    metadata: text("metadata"), // JSON: optional extra data
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
);

export type DishVote = typeof dishVotes.$inferSelect;
export type NewDishVote = typeof dishVotes.$inferInsert;

/**
 * Magic Link Tokens Table
 * Stores one-time use tokens for passwordless email authentication
 */
export const magicLinkTokens = mysqlTable(
  "magic_link_tokens",
  {
    id: int("id").primaryKey().autoincrement(),
    token: varchar("token", { length: 64 }).notNull().unique(),
    email: varchar("email", { length: 320 }).notNull(),
    name: text("name"), // Optional name provided during magic link request
    used: int("used").notNull().default(0), // 0 = unused, 1 = used
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
);

export type MagicLinkToken = typeof magicLinkTokens.$inferSelect;
export type NewMagicLinkToken = typeof magicLinkTokens.$inferInsert;

export interface Meal {
  day: string;
  name: string;
  description: string;
  prepTime: string;
  cookTime: string;
  difficulty: string;
  ingredients: string[];
  instructions: string[];
  tags: string[]; // e.g., ["chicken", "spicy", "healthy"]
  upvotes: number;
  downvotes: number;
}
