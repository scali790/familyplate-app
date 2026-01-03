import { useState } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useThemeContext } from "@/lib/theme-provider";
import { FOOD_PREFERENCES } from "@/src/utils/iconMapping";

const CUISINE_OPTIONS = [
  "Italian", "Mexican", "Chinese", "Japanese", "Indian",
  "Thai", "Mediterranean", "American", "French", "Korean",
];

const FLAVOR_OPTIONS = [
  "Sweet", "Savory", "Spicy", "Mild", "Tangy", "Umami",
];

const COUNTRY_OPTIONS = [
  { code: "UAE", name: "United Arab Emirates" },
  { code: "USA", name: "United States" },
  { code: "IND", name: "India" },
  { code: "GBR", name: "United Kingdom" },
  { code: "SAU", name: "Saudi Arabia" },
];

export default function OnboardingScreen() {
  const [familySize, setFamilySize] = useState("2");
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [dietaryRestrictions, setDietaryRestrictions] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("UAE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Food preference toggles (all enabled by default)
  const [foodPreferences, setFoodPreferences] = useState({
    includeMeat: true,
    includeChicken: true,
    includeFish: true,
    includeVegetarian: true,
    includeVegan: true,
    includeSpicy: true,
    includeKidFriendly: true,
    includeHealthy: true,
  });

  const { colorScheme, setColorScheme } = useThemeContext();
  const saveMutation = trpc.mealPlanning.savePreferences.useMutation();

  const toggleCuisine = (cuisine: string) => {
    if (selectedCuisines.includes(cuisine)) {
      setSelectedCuisines(selectedCuisines.filter(c => c !== cuisine));
    } else {
      if (selectedCuisines.length < 5) {
        setSelectedCuisines([...selectedCuisines, cuisine]);
      } else {
        if (Platform.OS === 'web') {
          alert("You can select up to 5 cuisines");
        }
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
    console.log("handleSave called");
    const size = parseInt(familySize);
    if (isNaN(size) || size < 1) {
      if (Platform.OS === 'web') {
        alert("Please enter a valid family size");
      }
      return;
    }

    if (selectedCuisines.length === 0) {
      if (Platform.OS === 'web') {
        alert("Please select at least one cuisine");
      }
      return;
    }

    if (selectedFlavors.length === 0) {
      if (Platform.OS === 'web') {
        alert("Please select at least one flavor preference");
      }
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("Saving preferences...", { size, selectedCuisines, selectedFlavors, dietaryRestrictions });
      await saveMutation.mutateAsync({
        familySize: size,
        cuisines: selectedCuisines,
        flavors: selectedFlavors,
        dietaryRestrictions: dietaryRestrictions.trim() || undefined,
        country: selectedCountry,
        ...foodPreferences,
      });

      console.log("Preferences saved successfully!");
      router.replace("/dashboard");
    } catch (error) {
      console.error("Failed to save preferences:", error);
      if (Platform.OS === 'web') {
        alert("Failed to save preferences. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-6">
        <View className="gap-6 pb-8">
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              padding: 8,
              borderRadius: 8,
              backgroundColor: 'rgba(0,0,0,0.05)',
              alignSelf: 'flex-start',
            }}
          >
            <Text style={{ fontSize: 24 }}>←</Text>
          </TouchableOpacity>
          
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

          {/* Country Location */}
          <View className="gap-2">
            <Text className="text-lg font-semibold text-foreground">
              Country Location
            </Text>
            <Text className="text-sm text-muted mb-2">
              Used for shopping list localization (stores, brands, units)
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {COUNTRY_OPTIONS.map(country => (
                <TouchableOpacity
                  key={country.code}
                  onPress={() => setSelectedCountry(country.code)}
                  className={`px-4 py-2 rounded-full ${
                    selectedCountry === country.code
                      ? "bg-primary"
                      : "bg-surface border border-border"
                  }`}
                >
                  <Text
                    className={`font-medium ${
                      selectedCountry === country.code
                        ? "text-white"
                        : "text-foreground"
                    }`}
                  >
                    {country.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Theme Toggle */}
          <View className="gap-2">
            <Text className="text-lg font-semibold text-foreground">
              Theme
            </Text>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setColorScheme("light")}
                className={`flex-1 px-4 py-3 rounded-xl ${
                  colorScheme === "light"
                    ? "bg-primary"
                    : "bg-surface border border-border"
                }`}
              >
                <Text className={`text-center font-medium ${
                  colorScheme === "light" ? "text-white" : "text-foreground"
                }`}>☀️ Light</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setColorScheme("dark")}
                className={`flex-1 px-4 py-3 rounded-xl ${
                  colorScheme === "dark"
                    ? "bg-primary"
                    : "bg-surface border border-border"
                }`}
              >
                <Text className={`text-center font-medium ${
                  colorScheme === "dark" ? "text-white" : "text-foreground"
                }`}>🌙 Dark</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Food Preferences */}
          <View className="gap-2">
            <Text className="text-lg font-semibold text-foreground">
              Food Preferences
            </Text>
            <Text className="text-sm text-muted mb-2">
              Toggle off any categories you want to exclude from meal plans
            </Text>
            <View className="gap-3">
              {FOOD_PREFERENCES.map(pref => (
                <TouchableOpacity
                  key={pref.key}
                  onPress={() => setFoodPreferences(prev => ({
                    ...prev,
                    [pref.dbField]: !prev[pref.dbField],
                  }))}
                  className="flex-row items-center justify-between bg-surface border border-border rounded-xl px-4 py-3"
                >
                  <View className="flex-row items-center gap-3 flex-1">
                    <Text className="text-2xl">{pref.icon}</Text>
                    <Text className="text-foreground font-medium flex-1">{pref.label}</Text>
                  </View>
                  <View className={`w-12 h-6 rounded-full ${foodPreferences[pref.dbField] ? 'bg-success' : 'bg-border'} justify-center`}>
                    <View className={`w-5 h-5 rounded-full bg-white ${foodPreferences[pref.dbField] ? 'self-end mr-0.5' : 'self-start ml-0.5'}`} />
                  </View>
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
              placeholder="e.g., Gluten-free, Nut allergy, Lactose intolerant"
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
