import { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Platform, ScrollView } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function GeneratePlanScreen() {
  const [isGenerating, setIsGenerating] = useState(false);
  const generateMutation = trpc.mealPlanning.generatePlan.useMutation();
  const insets = useSafeAreaInsets();

  const handleGenerate = async () => {
    console.log("handleGenerate called");
    setIsGenerating(true);
    try {
      console.log("Calling generatePlan mutation...");
      const result = await generateMutation.mutateAsync();
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
                Our AI will create a personalized 7-day meal plan based on your preferences
              </Text>
            </View>

            {/* Features */}
            <View className="gap-3 w-full">
              <FeatureItem text="✨ AI-powered recommendations" />
              <FeatureItem text="🎯 Tailored to your family size" />
              <FeatureItem text="🍽️ Matches your cuisine preferences" />
              <FeatureItem text="⚡ Takes about 10 seconds" />
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

function FeatureItem({ text }: { text: string }) {
  return (
    <View className="flex-row items-center gap-3 bg-surface p-4 rounded-xl">
      <Text className="text-foreground">{text}</Text>
    </View>
  );
}
