import { useState } from "react";
import { View, Text, TouchableOpacity, Pressable, ScrollView, RefreshControl, ActivityIndicator, Platform, Share } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { RecipeModal } from "@/components/RecipeModal";
import { trpc } from "@/lib/trpc";
import type { Meal } from "@/drizzle/schema";
import * as Haptics from "expo-haptics";
import { getIconsForTags } from "@/src/utils/iconMapping";
import { parseWeekStartString, getSunday, formatWeekRange } from "@/lib/week-utils";

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  const { data: mealPlan, isLoading, refetch } = trpc.mealPlanning.getCurrentPlan.useQuery();
  const { data: preferences } = trpc.mealPlanning.getPreferences.useQuery();
  const voteMutation = trpc.mealPlanning.vote.useMutation();
  const regenerateMutation = trpc.mealPlanning.regenerateMeal.useMutation();
  const [regeneratingDay, setRegeneratingDay] = useState<string | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleVote = async (mealDay: string, voteType: "up" | "down" | "neutral") => {
    if (!mealPlan) return;

    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      await voteMutation.mutateAsync({
        mealPlanId: mealPlan.id,
        mealDay,
        voteType,
      });
      await refetch();
    } catch (error) {
      console.error("Failed to save vote:", error);
      if (Platform.OS === 'web') {
        alert("Failed to save vote");
      }
    }
  };

  const handleRegenerateMeal = async (dayIndex: number, dayName: string) => {
    if (!mealPlan) return;

    try {
      setRegeneratingDay(dayName);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      await regenerateMutation.mutateAsync({
        mealPlanId: mealPlan.id,
        dayIndex,
      });
      await refetch();
    } catch (error) {
      console.error("Failed to regenerate meal:", error);
      if (Platform.OS === 'web') {
        alert("Failed to regenerate meal");
      }
    } finally {
      setRegeneratingDay(null);
    }
  };

  const handleShare = async () => {
    console.log('handleShare called!');
    if (!mealPlan) {
      console.log('No meal plan');
      if (Platform.OS === 'web') {
        alert('No meal plan available to share');
      }
      return;
    }
    
    try {
      // For mobile (React Native)
      if (Platform.OS !== 'web') {
        const baseUrl = 'https://8081-i8v4ix5aa7f1zts081bl0-ce872828.sg1.manus.computer';
        const shareUrl = `${baseUrl}/shared/${mealPlan.id}`;
        console.log('Mobile share URL:', shareUrl);
        
        await Share.share({
          message: `Vote on This Week's Meal Plan!\n\nHelp choose our family meals for this week:\n${shareUrl}`,
          title: "Vote on This Week's Meal Plan",
        });
        return;
      }
      
      // For web
      const shareUrl = `${window.location.origin}/shared/${mealPlan.id}`;
      console.log('Web share URL:', shareUrl);
      
      // Try native Web Share API first
      if (navigator.share) {
        await navigator.share({
          title: "Vote on This Week's Meal Plan",
          text: "Help choose our family meals for this week!",
          url: shareUrl,
        });
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Share failed:', error);
      if (Platform.OS === 'web') {
        alert('Failed to share');
      }
    }
  };

  const handleGenerateNew = () => {
    router.push('/generate-plan');
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF8C42" />
        </View>
      </ScreenContainer>
    );
  }

  if (!mealPlan) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center p-6">
          <View className="items-center gap-6 max-w-md">
            <Text className="text-6xl">🍽️</Text>
            <Text className="text-2xl font-bold text-foreground text-center">
              No Meal Plan Yet
            </Text>
            <Text className="text-muted text-center">
              Let's create your first weekly meal plan!
            </Text>
            <TouchableOpacity
              onPress={handleGenerateNew}
              className="bg-primary px-8 py-4 rounded-full active:opacity-80"
            >
              <Text className="text-white font-semibold text-lg">
                Generate Meal Plan
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF8C42" />
        }
      >
        <View className="p-4 gap-4">
          {/* Compact Header */}
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground">
                {preferences?.familyName ? `${preferences.familyName}'s Meals` : "This Week"}
              </Text>
              <Text className="text-sm text-muted">
                {(() => {
                  const startDate = parseWeekStartString(mealPlan.weekStartDate);
                  const endDate = getSunday(startDate);
                  return formatWeekRange(startDate, endDate);
                })()}
              </Text>
            </View>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => router.push('/settings')}
                className="w-10 h-10 items-center justify-center bg-surface rounded-full border border-border"
              >
                <Text style={{ fontSize: 18 }}>⚙️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleGenerateNew}
                className="bg-success px-4 h-10 items-center justify-center rounded-full active:opacity-80"
              >
                <Text className="text-white font-semibold text-sm">New</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Action Buttons */}
          <View className="flex-row gap-2">
            <Pressable
              onPress={handleShare}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: pressed ? 'rgba(255, 140, 66, 0.15)' : 'rgba(255, 140, 66, 0.1)',
                borderWidth: 1,
                borderColor: '#FF8C42',
                paddingVertical: 12,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              })}
            >
              <Text style={{ fontSize: 18 }}>👨‍👩‍👧‍👦</Text>
              <Text style={{ color: '#FF8C42', fontWeight: '600', fontSize: 14 }}>Share</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push(`/shopping-list?mealPlanId=${mealPlan.id}`)}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: pressed ? 'rgba(74, 222, 128, 0.15)' : 'rgba(74, 222, 128, 0.1)',
                borderWidth: 1,
                borderColor: '#4ADE80',
                paddingVertical: 12,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              })}
            >
              <Text style={{ fontSize: 18 }}>🛒</Text>
              <Text style={{ color: '#4ADE80', fontWeight: '600', fontSize: 14 }}>Shop</Text>
            </Pressable>
          </View>

          {/* Compact Meal Cards */}
          <View className="gap-2">
            {mealPlan.meals.map((meal, index) => (
              <CompactMealCard
                key={meal.day}
                meal={meal}
                onVote={(voteType) => handleVote(meal.day, voteType)}
                onPress={() => {
                  console.log("MealCard onPress called for:", meal.name);
                  setSelectedMeal(meal);
                  setModalVisible(true);
                }}
                onRegenerate={() => handleRegenerateMeal(index, meal.day)}
                isRegenerating={regeneratingDay === meal.day}
                weekStartDate={mealPlan.weekStartDate}
              />
            ))}
          </View>
        </View>
      </ScrollView>
      <RecipeModal
        visible={modalVisible}
        meal={selectedMeal}
        onClose={() => {
          setModalVisible(false);
          setSelectedMeal(null);
        }}
      />
    </ScreenContainer>
  );
}

