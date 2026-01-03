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
  
  const [loginMode, setLoginMode] = useState<"simple" | "magic">("simple");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  
  const loginMutation = trpc.auth.simpleLogin.useMutation();
  const magicLinkMutation = trpc.auth.requestMagicLink.useMutation();
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

  const handleMagicLink = async () => {
    console.log("[handleMagicLink] Function called", { email, name, timestamp: new Date().toISOString() });
    
    if (!email.trim()) {
      console.log("[handleMagicLink] Email validation failed");
      alert("Please enter your email");
      return;
    }

    console.log("[handleMagicLink] Starting magic link mutation...");
    try {
      const result = await magicLinkMutation.mutateAsync({
        email: email.trim(),
        name: name.trim() || undefined,
      });
      console.log("[handleMagicLink] Magic link mutation successful:", result);
      setMagicLinkSent(true);
    } catch (error) {
      console.error("[handleMagicLink] Magic link request failed:", error);
      alert("Failed to send magic link. Please try again.");
    }
  };

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

  const isLoading = loginMutation.isPending || magicLinkMutation.isPending;

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

        {/* Login Mode Tabs */}
        <View className="flex-row w-full gap-2">
          <Pressable
            onPress={() => { setLoginMode("simple"); setMagicLinkSent(false); }}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: loginMode === "simple" ? "#0a7ea4" : "transparent",
              borderWidth: 1,
              borderColor: loginMode === "simple" ? "#0a7ea4" : "#E5E7EB",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{
              textAlign: "center",
              fontWeight: "600",
              color: loginMode === "simple" ? "white" : "#687076",
            }}>
              Quick Login
            </Text>
          </Pressable>
          
          <Pressable
            onPress={() => { setLoginMode("magic"); setMagicLinkSent(false); }}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: loginMode === "magic" ? "#0a7ea4" : "transparent",
              borderWidth: 1,
              borderColor: loginMode === "magic" ? "#0a7ea4" : "#E5E7EB",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{
              textAlign: "center",
              fontWeight: "600",
              color: loginMode === "magic" ? "white" : "#687076",
            }}>
              Magic Link
            </Text>
          </Pressable>
        </View>

        {/* Login Form */}
        <View className="w-full gap-4">
          {loginMode === "simple" && (
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
          )}
          
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

          {magicLinkSent ? (
            <View className="bg-surface border border-border rounded-xl p-4">
              <Text className="text-foreground text-center font-semibold mb-2">✉️ Check Your Email</Text>
              <Text className="text-muted text-center text-sm">
                We've sent a magic link to {email}. Click the link to log in.
              </Text>
              <Text className="text-muted text-center text-xs mt-2">
                Link expires in 15 minutes.
              </Text>
            </View>
          ) : (
            Platform.OS === 'web' ? (
              <button
                onClick={loginMode === "simple" ? handleLogin : handleMagicLink}
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
                {isLoading ? 'Loading...' : (loginMode === "simple" ? 'Get Started' : 'Send Magic Link')}
              </button>
            ) : (
              <Pressable
                onPress={loginMode === "simple" ? handleLogin : handleMagicLink}
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
                    {loginMode === "simple" ? 'Get Started' : 'Send Magic Link'}
                  </Text>
                )}
              </Pressable>
            )
          )}
        </View>

        {!magicLinkSent && (
          <Text className="text-sm text-muted text-center">
            {loginMode === "simple" 
              ? "Enter your details to start planning meals"
              : "We'll send you a secure login link via email"}
          </Text>
        )}
        
        {magicLinkSent && (
          <Pressable onPress={() => setMagicLinkSent(false)}>
            <Text className="text-sm text-primary text-center">
              Didn't receive it? Try again
            </Text>
          </Pressable>
        )}
        

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
