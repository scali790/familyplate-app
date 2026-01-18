import { NextRequest, NextResponse } from "next/server";
import { aggregateKpisYesterday } from "@/server/jobs/aggregateKpis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cron endpoint for daily KPI aggregation
 * 
 * This endpoint should be called daily by Vercel Cron or an external scheduler.
 * 
 * Security: Protected by Vercel Cron Secret (CRON_SECRET environment variable)
 * 
 * Vercel Cron Configuration (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/aggregate-kpis",
 *     "schedule": "0 1 * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (if configured)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret) {
      if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        console.error("[cron/aggregate-kpis] Unauthorized: Invalid or missing cron secret");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else {
      console.warn("[cron/aggregate-kpis] CRON_SECRET not configured, skipping auth check");
    }

    console.log("[cron/aggregate-kpis] Starting KPI aggregation...");

    const result = await aggregateKpisYesterday();

    console.log("[cron/aggregate-kpis] KPI aggregation completed successfully");

    return NextResponse.json({
      success: true,
      message: "KPI aggregation completed",
      data: result,
    });
  } catch (error: any) {
    console.error("[cron/aggregate-kpis] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
