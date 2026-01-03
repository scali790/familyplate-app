import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  LAST_MEAL_PLAN: "last_meal_plan",
  USER_PREFERENCES: "user_preferences",
  IS_OFFLINE: "is_offline",
};

interface MealPlan {
  id: string;
  meals: Array<{
    day: string;
    title: string;
    description: string;
  }>;
  createdAt: string;
}

interface UserPreferences {
  familySize: string;
  cuisines: string[];
  flavors: string[];
  restrictions: string;
}

export const OfflineStorage = {
  // Meal Plan
  async saveMealPlan(plan: MealPlan): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.LAST_MEAL_PLAN, JSON.stringify(plan));
    } catch (error) {
      console.error("Error saving meal plan offline:", error);
    }
  },

  async getMealPlan(): Promise<MealPlan | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.LAST_MEAL_PLAN);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error loading meal plan offline:", error);
      return null;
    }
  },

  // User Preferences
  async savePreferences(preferences: UserPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.USER_PREFERENCES, JSON.stringify(preferences));
    } catch (error) {
      console.error("Error saving preferences offline:", error);
    }
  },

  async getPreferences(): Promise<UserPreferences | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.USER_PREFERENCES);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error loading preferences offline:", error);
      return null;
    }
  },

  // Clear all offline data
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        KEYS.LAST_MEAL_PLAN,
        KEYS.USER_PREFERENCES,
        KEYS.IS_OFFLINE,
      ]);
    } catch (error) {
      console.error("Error clearing offline data:", error);
    }
  },
};
