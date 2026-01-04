import { useState } from "react";
import { View, Text, TouchableOpacity, Pressable, ScrollView, RefreshControl, ActivityIndicator, Platform, TextInput } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { RecipeModal } from "@/components/RecipeModal";
import { trpc } from "@/lib/trpc";
import type { Meal } from "@/drizzle/schema";
import { getIconsForTags } from "@/src/utils/iconMapping";

export default function SharedMealPlanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [refreshing, setRefreshing] = useState(false);
  const [voterName, setVoterName] = useState("");
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  const { data: mealPlan, isLoading, refetch } = trpc.mealPlanning.getSharedPlan.useQuery(
    { planId: id! },
    { enabled: !!id }
  );
  const voteMutation = trpc.mealPlanning.voteShared.useMutation();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleVote = async (mealDay: string, voteType: "up" | "down") => {
    if (!mealPlan || !voterName.trim()) {
      alert("Please enter your name before voting!");
      return;
    }

    try {
      await voteMutation.mutateAsync({
        mealPlanId: mealPlan.id,
        mealDay,
        voteType,
        voterName: voterName.trim(),
      });
      setHasVoted(true);
      await refetch();
      
      if (Platform.OS === 'web') {
        alert("Vote saved! Thanks for your input!");
      }
    } catch (error) {
      console.error("Failed to save vote:", error);
      if (Platform.OS === 'web') {
        alert("Failed to save vote");
      }
    }
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
          <Text className="text-6xl">❌</Text>
          <Text className="text-2xl font-bold text-foreground text-center">
            Meal Plan Not Found
          </Text>
          <Text className="text-muted text-center">
            This meal plan may have been deleted or the link is invalid.
          </Text>
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
          <View className="items-center gap-2 bg-primary/10 p-6 rounded-2xl">
            <Text className="text-4xl">🍽️</Text>
            <Text className="text-2xl font-bold text-foreground text-center">
              Family Meal Plan
            </Text>
            <Text className="text-muted text-center">
              Week of {mealPlan.weekStartDate}
            </Text>
            <Text className="text-sm text-muted text-center mt-2">
              Vote on your favorite meals to help choose what we cook this week!
            </Text>
          </View>

          {/* Voter Name Input */}
          {!hasVoted && (
            <View className="bg-surface p-4 rounded-xl border border-border">
              <Text className="text-foreground font-semibold mb-2">
                Enter your name to vote:
              </Text>
              <TextInput
                value={voterName}
                onChangeText={setVoterName}
                placeholder="Your name"
                className="bg-background border border-border rounded-lg px-4 py-3 text-foreground"
                placeholderTextColor="#9BA1A6"
              />
            </View>
          )}

          {hasVoted && (
            <View className="bg-success/10 border border-success p-4 rounded-xl">
              <Text className="text-success font-semibold text-center">
                ✅ Thanks for voting, {voterName}!
              </Text>
              <Text className="text-muted text-center text-sm mt-1">
                You can change your votes anytime
              </Text>
            </View>
          )}

          {/* Meal Cards */}
          <View className="gap-4">
            {mealPlan.meals.map((meal: Meal) => (
              <MealCard
                key={meal.day}
                meal={meal}
                onVote={(voteType) => handleVote(meal.day, voteType)}
                canVote={!!voterName.trim()}
                onPress={() => {
                  setSelectedMeal(meal);
                  setModalVisible(true);
                }}
                weekStartDate={mealPlan.weekStartDate}
              />
            ))}
          </View>

          {/* Footer */}
          <View className="items-center gap-2 py-4">
            <Text className="text-muted text-sm text-center">
              Powered by EasyPlate 🍴
            </Text>
            <Text className="text-muted text-xs text-center">
              AI-Powered Family Meal Planning
            </Text>
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
  canVote,
  onPress,
  weekStartDate
}: { 
  meal: Meal; 
  onVote: (voteType: "up" | "down") => void;
  canVote: boolean;
  onPress: () => void;
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
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View className="bg-surface rounded-2xl p-5 border border-border">
      {/* Day & Name */}
      <View className="mb-3">
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

      {/* Description */}
      <Text className="text-muted mb-3">{meal.description}</Text>

      {/* Meta Info */}
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

      {/* Voting */}
      <View className="pt-3 border-t border-border">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-muted font-medium">Family Votes</Text>
          {!canVote && (
            <Text className="text-xs text-muted italic">Enter name to vote ↑</Text>
          )}
        </View>
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => {
              if (!canVote) {
                alert("Please enter your name above before voting!");
                return;
              }
              onVote("up");
            }}
            className={`flex-row items-center gap-1 px-4 py-2 rounded-full ${canVote ? 'bg-success/20 active:opacity-70' : 'bg-surface border border-border'}`}
          >
            <Text className="text-lg">👍</Text>
            <Text className={`font-semibold ${canVote ? 'text-success' : 'text-muted'}`}>{meal.upvotes}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (!canVote) {
                alert("Please enter your name above before voting!");
                return;
              }
              onVote("down");
            }}
            className={`flex-row items-center gap-1 px-4 py-2 rounded-full ${canVote ? 'bg-error/20 active:opacity-70' : 'bg-surface border border-border'}`}
          >
            <Text className="text-lg">👎</Text>
            <Text className={`font-semibold ${canVote ? 'text-error' : 'text-muted'}`}>{meal.downvotes}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
    </Pressable>
  );
}
