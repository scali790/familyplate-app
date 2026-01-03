import OpenAI from "openai";

interface UserPreferences {
  familySize: string;
  cuisines: string[];
  flavors: string[];
  restrictions: string;
}

interface Meal {
  day: string;
  title: string;
  description: string;
}

/**
 * OpenAI Service for Meal Plan Generation
 * 
 * To use this service, you need to:
 * 1. Get an OpenAI API key from https://platform.openai.com/api-keys
 * 2. Add it to your .env file as: EXPO_PUBLIC_OPENAI_API_KEY=your_key_here
 * 3. Make sure you have billing set up in your OpenAI account
 */

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || "",
  dangerouslyAllowBrowser: true, // Required for React Native
});

export async function generateMealPlan(preferences: UserPreferences): Promise<Meal[]> {
  const { familySize, cuisines, flavors, restrictions } = preferences;

  // Build the prompt
  const flavorText = flavors.length > 0 ? flavors.join(", ") : "balanced";
  const cuisineText = cuisines.join(", ");
  const restrictionsText = restrictions || "none";

  const prompt = `Generate a 7-day dinner meal plan for ${familySize} people, preferring ${cuisineText} cuisines, with ${flavorText} style, avoiding ${restrictionsText}. Keep suggestions simple and family-friendly.

Output strictly as a JSON array with this exact format:
[
  {
    "day": "Monday",
    "title": "Meal Name",
    "description": "Short info including key ingredients, prep time, and serves count"
  },
  ...
]

Make sure each meal:
- Has a clear, appetizing title
- Includes prep time in the description (e.g., "25 mins prep")
- Mentions key ingredients
- Specifies it serves ${familySize} people
- Is realistic and easy to prepare`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful meal planning assistant. Always respond with valid JSON arrays only, no additional text.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    // Parse the JSON response
    const meals = JSON.parse(content) as Meal[];

    // Validate the response
    if (!Array.isArray(meals) || meals.length !== 7) {
      throw new Error("Invalid meal plan format");
    }

    return meals;
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    
    if (error.message?.includes("API key")) {
      throw new Error("OpenAI API key is missing or invalid. Please add your API key in Settings.");
    }
    
    if (error.message?.includes("quota")) {
      throw new Error("OpenAI API quota exceeded. Please check your billing settings.");
    }

    throw new Error(error.message || "Failed to generate meal plan. Please try again.");
  }
}
