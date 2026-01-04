# Personalization System Audit & Design

## Current State Analysis

### ✅ What We Already Have

**Database Schema:**
- `users` table - Basic user info (id, openId, name, email)
- `userPreferences` table - Comprehensive preferences including:
  - Family size
  - Cuisines (JSON array)
  - Flavors (JSON array)
  - Dietary restrictions (text)
  - **Country field** (already exists! Default: UAE)
  - Food frequency preferences (meat, chicken, fish, veg, vegan, spicy, kid-friendly, healthy) - 0-4 scale
- `mealPlans` table - Stores generated plans (userId, weekStartDate, meals JSON)
- `mealVotes` table - Tracks family votes (mealPlanId, mealDay, userId, voteType)

**Existing Voting System:**
- Family members can vote 👍/👎 on meals in shared plans
- Votes stored in `mealVotes` table
- Currently used ONLY for family consensus, NOT for personalization

**Current Onboarding Flow:**
1. Login (Quick Login or Magic Link)
2. Set preferences (family size, cuisines, dietary restrictions, food frequencies)
3. Generate first meal plan

### ❌ What's Missing

1. **Language detection** - No language field in database
2. **Units/Currency** - No fields for measurement units or currency preferences
3. **Dish-level taste signals** - `mealVotes` tracks votes but doesn't store dish names/IDs for learning
4. **Taste profile derivation** - No computed preference weights (cuisine, protein, spice, cooking time)
5. **Historical learning** - LLM doesn't reference past votes or meal history
6. **"Confirm Your Style" onboarding** - No initial taste calibration with sample dishes

---

## Recommended Implementation Plan

### Phase 1: Extend Database Schema

**Add to `userPreferences` table:**
```typescript
language: varchar("language", { length: 5 }).default("en"), // ISO language code
units: varchar("units", { length: 10 }).default("metric"), // metric or imperial
currency: varchar("currency", { length: 3 }).default("AED"), // ISO currency code
tasteProfile: text("taste_profile"), // JSON: derived weights and preferences
```

**Create new `dishVotes` table:**
```typescript
export const dishVotes = mysqlTable("dish_votes", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  dishName: varchar("dish_name", { length: 255 }).notNull(), // Normalized dish name
  liked: int("liked").notNull(), // 1 = thumbs up, 0 = thumbs down
  context: varchar("context", { length: 50 }).default("onboarding"), // onboarding, meal_plan, regenerate
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

**Why separate `dishVotes` from `mealVotes`?**
- `mealVotes` = family consensus voting on specific meal plans (tied to mealPlanId + mealDay)
- `dishVotes` = individual user taste signals (independent of specific plans, used for learning)

### Phase 2: Auto-detect Language & Country

**Onboarding Step 1: Detect & Confirm**
- Use browser `navigator.language` and `navigator.languages` to detect language
- Use IP geolocation API or browser timezone to guess country
- Show confirmation screen: "We detected: English (US). Is this correct?"
- Pre-fill but allow manual override

**Implementation:**
- Add detection logic in onboarding component
- Store in `userPreferences.language` and `userPreferences.country`
- Derive units (metric/imperial) and currency from country

### Phase 3: "Confirm Your Style" Onboarding Step

**New Onboarding Step 2: Taste Calibration**
- Show 10 representative dishes with AI-generated images
- User votes 👍/👎 on each
- Dishes span different cuisines, proteins, spice levels
- Store votes in `dishVotes` table with context="onboarding"

**Sample dishes:**
1. Classic Italian Margherita Pizza
2. Spicy Thai Green Curry
3. Grilled Salmon with Lemon
4. Indian Butter Chicken
5. Vegan Buddha Bowl
6. Mexican Beef Tacos
7. Japanese Teriyaki Chicken
8. Mediterranean Falafel Wrap
9. Chinese Kung Pao Shrimp
10. American BBQ Ribs

**Derivation Logic:**
After collecting votes, compute and store in `tasteProfile`:
```json
{
  "cuisine_weights": {
    "Italian": 0.8,
    "Thai": 0.3,
    "Japanese": 0.6,
    ...
  },
  "protein_weights": {
    "chicken": 0.7,
    "beef": 0.5,
    "fish": 0.6,
    "vegan": 0.2
  },
  "spice_preference": 0.4, // 0-1 scale
  "cooking_time_preference": "quick", // quick, moderate, slow
  "disliked_ingredients": []
}
```

### Phase 4: Update LLM Prompt for Personalization

**Enhance meal generation prompt to include:**

1. **Last 4 weeks history** (avoid repeats)
   - Query `mealPlans` for user's last 4 weeks
   - Extract dish names and pass to LLM

2. **Dish votes** (taste signals)
   - Query `dishVotes` for user
   - Pass liked/disliked dishes to LLM

3. **Derived taste profile**
   - Pass `tasteProfile` JSON from `userPreferences`

**Example prompt addition:**
```
USER TASTE SIGNALS:
- Liked dishes: Italian Margherita Pizza, Grilled Salmon, Japanese Teriyaki Chicken
- Disliked dishes: Spicy Thai Green Curry, Vegan Buddha Bowl
- Cuisine preferences: Italian (0.8), Japanese (0.6), Mediterranean (0.5)
- Protein preferences: Chicken (0.7), Fish (0.6), Beef (0.5)
- Spice tolerance: Low (0.3)
- Cooking time: Prefers quick meals

RECENT MEAL HISTORY (avoid repeats):
Week of 2025-12-22: Chicken Fajitas, Lemon Risotto, Shepherd's Pie, ...
Week of 2025-12-15: Beef Stroganoff, Salmon Teriyaki, ...
```

### Phase 5: Continuous Learning

**Convert meal plan votes to dish votes:**
- When user votes 👍/👎 on a meal in their plan
- Create `dishVotes` entry with context="meal_plan"
- Update `tasteProfile` periodically (e.g., after every 5 new votes)

**Regenerate meal taste signals:**
- When user regenerates a meal (clicks 🔄)
- Store as 👎 dish vote for the replaced meal
- Store as 👍 for the new meal (if not regenerated again)

---

## Migration Strategy

### Step 1: Database Migration
1. Add new columns to `userPreferences` (language, units, currency, tasteProfile)
2. Create `dishVotes` table
3. Run migration: `pnpm db:push`

### Step 2: Update Onboarding Flow
1. Add language/country detection screen
2. Add "Confirm Your Style" taste calibration screen
3. Update `savePreferences` API to accept new fields

### Step 3: Update Meal Generation
1. Query last 4 weeks of meal plans
2. Query dish votes
3. Enhance LLM prompt with taste signals
4. Test personalization improvements

### Step 4: Continuous Learning
1. Convert meal votes to dish votes
2. Add taste profile update logic
3. Periodically recalculate weights

---

## Benefits of This Approach

✅ **Minimal disruption** - Extends existing schema, doesn't break current features
✅ **Scalable** - Separate dish votes from meal votes for flexibility
✅ **Privacy-friendly** - All data stored in user's own database
✅ **Improves over time** - Continuous learning from every interaction
✅ **Country already exists!** - We can skip adding country field, just use existing one
✅ **Leverages existing votes** - Can backfill dish votes from existing meal votes

---

## Next Steps

1. ✅ Audit complete - documented current state and gaps
2. ⏳ Get user approval on approach
3. ⏳ Implement database migration
4. ⏳ Build new onboarding screens
5. ⏳ Update LLM prompt
6. ⏳ Test and iterate
