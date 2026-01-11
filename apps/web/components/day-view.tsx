'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Meal } from '@/server/db/schema';

interface DayViewProps {
  meals: Meal[]; // All meals for the week
  mealTypes: string[]; // ["breakfast", "lunch", "dinner"]
  currentDayIndex: number; // 0-6 (Monday-Sunday)
  weekStartDate: string;
  onMealClick: (meal: Meal) => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  onReplaceMeal?: (meal: Meal) => void;
}

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const mealTypeConfig = {
  breakfast: { emoji: '🌅', label: 'BREAKFAST', color: 'text-orange-500' },
  lunch: { emoji: '🌞', label: 'LUNCH', color: 'text-yellow-500' },
  dinner: { emoji: '🌙', label: 'DINNER', color: 'text-blue-500' },
};

// Food category icons mapping
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

export function DayView({
  meals,
  mealTypes,
  currentDayIndex,
  weekStartDate,
  onMealClick,
  onPrevDay,
  onNextDay,
  onReplaceMeal,
}: DayViewProps) {
  const currentDay = dayNames[currentDayIndex].toLowerCase();

  // Get day date
  const getDayDate = () => {
    const startDate = new Date(weekStartDate);
    const mealDate = new Date(startDate);
    mealDate.setDate(startDate.getDate() + currentDayIndex);
    
    const month = mealDate.toLocaleDateString('en-US', { month: 'long' });
    const day = mealDate.getDate();
    return `${month} ${day}`;
  };

  // Filter meals for current day
  const dayMeals = meals.filter(meal => meal.day === currentDay);

  // Organize meals by type
  const mealsByType: Record<string, Meal | undefined> = {};
  mealTypes.forEach(type => {
    mealsByType[type] = dayMeals.find(m => m.mealType === type);
  });

  // Get voting display
  const getVotingDisplay = (meal: Meal) => {
    const up = meal.upVotes || 0;
    const down = meal.downVotes || 0;
    const neutral = meal.neutralVotes || 0;
    
    return { up, down, neutral };
  };

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrevDay}
          disabled={currentDayIndex === 0}
        >
          ← Prev
        </Button>
        
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">
            {dayNames[currentDayIndex]}
          </h2>
          <p className="text-sm text-muted">{getDayDate()}</p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onNextDay}
          disabled={currentDayIndex === 6}
        >
          Next →
        </Button>
      </div>

      {/* Meal Cards */}
      <div className="space-y-4">
        {mealTypes.map(mealType => {
          const config = mealTypeConfig[mealType as keyof typeof mealTypeConfig];
          const meal = mealsByType[mealType];

          if (!config) return null;

          return (
            <Card key={mealType} className="bg-surface border-border">
              <CardContent className="p-6">
                {/* Meal Type Header */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{config.emoji}</span>
                  <div>
                    <h3 className={`text-sm font-bold ${config.color}`}>
                      {config.label}
                    </h3>
                    {onReplaceMeal && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-6 px-2 mt-1"
                        onClick={() => meal && onReplaceMeal(meal)}
                      >
                        🔄 Replace
                      </Button>
                    )}
                  </div>
                </div>

                {meal ? (
                  <div className="space-y-4">
                    {/* Meal Name & Tags */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-3xl">{meal.emoji || '🍽️'}</span>
                        {meal.tags && meal.tags.length > 0 && (
                          <span className="text-base">{getIconsForTags(meal.tags).join(' ')}</span>
                        )}
                      </div>
                      <h4 className="text-xl font-bold text-foreground">{meal.name}</h4>
                    </div>

                    {/* Description */}
                    <p className="text-muted">{meal.description}</p>

                    {/* Meta Info */}
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1 text-muted text-sm">
                        <span>⏱️ Prep: {meal.prepTime}</span>
                      </div>
                      {meal.cookTime && (
                        <div className="flex items-center gap-1 text-muted text-sm">
                          <span>🍳 Cook: {meal.cookTime}</span>
                        </div>
                      )}
                      {meal.difficulty && (
                        <div className="flex items-center gap-1 text-muted text-sm">
                          <span>📊 {meal.difficulty}</span>
                        </div>
                      )}
                    </div>

                    {/* Voting */}
                    {(() => {
                      const votes = getVotingDisplay(meal);
                      if (votes.up === 0 && votes.down === 0 && votes.neutral === 0) return null;
                      
                      return (
                        <div className="flex gap-3 text-sm">
                          {votes.up > 0 && <span>👍 {votes.up}</span>}
                          {votes.neutral > 0 && <span>😐 {votes.neutral}</span>}
                          {votes.down > 0 && <span>👎 {votes.down}</span>}
                        </div>
                      );
                    })()}

                    {/* View Recipe Button */}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => onMealClick(meal)}
                    >
                      View Full Recipe
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted">
                    No meal planned
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
