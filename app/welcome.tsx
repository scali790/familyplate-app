import { View, Text, TouchableOpacity, Image, TextInput, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";

export default function WelcomeScreen() {
  const { user, refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  
  const loginMutation = trpc.auth.simpleLogin.useMutation();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.replace("/(tabs)");
    }
  }, [user]);

  const handleLogin = async () => {
    if (!email.trim()) {
      alert("Please enter your email");
      return;
    }

    if (!name.trim()) {
      alert("Please enter your name");
      return;
    }

    try {
      // Create or login user via API
      await loginMutation.mutateAsync({
        email: email.trim(),
        name: name.trim(),
      });

      // Refresh auth state
      await refresh();
      
      // Navigation will happen via useEffect when user is set
    } catch (error) {
      console.error("Login failed:", error);
      alert("Login failed. Please try again.");
    }
  };

  const isLoading = loginMutation.isPending;

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

        {/* Login Form */}
        <View className="w-full gap-4">
          <TextInput
            className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
            placeholder="Your name"
            placeholderTextColor="#9BA1A6"
            value={name}
            onChangeText={setName}
            editable={!isLoading}
            autoCapitalize="words"
          />
          
          <TextInput
            className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
            placeholder="Your email"
            placeholderTextColor="#9BA1A6"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
          />

          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            className="bg-primary w-full py-4 rounded-full active:opacity-80"
            style={{ opacity: isLoading ? 0.6 : 1 }}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-semibold text-lg">
                Get Started
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <Text className="text-sm text-muted text-center">
          Enter your details to start planning meals
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
