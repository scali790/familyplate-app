import { z } from "zod";

// Single Source of Truth for User Preferences
export const savePreferencesSchema = z.object({
  familyName: z.string().optional(),
  familySize: z.number().min(1).max(20),
  mealTypes: z.array(z.enum(["breakfast", "lunch", "dinner"])).min(1),
  cuisines: z.array(z.string()).min(1).max(5), // Free tier: max 5 cuisines
  flavors: z.array(z.string()),
  dietaryRestrictions: z.array(z.string()).optional(),
  country: z.string().optional(),
  // Food preference frequencies (0-21: times per week, max depends on meal types)
  chickenFrequency: z.number().min(0).max(21).default(2),
  redMeatFrequency: z.number().min(0).max(21).default(2),
  fishFrequency: z.number().min(0).max(21).default(2),
  vegetarianFrequency: z.number().min(0).max(21).default(2),
  // Advanced preferences
  cookingTime: z.enum(["quick", "medium", "elaborate"]).default("medium"),
  spiceLevel: z.enum(["mild", "medium", "hot", "extra-hot"]).default("medium"),
  kidFriendly: z.boolean().default(false),
  commonDislikes: z.array(z.string()).optional(),
  customDislikes: z.string().optional(),
});

export type SavePreferencesInput = z.infer<typeof savePreferencesSchema>;

// Preferences as returned from DB
export interface UserPreferences {
  id: number;
  userId: number;
  familyName: string | null;
  familySize: number;
  mealTypes: string[]; // Parsed from JSON
  cuisines: string[]; // Parsed from JSON
  flavors: string[]; // Parsed from JSON
  dietaryRestrictions?: string[]; // Parsed from JSON
  country: string | null;
  chickenFrequency: number;
  redMeatFrequency: number;
  fishFrequency: number;
  vegetarianFrequency: number;
  cookingTime: string;
  spiceLevel: string;
  kidFriendly: boolean;
  commonDislikes?: string[];
  customDislikes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
