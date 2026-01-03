import { View, Text, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export default function WelcomeScreen() {
  const router = useRouter();
  const colors = useColors();

  const handleGetStarted = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push("./auth/login" as any);
  };

  return (
    <ScreenContainer className="flex-1 items-center justify-center p-6">
      <View className="flex-1 items-center justify-center gap-8">
        {/* Logo */}
        <Image
          source={require("@/assets/images/icon.png")}
          style={{ width: 150, height: 150 }}
          resizeMode="contain"
        />

        {/* Tagline */}
        <View className="items-center gap-2">
          <Text className="text-4xl font-bold text-foreground text-center">
            EasyPlate
          </Text>
          <Text className="text-lg text-muted text-center">
            Easy Meals, Happy Tables
          </Text>
        </View>

        {/* Get Started Button */}
        <TouchableOpacity
          onPress={handleGetStarted}
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 48,
            paddingVertical: 16,
            borderRadius: 999,
          }}
          activeOpacity={0.8}
        >
          <Text className="text-lg font-semibold text-white">
            Get Started
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
