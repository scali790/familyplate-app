'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Meal } from '@/server/db/schema';
import { MEAL_TYPE_CONFIG, getMealTypeConfig } from '@/lib/meal-type-config';

interface WeekViewProps {
  meals: Meal[];
  mealTypes: string[]; // ["breakfast", "lunch", "dinner"] from user preferences
  weekStartDate: string;
  onMealClick: (meal: Meal) => void;
  onGeneratePartial?: (mealType: string) => Promise<void>;
  onDayClick?: (day: string) => void; // New: Click on day card to open Day View
}

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const dayShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function WeekView({ meals, mealTypes, weekStartDate, onMealClick, onGeneratePartial, onDayClick }: WeekViewProps) {
  const [generatingMealType, setGeneratingMealType] = useState<string | null>(null);

  // Detect which meal types exist in current plan
  const existingMealTypes = [...new Set(meals.map(m => m.mealType))];
  const missingMealTypes = mealTypes.filter(type => !existingMealTypes.includes(type as any));

  // Group meals by day and mealType
  const mealsByDayAndType: Record<string, Record<string, Meal | undefined>> = {};
  
  dayNames.forEach(day => {
    mealsByDayAndType[day.toLowerCase()] = {};
    mealTypes.forEach(type => {
      mealsByDayAndType[day.toLowerCase()][type] = undefined;
    });
  });

  meals.forEach(meal => {
    if (meal.day && meal.mealType && mealsByDayAndType[meal.day]) {
      mealsByDayAndType[meal.day][meal.mealType] = meal;
    }
  });

  // Get day date and check if today
  const getDayInfo = (dayIndex: number) => {
    const startDate = new Date(weekStartDate);
    const mealDate = new Date(startDate);
    mealDate.setDate(startDate.getDate() + dayIndex);
    
    const today = new Date();
    const isToday = mealDate.getDate() === today.getDate() && 
                    mealDate.getMonth() === today.getMonth() && 
                    mealDate.getFullYear() === today.getFullYear();
    
    return {
      date: mealDate.getDate(),
      isToday
    };
  };

  // Truncate meal name for grid display
  const truncateName = (name: string, maxLength: number = 20) => {
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

  // Handle day card click
  const handleDayClick = (day: string) => {
    if (onDayClick) {
      onDayClick(day);
    }
  };

  // Check if any meal type is missing
  const hasMissingMealTypes = missingMealTypes.length > 0;

  return (
    <div className="w-full">
      {/* Missing Meal Types Banner */}
      {hasMissingMealTypes && (
        <div className="mb-6 space-y-3">
          {missingMealTypes.map(mealType => {
            const config = getMealTypeConfig(mealType);
            if (!config) return null;
            const isGenerating = generatingMealType === mealType;

            return (
              <div key={mealType} className="bg-surface/50 border border-dashed border-border rounded-lg p-4">
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
            );
          })}
        </div>
      )}

      {/* Day-based Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {dayNames.map((day, dayIndex) => {
          const dayInfo = getDayInfo(dayIndex);
          const dayMeals = mealsByDayAndType[day.toLowerCase()];
          
          return (
            <Card
              key={day}
              className={`
                border-2 transition-all cursor-pointer
                hover:shadow-lg hover:scale-[1.02]
                ${dayInfo.isToday 
                  ? 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-400 ring-2 ring-orange-400/20' 
                  : 'bg-surface border-border hover:border-primary/50'
                }
              `}
              onClick={() => handleDayClick(day.toLowerCase())}
            >
              <CardContent className="p-4">
                {/* Day Header */}
                <div className="mb-3 pb-3 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-lg text-foreground">
                        {dayShort[dayIndex]}
                      </div>
                      <div className="text-xs text-muted">
                        {dayInfo.date}
                      </div>
                    </div>
                    {dayInfo.isToday && (
                      <div className="bg-gradient-to-r from-orange-400 to-amber-400 text-white text-xs font-bold px-2 py-1 rounded-full">
                        TODAY
                      </div>
                    )}
                  </div>
                </div>

                {/* Meals for this day */}
                <div className="space-y-2">
                  {mealTypes.map(mealType => {
                    const meal = dayMeals[mealType];
                    const config = getMealTypeConfig(mealType);
                    if (!config) return null;

                    // Get border color class based on meal type
                    const getBorderClass = () => {
                      if (mealType === 'breakfast') return 'border-l-orange-400';
                      if (mealType === 'lunch') return 'border-l-blue-400';
                      if (mealType === 'dinner') return 'border-l-purple-400';
                      return 'border-l-border';
                    };

                    return (
                      <div
                        key={mealType}
                        className={`
                          border-l-4 bg-background/50 rounded-r-lg p-2
                          ${getBorderClass()}
                          ${meal ? 'opacity-100' : 'opacity-40'}
                        `}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (meal) onMealClick(meal);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{config.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className={`text-xs font-semibold ${config.textColor}`}>
                              {config.label}
                            </div>
                            {meal ? (
                              <>
                                <div className="text-xs text-foreground truncate">
                                  {truncateName(meal.name, 25)}
                                </div>
                                {getVotingDisplay(meal) && (
                                  <div className="text-[10px] text-muted">
                                    {getVotingDisplay(meal)}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="text-xs text-muted">
                                No meal
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
