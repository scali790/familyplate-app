import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getDb } from '@/server/db/client';
import { users, sessions } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Admin Layout with Server-side Protection
 * 
 * This layout ensures that only authenticated admin users can access the admin dashboard.
 * 
 * Admin check is based on ADMIN_EMAILS environment variable.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get session cookie
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('fp_session')?.value;

  if (!sessionId) {
    redirect('/auth/login?redirectTo=/admin');
  }

  // Get user from session
  const db = await getDb();
  if (!db) {
    redirect('/auth/login?redirectTo=/admin');
  }

  const sessionResult = await db
    .select()
    .from(sessions)
    .where(eq(sessions.sessionId, sessionId))
    .limit(1);

  const session = sessionResult[0];

  if (!session || new Date() > session.expiresAt) {
    redirect('/auth/login?redirectTo=/admin');
  }

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  const user = userResult[0];

  if (!user) {
    redirect('/auth/login?redirectTo=/admin');
  }

  // Check if user is admin
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map((email) => email.trim()) || [];

  if (!adminEmails.includes(user.email)) {
    redirect('/dashboard'); // Redirect non-admin users to dashboard
  }

  return <>{children}</>;
}
