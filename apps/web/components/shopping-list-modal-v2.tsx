'use client';

import { Button } from './ui/button';
import { useState, useEffect, useRef, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import type { Meal } from '@/server/db/schema';
import { parseIngredient, aggregateIngredients, formatQuantity } from '@/lib/ingredient-parser';
import { assignCategory, getCategoryConfig, sortByCategory, type IngredientCategory } from '@/lib/ingredient-categories';

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

interface ShoppingItem {
  id: string;
  name: string;
  normalizedName: string;
  totalQuantity: number;
  unit: string;
  category: IngredientCategory;
  usedInMeals: string[];
  checked: boolean;
}

const CONCURRENCY_LIMIT = 3;
const STORAGE_KEY = 'familyplate_shopping_list_checked';

export function ShoppingListModalV2({ meals, onClose }: ShoppingListModalProps) {
  const [mealsList, setMealsList] = useState<MealWithIngredients[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [totalToLoad, setTotalToLoad] = useState(0);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [selectedMealTypes, setSelectedMealTypes] = useState<Set<string>>(
    new Set(['breakfast', 'lunch', 'dinner'])
  );
  const [viewMode, setViewMode] = useState<'consolidated' | 'by-meal'>('consolidated');
  const abortControllerRef = useRef<AbortController | null>(null);

  const getRecipeDetailsMutation = trpc.mealPlanning.getRecipeDetails.useMutation();

  // Load checked state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCheckedItems(new Set(JSON.parse(stored)));
      }
    } catch (err) {
      console.error('Failed to load checked state:', err);
    }
  }, []);

  // Save checked state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(checkedItems)));
    } catch (err) {
      console.error('Failed to save checked state:', err);
    }
  }, [checkedItems]);

  useEffect(() => {
    abortControllerRef.current = new AbortController();
    initializeAndLoadIngredients();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const initializeAndLoadIngredients = async () => {
    const initialMeals: MealWithIngredients[] = meals.map(meal => ({
      meal,
      ingredients: meal.ingredients && meal.ingredients.length > 0 ? meal.ingredients : null,
      isLoading: false,
      error: null,
    }));

    setMealsList(initialMeals);

    const mealsToLoad = initialMeals
      .map((m, index) => ({ ...m, originalIndex: index }))
      .filter(m => !m.ingredients && m.meal.recipeId);
    
    setTotalToLoad(mealsToLoad.length);
    setLoadedCount(0);
    setFailedCount(0);

    if (mealsToLoad.length === 0) {
      return;
    }

    await loadIngredientsWithConcurrency(mealsToLoad);
  };

  const loadIngredientsWithConcurrency = async (
    mealsToLoad: Array<MealWithIngredients & { originalIndex: number }>
  ) => {
    const queue = [...mealsToLoad];
    const activePromises: Promise<void>[] = [];

    while (queue.length > 0 || activePromises.length > 0) {
      if (abortControllerRef.current?.signal.aborted) {
        break;
      }

      while (activePromises.length < CONCURRENCY_LIMIT && queue.length > 0) {
        const mealToLoad = queue.shift()!;
        const promise = loadSingleMeal(mealToLoad).finally(() => {
          const index = activePromises.indexOf(promise);
          if (index > -1) {
            activePromises.splice(index, 1);
          }
        });
        activePromises.push(promise);
      }

      if (activePromises.length > 0) {
        await Promise.race(activePromises);
      }
    }
  };

  const loadSingleMeal = async (
    mealToLoad: MealWithIngredients & { originalIndex: number }
  ) => {
    const mealIndex = mealToLoad.originalIndex;

    if (abortControllerRef.current?.signal.aborted) {
      return;
    }

    setMealsList(prev => prev.map((m, idx) => 
      idx === mealIndex ? { ...m, isLoading: true } : m
    ));

    try {
      const details = await getRecipeDetailsMutation.mutateAsync({ 
        recipeId: mealToLoad.meal.recipeId! 
      });

      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setMealsList(prev => prev.map((m, idx) => 
        idx === mealIndex 
          ? { ...m, ingredients: details.ingredients, isLoading: false, error: null }
          : m
      ));

      setLoadedCount(prev => prev + 1);
    } catch (err) {
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      console.error(`Failed to load ingredients for ${mealToLoad.meal.name}:`, err);
      
      setMealsList(prev => prev.map((m, idx) => 
        idx === mealIndex 
          ? { ...m, isLoading: false, error: 'Failed to load' }
          : m
      ));

      setFailedCount(prev => prev + 1);
      setLoadedCount(prev => prev + 1);
    }
  };

  // Compute consolidated shopping list
  const consolidatedList = useMemo(() => {
    // Filter meals by selected meal types
    const filteredMeals = mealsList.filter(m => 
      m.ingredients && 
      m.meal.mealType &&
      selectedMealTypes.has(m.meal.mealType)
    );

    // Parse and aggregate ingredients
    const ingredientsWithMeals = filteredMeals.flatMap(m => 
      m.ingredients!.map(ing => ({
        parsed: parseIngredient(ing),
        mealName: m.meal.name,
      }))
    );

    const aggregated = aggregateIngredients(ingredientsWithMeals);

    // Convert to ShoppingItem array with categories
    const items: ShoppingItem[] = [];
    aggregated.forEach((agg, normalizedName) => {
      const category = assignCategory(normalizedName);
      items.push({
        id: normalizedName,
        name: agg.name,
        normalizedName: agg.normalizedName,
        totalQuantity: agg.totalQuantity,
        unit: agg.unit,
        category,
        usedInMeals: agg.usedInMeals,
        checked: checkedItems.has(normalizedName),
      });
    });

    // Sort by category
    return sortByCategory(items);
  }, [mealsList, selectedMealTypes, checkedItems]);

  // Group by category
  const itemsByCategory = useMemo(() => {
    const grouped = new Map<IngredientCategory, ShoppingItem[]>();
    
    for (const item of consolidatedList) {
      if (!grouped.has(item.category)) {
        grouped.set(item.category, []);
      }
      grouped.get(item.category)!.push(item);
    }
    
    return grouped;
  }, [consolidatedList]);

  const toggleCheck = (itemId: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const toggleMealType = (mealType: string) => {
    setSelectedMealTypes(prev => {
      const next = new Set(prev);
      if (next.has(mealType)) {
        next.delete(mealType);
      } else {
        next.add(mealType);
      }
      return next;
    });
  };

  const copyConsolidatedList = () => {
    const lines: string[] = [];
    
    itemsByCategory.forEach((items, category) => {
      const config = getCategoryConfig(category);
      lines.push(`${config.emoji} ${config.name}`);
      items.forEach(item => {
        const quantity = formatQuantity(item.totalQuantity, item.unit);
        lines.push(`- ${item.name} (${quantity})`);
      });
      lines.push(''); // Empty line between categories
    });
    
    navigator.clipboard.writeText(lines.join('\n'));
    alert('Shopping list copied to clipboard!');
  };

  const retryFailed = () => {
    const failedMeals = mealsList
      .map((m, index) => ({ ...m, originalIndex: index }))
      .filter(m => m.error);

    if (failedMeals.length === 0) return;

    setMealsList(prev => prev.map(m => 
      m.error ? { ...m, error: null, isLoading: false } : m
    ));

    setTotalToLoad(failedMeals.length);
    setLoadedCount(0);
    setFailedCount(0);

    loadIngredientsWithConcurrency(failedMeals);
  };

  const isStillLoading = mealsList.some(m => m.isLoading);
  const hasErrors = failedCount > 0;
  const mealsWithIngredients = mealsList.filter(m => m.ingredients && m.ingredients.length > 0);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-background rounded-3xl max-h-[90vh] w-full max-w-4xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-background rounded-t-3xl border-b border-border">
          <div className="flex justify-between items-start px-6 pt-6 pb-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">🛒 Shopping List</h2>
              <p className="text-sm text-muted mt-1">
                Everything you need for this week – already organized.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-muted hover:text-foreground transition-colors"
            >
              <span className="text-3xl leading-none">×</span>
            </button>
          </div>

          {/* Loading Progress */}
          {isStillLoading && totalToLoad > 0 && (
            <div className="px-6 pb-4">
              <div className="flex items-center gap-2 text-sm text-muted mb-2">
                <span className="animate-pulse">Loading {loadedCount} of {totalToLoad} meals...</span>
                {failedCount > 0 && (
                  <span className="text-destructive">({failedCount} failed)</span>
                )}
              </div>
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

          {/* Filters (Meal Types) */}
          {!isStillLoading && mealsWithIngredients.length > 0 && (
            <div className="px-6 pb-4 flex flex-wrap gap-2">
              {['breakfast', 'lunch', 'dinner'].map(type => {
                const isSelected = selectedMealTypes.has(type);
                const hasMeals = mealsList.some(m => m.meal.mealType === type && m.ingredients);
                
                if (!hasMeals) return null;
                
                return (
                  <button
                    key={type}
                    onClick={() => toggleMealType(type)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-surface text-muted hover:bg-surface/80'
                    }`}
                  >
                    {isSelected ? '✓' : ''} {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                );
              })}
              
              {/* View Toggle */}
              <button
                onClick={() => setViewMode(prev => prev === 'consolidated' ? 'by-meal' : 'consolidated')}
                className="ml-auto px-3 py-1.5 rounded-lg text-sm font-medium bg-surface text-foreground hover:bg-surface/80 transition-all"
              >
                {viewMode === 'consolidated' ? '↳ View by meals' : '↲ View consolidated'}
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {mealsWithIngredients.length === 0 && !isStillLoading && !hasErrors ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-foreground font-semibold mb-2">No ingredients yet</p>
              <p className="text-muted text-sm max-w-md">
                Generate a meal plan to create your shopping list.
              </p>
            </div>
          ) : viewMode === 'consolidated' ? (
            // CONSOLIDATED VIEW (Default)
            <div className="space-y-6">
              {Array.from(itemsByCategory.entries()).map(([category, items]) => {
                const config = getCategoryConfig(category);
                return (
                  <div key={category}>
                    {/* Category Header (Sticky) */}
                    <div className="sticky top-0 z-10 bg-background backdrop-blur-sm py-3 mb-3 border-b border-border -mx-6 px-6">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{config.emoji}</span>
                        <h3 className="font-bold text-foreground">{config.name}</h3>
                        <span className="text-sm text-muted">· {items.length} item{items.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-2">
                      {items.map(item => (
                        <div
                          key={item.id}
                          className={`flex items-start gap-3 p-3 rounded-lg bg-surface border border-border transition-all ${
                            item.checked ? 'opacity-50' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <button
                            onClick={() => toggleCheck(item.id)}
                            className="flex-shrink-0 mt-0.5"
                          >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                              item.checked
                                ? 'bg-primary border-primary'
                                : 'border-muted hover:border-foreground'
                            }`}>
                              {item.checked && (
                                <span className="text-primary-foreground text-xs">✓</span>
                              )}
                            </div>
                          </button>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className={`font-medium ${item.checked ? 'line-through' : ''}`}>
                                {item.name}
                              </span>
                              <span className="text-sm text-muted">
                                {formatQuantity(item.totalQuantity, item.unit)}
                              </span>
                            </div>
                            {item.usedInMeals.length > 1 && (
                              <p className="text-xs text-muted mt-1">
                                Used in {item.usedInMeals.length} meals
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // BY-MEAL VIEW (Secondary)
            <div className="space-y-4">
              {mealsWithIngredients.map((item, index) => (
                <div 
                  key={index} 
                  className="bg-surface rounded-2xl p-4 border border-border"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{item.meal.emoji || '🍽️'}</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground">{item.meal.name}</h3>
                      <p className="text-xs text-muted capitalize">{item.meal.mealType} • {item.meal.day}</p>
                    </div>
                  </div>
                  
                  <ul className="space-y-1.5">
                    {item.ingredients!.map((ingredient, i) => (
                      <li key={i} className="text-sm text-foreground flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {mealsWithIngredients.length > 0 && !isStillLoading && (
          <div className="px-6 py-4 border-t border-border flex gap-3">
            {viewMode === 'consolidated' && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={copyConsolidatedList}
              >
                📋 Copy Shopping List
              </Button>
            )}
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
