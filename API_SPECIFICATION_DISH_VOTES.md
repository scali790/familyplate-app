# API Specification: Dish Voting Endpoints

## Overview

This document specifies the API endpoints for recording and retrieving user taste signals (dish votes) used for meal plan personalization.

---

## Authentication

Both endpoints require authentication via tRPC `protectedProcedure`.

**Authentication Method:** Session-based (cookie)
**Required:** User must be logged in
**Error if not authenticated:** `UNAUTHORIZED` error

---

## Endpoint 1: `saveDishVote`

### Purpose
Record a user's taste signal (👍/👎) for a specific dish. Used during onboarding, meal plan voting, and meal regeneration.

### Method
`mutation`

### Route
`trpc.preferences.saveDishVote`

### Input Schema

```typescript
{
  dishName: string;        // Required, max 255 chars
  liked: boolean;          // Required, true = 👍, false = 👎
  context?: string;        // Optional, enum: "onboarding" | "meal_plan" | "regenerate"
  metadata?: {             // Optional, extra dish attributes
    cuisine?: string;
    protein?: string;
    spice_level?: string;
    cooking_time?: string;
    difficulty?: string;
  }
}
```

### Request Examples

#### Example 1: Onboarding Vote (Simple)

```typescript
const result = await trpc.preferences.saveDishVote.mutate({
  dishName: "Italian Margherita Pizza",
  liked: true,
  context: "onboarding"
});
```

#### Example 2: Onboarding Vote (With Metadata)

```typescript
const result = await trpc.preferences.saveDishVote.mutate({
  dishName: "Spicy Thai Green Curry",
  liked: false,
  context: "onboarding",
  metadata: {
    cuisine: "Thai",
    protein: "chicken",
    spice_level: "high",
    cooking_time: "30 mins",
    difficulty: "Medium"
  }
});
```

#### Example 3: Meal Plan Vote

```typescript
const result = await trpc.preferences.saveDishVote.mutate({
  dishName: "Chicken Fajitas",
  liked: true,
  context: "meal_plan",
  metadata: {
    cuisine: "Mexican",
    protein: "chicken",
    spice_level: "medium"
  }
});
```

#### Example 4: Regenerate Vote (Dislike)

```typescript
const result = await trpc.preferences.saveDishVote.mutate({
  dishName: "Lentil Shepherd's Pie",
  liked: false,
  context: "regenerate",
  metadata: {
    cuisine: "British",
    protein: "vegan"
  }
});
```

### Response Schema

```typescript
{
  success: boolean;
  voteId?: number;  // ID of created vote record
}
```

### Success Response

```json
{
  "success": true,
  "voteId": 42
}
```

### Error Responses

#### 1. Validation Error (Invalid Input)

**Status:** `BAD_REQUEST`

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Validation error",
    "data": {
      "zodError": {
        "fieldErrors": {
          "dishName": ["String must contain at most 255 character(s)"]
        }
      }
    }
  }
}
```

#### 2. Database Unavailable

**Status:** `INTERNAL_SERVER_ERROR`

```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Database not available"
  }
}
```

#### 3. Unauthorized (Not Logged In)

**Status:** `UNAUTHORIZED`

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Not authenticated"
  }
}
```

### Usage in React Component

```typescript
import { trpc } from "@/lib/trpc";

function TasteCalibration() {
  const saveDishVote = trpc.preferences.saveDishVote.useMutation();
  
  const handleVote = async (dishName: string, liked: boolean) => {
    try {
      const result = await saveDishVote.mutateAsync({
        dishName,
        liked,
        context: "onboarding",
        metadata: {
          cuisine: detectCuisine(dishName),
          protein: detectProtein(dishName),
        }
      });
      
      if (result.success) {
        console.log("Vote recorded successfully!");
      }
    } catch (error) {
      console.error("Failed to save vote:", error);
      alert("Failed to save your vote. Please try again.");
    }
  };
  
  return (
    <div>
      <h2>Italian Margherita Pizza</h2>
      <button onClick={() => handleVote("Italian Margherita Pizza", true)}>
        👍 Like
      </button>
      <button onClick={() => handleVote("Italian Margherita Pizza", false)}>
        👎 Dislike
      </button>
    </div>
  );
}
```

