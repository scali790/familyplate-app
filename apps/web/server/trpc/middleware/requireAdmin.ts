import { TRPCError } from "@trpc/server";
import { middleware } from "../init";

/**
 * Admin Middleware
 * 
 * Ensures that the user is authenticated and has admin privileges.
 * 
 * For now, we'll use a simple check: user email must be in ADMIN_EMAILS env var.
 * In the future, this can be extended to use a proper role-based system.
 */
export const requireAdmin = middleware(async ({ ctx, next }) => {
  // Check if user is authenticated
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  // Check if user is admin
  const adminEmails = process.env.ADMIN_EMAILS?.split(",").map((email) => email.trim()) || [];

  if (!adminEmails.includes(ctx.user.email)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to access this resource",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // Ensure user is available in the next middleware/procedure
    },
  });
});
