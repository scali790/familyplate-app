import { db } from "../db";
import { events } from "@/drizzle/schema-admin";

interface TrackEventArgs {
  userId?: string;
  familyId?: string;
  eventName: string;
  properties?: Record<string, any>;
  env?: string;
}

export const trackEvent = async (args: TrackEventArgs) => {
  try {
    await db.insert(events).values({
      userId: args.userId,
      familyId: args.familyId,
      eventName: args.eventName,
      properties: args.properties,
      env: args.env || process.env.NODE_ENV,
    });
  } catch (error) {
    console.error("Failed to track event:", error);
    // In a production environment, you might want to log this to a dedicated error tracking service
  }
};
