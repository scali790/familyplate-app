'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

type Meal = {
  day: string;
  name: string;
  description: string;
  prepTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  upvotes: number;
  downvotes: number;
  voters?: Array<{
    name: string;
    vote: '👍' | '👎';
  }>;
};

type MealCardProps = {
  meal: Meal;
  weekStartDate: string;
  familySize?: number;
  onVote: (voteType: 'up' | 'down') => void;
  onPress: () => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
};

// Food category icons mapping (from Expo app)
const getIconsForTags = (tags: string[]): string[] => {
  const iconMap: Record<string, string> = {
    beef: '🥩',
    chicken: '🍗',
    fish: '🐟',
    vegetarian: '🌱',
    vegan: '🥬',
    spicy: '🌶️',
    'kid-friendly': '👶',
    healthy: '🥗',
  };

  return tags.map(tag => iconMap[tag.toLowerCase()] || '').filter(Boolean);
};

export function MealCard({
  meal,
  weekStartDate,
  familySize = 4,
  onVote,
  onPress,
  onRegenerate,
  isRegenerating,
}: MealCardProps) {
  const [showVoters, setShowVoters] = useState(false);
  const voters = meal.voters || [];
  const totalVoters = voters.length;
  const expectedVoters = familySize;

  // Calculate the actual date for this meal
  const getDayDate = () => {
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayIndex = dayNames.indexOf(meal.day);
    const startDate = new Date(weekStartDate);
    const mealDate = new Date(startDate);
    mealDate.setDate(startDate.getDate() + dayIndex);

    // Format as "Jan 6"
    const month = mealDate.toLocaleDateString('en-US', { month: 'short' });
    const day = mealDate.getDate();
    return `${month} ${day}`;
  };

  const difficultyEmoji = {
    Easy: '🟢',
    Medium: '🟡',
    Hard: '🔴',
  };

  return (
    <Card className="bg-surface border-border">
      <CardContent className="p-5">
        {/* Day & Name with Regenerate Button */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-primary uppercase">{meal.day}</span>
              <span className="text-sm text-muted">• {getDayDate()}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              {meal.tags && meal.tags.length > 0 && (
                <span className="text-base">{getIconsForTags(meal.tags).join(' ')}</span>
              )}
              <h3 className="text-lg font-bold text-foreground">{meal.name}</h3>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="ml-2 bg-primary/10 text-primary hover:bg-primary/20"
          >
            {isRegenerating ? '⏳' : '🔄'}
          </Button>
        </div>

        {/* Description - Clickable area for recipe details */}
        <button
          onClick={onPress}
          className="w-full text-left mb-3 text-muted hover:text-foreground transition-colors"
        >
          {meal.description}
        </button>

        {/* Meta Info - Clickable area for recipe details */}
        <button onClick={onPress} className="w-full text-left">
          <div className="flex gap-4 mb-4">
            <div className="flex items-center gap-1 text-muted">
              <span>⏱️ {meal.prepTime}</span>
            </div>
            <div className="flex items-center gap-1 text-muted">
              <span>
                {difficultyEmoji[meal.difficulty]} {meal.difficulty}
              </span>
            </div>
          </div>
          {/* View Recipe hint */}
          <div className="mb-3 px-3 py-2 bg-primary/10 rounded-lg">
            <p className="text-primary text-center text-sm font-semibold">
              👆 Tap here to view full recipe
            </p>
          </div>
        </button>

        {/* Voting */}
        <div className="pt-3 border-t border-border space-y-2">
          {/* Voting Progress Indicator */}
          {totalVoters < expectedVoters && (
            <div className="bg-warning/10 px-3 py-2 rounded-lg">
              <p className="text-xs text-warning font-semibold">
                ⚠️ {totalVoters} of {expectedVoters} family members voted
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-muted font-medium">Family Votes</span>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onVote('up')}
                className="flex items-center gap-1 bg-success/10 text-success hover:bg-success/20"
              >
                <span className="text-lg">👍</span>
                <span className="font-semibold">{meal.upvotes}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onVote('down')}
                className="flex items-center gap-1 bg-error/10 text-error hover:bg-error/20"
              >
                <span className="text-lg">👎</span>
                <span className="font-semibold">{meal.downvotes}</span>
              </Button>
            </div>
          </div>

          {/* Voter Avatars */}
          {voters.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {voters.map((voter, idx) => {
                const initials = voter.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);
                const isUpvote = voter.vote === '👍';
                const bgColor = isUpvote ? '#4ADE80' : '#F87171';

                return (
                  <div
                    key={idx}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: bgColor }}
                  >
                    <span className="text-white text-xs font-semibold">{initials}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Voter Details */}
          {voters.length > 0 && (
            <div>
              <button
                onClick={() => setShowVoters(!showVoters)}
                className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
              >
                {showVoters ? '▼' : '▶'} View {voters.length} voter{voters.length > 1 ? 's' : ''}
              </button>
              {showVoters && (
                <div className="mt-2 bg-background/50 rounded-lg p-3 space-y-1">
                  {voters.map((voter, idx) => (
                    <p key={idx} className="text-sm text-foreground">
                      {voter.vote} <span className="font-semibold">{voter.name}</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
