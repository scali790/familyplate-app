import { z } from "zod";

// Single Source of Truth for User Preferences
export const savePreferencesSchema = z.object({
  familyName: z.string().optional(),
  familySize: z.number().min(1).max(20),
  mealTypes: z.array(z.enum(["breakfast", "lunch", "dinner"])).min(1),
  cuisines: z.array(z.string()).max(5),
  flavors: z.array(z.string()),
  dietaryRestrictions: z.array(z.string()).optional(),
  country: z.string().optional(),
  // Food preference frequencies (0-21: times per week, max depends on meal types)
  chickenFrequency: z.number().min(0).max(21).default(2),
  redMeatFrequency: z.number().min(0).max(21).default(2),
  fishFrequency: z.number().min(0).max(21).default(2),
  vegetarianFrequency: z.number().min(0).max(21).default(2),
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
  createdAt: Date;
  updatedAt: Date;
}
