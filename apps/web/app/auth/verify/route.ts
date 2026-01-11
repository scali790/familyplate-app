import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/server/db/client";
import { magicLinkTokens, users, userPreferences } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { createSession } from "@/server/auth/sessionStore";
import { getSessionCookieOptions } from "@/server/auth/session";
import { validateRedirectUrl } from "@/server/auth/redirectValidation";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get("token");
  const redirectTo = searchParams.get("redirectTo");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  try {
    const db = await getDb();
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    // Verify token
    const result = await db
      .select()
      .from(magicLinkTokens)
      .where(eq(magicLinkTokens.token, token))
      .limit(1);

    const tokenData = result[0];

    if (!tokenData) {
      return NextResponse.redirect(new URL("/auth/error?message=invalid_token", request.url));
    }

    if (tokenData.used) {
      return NextResponse.redirect(new URL("/auth/error?message=token_used", request.url));
    }

    if (new Date() > tokenData.expiresAt) {
      return NextResponse.redirect(new URL("/auth/error?message=token_expired", request.url));
    }

    // Mark token as used
    await db
      .update(magicLinkTokens)
      .set({ used: true })
      .where(eq(magicLinkTokens.id, tokenData.id));

    // Create or get user
    const openId = `magic-${tokenData.email}`;

    await db
      .insert(users)
      .values({
        openId,
        email: tokenData.email,
        name: tokenData.name || tokenData.email.split("@")[0],
        loginMethod: "magic-link",
      })
      .onConflictDoUpdate({
        target: users.openId,
        set: {
          name: tokenData.name || tokenData.email.split("@")[0],
          lastSignedIn: new Date(),
        },
      });

    const userResult = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
    const user = userResult[0];

    if (!user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    // Create DB-backed session
    const sessionId = await createSession(user.id);

    // Set session cookie
    const cookieStore = await cookies();
    const cookieOptions = getSessionCookieOptions();
    
    cookieStore.set("fp_session", sessionId, cookieOptions);

    // Check if user has preferences
    const prefsResult = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id))
      .limit(1);

    const hasPreferences = prefsResult.length > 0;

    // Redirect to onboarding if no preferences, otherwise to dashboard
    const defaultRedirect = hasPreferences ? "/dashboard" : "/onboarding";
    const safeRedirectUrl = validateRedirectUrl(redirectTo, defaultRedirect);
    
    // Handle deep links
    if (safeRedirectUrl.startsWith("familyplate://")) {
      return NextResponse.redirect(safeRedirectUrl);
    }
    
    // Handle web redirects (relative paths)
    return NextResponse.redirect(new URL(safeRedirectUrl, request.url));
  } catch (error) {
    console.error("[auth/verify] Error:", error);
    return NextResponse.redirect(
      new URL("/auth/error?message=verification_failed", request.url)
    );
  }
}
