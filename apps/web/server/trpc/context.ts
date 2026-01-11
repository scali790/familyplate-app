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
  
  // Base URL priority: ENV → VERCEL_URL → headers → throw
  let baseUrl: string;
  
  if (process.env.NEXT_PUBLIC_APP_URL) {
    baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  } else if (process.env.APP_URL) {
    baseUrl = process.env.APP_URL;
  } else if (process.env.VERCEL_URL) {
    baseUrl = `https://${process.env.VERCEL_URL}`;
  } else {
    const host = req.headers.get("host");
    if (!host) {
      throw new Error('Cannot determine base URL: No NEXT_PUBLIC_APP_URL, APP_URL, VERCEL_URL, or host header found');
    }
    const protocol = req.headers.get("x-forwarded-proto") || "https";
    baseUrl = `${protocol}://${host}`;
  }
  
  console.log('[tRPC Context] Base URL:', baseUrl, {
    source: process.env.NEXT_PUBLIC_APP_URL ? 'NEXT_PUBLIC_APP_URL' 
      : process.env.APP_URL ? 'APP_URL'
      : process.env.VERCEL_URL ? 'VERCEL_URL'
      : 'headers'
  });
  
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
