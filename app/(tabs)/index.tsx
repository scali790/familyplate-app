import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { LoadingScreen } from "@/components/loading-screen";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

export default function HomeScreen() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/welcome");
    }
  }, [user, loading]);

  if (loading) {
    return <LoadingScreen message="Loading your dashboard..." />;
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-8">
          {/* Hero Section */}
          <View className="items-center gap-2">
            <Text className="text-4xl font-bold text-foreground">Welcome, {user.name || "Friend"}!</Text>
            <Text className="text-base text-muted text-center">
              Let's plan some delicious meals
            </Text>
          </View>

          {/* Quick Actions */}
          <View className="w-full max-w-sm self-center gap-4">
            <TouchableOpacity 
              className="bg-primary px-6 py-4 rounded-full active:opacity-80"
              onPress={() => router.push("/onboarding")}
            >
              <Text className="text-white text-center font-semibold text-lg">Set Up Preferences</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="bg-surface px-6 py-4 rounded-full active:opacity-80 border border-border"
              onPress={() => router.push("/dashboard")}
            >
              <Text className="text-foreground text-center font-semibold text-lg">View Meal Plan</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="bg-surface px-6 py-4 rounded-full active:opacity-80 border border-border"
              onPress={() => router.push("/settings")}
            >
              <Text className="text-foreground text-center font-semibold text-lg">Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
