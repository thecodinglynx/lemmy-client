// Utility functions for handling media URLs with CORS proxy

/**
 * Convert a media URL to use the local CORS proxy
 * This prevents OpaqueResponseBlocking errors when loading external media
 */
export function getProxiedMediaUrl(originalUrl: string): string {
  if (!originalUrl) return originalUrl;

  // If it's already a local URL, don't proxy it
  if (
    originalUrl.startsWith('/') ||
    originalUrl.includes('localhost') ||
    originalUrl.includes('127.0.0.1')
  ) {
    return originalUrl;
  }

  // Use our media proxy
  return `/api/media?url=${encodeURIComponent(originalUrl)}`;
}

/**
 * Check if a URL needs proxying (i.e., it's external)
 */
export function needsProxy(url: string): boolean {
  if (!url) return false;
  return (
    !url.startsWith('/') &&
    !url.includes('localhost') &&
    !url.includes('127.0.0.1')
  );
}
