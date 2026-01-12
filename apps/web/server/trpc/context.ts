import { getUserFromSession } from "../auth/sessionStore";
import type { User } from "../db/schema";

const COOKIE_NAME = "fp_session";

/**
 * Extract session ID from Request cookies
 */
function getSessionFromRequest(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie");
  
  console.log('[tRPC Context] Cookie header:', cookieHeader ? `${cookieHeader.substring(0, 100)}...` : 'null');
  
  if (!cookieHeader) {
    console.log('[tRPC Context] No cookie header found');
    return null;
  }
  
  const cookies = cookieHeader.split(";").map(c => c.trim());
  const sessionCookie = cookies.find(c => c.startsWith(`${COOKIE_NAME}=`));
  
  console.log('[tRPC Context] Looking for cookie:', COOKIE_NAME);
  console.log('[tRPC Context] Available cookies:', cookies.map(c => c.split('=')[0]).join(', '));
  
  if (!sessionCookie) {
    console.log('[tRPC Context] Session cookie not found');
    return null;
  }
  
  const sessionId = sessionCookie.split("=")[1] || null;
  console.log('[tRPC Context] Session ID found:', sessionId ? `${sessionId.substring(0, 16)}...` : 'null');
  
  return sessionId;
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
      } else {
        console.log('[tRPC Context] Session ID valid but no user found (expired or revoked)');
      }
    } catch (error) {
      console.error("[tRPC Context] Failed to get user from session:", error);
    }
  } else {
    console.log('[tRPC Context] No session ID extracted from request');
  }
  
  return { user, baseUrl };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

// Context includes:
// - user: User | null (authenticated user)
// - baseUrl: string (e.g., "https://familyplate.vercel.app")
