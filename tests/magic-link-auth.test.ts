import { describe, it, expect, beforeAll } from "vitest";
import { randomBytes } from "crypto";

const API_URL = "http://127.0.0.1:3000";

describe("Magic Link Authentication", () => {
  const testEmail = `test-${randomBytes(4).toString("hex")}@example.com`;
  let magicLinkToken: string | null = null;

  it("should request a magic link successfully", async () => {
    const response = await fetch(`${API_URL}/api/trpc/auth.requestMagicLink`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        json: {
          email: testEmail,
          name: "Test User",
        },
      }),
    });

    const data = await response.json();
    console.log("Request magic link response:", JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      console.error("API Error:", data);
    }
    
    expect(response.ok).toBe(true);
    expect(data.result).toBeDefined();
    expect(data.result.data).toBeDefined();
    expect(data.result.data.json.success).toBe(true);
    expect(data.result.data.json.message).toContain("Magic link sent");
  });

  it("should verify a valid magic link token", async () => {
    // First, generate a token directly in the database for testing
    const { getDb } = await import("../server/db");
    const { magicLinkTokens } = await import("../drizzle/schema");
    
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a test token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    
    await db.insert(magicLinkTokens).values({
      token,
      email: testEmail,
      name: "Test User",
      expiresAt,
    });

    magicLinkToken = token;

    // Now verify the token via API
    const response = await fetch(`${API_URL}/api/trpc/auth.verifyMagicLink`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        json: {
          token,
        },
      }),
    });

    const data = await response.json();
    console.log("Verify magic link response:", JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      console.error("API Error:", data);
    }
    
    expect(response.ok).toBe(true);
    expect(data.result).toBeDefined();
    expect(data.result.data).toBeDefined();
    const result = data.result.data.json;
    expect(result.success).toBe(true);
    expect(result.sessionToken).toBeDefined();
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe(testEmail);
    expect(result.user.loginMethod).toBe("magic-link");
  });

  it("should reject an already-used magic link token", async () => {
    if (!magicLinkToken) {
      throw new Error("No token from previous test");
    }

    // Try to verify the same token again
    const response = await fetch(`${API_URL}/api/trpc/auth.verifyMagicLink`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        json: {
          token: magicLinkToken,
        },
      }),
    });

    const data = await response.json();
    console.log("Reuse token response:", JSON.stringify(data, null, 2));
    
    expect(response.ok).toBe(false);
    expect(data.error).toBeDefined();
    expect(data.error.json?.message || data.error.message).toContain("already been used");
  });

  it("should reject an expired magic link token", async () => {
    // Create an expired token
    const { getDb } = await import("../server/db");
    const { magicLinkTokens } = await import("../drizzle/schema");
    
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const expiredToken = randomBytes(32).toString("hex");
    const expiredAt = new Date(Date.now() - 1000); // Expired 1 second ago
    
    await db.insert(magicLinkTokens).values({
      token: expiredToken,
      email: testEmail,
      name: "Test User",
      expiresAt: expiredAt,
    });

    // Try to verify the expired token
    const response = await fetch(`${API_URL}/api/trpc/auth.verifyMagicLink`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        json: {
          token: expiredToken,
        },
      }),
    });

    const data = await response.json();
    console.log("Expired token response:", JSON.stringify(data, null, 2));
    
    expect(response.ok).toBe(false);
    expect(data.error).toBeDefined();
    expect(data.error.json?.message || data.error.message).toContain("expired");
  });

  it("should reject an invalid magic link token", async () => {
    const invalidToken = "invalid-token-12345";

    const response = await fetch(`${API_URL}/api/trpc/auth.verifyMagicLink`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        json: {
          token: invalidToken,
        },
      }),
    });

    const data = await response.json();
    console.log("Invalid token response:", JSON.stringify(data, null, 2));
    
    expect(response.ok).toBe(false);
    expect(data.error).toBeDefined();
    expect(data.error.json?.message || data.error.message).toContain("Invalid");
  });
});
