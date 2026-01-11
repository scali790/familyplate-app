import type { UserPreferences } from "../schemas/preferences";

const frequencyMap: Record<number, string> = {
  0: "never",
  1: "rarely",
  2: "sometimes",
  3: "often",
  4: "always",
};

export interface MealGenerationPromptData {
  familySize: number;
  mealTypes: string[]; // ["breakfast", "lunch", "dinner"]
  cuisines: string[];
  flavors: string[];
  dietaryRestrictions?: string[];
  foodPreferences: string[];
  cookingTime: string; // "quick", "medium", "elaborate"
  spiceLevel: string; // "mild", "medium", "hot", "extra-hot"
  kidFriendly: boolean;
  commonDislikes?: string[];
  customDislikes?: string;
  country?: string;
  tasteSignals?: {
    likedDishes: string[];
    dislikedDishes: string[];
    cuisineWeights?: Record<string, number>;
    proteinWeights?: Record<string, number>;
    spiceLevel?: number;
  };
  recentMealNames?: string[];
}

export function buildMealGenerationPrompt(
  prefs: UserPreferences,
  tasteSignals?: MealGenerationPromptData["tasteSignals"],
  recentMealNames?: string[]
): MealGenerationPromptData {
  const foodPreferences: string[] = [];

  // Calculate total meals per week based on selected meal types
  const totalMealsPerWeek = prefs.mealTypes.length * 7;

  // Map DB frequency fields to AI-friendly descriptions with actual counts
  if (prefs.chickenFrequency > 0) {
    const times = Math.min(prefs.chickenFrequency, totalMealsPerWeek);
    foodPreferences.push(
      `chicken and poultry: ${times} times per week (${frequencyMap[Math.min(4, Math.floor(prefs.chickenFrequency / 5))]})`
    );
  }

  if (prefs.redMeatFrequency > 0) {
    const times = Math.min(prefs.redMeatFrequency, totalMealsPerWeek);
    foodPreferences.push(
      `red meat (beef, pork, lamb): ${times} times per week (${frequencyMap[Math.min(4, Math.floor(prefs.redMeatFrequency / 5))]})`
    );
  }

  if (prefs.fishFrequency > 0) {
    const times = Math.min(prefs.fishFrequency, totalMealsPerWeek);
    foodPreferences.push(
      `fish and seafood: ${times} times per week (${frequencyMap[Math.min(4, Math.floor(prefs.fishFrequency / 5))]})`
    );
  }

  if (prefs.vegetarianFrequency > 0) {
    const times = Math.min(prefs.vegetarianFrequency, totalMealsPerWeek);
    foodPreferences.push(
      `vegetarian meals: ${times} times per week (${frequencyMap[Math.min(4, Math.floor(prefs.vegetarianFrequency / 5))]})`
    );
  }

  return {
    familySize: prefs.familySize,
    mealTypes: prefs.mealTypes,
    cuisines: prefs.cuisines,
    flavors: prefs.flavors,
    dietaryRestrictions: prefs.dietaryRestrictions,
    foodPreferences,
    cookingTime: prefs.cookingTime,
    spiceLevel: prefs.spiceLevel,
    kidFriendly: prefs.kidFriendly,
    commonDislikes: prefs.commonDislikes,
    customDislikes: prefs.customDislikes || undefined,
    country: prefs.country || undefined,
    tasteSignals,
    recentMealNames,
  };
}

