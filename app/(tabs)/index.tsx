import { View, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-provider";
import { useColors } from "@/hooks/use-colors";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function HomeScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const colors = useColors();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!loading) {
        if (!user) {
          // Not logged in, redirect to welcome
          router.replace("../welcome" as any);
        } else {
          // Check if user has completed onboarding
          try {
            const prefsDoc = await getDoc(doc(db, "preferences", user.uid));
            if (prefsDoc.exists()) {
              // Has preferences, go to dashboard
              router.replace("../dashboard" as any);
            } else {
              // No preferences, go to onboarding
              router.replace("../onboarding" as any);
            }
          } catch (error) {
            console.error("Error checking onboarding:", error);
            // Default to onboarding on error
            router.replace("../onboarding" as any);
          }
        }
        setChecking(false);
      }
    };

    checkOnboarding();
  }, [user, loading, router]);

  // Show loading spinner while checking auth state
  return (
    <ScreenContainer className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" color={colors.primary} />
    </ScreenContainer>
  );
}