---

## Endpoint 2: `getDishVotes`

### Purpose
Retrieve all dish votes for the authenticated user, ordered by most recent first. Used for displaying vote history and computing taste profiles.

### Method
`query`

### Route
`trpc.preferences.getDishVotes`

### Input Schema

```typescript
{
  context?: string;  // Optional filter: "onboarding" | "meal_plan" | "regenerate"
  limit?: number;    // Optional, max results to return (default: all)
}
```

### Request Examples

#### Example 1: Get All Votes

```typescript
const votes = await trpc.preferences.getDishVotes.useQuery();
```

#### Example 2: Get Only Onboarding Votes

```typescript
const votes = await trpc.preferences.getDishVotes.useQuery({
  context: "onboarding"
});
```

#### Example 3: Get Last 10 Votes

```typescript
const votes = await trpc.preferences.getDishVotes.useQuery({
  limit: 10
});
```

### Response Schema

```typescript
Array<{
  id: number;
  userId: number;
  dishName: string;
  liked: boolean;      // Converted from int (1/0) to boolean
  context: string;
  metadata: {
    cuisine?: string;
    protein?: string;
    spice_level?: string;
    cooking_time?: string;
    difficulty?: string;
  } | null;
  createdAt: Date;
}>
```

### Success Response

```json
[
  {
    "id": 42,
    "userId": 1,
    "dishName": "Italian Margherita Pizza",
    "liked": true,
    "context": "onboarding",
    "metadata": {
      "cuisine": "Italian",
      "protein": "vegetarian",
      "spice_level": "mild"
    },
    "createdAt": "2025-12-29T10:15:30.000Z"
  },
  {
    "id": 41,
    "userId": 1,
    "dishName": "Spicy Thai Green Curry",
    "liked": false,
    "context": "onboarding",
    "metadata": {
      "cuisine": "Thai",
      "protein": "chicken",
      "spice_level": "high"
    },
    "createdAt": "2025-12-29T10:14:22.000Z"
  },
  {
    "id": 40,
    "userId": 1,
    "dishName": "Chicken Fajitas",
    "liked": true,
    "context": "meal_plan",
    "metadata": {
      "cuisine": "Mexican",
      "protein": "chicken",
      "spice_level": "medium"
    },
    "createdAt": "2025-12-28T18:30:15.000Z"
  }
]
```

### Empty Response (No Votes)

```json
[]
```

### Error Responses

#### 1. Database Unavailable

**Status:** `INTERNAL_SERVER_ERROR`

```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Database not available"
  }
}
```

#### 2. Unauthorized (Not Logged In)

**Status:** `UNAUTHORIZED`

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Not authenticated"
  }
}
```

### Usage in React Component

```typescript
import { trpc } from "@/lib/trpc";

