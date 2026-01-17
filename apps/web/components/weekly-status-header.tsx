'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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

  return (
    <Card className="bg-surface border-border mb-4">
      <div className="p-3 md:p-4">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Status Icons */}
          <div className="flex items-center gap-3 md:gap-4 text-sm flex-1 min-w-0">
            {/* Meal Plan Status */}
            <div className="flex items-center gap-1.5">
              <span className="text-xl">🍽️</span>
              <span className="text-muted text-xs md:text-sm whitespace-nowrap">
                {totalMeals} meals planned
              </span>
            </div>

            {/* Voting Status */}
            {votingSession && (
              <div className="flex items-center gap-1.5">
                <span className="text-xl">🗳️</span>
                <span className="text-primary font-medium text-xs md:text-sm whitespace-nowrap">
                  Voting
                </span>
              </div>
            )}

            {/* Shopping List Status */}
            <div className="flex items-center gap-1.5">
              <span className="text-xl">📝</span>
              <span className={`text-xs md:text-sm font-medium whitespace-nowrap ${
                totalMeals > 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-muted-foreground'
              }`}>
                {totalMeals > 0 ? 'Ready' : 'Not ready'}
              </span>
            </div>
          </div>

          {/* Right: Primary CTA */}
          {primaryCTA && (
            <Button
              onClick={primaryCTA.action}
              variant={primaryCTA.variant}
              size="sm"
              className="flex-shrink-0"
            >
              <span className="hidden sm:inline">{primaryCTA.label}</span>
              <span className="sm:hidden">
                {primaryCTA.label.includes('voting') ? '📢' : '🛒'}
              </span>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
