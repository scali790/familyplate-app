import { getDb } from "../db/client";
import { events, kpiDailySnapshot, users, userPreferences, mealPlans } from "../db/schema";
import { sql, and, gte, lt, eq, count, countDistinct } from "drizzle-orm";

/**
 * Daily KPI Aggregation Job
 * 
 * This job aggregates events from the `events` table and calculates KPIs
 * for a given date, then stores the results in `kpi_daily_snapshot`.
 * 
 * Should be run daily via cron job (e.g., Vercel Cron or external scheduler).
 */

export async function aggregateKpisForDate(targetDate: Date) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  console.log(`[aggregateKpis] Starting aggregation for date: ${targetDate.toISOString()}`);

  // Define date range (start of day to end of day in UTC)
  const startOfDay = new Date(targetDate);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setUTCHours(23, 59, 59, 999);

  console.log(`[aggregateKpis] Date range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

  // ========================================
  // Growth/Usage KPIs
  // ========================================

  // DAU: Distinct active users (any event)
  const dauResult = await db
    .select({ count: countDistinct(events.userId) })
    .from(events)
    .where(and(gte(events.createdAt, startOfDay), lt(events.createdAt, endOfDay)));

  const dau = dauResult[0]?.count || 0;

  // WAU: Distinct active users in the last 7 days (including target date)
  const sevenDaysAgo = new Date(targetDate);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setUTCHours(0, 0, 0, 0);

  const wauResult = await db
    .select({ count: countDistinct(events.userId) })
    .from(events)
    .where(and(gte(events.createdAt, sevenDaysAgo), lt(events.createdAt, endOfDay)));

  const wau = wauResult[0]?.count || 0;

  // MAU: Distinct active users in the last 30 days (including target date)
  const thirtyDaysAgo = new Date(targetDate);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setUTCHours(0, 0, 0, 0);

  const mauResult = await db
    .select({ count: countDistinct(events.userId) })
    .from(events)
    .where(and(gte(events.createdAt, thirtyDaysAgo), lt(events.createdAt, endOfDay)));

  const mau = mauResult[0]?.count || 0;

  // New Users: user_created events
  const newUsersResult = await db
    .select({ count: count() })
    .from(events)
    .where(
      and(
        eq(events.eventName, "user_created"),
        gte(events.createdAt, startOfDay),
        lt(events.createdAt, endOfDay)
      )
    );

  const newUsers = newUsersResult[0]?.count || 0;

  // Activation Rate: % of new users who completed onboarding (preferences_saved)
  // We need to find users who were created on this day and also saved preferences on this day
  const newUserIds = await db
    .select({ userId: events.userId })
    .from(events)
    .where(
      and(
        eq(events.eventName, "user_created"),
        gte(events.createdAt, startOfDay),
        lt(events.createdAt, endOfDay)
      )
    );

  const newUserIdList = newUserIds.map((u) => u.userId).filter(Boolean);

  let activatedUsers = 0;
  if (newUserIdList.length > 0) {
    const activatedResult = await db
      .select({ count: countDistinct(events.userId) })
      .from(events)
      .where(
        and(
          eq(events.eventName, "preferences_saved"),
          gte(events.createdAt, startOfDay),
          lt(events.createdAt, endOfDay),
          sql`${events.userId} IN (${sql.join(newUserIdList.map((id) => sql`${id}`), sql`, `)})`
        )
      );

    activatedUsers = activatedResult[0]?.count || 0;
  }

  const activationRate = newUsers > 0 ? (activatedUsers / newUsers) * 100 : 0;

  // ========================================
  // Core Product KPIs
  // ========================================

  // Meal Plans Generated: mealplan_generated events
  const mealPlansGeneratedResult = await db
    .select({ count: count() })
    .from(events)
    .where(
      and(
        eq(events.eventName, "mealplan_generated"),
        gte(events.createdAt, startOfDay),
        lt(events.createdAt, endOfDay)
      )
    );

  const mealPlansGenerated = mealPlansGeneratedResult[0]?.count || 0;

  // Meals Planned: Sum of mealCount from mealplan_generated events
  const mealsPlannedResult = await db
    .select({ properties: events.properties })
    .from(events)
    .where(
      and(
        eq(events.eventName, "mealplan_generated"),
        gte(events.createdAt, startOfDay),
        lt(events.createdAt, endOfDay)
      )
    );

  let mealsPlanned = 0;
  mealsPlannedResult.forEach((row) => {
    const props = row.properties as any;
    if (props && typeof props.mealCount === "number") {
      mealsPlanned += props.mealCount;
    }
  });

  // Cook CTA Usage: cook_cta_used events
  const cookCtaUsageResult = await db
    .select({ count: count() })
    .from(events)
    .where(
      and(
        eq(events.eventName, "cook_cta_used"),
        gte(events.createdAt, startOfDay),
        lt(events.createdAt, endOfDay)
      )
    );

  const cookCtaUsage = cookCtaUsageResult[0]?.count || 0;

  // ========================================
  // Voting/Quality KPIs
  // ========================================

  // Votes Cast: taste_vote_cast events
  const votesCastResult = await db
    .select({ count: count() })
    .from(events)
    .where(
      and(
        eq(events.eventName, "taste_vote_cast"),
        gte(events.createdAt, startOfDay),
        lt(events.createdAt, endOfDay)
      )
    );

  const votesCast = votesCastResult[0]?.count || 0;

  // Voting Participation: % of DAU who cast at least one vote
  const votersResult = await db
    .select({ count: countDistinct(events.userId) })
    .from(events)
    .where(
      and(
        eq(events.eventName, "taste_vote_cast"),
        gte(events.createdAt, startOfDay),
        lt(events.createdAt, endOfDay)
      )
    );

  const voters = votersResult[0]?.count || 0;
  const votingParticipation = dau > 0 ? (voters / dau) * 100 : 0;

  // Positive Vote Ratio: % of votes that are "up"
  const votesWithReaction = await db
    .select({ properties: events.properties })
    .from(events)
    .where(
      and(
        eq(events.eventName, "taste_vote_cast"),
        gte(events.createdAt, startOfDay),
        lt(events.createdAt, endOfDay)
      )
    );

  let positiveVotes = 0;
  let totalVotes = 0;
  votesWithReaction.forEach((row) => {
    const props = row.properties as any;
    if (props && props.reaction) {
      totalVotes++;
      if (props.reaction === "up") {
        positiveVotes++;
      }
    }
  });

  const positiveVoteRatio = totalVotes > 0 ? (positiveVotes / totalVotes) * 100 : 0;

  // ========================================
  // Shopping List KPIs
  // ========================================

  // Shopping List Opens: shopping_list_opened events
  const shoppingListOpensResult = await db
    .select({ count: count() })
    .from(events)
    .where(
      and(
        eq(events.eventName, "shopping_list_opened"),
        gte(events.createdAt, startOfDay),
        lt(events.createdAt, endOfDay)
      )
    );

  const shoppingListOpens = shoppingListOpensResult[0]?.count || 0;

  // Shopping List Generated: shopping_list_generated events
  const shoppingListGeneratedResult = await db
    .select({ count: count() })
    .from(events)
    .where(
      and(
        eq(events.eventName, "shopping_list_generated"),
        gte(events.createdAt, startOfDay),
        lt(events.createdAt, endOfDay)
      )
    );

  const shoppingListGenerated = shoppingListGeneratedResult[0]?.count || 0;

  // Shopping List Exported: shopping_list_exported events
  const shoppingListExportedResult = await db
    .select({ count: count() })
    .from(events)
    .where(
      and(
        eq(events.eventName, "shopping_list_exported"),
        gte(events.createdAt, startOfDay),
        lt(events.createdAt, endOfDay)
      )
    );

  const shoppingListExported = shoppingListExportedResult[0]?.count || 0;

  // ========================================
  // Reliability KPIs
  // ========================================

  // Error Rate: error events / total events
  const errorEventsResult = await db
    .select({ count: count() })
    .from(events)
    .where(
      and(
        eq(events.eventName, "error"),
        gte(events.createdAt, startOfDay),
        lt(events.createdAt, endOfDay)
      )
    );

  const errorEvents = errorEventsResult[0]?.count || 0;

  const totalEventsResult = await db
    .select({ count: count() })
    .from(events)
    .where(and(gte(events.createdAt, startOfDay), lt(events.createdAt, endOfDay)));

  const totalEvents = totalEventsResult[0]?.count || 0;

  const errorRate = totalEvents > 0 ? (errorEvents / totalEvents) * 100 : 0;

  // AI Token Proxy: Sum of tokensIn and tokensOut from mealplan_generated events
  const tokenUsageResult = await db
    .select({ properties: events.properties })
    .from(events)
    .where(
      and(
        eq(events.eventName, "mealplan_generated"),
        gte(events.createdAt, startOfDay),
        lt(events.createdAt, endOfDay)
      )
    );

  let tokensIn = 0;
  let tokensOut = 0;
  tokenUsageResult.forEach((row) => {
    const props = row.properties as any;
    if (props) {
      if (typeof props.tokensIn === "number") {
        tokensIn += props.tokensIn;
      }
      if (typeof props.tokensOut === "number") {
        tokensOut += props.tokensOut;
      }
    }
  });

  // ========================================
  // Insert into kpi_daily_snapshot
  // ========================================

  const snapshot = {
    date: startOfDay,
    dau,
    wau,
    mau,
    newUsers,
    activationRate,
    mealPlansGenerated,
    mealsPlanned,
    cookCtaUsage,
    votesCast,
    votingParticipation,
    positiveVoteRatio,
    shoppingListOpens,
    shoppingListGenerated,
    shoppingListExported,
    errorRate,
    tokensIn,
    tokensOut,
  };

  await db.insert(kpiDailySnapshot).values(snapshot).onConflictDoUpdate({
    target: kpiDailySnapshot.date,
    set: snapshot,
  });

  console.log(`[aggregateKpis] Aggregation complete for ${targetDate.toISOString()}:`, snapshot);

  return snapshot;
}

/**
 * Run aggregation for yesterday (default behavior)
 */
export async function aggregateKpisYesterday() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setUTCHours(0, 0, 0, 0);

  return aggregateKpisForDate(yesterday);
}
