'use client';

import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { trpc } from '@/lib/trpc';
import { EventName } from '@/lib/events';
import type { Meal } from '@/server/db/schema';
import { useEffect } from 'react';

type DayFocusPanelProps = {
  open: boolean;
  dayIndex: number;
  dayName: string;
  weekStartDate: string; // Added for date formatting
  meals: Meal[];
  onClose: () => void;
  onOpenRecipe: (meal: Meal) => void;
  onRegenerateMeal: (meal: Meal) => void;
};

const MEAL_TYPE_ORDER = ['breakfast', 'lunch', 'dinner'];
const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};

export function DayFocusPanel({
  open,
  dayIndex,
  dayName,
  weekStartDate,
  meals,
  onClose,
  onOpenRecipe,
  onRegenerateMeal,
}: DayFocusPanelProps) {
  const trackEventMutation = trpc.events.track.useMutation();
  // Format date for display
  const dayDate = new Date(weekStartDate);
  dayDate.setDate(dayDate.getDate() + dayIndex);
  const formattedDate = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  
  // Check if today
  const today = new Date();
  const isToday = dayDate.toDateString() === today.toDateString();
  // Handle ESC key
  useEffect(() => {
    if (!open) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  // Group meals by type
  const mealsByType = MEAL_TYPE_ORDER.reduce((acc, type) => {
    const typeMeals = meals.filter(m => m.mealType?.toLowerCase() === type);
    if (typeMeals.length > 0) {
      acc[type] = typeMeals[0]; // Should only be one meal per type per day
    }
    return acc;
  }, {} as Record<string, Meal>);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-3xl max-h-[90vh] w-full max-w-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Sticky */}
        <div className="sticky top-0 z-10 bg-background flex justify-between items-center px-6 pt-6 pb-4 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {isToday ? (
                <>
                  <span className="inline-flex items-center gap-2">
                    Today
                    <span className="text-sm font-normal text-muted">· {formattedDate}</span>
                  </span>
                </>
              ) : (
                <>
                  {dayName} <span className="text-sm font-normal text-muted">· {formattedDate}</span>
                </>
              )}
            </h2>
            <p className="text-sm text-muted mt-1">
              {Object.keys(mealsByType).length} meal{Object.keys(mealsByType).length !== 1 ? 's' : ''}
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
          {Object.keys(mealsByType).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-4xl mb-4">🍽️</div>
              <p className="text-foreground font-semibold mb-2">No meals planned</p>
              <p className="text-muted text-sm max-w-md">
                There are no meals planned for this day yet.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {MEAL_TYPE_ORDER.map(mealType => {
                const meal = mealsByType[mealType];
                if (!meal) return null;

                return (
                  <div key={mealType} className="space-y-3">
                    {/* Meal Type Header */}
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-foreground">
                        {MEAL_TYPE_LABELS[mealType]}
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>

                    {/* Meal Card */}
                    <Card className="border-2 hover:border-primary/50 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          {/* Emoji */}
                          <div className="text-5xl flex-shrink-0">
                            {meal.emoji || '🍽️'}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {/* Name */}
                            <h3 className="text-xl font-bold text-foreground mb-2">
                              {meal.name}
                            </h3>

                            {/* Description */}
                            {meal.description && (
                              <p className="text-sm text-muted mb-4 line-clamp-2">
                                {meal.description}
                              </p>
                            )}

                            {/* Tags */}
                            {meal.tags && meal.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-4">
                                {meal.tags.slice(0, 3).map((tag, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Prep Time */}
                            {meal.prepTime && (
                              <div className="text-xs text-muted mb-4">
                                ⏱️ {meal.prepTime}
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  trackEventMutation.mutate({
                                    eventName: EventName.COOK_CTA_USED,
                                    properties: { mealName: meal.name },
                                  });
                                  onOpenRecipe(meal);
                                }}
                                className="flex-1"
                              >
                                📖 View Full Recipe
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onRegenerateMeal(meal)}
                                className="flex-1"
                              >
                                🔄 Swap Meal
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border">
          <Button
            variant="outline"
            className="w-full"
            onClick={onClose}
          >
            ← Back to Week
          </Button>
        </div>
      </div>
    </div>
  );
}
