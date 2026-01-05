import { View, Text, ActivityIndicator } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import { useEffect } from "react";

import { ScreenContainer } from "./screen-container";
import { useColors } from "@/hooks/use-colors";

interface LoadingScreenProps {
  /**
   * Optional loading message to display below the spinner
   */
  message?: string;
  /**
   * Whether to show the animated food emoji (default: true)
   */
  showEmoji?: boolean;
}

/**
 * Full-screen loading component with animated food emoji and spinner.
 * 
 * Usage:
 * ```tsx
 * <LoadingScreen message="Generating your meal plan..." />
 * ```
 */
export function LoadingScreen({ 
  message = "Loading...", 
  showEmoji = true 
}: LoadingScreenProps) {
  const colors = useColors();
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    // Rotate animation
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000 }),
      -1, // infinite
      false
    );

    // Pulse animation
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1, // infinite
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${rotation.value}deg` },
        { scale: scale.value },
      ],
    };
  });

  return (
    <ScreenContainer className="justify-center items-center">
      {showEmoji && (
        <Animated.View style={animatedStyle} className="mb-6">
          <Text style={{ fontSize: 64 }}>🍽️</Text>
        </Animated.View>
      )}
      
      <ActivityIndicator size="large" color={colors.primary} />
      
      {message && (
        <Text 
          className="text-foreground text-base mt-6 text-center px-8"
          style={{ opacity: 0.7 }}
        >
          {message}
        </Text>
      )}
    </ScreenContainer>
  );
}
