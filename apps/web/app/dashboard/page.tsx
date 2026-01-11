'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { RecipeModal } from '@/components/recipe-modal';
import { WeekView } from '@/components/week-view';
import { DayView } from '@/components/day-view';
import { trpc } from '@/lib/trpc';
import type { Meal } from '@/server/db/schema';

export default function DashboardPage() {
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [currentDayIndex, setCurrentDayIndex] = useState(0);

  // Fetch current meal plan and preferences
  const { data: mealPlan, isLoading, refetch } = trpc.mealPlanning.getCurrentPlan.useQuery();
  const { data: preferences } = trpc.preferences.getPreferences.useQuery();
  
  // Mutations
  const generateMutation = trpc.mealPlanning.generatePlan.useMutation();

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

  // Get meal types from preferences (default to all if not set)
  const mealTypes = preferences?.mealTypes || ['breakfast', 'lunch', 'dinner'];

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
              <h1 className="text-lg font-semibold text-foreground">
                {preferences?.familyName ? `${preferences.familyName}'s Meal Plan` : 'Meal Plan'}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/preferences">
                <Button variant="outline" size="sm">
                  Edit Preferences
                </Button>
              </Link>
              <form action="/auth/logout" method="POST">
                <Button variant="ghost" size="sm" type="submit">
                  Logout
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {!mealPlan ? (
            /* Empty State */
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🍽️</div>
              <h3 className="text-2xl font-bold text-foreground mb-2">
                No Meal Plan Yet
              </h3>
              <p className="text-muted mb-6">
                Generate your first personalized meal plan based on your preferences
              </p>
              <Button 
                size="lg" 
                onClick={handleGenerateNew}
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? 'Generating...' : 'Generate Meal Plan'}
              </Button>
            </div>
          ) : (
            <>
              {/* Week Header & View Toggle */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">
                  Week of {formatWeekRange(mealPlan.weekStartDate)}
                </h2>

                {/* View Mode Toggle */}
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

              {/* Action Buttons */}
              <div className="space-y-3 mb-6">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleGenerateNew}
                  disabled={generateMutation.isPending}
                >
                  {generateMutation.isPending ? 'Generating...' : '🔄 Generate New Plan'}
                </Button>
              </div>

              {/* Week View or Day View */}
              {viewMode === 'week' ? (
                <WeekView
                  meals={mealPlan.meals}
                  mealTypes={mealTypes}
                  weekStartDate={mealPlan.weekStartDate}
                  onMealClick={(meal) => {
                    setSelectedMeal(meal);
                  }}
                />
              ) : (
                <DayView
                  meals={mealPlan.meals}
                  mealTypes={mealTypes}
                  currentDayIndex={currentDayIndex}
                  weekStartDate={mealPlan.weekStartDate}
                  onMealClick={(meal) => {
                    setSelectedMeal(meal);
                  }}
                  onPrevDay={() => setCurrentDayIndex(Math.max(0, currentDayIndex - 1))}
                  onNextDay={() => setCurrentDayIndex(Math.min(6, currentDayIndex + 1))}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Recipe Modal */}
      {selectedMeal && (
        <RecipeModal
          meal={selectedMeal}
          onClose={() => setSelectedMeal(null)}
        />
      )}
    </div>
  );
}
