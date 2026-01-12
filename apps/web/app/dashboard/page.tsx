'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RecipeModal } from '@/components/recipe-modal';
import { trpc } from '@/lib/trpc';
import type { Meal } from '@/server/db/schema';

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

// Meal Type Icons
const mealTypeIcons: Record<string, string> = {
  breakfast: '🌅',
  lunch: '🍱',
  dinner: '🌙',
};

// Group meals by mealType and day
const groupMealsByType = (meals: Meal[]) => {
  const grouped: Record<string, Meal[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
  };

  meals.forEach(meal => {
    const mealType = meal.mealType?.toLowerCase() || 'dinner';
    if (grouped[mealType]) {
      grouped[mealType].push(meal);
    }
  });

  // Sort by day
  Object.keys(grouped).forEach(type => {
    grouped[type].sort((a, b) => {
      const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      return dayOrder.indexOf(a.day?.toLowerCase() || '') - dayOrder.indexOf(b.day?.toLowerCase() || '');
    });
  });

  return grouped;
};

export default function DashboardPage() {
  const [selectedMeal, setSelectedMeal] = useState<{ meal: Meal; index: number; day: string; mealType: string } | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [selectedDayIndex, setSelectedDayIndex] = useState(0); // 0 = Monday

  // Fetch current meal plan and preferences
  const { data: mealPlan, isLoading, refetch } = trpc.mealPlanning.getCurrentPlan.useQuery();
  const { data: preferences } = trpc.preferences.getPreferences.useQuery();
  
  // Mutations
  const generateMutation = trpc.mealPlanning.generatePlan.useMutation();
  const generatePartialMutation = trpc.mealPlanning.generatePartialPlan.useMutation();

  const handleGeneratePartial = async (mealType: 'breakfast' | 'lunch' | 'dinner') => {
    try {
      await generatePartialMutation.mutateAsync({ mealType });
      await refetch();
    } catch (error) {
      console.error(`Failed to generate ${mealType} plan:`, error);
      alert(`Failed to generate ${mealType} plan`);
    }
  };

  const handleGenerateNew = async () => {
    try {
      await generateMutation.mutateAsync({});
      await refetch();
    } catch (error) {
      console.error('Failed to generate meal plan:', error);
      alert('Failed to generate meal plan');
    }
  };

  // Format week range
  const formatWeekRange = (weekStartDate: string) => {
    const startDate = new Date(weekStartDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}-${endDay}`;
    }
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  };

  // Get day date
  const getDayDate = (weekStartDate: string, dayIndex: number) => {
    const startDate = new Date(weekStartDate);
    const mealDate = new Date(startDate);
    mealDate.setDate(startDate.getDate() + dayIndex);

    const month = mealDate.toLocaleDateString('en-US', { month: 'short' });
    const day = mealDate.getDate();
    return `${month} ${day}`;
  };

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayShortNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🍽️</div>
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-2xl">🍽️</span>
                <span className="text-xl font-bold text-foreground">FamilyPlate</span>
              </Link>
              <span className="text-muted">|</span>
              <span className="text-lg text-foreground">
                {preferences?.familyName ? `${preferences.familyName}'s Meal Plan` : 'Meal Plan'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/preferences">
                <Button variant="outline" size="sm">
                  Edit Preferences
                </Button>
              </Link>
              <Link href="/api/auth/logout">
                <Button variant="ghost" size="sm">
                  Logout
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {!mealPlan ? (
            /* Empty State */
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🍽️</div>
              <h2 className="text-2xl font-bold text-foreground mb-2">No Meal Plan Yet</h2>
              <p className="text-muted mb-6">Generate your first personalized meal plan!</p>
              <Button
                onClick={handleGenerateNew}
                disabled={generateMutation.isPending}
                size="lg"
              >
                {generateMutation.isPending ? 'Generating...' : '🪄 Generate Meal Plan'}
              </Button>
            </div>
          ) : (
            <>
              {/* View Toggle */}
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-foreground">
                  Week of {formatWeekRange(mealPlan.weekStartDate)}
                </h1>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'week' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('week')}
                  >
                    Week View
                  </Button>
                  <Button
                    variant={viewMode === 'day' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('day')}
                  >
                    Day View
                  </Button>
                </div>
              </div>

              {/* Generate New Plan Button */}
              <div className="mb-6">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleGenerateNew}
                  disabled={generateMutation.isPending}
                >
                  🪄 {generateMutation.isPending ? 'Generating...' : 'Generate New Plan'}
                </Button>
              </div>

              {viewMode === 'week' ? (
                /* Week View - Grid Layout */
                <div className="space-y-6">
                  {/* Day Headers */}
                  <div className="grid grid-cols-8 gap-2">
                    <div className="col-span-1"></div>
                    {dayShortNames.map((day, index) => (
                      <div key={day} className="text-center">
                        <div className="font-semibold text-foreground">{day}</div>
                        <div className="text-xs text-muted">{getDayDate(mealPlan.weekStartDate, index).split(' ')[1]}</div>
                      </div>
                    ))}
                  </div>

                  {/* Meal Type Rows */}
                  {(['breakfast', 'lunch', 'dinner'] as const).map(mealType => {
                    const groupedMeals = groupMealsByType(mealPlan.meals);
                    const mealsForType = groupedMeals[mealType];
                    const hasMeals = mealsForType && mealsForType.length > 0;

                    return (
                      <div key={mealType} className="grid grid-cols-8 gap-2">
                        {/* Meal Type Label */}
                        <div className="col-span-1 flex flex-col items-center justify-center">
                          <div className="text-2xl mb-1">{mealTypeIcons[mealType]}</div>
                          <div className="text-sm font-semibold text-foreground capitalize">{mealType}</div>
                        </div>

                        {/* Meal Cards or Empty State */}
                        {hasMeals ? (
                          mealsForType.map((meal, dayIndex) => (
                            <Card
                              key={dayIndex}
                              className="bg-surface border-border hover:border-primary cursor-pointer transition-colors"
                              onClick={() => setSelectedMeal({
                                meal,
                                index: dayIndex,
                                day: dayNames[dayIndex].toLowerCase(),
                                mealType
                              })}
                            >
                              <CardContent className="p-3">
                                <div className="text-2xl mb-1 text-center">{meal.emoji || '🍽️'}</div>
                                <div className="text-xs font-medium text-foreground text-center line-clamp-2">
                                  {meal.name}
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <div className="col-span-7 flex items-center justify-center">
                            <Card className="bg-surface border-dashed border-border w-full">
                              <CardContent className="p-4 text-center">
                                <p className="text-sm text-muted mb-2">No {mealType} plan yet</p>
                                <Button
                                  variant="outline"
                                  size="sm"
                              onClick={() => handleGeneratePartial(mealType)}
                              disabled={generatePartialMutation.isPending}
                                >
                                  + Generate {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                                </Button>
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Day View - Vertical Stack */
                <div className="space-y-6">
                  {/* Day Navigation */}
                  <div className="flex items-center justify-between mb-6">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedDayIndex(Math.max(0, selectedDayIndex - 1))}
                      disabled={selectedDayIndex === 0}
                    >
                      ← Previous Day
                    </Button>
                    <h2 className="text-xl font-semibold text-foreground">
                      {dayNames[selectedDayIndex]} • {getDayDate(mealPlan.weekStartDate, selectedDayIndex)}
                    </h2>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedDayIndex(Math.min(6, selectedDayIndex + 1))}
                      disabled={selectedDayIndex === 6}
                    >
                      Next Day →
                    </Button>
                  </div>

                  {/* Meals for Selected Day */}
                  {(['breakfast', 'lunch', 'dinner'] as const).map(mealType => {
                    const groupedMeals = groupMealsByType(mealPlan.meals);
                    const meal = groupedMeals[mealType]?.[selectedDayIndex];

                    return (
                      <div key={mealType}>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-2xl">{mealTypeIcons[mealType]}</span>
                          <h3 className="text-lg font-semibold text-foreground capitalize">{mealType}</h3>
                        </div>

                        {meal ? (
                          <Card className="bg-surface border-border">
                            <CardContent className="p-5">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-3xl">{meal.emoji || '🍽️'}</span>
                                <h4 className="text-xl font-bold text-foreground">{meal.name}</h4>
                              </div>
                              <p className="text-muted mb-4">{meal.description}</p>
                              <div className="flex gap-4 mb-4">
                                <div className="flex items-center gap-1 text-muted text-sm">
                                  <span>⏱️ Prep: {meal.prepTime}</span>
                                </div>
                                {meal.cookTime && (
                                  <div className="flex items-center gap-1 text-muted text-sm">
                                    <span>🍳 Cook: {meal.cookTime}</span>
                                  </div>
                                )}
                              </div>
                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => setSelectedMeal({
                                  meal,
                                  index: selectedDayIndex,
                                  day: dayNames[selectedDayIndex].toLowerCase(),
                                  mealType
                                })}
                              >
                                View Full Recipe
                              </Button>
                            </CardContent>
                          </Card>
                        ) : (
                          <Card className="bg-surface border-dashed border-border">
                            <CardContent className="p-5 text-center">
                              <p className="text-sm text-muted mb-3">No {mealType} for this day yet</p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleGeneratePartial(mealType)}
                                disabled={generatePartialMutation.isPending}
                              >
                                + Generate {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                              </Button>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Recipe Modal */}
      {selectedMeal && (
        <RecipeModal
          meal={selectedMeal.meal}
          mealIndex={selectedMeal.index}
          day={selectedMeal.day}
          mealType={selectedMeal.mealType}
          onClose={() => setSelectedMeal(null)}
          onMealRegenerated={(newMeal) => {
            refetch(); // Refresh meal plan
            setSelectedMeal(null); // Close modal
          }}
        />
      )}
    </div>
  );
}
