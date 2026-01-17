'use client';

import { Button } from './ui/button';
import { useState, useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import type { Meal } from '@/server/db/schema';

type ShoppingListModalProps = {
  meals: Meal[];
  onClose: () => void;
  weekStartDate?: string; // To determine today's meals
};

type MealWithIngredients = {
  meal: Meal;
  ingredients: string[] | null;
  isLoading: boolean;
  error: string | null;
};

const CONCURRENCY_LIMIT = 3;

export function ShoppingListModal({ meals, onClose, weekStartDate }: ShoppingListModalProps) {
  const [mealsList, setMealsList] = useState<MealWithIngredients[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [totalToLoad, setTotalToLoad] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const getRecipeDetailsMutation = trpc.mealPlanning.getRecipeDetails.useMutation();

  useEffect(() => {
    // Create abort controller for cleanup
    abortControllerRef.current = new AbortController();
    
    initializeAndLoadIngredients();

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
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
    const mealsToLoad = initialMeals
      .map((m, index) => ({ ...m, originalIndex: index }))
      .filter(m => !m.ingredients && m.meal.recipeId);
    
    setTotalToLoad(mealsToLoad.length);
    setLoadedCount(0);
    setFailedCount(0);

    if (mealsToLoad.length === 0) {
      return; // All meals already have ingredients
    }

    // Load with controlled concurrency
    await loadIngredientsWithConcurrency(mealsToLoad);
  };

  const loadIngredientsWithConcurrency = async (
    mealsToLoad: Array<MealWithIngredients & { originalIndex: number }>
  ) => {
    const queue = [...mealsToLoad];
    const activePromises: Promise<void>[] = [];

    while (queue.length > 0 || activePromises.length > 0) {
      // Check if aborted
      if (abortControllerRef.current?.signal.aborted) {
        break;
      }

      // Fill up to concurrency limit
      while (activePromises.length < CONCURRENCY_LIMIT && queue.length > 0) {
        const mealToLoad = queue.shift()!;
        const promise = loadSingleMeal(mealToLoad).finally(() => {
          // Remove from active promises when done
          const index = activePromises.indexOf(promise);
          if (index > -1) {
            activePromises.splice(index, 1);
          }
        });
        activePromises.push(promise);
      }

      // Wait for at least one to complete
      if (activePromises.length > 0) {
        await Promise.race(activePromises);
      }
    }
  };

  const loadSingleMeal = async (
    mealToLoad: MealWithIngredients & { originalIndex: number }
  ) => {
    const mealIndex = mealToLoad.originalIndex;

    // Check if aborted before starting
    if (abortControllerRef.current?.signal.aborted) {
      return;
    }

    // Mark as loading
    setMealsList(prev => prev.map((m, idx) => 
      idx === mealIndex ? { ...m, isLoading: true } : m
    ));

    try {
      const details = await getRecipeDetailsMutation.mutateAsync({ 
        recipeId: mealToLoad.meal.recipeId! 
      });

      // Check if aborted after loading
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      // Update with loaded ingredients
      setMealsList(prev => prev.map((m, idx) => 
        idx === mealIndex 
          ? { ...m, ingredients: details.ingredients, isLoading: false, error: null }
          : m
      ));

      setLoadedCount(prev => prev + 1);
    } catch (err) {
      // Check if aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      console.error(`Failed to load ingredients for ${mealToLoad.meal.name}:`, err);
      
      // Mark as error
      setMealsList(prev => prev.map((m, idx) => 
        idx === mealIndex 
          ? { ...m, isLoading: false, error: 'Failed to load' }
          : m
      ));

      setFailedCount(prev => prev + 1);
      setLoadedCount(prev => prev + 1); // Count as "processed"
    }
  };

  const retryFailed = () => {
    // Reset failed meals and retry
    const failedMeals = mealsList
      .map((m, index) => ({ ...m, originalIndex: index }))
      .filter(m => m.error);

    if (failedMeals.length === 0) return;

    // Reset error state
    setMealsList(prev => prev.map(m => 
      m.error ? { ...m, error: null, isLoading: false } : m
    ));

    // Reset counters
    setTotalToLoad(failedMeals.length);
    setLoadedCount(0);
    setFailedCount(0);

    // Retry loading
    loadIngredientsWithConcurrency(failedMeals);
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
  const hasErrors = failedCount > 0;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-background rounded-3xl max-h-[90vh] w-full max-w-3xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-background rounded-t-3xl border-b border-border">
          <div className="flex justify-between items-center px-6 pt-6 pb-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">📝 Shopping List</h2>
              <div className="text-sm text-muted mt-1">
                {isStillLoading ? (
                  <div className="flex items-center gap-2">
                    <span className="animate-pulse">Loading ingredients...</span>
                    {failedCount > 0 && (
                      <span className="text-destructive">({failedCount} failed)</span>
                    )}
                  </div>
                ) : hasErrors ? (
                  <span className="text-destructive">
                    {failedCount} meal{failedCount !== 1 ? 's' : ''} failed to load
                  </span>
                ) : (
                  <>
                    <span className="font-medium text-foreground">
                      {mealsWithIngredients.reduce((total, m) => total + (m.ingredients?.length || 0), 0)} items
                    </span>
                    {' • '}
                    {mealsWithIngredients.length} meal{mealsWithIngredients.length !== 1 ? 's' : ''}
                  </>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-muted hover:text-foreground transition-colors"
            >
              <span className="text-3xl leading-none">×</span>
            </button>
          </div>

          {/* Progress Bar */}
          {isStillLoading && totalToLoad > 0 && (
            <div className="px-6 pb-4">
              <div className="w-full bg-surface rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-300 ease-out"
                  style={{ width: `${(loadedCount / totalToLoad) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Retry Button */}
          {!isStillLoading && hasErrors && (
            <div className="px-6 pb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={retryFailed}
                className="w-full"
              >
                🔄 Retry Failed ({failedCount})
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {mealsWithIngredients.length === 0 && !isStillLoading && !hasErrors ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-foreground font-semibold mb-2">No ingredients available</p>
              <p className="text-muted text-sm max-w-md">
                Unable to load ingredients for your meals. Please try again later.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {mealsList.map((item, index) => {
                if (!item.ingredients && !item.isLoading && !item.error) {
                  return null; // Skip meals without ingredients that aren't loading
                }

                return (
                  <div 
                    key={index} 
                    className={`bg-surface rounded-2xl p-4 border transition-all ${
                      item.isLoading 
                        ? 'border-primary/50 animate-pulse' 
                        : item.error 
                        ? 'border-destructive/50' 
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{item.meal.emoji || '🍽️'}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-foreground">{item.meal.name}</h3>
                          {(() => {
                            // Check if this meal is today
                            if (!weekStartDate) return null;
                            const today = new Date();
                            const dayIndex = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].indexOf(item.meal.day?.toLowerCase() || '');
                            if (dayIndex === -1) return null;
                            const mealDate = new Date(weekStartDate);
                            mealDate.setDate(mealDate.getDate() + dayIndex);
                            const isToday = mealDate.toDateString() === today.toDateString();
                            return isToday ? (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground font-medium">
                                Today
                              </span>
                            ) : null;
                          })()}
                        </div>
                        <p className="text-xs text-muted capitalize">{item.meal.mealType} • {item.meal.day}</p>
                      </div>
                      {item.isLoading && (
                        <div className="text-xs text-muted flex items-center gap-1">
                          <span className="animate-spin">🔄</span>
                          Loading...
                        </div>
                      )}
                    </div>
                    
                    {item.isLoading ? (
                      <div className="space-y-2">
                        <div className="h-4 bg-muted/20 rounded animate-pulse" />
                        <div className="h-4 bg-muted/20 rounded animate-pulse w-3/4" />
                        <div className="h-4 bg-muted/20 rounded animate-pulse w-5/6" />
                      </div>
                    ) : item.error ? (
                      <div className="text-sm text-destructive flex items-center gap-2">
                        <span>⚠️</span>
                        <span>{item.error}</span>
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
