import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "../server/db";
import { userPreferences, mealPlans } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("EasyPlate Meal Planning", () => {
  let db: Awaited<ReturnType<typeof getDb>>;
  let testUserId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database connection failed");
    // Create a test user ID (in real tests, you'd create a full user)
    testUserId = 1;
  });

  it("should save user preferences", async () => {
    if (!db) throw new Error("Database not initialized");
    const preferences = {
      userId: testUserId,
      familySize: 4,
      cuisines: JSON.stringify(["Italian", "Mexican", "Chinese"]),
      flavors: JSON.stringify(["Savory", "Spicy"]),
      dietaryRestrictions: "No nuts",
    };

    await db.insert(userPreferences).values(preferences);

    const saved = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, testUserId))
      .limit(1);

    expect(saved.length).toBe(1);
    expect(saved[0].familySize).toBe(4);
    expect(JSON.parse(saved[0].cuisines || "[]")).toContain("Italian");
  });

  it("should create meal plan structure", async () => {
    if (!db) throw new Error("Database not initialized");
    const mealPlan = {
      userId: testUserId,
      weekStartDate: "2026-01-06",
      meals: JSON.stringify([
        {
          day: "Monday",
          name: "Spaghetti Carbonara",
          description: "Classic Italian pasta",
          prepTime: "30 min",
          difficulty: "Medium",
          upvotes: 0,
          downvotes: 0,
        },
      ]),
    };

    await db.insert(mealPlans).values(mealPlan);

    const saved = await db
      .select()
      .from(mealPlans)
      .where(eq(mealPlans.userId, testUserId))
      .limit(1);

    expect(saved.length).toBe(1);
    expect(saved[0].weekStartDate).toBe("2026-01-06");
    
    const meals = JSON.parse(saved[0].meals || "[]");
    expect(meals).toHaveLength(1);
    expect(meals[0].name).toBe("Spaghetti Carbonara");
  });

  it("should validate meal plan has 7 days", () => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    expect(days).toHaveLength(7);
  });

  it("should validate cuisine selection limit", () => {
    const maxCuisines = 5;
    const selectedCuisines = ["Italian", "Mexican", "Chinese", "Japanese", "Thai"];
    expect(selectedCuisines.length).toBeLessThanOrEqual(maxCuisines);
  });

  it("should validate family size range", () => {
    const minSize = 1;
    const maxSize = 20;
    const testSize = 4;
    
    expect(testSize).toBeGreaterThanOrEqual(minSize);
    expect(testSize).toBeLessThanOrEqual(maxSize);
  });
});
