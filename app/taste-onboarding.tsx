import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, Platform, ActivityIndicator, ScrollView } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenContainer } from "@/components/screen-container";
import { TASTE_DISHES, type TasteDish } from "@/constants/taste-dishes";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";

/**
 * Taste Onboarding Screen
 * 
 * New users vote 👍/👎 on 10 representative dishes to establish initial taste preferences.
 * These votes are saved as "taste signals" for personalized meal generation.
 */
export default function TasteOnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [votedCount, setVotedCount] = useState(0);
  const [isChecking, setIsChecking] = useState(true);
  
  const saveDishVote = trpc.dishVotes.save.useMutation();
  const existingVotes = trpc.dishVotes.getAll.useQuery({ context: "onboarding" });

  // Check if user has already completed taste onboarding
  useEffect(() => {
    if (existingVotes.data) {
      console.log("[TasteOnboarding] Existing votes:", existingVotes.data.length);
      
      // If user has already voted on dishes during onboarding, skip this screen
      if (existingVotes.data.length > 0) {
        console.log("[TasteOnboarding] User already completed taste onboarding, skipping...");
        router.replace("/onboarding");
        return;
      }
      
      setIsChecking(false);
    }
  }, [existingVotes.data]);

  const currentDish = TASTE_DISHES[currentIndex];
  const progress = ((votedCount / TASTE_DISHES.length) * 100).toFixed(0);

  const handleVote = async (liked: boolean) => {
    // Haptic feedback
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Save vote to backend
    try {
      await saveDishVote.mutateAsync({
        dishName: currentDish.name,
        liked,
        context: "onboarding",
        metadata: {
          cuisine: currentDish.cuisine,
          protein: currentDish.protein,
          spice_level: currentDish.spice_level,
          cooking_time: currentDish.cooking_time,
          difficulty: currentDish.difficulty,
        },
      });
    } catch (error) {
      console.error("Failed to save dish vote:", error);
    }

    // Move to next dish
    const nextCount = votedCount + 1;
    setVotedCount(nextCount);

    if (nextCount >= TASTE_DISHES.length) {
      // All dishes voted, proceed to main onboarding
      router.replace("/onboarding");
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Show loading while checking for existing votes
  if (isChecking || existingVotes.isLoading) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 16 }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ fontSize: 16, color: colors.muted }}>Loading...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView 
        contentContainerStyle={{ 
          flexGrow: 1, 
          padding: 20, 
          paddingBottom: Math.max(insets.bottom, 20) + 80,
          justifyContent: "space-between" 
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontSize: 28, fontWeight: "bold", color: colors.foreground }}>
            Confirm Your Family's Style
          </Text>
          <Text style={{ fontSize: 16, color: colors.muted, lineHeight: 24 }}>
            Help us understand your family's taste preferences by voting on these dishes. Vote based on what your family generally enjoys!
          </Text>
          
          {/* Progress Bar */}
          <View style={{ marginTop: 8 }}>
            <View style={{ 
              height: 6, 
              backgroundColor: colors.surface, 
              borderRadius: 3,
              overflow: "hidden"
            }}>
              <View style={{ 
                height: "100%", 
                width: `${progress}%` as any, 
                backgroundColor: colors.primary 
              }} />
            </View>
            <Text style={{ 
              fontSize: 13, 
              color: colors.muted, 
              marginTop: 6,
              textAlign: "center"
            }}>
              {votedCount} / {TASTE_DISHES.length} dishes rated
            </Text>
          </View>
        </View>

        {/* Dish Card */}
        <View style={{
          backgroundColor: colors.surface,
          borderRadius: 20,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}>
          {/* Dish Image */}
          <Image
            source={{ uri: currentDish.imageUrl }}
            style={{ width: "100%", height: 280 }}
            resizeMode="cover"
          />

          {/* Dish Info */}
          <View style={{ padding: 20, gap: 12 }}>
            <Text style={{ 
              fontSize: 24, 
              fontWeight: "bold", 
              color: colors.foreground 
            }}>
              {currentDish.name}
            </Text>

            <Text style={{ 
              fontSize: 15, 
              color: colors.muted, 
              lineHeight: 22 
            }}>
              {currentDish.description}
            </Text>

            {/* Tags */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
              <View style={{
                backgroundColor: colors.background,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
              }}>
                <Text style={{ fontSize: 13, color: colors.foreground }}>
                  🍽️ {currentDish.cuisine}
                </Text>
              </View>
              <View style={{
                backgroundColor: colors.background,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
              }}>
                <Text style={{ fontSize: 13, color: colors.foreground }}>
                  ⏱️ {currentDish.cooking_time}
                </Text>
              </View>
              <View style={{
                backgroundColor: colors.background,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
              }}>
                <Text style={{ fontSize: 13, color: colors.foreground }}>
                  {currentDish.spice_level === "high" ? "🌶️🌶️🌶️" : 
                   currentDish.spice_level === "medium" ? "🌶️🌶️" : "🌶️"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Vote Buttons */}
        <View style={{ flexDirection: "row", gap: 16 }}>
          {/* Dislike Button */}
          <TouchableOpacity
            onPress={() => handleVote(false)}
            style={{
              flex: 1,
              backgroundColor: "#EF4444",
              paddingVertical: 18,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#EF4444",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 32 }}>👎</Text>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: "600", 
              color: "#FFFFFF", 
              marginTop: 4 
            }}>
              Not for me
            </Text>
          </TouchableOpacity>

          {/* Like Button */}
          <TouchableOpacity
            onPress={() => handleVote(true)}
            style={{
              flex: 1,
              backgroundColor: "#22C55E",
              paddingVertical: 18,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#22C55E",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 32 }}>👍</Text>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: "600", 
              color: "#FFFFFF", 
              marginTop: 4 
            }}>
              I'd eat this
            </Text>
          </TouchableOpacity>
        </View>

        {/* Skip Button */}
        <TouchableOpacity
          onPress={() => router.replace("/onboarding")}
          style={{ alignItems: "center", paddingVertical: 12 }}
        >
          <Text style={{ fontSize: 15, color: colors.muted }}>
            Skip for now →
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
