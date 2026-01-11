import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDb } from '@/server/db/client';
import { sessions } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('fp_session')?.value;

    if (sessionId) {
      // Delete session from database
      const db = await getDb();
      if (db) {
        await db.delete(sessions).where(eq(sessions.sessionId, sessionId));
      }
    }

    // Clear session cookie
    cookieStore.delete('fp_session');

    // Redirect to landing page
    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error('[auth/logout] Error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}

// Also support GET for simple links
export async function GET(request: NextRequest) {
  return POST(request);
}
