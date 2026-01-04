# Database Schema Changes for Personalization

## Overview

This document specifies the exact database schema changes needed to implement the taste signals and personalization system.

---

## 1. New Table: `dishVotes`

### Purpose
Store individual user taste signals (👍/👎) for dishes across different contexts (onboarding, meal plans, regeneration). Used for learning and personalization.

### Schema Definition (Drizzle ORM)

```typescript
/**
 * Dish Votes Table
 * Stores individual user taste signals for personalization
 */
export const dishVotes = mysqlTable("dish_votes", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  dishName: varchar("dish_name", { length: 255 }).notNull(),
  liked: int("liked").notNull(), // 1 = thumbs up, 0 = thumbs down
  context: varchar("context", { length: 50 }).default("meal_plan").notNull(),
  metadata: text("metadata"), // JSON: optional extra data (cuisine, protein, spice_level, etc.)
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type DishVote = typeof dishVotes.$inferSelect;
export type NewDishVote = typeof dishVotes.$inferInsert;
```

### Field Descriptions

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | int | No | Auto | Primary key |
| `userId` | int | No | - | Foreign key to `users.id` |
| `dishName` | varchar(255) | No | - | Normalized dish name (e.g., "Chicken Fajitas") |
| `liked` | int | No | - | 1 = liked (👍), 0 = disliked (👎) |
| `context` | varchar(50) | No | "meal_plan" | Where vote came from: "onboarding", "meal_plan", "regenerate" |
| `metadata` | text | Yes | null | JSON with extra info: `{"cuisine": "Mexican", "protein": "chicken", "spice_level": "medium"}` |
| `createdAt` | timestamp | No | NOW() | When vote was recorded |

### Indexes

```sql
CREATE INDEX idx_dish_votes_user_id ON dish_votes(user_id);
CREATE INDEX idx_dish_votes_dish_name ON dish_votes(dish_name);
CREATE INDEX idx_dish_votes_user_dish ON dish_votes(user_id, dish_name);
```

### Sample Data

```sql
INSERT INTO dish_votes (user_id, dish_name, liked, context, metadata) VALUES
(1, 'Italian Margherita Pizza', 1, 'onboarding', '{"cuisine":"Italian","protein":"vegetarian"}'),
(1, 'Spicy Thai Green Curry', 0, 'onboarding', '{"cuisine":"Thai","protein":"chicken","spice_level":"high"}'),
(1, 'Chicken Fajitas', 1, 'meal_plan', '{"cuisine":"Mexican","protein":"chicken","spice_level":"medium"}'),
(1, 'Lentil Shepherd\'s Pie', 0, 'regenerate', '{"cuisine":"British","protein":"vegan"}');
```

---

## 2. Extend Table: `userPreferences`

### New Fields to Add

```typescript
// Add these fields to the existing userPreferences table definition

language: varchar("language", { length: 5 }).default("en").notNull(),
units: varchar("units", { length: 10 }).default("metric").notNull(),
currency: varchar("currency", { length: 3 }).default("USD").notNull(),
tasteProfile: text("taste_profile"), // JSON: derived preference weights
```

### Field Descriptions

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `language` | varchar(5) | No | "en" | ISO 639-1 language code (en, de, ar, es, fr, etc.) |
| `units` | varchar(10) | No | "metric" | Measurement system: "metric" or "imperial" |
| `currency` | varchar(3) | No | "USD" | ISO 4217 currency code (USD, EUR, AED, GBP, etc.) |
| `tasteProfile` | text | Yes | null | JSON with derived preference weights (see structure below) |

### Taste Profile JSON Structure

```typescript
interface TasteProfile {
  cuisine_weights: Record<string, number>; // e.g., {"Italian": 0.8, "Thai": 0.3}
  protein_weights: Record<string, number>; // e.g., {"chicken": 0.7, "beef": 0.5}
  spice_preference: number; // 0-1 scale (0=mild, 1=very spicy)
  cooking_time_preference: "quick" | "moderate" | "slow";
  disliked_ingredients: string[];
  last_updated: string; // ISO timestamp
}
```

### Sample Taste Profile

```json
{
  "cuisine_weights": {
    "Italian": 0.8,
    "Mexican": 0.7,
    "Japanese": 0.6,
    "Thai": 0.3,
    "Indian": 0.4
  },
  "protein_weights": {
    "chicken": 0.8,
    "fish": 0.7,
    "beef": 0.5,
    "pork": 0.4,
    "vegan": 0.2
  },
  "spice_preference": 0.4,
  "cooking_time_preference": "quick",
  "disliked_ingredients": ["cilantro", "blue cheese", "anchovies"],
  "last_updated": "2025-12-29T10:15:30Z"
}
```

---

## 3. Updated `userPreferences` Table Definition

### Complete Schema (with new fields)

```typescript
export const userPreferences = mysqlTable("user_preferences", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  
  // Basic preferences
  familySize: int("family_size").notNull().default(2),
  cuisines: text("cuisines"), // JSON string
  flavors: text("flavors"), // JSON string
  dietaryRestrictions: text("dietary_restrictions"),
  
  // Localization (NEW)
  language: varchar("language", { length: 5 }).default("en").notNull(),
  country: varchar("country", { length: 3 }).default("UAE").notNull(), // Already exists!
  units: varchar("units", { length: 10 }).default("metric").notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  
  // Food preference frequencies (0=Never, 1=Rarely, 2=Sometimes, 3=Often, 4=Always)
  meatFrequency: int("meat_frequency").notNull().default(3),
  chickenFrequency: int("chicken_frequency").notNull().default(3),
  fishFrequency: int("fish_frequency").notNull().default(3),
  vegetarianFrequency: int("vegetarian_frequency").notNull().default(2),
  veganFrequency: int("vegan_frequency").notNull().default(1),
  spicyFrequency: int("spicy_frequency").notNull().default(2),
  kidFriendlyFrequency: int("kid_friendly_frequency").notNull().default(2),
  healthyFrequency: int("healthy_frequency").notNull().default(3),
  
  // Derived taste profile (NEW)
  tasteProfile: text("taste_profile"), // JSON
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});
```

