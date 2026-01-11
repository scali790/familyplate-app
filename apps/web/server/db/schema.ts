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

/**
 * Meal History Table
 * Tracks all meals served to enable 4-week rotation logic
 */
export const mealHistory = pgTable(
  "meal_history",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id),
    mealName: varchar("meal_name", { length: 255 }).notNull(),
    mealType: varchar("meal_type", { length: 20 }).notNull(), // breakfast, lunch, dinner
    lastServed: timestamp("last_served").notNull(),
    timesServed: integer("times_served").notNull().default(1),
    isFavorite: boolean("is_favorite").notNull().default(false), // auto-set when upvotes >= 3
    totalUpvotes: integer("total_upvotes").notNull().default(0),
    totalDownvotes: integer("total_downvotes").notNull().default(0),
    totalNeutralVotes: integer("total_neutral_votes").notNull().default(0),
    cuisine: varchar("cuisine", { length: 50 }),
    tags: jsonb("tags"), // array of tags: ["chicken", "spicy", "healthy"]
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    userMealTypeIdx: index("meal_history_user_meal_type_idx").on(table.userId, table.mealType),
    lastServedIdx: index("meal_history_last_served_idx").on(table.lastServed),
    isFavoriteIdx: index("meal_history_is_favorite_idx").on(table.isFavorite),
  })
);

/**
 * Meal Regeneration Quota Table
 * Tracks meal replacement usage (2 free per week)
 */
export const mealRegenerationQuota = pgTable(
  "meal_regeneration_quota",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id),
    weekStartDate: varchar("week_start_date", { length: 10 }).notNull(), // YYYY-MM-DD
    used: integer("used").notNull().default(0), // How many replacements used this week
    limit: integer("limit").notNull().default(2), // Free limit per week
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    userWeekIdx: index("meal_regeneration_quota_user_week_idx").on(table.userId, table.weekStartDate),
  })
);

/**
 * Recipe Details Table
 * Stores full recipe details (ingredients + instructions) generated on-demand
 * Cached to avoid regenerating the same recipe multiple times
 */
export const recipeDetails = pgTable(
  "recipe_details",
  {
    id: serial("id").primaryKey(),
    recipeId: varchar("recipe_id", { length: 255 }).notNull().unique(), // e.g., "mon-dinner-001"
    mealName: varchar("meal_name", { length: 255 }).notNull(),
    ingredients: jsonb("ingredients").notNull(), // Array<{ name: string; amount: string; category: string }>
    instructions: jsonb("instructions").notNull(), // string[]
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    recipeIdIdx: index("recipe_details_recipe_id_idx").on(table.recipeId),
  })
);

export type User = typeof users.$inferSelect;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type MealPlan = typeof mealPlans.$inferSelect;
export type MealVote = typeof mealVotes.$inferSelect;
export type DishVote = typeof dishVotes.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type MagicLinkToken = typeof magicLinkTokens.$inferSelect;
export type MealHistory = typeof mealHistory.$inferSelect;
export type MealRegenerationQuota = typeof mealRegenerationQuota.$inferSelect;
export type RecipeDetails = typeof recipeDetails.$inferSelect;

export interface Meal {
  day: string; // monday, tuesday, etc.
  mealType: "breakfast" | "lunch" | "dinner"; // NEW: meal type
  name: string;
  description: string;
  prepTime: string;
  cookTime: string;
  difficulty: string;
  ingredients: Array<{ name: string; amount: string; category: string }>; // Structured ingredients
  instructions: string[];
  tags: string[]; // e.g., ["chicken", "spicy", "healthy"]
  emoji: string; // Meal emoji (🥣, 🌯, 🍗)
  upVotes?: number;
  downVotes?: number;
  neutralVotes?: number;
  voters?: Array<{ name: string; vote: string }>;
}
