import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/server/db/client";
import { magicLinkTokens, users, userPreferences } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { createSession } from "@/server/auth/sessionStore";
import { getSessionCookieOptions } from "@/server/auth/session";
import { validateRedirectUrl } from "@/server/auth/redirectValidation";
import { trackEvent } from "@/server/lib/events";
import { EventName } from "@/lib/events";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get("token");
  // Support both 'redirectTo' (legacy) and 'next' (new from marketing site)
  const redirectTo = searchParams.get("redirectTo") || searchParams.get("next");

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

    let userResult = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
    let user = userResult[0];
    let isNewUser = false;

    if (user) {
      // User exists, update last sign-in time
      await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));
    } else {
      // User does not exist, create them
      isNewUser = true;
      const newUserResult = await db.insert(users).values({
        openId,
        email: tokenData.email,
        name: tokenData.name || tokenData.email.split("@")[0],
        loginMethod: "magic-link",
      }).returning();
      user = newUserResult[0];
    }

    if (!user) {
      return NextResponse.json({ error: "Failed to create or find user" }, { status: 500 });
    }

    // Track event if it's a new user
    if (isNewUser) {
      await trackEvent({
        eventName: EventName.USER_CREATED,
        userId: user.id,
        properties: {
          loginMethod: "magic-link",
          email: user.email,
        },
      });
    }

    if (!user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    // Create DB-backed session
    const sessionId = await createSession(user.id);

    // Set session cookie on NextResponse (required for Next.js 15 with redirects)
    const cookieOptions = getSessionCookieOptions();

    // Check if user has preferences
    const prefsResult = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id))
      .limit(1);

    const hasPreferences = prefsResult.length > 0;
    
    console.log('[auth/verify] Redirect decision:', {
      userId: user.id,
      email: user.email,
      hasPreferences,
      prefsCount: prefsResult.length,
      defaultRedirect: hasPreferences ? "/dashboard" : "/onboarding",
    });

    // Redirect to onboarding if no preferences, otherwise to dashboard
    const defaultRedirect = hasPreferences ? "/dashboard" : "/onboarding";
    const safeRedirectUrl = validateRedirectUrl(redirectTo, defaultRedirect);
    
    console.log('[auth/verify] Final redirect URL:', safeRedirectUrl);
    
    // Use HTML script redirect to ensure cookie is set before redirect
    // This avoids the browser limitation where cookies set in redirect responses
    // are not available in the redirect follow-up request
    
    // Handle deep links
    if (safeRedirectUrl.startsWith("familyplate://")) {
      const response = NextResponse.redirect(safeRedirectUrl);
      response.cookies.set("fp_session", sessionId, cookieOptions);
      return response;
    }
    
    // For web redirects, use HTML script redirect to ensure cookie availability
    const cookieString = `fp_session=${sessionId}; HttpOnly; Secure; SameSite=none; Path=/; Max-Age=${cookieOptions.maxAge}`;
    
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Redirecting...</title>
        </head>
        <body>
          <script>window.location.href = '${safeRedirectUrl}';</script>
          <noscript>
            <meta http-equiv="refresh" content="0;url=${safeRedirectUrl}">
            <p>Redirecting to <a href="${safeRedirectUrl}">${safeRedirectUrl}</a></p>
          </noscript>
        </body>
      </html>`,
      {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Set-Cookie": cookieString,
        },
      }
    );
  } catch (error) {
    console.error("[auth/verify] Error:", error);
    return NextResponse.redirect(
      new URL("/auth/error?message=verification_failed", request.url)
    );
  }
}
