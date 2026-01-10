// Wrapper for session management
// Re-exports session functions for backwards compatibility

export {
  getSessionFromCookies,
  setSessionCookie,
  clearSessionCookie,
  getSessionCookieOptions,
} from "../auth/session";

export {
  createSession,
  getUserFromSession,
  revokeSession,
} from "../auth/sessionStore";

// Note: Manus OAuth logic is preserved in server/manus/oauth.ts
// and will be re-integrated in Phase 2
