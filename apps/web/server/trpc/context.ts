import { getSessionFromCookies } from "../auth/session";
import { getUserFromSession } from "../auth/sessionStore";
import type { User } from "../db/schema";

export async function createContext() {
  const sessionId = await getSessionFromCookies();
  
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
  
  return { user };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
