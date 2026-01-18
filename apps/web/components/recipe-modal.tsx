'use client';

import { Button } from './ui/button';
import { useState, useEffect } from 'react';
import { trpc } from "@/lib/trpc";
import { EventName } from "@/lib/events";

import type { Meal } from '@/server/db/schema';

type RecipeModalProps = {
  meal: Meal | null;
  mealIndex: number;
  day: string;
  mealType: string;
  onClose: () => void;
  onMealRegenerated?: (newMeal: Meal) => void;
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

export function RecipeModal({ meal, mealIndex, day, mealType, onClose, onMealRegenerated }: RecipeModalProps) {
  useEffect(() => {
    if (meal) {
      trackEventMutation.mutate({
        eventName: EventName.RECIPE_VIEWED,
        properties: { mealName: meal.name },
      });
    }
  }, [meal]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showQuotaExceeded, setShowQuotaExceeded] = useState(false);
  const [recipeDetails, setRecipeDetails] = useState<{ ingredients: string[]; instructions: string[] } | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const trackEventMutation = trpc.events.track.useMutation();
  
  const { data: quota } = trpc.mealPlanning.checkRegenerationQuota.useQuery();
  const getRecipeDetailsMutation = trpc.mealPlanning.getRecipeDetails.useMutation();
  const regenerateMutation = trpc.mealPlanning.regenerateSingleMeal.useMutation({
    onSuccess: (data) => {
      if (onMealRegenerated) {
        onMealRegenerated(data.newMeal);
      }
      setShowConfirmDialog(false);
      onClose();
    },
    onError: (error) => {
      if (error.message === 'QUOTA_EXCEEDED') {
        setShowQuotaExceeded(true);
      }
    },
  });

  const handleRegenerateClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmRegenerate = () => {
    regenerateMutation.mutate({
      mealIndex,
      day,
      mealType,
    });
  };

  const handleRetryLoadDetails = () => {
    setDetailsError(null);
    loadRecipeDetails();
  };

  const loadRecipeDetails = async () => {
    if (!meal?.recipeId) return;

    // Check if meal already has details
    if (meal.ingredients && meal.ingredients.length > 0 && meal.instructions && meal.instructions.length > 0) {
      setRecipeDetails({
        ingredients: meal.ingredients,
        instructions: meal.instructions,
      });
      return;
    }

    // Load details from API
    setIsLoadingDetails(true);
    setDetailsError(null);
    try {
      const details = await getRecipeDetailsMutation.mutateAsync({ recipeId: meal.recipeId });
      setRecipeDetails(details);
    } catch (error) {
      console.error('[RecipeModal] Failed to load recipe details:', error);
      setDetailsError('Failed to load recipe details. Please try again.');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Load recipe details when modal opens
  useEffect(() => {
    loadRecipeDetails();
  }, [meal?.recipeId]);

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

          {/* Ingredients */}
          <div className="mb-5">
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="text-lg">🛒</span>
              <h3 className="text-lg font-bold text-foreground">Ingredients</h3>
            </div>
            <div className="rounded-xl p-3.5 bg-surface">
              {isLoadingDetails ? (
                <div className="flex flex-col items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
                  <p className="text-sm text-muted">Loading ingredients...</p>
                </div>
              ) : detailsError ? (
                <div className="flex flex-col items-center justify-center py-6">
                  <p className="text-sm text-destructive mb-3">{detailsError}</p>
                  <Button
                    onClick={handleRetryLoadDetails}
                    className="bg-primary hover:bg-primary/90 text-white text-sm px-4 py-2 rounded-lg"
                  >
                    🔄 Retry
                  </Button>
                </div>
              ) : recipeDetails && recipeDetails.ingredients.length > 0 ? (
                recipeDetails.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex items-start mb-2">
                    <span className="mr-2 text-primary text-sm">•</span>
                    <span className="flex-1 text-foreground text-sm leading-5">{ingredient}</span>
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
              {isLoadingDetails ? (
                <div className="flex flex-col items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
                  <p className="text-sm text-muted">Loading instructions...</p>
                </div>
              ) : detailsError ? (
                <div className="flex flex-col items-center justify-center py-6">
                  <p className="text-sm text-destructive mb-3">{detailsError}</p>
                  <Button
                    onClick={handleRetryLoadDetails}
                    className="bg-primary hover:bg-primary/90 text-white text-sm px-4 py-2 rounded-lg"
                  >
                    🔄 Retry
                  </Button>
                </div>
              ) : recipeDetails && recipeDetails.instructions.length > 0 ? (
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
        </div>

        {/* Action Buttons */}
        <div className="px-4 py-3 border-t border-border space-y-2">
          {/* Regeneration Quota Info */}
          {quota && (
            <div className="text-center text-xs text-muted mb-1">
              {quota.canRegenerate ? (
                <span>🔄 {quota.remaining}/{quota.limit} regenerations remaining today</span>
              ) : (
                <span>⚠️ Daily regeneration limit reached</span>
              )}
            </div>
          )}

          {/* Regenerate Button */}
          <Button
            onClick={handleRegenerateClick}
            disabled={regenerateMutation.isPending || !quota?.canRegenerate}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {regenerateMutation.isPending ? '⏳ Generating...' : '🔄 Regenerate this meal'}
          </Button>

          {/* Close Button */}
          <Button
            onClick={onClose}
            className="w-full bg-surface hover:bg-surface/80 text-foreground font-bold py-3 rounded-2xl"
          >
            Close
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70"
          onClick={() => setShowConfirmDialog(false)}
        >
          <div 
            className="bg-background rounded-2xl p-6 max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-foreground mb-3">Replace this meal?</h3>
            <p className="text-muted mb-5">
              This will generate a new meal and save the current one to your history.
              {quota && <span className="block mt-2 text-sm">You have {quota.remaining} regenerations left today.</span>}
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 bg-surface hover:bg-surface/80 text-foreground font-bold py-3 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmRegenerate}
                disabled={regenerateMutation.isPending}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl"
              >
                {regenerateMutation.isPending ? 'Generating...' : 'Yes, Replace'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quota Exceeded Dialog */}
      {showQuotaExceeded && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70"
          onClick={() => setShowQuotaExceeded(false)}
        >
          <div 
            className="bg-background rounded-2xl p-6 max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="text-5xl mb-3">💎</div>
              <h3 className="text-xl font-bold text-foreground mb-3">Daily Limit Reached</h3>
              <p className="text-muted mb-5">
                You've used all 2 free regenerations today. Upgrade to Premium for unlimited regenerations!
              </p>
              <div className="space-y-2">
                <Button
                  onClick={() => setShowQuotaExceeded(false)}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl"
                >
                  Upgrade to Premium
                </Button>
                <Button
                  onClick={() => setShowQuotaExceeded(false)}
                  className="w-full bg-surface hover:bg-surface/80 text-foreground font-bold py-3 rounded-xl"
                >
                  Maybe Later
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