export function formatPromptForAI(data: MealGenerationPromptData): string {
  const totalMeals = data.mealTypes.length * 7;
  const mealTypesStr = data.mealTypes.map(t => t.toUpperCase()).join(", ");
  
  let prompt = `Generate a complete 7-day meal plan with ${mealTypesStr} for each day (${totalMeals} meals total) for a family of ${data.familySize}.

Meal types to generate: ${mealTypesStr}
Cuisine preferences: ${data.cuisines.join(", ")}
Flavor preferences: ${data.flavors.join(", ")}`;

  if (data.dietaryRestrictions && data.dietaryRestrictions.length > 0) {
    prompt += `\nDietary restrictions: ${data.dietaryRestrictions.join(", ")}`;
  }

  if (data.foodPreferences.length > 0) {
    prompt += `\nFood frequency preferences (MUST be respected): ${data.foodPreferences.join(", ")}`;
  }

  // Add cooking time preference
  const cookingTimeMap: Record<string, string> = {
    quick: "Prefer quick meals (under 30 minutes total)",
    medium: "Mix of quick and moderate cooking times (30-45 minutes)",
    elaborate: "Can include elaborate meals (up to 60+ minutes)"
  };
  prompt += `\nCooking time preference: ${cookingTimeMap[data.cookingTime] || cookingTimeMap.medium}`;

  // Add spice level
  const spiceLevelMap: Record<string, string> = {
    mild: "No spicy food, keep all meals mild",
    medium: "Moderate spice level, some mildly spicy dishes OK",
    hot: "Include spicy dishes, hot spice level",
    "extra-hot": "Very spicy dishes welcome, extra-hot spice level"
  };
  prompt += `\nSpice level: ${spiceLevelMap[data.spiceLevel] || spiceLevelMap.medium}`;

  // Add kid-friendly constraint
  if (data.kidFriendly) {
    prompt += `\nKid-friendly: Yes - avoid exotic ingredients, complex flavors, and very spicy food. Keep meals simple and appealing to children.`;
  }

  // Add dislikes
  if (data.commonDislikes && data.commonDislikes.length > 0) {
    prompt += `\nAvoid these ingredients: ${data.commonDislikes.join(", ")}`;
  }
  if (data.customDislikes) {
    prompt += `\nAdditional dislikes: ${data.customDislikes}`;
  }

  // Add country for seasonal/local ingredients
  if (data.country) {
    prompt += `\nCountry: ${data.country} - prefer seasonal and locally available ingredients`;
  }

  if (data.tasteSignals) {
    if (data.tasteSignals.likedDishes.length > 0) {
      prompt += `\nUser likes: ${data.tasteSignals.likedDishes.slice(0, 10).join(", ")}`;
    }
    if (data.tasteSignals.dislikedDishes.length > 0) {
      prompt += `\nUser dislikes: ${data.tasteSignals.dislikedDishes.slice(0, 10).join(", ")}`;
    }
  }

  if (data.recentMealNames && data.recentMealNames.length > 0) {
    prompt += `\nAvoid repeating these recent meals: ${data.recentMealNames.join(", ")}`;
  }

  // Build meal type requirements
  const mealTypeRequirements = data.mealTypes.map(type => {
    const timeMap: Record<string, string> = {
      breakfast: "quick (10-20 mins)",
      lunch: "moderate (15-30 mins)",
      dinner: "can be longer (30-60 mins)"
    };
    return `7 ${type}s (${timeMap[type]})`;
  }).join(", ");

  prompt += `

IMPORTANT REQUIREMENTS:
1. Generate exactly ${totalMeals} meals: ${mealTypeRequirements}
2. Each meal MUST include a "mealType" field: one of [${data.mealTypes.map(t => `"${t}"`).join(", ")}]
3. Each meal MUST include a "day" field: "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"
4. Each meal MUST include an "emoji" field with an appropriate food emoji
5. STRICTLY respect food frequency preferences - count protein types across all meals
6. Keep descriptions SHORT (max 160 characters)
7. DO NOT include ingredients or instructions (will be generated separately on-demand)
8. Ensure variety - no meal should repeat within the week
9. Balance nutrition across the week

Return a COMPACT JSON array of ${totalMeals} meal objects with this exact structure:
{
  "day": "monday",
  "mealType": "${data.mealTypes[0]}",
  "name": "Oatmeal with Berries",
  "description": "Creamy oats topped with fresh berries and honey",
  "prepTime": "5 mins",
  "cookTime": "10 mins",
  "difficulty": "easy",
  "tags": ["healthy", "quick", "vegetarian"],
  "emoji": "🥣",
  "recipeId": "mon-breakfast-001"
}

NOTE: Keep output compact! No ingredients, no instructions. Total output should be ~1500-2500 tokens.`;

  return prompt;
}
