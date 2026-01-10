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
  cuisines: string[];
  flavors: string[];
  dietaryRestrictions?: string[];
  foodPreferences: string[];
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

  // Map DB frequency fields to AI-friendly descriptions
  if (prefs.redMeatFrequency !== 2) {
    foodPreferences.push(
      `red meat (beef, pork, lamb): ${frequencyMap[prefs.redMeatFrequency]}`
    );
  }

  if (prefs.chickenFrequency !== 2) {
    foodPreferences.push(
      `chicken and poultry: ${frequencyMap[prefs.chickenFrequency]}`
    );
  }

  if (prefs.fishFrequency !== 2) {
    foodPreferences.push(
      `fish and seafood: ${frequencyMap[prefs.fishFrequency]}`
    );
  }

  if (prefs.vegetarianFrequency > 2) {
    foodPreferences.push(
      `vegetarian meals: ${frequencyMap[prefs.vegetarianFrequency]}`
    );
  }

  // Derive vegan preference from vegetarian frequency
  if (prefs.vegetarianFrequency >= 4) {
    foodPreferences.push("vegan meals: sometimes");
  }

  return {
    familySize: prefs.familySize,
    cuisines: prefs.cuisines,
    flavors: prefs.flavors,
    dietaryRestrictions: prefs.dietaryRestrictions,
    foodPreferences,
    tasteSignals,
    recentMealNames,
  };
}

export function formatPromptForAI(data: MealGenerationPromptData): string {
  let prompt = `Generate a 7-day dinner meal plan for a family of ${data.familySize}.

Cuisine preferences: ${data.cuisines.join(", ")}
Flavor preferences: ${data.flavors.join(", ")}`;

  if (data.dietaryRestrictions && data.dietaryRestrictions.length > 0) {
    prompt += `\nDietary restrictions: ${data.dietaryRestrictions.join(", ")}`;
  }

  if (data.foodPreferences.length > 0) {
    prompt += `\nFood frequency preferences: ${data.foodPreferences.join(", ")}`;
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

  prompt += `\n\nReturn a JSON array of 7 meal objects with: name, description, prepTime, cookTime, ingredients[], instructions[], tags[].`;

  return prompt;
}
