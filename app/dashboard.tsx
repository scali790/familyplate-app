import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Image } from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/lib/auth-provider";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { collection, query, where, orderBy, limit, getDocs, doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { OfflineStorage } from "@/lib/offline-storage";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

interface Meal {
  day: string;
  title: string;
  description: string;
}

interface MealPlan {
  id: string;
  meals: Meal[];
  createdAt: string;
}

export default function DashboardScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user, signOut } = useAuth();
  
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [votes, setVotes] = useState<Record<string, { likes: number; dislikes: number }>>({});

  useEffect(() => {
    loadMealPlan();
  }, [user]);

  const loadMealPlan = async () => {
    if (!user) return;
    
    try {
      // Load latest meal plan from Firestore
      const plansQuery = query(
        collection(db, "plans"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(1)
      );
      
      const plansSnapshot = await getDocs(plansQuery);
      if (!plansSnapshot.empty) {
        const planDoc = plansSnapshot.docs[0];
        const plan = {
          id: planDoc.id,
          ...planDoc.data() as Omit<MealPlan, "id">,
        };
        setMealPlan(plan);

        // Cache plan offline
        await OfflineStorage.saveMealPlan(plan);

        // Load votes for each meal
        const votesData: Record<string, { likes: number; dislikes: number }> = {};
        for (const meal of (planDoc.data().meals as Meal[])) {
          const mealKey = `${planDoc.id}_${meal.day}`;
          const voteDoc = await getDocs(
            query(collection(db, "votes"), where("mealId", "==", mealKey))
          );
          
          if (!voteDoc.empty) {
            const voteData = voteDoc.docs[0].data();
            votesData[mealKey] = {
              likes: voteData.likes || 0,
              dislikes: voteData.dislikes || 0,
            };
          } else {
            votesData[mealKey] = { likes: 0, dislikes: 0 };
          }
        }
        setVotes(votesData);
      } else {
        // No plan in Firestore, try loading from offline cache
        const cachedPlan = await OfflineStorage.getMealPlan();
        if (cachedPlan) {
          setMealPlan(cachedPlan);
        }
      }
    } catch (error) {
      console.error("Error loading meal plan:", error);
      // On error, try loading from offline cache
      const cachedPlan = await OfflineStorage.getMealPlan();
      if (cachedPlan) {
        setMealPlan(cachedPlan);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadMealPlan();
  };

  const handleGeneratePlan = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setGenerating(true);
    // This will be implemented in the next phase with OpenAI integration
    setTimeout(() => {
      setGenerating(false);
      router.push("./generate-plan" as any);
    }, 500);
  };

  const handleVote = async (meal: Meal, type: "like" | "dislike") => {
    if (!mealPlan || !user) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const mealKey = `${mealPlan.id}_${meal.day}`;
    
    try {
      // Update vote in Firestore
      const votesQuery = query(collection(db, "votes"), where("mealId", "==", mealKey));
      const votesSnapshot = await getDocs(votesQuery);
      
      if (votesSnapshot.empty) {
        // Create new vote document
        const { addDoc } = await import("firebase/firestore");
        await addDoc(collection(db, "votes"), {
          userId: user.uid,
          mealId: mealKey,
          likes: type === "like" ? 1 : 0,
          dislikes: type === "dislike" ? 1 : 0,
        });
      } else {
        // Update existing vote
        const voteDoc = votesSnapshot.docs[0];
        await updateDoc(doc(db, "votes", voteDoc.id), {
          [type === "like" ? "likes" : "dislikes"]: increment(1),
        });
      }

      // Update local state
      setVotes(prev => ({
        ...prev,
        [mealKey]: {
          ...prev[mealKey],
          [type === "like" ? "likes" : "dislikes"]: (prev[mealKey]?.[type === "like" ? "likes" : "dislikes"] || 0) + 1,
        },
      }));
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  const handleSettings = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push("./settings" as any);
  };

  const handleLogout = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await signOut();
    router.replace("../welcome" as any);
  };

  const handleMealPress = (meal: Meal) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push({ pathname: "./premium-modal" as any, params: { mealTitle: meal.title } });
  };

  if (loading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1">
      {/* App Bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Image
          source={require("@/assets/images/icon.png")}
          style={{ width: 40, height: 40 }}
          resizeMode="contain"
        />
        <TouchableOpacity
          onPress={() => setShowMenu(!showMenu)}
          activeOpacity={0.6}
        >
          <IconSymbol name="person.circle" size={32} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Profile Menu */}
      {showMenu && (
        <View
          style={{
            position: "absolute",
            top: 64,
            right: 16,
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
            zIndex: 1000,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <TouchableOpacity
            onPress={handleSettings}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
            activeOpacity={0.6}
          >
            <IconSymbol name="gearshape" size={20} color={colors.foreground} />
            <Text className="text-base text-foreground">Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleLogout}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
            activeOpacity={0.6}
          >
            <IconSymbol name="arrow.left" size={20} color={colors.error} />
            <Text className="text-base" style={{ color: colors.error }}>Log Out</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        <View className="p-6 gap-6">
          {/* Generate Button */}
          <TouchableOpacity
            onPress={handleGeneratePlan}
            disabled={generating}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 18,
              borderRadius: 16,
              alignItems: "center",
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
              opacity: generating ? 0.6 : 1,
            }}
            activeOpacity={0.8}
          >
            {generating ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-lg font-bold text-white">Generate New Plan</Text>
            )}
          </TouchableOpacity>

          {/* Meal Plan */}
          {mealPlan ? (
            <View className="gap-4">
              <Text className="text-xl font-bold text-foreground">Your 7-Day Meal Plan</Text>
              {mealPlan.meals.map((meal) => {
                const mealKey = `${mealPlan.id}_${meal.day}`;
                const mealVotes = votes[mealKey] || { likes: 0, dislikes: 0 };
                
                return (
                  <TouchableOpacity
                    key={meal.day}
                    onPress={() => handleMealPress(meal)}
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 16,
                      padding: 16,
                      gap: 12,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                    activeOpacity={0.7}
                  >
                    {/* Premium Badge */}
                    <View
                      style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        backgroundColor: colors.primary,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 8,
                      }}
                    >
                      <Text className="text-xs font-semibold text-white">Premium</Text>
                    </View>

                    <View className="gap-2">
                      <Text className="text-sm font-semibold" style={{ color: colors.success }}>
                        {meal.day}
                      </Text>
                      <Text className="text-lg font-bold text-foreground">{meal.title}</Text>
                      <Text className="text-sm text-muted">{meal.description}</Text>
                    </View>

                    {/* Voting */}
                    <View className="flex-row items-center gap-4 mt-2">
                      <TouchableOpacity
                        onPress={() => handleVote(meal, "like")}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 8,
                          backgroundColor: colors.background,
                        }}
                        activeOpacity={0.6}
                      >
                        <Text className="text-lg">👍</Text>
                        <Text className="text-sm font-semibold text-foreground">{mealVotes.likes}</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        onPress={() => handleVote(meal, "dislike")}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 8,
                          backgroundColor: colors.background,
                        }}
                        activeOpacity={0.6}
                      >
                        <Text className="text-lg">👎</Text>
                        <Text className="text-sm font-semibold text-foreground">{mealVotes.dislikes}</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View className="items-center gap-4 py-12">
              <Text className="text-6xl">🍽️</Text>
              <Text className="text-xl font-bold text-foreground">No Meal Plan Yet</Text>
              <Text className="text-base text-muted text-center">
                Tap "Generate New Plan" to create your personalized 7-day meal plan
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
