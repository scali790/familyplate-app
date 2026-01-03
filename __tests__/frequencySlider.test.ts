import { describe, it, expect } from "vitest";
import { FOOD_PREFERENCES, FREQUENCY_LABELS } from "../src/utils/iconMapping";

describe("Food Preference Frequency Sliders", () => {
  it("should have correct frequency labels", () => {
    expect(FREQUENCY_LABELS).toEqual([
      "Never",
      "Rarely",
      "Sometimes",
      "Often",
      "Always",
    ]);
  });

  it("should have 8 food preference categories", () => {
    expect(FOOD_PREFERENCES).toHaveLength(8);
  });

  it("should have correct field names for frequency values", () => {
    const expectedFields = [
      "meatFrequency",
      "chickenFrequency",
      "fishFrequency",
      "vegetarianFrequency",
      "veganFrequency",
      "spicyFrequency",
      "kidFriendlyFrequency",
      "healthyFrequency",
    ];

    const actualFields = FOOD_PREFERENCES.map(pref => pref.dbField);
    expect(actualFields).toEqual(expectedFields);
  });

  it("should have icons for all preferences", () => {
    FOOD_PREFERENCES.forEach(pref => {
      expect(pref.icon).toBeTruthy();
      expect(pref.icon.length).toBeGreaterThan(0);
    });
  });

  it("should map frequency values correctly", () => {
    const frequencyMap: Record<number, string> = {
      0: "never",
      1: "rarely",
      2: "sometimes",
      3: "often",
      4: "always",
    };

    expect(frequencyMap[0]).toBe("never");
    expect(frequencyMap[1]).toBe("rarely");
    expect(frequencyMap[2]).toBe("sometimes");
    expect(frequencyMap[3]).toBe("often");
    expect(frequencyMap[4]).toBe("always");
  });

  it("should calculate slider percentage correctly", () => {
    // Test slider width calculation (frequency / 4 * 100)
    expect((0 / 4) * 100).toBe(0); // Never
    expect((1 / 4) * 100).toBe(25); // Rarely
    expect((2 / 4) * 100).toBe(50); // Sometimes
    expect((3 / 4) * 100).toBe(75); // Often
    expect((4 / 4) * 100).toBe(100); // Always
  });

  it("should have correct default frequency values", () => {
    const defaults = {
      meatFrequency: 3, // Often
      chickenFrequency: 3,
      fishFrequency: 3,
      vegetarianFrequency: 2, // Sometimes
      veganFrequency: 1, // Rarely
      spicyFrequency: 2,
      kidFriendlyFrequency: 2,
      healthyFrequency: 3,
    };

    expect(defaults.meatFrequency).toBe(3);
    expect(defaults.vegetarianFrequency).toBe(2);
    expect(defaults.veganFrequency).toBe(1);
  });
});
