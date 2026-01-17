/**
 * Shared meal type configuration for consistent color coding across all views
 * Source of truth: Voting Page design
 */

export const MEAL_TYPE_CONFIG = {
  breakfast: {
    emoji: '🌅',
    label: 'Breakfast',
    // Gradient for badges (voting page style)
    badgeGradient: 'from-orange-400 to-yellow-400',
    // Border colors
    borderColor: 'border-orange-400',
    lightBorder: 'border-orange-200',
    // Background colors
    bgColor: 'bg-orange-50',
    lightBg: 'bg-orange-50/30',
    // Text colors
    textColor: 'text-orange-700',
    mutedText: 'text-orange-600',
  },
  lunch: {
    emoji: '☀️',
    label: 'Lunch',
    badgeGradient: 'from-blue-400 to-cyan-400',
    borderColor: 'border-blue-400',
    lightBorder: 'border-blue-200',
    bgColor: 'bg-blue-50',
    lightBg: 'bg-blue-50/30',
    textColor: 'text-blue-700',
    mutedText: 'text-blue-600',
  },
  dinner: {
    emoji: '🌙',
    label: 'Dinner',
    badgeGradient: 'from-purple-500 to-indigo-500',
    borderColor: 'border-purple-400',
    lightBorder: 'border-purple-200',
    bgColor: 'bg-purple-50',
    lightBg: 'bg-purple-50/30',
    textColor: 'text-purple-700',
    mutedText: 'text-purple-600',
  },
} as const;

export type MealType = keyof typeof MEAL_TYPE_CONFIG;

/**
 * Get meal type config with fallback for unknown types
 */
export function getMealTypeConfig(mealType?: string | null) {
  if (!mealType) return null;
  const normalized = mealType.toLowerCase() as MealType;
  return MEAL_TYPE_CONFIG[normalized] || null;
}
