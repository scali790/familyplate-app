'use client';

import { Button } from './ui/button';
import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import type { Meal } from '@/server/db/schema';

type ShoppingListModalProps = {
  meals: Meal[];
  onClose: () => void;
};

type MealWithIngredients = {
  meal: Meal;
  ingredients: string[] | null;
  isLoading: boolean;
  error: string | null;
};

export function ShoppingListModal({ meals, onClose }: ShoppingListModalProps) {
  const [mealsList, setMealsList] = useState<MealWithIngredients[]>([]);
  const [loadingCount, setLoadingCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const getRecipeDetailsMutation = trpc.mealPlanning.getRecipeDetails.useMutation();

  useEffect(() => {
    initializeAndLoadIngredients();
  }, []);

  const initializeAndLoadIngredients = async () => {
    // Initialize all meals
    const initialMeals: MealWithIngredients[] = meals.map(meal => ({
      meal,
      ingredients: meal.ingredients && meal.ingredients.length > 0 ? meal.ingredients : null,
      isLoading: false,
      error: null,
    }));

    setMealsList(initialMeals);

    // Find meals that need loading
    const mealsToLoad = initialMeals.filter(m => !m.ingredients && m.meal.recipeId);
    setTotalCount(mealsToLoad.length);

    if (mealsToLoad.length === 0) {
      return; // All meals already have ingredients
    }

    // Load ingredients for meals that don't have them
    for (let i = 0; i < mealsToLoad.length; i++) {
      const mealToLoad = mealsToLoad[i];
      const mealIndex = initialMeals.findIndex(m => m.meal.recipeId === mealToLoad.meal.recipeId);

      // Mark as loading
      setMealsList(prev => prev.map((m, idx) => 
        idx === mealIndex ? { ...m, isLoading: true } : m
      ));

      try {
        const details = await getRecipeDetailsMutation.mutateAsync({ 
          recipeId: mealToLoad.meal.recipeId! 
        });

        // Update with loaded ingredients
        setMealsList(prev => prev.map((m, idx) => 
          idx === mealIndex 
            ? { ...m, ingredients: details.ingredients, isLoading: false, error: null }
            : m
        ));
      } catch (err) {
        console.error(`Failed to load ingredients for ${mealToLoad.meal.name}:`, err);
        
        // Mark as error
        setMealsList(prev => prev.map((m, idx) => 
          idx === mealIndex 
            ? { ...m, isLoading: false, error: 'Failed to load' }
            : m
        ));
      }

      setLoadingCount(i + 1);
    }
  };

  const copyToClipboard = () => {
    const text = mealsList
      .filter(m => m.ingredients && m.ingredients.length > 0)
      .map(({ meal, ingredients }) => {
        return `${meal.name}\n${ingredients!.map(i => `• ${i}`).join('\n')}\n`;
      })
      .join('\n');
    
    navigator.clipboard.writeText(text);
    alert('Shopping list copied to clipboard!');
  };

  const mealsWithIngredients = mealsList.filter(m => m.ingredients && m.ingredients.length > 0);
  const isStillLoading = mealsList.some(m => m.isLoading);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-background rounded-3xl max-h-[90vh] w-full max-w-3xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold text-foreground">📝 Shopping List</h2>
            <p className="text-sm text-muted mt-1">
              {isStillLoading 
                ? `Loading ingredients... ${loadingCount} of ${totalCount}`
                : `Ingredients for ${mealsWithIngredients.length} meal${mealsWithIngredients.length !== 1 ? 's' : ''}`
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted hover:text-foreground transition-colors"
          >
            <span className="text-3xl leading-none">×</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {mealsWithIngredients.length === 0 && !isStillLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-foreground font-semibold mb-2">No ingredients available</p>
              <p className="text-muted text-sm max-w-md">
                Unable to load ingredients for your meals. Please try again or view individual recipes.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {mealsList.map((item, index) => {
                if (!item.ingredients && !item.isLoading && !item.error) {
                  return null; // Skip meals without ingredients that aren't loading
                }

                return (
                  <div key={index} className="bg-surface rounded-2xl p-4 border border-border">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{item.meal.emoji || '🍽️'}</span>
                      <div className="flex-1">
                        <h3 className="font-bold text-foreground">{item.meal.name}</h3>
                        <p className="text-xs text-muted capitalize">{item.meal.mealType} • {item.meal.day}</p>
                      </div>
                      {item.isLoading && (
                        <div className="text-xs text-muted">Loading...</div>
                      )}
                    </div>
                    
                    {item.isLoading ? (
                      <div className="flex items-center gap-2 text-sm text-muted">
                        <div className="animate-spin">🔄</div>
                        <span>Loading ingredients...</span>
                      </div>
                    ) : item.error ? (
                      <div className="text-sm text-destructive">
                        ⚠️ {item.error}
                      </div>
                    ) : item.ingredients ? (
                      <ul className="space-y-1.5">
                        {item.ingredients.map((ingredient, i) => (
                          <li key={i} className="text-sm text-foreground flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            <span>{ingredient}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {mealsWithIngredients.length > 0 && (
          <div className="px-6 py-4 border-t border-border flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={copyToClipboard}
              disabled={isStillLoading}
            >
              📋 Copy to Clipboard
            </Button>
            <Button
              variant="default"
              className="flex-1"
              onClick={onClose}
            >
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
