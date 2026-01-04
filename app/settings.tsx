import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, Switch } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const logoutMutation = trpc.auth.logout.useMutation();
  const insets = useSafeAreaInsets();

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await logoutMutation.mutateAsync();
              await logout();
              router.replace("/welcome");
            } catch (error) {
              Alert.alert("Error", "Failed to logout");
              console.error(error);
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer>
      <ScrollView 
        className="flex-1 p-6"
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) + 40 }}
      >
        <View className="gap-6">
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              padding: 8,
              borderRadius: 8,
              backgroundColor: 'rgba(0,0,0,0.05)',
              alignSelf: 'flex-start',
            }}
          >
            <Text style={{ fontSize: 24, color: '#11181C' }} className="dark:text-[#ECEDEE]">←</Text>
          </TouchableOpacity>
          
          {/* Header */}
          <View className="items-center gap-2 mb-4">
            <View className="w-20 h-20 bg-primary rounded-full items-center justify-center">
              <Text className="text-4xl">👤</Text>
            </View>
            <Text className="text-2xl font-bold text-foreground">{user?.name || "User"}</Text>
            <Text className="text-muted">{user?.email || ""}</Text>
          </View>

          {/* Settings Options */}
          <View className="gap-3">
            <SettingItem
              icon="✏️"
              title="Edit Preferences"
              description="Update your meal planning preferences"
              onPress={() => router.push("/onboarding")}
            />
            
            <SettingItem
              icon="📊"
              title="View Dashboard"
              description="See your current meal plan"
              onPress={() => router.push("/dashboard")}
            />
            
            <SettingItem
              icon="🏠"
              title="Home"
              description="Return to home screen"
              onPress={() => router.push("/(tabs)")}
            />
          </View>

          {/* App Info */}
          <View className="mt-8 pt-6 border-t border-border">
            <Text className="text-sm text-muted text-center mb-4">
              FamilyPlate v1.0.0
            </Text>
            <Text className="text-sm text-muted text-center">
              AI-Powered Family Meal Planner
            </Text>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-error py-4 rounded-full active:opacity-80 mt-4"
          >
            <Text className="text-white text-center font-semibold text-lg">
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function SettingItem({
  icon,
  title,
  description,
  onPress,
}: {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-surface p-5 rounded-2xl border border-border active:opacity-70"
    >
      <View className="flex-row items-center gap-4">
        <Text className="text-3xl">{icon}</Text>
        <View className="flex-1">
          <Text className="text-lg font-semibold text-foreground">{title}</Text>
          <Text className="text-sm text-muted mt-1">{description}</Text>
        </View>
        <Text className="text-2xl text-muted">›</Text>
      </View>
    </TouchableOpacity>
  );
}
