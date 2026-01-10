// Environment variable validation and access

function getEnvVar(key: string, required: boolean = true): string | undefined {
  const value = process.env[key];
  
  if (required && !value) {
    console.warn(`[env] Missing required environment variable: ${key}`);
  }
  
  return value;
}

export const env = {
  // Database
  DATABASE_URL: getEnvVar("DATABASE_URL") || getEnvVar("POSTGRES_URL"),
  
  // Mailjet
  MAILJET_API_KEY: getEnvVar("MAILJET_API_KEY"),
  MAILJET_SECRET_KEY: getEnvVar("MAILJET_SECRET_KEY"),
  MAILJET_FROM_EMAIL: getEnvVar("MAILJET_FROM_EMAIL", false) || "noreply@familyplate.ai",
  MAILJET_FROM_NAME: getEnvVar("MAILJET_FROM_NAME", false) || "FamilyPlate",
  
  // OpenAI
  OPENAI_API_KEY: getEnvVar("OPENAI_API_KEY") || getEnvVar("EXPO_PUBLIC_OPENAI_API_KEY"),
  
  // JWT
  JWT_SECRET: getEnvVar("JWT_SECRET") || getEnvVar("BUILT_IN_FORGE_API_KEY"),
  
  // Frontend URL
  WEB_URL: getEnvVar("EXPO_PUBLIC_WEB_URL", false) || "http://localhost:3000",
  
  // Node environment
  NODE_ENV: process.env.NODE_ENV || "development",
  IS_PRODUCTION: process.env.NODE_ENV === "production",
};

// Validate critical env vars on startup
if (!env.DATABASE_URL) {
  console.error("[env] DATABASE_URL or POSTGRES_URL is required");
}

if (!env.JWT_SECRET) {
  console.error("[env] JWT_SECRET is required for session management");
}
