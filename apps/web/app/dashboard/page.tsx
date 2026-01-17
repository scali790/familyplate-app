'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RecipeModal } from '@/components/recipe-modal';
import VotingResultsModal from '@/components/voting-results-modal';
import { ShoppingListModal } from '@/components/shopping-list-modal';
import { DayFocusPanel } from '@/components/day-focus-panel';
import { WeeklyStatusHeader } from '@/components/weekly-status-header';
import { getMealTypeConfig } from '@/lib/meal-type-config';
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

// Clean, deduplicate, and limit tags
const cleanAndLimitTags = (tags: string[], maxTags: number = 3): string[] => {
  if (!tags || tags.length === 0) return [];

  // Fix common typos
  const fixTypos = (tag: string): string => {
    const typoMap: Record<string, string> = {
      'healt!': 'healthy',
      'healt': 'healthy',
      'vegetaria': 'vegetarian',
      'italia': 'italian',
    };
    return typoMap[tag.toLowerCase()] || tag;
  };

  // Clean and normalize tags
  const cleanedTags = tags
    .map(tag => fixTypos(tag.trim()))
    .filter(tag => tag.length > 0);

  // Remove duplicates (case-insensitive)
  const uniqueTags = Array.from(
    new Map(cleanedTags.map(tag => [tag.toLowerCase(), tag])).values()
  );

  // Prioritize tags: cuisine > protein > dietary
  const cuisines = ['italian', 'mediterranean', 'middle-eastern', 'mexican', 'asian', 'indian'];
  const proteins = ['chicken', 'beef', 'fish', 'seafood', 'pork'];
  const dietary = ['vegetarian', 'vegan', 'healthy', 'gluten-free'];

  const sortedTags = uniqueTags.sort((a, b) => {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    
    const aIsCuisine = cuisines.includes(aLower);
    const bIsCuisine = cuisines.includes(bLower);
    if (aIsCuisine && !bIsCuisine) return -1;
    if (!aIsCuisine && bIsCuisine) return 1;
    
    const aIsProtein = proteins.includes(aLower);
    const bIsProtein = proteins.includes(bLower);
    if (aIsProtein && !bIsProtein) return -1;
    if (!aIsProtein && bIsProtein) return 1;
    
    return 0;
  });

  return sortedTags.slice(0, maxTags);
};

// Meal Type Icons
const mealTypeIcons: Record<string, string> = {
  breakfast: '🌅',
  lunch: '🍱',
  dinner: '🌙',
};

// Group meals by day
const groupMealsByDay = (meals: Meal[], mealTypes: string[], dayNames: string[]) => {
  const grouped: Record<string, Record<string, Meal | undefined>> = {};
  
  dayNames.forEach(day => {
    grouped[day.toLowerCase()] = {};
    mealTypes.forEach(type => {
      grouped[day.toLowerCase()][type] = undefined;
    });
  });

  meals.forEach(meal => {
    if (meal.day && meal.mealType && grouped[meal.day]) {
      grouped[meal.day][meal.mealType] = meal;
    }
  });

  return grouped;
};

