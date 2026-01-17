'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWakeLock } from '@/hooks/use-wake-lock';
import { MiniIntro } from './mini-intro';
import { IngredientsQuickCheck } from './ingredients-quick-check';
import { CookingStep } from './cooking-step';
import { DoneScreen } from './done-screen';
import { ProgressIndicator } from './progress-indicator';
import {
  saveCookModeState,
  clearCookModeState,
} from '@/types/cook-mode';
import type {
  CookModeModalProps,
  CookModeState,
  CookModeView,
  TimerState,
} from '@/types/cook-mode';

/**
 * Cook Mode Modal Component
 * 
 * Main orchestrator for Cook Mode with:
 * - State management
 * - View routing (intro → ingredients → cooking → done)
 * - Timer management
 * - State persistence (localStorage)
 * - Exit confirmation
 * - Wake lock (Phase 8)
 * 
 * Design principles:
 * - Fullscreen modal
 * - One view at a time
 * - Auto-save progress
 * - Graceful exit
 */
export function CookModeModal({
  isOpen,
  onClose,
  initialState,
  onComplete,
}: CookModeModalProps) {
  const [state, setState] = useState<CookModeState>(initialState);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Keep screen on during Cook Mode
  const { isActive: isWakeLockActive } = useWakeLock(isOpen);

  // Auto-save state to localStorage whenever it changes
  useEffect(() => {
    if (isOpen) {
      saveCookModeState(state);
    }
  }, [state, isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Timer countdown logic
  useEffect(() => {
    if (state.timerState?.isRunning && state.timerState.remaining > 0) {
      timerIntervalRef.current = setInterval(() => {
        setState(prev => {
          if (!prev.timerState || !prev.timerState.isRunning) return prev;
          
          const newRemaining = Math.max(0, prev.timerState.remaining - 1);
          
          return {
            ...prev,
            timerState: {
              ...prev.timerState,
              remaining: newRemaining,
              isRunning: newRemaining > 0,
            },
            lastUpdatedAt: Date.now(),
          };
        });
      }, 1000);

      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
      };
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  }, [state.timerState?.isRunning, state.timerState?.remaining]);

  // View navigation
  const goToView = useCallback((view: CookModeView) => {
    setState(prev => ({
      ...prev,
      currentView: view,
      lastUpdatedAt: Date.now(),
    }));
  }, []);

  // Ingredient toggle
  const toggleIngredient = useCallback((ingredientId: string) => {
    setState(prev => {
      const newChecked = new Set(prev.ingredientsChecked);
      if (newChecked.has(ingredientId)) {
        newChecked.delete(ingredientId);
      } else {
        newChecked.add(ingredientId);
      }
      return {
        ...prev,
        ingredientsChecked: newChecked,
        lastUpdatedAt: Date.now(),
      };
    });
  }, []);

  // Step navigation
  const goToStep = useCallback((stepIndex: number) => {
    setState(prev => ({
      ...prev,
      currentStep: stepIndex,
      currentView: 'cooking',
      lastUpdatedAt: Date.now(),
    }));
  }, []);

  const goToPreviousStep = useCallback(() => {
    setState(prev => {
      if (prev.currentStep > 0) {
        return {
          ...prev,
          currentStep: prev.currentStep - 1,
          lastUpdatedAt: Date.now(),
        };
      }
      return prev;
    });
  }, []);

  const goToNextStep = useCallback(() => {
    setState(prev => {
      if (prev.currentStep < prev.steps.length - 1) {
        return {
          ...prev,
          currentStep: prev.currentStep + 1,
          lastUpdatedAt: Date.now(),
        };
      } else {
        // Last step completed → go to done screen
        return {
          ...prev,
          currentView: 'done',
          lastUpdatedAt: Date.now(),
        };
      }
    });
  }, []);

  // Timer controls
  const startTimer = useCallback((duration: number) => {
    setState(prev => ({
      ...prev,
      timerState: {
        duration,
        remaining: duration,
        isRunning: true,
        startedAt: Date.now(),
      },
      lastUpdatedAt: Date.now(),
    }));
  }, []);

  const pauseTimer = useCallback(() => {
    setState(prev => {
      if (!prev.timerState) return prev;
      return {
        ...prev,
        timerState: {
          ...prev.timerState,
          isRunning: false,
        },
        lastUpdatedAt: Date.now(),
      };
    });
  }, []);

  const resetTimer = useCallback(() => {
    setState(prev => {
      if (!prev.timerState) return prev;
      return {
        ...prev,
        timerState: {
          ...prev.timerState,
          remaining: prev.timerState.duration,
          isRunning: false,
        },
        lastUpdatedAt: Date.now(),
      };
    });
  }, []);

  // Exit handling
  const handleExit = useCallback(() => {
    setShowExitConfirm(true);
  }, []);

  const confirmExit = useCallback(() => {
    // Keep state in localStorage for resume
    saveCookModeState(state);
    setShowExitConfirm(false);
    onClose();
  }, [state, onClose]);

  const cancelExit = useCallback(() => {
    setShowExitConfirm(false);
  }, []);

  // Complete cooking
  const handleComplete = useCallback(() => {
    clearCookModeState();
    onComplete?.();
    onClose();
  }, [onComplete, onClose]);

  // Current step data
  const currentStepData = state.steps[state.currentStep];
  const isFirstStep = state.currentStep === 0;
  const isLastStep = state.currentStep === state.steps.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={handleExit}>
      <DialogContent 
        className="max-w-full h-full p-0 gap-0 bg-background"
        hideClose
      >
        {/* Header with Progress and Exit */}
        {state.currentView !== 'intro' && state.currentView !== 'done' && (
          <div className="px-6 py-4 border-b border-border bg-surface/50">
            <div className="flex items-center justify-between mb-3">
              {/* Meal Name */}
              <div className="flex items-center gap-2">
                <span className="text-2xl">{state.emoji}</span>
                <h1 className="text-lg font-semibold text-foreground truncate max-w-[200px] md:max-w-none">
                  {state.mealName}
                </h1>
              </div>

              {/* Exit Button */}
              <Button
                onClick={handleExit}
                variant="ghost"
                className="h-10 w-10 rounded-full p-0"
                aria-label="Exit Cook Mode"
              >
                ✕
              </Button>
            </div>

            {/* Progress Indicator */}
            {state.currentView === 'cooking' && (
              <ProgressIndicator
                currentStep={state.currentStep + 1}
                totalSteps={state.steps.length}
                showPercentage
              />
            )}
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          {state.currentView === 'intro' && (
            <MiniIntro
              mealName={state.mealName}
              emoji={state.emoji}
              totalSteps={state.steps.length}
              onContinue={() => goToView('ingredients')}
            />
          )}

          {state.currentView === 'ingredients' && (
            <IngredientsQuickCheck
              ingredients={state.ingredients}
              checkedIngredients={state.ingredientsChecked}
              onToggleIngredient={toggleIngredient}
              onStartCooking={() => goToView('cooking')}
            />
          )}

          {state.currentView === 'cooking' && currentStepData && (
            <CookingStep
              step={currentStepData}
              stepNumber={state.currentStep + 1}
              totalSteps={state.steps.length}
              timerState={state.timerState}
              onStartTimer={startTimer}
              onPauseTimer={pauseTimer}
              onResetTimer={resetTimer}
              onPrevious={goToPreviousStep}
              onNext={goToNextStep}
              onDone={() => goToView('done')}
              isFirstStep={isFirstStep}
              isLastStep={isLastStep}
            />
          )}

          {state.currentView === 'done' && (
            <DoneScreen
              mealName={state.mealName}
              emoji={state.emoji}
              onReturnToDayView={handleComplete}
            />
          )}
        </div>

        {/* Exit Confirmation Dialog */}
        {showExitConfirm && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <Alert className="max-w-md bg-surface border-2 border-border shadow-2xl">
              <AlertDescription className="space-y-6">
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground">
                    Really stop cooking?
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Your progress will be saved and you can continue later.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={cancelExit}
                    variant="outline"
                    size="lg"
                    className="flex-1 h-12"
                  >
                    Weiter kochen
                  </Button>
                  <Button
                    onClick={confirmExit}
                    variant="default"
                    size="lg"
                    className="flex-1 h-12"
                  >
                    Abbrechen
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
