import { pgTable, serial, varchar, timestamp, text, integer, jsonb, boolean, index, uniqueIndex, real } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("open_id", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  loginMethod: varchar("login_method", { length: 50 }).notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  familySize: integer("family_size").notNull(),
  mealTypes: jsonb("meal_types").notNull(),
  cuisines: jsonb("cuisines").notNull(),
  flavors: jsonb("flavors").notNull(),
  dietaryRestrictions: jsonb("dietary_restrictions"),
  country: varchar("country", { length: 100 }),
  familyName: varchar("family_name", { length: 100 }),
  chickenFrequency: integer("chicken_frequency").default(2),
  redMeatFrequency: integer("red_meat_frequency").default(2),
  fishFrequency: integer("fish_frequency").default(2),
  vegetarianFrequency: integer("vegetarian_frequency").default(2),
  // New advanced preference fields
  cookingTime: varchar("cooking_time", { length: 50 }).default("medium"), // quick, medium, elaborate
  spiceLevel: varchar("spice_level", { length: 50 }).default("medium"), // mild, medium, hot, extra-hot
  kidFriendly: boolean("kid_friendly").default(false),
  commonDislikes: jsonb("common_dislikes"), // array of common disliked ingredients
  customDislikes: text("custom_dislikes"), // free text for edge cases
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const mealPlans = pgTable("meal_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  weekStartDate: varchar("week_start_date", { length: 10 }).notNull(),
  meals: jsonb("meals").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const mealVotes = pgTable("meal_votes", {
  id: serial("id").primaryKey(),
  mealPlanId: integer("meal_plan_id").notNull().references(() => mealPlans.id),
  dayIndex: integer("day_index").notNull(),
  voterHash: varchar("voter_hash", { length: 255 }).notNull(),
  voterName: varchar("voter_name", { length: 100 }),
  vote: varchar("vote", { length: 10 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dishVotes = pgTable("dish_votes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  dishId: varchar("dish_id", { length: 100 }).notNull(),
  vote: varchar("vote", { length: 10 }).notNull(),
  context: varchar("context", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: serial("id").primaryKey(),
    sessionId: varchar("session_id", { length: 255 }).notNull().unique(),
    userId: integer("user_id").notNull().references(() => users.id),
    expiresAt: timestamp("expires_at").notNull(),
    revokedAt: timestamp("revoked_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    userIdIdx: index("sessions_userId_idx").on(table.userId),
    expiresAtIdx: index("sessions_expiresAt_idx").on(table.expiresAt),
  })
);

export const magicLinkTokens = pgTable("magic_link_tokens", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const mealRegenerationQuota = pgTable("meal_regeneration_quota", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  count: integer("count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const mealHistory = pgTable("meal_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  mealName: varchar("meal_name", { length: 255 }).notNull(),
  mealData: jsonb("meal_data").notNull(), // Full meal object
  replacedAt: timestamp("replaced_at").defaultNow(),
  reason: varchar("reason", { length: 50 }).default("regenerated"), // regenerated, deleted, etc.
});

// Public Voting Sessions (Family Voting via Share Link)
export const voteSessions = pgTable("vote_sessions", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  userId: integer("user_id").notNull().references(() => users.id), // Manager
  mealPlanId: integer("meal_plan_id").notNull().references(() => mealPlans.id),
  meals: jsonb("meals"), // Snapshot of meals at creation time
  status: varchar("status", { length: 20 }).notNull().default("open"), // 'open' | 'closed'
  closedReason: varchar("closed_reason", { length: 30 }), // 'manual' | 'meal_plan_changed' | 'expired'
  closedAt: timestamp("closed_at"),
  maxVoters: integer("max_voters").notNull().default(10),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const publicMealVotes = pgTable(
  "public_meal_votes",
  {
    id: serial("id").primaryKey(),
    voteSessionId: varchar("vote_session_id", { length: 36 }).notNull().references(() => voteSessions.id, { onDelete: "cascade" }),
    mealId: varchar("meal_id", { length: 100 }).notNull(), // recipeId from meal plan JSON
    voterName: varchar("voter_name", { length: 32 }).notNull(),
    reaction: varchar("reaction", { length: 10 }).notNull(), // 'up' | 'neutral' | 'down'
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    // Unique constraint: one vote per (session, meal, voter)
    uniqueVote: uniqueIndex("public_meal_votes_unique_vote").on(table.voteSessionId, table.mealId, table.voterName),
  })
);

export type User = typeof users.$inferSelect;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type MealPlan = typeof mealPlans.$inferSelect;
export type MealVote = typeof mealVotes.$inferSelect;
export type DishVote = typeof dishVotes.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type MagicLinkToken = typeof magicLinkTokens.$inferSelect;
export type MealRegenerationQuota = typeof mealRegenerationQuota.$inferSelect;
export type MealHistory = typeof mealHistory.$inferSelect;
export type VoteSession = typeof voteSessions.$inferSelect;
export type PublicMealVote = typeof publicMealVotes.$inferSelect;

export interface Meal {
  name: string;
  description: string;
  prepTime: string;
  cookTime: string;
  ingredients: string[];
  instructions: string[];
  tags: string[];
  day?: string; // e.g., "monday", "tuesday", etc.
  mealType?: string; // e.g., "breakfast", "lunch", "dinner"
  difficulty?: string; // e.g., "easy", "medium", "hard"
  emoji?: string; // e.g., "🍝", "🥗", "🍕"
  recipeId?: string; // e.g., "mon-dinner-001"
  upVotes?: number;
  downVotes?: number;
  neutralVotes?: number;
  voters?: Array<{ name: string; vote: string }>;
}

// Admin Dashboard Tables

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  eventName: varchar("event_name", { length: 100 }).notNull(),
  userId: integer("user_id").references(() => users.id),
  properties: jsonb("properties").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const kpiDailySnapshot = pgTable("kpi_daily_snapshot", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull().unique(),
  dau: integer("dau").notNull().default(0),
  wau: integer("wau").notNull().default(0),
  mau: integer("mau").notNull().default(0),
  newUsers: integer("new_users").notNull().default(0),
  activationRate: real("activation_rate").notNull().default(0),
  mealPlansGenerated: integer("meal_plans_generated").notNull().default(0),
  mealsPlanned: integer("meals_planned").notNull().default(0),
  cookCtaUsage: integer("cook_cta_usage").notNull().default(0),
  votesCast: integer("votes_cast").notNull().default(0),
  votingParticipation: real("voting_participation").notNull().default(0),
  positiveVoteRatio: real("positive_vote_ratio").notNull().default(0),
  shoppingListOpens: integer("shopping_list_opens").notNull().default(0),
  shoppingListGenerated: integer("shopping_list_generated").notNull().default(0),
  shoppingListExported: integer("shopping_list_exported").notNull().default(0),
  errorRate: real("error_rate").notNull().default(0),
  tokensIn: integer("tokens_in").notNull().default(0),
  tokensOut: integer("tokens_out").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Event = typeof events.$inferSelect;
export type KpiDailySnapshot = typeof kpiDailySnapshot.$inferSelect;