export default function DashboardPage() {
  const [selectedMeal, setSelectedMeal] = useState<{ meal: Meal; index: number; day: string; mealType: string } | null>(null);
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

  // Get day date and today status
  const getDayInfo = (weekStartDate: string, dayIndex: number) => {
    const startDate = new Date(weekStartDate);
    const mealDate = new Date(startDate);
    mealDate.setDate(startDate.getDate() + dayIndex);
    
    const today = new Date();
    const isToday = mealDate.getDate() === today.getDate() && 
                    mealDate.getMonth() === today.getMonth() && 
                    mealDate.getFullYear() === today.getFullYear();
    
    // Get actual weekday name from date
    const dayName = mealDate.toLocaleDateString('en-US', { weekday: 'long' });
    const dayShortName = mealDate.toLocaleDateString('en-US', { weekday: 'short' });
    
    return {
      date: mealDate.getDate(),
      month: mealDate.toLocaleDateString('en-US', { month: 'short' }),
      dayName,
      dayShortName,
      isToday
    };
  };

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayShortNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Check if meal type is enabled in user preferences
  const isMealTypeEnabled = (mealType: string) => {
    if (!preferences?.mealTypes || !Array.isArray(preferences.mealTypes)) return true; // Default to enabled if no preferences
    return (preferences.mealTypes as string[]).includes(mealType);
  };

  // Get meal types from preferences
  const mealTypes = (preferences?.mealTypes as string[]) || ['breakfast', 'lunch', 'dinner'];

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
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            {/* Left: Logo + Title */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Link href="/" className="flex items-center gap-2 flex-shrink-0">
                <span className="text-2xl">🍽️</span>
                <span className="text-lg md:text-xl font-bold text-foreground hidden sm:inline">FamilyPlate</span>
              </Link>
              <span className="text-muted hidden sm:inline">|</span>
              <span className="text-sm md:text-base text-foreground truncate">
                {preferences?.familyName ? `${preferences.familyName} family` : 'Meal Plan'}
              </span>
            </div>
            {/* Right: Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link href="/preferences">
                <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                  ⚙️ Preferences
                </Button>
                <Button variant="outline" size="sm" className="sm:hidden">
                  ⚙️
                </Button>
              </Link>
              <Link href="/api/auth/logout" prefetch={false}>
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                  👋 Sign out
                </Button>
                <Button variant="ghost" size="sm" className="sm:hidden">
                  👋
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
              <h2 className="text-2xl font-bold text-foreground mb-2">Let’s plan your week!</h2>
              <p className="text-muted mb-6">Tell us what your family loves, and we’ll create a week of delicious meals</p>
              <Button
                onClick={handleGenerateNew}
                disabled={generateMutation.isPending}
                size="lg"
              >
                {generateMutation.isPending ? 'Generating...' : '🪤 Generate meal plan'}
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

              {/* Weekly Status Header */}
              <WeeklyStatusHeader
                mealPlan={mealPlan}
                votingSession={votingSession}
                onOpenShoppingList={() => setShowShoppingList(true)}
                onOpenVotingResults={() => setShowVotingModal(true)}
              />

              {/* Action Buttons */}
              <div className="mb-6 space-y-3">
                {/* Primary CTA: Share for voting */}
                <Button
                  variant="default"
                  size="lg"
                  className="w-full"
                  onClick={handleShareForVoting}
                  disabled={createVotingSessionMutation.isPending}
                >
                  👥 {createVotingSessionMutation.isPending ? 'Creating...' : 'Share for voting'}
                </Button>
                
                {/* Secondary CTAs */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setShowShoppingList(true)}
                  >
                    🛒 Shopping list
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={handleGenerateNew}
                    disabled={generateMutation.isPending}
                  >
                    🪤 {generateMutation.isPending ? 'Generating...' : 'Generate new plan'}
                  </Button>
                </div>
              </div>

              {/* Week View is the only view - Day Focus handles day details */}
              {
                /* Day-based Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {dayNames.map((day, dayIndex) => {
                    const dayInfo = getDayInfo(mealPlan.weekStartDate, dayIndex);
                    const dayMeals = groupMealsByDay(mealPlan.meals, mealTypes, dayNames)[day.toLowerCase()];
                    
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
                        onClick={() => {
                          setFocusedDayIndex(dayIndex);
                          setIsDayFocusOpen(true);
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="mb-3 pb-3 border-b border-border">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className={`font-bold text-lg ${
                                  dayInfo.isToday ? 'text-orange-700' : 'text-foreground'
                                }`}>
                                  {dayInfo.dayShortName}
                                </div>
                                <div className={`text-xs ${
                                  dayInfo.isToday ? 'text-orange-600' : 'text-muted'
                                }`}>
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

                          <div className="space-y-2">
                            {mealTypes.map(mealType => {
                              const meal = dayMeals[mealType];
                              const config = getMealTypeConfig(mealType);
                              if (!config) return null;

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
                                    if (meal) {
                                      setSelectedMeal({
                                        meal,
                                        index: dayIndex,
                                        day: day.toLowerCase(),
                                        mealType
                                      });
                                    }
                                  }}
                                >
                                  <div className="space-y-1.5">
                                    {/* Gradient Badge like Day View */}
                                    <div className="flex justify-center">
                                      <div className={`
                                        inline-flex items-center gap-1.5 px-3 py-1
                                        bg-gradient-to-r ${config.badgeGradient}
                                        text-white text-[10px] font-bold uppercase tracking-wide
                                        rounded-3xl shadow-md
                                      `}>
                                        <span className="text-sm">{config.emoji}</span>
                                        <span>{config.label}</span>
                                      </div>
                                    </div>
                                    
                                    {/* Meal Content */}
                                    <div className="flex-1 min-w-0">
                                      {meal ? (
                                        <>
                                          <div className="text-xs text-foreground truncate text-center">
                                            {meal.name}
                                          </div>
                                          {meal.prepTime && (
                                            <div className="text-[10px] text-muted text-center">
                                              {meal.prepTime}
                                            </div>
                                          )}
                                        </>
                                      ) : (
                                        <div className="text-xs text-muted text-center">
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
              }
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

      {/* Voting Results Modal */}
      {showVotingModal && votingSession && mealPlan && (
        <VotingResultsModal
          sessionId={votingSession.sessionId}
          shareUrl={votingSession.shareUrl}
          familyName={preferences?.familyName}
          weekStartDate={mealPlan.weekStartDate}
          onClose={() => setShowVotingModal(false)}
          onGenerateShoppingList={() => {
            setShowVotingModal(false);
            setShowShoppingList(true);
          }}
        />
      )}

      {/* Shopping List Modal */}
      {showShoppingList && mealPlan && (
        <ShoppingListModal
          meals={mealPlan.meals}
          weekStartDate={mealPlan.weekStartDate}
          onClose={() => setShowShoppingList(false)}
        />
      )}
      {/* Day Focus Panel */}
      {isDayFocusOpen && focusedDayIndex !== null && mealPlan && (
        <DayFocusPanel
          open={isDayFocusOpen}
          dayIndex={focusedDayIndex}
          dayName={dayNames[focusedDayIndex]}
          weekStartDate={mealPlan.weekStartDate}
          meals={mealPlan.meals.filter((m) => {
            // Filter meals for the selected day
            if (!m.day) return false;
            const mealDayIndex = dayNames.findIndex(d => d.toLowerCase() === m.day!.toLowerCase());
            return mealDayIndex === focusedDayIndex;
          })}
          onClose={() => {
            setIsDayFocusOpen(false);
            setFocusedDayIndex(null);
          }}
          onOpenRecipe={(meal) => {
            if (!meal.day || !meal.mealType) return;
            const mealDayIndex = dayNames.findIndex(d => d.toLowerCase() === meal.day!.toLowerCase());
            setSelectedMeal({
              meal,
              index: mealDayIndex,
              day: meal.day!,
              mealType: meal.mealType!,
            });
            setIsDayFocusOpen(false);
          }}
          onRegenerateMeal={(meal) => {
            // TODO: Implement meal regeneration
            alert(`Regenerate meal: ${meal.name}`);
          }}
          onSwipeLeft={() => {
            // Next day
            if (focusedDayIndex < 6) {
              setFocusedDayIndex(focusedDayIndex + 1);
            }
          }}
          onSwipeRight={() => {
            // Previous day
            if (focusedDayIndex > 0) {
              setFocusedDayIndex(focusedDayIndex - 1);
            }
          }}
          canSwipeLeft={focusedDayIndex < 6}
          canSwipeRight={focusedDayIndex > 0}
        />
      )}
    </div>
  );
}
