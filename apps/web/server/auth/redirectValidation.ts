/**
 * Validate redirect URL to prevent open redirect attacks
 * 
 * Allowed:
 * - Relative paths starting with "/" (e.g., "/dashboard", "/profile")
 * - Deep links starting with "familyplate://" (e.g., "familyplate://auth/success")
 * 
 * Blocked:
 * - Absolute URLs (e.g., "https://evil.com")
 * - Protocol-relative URLs (e.g., "//evil.com")
 * - JavaScript URLs (e.g., "javascript:alert(1)")
 * 
 * @param redirectTo - The redirect URL to validate
 * @param fallback - Fallback URL if validation fails (default: "/dashboard")
 * @returns Safe redirect URL
 */
export function validateRedirectUrl(
  redirectTo: string | null | undefined,
  fallback: string = "/dashboard"
): string {
  // No redirect specified
  if (!redirectTo || typeof redirectTo !== "string") {
    return fallback;
  }

  const trimmed = redirectTo.trim();

  // Empty string
  if (trimmed.length === 0) {
    return fallback;
  }

  // Allow relative paths starting with "/"
  if (trimmed.startsWith("/")) {
    // Block protocol-relative URLs like "//evil.com"
    if (trimmed.startsWith("//")) {
      console.warn(`[redirect] Blocked protocol-relative URL: ${trimmed}`);
      return fallback;
    }
    return trimmed;
  }

  // Allow deep links starting with "familyplate://"
  if (trimmed.startsWith("familyplate://")) {
    return trimmed;
  }

  // Block everything else (absolute URLs, javascript:, data:, etc.)
  console.warn(`[redirect] Blocked unsafe redirect: ${trimmed}`);
  return fallback;
}
