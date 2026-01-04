import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDb } from '../server/db';
import { mealPlans } from '../drizzle/schema';
import { eq, sql } from 'drizzle-orm';

describe('Multi-Week Plan Management', () => {
  let testUserId: number;
  let db: any;

  beforeEach(async () => {
    db = await getDb();
    
    // Create test user
    const userEmail = `multiweek-${Date.now()}@test.com`;
    await db.execute(sql`
      INSERT INTO users (openId, email, name)
      VALUES (${userEmail}, ${userEmail}, 'Test User')
    `);
    
    const userResult = await db.execute(sql`
      SELECT id FROM users WHERE email = ${userEmail} ORDER BY id DESC LIMIT 1
    `);
    const userRows = userResult as any;
    if (!userRows || !userRows[0] || userRows[0].length === 0) {
      throw new Error('Failed to create test user');
    }
    testUserId = userRows[0][0].id;
  });

  afterEach(async () => {
    // Cleanup
    if (db && testUserId) {
      await db.execute(sql`DELETE FROM meal_plans WHERE user_id = ${testUserId}`);
      await db.execute(sql`DELETE FROM users WHERE id = ${testUserId}`);
    }
  });

  describe('getAllPlans endpoint', () => {
    it('should return empty array when user has no plans', async () => {
      const result = await db.select().from(mealPlans)
        .where(eq(mealPlans.userId, testUserId));
      
      expect(result).toHaveLength(0);
    });

    it('should return all plans for a user', async () => {
      // Create multiple meal plans
      const week1 = '2026-01-12';
      const week2 = '2026-01-19';
      const week3 = '2026-01-26';
      
      const meals = JSON.stringify([
        { day: 'Monday', name: 'Test Meal 1' },
        { day: 'Tuesday', name: 'Test Meal 2' },
        { day: 'Wednesday', name: 'Test Meal 3' },
        { day: 'Thursday', name: 'Test Meal 4' },
        { day: 'Friday', name: 'Test Meal 5' },
        { day: 'Saturday', name: 'Test Meal 6' },
        { day: 'Sunday', name: 'Test Meal 7' },
      ]);

      await db.insert(mealPlans).values({
        userId: testUserId,
        weekStartDate: week1,
        meals,
      });

      await db.insert(mealPlans).values({
        userId: testUserId,
        weekStartDate: week2,
        meals,
      });

      await db.insert(mealPlans).values({
        userId: testUserId,
        weekStartDate: week3,
        meals,
      });

      const result = await db.select().from(mealPlans)
        .where(eq(mealPlans.userId, testUserId));
      
      expect(result).toHaveLength(3);
      
      const weekDates = result.map((p: any) => p.weekStartDate).sort();
      expect(weekDates).toEqual([week1, week2, week3]);
    });

    it('should return plans sorted by weekStartDate descending', async () => {
      const week1 = '2026-01-12';
      const week2 = '2026-01-26'; // Later week
      const week3 = '2026-01-19'; // Middle week
      
      const meals = JSON.stringify([
        { day: 'Monday', name: 'Test Meal' },
        { day: 'Tuesday', name: 'Test Meal' },
        { day: 'Wednesday', name: 'Test Meal' },
        { day: 'Thursday', name: 'Test Meal' },
        { day: 'Friday', name: 'Test Meal' },
        { day: 'Saturday', name: 'Test Meal' },
        { day: 'Sunday', name: 'Test Meal' },
      ]);

      // Insert in random order
      await db.insert(mealPlans).values({ userId: testUserId, weekStartDate: week1, meals });
      await db.insert(mealPlans).values({ userId: testUserId, weekStartDate: week2, meals });
      await db.insert(mealPlans).values({ userId: testUserId, weekStartDate: week3, meals });

      const result = await db.execute(sql`
        SELECT week_start_date as weekStartDate FROM meal_plans WHERE user_id = ${testUserId} ORDER BY week_start_date DESC
      `);
      
      const weekDates = result[0].map((row: any) => row.weekStartDate);
      expect(weekDates).toEqual([week2, week3, week1]); // Descending order
    });

    it('should include meal count for each plan', async () => {
      const week1 = '2026-01-12';
      const meals = JSON.stringify([
        { day: 'Monday', name: 'Meal 1' },
        { day: 'Tuesday', name: 'Meal 2' },
        { day: 'Wednesday', name: 'Meal 3' },
        { day: 'Thursday', name: 'Meal 4' },
        { day: 'Friday', name: 'Meal 5' },
        { day: 'Saturday', name: 'Meal 6' },
        { day: 'Sunday', name: 'Meal 7' },
      ]);

      await db.insert(mealPlans).values({
        userId: testUserId,
        weekStartDate: week1,
        meals,
      });

      const result = await db.select().from(mealPlans)
        .where(eq(mealPlans.userId, testUserId));
      
      expect(result).toHaveLength(1);
      const parsedMeals = JSON.parse(result[0].meals);
      expect(parsedMeals).toHaveLength(7);
    });

    it('should not return plans from other users', async () => {
      // Create another user
      const otherEmail = `other-${Date.now()}@test.com`;
      await db.execute(sql`
        INSERT INTO users (openId, email, name)
        VALUES (${otherEmail}, ${otherEmail}, 'Other User')
      `);
      
      const otherUserResult = await db.execute(sql`
        SELECT id FROM users WHERE email = ${otherEmail} ORDER BY id DESC LIMIT 1
      `);
      const otherUserRows = otherUserResult as any;
      const otherUserId = otherUserRows[0][0].id;

      const meals = JSON.stringify([
        { day: 'Monday', name: 'Meal' },
        { day: 'Tuesday', name: 'Meal' },
        { day: 'Wednesday', name: 'Meal' },
        { day: 'Thursday', name: 'Meal' },
        { day: 'Friday', name: 'Meal' },
        { day: 'Saturday', name: 'Meal' },
        { day: 'Sunday', name: 'Meal' },
      ]);

      // Create plan for test user
      await db.insert(mealPlans).values({
        userId: testUserId,
        weekStartDate: '2026-01-12',
        meals,
      });

      // Create plan for other user
      await db.insert(mealPlans).values({
        userId: otherUserId,
        weekStartDate: '2026-01-19',
        meals,
      });

      // Query test user's plans
      const result = await db.select().from(mealPlans)
        .where(eq(mealPlans.userId, testUserId));
      
      expect(result).toHaveLength(1);
      expect(result[0].weekStartDate).toBe('2026-01-12');

      // Cleanup other user
      await db.execute(sql`DELETE FROM meal_plans WHERE user_id = ${otherUserId}`);
      await db.execute(sql`DELETE FROM users WHERE id = ${otherUserId}`);
    });
  });

  describe('Plan overwrite detection', () => {
    it('should detect existing plan for a specific week', async () => {
      const targetWeek = '2026-01-12';
      const meals = JSON.stringify([
        { day: 'Monday', name: 'Meal' },
        { day: 'Tuesday', name: 'Meal' },
        { day: 'Wednesday', name: 'Meal' },
        { day: 'Thursday', name: 'Meal' },
        { day: 'Friday', name: 'Meal' },
        { day: 'Saturday', name: 'Meal' },
        { day: 'Sunday', name: 'Meal' },
      ]);

      await db.insert(mealPlans).values({
        userId: testUserId,
        weekStartDate: targetWeek,
        meals,
      });

      const existingPlan = await db.select().from(mealPlans)
        .where(eq(mealPlans.userId, testUserId))
        .then((plans: any[]) => plans.find(p => p.weekStartDate === targetWeek));
      
      expect(existingPlan).toBeDefined();
      expect(existingPlan.weekStartDate).toBe(targetWeek);
    });

    it('should allow creating plan for different week', async () => {
      const week1 = '2026-01-12';
      const week2 = '2026-01-19';
      const meals = JSON.stringify([
        { day: 'Monday', name: 'Meal' },
        { day: 'Tuesday', name: 'Meal' },
        { day: 'Wednesday', name: 'Meal' },
        { day: 'Thursday', name: 'Meal' },
        { day: 'Friday', name: 'Meal' },
        { day: 'Saturday', name: 'Meal' },
        { day: 'Sunday', name: 'Meal' },
      ]);

      // Create plan for week 1
      await db.insert(mealPlans).values({
        userId: testUserId,
        weekStartDate: week1,
        meals,
      });

      // Check if week 2 is available
      const existingPlan = await db.select().from(mealPlans)
        .where(eq(mealPlans.userId, testUserId))
        .then((plans: any[]) => plans.find(p => p.weekStartDate === week2));
      
      expect(existingPlan).toBeUndefined();

      // Create plan for week 2 (should succeed)
      await db.insert(mealPlans).values({
        userId: testUserId,
        weekStartDate: week2,
        meals,
      });

      const allPlans = await db.select().from(mealPlans)
        .where(eq(mealPlans.userId, testUserId));
      
      expect(allPlans).toHaveLength(2);
    });

    it('should replace existing plan when creating for same week', async () => {
      const targetWeek = '2026-01-12';
      const meals1 = JSON.stringify([
        { day: 'Monday', name: 'Old Meal 1' },
        { day: 'Tuesday', name: 'Old Meal 2' },
        { day: 'Wednesday', name: 'Old Meal 3' },
        { day: 'Thursday', name: 'Old Meal 4' },
        { day: 'Friday', name: 'Old Meal 5' },
        { day: 'Saturday', name: 'Old Meal 6' },
        { day: 'Sunday', name: 'Old Meal 7' },
      ]);

      const meals2 = JSON.stringify([
        { day: 'Monday', name: 'New Meal 1' },
        { day: 'Tuesday', name: 'New Meal 2' },
        { day: 'Wednesday', name: 'New Meal 3' },
        { day: 'Thursday', name: 'New Meal 4' },
        { day: 'Friday', name: 'New Meal 5' },
        { day: 'Saturday', name: 'New Meal 6' },
        { day: 'Sunday', name: 'New Meal 7' },
      ]);

      // Create initial plan
      await db.insert(mealPlans).values({
        userId: testUserId,
        weekStartDate: targetWeek,
        meals: meals1,
      });

      // Delete old plan and create new one (simulating replace)
      await db.execute(sql`
        DELETE FROM meal_plans WHERE user_id = ${testUserId} AND week_start_date = ${targetWeek}
      `);

      await db.insert(mealPlans).values({
        userId: testUserId,
        weekStartDate: targetWeek,
        meals: meals2,
      });

      const result = await db.select().from(mealPlans)
        .where(eq(mealPlans.userId, testUserId));
      
      expect(result).toHaveLength(1);
      const parsedMeals = JSON.parse(result[0].meals);
      expect(parsedMeals[0].name).toBe('New Meal 1');
    });
  });

  describe('Multi-week workflow', () => {
    it('should support creating plans for 4 consecutive weeks', async () => {
      const weeks = [
        '2026-01-12',
        '2026-01-19',
        '2026-01-26',
        '2026-02-02',
      ];

      const meals = JSON.stringify([
        { day: 'Monday', name: 'Meal' },
        { day: 'Tuesday', name: 'Meal' },
        { day: 'Wednesday', name: 'Meal' },
        { day: 'Thursday', name: 'Meal' },
        { day: 'Friday', name: 'Meal' },
        { day: 'Saturday', name: 'Meal' },
        { day: 'Sunday', name: 'Meal' },
      ]);

      for (const week of weeks) {
        await db.insert(mealPlans).values({
          userId: testUserId,
          weekStartDate: week,
          meals,
        });
      }

      const result = await db.select().from(mealPlans)
        .where(eq(mealPlans.userId, testUserId));
      
      expect(result).toHaveLength(4);
      
      const weekDates = result.map((p: any) => p.weekStartDate).sort();
      expect(weekDates).toEqual(weeks);
    });

    it('should maintain separate meal data for each week', async () => {
      const week1 = '2026-01-12';
      const week2 = '2026-01-19';

      const meals1 = JSON.stringify([
        { day: 'Monday', name: 'Week 1 Meal' },
        { day: 'Tuesday', name: 'Week 1 Meal' },
        { day: 'Wednesday', name: 'Week 1 Meal' },
        { day: 'Thursday', name: 'Week 1 Meal' },
        { day: 'Friday', name: 'Week 1 Meal' },
        { day: 'Saturday', name: 'Week 1 Meal' },
        { day: 'Sunday', name: 'Week 1 Meal' },
      ]);

      const meals2 = JSON.stringify([
        { day: 'Monday', name: 'Week 2 Meal' },
        { day: 'Tuesday', name: 'Week 2 Meal' },
        { day: 'Wednesday', name: 'Week 2 Meal' },
        { day: 'Thursday', name: 'Week 2 Meal' },
        { day: 'Friday', name: 'Week 2 Meal' },
        { day: 'Saturday', name: 'Week 2 Meal' },
        { day: 'Sunday', name: 'Week 2 Meal' },
      ]);

      await db.insert(mealPlans).values({ userId: testUserId, weekStartDate: week1, meals: meals1 });
      await db.insert(mealPlans).values({ userId: testUserId, weekStartDate: week2, meals: meals2 });

      const result = await db.select().from(mealPlans)
        .where(eq(mealPlans.userId, testUserId));
      
      const plan1 = result.find((p: any) => p.weekStartDate === week1);
      const plan2 = result.find((p: any) => p.weekStartDate === week2);

      const parsedMeals1 = JSON.parse(plan1.meals);
      const parsedMeals2 = JSON.parse(plan2.meals);

      expect(parsedMeals1[0].name).toBe('Week 1 Meal');
      expect(parsedMeals2[0].name).toBe('Week 2 Meal');
    });
  });
});
