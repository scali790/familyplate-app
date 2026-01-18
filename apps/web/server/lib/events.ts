import { getDb } from "../db/client";
import { events } from "../db/schema";
import { EventName } from "@/lib/events";

/**
 * Track an event in the database
 * 
 * This function should be called from server-side code (tRPC procedures, API routes, etc.)
 * to record user actions and system events.
 */
export async function trackEvent({
  eventName,
  userId,
  properties,
}: {
  eventName: EventName;
  userId?: number;
  properties?: Record<string, any>;
}) {
  const db = await getDb();
  if (!db) {
    console.error("[trackEvent] Database not available");
    return;
  }

  try {
    await db.insert(events).values({
      eventName,
      userId: userId ?? null,
      properties: properties || {},
    });
  } catch (error) {
    console.error("[trackEvent] Failed to track event:", error);
  }
}