---

## 4. Migration SQL

### SQL to Add New Columns to `userPreferences`

```sql
ALTER TABLE user_preferences
ADD COLUMN language VARCHAR(5) NOT NULL DEFAULT 'en' AFTER dietary_restrictions,
ADD COLUMN units VARCHAR(10) NOT NULL DEFAULT 'metric' AFTER country,
ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'USD' AFTER units,
ADD COLUMN taste_profile TEXT NULL AFTER healthy_frequency;
```

### SQL to Create `dishVotes` Table

```sql
CREATE TABLE dish_votes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  dish_name VARCHAR(255) NOT NULL,
  liked INT NOT NULL,
  context VARCHAR(50) NOT NULL DEFAULT 'meal_plan',
  metadata TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_dish_votes_user_id (user_id),
  INDEX idx_dish_votes_dish_name (dish_name),
  INDEX idx_dish_votes_user_dish (user_id, dish_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 5. Default Values Strategy

### Language Detection Logic

```typescript
function detectLanguage(): string {
  if (typeof navigator !== 'undefined') {
    // Browser environment
    const browserLang = navigator.language || navigator.languages?.[0];
    return browserLang?.split('-')[0] || 'en'; // Extract language code (e.g., "en" from "en-US")
  }
  return 'en'; // Default fallback
}
```

### Country Detection Logic

```typescript
function detectCountry(): string {
  if (typeof navigator !== 'undefined') {
    const browserLang = navigator.language || navigator.languages?.[0];
    const countryCode = browserLang?.split('-')[1]; // Extract country (e.g., "US" from "en-US")
    if (countryCode) return countryCode;
  }
  // Fallback: could use IP geolocation API here
  return 'US'; // Default fallback
}
```

### Units/Currency Derivation

```typescript
const countryDefaults: Record<string, { units: string; currency: string }> = {
  US: { units: 'imperial', currency: 'USD' },
  GB: { units: 'imperial', currency: 'GBP' },
  AE: { units: 'metric', currency: 'AED' },
  DE: { units: 'metric', currency: 'EUR' },
  FR: { units: 'metric', currency: 'EUR' },
  // Add more countries as needed
};

function deriveUnitsAndCurrency(country: string) {
  return countryDefaults[country] || { units: 'metric', currency: 'USD' };
}
```

---

## 6. API Changes Required

### Update `savePreferences` Input Schema

```typescript
// Add these fields to the existing z.object() in savePreferences
language: z.string().length(2).optional(),
units: z.enum(['metric', 'imperial']).optional(),
currency: z.string().length(3).optional(),
tasteProfile: z.string().optional(), // JSON string
```

### New API: `saveDishVote`

```typescript
saveDishVote: protectedProcedure
  .input(
    z.object({
      dishName: z.string().max(255),
      liked: z.boolean(),
      context: z.enum(['onboarding', 'meal_plan', 'regenerate']).default('meal_plan'),
      metadata: z.object({
        cuisine: z.string().optional(),
        protein: z.string().optional(),
        spice_level: z.string().optional(),
      }).optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    await db.insert(dishVotes).values({
      userId: ctx.user.id,
      dishName: input.dishName,
      liked: input.liked ? 1 : 0,
      context: input.context,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    });
    
    return { success: true };
  }),
```

### New API: `getDishVotes`

```typescript
getDishVotes: protectedProcedure
  .query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    
    const votes = await db
      .select()
      .from(dishVotes)
      .where(eq(dishVotes.userId, ctx.user.id))
      .orderBy(desc(dishVotes.createdAt));
    
    return votes.map(vote => ({
      ...vote,
      metadata: vote.metadata ? JSON.parse(vote.metadata) : null,
    }));
  }),
```

---

## 7. Migration Checklist

- [ ] Update `/home/ubuntu/easyplate/drizzle/schema.ts` with new fields and table
- [ ] Run `pnpm db:push` to apply schema changes
- [ ] Update `/home/ubuntu/easyplate/server/routers.ts` with new API endpoints
- [ ] Update onboarding flow to collect language/country
- [ ] Build "Confirm Your Style" taste calibration screen
- [ ] Update meal generation prompt to use taste signals
- [ ] Test end-to-end personalization flow

---

## 8. Backward Compatibility

### Existing Users
- All new fields have default values, so existing users won't break
- `language` defaults to "en"
- `units` defaults to "metric"
- `currency` defaults to "USD"
- `tasteProfile` is nullable (null for users who haven't completed taste calibration)

### Migration Path
1. Deploy schema changes
2. Existing users continue using app normally
3. Next time they visit onboarding/settings, prompt them to complete taste calibration
4. Gradually backfill taste profiles from existing meal votes

---

## Summary

**New Table:** `dishVotes` (7 columns, 3 indexes)
**Extended Table:** `userPreferences` (+4 columns: language, units, currency, tasteProfile)
**New APIs:** `saveDishVote`, `getDishVotes`
**Migration:** Safe, backward-compatible, no data loss
