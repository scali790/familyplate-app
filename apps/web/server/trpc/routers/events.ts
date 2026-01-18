import { protectedProcedure, router } from "../init";
import { z } from "zod";
import { trackEvent } from "@/server/lib/events";

export const eventsRouter = router({
  track: protectedProcedure
    .input(
      z.object({
        eventName: z.string(),
        properties: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await trackEvent({
        userId: ctx.user.id,
        eventName: input.eventName as any,
        properties: input.properties,
      });
      return { success: true };
    }),
});
