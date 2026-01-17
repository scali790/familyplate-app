'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { MiniIntroProps } from '@/types/cook-mode';

/**
 * Mini Intro Component
 * 
 * Brief introduction screen before starting Cook Mode
 * 
 * Features:
 * - Meal name and emoji
 * - Number of steps
 * - Brief explanation
 * - Continue button
 * 
 * Design principles:
 * - Quick, not blocking
 * - Sets expectations
 * - Encouraging tone
 */
export function MiniIntro({
  mealName,
  emoji,
  totalSteps,
  onContinue,
}: MiniIntroProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-background px-6 py-12">
      <div className="max-w-2xl w-full space-y-8">
        {/* Meal Emoji */}
        <div className="text-center text-7xl">
          {emoji}
        </div>

        {/* Meal Name */}
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {mealName}
          </h1>
        </div>

        {/* Info Card */}
        <Card className="bg-primary/5 border-primary/30">
          <CardContent className="p-6 space-y-4">
            <div className="text-center">
              <p className="text-lg text-foreground leading-relaxed">
                Wir führen dich Schritt für Schritt durch das Rezept.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <span className="text-2xl">📋</span>
              <span className="text-base font-medium">
                {totalSteps} {totalSteps === 1 ? 'Schritt' : 'Schritte'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Features List */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="text-xl">✓</span>
            <span className="text-sm">Klare Anweisungen</span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="text-xl">✓</span>
            <span className="text-sm">Timer für zeitkritische Schritte</span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="text-xl">✓</span>
            <span className="text-sm">Fortschritt immer sichtbar</span>
          </div>
        </div>

        {/* Continue Button */}
        <div className="pt-4">
          <Button
            onClick={onContinue}
            size="lg"
            className="w-full h-14 text-lg font-semibold"
          >
            Let's Cook! 🍳
          </Button>
        </div>
      </div>
    </div>
  );
}
