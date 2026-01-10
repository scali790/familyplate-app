import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/server/db/client";
import { magicLinkTokens, users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { sdk } from "@/server/services/sdk";

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

    // Create session token
    const sessionToken = await sdk.createSessionToken(openId, {
      name: user.name,
      expiresInMs: 365 * 24 * 60 * 60 * 1000, // 1 year
    });

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set("manus_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 365 * 24 * 60 * 60, // 1 year
      path: "/",
    });

    // Handle redirect
    if (redirectTo) {
      // Deep link support (e.g., familyplate://auth/verify)
      if (redirectTo.startsWith("familyplate://")) {
        return NextResponse.redirect(redirectTo);
      }
      // Web redirect
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }

    // Default redirect to dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (error) {
    console.error("[auth/verify] Error:", error);
    return NextResponse.redirect(
      new URL("/auth/error?message=verification_failed", request.url)
    );
  }
}
