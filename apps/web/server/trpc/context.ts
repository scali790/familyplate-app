import { getUserFromSession } from "../auth/sessionStore";
import type { User } from "../db/schema";

const COOKIE_NAME = "fp_session";

/**
 * Extract session ID from Request cookies
 */
function getSessionFromRequest(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(";").map(c => c.trim());
  const sessionCookie = cookies.find(c => c.startsWith(`${COOKIE_NAME}=`));
  
  if (!sessionCookie) return null;
  
  return sessionCookie.split("=")[1] || null;
}

export async function createContext({ req }: { req: Request }) {
  const sessionId = getSessionFromRequest(req);
  
  // Extract base URL from request
  const host = req.headers.get("host") || "localhost:3000";
  const protocol = req.headers.get("x-forwarded-proto") || "http";
  const baseUrl = `${protocol}://${host}`;
  
  let user: User | null = null;
  
  if (sessionId) {
    try {
      user = await getUserFromSession(sessionId);
      if (user) {
        console.log(`[tRPC Context] User authenticated: ${user.email} (ID: ${user.id})`);
      }
    } catch (error) {
      console.error("[tRPC Context] Failed to get user from session:", error);
    }
  }
  
  return { user, baseUrl };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

// Context includes:
// - user: User | null (authenticated user)
// - baseUrl: string (e.g., "https://familyplate.vercel.app")
