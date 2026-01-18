# 📊 FamilyPlate Admin Dashboard

**Lead Engineer:** Manus AI
**Status:** Ready for Deployment

## 1. Executive Summary

This document outlines the architecture, implementation, and deployment process for the FamilyPlate Admin Dashboard. The dashboard provides a centralized, admin-only interface to monitor key product KPIs, track user engagement, and gain insights into application performance.

The core principle is an **event-first tracking system** coupled with daily data aggregation. This ensures the dashboard remains fast and responsive without putting heavy load on the production database during business hours.

## 2. Architecture

The architecture consists of four main components:

| Component | Technology | Description |
|---|---|---|
| **Event Tracking** | TypeScript / Drizzle | A server-side `trackEvent` function captures all relevant user actions and system events into an `events` table. |
| **Data Aggregation** | Vercel Cron / Node.js | A daily cron job (`/api/cron/aggregate-kpis`) processes the `events` table and populates a `kpi_daily_snapshot` table with aggregated metrics. |
| **Admin API** | tRPC | A secure, type-safe API provides data to the frontend. All endpoints are protected by an `requireAdmin` middleware. |
| **Admin UI** | Next.js / React | A responsive dashboard built with Next.js App Router, Shadcn UI, and Recharts, located at the `/admin` route. |

## 3. Database Schema

Two new tables have been added to the database schema (`/server/db/schema.ts`):

### `events`

Stores raw event data. This is an append-only table.

| Column | Type | Description |
|---|---|---|
| `id` | `BIGSERIAL` | Primary Key |
| `eventName` | `VARCHAR(100)` | The name of the event (e.g., `user_created`). |
| `userId` | `INTEGER` | Foreign key to the `users` table. Can be `NULL` for system events. |
| `properties` | `JSONB` | A JSON object for additional event-specific data. |
| `createdAt` | `TIMESTAMP` | Timestamp of the event. |

### `kpi_daily_snapshot`

Stores aggregated daily KPIs. The Admin UI reads exclusively from this table.

| Column | Type | Description |
|---|---|---|
| `id` | `SERIAL` | Primary Key |
| `date` | `TIMESTAMP` | The date for which the KPIs are aggregated (unique). |
| `dau`, `wau`, `mau` | `INTEGER` | Daily, Weekly, and Monthly Active Users. |
| `newUsers` | `INTEGER` | Count of new users created on that day. |
| `activationRate` | `REAL` | Percentage of new users who completed onboarding. |
| `...` | `...` | All other KPIs as defined in the implementation plan. |

## 4. Event Tracking

All event tracking is handled server-side to ensure data integrity.

- **Event Names**: Defined in the `EventName` enum in `/lib/events.ts`.
- **Tracking Function**: The `trackEvent` function in `/server/lib/events.ts` is used to record events.

**To add a new event:**
1. Add the event name to the `EventName` enum.
2. Call `trackEvent` from the relevant tRPC procedure or API route.

```typescript
// Example from a tRPC mutation
import { trackEvent } from "@/server/lib/events";
import { EventName } from "@/lib/events";

await trackEvent({
  eventName: EventName.MEALPLAN_GENERATED,
  userId: ctx.user.id,
  properties: { mealCount: 10 },
});
```

## 5. KPI Aggregation Job

The aggregation logic resides in `/server/jobs/aggregateKpis.ts`. It is executed daily via a Vercel Cron job defined in `vercel.json`.

- **Schedule**: Runs daily at 01:00 UTC.
- **Endpoint**: `/api/cron/aggregate-kpis`
- **Security**: The endpoint is protected by a `CRON_SECRET` environment variable.

To run the aggregation manually for a specific date, you can call the endpoint with a `date` parameter and the correct secret.

## 6. Admin API (tRPC)

The admin API is defined in `/server/trpc/routers/admin.ts`. All routes in this router are automatically protected by the `requireAdmin` middleware.

- **Middleware**: `requireAdmin` in `/server/trpc/middleware/requireAdmin.ts` checks if the user's email is in the `ADMIN_EMAILS` environment variable.
- **Endpoints**:
  - `getOverview(range)`: Fetches all KPIs for the dashboard cards.
  - `getTimeseries(kpiKey, range)`: Fetches data for a specific KPI chart (not yet used in UI).
  - `getTop(range, limit)`: Fetches the top errors.

## 7. Deployment Checklist

1.  **Environment Variables**: Ensure the following environment variables are set in your Vercel project:
    - `POSTGRES_URL`: The connection string for your Neon database.
    - `CRON_SECRET`: A strong, randomly generated secret for securing the cron endpoint.
    - `ADMIN_EMAILS`: A comma-separated list of emails for users who should have admin access (e.g., `test@example.com,admin@familyplate.ai`).

2.  **Database Migration**: The changes to the database schema must be applied. Since the project uses `drizzle-kit`, you should generate and run the migration.
    ```bash
    # 1. Generate the migration file
    pnpm db:generate

    # 2. Apply the migration to your production database
    # (Ensure your .env is pointing to the production DB)
    pnpm db:push
    ```

3.  **Merge & Deploy**: Merge the feature branch into your main deployment branch (`main` or `master`). Vercel will automatically trigger a new deployment.

4.  **Post-Deployment Verification**:
    - Log in as a user whose email is in `ADMIN_EMAILS`.
    - Navigate to `/admin` and verify the dashboard loads.
    - Log in as a non-admin user and ensure `/admin` redirects to the dashboard or login page.
    - Check the Vercel Functions log for the `/api/cron/aggregate-kpis` endpoint to confirm the cron job runs successfully at its scheduled time.
