import { describe, it, expect } from "vitest";
import OpenAI from "openai";

describe("OpenAI API Configuration", () => {
  it("should validate OpenAI API key with a simple request", async () => {
    const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

    // Check that API key is present
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe("");
    expect(apiKey).toMatch(/^sk-/);

    // Try to initialize OpenAI client
    const openai = new OpenAI({
      apiKey,
    });

    // Make a minimal API call to validate the key
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: "Say hello",
        },
      ],
      max_tokens: 5,
    });

    // Validate response structure
    expect(response).toBeDefined();
    expect(response.choices).toBeDefined();
    expect(response.choices.length).toBeGreaterThan(0);
    expect(response.choices[0].message).toBeDefined();
    expect(response.choices[0].message.content).toBeDefined();
  }, 15000); // 15 second timeout for API call
});
