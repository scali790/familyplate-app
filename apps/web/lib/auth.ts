import { cookies } from 'next/headers';
import { getDb } from '@/server/db/client';
import { sessions, users } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export type CurrentUser = {
  id: number;
  email: string;
  name: string | null;
  openId: string;
  loginMethod: string;
};

/**
 * Get the current authenticated user from the session cookie.
 * Returns null if not authenticated.
 * 
 * Usage in Server Components:
 * ```tsx
 * const user = await getCurrentUser();
 * if (!user) redirect('/');
 * ```
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('fp_session')?.value;

    if (!sessionId) {
      return null;
    }

    const db = await getDb();
    if (!db) {
      return null;
    }

    // Get session from database
    const sessionResult = await db
      .select()
      .from(sessions)
      .where(eq(sessions.sessionId, sessionId))
      .limit(1);

    const session = sessionResult[0];

    if (!session) {
      return null;
    }

    // Check if session expired
    if (new Date() > session.expiresAt) {
      // Delete expired session
      await db.delete(sessions).where(eq(sessions.sessionId, sessionId));
      return null;
    }

    // Get user
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    const user = userResult[0];

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      openId: user.openId,
      loginMethod: user.loginMethod,
    };
  } catch (error) {
    console.error('[auth] Error getting current user:', error);
    return null;
  }
}

/**
 * Require authentication. Throws error if not authenticated.
 * Use in Server Components that require auth.
 * 
 * Usage:
 * ```tsx
 * const user = await requireAuth();
 * // user is guaranteed to be defined here
 * ```
 */
export async function requireAuth(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}
