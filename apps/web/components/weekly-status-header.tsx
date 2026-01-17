'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { MealPlan } from '@/server/db/schema';

interface WeeklyStatusHeaderProps {
  mealPlan: {
    id: number;
    weekStartDate: string;
    meals: any[];
  };
  votingSession?: {
    sessionId: string;
    shareUrl: string;
  } | null;
  onOpenShoppingList?: () => void;
  onOpenVotingResults?: () => void;
}

export function WeeklyStatusHeader({
  mealPlan,
  votingSession,
  onOpenShoppingList,
  onOpenVotingResults,
}: WeeklyStatusHeaderProps) {
  // Calculate meal plan status
  const totalMeals = mealPlan.meals?.length || 0;
  const expectedMeals = 7 * 3; // 7 days * 3 meal types (max)
  const mealsPlanned = `${totalMeals} / ${expectedMeals} meals planned`;

  // Determine primary CTA
  const getPrimaryCTA = () => {
    // Priority 1: Voting session exists
    if (votingSession) {
      return {
        label: '📢 View voting results',
        action: onOpenVotingResults,
        variant: 'default' as const,
        description: 'Check how your family voted',
      };
    }

    // Priority 2: Shopping list ready
    if (totalMeals > 0) {
      return {
        label: '🛒 Open shopping list',
        action: onOpenShoppingList,
        variant: 'default' as const,
        description: 'You\'re set for a smooth week',
      };
    }

    return null;
  };

  const primaryCTA = getPrimaryCTA();

  // Format week label
  const formatWeekLabel = (weekStartDate: string) => {
    const startDate = new Date(weekStartDate);
    const month = startDate.toLocaleDateString('en-US', { month: 'short' });
    const day = startDate.getDate();
    return `Week of ${month} ${day}`;
  };

  return (
    <Card className="sticky top-0 z-10 bg-surface border-border shadow-md mb-6">
      <div className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Left: Status Info */}
          <div className="flex-1">
            <h2 className="text-lg md:text-xl font-bold text-foreground mb-3">
              {formatWeekLabel(mealPlan.weekStartDate)}
            </h2>
            
            <div className="flex flex-wrap gap-4 text-sm">
              {/* Meal Plan Status */}
              <div className="flex items-center gap-2">
                <span className="text-2xl">🍽️</span>
                <span className="text-muted">{mealsPlanned}</span>
              </div>

              {/* Voting Status */}
              {votingSession && (
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🗳️</span>
                  <span className="text-muted">
                    <span className="text-primary font-medium">Voting Active</span>
                  </span>
                </div>
              )}

              {/* Shopping List Status */}
              <div className="flex items-center gap-2">
                <span className="text-2xl">📝</span>
                <span className="text-muted">
                  {totalMeals > 0 ? (
                    <span className="text-green-600 dark:text-green-400 font-medium">Ready</span>
                  ) : (
                    <span className="text-muted-foreground">Not generated</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Primary CTA */}
          {primaryCTA && (
            <div className="flex flex-col items-start md:items-end gap-2">
              <Button
                onClick={primaryCTA.action}
                variant={primaryCTA.variant}
                size="lg"
                className="w-full md:w-auto"
              >
                {primaryCTA.label}
              </Button>
              {primaryCTA.description && (
                <p className="text-sm text-muted italic">
                  {primaryCTA.description}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
