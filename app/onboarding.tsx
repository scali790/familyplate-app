import { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";

const CUISINE_OPTIONS = [
  "Italian", "Mexican", "Chinese", "Japanese", "Indian",
  "Thai", "Mediterranean", "American", "French", "Korean",
];

const FLAVOR_OPTIONS = [
  "Sweet", "Savory", "Spicy", "Mild", "Tangy", "Umami",
];

export default function OnboardingScreen() {
  const [familySize, setFamilySize] = useState("2");
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [dietaryRestrictions, setDietaryRestrictions] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const saveMutation = trpc.mealPlanning.savePreferences.useMutation();

  const toggleCuisine = (cuisine: string) => {
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

  const toggleFlavor = (flavor: string) => {
    if (selectedFlavors.includes(flavor)) {
      setSelectedFlavors(selectedFlavors.filter(f => f !== flavor));
    } else {
      setSelectedFlavors([...selectedFlavors, flavor]);
    }
  };

  const handleSave = async () => {
    const size = parseInt(familySize);
    if (isNaN(size) || size < 1 || size > 20) {
      Alert.alert("Invalid Input", "Family size must be between 1 and 20");
      return;
    }

    if (selectedCuisines.length === 0) {
      Alert.alert("Missing Selection", "Please select at least one cuisine");
      return;
    }

    if (selectedFlavors.length === 0) {
      Alert.alert("Missing Selection", "Please select at least one flavor preference");
      return;
    }

    setIsSubmitting(true);
    try {
      await saveMutation.mutateAsync({
        familySize: size,
        cuisines: selectedCuisines,
        flavors: selectedFlavors,
        dietaryRestrictions: dietaryRestrictions.trim() || undefined,
      });

      Alert.alert("Success", "Preferences saved!", [
        { text: "OK", onPress: () => router.replace("/dashboard") }
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to save preferences. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-6">
        <View className="gap-6 pb-8">
          {/* Header */}
          <View className="items-center gap-2 mb-4">
            <Text className="text-3xl font-bold text-foreground">Set Your Preferences</Text>
            <Text className="text-muted text-center">
              Tell us about your family's meal preferences
            </Text>
          </View>

          {/* Family Size */}
          <View className="gap-2">
            <Text className="text-lg font-semibold text-foreground">Family Size</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              placeholder="Enter number of people"
              keyboardType="number-pad"
              value={familySize}
              onChangeText={setFamilySize}
            />
          </View>

          {/* Cuisines */}
          <View className="gap-2">
            <Text className="text-lg font-semibold text-foreground">
              Favorite Cuisines (Select up to 5)
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {CUISINE_OPTIONS.map(cuisine => (
                <TouchableOpacity
                  key={cuisine}
                  onPress={() => toggleCuisine(cuisine)}
                  className={`px-4 py-2 rounded-full ${
                    selectedCuisines.includes(cuisine)
                      ? "bg-primary"
                      : "bg-surface border border-border"
                  }`}
                >
                  <Text
                    className={`font-medium ${
                      selectedCuisines.includes(cuisine)
                        ? "text-white"
                        : "text-foreground"
                    }`}
                  >
                    {cuisine}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Flavors */}
          <View className="gap-2">
            <Text className="text-lg font-semibold text-foreground">
              Flavor Preferences
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {FLAVOR_OPTIONS.map(flavor => (
                <TouchableOpacity
                  key={flavor}
                  onPress={() => toggleFlavor(flavor)}
                  className={`px-4 py-2 rounded-full ${
                    selectedFlavors.includes(flavor)
                      ? "bg-success"
                      : "bg-surface border border-border"
                  }`}
                >
                  <Text
                    className={`font-medium ${
                      selectedFlavors.includes(flavor)
                        ? "text-white"
                        : "text-foreground"
                    }`}
                  >
                    {flavor}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Dietary Restrictions */}
          <View className="gap-2">
            <Text className="text-lg font-semibold text-foreground">
              Dietary Restrictions (Optional)
            </Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              placeholder="e.g., Vegetarian, Gluten-free, Nut allergy"
              multiline
              numberOfLines={3}
              value={dietaryRestrictions}
              onChangeText={setDietaryRestrictions}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSubmitting}
            className="bg-primary py-4 rounded-full active:opacity-80 mt-4"
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-semibold text-lg">
                Save Preferences
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
