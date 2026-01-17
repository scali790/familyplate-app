/**
 * Generate cooking steps and ingredients from meal data
 * 
 * This uses the REAL instructions from meal.instructions (source-of-truth)
 * NO MOCK DATA!
 */

import type { Meal } from '@/server/db/schema';
import type { CookingStep, Ingredient } from '@/types/cook-mode';
import { parseCookingInstructions, parseIngredients } from './parse-cooking-instructions';

/**
 * Generate cooking steps from meal data
 * 
 * Source-of-truth: meal.instructions (string[])
 * 
 * Returns:
 * - Step 0: Wash hands (always)
 * - Step 1-N: Real instructions from meal
 */
export function generateCookingSteps(meal: Meal): {
  steps: CookingStep[];
  ingredients: Ingredient[];
} {
  // Parse real instructions
  const steps = parseCookingInstructions(meal.instructions, 'en');

  // Parse real ingredients
  const ingredients = parseIngredients(meal.ingredients);

  return {
    steps,
    ingredients,
  };
}
