'use client';

import { calculateProgress } from '@/types/cook-mode';
import type { ProgressIndicatorProps } from '@/types/cook-mode';

/**
 * Progress Indicator Component
 * 
 * Shows cooking progress with:
 * - Visual progress bar
 * - Step counter (Step X of Y)
 * - Optional percentage
 * 
 * Design principles:
 * - Always visible
 * - Clear visual feedback
 * - Motivational
 */
export function ProgressIndicator({
  currentStep,
  totalSteps,
  showPercentage = false,
}: ProgressIndicatorProps) {
  const percentage = calculateProgress(currentStep, totalSteps);

  return (
    <div className="w-full space-y-2">
      {/* Progress Bar */}
      <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Cooking progress: ${percentage}%`}
        />
      </div>

      {/* Step Counter and Percentage */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground font-medium">
          Step {currentStep} of {totalSteps}
        </span>
        
        {showPercentage && (
          <span className="text-primary font-semibold">
            {percentage}%
          </span>
        )}
      </div>
    </div>
  );
}
