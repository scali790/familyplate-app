'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Meal } from '@/server/db/schema';

interface WeekViewProps {
  meals: Meal[];
  mealTypes: string[]; // ["breakfast", "lunch", "dinner"] from user preferences
  weekStartDate: string;
  onMealClick: (meal: Meal) => void;
  onGeneratePartial?: (mealType: string) => Promise<void>;
}

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const dayShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const mealTypeConfig = {
  breakfast: { emoji: '🌅', label: 'Breakfast', color: 'text-orange-500' },
  lunch: { emoji: '🌞', label: 'Lunch', color: 'text-yellow-500' },
  dinner: { emoji: '🌙', label: 'Dinner', color: 'text-blue-500' },
};

export function WeekView({ meals, mealTypes, weekStartDate, onMealClick, onGeneratePartial }: WeekViewProps) {
  const [generatingMealType, setGeneratingMealType] = useState<string | null>(null);

  // Detect which meal types exist in current plan
  const existingMealTypes = [...new Set(meals.map(m => m.mealType))];
  const missingMealTypes = mealTypes.filter(type => !existingMealTypes.includes(type));

  // Group meals by day and mealType
  const mealsByDayAndType: Record<string, Record<string, Meal | undefined>> = {};
  
  dayNames.forEach(day => {
    mealsByDayAndType[day.toLowerCase()] = {};
    mealTypes.forEach(type => {
      mealsByDayAndType[day.toLowerCase()][type] = undefined;
    });
  });

  meals.forEach(meal => {
    if (mealsByDayAndType[meal.day]) {
      mealsByDayAndType[meal.day][meal.mealType] = meal;
    }
  });

  // Get day date
  const getDayDate = (dayIndex: number) => {
    const startDate = new Date(weekStartDate);
    const mealDate = new Date(startDate);
    mealDate.setDate(startDate.getDate() + dayIndex);
    return mealDate.getDate();
  };

  // Truncate meal name for grid display
  const truncateName = (name: string, maxLength: number = 15) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength - 3) + '...';
  };

  // Get voting display
  const getVotingDisplay = (meal: Meal) => {
    const up = meal.upVotes || 0;
    const down = meal.downVotes || 0;
    const neutral = meal.neutralVotes || 0;
    
    if (up === 0 && down === 0 && neutral === 0) return '';
    
    const parts = [];
    if (up > 0) parts.push(`👍${up}`);
    if (neutral > 0) parts.push(`😐${neutral}`);
    if (down > 0) parts.push(`👎${down}`);
    
    return parts.join(' ');
  };

  // Handle partial generation
  const handleGeneratePartial = async (mealType: string) => {
    if (!onGeneratePartial) return;
    
    setGeneratingMealType(mealType);
    try {
      await onGeneratePartial(mealType);
    } catch (error) {
      console.error('Failed to generate partial plan:', error);
    } finally {
      setGeneratingMealType(null);
    }
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header Row - Days */}
        <div className="grid grid-cols-8 gap-2 mb-2">
          <div className="font-semibold text-sm text-muted"></div>
          {dayNames.map((day, index) => (
            <div key={day} className="text-center">
              <div className="font-semibold text-foreground text-sm">{dayShort[index]}</div>
              <div className="text-xs text-muted">{getDayDate(index)}</div>
            </div>
          ))}
        </div>

        {/* Meal Type Rows */}
        {mealTypes.map(mealType => {
          const config = mealTypeConfig[mealType as keyof typeof mealTypeConfig];
          if (!config) return null;

          const isMissing = missingMealTypes.includes(mealType);
          const isGenerating = generatingMealType === mealType;

          return (
            <div key={mealType} className="grid grid-cols-8 gap-2 mb-3">
              {/* Meal Type Label */}
              <div className="flex flex-col items-center justify-center">
                <div className={`text-2xl mb-1 ${isMissing ? 'opacity-40' : ''}`}>
                  {config.emoji}
                </div>
                <div className={`text-xs font-semibold ${config.color} ${isMissing ? 'opacity-40' : ''}`}>
                  {config.label}
                </div>
              </div>

              {/* Day Cells */}
              {isMissing ? (
                // Missing meal type - show generate button
                <div className="col-span-7 flex items-center justify-center">
                  <div className="bg-surface/50 border border-dashed border-border rounded-lg p-4 w-full">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl opacity-40">{config.emoji}</span>
                        <div>
                          <p className="text-sm font-semibold text-muted">
                            No {config.label} plan yet
                          </p>
                          <p className="text-xs text-muted/70">
                            Generate 7 {config.label.toLowerCase()} meals for this week
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleGeneratePartial(mealType)}
                        disabled={isGenerating}
                        className="bg-primary hover:bg-primary/90"
                      >
                        {isGenerating ? (
                          <>
                            <span className="animate-spin mr-2">⏳</span>
                            Generating...
                          </>
                        ) : (
                          <>+ Generate {config.label}</>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                // Existing meal type - show meals
                dayNames.map(day => {
                  const meal = mealsByDayAndType[day.toLowerCase()][mealType];

                  return (
                    <Card
                      key={`${day}-${mealType}`}
                      className={`bg-surface border-border hover:border-primary transition-colors ${
                        meal ? 'cursor-pointer' : 'opacity-50'
                      }`}
                      onClick={() => meal && onMealClick(meal)}
                    >
                      <CardContent className="p-3">
                        {meal ? (
                          <div className="space-y-1">
                            {/* Emoji */}
                            <div className="text-2xl text-center">{meal.emoji || '🍽️'}</div>
                            
                            {/* Meal Name */}
                            <div className="text-xs font-semibold text-foreground text-center leading-tight">
                              {truncateName(meal.name)}
                            </div>

                            {/* Voting */}
                            {getVotingDisplay(meal) && (
                              <div className="text-[10px] text-muted text-center">
                                {getVotingDisplay(meal)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center text-muted text-xs">
                            No meal
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
