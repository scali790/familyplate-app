import { describe, it, expect } from "vitest";

describe("Magic Link URL Configuration", () => {
  it("should have EXPO_PUBLIC_WEB_URL environment variable set", () => {
    const webUrl = process.env.EXPO_PUBLIC_WEB_URL;
    
    expect(webUrl).toBeDefined();
    expect(webUrl).toMatch(/^https:\/\//);
    expect(webUrl).toContain("manus.computer");
    
    console.log("✅ EXPO_PUBLIC_WEB_URL is set to:", webUrl);
  });

  it("should generate correct magic link URL format", () => {
    const webUrl = process.env.EXPO_PUBLIC_WEB_URL;
    const token = "test-token-123";
    const magicLink = `${webUrl}/auth/verify?token=${token}`;
    
    expect(magicLink).toMatch(/^https:\/\/.*\/auth\/verify\?token=test-token-123$/);
    expect(magicLink).not.toContain("c66dmgpz3i-qdu5dato2a-uk.a.run.app");
    
    console.log("✅ Generated magic link:", magicLink);
  });
});
