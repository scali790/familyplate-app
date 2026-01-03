import { Text, View, ActivityIndicator, Platform } from "react-native";
import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";

export default function VerifyMagicLinkScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { refresh } = useAuth();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState("");

  const verifyMutation = trpc.auth.verifyMagicLink.useMutation();

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Invalid magic link - no token provided");
      return;
    }

    // On mobile web, try to open the app first
    const isMobileWeb = Platform.OS === 'web' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobileWeb) {
      const appScheme = "manus20260103024933";
      const deepLink = `${appScheme}://auth/verify?token=${token}`;
      
      console.log("[VerifyMagicLink] Mobile web detected, attempting to open app:", deepLink);
      
      // Try to open the app
      window.location.href = deepLink;
      
      // If app doesn't open within 2 seconds, continue with web verification
      setTimeout(() => {
        console.log("[VerifyMagicLink] App didn't open, continuing with web verification");
      }, 2000);
    }

    // Verify the magic link token
    const verifyToken = async () => {
      console.log("[VerifyMagicLink] Starting verification for token:", token);
      
      try {
        const result = await verifyMutation.mutateAsync({ token });
        console.log("[VerifyMagicLink] Verification successful:", result);

        // Store session token in localStorage (for web) or AsyncStorage (for native)
        if (result.sessionToken) {
          console.log("[VerifyMagicLink] Storing session token...");
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
          console.log("[VerifyMagicLink] Session token and user info stored");
        }

        // Refresh auth state
        console.log("[VerifyMagicLink] Refreshing auth state...");
        await refresh();
        console.log("[VerifyMagicLink] Auth state refreshed");
        
        // Invalidate all queries to refetch with new auth
        queryClient.invalidateQueries();
        console.log("[VerifyMagicLink] Queries invalidated");

        setStatus("success");

        // Redirect to onboarding after successful login
        // The onboarding screen will check if user has already completed it
        setTimeout(() => {
          console.log("[VerifyMagicLink] Redirecting to onboarding");
          router.replace("/onboarding");
        }, 1500);
      } catch (error: any) {
        console.error("[VerifyMagicLink] Verification failed:", error);
        setStatus("error");
        setErrorMessage(error.message || "Failed to verify magic link");
      }
    };

    verifyToken();
  }, [token]);

  return (
    <ScreenContainer className="justify-center items-center p-6">
      <View className="items-center gap-6 w-full max-w-md">
        {status === "verifying" && (
          <>
            <ActivityIndicator size="large" color="#0a7ea4" />
            <Text className="text-2xl font-bold text-foreground text-center">
              Verifying Magic Link
            </Text>
            <Text className="text-muted text-center">
              Please wait while we log you in...
            </Text>
          </>
        )}

        {status === "success" && (
          <>
            <Text className="text-6xl">✅</Text>
            <Text className="text-2xl font-bold text-foreground text-center">
              Login Successful!
            </Text>
            <Text className="text-muted text-center">
              Redirecting you to the app...
            </Text>
          </>
        )}

        {status === "error" && (
          <>
            <Text className="text-6xl">❌</Text>
            <Text className="text-2xl font-bold text-foreground text-center">
              Verification Failed
            </Text>
            <Text className="text-muted text-center">
              {errorMessage}
            </Text>
            <Text
              className="text-primary text-center mt-4"
              onPress={() => router.replace("/welcome")}
              style={{ textDecorationLine: "underline", cursor: "pointer" }}
            >
              Return to login
            </Text>
          </>
        )}
      </View>
    </ScreenContainer>
  );
}
