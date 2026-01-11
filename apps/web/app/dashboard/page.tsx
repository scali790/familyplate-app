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

export default function DashboardPage() {
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

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
              <Link href="/onboarding">
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
        <div className="max-w-4xl mx-auto">
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
              {/* Week Selector */}
              <div className="flex items-center justify-between mb-6">
                <Button variant="ghost" size="sm" disabled>
                  ← Previous Week
                </Button>
                <h2 className="text-xl font-semibold text-foreground">
                  {formatWeekRange(mealPlan.weekStartDate)}
                </h2>
                <Button variant="ghost" size="sm" disabled>
                  Next Week →
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 mb-6">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleGenerateNew}
                  disabled={generateMutation.isPending}
                >
                  {generateMutation.isPending ? 'Generating...' : 'Generate New Plan'}
                </Button>
              </div>

              {/* Meal Cards */}
              <div className="space-y-4">
                {mealPlan.meals.map((meal, index) => {
                  const dayName = dayNames[index];
                  
                  return (
                    <Card key={index} className="bg-surface border-border">
                      <CardContent className="p-5">
                        {/* Day & Name */}
                        <div className="mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-primary uppercase">{dayName}</span>
                            <span className="text-sm text-muted">• {getDayDate(mealPlan.weekStartDate, index)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            {meal.tags && meal.tags.length > 0 && (
                              <span className="text-base">{getIconsForTags(meal.tags).join(' ')}</span>
                            )}
                            <h3 className="text-lg font-bold text-foreground">{meal.name}</h3>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-muted mb-3">{meal.description}</p>

                        {/* Meta Info */}
                        <div className="flex gap-4 mb-3">
                          <div className="flex items-center gap-1 text-muted text-sm">
                            <span>⏱️ Prep: {meal.prepTime}</span>
                          </div>
                          {meal.cookTime && (
                            <div className="flex items-center gap-1 text-muted text-sm">
                              <span>🍳 Cook: {meal.cookTime}</span>
                            </div>
                          )}
                        </div>

                        {/* View Recipe Button */}
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setSelectedMeal(meal)}
                        >
                          View Full Recipe
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
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
