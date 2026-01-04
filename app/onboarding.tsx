import { useState, useEffect } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useThemeContext } from "@/lib/theme-provider";
import { FOOD_PREFERENCES, FREQUENCY_LABELS } from "@/src/utils/iconMapping";
import { useAuth } from "@/hooks/use-auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CUISINE_OPTIONS = [
  "Italian", "Mexican", "Chinese", "Japanese", "Indian",
  "Thai", "Mediterranean", "American", "French", "Swiss", "Korean",
  "Middle Eastern", "Lebanese", "Turkish", "Persian",
  "Vietnamese", "Malaysian", "Indonesian",
  "Spanish", "Greek", "Portuguese", "German",
  "Brazilian", "Peruvian", "Argentinian",
  "Moroccan", "Ethiopian",
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
  const { user, loading: authLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const [familyName, setFamilyName] = useState("");
  const [familySize, setFamilySize] = useState("2");
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [dietaryRestrictions, setDietaryRestrictions] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("UAE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Food preference frequencies (0=Never, 1=Rarely, 2=Sometimes, 3=Often, 4=Always)
  const [foodPreferences, setFoodPreferences] = useState({
    meatFrequency: 3, // Often
    chickenFrequency: 3,
    fishFrequency: 3,
    vegetarianFrequency: 2, // Sometimes
    veganFrequency: 1, // Rarely
    spicyFrequency: 2,
    kidFriendlyFrequency: 2,
    healthyFrequency: 3,
  });

  const { colorScheme, setColorScheme } = useThemeContext();
  const saveMutation = trpc.mealPlanning.savePreferences.useMutation();
  const { data: existingPreferences, isLoading: isLoadingPreferences } = trpc.mealPlanning.getPreferences.useQuery();
  const { data: currentMealPlan } = trpc.mealPlanning.getCurrentPlan.useQuery();
  const generatePlanMutation = trpc.mealPlanning.generatePlan.useMutation();

  // Redirect to welcome if not authenticated (only after auth has loaded)
  useEffect(() => {
    if (!authLoading && !user) {
      console.log("User not authenticated, redirecting to welcome");
      router.replace("/welcome");
    }
  }, [user, authLoading]);

  // Load existing preferences when data is fetched
  useEffect(() => {
    console.log('[Onboarding] Loading preferences, existingPreferences:', existingPreferences);
    console.log('[Onboarding] isLoadingPreferences:', isLoadingPreferences);
    
    if (existingPreferences) {
      console.log('[Onboarding] Populating form with existing preferences');
      setFamilyName(existingPreferences.familyName || "");
      setFamilySize(existingPreferences.familySize.toString());
      setSelectedCuisines(existingPreferences.cuisines || []);
      setSelectedFlavors(existingPreferences.flavors || []);
      setDietaryRestrictions(existingPreferences.dietaryRestrictions || "");
      setSelectedCountry(existingPreferences.country || "UAE");
      
      // Load food frequency preferences
      setFoodPreferences({
        meatFrequency: existingPreferences.meatFrequency ?? 3,
        chickenFrequency: existingPreferences.chickenFrequency ?? 3,
        fishFrequency: existingPreferences.fishFrequency ?? 3,
        vegetarianFrequency: existingPreferences.vegetarianFrequency ?? 2,
        veganFrequency: existingPreferences.veganFrequency ?? 1,
        spicyFrequency: existingPreferences.spicyFrequency ?? 2,
        kidFriendlyFrequency: existingPreferences.kidFriendlyFrequency ?? 2,
        healthyFrequency: existingPreferences.healthyFrequency ?? 3,
      });
      console.log('[Onboarding] Form populated successfully');
    } else {
      console.log('[Onboarding] No existing preferences found');
    }
  }, [existingPreferences, isLoadingPreferences]);

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
      console.log("Saving preferences...", { familyName, size, selectedCuisines, selectedFlavors, dietaryRestrictions });
      await saveMutation.mutateAsync({
        familyName: familyName.trim() || undefined,
        familySize: size,
        cuisines: selectedCuisines,
        flavors: selectedFlavors,
        dietaryRestrictions: dietaryRestrictions.trim() || undefined,
        country: selectedCountry,
        ...foodPreferences,
      });

      console.log("Preferences saved successfully!");
      console.log('[Onboarding] Saved data:', {
        familyName,
        familySize: size,
        cuisines: selectedCuisines,
        flavors: selectedFlavors,
        dietaryRestrictions,
        country: selectedCountry,
        ...foodPreferences
      });
      
      // If user has an existing meal plan, ask if they want to regenerate it
      if (currentMealPlan) {
        if (Platform.OS === 'web') {
          const shouldRegenerate = confirm(
            "Your preferences have been updated! Would you like to regenerate your meal plan to reflect these changes?"
          );
          
          if (shouldRegenerate) {
            try {
              console.log("Regenerating meal plan with new preferences...");
              await generatePlanMutation.mutateAsync({});
              console.log("Meal plan regenerated successfully!");
              alert("Your meal plan has been updated with your new preferences!");
            } catch (error) {
              console.error("Failed to regenerate meal plan:", error);
              alert("Preferences saved, but failed to regenerate meal plan. You can manually regenerate from the dashboard.");
            }
          }
        }
      }
      
      router.replace("/dashboard");
    } catch (error: any) {
      console.error("Failed to save preferences:", error);
      console.error("Error details:", {
        message: error?.message,
        data: error?.data,
        shape: error?.shape,
        cause: error?.cause,
      });
      if (Platform.OS === 'web') {
        const errorMsg = error?.message || error?.data?.message || "Unknown error";
        alert(`Failed to save preferences: ${errorMsg}\n\nPlease try again.`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView 
        className="flex-1 p-6"
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) + 80 }}
      >
        <View className="gap-6">
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
            <Text style={{ fontSize: 24, color: '#11181C' }} className="dark:text-[#ECEDEE]">←</Text>
          </TouchableOpacity>
          
          {/* Header */}
          <View className="items-center gap-2 mb-4">
            <Text className="text-3xl font-bold text-foreground">Set Your Preferences</Text>
            <Text className="text-muted text-center">
              Tell us about your family's meal preferences
            </Text>
          </View>

          {/* Family Name (Optional) */}
          <View className="gap-2">
            <Text className="text-lg font-semibold text-foreground">
              Family Name <Text className="text-muted text-sm">(Optional)</Text>
            </Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              placeholder="e.g., The Smiths, Johnson Family"
              value={familyName}
              onChangeText={setFamilyName}
            />
            <Text className="text-xs text-muted italic">
              💡 This will appear on your meal plans (e.g., "The Smiths' Meal Plan")
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
            <View className="gap-4">
              {FOOD_PREFERENCES.map(pref => {
                const frequency = foodPreferences[pref.dbField];
                const frequencyLabel = FREQUENCY_LABELS[frequency];
                return (
                  <View key={pref.key} className="bg-surface border border-border rounded-xl p-4">
                    {/* Icon and Title */}
                    <View className="flex-row items-center gap-3 mb-3">
                      <Text className="text-2xl">{pref.icon}</Text>
                      <View className="flex-1">
                        <Text className="text-foreground font-semibold">{pref.label}</Text>
                        <View className="flex-row items-center gap-2 mt-1">
                          <Text className="text-sm text-primary font-medium">{frequencyLabel}</Text>
                          <View className="flex-row gap-1">
                            {[0, 1, 2, 3, 4].map(dotIndex => (
                              <Text 
                                key={dotIndex} 
                                className="text-xs" 
                                style={{ 
                                  color: dotIndex <= frequency ? '#0a7ea4' : '#888888',
                                  opacity: 1
                                }}
                              >
                                ●
                              </Text>
                            ))}
                          </View>
                        </View>
                      </View>
                    </View>
                    
                    {/* Slider */}
                    <View className="flex-row items-center gap-3">
                      <TouchableOpacity
                        onPress={() => setFoodPreferences(prev => ({
                          ...prev,
                          [pref.dbField]: Math.max(0, prev[pref.dbField] - 1),
                        }))}
                        disabled={frequency === 0}
                        className="w-8 h-8 items-center justify-center rounded-full bg-surface border border-border"
                        style={{ opacity: frequency === 0 ? 0.3 : 1 }}
                      >
                        <Text className="text-foreground font-bold">−</Text>
                      </TouchableOpacity>
                      
                      <View className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                        <View 
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(frequency / 4) * 100}%` }}
                        />
                      </View>
                      
                      <TouchableOpacity
                        onPress={() => setFoodPreferences(prev => ({
                          ...prev,
                          [pref.dbField]: Math.min(4, prev[pref.dbField] + 1),
                        }))}
                        disabled={frequency === 4}
                        className="w-8 h-8 items-center justify-center rounded-full bg-surface border border-border"
                        style={{ opacity: frequency === 4 ? 0.3 : 1 }}
                      >
                        <Text className="text-foreground font-bold">+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
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
