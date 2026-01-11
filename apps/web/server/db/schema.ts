import { pgTable, serial, varchar, timestamp, text, integer, jsonb, boolean, index } from "drizzle-orm/pg-core";

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

export type User = typeof users.$inferSelect;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type MealPlan = typeof mealPlans.$inferSelect;
export type MealVote = typeof mealVotes.$inferSelect;
export type DishVote = typeof dishVotes.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type MagicLinkToken = typeof magicLinkTokens.$inferSelect;

export interface Meal {
  name: string;
  description: string;
  prepTime: string;
  cookTime: string;
  ingredients: string[];
  instructions: string[];
  tags: string[];
  upVotes?: number;
  downVotes?: number;
  neutralVotes?: number;
  voters?: Array<{ name: string; vote: string }>;
}
