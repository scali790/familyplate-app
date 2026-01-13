'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RecipeModal } from '@/components/recipe-modal';
import VotingResultsModal from '@/components/voting-results-modal';
import { ShoppingListModal } from '@/components/shopping-list-modal';
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
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0); // 0 = Monday
  const [votingSession, setVotingSession] = useState<{ sessionId: string; shareUrl: string } | null>(null);
  const [showVotingModal, setShowVotingModal] = useState(false);

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

              {viewMode === 'week' ? (
                /* Week View - Grid Layout */
                <div className="space-y-6">
                  {/* Day Headers */}
                  <div className="grid grid-cols-8 gap-2">
                    <div className="col-span-1"></div>
                    {dayShortNames.map((day, index) => {
                      const isToday = getTodayIndex(mealPlan.weekStartDate) === index;
                      return (
                        <div key={day} className={`text-center rounded-lg p-2 transition-colors ${
                          isToday ? 'bg-gradient-to-br from-orange-100 to-amber-100 border-2 border-orange-400' : ''
                        }`}>
                          <div className={`font-semibold ${
                            isToday ? 'text-orange-600' : 'text-foreground'
                          }`}>
                            {day}
                            {isToday && <div className="text-[10px] font-bold text-orange-600">TODAY</div>}
                          </div>
                          <div className={`text-xs ${
                            isToday ? 'text-orange-500 font-medium' : 'text-muted'
                          }`}>{getDayDate(mealPlan.weekStartDate, index).split(' ')[1]}</div>
                        </div>
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
                                <div className={`text-xs font-medium text-center line-clamp-2 mb-1 ${
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
                                    {meal.tags.slice(0, 2).map((tag, i) => (
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
                    const isEnabled = isMealTypeEnabled(mealType);

                    return (
                      <div key={mealType}>
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`text-2xl ${!isEnabled ? 'opacity-30 grayscale' : ''}`}>{mealTypeIcons[mealType]}</span>
                          <h3 className={`text-lg font-semibold capitalize ${
                            isEnabled ? 'text-foreground' : 'text-muted-foreground opacity-40'
                          }`}>
                            {mealType}
                            {!isEnabled && <span className="text-xs ml-2">(disabled)</span>}
                          </h3>
                        </div>

                        {meal ? (
                          <Card className={`bg-surface border-border ${!isEnabled ? 'opacity-50 border-dashed' : ''}`}>
                            <CardContent className="p-5">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-3xl ${!isEnabled ? 'grayscale' : ''}`}>{meal.emoji || '🍽️'}</span>
                                <h4 className={`text-xl font-bold ${
                                  isEnabled ? 'text-foreground' : 'text-muted-foreground'
                                }`}>{meal.name}</h4>
                              </div>
                              <p className={`mb-4 ${isEnabled ? 'text-muted' : 'text-muted-foreground'}`}>{meal.description}</p>
                              <div className="flex gap-4 mb-4">
                                <div className={`flex items-center gap-1 text-sm ${
                                  isEnabled ? 'text-muted' : 'text-muted-foreground'
                                }`}>
                                  <span>⏱️ Prep: {meal.prepTime}</span>
                                </div>
                                {meal.cookTime && (
                                  <div className={`flex items-center gap-1 text-sm ${
                                    isEnabled ? 'text-muted' : 'text-muted-foreground'
                                  }`}>
                                    <span>🍳 Cook: {meal.cookTime}</span>
                                  </div>
                                )}
                              </div>
                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => isEnabled && setSelectedMeal({
                                  meal,
                                  index: selectedDayIndex,
                                  day: dayNames[selectedDayIndex].toLowerCase(),
                                  mealType
                                })}
                                disabled={!isEnabled}
                              >
                                View Full Recipe
                              </Button>
                            </CardContent>
                          </Card>
                        ) : (
                          <Card className={`bg-surface border-dashed border-border ${!isEnabled ? 'opacity-50' : ''}`}>
                            <CardContent className="p-5 text-center">
                              <p className={`text-sm mb-3 ${
                                isEnabled ? 'text-muted' : 'text-muted-foreground'
                              }`}>
                                {isEnabled 
                                  ? `No ${mealType} for this day yet` 
                                  : `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} is disabled in preferences`
                                }
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

      {/* Voting Results Modal */}
      {showVotingModal && votingSession && mealPlan && (
        <VotingResultsModal
          sessionId={votingSession.sessionId}
          shareUrl={votingSession.shareUrl}
          familyName={preferences?.familyName}
          weekStartDate={mealPlan.weekStartDate}
          onClose={() => setShowVotingModal(false)}
        />
      )}

      {/* Shopping List Modal */}
      {showShoppingList && mealPlan && (
        <ShoppingListModal
          meals={mealPlan.meals}
          onClose={() => setShowShoppingList(false)}
        />
      )}
    </div>
  );
}
