'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { trpc } from '@/lib/trpc';

import type { Meal } from '@/server/db/schema';

type RecipeModalProps = {
  meal: Meal | null;
  onClose: () => void;
};

// Food category icons mapping (from Expo app)
const getIconsForTags = (tags: string[]): string[] => {
  const iconMap: Record<string, string> = {
    beef: '🥩',
    chicken: '🍗',
    fish: '🐟',
    vegetarian: '🌱',
    vegan: '🥬',
    spicy: '🌶️',
    'kid-friendly': '👶',
    healthy: '🥗',
  };

  return tags.map(tag => iconMap[tag.toLowerCase()] || '').filter(Boolean);
};

export function RecipeModal({ meal, onClose }: RecipeModalProps) {
  const [recipeDetails, setRecipeDetails] = useState<{
    ingredients: Array<{ name: string; amount: string; category: string }>;
    instructions: string[];
  } | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateRecipeDetailsMutation = trpc.mealPlanning.generateRecipeDetails.useMutation();

  useEffect(() => {
    // Reset state when meal changes
    setRecipeDetails(null);
    setError(null);

    if (!meal) return;

    // Check if meal already has ingredients/instructions (old format)
    if (meal.ingredients && meal.ingredients.length > 0 && meal.instructions && meal.instructions.length > 0) {
      setRecipeDetails({
        ingredients: meal.ingredients,
        instructions: meal.instructions,
      });
      return;
    }

    // Generate recipe details on-demand
    const fetchRecipeDetails = async () => {
      setIsLoadingDetails(true);
      setError(null);

      try {
        const result = await generateRecipeDetailsMutation.mutateAsync({
          recipeId: (meal as any).recipeId || `${meal.day}-${meal.mealType}-${Date.now()}`,
          mealName: meal.name,
          mealType: meal.mealType,
          description: meal.description,
          difficulty: meal.difficulty,
          prepTime: meal.prepTime,
          cookTime: meal.cookTime,
        });

        setRecipeDetails({
          ingredients: result.ingredients,
          instructions: result.instructions,
        });
      } catch (err: any) {
        console.error('Failed to generate recipe details:', err);
        setError('Failed to load recipe details. Please try again.');
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchRecipeDetails();
  }, [meal]);

  if (!meal) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/85"
      onClick={onClose}
    >
      <div 
        className="bg-background rounded-t-3xl max-h-[92%] h-[92%] w-full max-w-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Compact Header */}
        <div className="flex justify-between items-start px-4 pt-4 pb-3 border-b border-border">
          <div className="flex-1 pr-3">
            <div className="flex items-center gap-2 mb-0.5">
              {meal.tags && meal.tags.length > 0 && (
                <span className="text-lg">{getIconsForTags(meal.tags).join(' ')}</span>
              )}
              <h2 className="text-lg font-bold text-foreground leading-6">{meal.name}</h2>
            </div>
            <p className="text-sm mt-0.5 text-muted line-clamp-2">{meal.description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 -mt-1 text-muted hover:text-foreground transition-colors"
          >
            <span className="text-3xl leading-none">×</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 pb-5">
          {/* Meal Info */}
          <div className="flex gap-2.5 mb-5 flex-wrap">
            <div className="px-3 py-1.5 rounded-2xl bg-surface flex items-center gap-1">
              <span className="text-sm">⏱️</span>
              <span className="font-semibold text-primary text-sm">Prep: {meal.prepTime}</span>
            </div>
            {meal.cookTime && (
              <div className="px-3 py-1.5 rounded-2xl bg-surface flex items-center gap-1">
                <span className="text-sm">🍳</span>
                <span className="font-semibold text-success text-sm">Cook: {meal.cookTime}</span>
              </div>
            )}
          </div>

          {/* Loading State */}
          {isLoadingDetails && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-muted text-sm">Generating recipe details...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-error/10 border border-error rounded-xl p-4 mb-5">
              <p className="text-error text-sm">{error}</p>
            </div>
          )}

          {/* Recipe Details */}
          {!isLoadingDetails && !error && recipeDetails && (
            <>
              {/* Ingredients */}
              <div className="mb-5">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <span className="text-lg">🛒</span>
                  <h3 className="text-lg font-bold text-foreground">Ingredients</h3>
                </div>
                <div className="rounded-xl p-3.5 bg-surface">
                  {recipeDetails.ingredients.length > 0 ? (
                    recipeDetails.ingredients.map((ingredient, index) => (
                      <div key={index} className="flex items-start mb-2">
                        <span className="mr-2 text-primary text-sm">•</span>
                        <span className="flex-1 text-foreground text-sm leading-5">
                          {ingredient.amount} {ingredient.name}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="italic text-muted text-sm">No ingredients listed</p>
                  )}
                </div>
              </div>

              {/* Instructions */}
              <div className="mb-4">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <span className="text-lg">👨‍🍳</span>
                  <h3 className="text-lg font-bold text-foreground">Instructions</h3>
                </div>
                <div className="space-y-3.5">
                  {recipeDetails.instructions.length > 0 ? (
                    recipeDetails.instructions.map((instruction, index) => (
                      <div key={index} className="flex items-start">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center mr-2.5 bg-primary flex-shrink-0">
                          <span className="font-bold text-white text-sm">{index + 1}</span>
                        </div>
                        <p className="flex-1 pt-1 text-foreground text-sm leading-5">{instruction}</p>
                      </div>
                    ))
                  ) : (
                    <p className="italic text-muted text-sm">No instructions available</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Close Button - Compact */}
        <div className="px-4 py-3 border-t border-border">
          <Button
            onClick={onClose}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-2xl"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
