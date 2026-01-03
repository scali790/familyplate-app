import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/lib/auth-provider";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function SignUpScreen() {
  const router = useRouter();
  const colors = useColors();
  const { signUp } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setLoading(true);
    try {
      await signUp(email, password);
      // Navigation will be handled by auth state change
    } catch (error: any) {
      Alert.alert("Sign Up Failed", error.message || "Could not create account");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginLink = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  return (
    <ScreenContainer className="flex-1 p-6">
      <View className="flex-1 justify-center gap-6">
        {/* Header */}
        <View className="items-center gap-2 mb-8">
          <Text className="text-3xl font-bold text-foreground">Create Account</Text>
          <Text className="text-base text-muted">Sign up to get started</Text>
        </View>

        {/* Email Input */}
        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="next"
            className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
            placeholderTextColor={colors.muted}
          />
        </View>

        {/* Password Input */}
        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">Password</Text>
          <View className="relative">
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password"
              returnKeyType="done"
              onSubmitEditing={handleSignUp}
              className="bg-surface border border-border rounded-xl px-4 py-3 pr-12 text-foreground"
              placeholderTextColor={colors.muted}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: 12,
                top: 12,
              }}
              activeOpacity={0.6}
            >
              <IconSymbol
                name={showPassword ? "eye.slash" : "eye"}
                size={20}
                color={colors.muted}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity
          onPress={handleSignUp}
          disabled={loading}
          style={{
            backgroundColor: colors.primary,
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: "center",
            opacity: loading ? 0.6 : 1,
          }}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-base font-semibold text-white">Sign Up</Text>
          )}
        </TouchableOpacity>

        {/* Login Link */}
        <View className="flex-row items-center justify-center gap-1">
          <Text className="text-sm text-muted">Already have an account?</Text>
          <TouchableOpacity onPress={handleLoginLink} activeOpacity={0.6}>
            <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
              Log In
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
