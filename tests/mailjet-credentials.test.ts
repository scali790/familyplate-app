import { describe, it, expect } from "vitest";

const API_URL = "http://127.0.0.1:3000";

describe("Mailjet Credentials Validation", () => {
  it("should send a test magic link email via Mailjet", async () => {
    // Use a test email address
    const testEmail = "test@example.com";
    
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
    console.log("Magic link request response:", JSON.stringify(data, null, 2));
    
    // If Mailjet credentials are invalid, the API will return an error
    if (!response.ok) {
      console.error("API Error:", data);
      if (data.error?.json?.message?.includes("Mailjet")) {
        throw new Error("Mailjet credentials are invalid. Please check your API Key and Secret Key.");
      }
      throw new Error(`API request failed: ${data.error?.json?.message || "Unknown error"}`);
    }
    
    expect(response.ok).toBe(true);
    expect(data.result).toBeDefined();
    expect(data.result.data).toBeDefined();
    expect(data.result.data.json.success).toBe(true);
    expect(data.result.data.json.message).toContain("Magic link sent");
    
    console.log("✅ Mailjet credentials are valid! Email sent successfully.");
  }, 30000); // 30 second timeout for email sending
});
