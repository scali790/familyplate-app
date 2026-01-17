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
              <div className="mb-6 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleGenerateNew}
                  disabled={generateMutation.isPending}
                >
                  🪤 {generateMutation.isPending ? 'Generating...' : 'Generate new plan'}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowShoppingList(true)}
                >
                  🛒 Shopping list
                </Button>
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={handleShareForVoting}
                  disabled={createVotingSessionMutation.isPending}
                >
                  👥 {createVotingSessionMutation.isPending ? 'Creating...' : 'Share for voting'}
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
                            isToday ? 'bg-gradient-to-br from-orange-100 to-amber-100 border-2 border-orange-400' : 'hover:bg-surface'
                          }`}
                        >
                          <div className={`font-semibold flex items-center justify-center gap-1 ${
                            isToday ? 'text-orange-600' : 'text-foreground'
                          }`}>
                            {day}
                            <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">›</span>
                            {isToday && <div className="text-[10px] font-bold text-orange-600 w-full">TODAY</div>}
                          </div>
                          <div className={`text-xs ${
                            isToday ? 'text-orange-500 font-medium' : 'text-muted'
                          }`}>{getDayDate(mealPlan.weekStartDate, index).split(' ')[1]}</div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Meal Type Rows */}
                  {(['breakfast', 'lunch', 'dinner'] as const).map(mealType => {
                    const groupedMeals = groupMealsByType(mealPlan.meals);
                    const mealsForType = groupedMeals[mealType];
                    const hasMeals = mealsForType && mealsForType.length > 0;
                    const isEnabled = isMealTypeEnabled(mealType);

                    return (
                      <div key={mealType} className="grid grid-cols-8 gap-2">
                        {/* Meal Type Label */}
                        <div className="col-span-1 flex flex-col items-center justify-center">
                          <div className={`text-2xl mb-1 ${!isEnabled ? 'opacity-30' : ''}`}>{mealTypeIcons[mealType]}</div>
                          <div className={`text-sm font-semibold capitalize ${!isEnabled ? 'text-muted-foreground opacity-40' : 'text-foreground'}`}>
                            {mealType}
                            {!isEnabled && <div className="text-[10px] text-muted-foreground">disabled</div>}
                          </div>
                        </div>

                        {/* Meal Cards or Empty State */}
                        {hasMeals ? (
                          mealsForType.map((meal, dayIndex) => (
                            <Card
                              key={dayIndex}
                              className={`bg-surface border-border transition-colors ${
                                isEnabled 
                                  ? 'hover:border-primary cursor-pointer' 
                                  : 'opacity-50 cursor-not-allowed border-dashed'
                              }`}
                              onClick={() => isEnabled && setSelectedMeal({
                                meal,
                                index: dayIndex,
                                day: dayNames[dayIndex].toLowerCase(),
                                mealType
                              })}
                            >
                              <CardContent className="p-3">
                                <div className={`text-2xl mb-1 text-center ${!isEnabled ? 'grayscale' : ''}`}>{meal.emoji || '🍽️'}</div>
                                <div className={`text-xs font-medium text-center line-clamp-1 mb-1 ${
                                  isEnabled ? 'text-foreground' : 'text-muted-foreground'
                                }`}>
                                  {meal.name}
                                </div>
                                
                                {/* Prep Time */}
                                {meal.prepTime && (
                                  <div className="text-[10px] text-muted text-center mb-1">
                                    ⏱️ {meal.prepTime}
                                  </div>
                                )}
                                
                                {/* Tags */}
                                {meal.tags && meal.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 justify-center mb-1">
                                    {cleanAndLimitTags(meal.tags, 3).map((tag, i) => (
                                      <span key={i} className="text-[9px] px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded-full">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                
                                {/* Voting Results */}
                                {((meal.upVotes ?? 0) > 0 || (meal.neutralVotes ?? 0) > 0 || (meal.downVotes ?? 0) > 0) ? (
                                  <div className="flex gap-1 justify-center text-[10px] mt-1">
                                    {(meal.upVotes ?? 0) > 0 && <span>👍{meal.upVotes}</span>}
                                    {(meal.neutralVotes ?? 0) > 0 && <span>😐{meal.neutralVotes}</span>}
                                    {(meal.downVotes ?? 0) > 0 && <span>👎{meal.downVotes}</span>}
                                  </div>
                                ) : null}
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <div className="col-span-7 flex items-center justify-center">
                            <Card className={`bg-surface border-dashed border-border w-full ${!isEnabled ? 'opacity-50' : ''}`}>
                              <CardContent className="p-4 text-center">
                                <p className={`text-sm mb-2 ${isEnabled ? 'text-muted' : 'text-muted-foreground'}`}>
                                  {isEnabled ? `No ${mealType} plan yet` : `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} is disabled in preferences`}
                                </p>
                                <Button
                                  variant="outline"
                                  size="sm"
                              onClick={() => handleGeneratePartial(mealType)}
                              disabled={generatePartialMutation.isPending || !isEnabled}
                              title={!isEnabled ? `Enable ${mealType} in preferences to generate` : ''}
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
        />
      )}
    </div>
  );
}
