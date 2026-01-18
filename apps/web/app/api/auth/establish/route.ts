import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/establish
 * 
 * Sets the fp_session cookie with the provided sessionId.
 * This endpoint is called by the auth bridge to establish the session cookie
 * in the browser after Magic Link verification.
 * 
 * CRITICAL: This endpoint must NOT redirect. It only sets the cookie and returns JSON.
 * The client (auth/bridge) handles the redirect after receiving the response.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { ok: false, error: "Missing sessionId" },
        { status: 400 }
      );
    }

    console.log("[AUTH_ESTABLISH] Setting cookie for sessionId:", sessionId);

    // Create response with cookie
    const response = NextResponse.json({ ok: true });

    // Set fp_session cookie
    response.cookies.set("fp_session", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    console.log("[AUTH_ESTABLISH] Cookie set successfully");

    return response;
  } catch (error) {
    console.error("[AUTH_ESTABLISH] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Only allow POST
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}
