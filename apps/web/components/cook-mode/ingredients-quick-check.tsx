'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { IngredientsQuickCheckProps } from '@/types/cook-mode';

/**
 * Ingredients Quick Check Component
 * 
 * Pre-flight checklist before starting to cook
 * Allows user to verify they have all ingredients ready
 * 
 * Design principles:
 * - Simple list
 * - Optional checkboxes
 * - Large touch targets (48x48px)
 * - Clear CTA: "Start Cooking"
 */
export function IngredientsQuickCheck({
  ingredients,
  checkedIngredients,
  onToggleIngredient,
  onStartCooking,
}: IngredientsQuickCheckProps) {
  const allChecked = ingredients.length > 0 && ingredients.every(ing => checkedIngredients.has(ing.id));
  const someChecked = ingredients.some(ing => checkedIngredients.has(ing.id));

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-2xl font-bold text-foreground">
          Ingredients Quick Check
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Make sure you have everything ready
        </p>
      </div>

      {/* Ingredients List */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="space-y-3 max-w-2xl mx-auto">
          {ingredients.map((ingredient) => {
            const isChecked = checkedIngredients.has(ingredient.id);
            
            return (
              <Card
                key={ingredient.id}
                className={`transition-all cursor-pointer hover:shadow-md ${
                  isChecked 
                    ? 'bg-primary/5 border-primary/30' 
                    : 'bg-surface border-border'
                }`}
                onClick={() => onToggleIngredient(ingredient.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Checkbox - Large touch target */}
                    <div className="flex items-center justify-center w-12 h-12">
                      <Checkbox
                        checked={isChecked}
                        onChange={() => onToggleIngredient(ingredient.id)}
                        className="w-6 h-6"
                        aria-label={`Check off ${ingredient.displayText}`}
                      />
                    </div>

                    {/* Ingredient Text */}
                    <div className="flex-1">
                      <p className={`text-lg font-medium ${
                        isChecked 
                          ? 'text-muted-foreground line-through' 
                          : 'text-foreground'
                      }`}>
                        {ingredient.displayText}
                      </p>
                    </div>

                    {/* Check Icon (when checked) */}
                    {isChecked && (
                      <div className="text-2xl text-primary">
                        ✓
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {ingredients.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No ingredients listed for this recipe
            </p>
          </div>
        )}
      </div>

      {/* Footer with CTA */}
      <div className="px-6 py-6 border-t border-border bg-surface/50">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Progress Indicator */}
          {ingredients.length > 0 && someChecked && (
            <div className="text-center text-sm text-muted-foreground">
              {checkedIngredients.size} of {ingredients.length} ingredients checked
            </div>
          )}

          {/* Start Cooking Button */}
          <Button
            onClick={onStartCooking}
            size="lg"
            className="w-full h-14 text-lg font-semibold"
          >
            {allChecked ? (
              <>
                ✓ All Ready – Start Cooking
              </>
            ) : (
              <>
                Start Cooking →
              </>
            )}
          </Button>

          {/* Optional: Skip hint */}
          <p className="text-xs text-center text-muted-foreground">
            You can start cooking even if not all ingredients are checked
          </p>
        </div>
      </div>
    </div>
  );
}
