import { View, Text, TouchableOpacity, Modal } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export default function PremiumModalScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams();
  const mealTitle = params.mealTitle as string;

  const handleClose = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const handleSubscribe = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // This is a static button, no actual payment integration
    handleClose();
  };

  return (
    <Modal
      visible={true}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 24,
            padding: 24,
            width: "100%",
            maxWidth: 400,
            gap: 20,
          }}
        >
          {/* Header */}
          <View className="items-center gap-2">
            <Text className="text-3xl">🔒</Text>
            <Text className="text-2xl font-bold text-foreground text-center">
              Unlock Premium Features
            </Text>
            <Text className="text-base text-muted text-center">
              Get full access to {mealTitle || "this recipe"}
            </Text>
          </View>

          {/* Benefits */}
          <View className="gap-3">
            <View className="flex-row items-start gap-3">
              <Text className="text-xl" style={{ color: colors.success }}>✓</Text>
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">
                  Full Recipes
                </Text>
                <Text className="text-sm text-muted">
                  Step-by-step cooking instructions
                </Text>
              </View>
            </View>

            <View className="flex-row items-start gap-3">
              <Text className="text-xl" style={{ color: colors.success }}>✓</Text>
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">
                  Shopping Lists
                </Text>
                <Text className="text-sm text-muted">
                  Organized ingredient lists for easy shopping
                </Text>
              </View>
            </View>

            <View className="flex-row items-start gap-3">
              <Text className="text-xl" style={{ color: colors.success }}>✓</Text>
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">
                  Nutritional Info
                </Text>
                <Text className="text-sm text-muted">
                  Calories, macros, and dietary information
                </Text>
              </View>
            </View>
          </View>

          {/* Pricing */}
          <View
            style={{
              backgroundColor: colors.background,
              borderRadius: 16,
              padding: 16,
              alignItems: "center",
            }}
          >
            <Text className="text-3xl font-bold" style={{ color: colors.primary }}>
              $4.99
            </Text>
            <Text className="text-sm text-muted">per month</Text>
          </View>

          {/* Subscribe Button */}
          <TouchableOpacity
            onPress={handleSubscribe}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: "center",
            }}
            activeOpacity={0.8}
          >
            <Text className="text-base font-semibold text-white">
              Subscribe Now
            </Text>
          </TouchableOpacity>

          {/* Maybe Later Button */}
          <TouchableOpacity
            onPress={handleClose}
            style={{
              paddingVertical: 12,
              alignItems: "center",
            }}
            activeOpacity={0.6}
          >
            <Text className="text-base font-medium text-muted">
              Maybe Later
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
