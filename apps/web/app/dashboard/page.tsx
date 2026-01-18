'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RecipeModal } from '@/components/recipe-modal';
import VotingResultsModal from '@/components/voting-results-modal';
import { ShoppingListModalV2 as ShoppingListModal } from '@/components/shopping-list-modal-v2';
import { DayFocusPanel } from '@/components/day-focus-panel';
import { trpc } from '@/lib/trpc';
import { EventName } from '@/lib/events';
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
  const [selectedMeal, setSelectedMeal] = useState<{ meal: Meal; mealIndex: number; day: string; mealType: string } | null>(null);
  // viewMode removed - Week View is the only view, Day Focus handles day details
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0); // 0 = Monday
  const [votingSession, setVotingSession] = useState<{ sessionId: string; shareUrl: string } | null>(null);
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [isDayFocusOpen, setIsDayFocusOpen] = useState(false);
  const [focusedDayIndex, setFocusedDayIndex] = useState<number | null>(null);

  // Fetch current meal plan and preferences
  const { data: mealPlan, isLoading, refetch } = trpc.mealPlanning.getCurrentPlan.useQuery();
  const { data: preferences } = trpc.preferences.getPreferences.useQuery();
  
  // Mutations
  const generateMutation = trpc.mealPlanning.generatePlan.useMutation();
  const generatePartialMutation = trpc.mealPlanning.generatePartialPlan.useMutation();
  const createVotingSessionMutation = trpc.voteSessions.create.useMutation();
  // const regenerateMealMutation = trpc.mealPlanning.regenerateMeal.useMutation(); // Not implemented yet
  const trackEventMutation = trpc.events.track.useMutation();

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
    trackEventMutation.mutate({
      eventName: EventName.MEALPLAN_GENERATE_CLICKED,
    });
    try {
      const result = await generateMutation.mutateAsync({});
      trackEventMutation.mutate({
        eventName: EventName.MEALPLAN_GENERATED,
        properties: {
          mealCount: result?.meals?.length || 0,
        },
      });
      await refetch();
    } catch (error) {
      console.error('Failed to generate meal plan:', error);
      alert('Failed to generate meal plan');
    }
  };

  const handleShareForVoting = async () => {
    if (!mealPlan) return;

    try {
      const session = await createVotingSessionMutation.mutateAsync({
        mealPlanId: mealPlan.id,
        maxVoters: preferences?.familySize || 10,
        expiresInDays: 7,
      });

      setVotingSession(session);
      setShowVotingModal(true);
    } catch (error) {
      console.error('Failed to create voting session:', error);
      alert('Failed to create voting session');
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

  // Check if meal type is enabled in user preferences
  const isMealTypeEnabled = (mealType: string) => {
    if (!preferences?.mealTypes || !Array.isArray(preferences.mealTypes)) return true; // Default to enabled if no preferences
    return (preferences.mealTypes as string[]).includes(mealType);
  };

  // Get today's day index (0 = Monday, 6 = Sunday)
  const getTodayIndex = (weekStartDate: string) => {
    const today = new Date();
    const startDate = new Date(weekStartDate);
    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays < 7 ? diffDays : -1; // Return -1 if not in current week
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
                {/* View toggle removed - Day Focus is the only day view */}
              </div>

              {/* Action Buttons */}
              <div className="mb-6 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleGenerateNew}
                  disabled={generateMutation.isPending}
                >
                  🪄 {generateMutation.isPending ? 'Generating...' : 'Generate New Plan'}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowShoppingList(true)}
                >
                  📝 Shopping List
                </Button>
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={handleShareForVoting}
                  disabled={createVotingSessionMutation.isPending}
                >
                  👥 {createVotingSessionMutation.isPending ? 'Creating...' : 'Share for Voting'}
                </Button>
              </div>

              {/* Week View is the only view - Day Focus handles day details */}
              {
                /* Week View - Grid Layout */
                <div className="space-y-6">
                  {/* Day Headers */}
                  <div className="grid grid-cols-8 gap-2">
                    <div className="col-span-1"></div>
                    {dayShortNames.map((day, index) => {
                      const isToday = getTodayIndex(mealPlan.weekStartDate) === index;
                      return (
                        <button
                          key={day}
                          onClick={() => {
                            setFocusedDayIndex(index);
                            setIsDayFocusOpen(true);
                          }}
                          className={`text-center rounded-lg p-2 transition-all hover:scale-105 hover:shadow-md cursor-pointer group ${
                            isToday
                              ? 'bg-primary/10 border-2 border-primary'
                              : 'bg-surface border border-border'
                          }`}
                        >
                          <p className="font-bold text-foreground text-sm">{day}</p>
                          <p className="text-xs text-muted">{getDayDate(mealPlan.weekStartDate, index)}</p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Meal Grid */}
                  {Object.entries(groupMealsByType(mealPlan.meals)).map(([mealType, meals]) => {
                    if (!isMealTypeEnabled(mealType)) return null;

                    return (
                      <div key={mealType} className="grid grid-cols-8 gap-2 items-start">
                        <div className="col-span-1 flex items-center justify-center h-full">
                          <div className="text-center">
                            <p className="text-2xl">{mealTypeIcons[mealType]}</p>
                            <p className="text-xs font-bold text-muted capitalize">{mealType}</p>
                          </div>
                        </div>
                        {dayNames.map((day, dayIndex) => {
                          const meal = meals.find(m => m.day?.toLowerCase() === day.toLowerCase());
                          return (
                            <div key={day} className="col-span-1">
                              {meal ? (
                                <Card
                                  className="h-full cursor-pointer hover:shadow-lg transition-shadow bg-surface"
                                  onClick={() => setSelectedMeal({ meal, mealIndex: dayIndex, day, mealType })}
                                >
                                  <CardContent className="p-3 text-center flex flex-col items-center justify-center h-full">
                                    <div className="text-3xl mb-2">{meal.emoji || '🍽️'}</div>
                                    <p className="text-xs font-semibold text-foreground leading-tight line-clamp-2">
                                      {meal.name}
                                    </p>
                                  </CardContent>
                                </Card>
                              ) : (
                                <div className="h-full flex items-center justify-center bg-background rounded-lg border border-dashed border-border/50">
                                  <span className="text-muted text-xs">Empty</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              }
            </>
          )}
        </div>
      </main>

      {selectedMeal && (
        <RecipeModal
          meal={selectedMeal.meal}
          mealIndex={selectedMeal.mealIndex}
          day={selectedMeal.day}
          mealType={selectedMeal.mealType}
          onClose={() => setSelectedMeal(null)}
          onMealRegenerated={(newMeal) => {
            trackEventMutation.mutate({
              eventName: EventName.MEAL_REGENERATED,
              properties: { mealName: newMeal.name, mealType: newMeal.mealType },
            });
            refetch();
            setSelectedMeal(null);
          }}
        />
      )}

      {showShoppingList && mealPlan && (
        <ShoppingListModal
          meals={mealPlan.meals}
          onClose={() => setShowShoppingList(false)}
        />
      )}

      {votingSession && (
        <VotingResultsModal
          sessionId={votingSession.sessionId}
          shareUrl={votingSession.shareUrl}
          weekStartDate={mealPlan?.weekStartDate || ''}
          onClose={() => setVotingSession(null)}
        />
      )}

      {isDayFocusOpen && focusedDayIndex !== null && mealPlan && (
        <DayFocusPanel
          open={isDayFocusOpen}
          dayIndex={focusedDayIndex}
          dayName={dayNames[focusedDayIndex]}
          weekStartDate={mealPlan.weekStartDate}
          meals={mealPlan.meals.filter(m => {
            if (!m.day) return false;
            const mealDayIndex = (dayNames.indexOf(m.day.charAt(0).toUpperCase() + m.day.slice(1).toLowerCase()) - new Date(mealPlan.weekStartDate).getUTCDay() + 7) % 7;
            return mealDayIndex === focusedDayIndex;
          })}
          onClose={() => setIsDayFocusOpen(false)}
          onOpenRecipe={(meal) => setSelectedMeal({ meal, mealIndex: focusedDayIndex || 0, day: dayNames[focusedDayIndex || 0], mealType: meal.mealType! })}
          onRegenerateMeal={(meal) => {
            trackEventMutation.mutate({
              eventName: EventName.MEAL_SWAPPED,
              properties: { mealName: meal.name, mealType: meal.mealType },
            });
            // TODO: Implement regeneration logic
            refetch();
          }}
        />
      )}
    </div>
  );
}
