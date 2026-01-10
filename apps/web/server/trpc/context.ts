import { cookies } from "next/headers";
import { sdk } from "../services/sdk";

export interface User {
  id: number;
  openId: string;
  name: string;
  email: string;
}

export async function createContext() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("manus_session");
  
  let user: User | null = null;
  
  if (sessionCookie?.value) {
    try {
      const payload = await sdk.verifySessionToken(sessionCookie.value);
      if (payload?.openId) {
        // Get user from database
        const { getDb } = await import("../db/client");
        const { users } = await import("../db/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (db) {
          const result = await db.select().from(users).where(eq(users.openId, payload.openId)).limit(1);
          if (result[0]) {
            user = {
              id: result[0].id,
              openId: result[0].openId,
              name: result[0].name,
              email: result[0].email,
            };
          }
        }
      }
    } catch (error) {
      console.error("[context] Failed to verify session:", error);
    }
  }
  
  return { user };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
