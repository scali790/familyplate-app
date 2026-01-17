import type { Meal } from '@/server/db/schema';
import type { CookingStep, Ingredient } from '@/types/cook-mode';

/**
 * Generate Cooking Steps (MVP Version with Mock Data)
 * 
 * TODO: Replace with OpenAI integration in production
 * 
 * For MVP, this generates realistic mock steps based on meal type and prep time.
 * In production, this should call OpenAI to generate personalized steps.
 */
export function generateCookingSteps(meal: Meal): {
  steps: CookingStep[];
  ingredients: Ingredient[];
} {
  // Parse prep time to estimate number of steps
  const prepTimeMatch = meal.prepTime?.match(/(\d+)/);
  const prepMinutes = prepTimeMatch ? parseInt(prepTimeMatch[1]) : 15;
  
  // Estimate step count based on prep time
  const stepCount = Math.max(3, Math.min(7, Math.floor(prepMinutes / 5)));

  // Generate mock ingredients
  const ingredients: Ingredient[] = generateMockIngredients(meal);

  // Generate mock steps
  const steps: CookingStep[] = generateMockSteps(meal, stepCount);

  return { steps, ingredients };
}

function generateMockIngredients(meal: Meal): Ingredient[] {
  // TODO: In production, extract from meal.ingredients or generate via OpenAI
  
  const mealType = meal.mealType?.toLowerCase();
  
  // Mock ingredients based on meal type
  if (mealType === 'breakfast') {
    return [
      { id: '1', name: 'Eggs', quantity: '2', unit: 'pieces', displayText: '2 eggs' },
      { id: '2', name: 'Butter', quantity: '1', unit: 'tbsp', displayText: '1 tbsp butter' },
      { id: '3', name: 'Salt', quantity: '1', unit: 'pinch', displayText: 'Salt to taste' },
      { id: '4', name: 'Pepper', quantity: '1', unit: 'pinch', displayText: 'Pepper to taste' },
    ];
  }
  
  if (mealType === 'lunch') {
    return [
      { id: '1', name: 'Pasta', quantity: '200', unit: 'g', displayText: '200g pasta' },
      { id: '2', name: 'Olive oil', quantity: '2', unit: 'tbsp', displayText: '2 tbsp olive oil' },
      { id: '3', name: 'Garlic', quantity: '2', unit: 'cloves', displayText: '2 cloves garlic' },
      { id: '4', name: 'Tomatoes', quantity: '3', unit: 'pieces', displayText: '3 tomatoes' },
      { id: '5', name: 'Basil', quantity: '1', unit: 'handful', displayText: 'Fresh basil' },
    ];
  }
  
  // Default (dinner or other)
  return [
    { id: '1', name: 'Main ingredient', quantity: '300', unit: 'g', displayText: '300g main ingredient' },
    { id: '2', name: 'Vegetables', quantity: '200', unit: 'g', displayText: '200g vegetables' },
    { id: '3', name: 'Spices', quantity: '1', unit: 'tsp', displayText: 'Spices to taste' },
    { id: '4', name: 'Oil', quantity: '2', unit: 'tbsp', displayText: '2 tbsp oil' },
  ];
}

function generateMockSteps(meal: Meal, stepCount: number): CookingStep[] {
  // TODO: In production, generate via OpenAI based on meal details
  
  const mealType = meal.mealType?.toLowerCase();
  const steps: CookingStep[] = [];

  // Step 1: Preparation
  steps.push({
    id: '1',
    stepNumber: 1,
    title: 'Vorbereitung',
    description: 'Alle Zutaten bereitstellen und vorbereiten. Arbeitsfläche sauber machen.',
    icon: '📋',
    duration: 120, // 2 minutes
    timerRequired: false,
  });

  // Step 2: Specific to meal type
  if (mealType === 'breakfast') {
    steps.push({
      id: '2',
      stepNumber: 2,
      title: 'Pfanne erhitzen',
      description: 'Butter in einer Pfanne bei mittlerer Hitze schmelzen lassen.',
      icon: '🔥',
      duration: 60,
      timerRequired: false,
    });
  } else {
    steps.push({
      id: '2',
      stepNumber: 2,
      title: 'Zutaten schneiden',
      description: 'Alle Zutaten in mundgerechte Stücke schneiden.',
      icon: '🔪',
      duration: 180,
      timerRequired: false,
    });
  }

  // Step 3: Cooking with timer
  if (stepCount >= 3) {
    steps.push({
      id: '3',
      stepNumber: 3,
      title: 'Kochen',
      description: 'Bei mittlerer Hitze kochen bis alles gar ist.',
      icon: '👨‍🍳',
      duration: 300, // 5 minutes
      timerRequired: true,
      tip: 'Regelmäßig umrühren für gleichmäßiges Garen',
    });
  }

  // Step 4: Additional cooking steps
  for (let i = 4; i <= stepCount - 1; i++) {
    steps.push({
      id: String(i),
      stepNumber: i,
      title: `Schritt ${i}`,
      description: 'Weiter kochen und würzen nach Geschmack.',
      icon: '🍳',
      duration: 120,
      timerRequired: false,
    });
  }

  // Final step: Plating
  steps.push({
    id: String(stepCount),
    stepNumber: stepCount,
    title: 'Anrichten',
    description: 'Auf Tellern anrichten und servieren. Guten Appetit!',
    icon: '🍽️',
    duration: 60,
    timerRequired: false,
  });

  return steps;
}
