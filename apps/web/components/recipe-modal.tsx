'use client';

import { Button } from './ui/button';

type Meal = {
  name: string;
  description: string;
  prepTime: string;
  cookTime?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  ingredients: string[];
  instructions: string[];
};

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
            <div className="px-3 py-1.5 rounded-2xl bg-surface">
              <span className="font-semibold text-muted text-sm">{meal.difficulty}</span>
            </div>
          </div>

          {/* Ingredients */}
          <div className="mb-5">
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="text-lg">🛒</span>
              <h3 className="text-lg font-bold text-foreground">Ingredients</h3>
            </div>
            <div className="rounded-xl p-3.5 bg-surface">
              {meal.ingredients && meal.ingredients.length > 0 ? (
                meal.ingredients.map((ingredient, index) => (
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
              {meal.instructions && meal.instructions.length > 0 ? (
                meal.instructions.map((instruction, index) => (
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
