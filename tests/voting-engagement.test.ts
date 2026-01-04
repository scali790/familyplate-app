import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "../server/db";
import { users, userPreferences, mealPlans, mealVotes, type MealVote } from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

describe("Voting Engagement Features", () => {
  let testUserId: string;
  let testPlanId: string;
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error("Database not available for testing");
    }
    // Create test user
    const userEmail = `voting-engagement-${Date.now()}@test.com`;
    await db.execute(sql`
      INSERT INTO users (openId, email, name)
      VALUES (${userEmail}, ${userEmail}, 'Test Family')
    `);
    
    const userResult = await db.execute(sql`
      SELECT id FROM users WHERE email = ${userEmail} ORDER BY id DESC LIMIT 1
    `);
    const userRows = userResult as any;
    // Result is [rows, fields] - we need rows[0]
    if (!userRows || !userRows[0] || userRows[0].length === 0) {
      throw new Error('Failed to create test user');
    }
    testUserId = userRows[0][0].id.toString();

    // Create user preferences with family size
    const cuisinesJson = JSON.stringify(["Italian", "Mexican"]);
    const flavorsJson = JSON.stringify(["Savory"]);
    const dietaryJson = JSON.stringify([]);
    
    await db.execute(sql`
      INSERT INTO user_preferences (
        user_id, family_size, family_name, cuisines, flavors, dietary_restrictions,
        country, chicken_frequency, meat_frequency, fish_frequency,
        vegetarian_frequency, vegan_frequency, spicy_frequency,
        kid_friendly_frequency, healthy_frequency
      )
      VALUES (
        ${testUserId}, 4, 'The Smiths', ${cuisinesJson},
        ${flavorsJson}, ${dietaryJson}, 'US',
        3, 2, 2, 1, 0, 2, 3, 2
      )
    `);

    // Create test meal plan
    const meals = JSON.stringify([{
      day: "Monday",
      name: "Spaghetti Carbonara",
      description: "Classic Italian pasta",
      ingredients: ["pasta", "eggs", "bacon"],
      instructions: ["Cook pasta", "Mix with eggs"],
      prepTime: "15 min",
      cookTime: "20 min",
      difficulty: "Easy",
      tags: ["Italian"],
      upvotes: 0,
      downvotes: 0,
    }]);
    
    await db.execute(sql`
      INSERT INTO meal_plans (user_id, week_start_date, meals)
      VALUES (${testUserId}, '2026-01-06', ${meals})
    `);
    
    const planResult = await db.execute(sql`
      SELECT id FROM meal_plans WHERE user_id = ${testUserId} ORDER BY id DESC LIMIT 1
    `);
    testPlanId = (planResult as any)[0][0].id.toString();
  });

  afterAll(async () => {
    // Cleanup
    if (testPlanId && db) {
      await db.execute(sql`DELETE FROM meal_votes WHERE meal_plan_id = ${testPlanId}`);
      await db.execute(sql`DELETE FROM meal_plans WHERE id = ${testPlanId}`);
    }
    if (testUserId && db) {
      await db.execute(sql`DELETE FROM user_preferences WHERE user_id = ${testUserId}`);
      await db.execute(sql`DELETE FROM users WHERE id = ${testUserId}`);
    }
  });

  it("should track voter names when voting", async () => {
    // Vote as "Mom"
    await db!.execute(sql`
      INSERT INTO meal_votes (meal_plan_id, meal_day, user_id, voter_name, vote_type)
      VALUES (${testPlanId}, 'Monday', ${testUserId}, 'Mom', 'up')
    `);

    // Vote as "Dad"
    await db!.execute(sql`
      INSERT INTO meal_votes (meal_plan_id, meal_day, user_id, voter_name, vote_type)
      VALUES (${testPlanId}, 'Monday', ${testUserId}, 'Dad', 'down')
    `);

    // Retrieve votes
    const votes = await db!.execute(sql`
      SELECT * FROM meal_votes
      WHERE meal_plan_id = ${testPlanId}
      AND meal_day = 'Monday'
    `);

    const voteRows = (votes as any)[0]; // Get rows from [rows, fields]
    expect(voteRows).toHaveLength(2);
    expect(voteRows.find((v: any) => v.voter_name === "Mom")?.vote_type).toBe("up");
    expect(voteRows.find((v: any) => v.voter_name === "Dad")?.vote_type).toBe("down");
  });

  it("should calculate voting progress correctly", async () => {
    // Get preferences to check family size
    const prefs = await db!.execute(sql`
      SELECT * FROM user_preferences WHERE user_id = ${testUserId}
    `);

    const prefsRows = (prefs as any)[0]; // Get rows from [rows, fields]
    expect(prefsRows[0].family_size).toBe(4);

    // Get current votes
    const votes = await db!.execute(sql`
      SELECT * FROM meal_votes
      WHERE meal_plan_id = ${testPlanId}
      AND meal_day = 'Monday'
    `);

    const voteRows = (votes as any)[0]; // Get rows from [rows, fields]
    const totalVoters = voteRows.length;
    const expectedVoters = prefsRows[0].family_size;
    const votingProgress = totalVoters / expectedVoters;

    expect(totalVoters).toBe(2); // Mom and Dad voted
    expect(expectedVoters).toBe(4); // Family size is 4
    expect(votingProgress).toBe(0.5); // 50% participation
  });

  it("should generate voter initials correctly", () => {
    const testCases = [
      { name: "Mom", expected: "M" },
      { name: "Dad Smith", expected: "DS" },
      { name: "Sarah Jane Johnson", expected: "SJ" }, // Takes first 2 initials
      { name: "John", expected: "J" },
    ];

    testCases.forEach(({ name, expected }) => {
      const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
      expect(initials).toBe(expected);
    });
  });

  it("should distinguish between upvotes and downvotes for avatars", async () => {
    const votes = await db!.execute(sql`
      SELECT * FROM meal_votes
      WHERE meal_plan_id = ${testPlanId}
      AND meal_day = 'Monday'
    `);

    const voteRows = (votes as any)[0]; // Get rows from [rows, fields]
    const upvoteVoters = voteRows.filter((v: any) => v.vote_type === "up");
    const downvoteVoters = voteRows.filter((v: any) => v.vote_type === "down");

    expect(upvoteVoters).toHaveLength(1);
    expect(downvoteVoters).toHaveLength(1);
    expect(upvoteVoters[0].voter_name).toBe("Mom");
    expect(downvoteVoters[0].voter_name).toBe("Dad");
  });

  it("should show low participation warning when not all family members voted", async () => {
    const prefs = await db!.execute(sql`
      SELECT * FROM user_preferences WHERE user_id = ${testUserId}
    `);

    const votes = await db!.execute(sql`
      SELECT * FROM meal_votes
      WHERE meal_plan_id = ${testPlanId}
      AND meal_day = 'Monday'
    `);

    const prefsRows = (prefs as any)[0];
    const voteRows = (votes as any)[0];
    const totalVoters = voteRows.length;
    const expectedVoters = prefsRows[0].family_size;
    const shouldShowWarning = totalVoters < expectedVoters;

    expect(shouldShowWarning).toBe(true); // 2 out of 4 voted
    expect(totalVoters).toBe(2);
    expect(expectedVoters).toBe(4);
  });

  it("should not show warning when all family members voted", async () => {
    // Add 2 more votes to complete the family
    await db!.execute(sql`
      INSERT INTO meal_votes (meal_plan_id, meal_day, user_id, voter_name, vote_type)
      VALUES (${testPlanId}, 'Monday', ${testUserId}, 'Sarah', 'up')
    `);

    await db!.execute(sql`
      INSERT INTO meal_votes (meal_plan_id, meal_day, user_id, voter_name, vote_type)
      VALUES (${testPlanId}, 'Monday', ${testUserId}, 'Tommy', 'up')
    `);

    const prefs = await db!.execute(sql`
      SELECT * FROM user_preferences WHERE user_id = ${testUserId}
    `);

    const votes = await db!.execute(sql`
      SELECT * FROM meal_votes
      WHERE meal_plan_id = ${testPlanId}
      AND meal_day = 'Monday'
    `);

    const prefsRows = (prefs as any)[0];
    const voteRows = (votes as any)[0];
    const totalVoters = voteRows.length;
    const expectedVoters = prefsRows[0].family_size;
    const shouldShowWarning = totalVoters < expectedVoters;

    expect(shouldShowWarning).toBe(false); // 4 out of 4 voted
    expect(totalVoters).toBe(4);
    expect(expectedVoters).toBe(4);
  });
});
