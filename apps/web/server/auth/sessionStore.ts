import { getDb } from "../db/client";
import { sessions, users, type User } from "../db/schema";
import { eq, and, gt, isNull, sql } from "drizzle-orm";
import { randomBytes } from "crypto";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Create a new session for a user
 */
export async function createSession(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const sessionId = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.insert(sessions).values({
    sessionId,
    userId,
    expiresAt,
  });

  return sessionId;
}

/**
 * Get user from session ID
 */
export async function getUserFromSession(sessionId: string): Promise<User | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select({
      user: users,
      session: sessions,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.sessionId, sessionId),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, sql`NOW()`)
      )
    )
    .limit(1);

  if (!result[0]) return null;

  return result[0].user;
}

/**
 * Revoke a session
 */
export async function revokeSession(sessionId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(eq(sessions.sessionId, sessionId));
}

/**
 * Clean up expired sessions (can be called periodically)
 */
export async function cleanupExpiredSessions(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Delete sessions that expired more than 7 days ago
  const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  await db
    .delete(sessions)
    .where(
      sql`${sessions.expiresAt} < NOW() - INTERVAL '7 days'`
    );
}
