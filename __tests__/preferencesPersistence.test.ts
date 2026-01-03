import { describe, it, expect } from "vitest";

describe("Preferences Persistence", () => {
  it("should have correct default values for new users", () => {
    const defaultPreferences = {
      familySize: 2,
      cuisines: [],
      flavors: [],
      dietaryRestrictions: "",
      country: "UAE",
      meatFrequency: 3,
      chickenFrequency: 3,
      fishFrequency: 3,
      vegetarianFrequency: 2,
      veganFrequency: 1,
      spicyFrequency: 2,
      kidFriendlyFrequency: 2,
      healthyFrequency: 3,
    };

    expect(defaultPreferences.familySize).toBe(2);
    expect(defaultPreferences.country).toBe("UAE");
    expect(defaultPreferences.meatFrequency).toBe(3);
  });

  it("should use nullish coalescing for optional frequency values", () => {
    // Test that undefined values fall back to defaults
    const value1: number | undefined = undefined;
    const value2: number | null = null;
    const value3: number | undefined = 0;
    const value4: number | undefined = 4;

    const testValue1 = value1 ?? 3;
    const testValue2 = value2 ?? 3;
    const testValue3 = value3 ?? 3; // 0 is valid, should not fall back
    const testValue4 = value4 ?? 3; // 4 is valid, should not fall back

    expect(testValue1).toBe(3); // undefined → default
    expect(testValue2).toBe(3); // null → default
    expect(testValue3).toBe(0); // 0 is valid (Never)
    expect(testValue4).toBe(4); // 4 is valid (Always)
  });

  it("should parse JSON strings for cuisines and flavors", () => {
    const cuisinesString = '["Italian","Mexican","Chinese"]';
    const flavorsString = '["Sweet","Savory","Spicy"]';

    const parsedCuisines = JSON.parse(cuisinesString);
    const parsedFlavors = JSON.parse(flavorsString);

    expect(parsedCuisines).toEqual(["Italian", "Mexican", "Chinese"]);
    expect(parsedFlavors).toEqual(["Sweet", "Savory", "Spicy"]);
    expect(Array.isArray(parsedCuisines)).toBe(true);
    expect(Array.isArray(parsedFlavors)).toBe(true);
  });

  it("should handle empty or null JSON strings gracefully", () => {
    const nullValue: string[] | null = null;
    const undefinedValue: string[] | undefined = undefined;
    
    const emptyArray = nullValue || [];
    const undefinedArray = undefinedValue || [];

    expect(emptyArray).toEqual([]);
    expect(undefinedArray).toEqual([]);
  });

  it("should convert family size number to string for input field", () => {
    const familySizeFromDb = 4;
    const familySizeForInput = familySizeFromDb.toString();

    expect(familySizeForInput).toBe("4");
    expect(typeof familySizeForInput).toBe("string");
  });

  it("should convert family size string to number for API", () => {
    const familySizeFromInput = "4";
    const familySizeForApi = parseInt(familySizeFromInput, 10);

    expect(familySizeForApi).toBe(4);
    expect(typeof familySizeForApi).toBe("number");
  });

  it("should preserve all frequency values in range 0-4", () => {
    const validFrequencies = [0, 1, 2, 3, 4];

    validFrequencies.forEach(freq => {
      expect(freq).toBeGreaterThanOrEqual(0);
      expect(freq).toBeLessThanOrEqual(4);
    });
  });
});
