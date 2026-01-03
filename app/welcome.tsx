import { View, Text, TouchableOpacity, Image } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import Constants from "expo-constants";

export default function WelcomeScreen() {
  const { user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.replace("/(tabs)");
    }
  }, [user]);

  const handleLogin = () => {
    // Get the API base URL from expo constants
    const apiUrl = Constants.expoConfig?.extra?.apiUrl || "http://localhost:3000";
    const loginUrl = `${apiUrl}/api/oauth/login`;
    
    // Open OAuth login in browser
    if (typeof window !== "undefined") {
      window.open(loginUrl, "_self");
    }
  };

  return (
    <ScreenContainer className="justify-center items-center p-6">
      <View className="items-center gap-8 w-full max-w-md">
        {/* Logo */}
        <Image
          source={require("@/assets/images/icon.png")}
          style={{ width: 120, height: 120 }}
          resizeMode="contain"
        />

        {/* Title */}
        <View className="items-center gap-2">
          <Text className="text-4xl font-bold text-foreground">EasyPlate</Text>
          <Text className="text-lg text-muted text-center">
            AI-Powered Family Meal Planner
          </Text>
        </View>

        {/* Features */}
        <View className="gap-4 w-full">
          <FeatureItem
            emoji="🤖"
            text="AI-generated 7-day meal plans"
          />
          <FeatureItem
            emoji="👨‍👩‍👧‍👦"
            text="Family voting on meals"
          />
          <FeatureItem
            emoji="🎯"
            text="Personalized to your preferences"
          />
        </View>

        {/* Login Button */}
        <TouchableOpacity
          onPress={handleLogin}
          className="bg-primary w-full py-4 rounded-full active:opacity-80 mt-4"
        >
          <Text className="text-white text-center font-semibold text-lg">
            Get Started
          </Text>
        </TouchableOpacity>

        <Text className="text-sm text-muted text-center">
          Sign in with your account to start planning meals
        </Text>
      </View>
    </ScreenContainer>
  );
}

function FeatureItem({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View className="flex-row items-center gap-3 bg-surface p-4 rounded-xl">
      <Text className="text-2xl">{emoji}</Text>
      <Text className="text-foreground flex-1">{text}</Text>
    </View>
  );
}
