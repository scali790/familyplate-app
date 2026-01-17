'use client';

import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import type { Meal } from '@/server/db/schema';
import { useEffect, useRef, useState } from 'react';
import { CookModeModal } from './cook-mode/cook-mode-modal';
import { generateCookingSteps } from '@/lib/generate-cooking-steps';
import type { CookModeState } from '@/types/cook-mode';
import { trpc } from '@/lib/trpc';

type DayFocusPanelProps = {
  open: boolean;
  dayIndex: number;
  dayName: string;
  weekStartDate: string;
  meals: Meal[];
  onClose: () => void;
  onOpenRecipe: (meal: Meal) => void;
  onRegenerateMeal: (meal: Meal) => void;
  onSwipeLeft?: () => void;  // Next day
  onSwipeRight?: () => void; // Previous day
  canSwipeLeft?: boolean;    // Can go to next day
  canSwipeRight?: boolean;   // Can go to previous day
};

const MEAL_TYPE_ORDER = ['breakfast', 'lunch', 'dinner'];
const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};

const SWIPE_HINT_KEY = 'dayViewSwipeHintSeen';

export function DayFocusPanel({
  open,
  dayIndex,
  dayName,
  weekStartDate,
  meals,
  onClose,
  onOpenRecipe,
  onRegenerateMeal,
  onSwipeLeft,
  onSwipeRight,
  canSwipeLeft = true,
  canSwipeRight = true,
}: DayFocusPanelProps) {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // State
  const [showHint, setShowHint] = useState(false);
  const [cookModeState, setCookModeState] = useState<CookModeState | null>(null);
  const [isCookModeOpen, setIsCookModeOpen] = useState(false);
  const [loadingRecipeId, setLoadingRecipeId] = useState<string | null>(null);
  const [recipeDetailsError, setRecipeDetailsError] = useState<string | null>(null);

  // tRPC mutation for loading recipe details
  const getRecipeDetailsMutation = trpc.mealPlanning.getRecipeDetails.useMutation();

  // Format date for display
  const dayDate = new Date(weekStartDate);
  dayDate.setDate(dayDate.getDate() + dayIndex);
  const formattedDate = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  
  // Check if today
  const today = new Date();
  const isToday = dayDate.toDateString() === today.toDateString();

  // Group meals by type
  const mealsByType = MEAL_TYPE_ORDER.reduce((acc, type) => {
    const typeMeals = meals.filter(m => m.mealType?.toLowerCase() === type);
    if (typeMeals.length > 0) {
      acc[type] = typeMeals[0];
    }
    return acc;
  }, {} as Record<string, Meal>);

  const mealsArray = Object.values(mealsByType);

  // Get primary meal based on time + availability
  const getPrimaryMeal = (meals: Meal[]) => {
    if (meals.length === 0) return null;
    if (meals.length === 1) return meals[0];
    
    const now = new Date().getHours();
    
    const mealsByTypeMap = {
      breakfast: meals.find(m => m.mealType?.toLowerCase() === 'breakfast'),
      lunch: meals.find(m => m.mealType?.toLowerCase() === 'lunch'),
      dinner: meals.find(m => m.mealType?.toLowerCase() === 'dinner'),
    };
    
    // Time-based selection (only from existing meals)
    if (now >= 6 && now < 11 && mealsByTypeMap.breakfast) {
      return mealsByTypeMap.breakfast;
    }
    if (now >= 11 && now < 16 && mealsByTypeMap.lunch) {
      return mealsByTypeMap.lunch;
    }
    if (now >= 16 && mealsByTypeMap.dinner) {
      return mealsByTypeMap.dinner;
    }
    
    // Fallback: Lunch > Dinner > Breakfast
    return mealsByTypeMap.lunch || mealsByTypeMap.dinner || mealsByTypeMap.breakfast || meals[0];
  };

  const primaryMeal = getPrimaryMeal(mealsArray);

  // Hide swipe hint
  const hideSwipeHint = () => {
    if (showHint) {
      setShowHint(false);
      localStorage.setItem(SWIPE_HINT_KEY, 'true');
    }
  };

  // Handle day switch
  const handleDaySwitch = (direction: 'left' | 'right') => {
    if (direction === 'left' && canSwipeLeft && onSwipeLeft) {
      onSwipeLeft();
    } else if (direction === 'right' && canSwipeRight && onSwipeRight) {
      onSwipeRight();
    }
    
    // Scroll to top of content container
    scrollRef.current?.scrollTo({ 
      top: 0, 
      behavior: 'smooth' 
    });
    
    // Hide swipe hint
    hideSwipeHint();
  };

  // Initialize swipe hint
  useEffect(() => {
    if (!open) return;
    
    const hintSeen = localStorage.getItem(SWIPE_HINT_KEY);
    if (!hintSeen) {
      setShowHint(true);
      
      // Auto-hide after 1.5 seconds
      const timer = setTimeout(() => {
        hideSwipeHint();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Swipe navigation with pointer events
  useEffect(() => {
    if (!open) return;
    
    const container = containerRef.current;
    if (!container) return;

    let startX = 0, startY = 0;
    let currentX = 0, currentY = 0;
    let isSwipeDetected = false;

    const handlePointerDown = (e: PointerEvent) => {
      startX = e.clientX;
      startY = e.clientY;
      currentX = startX;
      currentY = startY;
      isSwipeDetected = false;
    };

    const handlePointerMove = (e: PointerEvent) => {
      currentX = e.clientX;
      currentY = e.clientY;
      
      const dx = currentX - startX;
      const dy = currentY - startY;
      
      // AXIS LOCK LOGIC
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        // Horizontal Swipe detected
        isSwipeDetected = true;
        e.preventDefault(); // Works with non-passive listener
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (isSwipeDetected) {
        const endX = e.clientX || currentX;
        const dx = endX - startX;
        
        if (dx > 50) {
          handleDaySwitch('right'); // Previous day
        } else if (dx < -50) {
          handleDaySwitch('left'); // Next day
        }
      }
      isSwipeDetected = false;
    };

    // Add listeners with { passive: false } for preventDefault to work
    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointermove', handlePointerMove, { passive: false });
    container.addEventListener('pointerup', handlePointerUp);

    return () => {
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerup', handlePointerUp);
    };
  }, [open, canSwipeLeft, canSwipeRight, onSwipeLeft, onSwipeRight]);

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        className="bg-background rounded-3xl max-h-[90vh] w-full max-w-2xl flex flex-col overflow-hidden"
        style={{ touchAction: 'pan-y' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Sticky */}
        <div className="sticky top-0 z-10 bg-background border-b border-border">
          <div className="flex justify-between items-center px-6 pt-6 pb-4">
            {/* Left: Previous Day Arrow */}
            {canSwipeRight && onSwipeRight && (
              <button
                onClick={() => handleDaySwitch('right')}
                className="p-3 text-muted hover:text-foreground transition-colors flex-shrink-0"
                aria-label="Previous day"
              >
                <span className="text-2xl">←</span>
              </button>
            )}
            {!canSwipeRight && <div className="w-10" />}

            {/* Center: Day Title */}
            <div className="flex-1 text-center min-w-0">
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
                {mealsArray.length} meal{mealsArray.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Right: Next Day Arrow or Close */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {canSwipeLeft && onSwipeLeft && (
                <button
                  onClick={() => handleDaySwitch('left')}
                  className="p-3 text-muted hover:text-foreground transition-colors"
                  aria-label="Next day"
                >
                  <span className="text-2xl">→</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-muted hover:text-foreground transition-colors"
              >
                <span className="text-3xl leading-none">×</span>
              </button>
            </div>
          </div>

          {/* Swipe Hint */}
          {showHint && (
            <div 
              className="bg-primary/5 px-4 py-2 text-center border-b border-border/50 animate-in fade-in duration-200"
              onClick={hideSwipeHint}
            >
              <p className="text-xs text-muted-foreground">
                ← Swipe for other days →
              </p>
            </div>
          )}
        </div>

        {/* Content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6">
          {mealsArray.length === 0 ? (
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

                const isPrimary = primaryMeal?.mealType === meal.mealType;

                return (
                  <div key={mealType} className="space-y-3">
                    {/* Meal Type Header */}
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-foreground">
                        {MEAL_TYPE_LABELS[mealType]}
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>

                    {/* Meal Card - Strong Primary emphasis + Secondary de-emphasis */}
                    <Card className={`
                      border-2 
                      transition-all duration-300
                      ${isPrimary 
                        ? 'border-primary shadow-2xl scale-[1.05] ring-2 ring-primary/20' 
                        : 'border-border shadow-sm opacity-75 scale-95'
                      }
                    `}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          {/* Emoji */}
                          <div className="text-5xl flex-shrink-0">
                            {meal.emoji || '🍽️'}
                          </div>

                          {/* Content */}
                          <div className={`flex-1 min-w-0 ${isPrimary ? '' : 'opacity-90'}`}>
                            {/* Name */}
                            <h3 className="text-xl font-bold text-foreground mb-2">
                              {meal.name}
                            </h3>

                            {/* Quick Info - Removed redundant meal type label */}
                            <div className="flex items-center gap-4 mb-4 text-sm text-muted">
                              {/* Cook Time */}
                              {meal.prepTime && (
                                <div className="flex items-center gap-1">
                                  <span>⏱️</span>
                                  <span>{meal.prepTime}</span>
                                </div>
                              )}
                            </div>

                            {/* Compact Tags */}
                            {meal.tags && meal.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-4">
                                {meal.tags.slice(0, 3).map((tag, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary font-medium"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Primary CTA - Prominent for primary meal */}
                            <Button
                              variant="default"
                              size={isPrimary ? 'lg' : 'default'}
                              disabled={loadingRecipeId === meal.recipeId}
                              onClick={async () => {
                                // Pre-load recipe details if needed
                                setLoadingRecipeId(meal.recipeId || null);
                                setRecipeDetailsError(null);

                                try {
                                  let mealWithDetails = meal;

                                  // Check if details are already loaded
                                  const hasDetails = meal.ingredients && meal.ingredients.length > 0 && 
                                                    meal.instructions && meal.instructions.length > 0;

                                  if (!hasDetails && meal.recipeId) {
                                    // Load details from API
                                    const details = await getRecipeDetailsMutation.mutateAsync({ 
                                      recipeId: meal.recipeId 
                                    });
                                    
                                    // Merge details into meal
                                    mealWithDetails = {
                                      ...meal,
                                      ingredients: details.ingredients,
                                      instructions: details.instructions,
                                    };
                                  }

                                  // Generate cooking steps with loaded details
                                  const { steps, ingredients } = generateCookingSteps(mealWithDetails);
                                  
                                  const initialState: CookModeState = {
                                    mealId: mealWithDetails.recipeId || mealWithDetails.name,
                                    mealName: mealWithDetails.name,
                                    emoji: mealWithDetails.emoji || '🍽️',
                                    steps,
                                    ingredients,
                                    currentStep: 0,
                                    currentView: 'intro',
                                    ingredientsChecked: new Set(),
                                    timerState: null,
                                    startedAt: Date.now(),
                                    lastUpdatedAt: Date.now(),
                                  };
                                  
                                  setCookModeState(initialState);
                                  setIsCookModeOpen(true);
                                } catch (error) {
                                  console.error('[DayFocusPanel] Failed to load recipe details:', error);
                                  setRecipeDetailsError('Failed to load recipe details. Please try again.');
                                } finally {
                                  setLoadingRecipeId(null);
                                }
                              }}
                              className={`w-full mb-3 ${isPrimary ? 'shadow-lg' : ''}`}
                            >
                              {loadingRecipeId === meal.recipeId ? (
                                <>
                                  <span className="inline-block animate-spin mr-2">⏳</span>
                                  Loading recipe...
                                </>
                              ) : recipeDetailsError && loadingRecipeId === null ? (
                                <>
                                  ⚠️ Retry
                                </>
                              ) : (
                                <>
                                  🍳 Start cooking
                                </>
                              )}
                            </Button>

                            {/* Secondary Actions */}
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onRegenerateMeal(meal)}
                                className="flex-1"
                                title="Swap this meal"
                              >
                                🔄 Swap
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onOpenRecipe(meal)}
                                className="flex-1"
                                title="View ingredients"
                              >
                                📝 Ingredients
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

        {/* Footer - Less prominent Back button */}
        <div className="px-6 py-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            ← Back to Week
          </Button>
        </div>
      </div>

      {/* Cook Mode Modal */}
      {cookModeState && (
        <CookModeModal
          isOpen={isCookModeOpen}
          onClose={() => setIsCookModeOpen(false)}
          initialState={cookModeState}
          onComplete={() => {
            setIsCookModeOpen(false);
            setCookModeState(null);
          }}
        />
      )}
    </div>
  );
}
