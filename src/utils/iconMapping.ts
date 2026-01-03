/**
 * Food Category Icon Mapping
 * Maps recipe tags to emoji icons for visual identification
 */

export const FOOD_ICONS: Record<string, string> = {
  // Protein types
  meat: "🥩",
  beef: "🥩",
  pork: "🥩",
  lamb: "🥩",
  chicken: "🍗",
  poultry: "🍗",
  turkey: "🍗",
  fish: "🐟",
  seafood: "🐟",
  shrimp: "🦐",
  salmon: "🐟",
  
  // Dietary styles
  vegetarian: "🌱",
  vegan: "🥬",
  
  // Meal types
  pasta: "🍝",
  soup: "🥣",
  stew: "🥣",
  salad: "🥗",
  breakfast: "🥞",
  dessert: "🍰",
  
  // Characteristics
  spicy: "🌶️",
  healthy: "🥗",
  light: "🥗",
  "kid-friendly": "👶",
  
  // Vegetables & Fruits
  vegetables: "🥦",
  veggie: "🥦",
  fruits: "🍎",
};

/**
 * Get emoji icons for a list of tags
 * @param tags Array of tag strings (e.g., ["chicken", "spicy", "healthy"])
 * @returns Array of emoji icons
 */
export function getIconsForTags(tags: string[]): string[] {
  if (!tags || tags.length === 0) return [];
  
  const icons: string[] = [];
  const seenIcons = new Set<string>();
  
  for (const tag of tags) {
    const normalizedTag = tag.toLowerCase().trim();
    const icon = FOOD_ICONS[normalizedTag];
    
    if (icon && !seenIcons.has(icon)) {
      icons.push(icon);
      seenIcons.add(icon);
    }
  }
  
  return icons;
}

/**
 * Get primary icon for a meal (first matching icon)
 * @param tags Array of tag strings
 * @returns Single emoji icon or empty string
 */
export function getPrimaryIcon(tags: string[]): string {
  const icons = getIconsForTags(tags);
  return icons.length > 0 ? icons[0] : "";
}

/**
 * Food preference configuration for UI
 */
export interface FoodPreference {
  key: string;
  label: string;
  icon: string;
  dbField: keyof {
    includeMeat: number;
    includeChicken: number;
    includeFish: number;
    includeVegetarian: number;
    includeVegan: number;
    includeSpicy: number;
    includeKidFriendly: number;
    includeHealthy: number;
  };
}

export const FOOD_PREFERENCES: FoodPreference[] = [
  { key: "meat", label: "Meat (Beef, Pork, Lamb)", icon: "🥩", dbField: "includeMeat" },
  { key: "chicken", label: "Chicken & Poultry", icon: "🍗", dbField: "includeChicken" },
  { key: "fish", label: "Fish & Seafood", icon: "🐟", dbField: "includeFish" },
  { key: "vegetarian", label: "Vegetarian Meals", icon: "🌱", dbField: "includeVegetarian" },
  { key: "vegan", label: "Vegan Meals", icon: "🥬", dbField: "includeVegan" },
  { key: "spicy", label: "Spicy Dishes", icon: "🌶️", dbField: "includeSpicy" },
  { key: "kid-friendly", label: "Kid-Friendly Meals", icon: "👶", dbField: "includeKidFriendly" },
  { key: "healthy", label: "Lighter/Healthy Meals", icon: "🥗", dbField: "includeHealthy" },
];
