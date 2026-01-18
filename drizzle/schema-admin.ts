import { pgTable, bigserial, uuid, varchar, jsonb, timestamp, date, numeric } from "drizzle-orm/pg-core";

/**
 * Events Table
 * Captures all relevant user and system actions for KPI aggregation.
 */
export const events = pgTable("events", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: uuid("user_id"),
  familyId: uuid("family_id"),
  eventName: varchar("event_name", { length: 255 }).notNull(),
  properties: jsonb("properties"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  env: varchar("env", { length: 50 }),
});

/**
 * KPI Daily Snapshot Table
 * Stores aggregated KPIs for fast dashboard queries.
 */
export const kpiDailySnapshot = pgTable("kpi_daily_snapshot", {
  day: date("day").primaryKey(),
  kpiKey: varchar("kpi_key", { length: 255 }).primaryKey(),
  value: numeric("value").notNull(),
  breakdown: jsonb("breakdown"),
});
