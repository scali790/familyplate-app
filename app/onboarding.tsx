import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/lib/auth-provider";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { OfflineStorage } from "@/lib/offline-storage";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const FAMILY_SIZES = ["2", "3", "4", "5", "6+"];
const CUISINES = ["Indian", "Italian", "Chinese", "American", "Mexican", "Korean"];
const FLAVORS = [
  { id: "spicy", label: "Spicy" },
  { id: "mild", label: "Mild" },
  { id: "quick", label: "Quick-prep (<30 mins)" },
  { id: "healthy", label: "Healthy/Low-carb" },
  { id: "comfort", label: "Comfort food" },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user } = useAuth();
  
  const [familySize, setFamilySize] = useState("4");
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [restrictions, setRestrictions] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleCuisine = (cuisine: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (selectedCuisines.includes(cuisine)) {
      setSelectedCuisines(selectedCuisines.filter(c => c !== cuisine));
    } else {
      if (selectedCuisines.length < 5) {
        setSelectedCuisines([...selectedCuisines, cuisine]);
      } else {
        Alert.alert("Limit Reached", "You can select up to 5 cuisines");
      }
    }
  };

  const toggleFlavor = (flavorId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (selectedFlavors.includes(flavorId)) {
      setSelectedFlavors(selectedFlavors.filter(f => f !== flavorId));
    } else {
      setSelectedFlavors([...selectedFlavors, flavorId]);
    }
  };

  const handleSave = async () => {
    if (selectedCuisines.length === 0) {
      Alert.alert("Missing Information", "Please select at least one cuisine");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setLoading(true);
    try {
      if (!user) throw new Error("No user found");

      const preferences = {
        userId: user.uid,
        familySize,
        cuisines: selectedCuisines,
        flavors: selectedFlavors,
        restrictions,
        createdAt: new Date().toISOString(),
      };

      // Save preferences to Firestore
      await setDoc(doc(db, "preferences", user.uid), preferences);

      // Cache preferences offline
      await OfflineStorage.savePreferences({
        familySize,
        cuisines: selectedCuisines,
        flavors: selectedFlavors,
        restrictions,
      });

      // Navigate to dashboard
      router.replace("./dashboard" as any);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save preferences");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="flex-1">
      <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
        <View className="gap-6 pb-8">
          {/* Header */}
          <View className="items-center gap-2 mb-4">
            <Text className="text-3xl font-bold text-foreground">Tell Us About Your Family</Text>
            <Text className="text-base text-muted text-center">
              Help us create the perfect meal plan for you
            </Text>
          </View>

          {/* Family Size */}
          <View className="gap-3">
            <Text className="text-base font-semibold text-foreground">Family Size</Text>
            <View className="flex-row flex-wrap gap-2">
              {FAMILY_SIZES.map((size) => (
                <TouchableOpacity
                  key={size}
                  onPress={() => {
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setFamilySize(size);
                  }}
                  style={{
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 999,
                    backgroundColor: familySize === size ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: familySize === size ? colors.primary : colors.border,
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      color: familySize === size ? "white" : colors.foreground,
                      fontWeight: "600",
                    }}
                  >
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Cuisines */}
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-semibold text-foreground">Preferred Cuisines</Text>
              <Text className="text-sm text-muted">{selectedCuisines.length}/5 selected</Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {CUISINES.map((cuisine) => {
                const isSelected = selectedCuisines.includes(cuisine);
                return (
                  <TouchableOpacity
                    key={cuisine}
                    onPress={() => toggleCuisine(cuisine)}
                    style={{
                      paddingHorizontal: 20,
                      paddingVertical: 10,
                      borderRadius: 999,
                      backgroundColor: isSelected ? colors.success : colors.surface,
                      borderWidth: 1,
                      borderColor: isSelected ? colors.success : colors.border,
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        color: isSelected ? "white" : colors.foreground,
                        fontWeight: "600",
                      }}
                    >
                      {cuisine}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Flavor Preferences */}
          <View className="gap-3">
            <Text className="text-base font-semibold text-foreground">Flavor Preferences</Text>
            <View className="gap-3">
              {FLAVORS.map((flavor) => {
                const isSelected = selectedFlavors.includes(flavor.id);
                return (
                  <TouchableOpacity
                    key={flavor.id}
                    onPress={() => toggleFlavor(flavor.id)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      padding: 16,
                      borderRadius: 12,
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: isSelected ? colors.success : colors.border,
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        borderWidth: 2,
                        borderColor: isSelected ? colors.success : colors.border,
                        backgroundColor: isSelected ? colors.success : "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {isSelected && (
                        <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>✓</Text>
                      )}
                    </View>
                    <Text className="text-base text-foreground">{flavor.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Dietary Restrictions */}
          <View className="gap-3">
            <Text className="text-base font-semibold text-foreground">Dietary Restrictions</Text>
            <TextInput
              value={restrictions}
              onChangeText={setRestrictions}
              placeholder="e.g., gluten-free, vegan, nut allergy"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              returnKeyType="done"
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              placeholderTextColor={colors.muted}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: "center",
              marginTop: 8,
              opacity: loading ? 0.6 : 1,
            }}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-base font-semibold text-white">Save Preferences</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
