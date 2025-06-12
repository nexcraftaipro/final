/**
 * Authentication utility functions
 */

/**
 * Get the appropriate redirect URL for OAuth authentication
 * This function handles both localhost and production domains
 */
export function getOAuthRedirectUrl(): string {
  // Get the current domain
  const currentDomain = window.location.origin;
  
  // List of allowed custom domains (add all your production domains here)
  const allowedDomains = [
    'https://csvgenpro.netlify.app',
    'https://pixcraftai.com',
    'https://www.pixcraftai.com'
  ];
  
  // Check if current domain is localhost or an allowed domain
  const isLocalhost = currentDomain.includes('localhost') || currentDomain.includes('127.0.0.1');
  const isAllowedDomain = allowedDomains.some(domain => currentDomain.includes(domain));
  
  // For localhost or allowed domains, use the current domain
  // Otherwise, use the first allowed domain as fallback
  const baseUrl = (isLocalhost || isAllowedDomain) ? currentDomain : allowedDomains[0];
  
  return `${baseUrl}/auth/callback`;
}

/**
 * Check if the current URL is a valid OAuth callback URL
 */
export function isValidCallbackUrl(): boolean {
  const currentUrl = window.location.href;
  return currentUrl.includes('/auth/callback');
}

/**
 * Extract OAuth tokens from URL if present
 */
export function extractOAuthTokensFromUrl(): Record<string, string> | null {
  const params = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  
  if (accessToken && refreshToken) {
    return {
      accessToken,
      refreshToken
    };
  }
  
  return null;
} 