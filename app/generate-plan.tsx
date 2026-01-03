import { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";

export default function GeneratePlanScreen() {
  const [isGenerating, setIsGenerating] = useState(false);
  const generateMutation = trpc.mealPlanning.generatePlan.useMutation();

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generateMutation.mutateAsync();
      Alert.alert(
        "Success!",
        "Your meal plan has been generated",
        [{ text: "View Plan", onPress: () => router.replace("/dashboard") }]
      );
    } catch (error: any) {
      const message = error?.message || "Failed to generate meal plan";
      Alert.alert("Error", message);
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <ScreenContainer className="justify-center items-center p-6">
      <View className="items-center gap-8 max-w-md">
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

        {/* Back Button */}
        {!isGenerating && (
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-2"
          >
            <Text className="text-muted">Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
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
