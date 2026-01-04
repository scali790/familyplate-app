import { useState } from "react";
import { View, Text, TouchableOpacity, Pressable, ScrollView, RefreshControl, ActivityIndicator, Platform, Share } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { RecipeModal } from "@/components/RecipeModal";
import { trpc } from "@/lib/trpc";
import type { Meal } from "@/drizzle/schema";
import * as Haptics from "expo-haptics";
import { getIconsForTags } from "@/src/utils/iconMapping";

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  const { data: mealPlan, isLoading, refetch } = trpc.mealPlanning.getCurrentPlan.useQuery();
  const voteMutation = trpc.mealPlanning.vote.useMutation();
  const regenerateMutation = trpc.mealPlanning.regenerateMeal.useMutation();
  const [regeneratingDay, setRegeneratingDay] = useState<string | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleVote = async (mealDay: string, voteType: "up" | "down") => {
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
      
      if (navigator.share) {
        await navigator.share({
          title: "Vote on This Week's Meal Plan",
          text: "Help choose our family meals for this week!",
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert(`Link copied to clipboard!\n\nShare this link with your family:\n${shareUrl}`);
      }
    } catch (error: any) {
      console.error('Share failed:', error);
      if (error.message !== 'User did not share') {
        if (Platform.OS === 'web') {
          alert('Failed to share. Please try again.');
        }
      }
    }
  };

  const handleGenerateNew = () => {
    router.push("/generate-plan");
  };

  if (isLoading) {
    return (
      <ScreenContainer className="justify-center items-center">
        <ActivityIndicator size="large" color="#FF8C42" />
      </ScreenContainer>
    );
  }

  if (!mealPlan) {
    return (
      <ScreenContainer className="justify-center items-center p-6">
        <View className="items-center gap-6 max-w-md">
          <Text className="text-6xl">🍽️</Text>
          <Text className="text-2xl font-bold text-foreground text-center">
            No Meal Plan Yet
          </Text>
          <Text className="text-muted text-center">
            Generate your first AI-powered meal plan to get started!
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
        <View className="p-6 gap-6">
          {/* Header */}
          <View className="gap-4">
            <View className="flex-row items-center justify-between mb-2">
              <TouchableOpacity
                onPress={() => router.back()}
                style={{
                  padding: 8,
                  borderRadius: 8,
                  backgroundColor: 'rgba(0,0,0,0.05)',
                }}
              >
                <Text style={{ fontSize: 24, color: '#11181C' }} className="dark:text-[#ECEDEE]">←</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/settings')}
                style={{
                  padding: 8,
                  borderRadius: 8,
                  backgroundColor: 'rgba(0,0,0,0.05)',
                }}
              >
                <Text style={{ fontSize: 24 }}>⚙️</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-3xl font-bold text-foreground">This Week's Plan</Text>
                <Text className="text-muted">Week of {mealPlan.weekStartDate}</Text>
              </View>
              <TouchableOpacity
                onPress={handleGenerateNew}
                className="bg-success px-4 py-2 rounded-full active:opacity-80"
              >
                <Text className="text-white font-semibold">New Plan</Text>
              </TouchableOpacity>
            </View>
            
            {/* Share Button */}
            <Pressable
              onPress={() => {
                console.log('Button pressed!');
                handleShare();
              }}
              style={({ pressed }) => ({
                backgroundColor: pressed ? 'rgba(255, 140, 66, 0.2)' : 'rgba(255, 140, 66, 0.1)',
                borderWidth: 1,
                borderColor: '#FF8C42',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: 'pointer',
              })}
            >
              <Text style={{ fontSize: 24 }}>👨‍👩‍👧‍👦</Text>
              <Text style={{ color: '#FF8C42', fontWeight: '600' }}>Share with Family to Vote</Text>
            </Pressable>

            {/* Shopping List Button */}
            <Pressable
              onPress={() => router.push(`/shopping-list?mealPlanId=${mealPlan.id}`)}
              style={({ pressed }) => ({
                backgroundColor: pressed ? 'rgba(74, 222, 128, 0.2)' : 'rgba(74, 222, 128, 0.1)',
                borderWidth: 1,
                borderColor: '#4ADE80',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: 'pointer',
              })}
            >
              <Text style={{ fontSize: 24 }}>🛒</Text>
              <Text style={{ color: '#4ADE80', fontWeight: '600' }}>Generate Shopping List</Text>
            </Pressable>
          </View>

          {/* Meal Cards */}
          <View className="gap-4">
            {mealPlan.meals.map((meal, index) => (
              <MealCard
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

function MealCard({ 
  meal, 
  onVote, 
  onPress, 
  onRegenerate, 
  isRegenerating,
  weekStartDate 
}: { 
  meal: Meal; 
  onVote: (voteType: "up" | "down") => void; 
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
    <View className="bg-surface rounded-2xl p-5 border border-border">
      {/* Day & Name with Regenerate Button */}
      <View className="mb-3 flex-row items-start justify-between">
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-sm font-semibold text-primary uppercase">{meal.day}</Text>
            <Text className="text-sm text-muted">• {getDayDate()}</Text>
          </View>
          <View className="flex-row items-center gap-1.5 mt-1">
            {meal.tags && meal.tags.length > 0 && (
              <Text className="text-base">{getIconsForTags(meal.tags).join(" ")}</Text>
            )}
            <Text className="text-lg font-bold text-foreground flex-1">{meal.name}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={onRegenerate}
          disabled={isRegenerating}
          className="ml-2 bg-primary/10 px-3 py-2 rounded-full active:opacity-70"
          style={{ opacity: isRegenerating ? 0.5 : 1 }}
        >
          <Text className="text-sm font-semibold text-primary">
            {isRegenerating ? "⏳" : "🔄"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Description - Tappable area for recipe details */}
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <Text className="text-muted mb-3">{meal.description}</Text>
      </TouchableOpacity>

      {/* Meta Info - Tappable area for recipe details */}
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <View className="flex-row gap-4 mb-4">
          <View className="flex-row items-center gap-1">
            <Text className="text-muted">⏱️ {meal.prepTime}</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Text className="text-muted">
              {meal.difficulty === "Easy" && "🟢"}
              {meal.difficulty === "Medium" && "🟡"}
              {meal.difficulty === "Hard" && "🔴"}
              {" "}{meal.difficulty}
            </Text>
          </View>
        </View>
        {/* View Recipe hint */}
        <View className="mb-3 px-3 py-2 bg-primary/10 rounded-lg">
          <Text className="text-primary text-center text-sm font-semibold">
            👆 Tap here to view full recipe
          </Text>
        </View>
      </TouchableOpacity>

      {/* Voting */}
      <View className="flex-row items-center justify-between pt-3 border-t border-border">
        <Text className="text-muted font-medium">Family Votes</Text>
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => onVote("up")}
            className="flex-row items-center gap-1 bg-success/10 px-3 py-2 rounded-full active:opacity-70"
          >
            <Text className="text-lg">👍</Text>
            <Text className="text-success font-semibold">{meal.upvotes}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onVote("down")}
            className="flex-row items-center gap-1 bg-error/10 px-3 py-2 rounded-full active:opacity-70"
          >
            <Text className="text-lg">👎</Text>
            <Text className="text-error font-semibold">{meal.downvotes}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
