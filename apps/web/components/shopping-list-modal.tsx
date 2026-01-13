'use client';

import { Button } from './ui/button';
import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import type { Meal } from '@/server/db/schema';

type ShoppingListModalProps = {
  meals: Meal[];
  onClose: () => void;
};

export function ShoppingListModal({ meals, onClose }: ShoppingListModalProps) {
  const [ingredientsByMeal, setIngredientsByMeal] = useState<{ meal: Meal; ingredients: string[] }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getRecipeDetailsMutation = trpc.mealPlanning.getRecipeDetails.useMutation();

  useEffect(() => {
    loadAllIngredients();
  }, []);

  const loadAllIngredients = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results: { meal: Meal; ingredients: string[] }[] = [];
      
      for (const meal of meals) {
        // Skip if meal already has ingredients
        if (meal.ingredients && meal.ingredients.length > 0) {
          results.push({ meal, ingredients: meal.ingredients });
          continue;
        }
        
        // Load ingredients from API
        if (meal.recipeId) {
          try {
            const details = await getRecipeDetailsMutation.mutateAsync({ recipeId: meal.recipeId });
            results.push({ meal, ingredients: details.ingredients });
          } catch (err) {
            console.error(`Failed to load ingredients for ${meal.name}:`, err);
            results.push({ meal, ingredients: ['Failed to load ingredients'] });
          }
        }
      }
      
      setIngredientsByMeal(results);
    } catch (err) {
      console.error('Failed to load shopping list:', err);
      setError('Failed to load shopping list. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    const text = ingredientsByMeal
      .map(({ meal, ingredients }) => {
        return `${meal.name}\n${ingredients.map(i => `• ${i}`).join('\n')}\n`;
      })
      .join('\n');
    
    navigator.clipboard.writeText(text);
    alert('Shopping list copied to clipboard!');
  };

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
            <p className="text-sm text-muted mt-1">Ingredients for this week's meals</p>
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
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-4xl mb-4">🔄</div>
              <p className="text-muted">Loading ingredients...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-4xl mb-4">❌</div>
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={loadAllIngredients}>Retry</Button>
            </div>
          ) : (
            <div className="space-y-6">
              {ingredientsByMeal.map(({ meal, ingredients }, index) => (
                <div key={index} className="bg-surface rounded-2xl p-4 border border-border">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{meal.emoji || '🍽️'}</span>
                    <div>
                      <h3 className="font-bold text-foreground">{meal.name}</h3>
                      <p className="text-xs text-muted capitalize">{meal.mealType} • {meal.day}</p>
                    </div>
                  </div>
                  <ul className="space-y-1.5">
                    {ingredients.map((ingredient, i) => (
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
        {!isLoading && !error && (
          <div className="px-6 py-4 border-t border-border flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={copyToClipboard}
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
