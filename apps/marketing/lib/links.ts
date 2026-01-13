/**
 * Centralized link management for marketing website
 * All external links (especially to the web app) are defined here
 */

// Base URL for the web app (staging or production)
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://staging.familyplate.ai';

/**
 * Get the auth URL with optional return path
 * @param returnPath - Optional path to return to after login (e.g., '/dashboard', '/meal-plan')
 * @returns Full auth URL with encoded next parameter
 */
export function getAuthUrl(returnPath?: string): string {
  const authUrl = new URL('/auth', APP_BASE_URL);
  
  if (returnPath) {
    // Use relative path for 'next' parameter (not absolute URL)
    // This ensures the redirect stays on staging.familyplate.ai
    authUrl.searchParams.set('next', returnPath);
  }
  
  return authUrl.toString();
}

/**
 * Get the dashboard URL
 */
export function getDashboardUrl(): string {
  return new URL('/dashboard', APP_BASE_URL).toString();
}

/**
 * Get the feedback URL
 */
export function getFeedbackUrl(): string {
  return new URL('/feedback', APP_BASE_URL).toString();
}

/**
 * Common CTA links used across the marketing site
 */
export const LINKS = {
  // Primary CTA: Get started with auth
  getStarted: getAuthUrl('/dashboard'),
  
  // Secondary CTAs
  login: getAuthUrl(),
  dashboard: getDashboardUrl(),
  feedback: getFeedbackUrl(),
  
  // Social/External
  github: 'https://github.com/scali790/familyplate-app',
  
  // Internal marketing pages
  about: '/about',
  contact: '/contact',
  privacy: '/privacy',
  terms: '/terms',
  blog: '/blog',
} as const;
