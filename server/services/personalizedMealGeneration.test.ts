import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "../db";
import { userPreferences, dishVotes, mealPlans } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Personalized Meal Generation", () => {
  const testUserId = 999999; // Use a high ID to avoid conflicts
  
  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Clean up any existing test data
    await db.delete(dishVotes).where(eq(dishVotes.userId, testUserId));
    await db.delete(mealPlans).where(eq(mealPlans.userId, testUserId));
    await db.delete(userPreferences).where(eq(userPreferences.userId, testUserId));
    
    // Create test user preferences
    await db.insert(userPreferences).values({
      userId: testUserId,
      familySize: 4,
      cuisines: JSON.stringify(["Italian", "Mexican"]),
      flavors: JSON.stringify(["Savory"]),
      dietaryRestrictions: "No shellfish",
      meatFrequency: 2, // Sometimes
      chickenFrequency: 3, // Often
      fishFrequency: 1, // Rarely
      vegetarianFrequency: 2, // Sometimes
      veganFrequency: 0, // Never
      spicyFrequency: 3, // Often
      kidFriendlyFrequency: 3, // Often
      healthyFrequency: 2, // Sometimes
      country: "US",
      language: "en",
      units: "imperial",
      currency: "USD",
      tasteProfile: JSON.stringify({
        cuisineWeights: {
          Italian: 0.8,
          Mexican: 0.6,
          Indian: 0.3,
        },
        proteinWeights: {
          chicken: 0.7,
          beef: 0.4,
          fish: 0.2,
        },
        spiceLevelPreference: 3, // Medium-hot
      }),
    });
    
    // Add some dish votes (liked is tinyint: 1 for true, 0 for false)
    await db.insert(dishVotes).values([
      {
        userId: testUserId,
        dishName: "Chicken Tikka Masala",
        liked: 1,
        context: "onboarding",
        metadata: JSON.stringify({ cuisine: "Indian", protein: "chicken", spiceLevel: "medium" }),
      },
      {
        userId: testUserId,
        dishName: "Margherita Pizza",
        liked: 1,
        context: "onboarding",
        metadata: JSON.stringify({ cuisine: "Italian", protein: "vegetarian", spiceLevel: "mild" }),
      },
      {
        userId: testUserId,
        dishName: "Beef Tacos",
        liked: 1,
        context: "onboarding",
        metadata: JSON.stringify({ cuisine: "Mexican", protein: "beef", spiceLevel: "medium" }),
      },
      {
        userId: testUserId,
        dishName: "Salmon Teriyaki",
        liked: 0,
        context: "onboarding",
        metadata: JSON.stringify({ cuisine: "Japanese", protein: "fish", spiceLevel: "mild" }),
      },
      {
        userId: testUserId,
        dishName: "Lentil Curry",
        liked: 0,
        context: "onboarding",
        metadata: JSON.stringify({ cuisine: "Indian", protein: "vegetarian", spiceLevel: "hot" }),
      },
    ]);
  });
  
  afterAll(async () => {
    const db = await getDb();
    if (!db) return;
    
    // Clean up test data
    await db.delete(dishVotes).where(eq(dishVotes.userId, testUserId));
    await db.delete(mealPlans).where(eq(mealPlans.userId, testUserId));
    await db.delete(userPreferences).where(eq(userPreferences.userId, testUserId));
  });
  
  it("should fetch user preferences with taste profile", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const prefsResult = await db.select().from(userPreferences)
      .where(eq(userPreferences.userId, testUserId))
      .limit(1);
    
    expect(prefsResult).toHaveLength(1);
    const prefs = prefsResult[0];
    expect(prefs.tasteProfile).toBeTruthy();
    
    const tasteProfile = JSON.parse(prefs.tasteProfile!);
    expect(tasteProfile.cuisineWeights).toBeDefined();
    expect(tasteProfile.cuisineWeights.Italian).toBe(0.8);
    expect(tasteProfile.proteinWeights).toBeDefined();
    expect(tasteProfile.proteinWeights.chicken).toBe(0.7);
  });
  
  it("should fetch dish votes for taste signals", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const votesResult = await db.select().from(dishVotes)
      .where(eq(dishVotes.userId, testUserId));
    
    expect(votesResult.length).toBeGreaterThan(0);
    
    const likedDishes = votesResult.filter(v => v.liked).map(v => v.dishName);
    const dislikedDishes = votesResult.filter(v => !v.liked).map(v => v.dishName);
    
    expect(likedDishes).toContain("Chicken Tikka Masala");
    expect(likedDishes).toContain("Margherita Pizza");
    expect(dislikedDishes).toContain("Salmon Teriyaki");
    expect(dislikedDishes).toContain("Lentil Curry");
  });
  
  it("should build taste signals text for LLM prompt", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const dishVotesResult = await db.select().from(dishVotes)
      .where(eq(dishVotes.userId, testUserId));
    
    const likedDishes = dishVotesResult.filter(v => v.liked).map(v => v.dishName);
    const dislikedDishes = dishVotesResult.filter(v => !v.liked).map(v => v.dishName);
    
    let tasteSignalsText = "";
    
    if (likedDishes.length > 0) {
      tasteSignalsText += `\\n- User likes these dishes: ${likedDishes.slice(0, 10).join(", ")}`;
    }
    
    if (dislikedDishes.length > 0) {
      tasteSignalsText += `\\n- User dislikes these dishes: ${dislikedDishes.slice(0, 10).join(", ")}`;
    }
    
    expect(tasteSignalsText).toContain("Chicken Tikka Masala");
    expect(tasteSignalsText).toContain("Salmon Teriyaki");
  });
  
  it("should build cuisine and protein preferences from taste profile", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const prefsResult = await db.select().from(userPreferences)
      .where(eq(userPreferences.userId, testUserId))
      .limit(1);
    
    const prefs = prefsResult[0];
    const tasteProfile = JSON.parse(prefs.tasteProfile!);
    
    const topCuisines = Object.entries(tasteProfile.cuisineWeights)
      .sort(([,a]: any, [,b]: any) => b - a)
      .slice(0, 5)
      .map(([cuisine, weight]) => `${cuisine} (${((weight as number) * 100).toFixed(0)}%)`);
    
    expect(topCuisines[0]).toContain("Italian (80%)");
    expect(topCuisines[1]).toContain("Mexican (60%)");
    
    const topProteins = Object.entries(tasteProfile.proteinWeights)
      .sort(([,a]: any, [,b]: any) => b - a)
      .slice(0, 5)
      .map(([protein, weight]) => `${protein} (${((weight as number) * 100).toFixed(0)}%)`);
    
    expect(topProteins[0]).toContain("chicken (70%)");
  });
});
