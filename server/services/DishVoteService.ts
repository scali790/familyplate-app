/**
 * Dish Vote Service
 * 
 * Business logic for saving and retrieving dish votes (taste signals).
 * Used for personalizing meal recommendations over time.
 */

import { getDb } from "../db.js";
import { dishVotes, userPreferences } from "../../drizzle/schema.js";
import { eq, desc, and, sql } from "drizzle-orm";

// ============================================================
// Types
// ============================================================

export interface DishMetadata {
  cuisine?: string;
  protein?: string;
  spice_level?: "low" | "medium" | "high";
  cooking_time?: string;
  difficulty?: "Easy" | "Medium" | "Hard";
}

export interface DishVoteInput {
  userId: number;
  dishName: string;
  liked: boolean;
  context?: "onboarding" | "meal_plan" | "regenerate";
  metadata?: DishMetadata;
}

export interface TasteProfile {
  cuisine_weights: Record<string, number>;
  protein_weights: Record<string, number>;
  spice_preference: number;
  cooking_time_preference: "quick" | "moderate" | "slow";
  disliked_ingredients: string[];
  last_updated: string;
}

// ============================================================
// Service Class
// ============================================================

class DishVoteService {
  /**
   * Save a dish vote (taste signal)
   */
  async saveDishVote(input: DishVoteInput): Promise<{ success: boolean; voteId: number }> {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // Validate input
    const normalizedDishName = input.dishName.trim();
    if (!normalizedDishName) {
      throw new Error("Dish name is required");
    }
    if (normalizedDishName.length > 255) {
      throw new Error("Dish name must be 255 characters or less");
    }

    // Check for duplicate votes (same user/dish/context within 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const existingVotes = await db
      .select()
      .from(dishVotes)
      .where(
        and(
          eq(dishVotes.userId, input.userId),
          eq(dishVotes.dishName, normalizedDishName),
          eq(dishVotes.context, input.context || "meal_plan"),
          sql`${dishVotes.createdAt} > ${oneHourAgo.toISOString().slice(0, 19).replace('T', ' ')}`
        )
      )
      .limit(1);

    if (existingVotes.length > 0) {
      console.log(`[DishVoteService] Duplicate vote detected, skipping: user=${input.userId}, dish=${normalizedDishName}`);
      return { success: true, voteId: existingVotes[0].id };
    }

    // Insert new vote
    await db.insert(dishVotes).values({
      userId: input.userId,
      dishName: normalizedDishName,
      liked: input.liked ? 1 : 0,
      context: input.context || "meal_plan",
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    });

    // Get the last inserted ID
    const [insertedVote] = await db
      .select()
      .from(dishVotes)
      .where(eq(dishVotes.userId, input.userId))
      .orderBy(desc(dishVotes.id))
      .limit(1);
    
    const voteId = insertedVote?.id || 0;

    console.log(`[DishVoteService] Saved vote: user=${input.userId}, dish=${normalizedDishName}, liked=${input.liked}`);

    return { success: true, voteId };
  }

