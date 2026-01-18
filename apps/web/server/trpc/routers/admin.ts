import { router, publicProcedure } from "../init";
import { requireAdmin } from "../middleware/requireAdmin";
import { getDb } from "@/server/db/client";
import { kpiDailySnapshot, events } from "@/server/db/schema";
import { z } from "zod";
import { and, gte, lte, desc, sql, eq } from "drizzle-orm";

// Create admin procedure with middleware
const adminProcedure = publicProcedure.use(requireAdmin);

// Time range enum
const TimeRangeSchema = z.enum(["7d", "30d", "90d"]);

/**
 * Get date range based on time range string
 */
function getDateRange(range: "7d" | "30d" | "90d") {
  const endDate = new Date();
  endDate.setUTCHours(23, 59, 59, 999);

  const startDate = new Date();
  startDate.setUTCHours(0, 0, 0, 0);

  switch (range) {
    case "7d":
      startDate.setDate(startDate.getDate() - 6);
      break;
    case "30d":
      startDate.setDate(startDate.getDate() - 29);
      break;
    case "90d":
      startDate.setDate(startDate.getDate() - 89);
      break;
  }

  return { startDate, endDate };
}

/**
 * Admin KPI Router
 */
const kpiRouter = router({
  /**
   * Get KPI overview for a given time range
   */
  getOverview: adminProcedure
    .input(z.object({ range: TimeRangeSchema }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { startDate, endDate } = getDateRange(input.range);

      const snapshots = await db
        .select()
        .from(kpiDailySnapshot)
        .where(and(gte(kpiDailySnapshot.date, startDate.toISOString().split('T')[0]), lte(kpiDailySnapshot.date, endDate.toISOString().split('T')[0])))
        .orderBy(desc(kpiDailySnapshot.date));

      if (snapshots.length === 0) {
        return {
          range: input.range,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          latest: null,
          average: null,
          total: null,
          timeseries: [],
        };
      }

      // Latest snapshot (most recent day)
      const latest = snapshots[0];

      // Calculate averages
      const average = {
        dau: Math.round(snapshots.reduce((sum, s) => sum + s.dau, 0) / snapshots.length),
        wau: Math.round(snapshots.reduce((sum, s) => sum + s.wau, 0) / snapshots.length),
        mau: Math.round(snapshots.reduce((sum, s) => sum + s.mau, 0) / snapshots.length),
        newUsers: Math.round(snapshots.reduce((sum, s) => sum + s.newUsers, 0) / snapshots.length),
        activationRate: snapshots.reduce((sum, s) => sum + s.activationRate, 0) / snapshots.length,
        mealPlansGenerated: Math.round(
          snapshots.reduce((sum, s) => sum + s.mealPlansGenerated, 0) / snapshots.length
        ),
        mealsPlanned: Math.round(snapshots.reduce((sum, s) => sum + s.mealsPlanned, 0) / snapshots.length),
        cookCtaUsage: Math.round(snapshots.reduce((sum, s) => sum + s.cookCtaUsage, 0) / snapshots.length),
        votesCast: Math.round(snapshots.reduce((sum, s) => sum + s.votesCast, 0) / snapshots.length),
        votingParticipation: snapshots.reduce((sum, s) => sum + s.votingParticipation, 0) / snapshots.length,
        positiveVoteRatio: snapshots.reduce((sum, s) => sum + s.positiveVoteRatio, 0) / snapshots.length,
        shoppingListOpens: Math.round(
          snapshots.reduce((sum, s) => sum + s.shoppingListOpens, 0) / snapshots.length
        ),
        shoppingListGenerated: Math.round(
          snapshots.reduce((sum, s) => sum + s.shoppingListGenerated, 0) / snapshots.length
        ),
        shoppingListExported: Math.round(
          snapshots.reduce((sum, s) => sum + s.shoppingListExported, 0) / snapshots.length
        ),
        errorRate: snapshots.reduce((sum, s) => sum + s.errorRate, 0) / snapshots.length,
        tokensIn: Math.round(snapshots.reduce((sum, s) => sum + s.tokensIn, 0) / snapshots.length),
        tokensOut: Math.round(snapshots.reduce((sum, s) => sum + s.tokensOut, 0) / snapshots.length),
      };

      // Calculate totals (sum)
      const total = {
        newUsers: snapshots.reduce((sum, s) => sum + s.newUsers, 0),
        mealPlansGenerated: snapshots.reduce((sum, s) => sum + s.mealPlansGenerated, 0),
        mealsPlanned: snapshots.reduce((sum, s) => sum + s.mealsPlanned, 0),
        cookCtaUsage: snapshots.reduce((sum, s) => sum + s.cookCtaUsage, 0),
        votesCast: snapshots.reduce((sum, s) => sum + s.votesCast, 0),
        shoppingListOpens: snapshots.reduce((sum, s) => sum + s.shoppingListOpens, 0),
        shoppingListGenerated: snapshots.reduce((sum, s) => sum + s.shoppingListGenerated, 0),
        shoppingListExported: snapshots.reduce((sum, s) => sum + s.shoppingListExported, 0),
        tokensIn: snapshots.reduce((sum, s) => sum + s.tokensIn, 0),
        tokensOut: snapshots.reduce((sum, s) => sum + s.tokensOut, 0),
      };

      return {
        range: input.range,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        latest,
        average,
        total,
        timeseries: snapshots.reverse(), // Oldest to newest for charts
      };
    }),

  /**
   * Get timeseries data for a specific KPI
   */
  getTimeseries: adminProcedure
    .input(
      z.object({
        range: TimeRangeSchema,
        kpiKey: z.enum([
          "dau",
          "wau",
          "mau",
          "newUsers",
          "activationRate",
          "mealPlansGenerated",
          "mealsPlanned",
          "cookCtaUsage",
          "votesCast",
          "votingParticipation",
          "positiveVoteRatio",
          "shoppingListOpens",
          "shoppingListGenerated",
          "shoppingListExported",
          "errorRate",
          "tokensIn",
          "tokensOut",
        ]),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { startDate, endDate } = getDateRange(input.range);

      const snapshots = await db
        .select()
        .from(kpiDailySnapshot)
        .where(and(gte(kpiDailySnapshot.date, startDate.toISOString().split('T')[0]), lte(kpiDailySnapshot.date, endDate.toISOString().split('T')[0])))
        .orderBy(kpiDailySnapshot.date);

      const timeseries = snapshots.map((s) => ({
        date: s.date,
        value: s[input.kpiKey],
      }));

      return {
        kpiKey: input.kpiKey,
        range: input.range,
        timeseries,
      };
    }),
});

/**
 * Admin Errors Router
 */
const errorsRouter = router({
  /**
   * Get top errors for a given time range
   */
  getTop: adminProcedure
    .input(z.object({ range: TimeRangeSchema, limit: z.number().optional().default(10) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { startDate, endDate } = getDateRange(input.range);

      // Get all error events
      const errorEvents = await db
        .select()
        .from(events)
        .where(
          and(
            eq(events.eventName, "error"),
            gte(events.createdAt, startDate),
            lte(events.createdAt, endDate)
          )
        )
        .orderBy(desc(events.createdAt));

      // Group by error message and count
      const errorMap = new Map<string, { message: string; count: number; lastOccurred: Date }>();

      errorEvents.forEach((event) => {
        const props = event.properties as any;
        const message = props?.message || props?.error || "Unknown error";

        if (errorMap.has(message)) {
          const existing = errorMap.get(message)!;
          existing.count++;
          if (event.createdAt > existing.lastOccurred) {
            existing.lastOccurred = event.createdAt;
          }
        } else {
          errorMap.set(message, {
            message,
            count: 1,
            lastOccurred: event.createdAt,
          });
        }
      });

      // Convert to array and sort by count
      const topErrors = Array.from(errorMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, input.limit);

      return {
        range: input.range,
        topErrors,
      };
    }),
});

/**
 * Admin Router
 */
export const adminRouter = router({
  kpi: kpiRouter,
  errors: errorsRouter,
});
