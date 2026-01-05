import { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Platform, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { WeekSelector } from "@/components/week-selector";
import { trpc } from "@/lib/trpc";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getDefaultPlanningWeek, formatDateForDB } from "@/lib/week-utils";

export default function GeneratePlanScreen() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const defaultWeek = getDefaultPlanningWeek();
    return formatDateForDB(defaultWeek);
  });
  const generateMutation = trpc.mealPlanning.generatePlan.useMutation();
  const { data: existingPlans = [], isLoading: loadingPlans } = trpc.mealPlanning.getAllPlans.useQuery();
  const insets = useSafeAreaInsets();

  const handleGenerate = async () => {
    console.log("handleGenerate called");
    
    // Check if plan already exists for this week
    const existingPlan = existingPlans.find(plan => plan.weekStartDate === selectedWeek);
    
    if (existingPlan) {
      // Show confirmation dialog
      if (Platform.OS === 'web') {
        const confirmed = confirm(
          `A meal plan already exists for this week (${existingPlan.mealCount} meals).\n\n` +
          `Do you want to replace it with a new plan?\n\n` +
          `⚠️ This will delete the existing plan and all votes.`
        );
        if (!confirmed) return;
      } else {
        // For mobile, use Alert
        return new Promise((resolve) => {
          Alert.alert(
            "Replace Existing Plan?",
            `A meal plan already exists for this week (${existingPlan.mealCount} meals).\n\nDo you want to replace it with a new plan?\n\n⚠️ This will delete the existing plan and all votes.`,
            [
              { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
              { 
                text: "Replace Plan", 
                style: "destructive", 
                onPress: () => {
                  resolve(true);
                  proceedWithGeneration();
                }
              },
            ]
          );
        });
      }
    }
    
    await proceedWithGeneration();
  };
  
  const proceedWithGeneration = async () => {
    setIsGenerating(true);
    try {
      console.log("Calling generatePlan mutation for week:", selectedWeek);
      const result = await generateMutation.mutateAsync({ weekStartDate: selectedWeek });
      console.log("Meal plan generated successfully:", result);
      
      if (Platform.OS === 'web') {
        alert("Your meal plan has been generated!");
      }
      router.replace("/dashboard");
    } catch (error: any) {
      const message = error?.message || "Failed to generate meal plan";
      console.error("[GeneratePlan] Failed to generate meal plan:", error);
      console.error("[GeneratePlan] Error details:", JSON.stringify(error, null, 2));
      console.error("[GeneratePlan] Error stack:", error?.stack);
      
      if (Platform.OS === 'web') {
        alert(`Error: ${message}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: Math.max(insets.bottom, 20) + 80 }}>
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            padding: 8,
            borderRadius: 8,
            backgroundColor: 'rgba(0,0,0,0.05)',
            alignSelf: 'flex-start',
            marginTop: 20,
            marginBottom: 20,
          }}
        >
          <Text style={{ fontSize: 24, color: '#11181C' }} className="dark:text-[#ECEDEE]">←</Text>
        </TouchableOpacity>
        
        <View className="flex-1 justify-center items-center min-h-[600px]">
          <View className="items-center gap-8 max-w-md w-full">
            {/* Icon */}
            <View className="w-32 h-32 bg-primary/10 rounded-full items-center justify-center">
              <Text className="text-6xl">🤖</Text>
            </View>

            {/* Title */}
            <View className="items-center gap-2">
              <Text className="text-3xl font-bold text-foreground text-center">
                Generate Meal Plan
              </Text>
              <Text className="text-muted text-center">
                We'll create a personalized 7-day meal plan based on your family's preferences
              </Text>
            </View>

            {/* Week Selector */}
            <View className="w-full">
              {loadingPlans ? (
                <ActivityIndicator size="small" color="#FF8C42" />
              ) : (
                <WeekSelector
                  selectedWeek={selectedWeek}
                  onSelectWeek={setSelectedWeek}
                  weeksToShow={4}
                  existingPlans={existingPlans}
                />
              )}
            </View>

            {/* Generate Button */}
            <TouchableOpacity
              onPress={handleGenerate}
              disabled={isGenerating}
              className="bg-primary w-full py-4 rounded-full active:opacity-80 mt-4"
            >
              {isGenerating ? (
                <View className="flex-row items-center justify-center gap-2">
                  <ActivityIndicator color="white" />
                  <Text className="text-white font-semibold text-lg">Generating...</Text>
                </View>
              ) : (
                <Text className="text-white text-center font-semibold text-lg">
                  Generate Plan
                </Text>
              )}
            </TouchableOpacity>

            {/* Cancel Button */}
            {!isGenerating && (
              <TouchableOpacity
                onPress={() => router.back()}
                className="mt-2"
              >
                <Text className="text-muted">Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