function VoteHistory() {
  const { data: votes, isLoading, error } = trpc.preferences.getDishVotes.useQuery();
  
  if (isLoading) return <div>Loading your taste preferences...</div>;
  if (error) return <div>Error loading votes: {error.message}</div>;
  if (!votes || votes.length === 0) return <div>No votes yet!</div>;
  
  const likedDishes = votes.filter(v => v.liked);
  const dislikedDishes = votes.filter(v => !v.liked);
  
  return (
    <div>
      <h2>Your Taste Profile</h2>
      
      <section>
        <h3>Dishes You Love 👍 ({likedDishes.length})</h3>
        <ul>
          {likedDishes.map(vote => (
            <li key={vote.id}>
              {vote.dishName}
              {vote.metadata?.cuisine && ` (${vote.metadata.cuisine})`}
            </li>
          ))}
        </ul>
      </section>
      
      <section>
        <h3>Dishes You Dislike 👎 ({dislikedDishes.length})</h3>
        <ul>
          {dislikedDishes.map(vote => (
            <li key={vote.id}>
              {vote.dishName}
              {vote.metadata?.cuisine && ` (${vote.metadata.cuisine})`}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
```

---

## Endpoint 3: `computeTasteProfile` (Bonus)

### Purpose
Analyze all dish votes and compute derived preference weights. Updates `userPreferences.tasteProfile` field.

### Method
`mutation`

### Route
`trpc.preferences.computeTasteProfile`

### Input Schema

```typescript
{} // No input required, uses authenticated user's votes
```

### Request Example

```typescript
const result = await trpc.preferences.computeTasteProfile.mutate();
```

### Response Schema

```typescript
{
  success: boolean;
  tasteProfile: {
    cuisine_weights: Record<string, number>;
    protein_weights: Record<string, number>;
    spice_preference: number;
    cooking_time_preference: string;
    disliked_ingredients: string[];
    last_updated: string;
  };
}
```

### Success Response

```json
{
  "success": true,
  "tasteProfile": {
    "cuisine_weights": {
      "Italian": 0.8,
      "Mexican": 0.7,
      "Thai": 0.3,
      "Japanese": 0.6
    },
    "protein_weights": {
      "chicken": 0.8,
      "fish": 0.6,
      "beef": 0.5,
      "vegan": 0.2
    },
    "spice_preference": 0.4,
    "cooking_time_preference": "quick",
    "disliked_ingredients": [],
    "last_updated": "2025-12-29T10:20:00.000Z"
  }
}
```

### Algorithm

```typescript
function computeTasteProfile(votes: DishVote[]): TasteProfile {
  const cuisineScores: Record<string, { likes: number; total: number }> = {};
  const proteinScores: Record<string, { likes: number; total: number }> = {};
  let totalSpice = 0;
  let spiceCount = 0;
  
  // Analyze each vote
  for (const vote of votes) {
    const { metadata, liked } = vote;
    if (!metadata) continue;
    
    // Track cuisine preferences
    if (metadata.cuisine) {
      if (!cuisineScores[metadata.cuisine]) {
        cuisineScores[metadata.cuisine] = { likes: 0, total: 0 };
      }
      cuisineScores[metadata.cuisine].total++;
      if (liked) cuisineScores[metadata.cuisine].likes++;
    }
    
    // Track protein preferences
    if (metadata.protein) {
      if (!proteinScores[metadata.protein]) {
        proteinScores[metadata.protein] = { likes: 0, total: 0 };
      }
      proteinScores[metadata.protein].total++;
      if (liked) proteinScores[metadata.protein].likes++;
    }
    
    // Track spice preference
    if (metadata.spice_level) {
      const spiceValue = { low: 0.2, medium: 0.5, high: 0.8 }[metadata.spice_level] || 0.5;
      if (liked) {
        totalSpice += spiceValue;
        spiceCount++;
      }
    }
  }
  
  // Compute weights (likes / total)
  const cuisine_weights: Record<string, number> = {};
  for (const [cuisine, scores] of Object.entries(cuisineScores)) {
    cuisine_weights[cuisine] = scores.likes / scores.total;
  }
  
  const protein_weights: Record<string, number> = {};
  for (const [protein, scores] of Object.entries(proteinScores)) {
    protein_weights[protein] = scores.likes / scores.total;
  }
  
  const spice_preference = spiceCount > 0 ? totalSpice / spiceCount : 0.5;
  
  return {
    cuisine_weights,
    protein_weights,
    spice_preference,
    cooking_time_preference: "quick", // TODO: derive from cooking_time metadata
    disliked_ingredients: [],
    last_updated: new Date().toISOString(),
  };
}
```

---

## Integration Flow

### Onboarding Flow

```typescript
// Step 1: Show 10 dishes, collect votes
const dishes = [
  { name: "Italian Margherita Pizza", cuisine: "Italian", protein: "vegetarian" },
  { name: "Spicy Thai Green Curry", cuisine: "Thai", protein: "chicken", spice: "high" },
  // ... 8 more dishes
];

for (const dish of dishes) {
  const liked = await askUserVote(dish.name); // Show UI, get 👍/👎
  
  await trpc.preferences.saveDishVote.mutate({
    dishName: dish.name,
    liked,
    context: "onboarding",
    metadata: {
      cuisine: dish.cuisine,
      protein: dish.protein,
      spice_level: dish.spice,
    }
  });
}

// Step 2: Compute taste profile
await trpc.preferences.computeTasteProfile.mutate();

// Step 3: Redirect to dashboard
router.push("/dashboard");
```

### Meal Plan Voting Flow

```typescript
// When user votes on a meal in their plan
async function handleMealVote(meal: Meal, liked: boolean) {
  // 1. Save to mealVotes (for family consensus)
  await trpc.mealPlans.voteMeal.mutate({
    mealPlanId,
    mealDay: meal.day,
    voteType: liked ? "up" : "down"
  });
  
  // 2. Save to dishVotes (for personalization)
  await trpc.preferences.saveDishVote.mutate({
    dishName: meal.name,
    liked,
    context: "meal_plan",
    metadata: {
      cuisine: meal.tags.find(t => isCuisine(t)),
      protein: meal.tags.find(t => isProtein(t)),
      spice_level: meal.tags.includes("spicy") ? "high" : "low",
    }
  });
  
  // 3. Recompute taste profile (async, don't wait)
  trpc.preferences.computeTasteProfile.mutate().catch(console.error);
}
```

### Meal Regeneration Flow

```typescript
// When user clicks 🔄 to regenerate a meal
async function handleRegenerate(meal: Meal) {
  // 1. Record dislike for current meal
  await trpc.preferences.saveDishVote.mutate({
    dishName: meal.name,
    liked: false,
    context: "regenerate"
  });
  
  // 2. Generate new meal (LLM will use taste profile)
  const newMeal = await trpc.mealPlans.regenerateMeal.mutate({
    mealPlanId,
    mealDay: meal.day
  });
  
  // 3. Update UI with new meal
  setMeals(meals.map(m => m.day === meal.day ? newMeal : m));
}
```

---

## Rate Limiting Recommendations

### `saveDishVote`
- **Limit:** 100 requests per hour per user
- **Reason:** Prevents abuse, normal usage is ~10-20 votes per session

### `getDishVotes`
- **Limit:** 60 requests per hour per user
- **Reason:** Read-heavy, but should be cached on client

### `computeTasteProfile`
- **Limit:** 10 requests per hour per user
- **Reason:** Expensive computation, should only run after new votes

---

## Testing Checklist

- [ ] Test `saveDishVote` with valid inputs
- [ ] Test `saveDishVote` with invalid inputs (too long dish name, invalid context)
- [ ] Test `saveDishVote` without authentication (should fail)
- [ ] Test `saveDishVote` with metadata
- [ ] Test `saveDishVote` without metadata
- [ ] Test `getDishVotes` returns all votes
- [ ] Test `getDishVotes` with context filter
- [ ] Test `getDishVotes` with limit
- [ ] Test `getDishVotes` returns empty array for new user
- [ ] Test `computeTasteProfile` with no votes (should handle gracefully)
- [ ] Test `computeTasteProfile` with mixed votes
- [ ] Test `computeTasteProfile` updates userPreferences.tasteProfile
- [ ] Test concurrent votes don't create duplicates
- [ ] Test database unavailable error handling

---

## Summary

**Endpoints:**
1. `saveDishVote` - Record taste signal (mutation)
2. `getDishVotes` - Retrieve vote history (query)
3. `computeTasteProfile` - Derive preference weights (mutation)

**Key Features:**
- ✅ Full type safety with Zod validation
- ✅ Comprehensive error handling
- ✅ Metadata support for rich taste signals
- ✅ Context tracking (onboarding, meal_plan, regenerate)
- ✅ Automatic taste profile computation
- ✅ React hooks integration examples