function CompactMealCard({ 
  meal, 
  onVote, 
  onPress, 
  onRegenerate, 
  isRegenerating,
  weekStartDate,
}: { 
  meal: Meal; 
  onVote: (voteType: "up" | "down" | "neutral") => void; 
  onPress: () => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
  weekStartDate: string;
}) {
  // Calculate the actual date for this meal
  const getDayDate = () => {
    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const dayIndex = dayNames.indexOf(meal.day);
    const startDate = new Date(weekStartDate);
    const mealDate = new Date(startDate);
    mealDate.setDate(startDate.getDate() + dayIndex);
    
    // Format as "Jan 6"
    const month = mealDate.toLocaleDateString('en-US', { month: 'short' });
    const day = mealDate.getDate();
    return `${month} ${day}`;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="bg-surface rounded-xl p-3 border border-border"
    >
      <View className="flex-row items-center justify-between gap-3">
        {/* Left: Day + Meal Info */}
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="text-xs font-bold text-primary uppercase">{meal.day.slice(0, 3)}</Text>
            <Text className="text-xs text-muted">{getDayDate()}</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            {meal.tags && meal.tags.length > 0 && (
              <Text className="text-sm">{getIconsForTags(meal.tags).join(" ")}</Text>
            )}
            <Text className="text-base font-semibold text-foreground flex-1" numberOfLines={1}>
              {meal.name}
            </Text>
          </View>
        </View>

        {/* Right: Votes + Regenerate */}
        <View className="flex-row items-center gap-2">
          {/* Vote Counts */}
          <View className="flex-row items-center gap-1.5">
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onVote("up");
              }}
              className="flex-row items-center gap-0.5 bg-success/10 px-2 py-1 rounded-full"
            >
              <Text className="text-sm">👍</Text>
              <Text className="text-success font-semibold text-xs">{meal.upvotes}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onVote("neutral");
              }}
              className="flex-row items-center gap-0.5 bg-muted/10 px-2 py-1 rounded-full"
            >
              <Text className="text-sm">😐</Text>
              <Text className="text-muted font-semibold text-xs">{meal.neutralVotes || 0}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onVote("down");
              }}
              className="flex-row items-center gap-0.5 bg-error/10 px-2 py-1 rounded-full"
            >
              <Text className="text-sm">👎</Text>
              <Text className="text-error font-semibold text-xs">{meal.downvotes}</Text>
            </TouchableOpacity>
          </View>

          {/* Regenerate Button */}
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onRegenerate();
            }}
            disabled={isRegenerating}
            className="w-8 h-8 items-center justify-center bg-primary/10 rounded-full"
            style={{ opacity: isRegenerating ? 0.5 : 1 }}
          >
            <Text className="text-sm">
              {isRegenerating ? "⌛" : "🔄"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}
