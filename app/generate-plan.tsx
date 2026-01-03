import { View, Text, ActivityIndicator, Alert } from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/lib/auth-provider";
import { doc, getDoc, addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { generateMealPlan } from "@/lib/openai-service";

export default function GeneratePlanScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user } = useAuth();
  const [status, setStatus] = useState("Loading preferences...");

  useEffect(() => {
    generatePlan();
  }, []);

  const generatePlan = async () => {
    if (!user) {
      Alert.alert("Error", "No user found");
      router.back();
      return;
    }

    try {
      // Load user preferences
      setStatus("Loading your preferences...");
      const prefsDoc = await getDoc(doc(db, "preferences", user.uid));
      
      if (!prefsDoc.exists()) {
        Alert.alert("Error", "Please complete onboarding first");
        router.replace("./onboarding" as any);
        return;
      }

      const preferences = prefsDoc.data();

      // Generate meal plan using OpenAI
      setStatus("Generating your personalized meal plan...");
      const meals = await generateMealPlan({
        familySize: preferences.familySize,
        cuisines: preferences.cuisines,
        flavors: preferences.flavors,
        restrictions: preferences.restrictions,
      });

      // Save to Firestore
      setStatus("Saving your meal plan...");
      await addDoc(collection(db, "plans"), {
        userId: user.uid,
        meals,
        createdAt: new Date().toISOString(),
      });

      // Navigate to dashboard
      setStatus("Done!");
      setTimeout(() => {
        router.replace("./dashboard" as any);
      }, 500);
    } catch (error: any) {
      console.error("Error generating plan:", error);
      Alert.alert(
        "Generation Failed",
        error.message || "Could not generate meal plan. Please try again.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    }
  };

  return (
    <ScreenContainer className="flex-1 items-center justify-center p-6">
      <View className="items-center gap-6">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-xl font-bold text-foreground text-center">{status}</Text>
        <Text className="text-base text-muted text-center">
          This may take a few moments...
        </Text>
      </View>
    </ScreenContainer>
  );
}
