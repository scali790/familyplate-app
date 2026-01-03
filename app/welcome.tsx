import { View, Text, TouchableOpacity, Image, TextInput, ActivityIndicator, Platform, Pressable } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useQueryClient } from "@tanstack/react-query";

export default function WelcomeScreen() {
  const { user, refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const queryClient = useQueryClient();
  
  const loginMutation = trpc.auth.simpleLogin.useMutation();
  const { data: existingPreferences } = trpc.mealPlanning.getPreferences.useQuery(undefined, {
    enabled: !!user, // Only fetch if user is logged in
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user && existingPreferences !== undefined) {
      // If user has preferences, go to home; otherwise go to onboarding
      if (existingPreferences) {
        router.replace("/(tabs)");
      } else {
        router.replace("/onboarding");
      }
    }
  }, [user, existingPreferences]);

  const handleLogin = async () => {
    console.log("[handleLogin] Function called", { email, name, timestamp: new Date().toISOString() });
    console.log("[handleLogin] isLoading:", isLoading);
    console.log("[handleLogin] loginMutation.isPending:", loginMutation.isPending);
    
    if (!email.trim()) {
      console.log("[handleLogin] Email validation failed");
      alert("Please enter your email");
      return;
    }

    if (!name.trim()) {
      console.log("[handleLogin] Name validation failed");
      alert("Please enter your name");
      return;
    }

    console.log("[handleLogin] Starting login mutation...");
    try {
      // Create or login user via API
      const result = await loginMutation.mutateAsync({
        email: email.trim(),
        name: name.trim(),
      });
      console.log("[handleLogin] Login mutation successful:", result);

      // Store session token in localStorage (for web) or AsyncStorage (for native)
      if (result.sessionToken) {
        console.log("[handleLogin] Storing session token...");
        const { setSessionToken, setUserInfo } = await import("@/lib/_core/auth");
        await setSessionToken(result.sessionToken);
        if (result.user) {
          await setUserInfo({
            id: result.user.id,
            openId: result.user.openId,
            name: result.user.name,
            email: result.user.email || "",
            loginMethod: result.user.loginMethod,
            lastSignedIn: new Date(result.user.lastSignedIn),
          });
        }
        console.log("[handleLogin] Session token and user info stored");
      }

      // Refresh auth state
      console.log("[handleLogin] Refreshing auth state...");
      await refresh();
      console.log("[handleLogin] Auth state refreshed");
      
      // Invalidate all queries to refetch with new auth cookie
      queryClient.invalidateQueries();
      console.log("[handleLogin] Queries invalidated");
      
      // Navigation will happen via useEffect when user is set
    } catch (error) {
      console.error("[handleLogin] Login failed:", error);
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
            id="name"
            nativeID="name"
            className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
            placeholder="Your name"
            placeholderTextColor="#9BA1A6"
            value={name}
            onChangeText={setName}
            editable={!isLoading}
            autoCapitalize="words"
          />
          
          <TextInput
            id="email"
            nativeID="email"
            className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
            placeholder="Your email"
            placeholderTextColor="#9BA1A6"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
          />

          {Platform.OS === 'web' ? (
            <button
              onClick={handleLogin}
              disabled={isLoading}
              style={{
                backgroundColor: '#0a7ea4',
                width: '100%',
                padding: '16px',
                borderRadius: '9999px',
                opacity: isLoading ? 0.6 : 1,
                border: 'none',
                cursor: 'pointer',
                color: 'white',
                textAlign: 'center',
                fontWeight: '600',
                fontSize: '18px',
              }}
            >
              {isLoading ? 'Loading...' : 'Get Started'}
            </button>
          ) : (
            <Pressable
              onPress={handleLogin}
              disabled={isLoading}
              style={({ pressed }) => ({
                backgroundColor: '#0a7ea4',
                width: '100%',
                paddingVertical: 16,
                borderRadius: 9999,
                opacity: isLoading ? 0.6 : pressed ? 0.8 : 1,
              })}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600', fontSize: 18 }}>
                  Get Started
                </Text>
              )}
            </Pressable>
          )}
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
