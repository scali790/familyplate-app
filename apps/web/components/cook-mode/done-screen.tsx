'use client';

import { Button } from '@/components/ui/button';
import type { DoneScreenProps } from '@/types/cook-mode';

/**
 * Done Screen Component
 * 
 * Completion screen shown after all cooking steps are done
 * 
 * Features:
 * - Celebration message
 * - Meal emoji and name
 * - Return to Day View button
 * 
 * Design principles:
 * - Positive, encouraging tone
 * - Clear next action
 * - Simple, focused
 */
export function DoneScreen({
  mealName,
  emoji,
  onReturnToDayView,
}: DoneScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-background to-primary/5 px-6 py-12">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Celebration Emoji */}
        <div className="text-8xl animate-bounce">
          🎉
        </div>

        {/* Meal Emoji */}
        <div className="text-6xl">
          {emoji}
        </div>

        {/* Success Message */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Fertig!
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground">
            {mealName} ist bereit
          </p>
        </div>

        {/* Encouragement */}
        <div className="text-2xl md:text-3xl font-semibold text-primary">
          Guten Appetit! 🍽️
        </div>

        {/* Return Button */}
        <div className="pt-8">
          <Button
            onClick={onReturnToDayView}
            size="lg"
            className="h-14 px-8 text-lg font-semibold"
          >
            Back to Day View
          </Button>
        </div>

        {/* Optional: Share/Rate (Future) */}
        <div className="pt-4 text-sm text-muted-foreground">
          Hope you enjoyed cooking! 👨‍🍳
        </div>
      </div>
    </div>
  );
}
