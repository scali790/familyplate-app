'use client';

import { useState } from 'react';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MealCard } from '@/components/meal-card';
import { RecipeModal } from '@/components/recipe-modal';
import { trpc } from '@/lib/trpc';

type Meal = {
  day: string;
  name: string;
  description: string;
  prepTime: string;
  cookTime?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  upvotes: number;
  downvotes: number;
  ingredients: string[];
  instructions: string[];
  voters?: Array<{
    name: string;
    vote: '👍' | '👎';
  }>;
};

export default function DashboardPage() {
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [regeneratingDay, setRegeneratingDay] = useState<string | null>(null);

  // Fetch current meal plan and preferences
  const { data: mealPlan, isLoading, refetch } = trpc.mealPlanning.getCurrentPlan.useQuery();
  const { data: preferences } = trpc.preferences.getPreferences.useQuery();
  
  // Mutations
  const voteMutation = trpc.mealPlanning.vote.useMutation();
  const regenerateMutation = trpc.mealPlanning.regenerateMeal.useMutation();
  const generateMutation = trpc.mealPlanning.generatePlan.useMutation();

  const handleVote = async (mealDay: string, voteType: 'up' | 'down') => {
    if (!mealPlan) return;

    try {
      await voteMutation.mutateAsync({
        mealPlanId: mealPlan.id,
        mealDay,
        voteType,
      });
      await refetch();
    } catch (error) {
      console.error('Failed to save vote:', error);
      alert('Failed to save vote');
    }
  };

  const handleRegenerateMeal = async (dayIndex: number, dayName: string) => {
    if (!mealPlan) return;

    try {
      setRegeneratingDay(dayName);
      await regenerateMutation.mutateAsync({
        mealPlanId: mealPlan.id,
        dayIndex,
      });
      await refetch();
    } catch (error) {
      console.error('Failed to regenerate meal:', error);
      alert('Failed to regenerate meal');
    } finally {
      setRegeneratingDay(null);
    }
  };

  const handleGenerateNew = async () => {
    try {
      await generateMutation.mutateAsync();
      await refetch();
    } catch (error) {
      console.error('Failed to generate meal plan:', error);
      alert('Failed to generate meal plan');
    }
  };

  const handleShare = async () => {
    if (!mealPlan) {
      alert('No meal plan available to share');
      return;
    }

    const shareUrl = `${window.location.origin}/shared/${mealPlan.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Vote on This Week's Meal Plan",
          text: `Help choose our family meals for this week:`,
          url: shareUrl,
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
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
              <Link href="/onboarding/preferences">
                <Button variant="outline" size="sm">
                  Edit Preferences
                </Button>
              </Link>
              {mealPlan && (
                <Button variant="outline" size="sm" onClick={handleShare}>
                  Share to Vote
                </Button>
              )}
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
                  className="w-full border-primary text-primary hover:bg-primary/10"
                  onClick={handleShare}
                >
                  <span className="mr-2">👨‍👩‍👧‍👦</span>
                  Share with Family to Vote
                </Button>
                <Link href={`/shopping-list?mealPlanId=${mealPlan.id}`}>
                  <Button
                    variant="outline"
                    className="w-full border-success text-success hover:bg-success/10"
                  >
                    <span className="mr-2">🛒</span>
                    Generate Shopping List
                  </Button>
                </Link>
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
                {mealPlan.meals.map((meal: Meal, index: number) => (
                  <MealCard
                    key={meal.day}
                    meal={meal}
                    weekStartDate={mealPlan.weekStartDate}
                    familySize={preferences?.familySize}
                    onVote={(voteType) => handleVote(meal.day, voteType)}
                    onPress={() => setSelectedMeal(meal)}
                    onRegenerate={() => handleRegenerateMeal(index, meal.day)}
                    isRegenerating={regeneratingDay === meal.day}
                  />
                ))}
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
