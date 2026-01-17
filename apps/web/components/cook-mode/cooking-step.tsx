'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Timer } from './timer';
import type { CookingStepProps } from '@/types/cook-mode';

/**
 * Cooking Step Component
 * 
 * Displays a single cooking step with:
 * - Step title and description
 * - Optional icon
 * - Optional timer
 * - Optional tip
 * - Navigation buttons (Previous, Done, Next)
 * 
 * Design principles:
 * - One step = one screen
 * - One visual focus
 * - No distractions
 * - Large, readable text
 * - 48x48px touch targets
 */
export function CookingStep({
  step,
  stepNumber,
  totalSteps,
  timerState,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  onPrevious,
  onNext,
  onDone,
  isFirstStep,
  isLastStep,
}: CookingStepProps) {
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center px-6 py-8 overflow-y-auto">
        <div className="w-full max-w-2xl space-y-8">
          {/* Step Icon (if available) */}
          {step.icon && (
            <div className="text-center">
              <span className="text-6xl" role="img" aria-label="Step icon">
                {step.icon}
              </span>
            </div>
          )}

          {/* Step Title */}
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
              {step.title}
            </h2>
          </div>

          {/* Step Description */}
          <Card className="bg-surface/50 border-border">
            <CardContent className="p-6">
              <p className="text-lg md:text-xl leading-relaxed text-foreground">
                {step.description}
              </p>
            </CardContent>
          </Card>

          {/* Timer (if required) */}
          {step.timerRequired && step.duration && (
            <div className="flex justify-center">
              <Timer
                timerState={timerState || {
                  duration: step.duration,
                  remaining: step.duration,
                  isRunning: false,
                }}
                onStart={() => onStartTimer(step.duration!)}
                onPause={onPauseTimer}
                onReset={onResetTimer}
              />
            </div>
          )}

          {/* Tip (if available) */}
          {step.tip && (
            <Card className="bg-primary/5 border-primary/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl" role="img" aria-label="Tip">
                    💡
                  </span>
                  <p className="text-sm md:text-base text-foreground leading-relaxed">
                    <span className="font-semibold">Tip:</span> {step.tip}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="px-6 py-6 border-t border-border bg-surface/50">
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-3 gap-3">
            {/* Previous Button */}
            <Button
              onClick={onPrevious}
              disabled={isFirstStep}
              variant="outline"
              size="lg"
              className="h-14 text-base font-semibold"
            >
              ← Previous
            </Button>

            {/* Done Button (Middle) */}
            <Button
              onClick={onDone}
              variant="outline"
              size="lg"
              className="h-14 text-base font-semibold"
            >
              ✓ Done
            </Button>

            {/* Next Button */}
            <Button
              onClick={onNext}
              disabled={isLastStep}
              size="lg"
              className="h-14 text-base font-semibold"
            >
              Next →
            </Button>
          </div>

          {/* Step Counter (below buttons) */}
          <div className="text-center mt-4 text-sm text-muted-foreground">
            Step {stepNumber} of {totalSteps}
          </div>
        </div>
      </div>
    </div>
  );
}