  /**
   * Get all dish votes for a user
   */
  async getDishVotes(
    userId: number,
    options?: {
      context?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<Array<{
    id: number;
    userId: number;
    dishName: string;
    liked: boolean;
    context: string;
    metadata: DishMetadata | null;
    createdAt: Date;
  }>> {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // Build base query
    let whereConditions = [eq(dishVotes.userId, userId)];
    
    // Add context filter if provided
    if (options?.context) {
      whereConditions.push(eq(dishVotes.context, options.context));
    }

    // Execute query with filters
    const votes = await db
      .select()
      .from(dishVotes)
      .where(and(...whereConditions))
      .orderBy(desc(dishVotes.createdAt))
      .limit(options?.limit || 1000)
      .offset(options?.offset || 0);

    // Transform to clean format
    return votes.map(vote => ({
      ...vote,
      liked: vote.liked === 1,
      metadata: vote.metadata ? JSON.parse(vote.metadata) : null,
    }));
  }

  /**
   * Get vote statistics for a user
   */
  async getVoteStats(userId: number): Promise<{
    total_votes: number;
    liked_count: number;
    disliked_count: number;
    onboarding_votes: number;
    meal_plan_votes: number;
    regenerate_votes: number;
  }> {

    const allVotes = await this.getDishVotes(userId);

    return {
      total_votes: allVotes.length,
      liked_count: allVotes.filter(v => v.liked).length,
      disliked_count: allVotes.filter(v => !v.liked).length,
      onboarding_votes: allVotes.filter(v => v.context === "onboarding").length,
      meal_plan_votes: allVotes.filter(v => v.context === "meal_plan").length,
      regenerate_votes: allVotes.filter(v => v.context === "regenerate").length,
    };
  }

  /**
   * Compute taste profile from all votes
   */
  async computeTasteProfile(userId: number): Promise<TasteProfile> {
    const votes = await this.getDishVotes(userId);

    const cuisineScores: Record<string, { likes: number; total: number }> = {};
    const proteinScores: Record<string, { likes: number; total: number }> = {};
    let totalSpice = 0;
    let spiceCount = 0;
    const cookingTimes: number[] = [];

    // Analyze each vote
    for (const vote of votes) {
      if (!vote.metadata) continue;

      // Track cuisine preferences
      if (vote.metadata.cuisine) {
        if (!cuisineScores[vote.metadata.cuisine]) {
          cuisineScores[vote.metadata.cuisine] = { likes: 0, total: 0 };
        }
        cuisineScores[vote.metadata.cuisine].total++;
        if (vote.liked) {
          cuisineScores[vote.metadata.cuisine].likes++;
        }
      }

      // Track protein preferences
      if (vote.metadata.protein) {
        if (!proteinScores[vote.metadata.protein]) {
          proteinScores[vote.metadata.protein] = { likes: 0, total: 0 };
        }
        proteinScores[vote.metadata.protein].total++;
        if (vote.liked) {
          proteinScores[vote.metadata.protein].likes++;
        }
      }

      // Track spice preference (only for liked dishes)
      if (vote.metadata.spice_level && vote.liked) {
        const spiceValue = vote.metadata.spice_level === "low" ? 0.2 : vote.metadata.spice_level === "medium" ? 0.5 : 0.8;
        totalSpice += spiceValue;
        spiceCount++;
      }

      // Track cooking time preference
      if (vote.metadata.cooking_time && vote.liked) {
        const timeMatch = vote.metadata.cooking_time.match(/(\d+)/);
        if (timeMatch) {
          cookingTimes.push(parseInt(timeMatch[1]));
        }
      }
    }

    // Compute weights
    const cuisine_weights: Record<string, number> = {};
    for (const [cuisine, scores] of Object.entries(cuisineScores)) {
      cuisine_weights[cuisine] = scores.likes / scores.total;
    }

    const protein_weights: Record<string, number> = {};
    for (const [protein, scores] of Object.entries(proteinScores)) {
      protein_weights[protein] = scores.likes / scores.total;
    }

    const spice_preference = spiceCount > 0 ? totalSpice / spiceCount : 0.5;

    const avgCookingTime = cookingTimes.length > 0 
      ? cookingTimes.reduce((a, b) => a + b, 0) / cookingTimes.length 
      : 30;
    
    const cooking_time_preference = avgCookingTime <= 20 ? "quick" : avgCookingTime <= 45 ? "moderate" : "slow";

    return {
      cuisine_weights,
      protein_weights,
      spice_preference,
      cooking_time_preference,
      disliked_ingredients: [],
      last_updated: new Date().toISOString(),
    };
  }

  /**
   * Save computed taste profile to user preferences
   */
  async saveTasteProfile(userId: number, profile: TasteProfile): Promise<void> {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    await db
      .update(userPreferences)
      .set({
        tasteProfile: JSON.stringify(profile),
      })
      .where(eq(userPreferences.userId, userId));

    console.log(`[DishVoteService] Saved taste profile for user ${userId}`);
  }

  /**
   * Get saved taste profile from user preferences
   */
  async getTasteProfile(userId: number): Promise<TasteProfile | null> {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    if (!prefs || !prefs.tasteProfile) {
      return null;
    }

    return JSON.parse(prefs.tasteProfile);
  }

  /**
   * Recompute and save taste profile
   */
  async updateTasteProfile(userId: number): Promise<TasteProfile> {
    const profile = await this.computeTasteProfile(userId);
    await this.saveTasteProfile(userId, profile);
    return profile;
  }

  /**
   * Get liked dishes
   */
  async getLikedDishes(userId: number, limit?: number): Promise<string[]> {
    const votes = await this.getDishVotes(userId, { limit });
    return votes.filter(v => v.liked).map(v => v.dishName);
  }

  /**
   * Get disliked dishes
   */
  async getDislikedDishes(userId: number, limit?: number): Promise<string[]> {
    const votes = await this.getDishVotes(userId, { limit });
    return votes.filter(v => !v.liked).map(v => v.dishName);
  }

  /**
   * Check if user has completed onboarding (10+ votes)
   */
  async hasCompletedOnboarding(userId: number): Promise<boolean> {
    const votes = await this.getDishVotes(userId, { context: "onboarding" });
    return votes.length >= 10;
  }
}

// Export singleton instance
export const dishVoteService = new DishVoteService();
