/**
 * Test file for Dish Votes API
 * Run with: pnpm test server/services/dishVotes.test.ts
 */

import { describe, it, expect } from "vitest";
import { dishVoteService } from "./DishVoteService.js";

describe("DishVoteService", () => {
  const testUserId = 1;

  it("should save a dish vote", async () => {
    const result = await dishVoteService.saveDishVote({
      userId: testUserId,
      dishName: "Chicken Tikka Masala",
      liked: true,
      context: "onboarding",
      metadata: {
        cuisine: "Indian",
        protein: "chicken",
        spice_level: "high",
        cooking_time: "30 mins",
        difficulty: "Medium",
      },
    });

    expect(result.success).toBe(true);
    expect(result.voteId).toBeGreaterThan(0);
  });

  it("should retrieve dish votes", async () => {
    const votes = await dishVoteService.getDishVotes(testUserId);
    
    expect(Array.isArray(votes)).toBe(true);
    expect(votes.length).toBeGreaterThan(0);
    
    const firstVote = votes[0];
    expect(firstVote).toHaveProperty("dishName");
    expect(firstVote).toHaveProperty("liked");
    expect(typeof firstVote.liked).toBe("boolean");
  });

  it("should get vote statistics", async () => {
    const stats = await dishVoteService.getVoteStats(testUserId);
    
    expect(stats).toHaveProperty("total_votes");
    expect(stats).toHaveProperty("liked_count");
    expect(stats).toHaveProperty("disliked_count");
    expect(stats.total_votes).toBeGreaterThanOrEqual(0);
  });

  it("should compute taste profile", async () => {
    // Add multiple votes first
    await dishVoteService.saveDishVote({
      userId: testUserId,
      dishName: "Margherita Pizza",
      liked: true,
      context: "onboarding",
      metadata: {
        cuisine: "Italian",
        protein: "cheese",
        spice_level: "low",
        cooking_time: "20 mins",
        difficulty: "Easy",
      },
    });

    await dishVoteService.saveDishVote({
      userId: testUserId,
      dishName: "Spicy Thai Curry",
      liked: true,
      context: "onboarding",
      metadata: {
        cuisine: "Thai",
        protein: "chicken",
        spice_level: "high",
        cooking_time: "25 mins",
        difficulty: "Medium",
      },
    });

    const profile = await dishVoteService.computeTasteProfile(testUserId);
    
    expect(profile).toHaveProperty("cuisine_weights");
    expect(profile).toHaveProperty("protein_weights");
    expect(profile).toHaveProperty("spice_preference");
    expect(profile).toHaveProperty("cooking_time_preference");
    
    expect(typeof profile.spice_preference).toBe("number");
    expect(profile.spice_preference).toBeGreaterThanOrEqual(0);
    expect(profile.spice_preference).toBeLessThanOrEqual(1);
  });

  it("should save and retrieve taste profile", async () => {
    const profile = await dishVoteService.computeTasteProfile(testUserId);
    await dishVoteService.saveTasteProfile(testUserId, profile);
    
    const retrieved = await dishVoteService.getTasteProfile(testUserId);
    
    expect(retrieved).not.toBeNull();
    expect(retrieved?.cuisine_weights).toEqual(profile.cuisine_weights);
    expect(retrieved?.spice_preference).toBe(profile.spice_preference);
  });

  it("should prevent duplicate votes within 1 hour", async () => {
    const dishName = "Duplicate Test Dish";
    
    const result1 = await dishVoteService.saveDishVote({
      userId: testUserId,
      dishName,
      liked: true,
      context: "meal_plan",
    });
    
    const result2 = await dishVoteService.saveDishVote({
      userId: testUserId,
      dishName,
      liked: false,
      context: "meal_plan",
    });
    
    // Second vote should be skipped (same voteId returned)
    expect(result1.voteId).toBe(result2.voteId);
  });
});
