// Shared constants

export const COOKIE_NAME = "manus_session";

export const SESSION_EXPIRY_MS = 365 * 24 * 60 * 60 * 1000; // 1 year

export const MAGIC_LINK_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

export const ERROR_MESSAGES = {
  UNAUTHORIZED: "Please login (10001)",
  DATABASE_UNAVAILABLE: "Database not available",
  PREFERENCES_REQUIRED: "Please complete onboarding first",
  INVALID_TOKEN: "Invalid or expired magic link",
  TOKEN_USED: "This magic link has already been used",
  TOKEN_EXPIRED: "This magic link has expired",
} as const;
