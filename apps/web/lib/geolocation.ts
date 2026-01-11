/**
 * Geolocation utility for detecting user's country
 */

export interface GeolocationResult {
  countryCode: string | null;
  countryName: string | null;
  error?: string;
}

/**
 * Detect user's country using IP geolocation
 * Falls back to browser locale if API fails
 */
export async function detectUserCountry(): Promise<GeolocationResult> {
  try {
    // Try ipapi.co (free, no API key required)
    const response = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.country_code) {
      return {
        countryCode: data.country_code.toLowerCase(),
        countryName: data.country_name || null,
      };
    }

    throw new Error('No country code in response');
  } catch (error) {
    console.warn('[geolocation] IP detection failed, falling back to browser locale:', error);

    // Fallback: Use browser locale
    try {
      const locale = navigator.language || (navigator as any).userLanguage;
      const parts = locale.split('-');

      if (parts.length === 2) {
        return {
          countryCode: parts[1].toLowerCase(),
          countryName: null,
          error: 'Detected from browser locale (fallback)',
        };
      }
    } catch (localeError) {
      console.warn('[geolocation] Browser locale detection failed:', localeError);
    }

    return {
      countryCode: null,
      countryName: null,
      error: 'Could not detect country',
    };
  }
}

/**
 * Get country flag emoji from country code
 */
export function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌍';

  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));

  return String.fromCodePoint(...codePoints);
}
