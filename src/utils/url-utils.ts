import { MEDIA_TYPE_PATTERNS } from '@constants';

/**
 * Utility functions for URL handling and validation
 */
export class URLUtils {
  /**
   * Validate if a URL is properly formatted
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate if a URL is an image
   */
  static isImageUrl(url: string): boolean {
    if (!this.isValidUrl(url)) return false;

    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();
      return MEDIA_TYPE_PATTERNS.IMAGE.test(pathname);
    } catch {
      return false;
    }
  }

  /**
   * Validate if a URL is a video
   */
  static isVideoUrl(url: string): boolean {
    if (!this.isValidUrl(url)) return false;

    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();
      return MEDIA_TYPE_PATTERNS.VIDEO.test(pathname);
    } catch {
      return false;
    }
  }

  /**
   * Validate if a URL is a GIF
   */
  static isGifUrl(url: string): boolean {
    if (!this.isValidUrl(url)) return false;

    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();
      return MEDIA_TYPE_PATTERNS.GIF.test(pathname);
    } catch {
      return false;
    }
  }

  /**
   * Check if URL is from Pictrs service
   */
  static isPictrsUrl(url: string): boolean {
    if (!this.isValidUrl(url)) return false;

    try {
      const urlObj = new URL(url);
      return urlObj.pathname.includes('/pictrs/image/');
    } catch {
      return false;
    }
  }

  /**
   * Generate Pictrs thumbnail URL
   */
  static generatePictrsThumbnail(
    url: string,
    format: 'webp' | 'jpg' = 'webp',
    size: number = 256
  ): string {
    if (!this.isPictrsUrl(url)) {
      return url;
    }

    try {
      const urlObj = new URL(url);
      // Remove existing query parameters
      urlObj.search = '';

      // Add thumbnail parameters
      urlObj.searchParams.set('thumbnail', size.toString());
      urlObj.searchParams.set('format', format);

      return urlObj.toString();
    } catch {
      return url;
    }
  }

  /**
   * Sanitize URL to prevent XSS attacks
   */
  static sanitizeUrl(url: string): string {
    if (!url) return '';

    // Remove potential javascript: and data: protocols
    const sanitized = url.replace(/^(javascript|data|vbscript):/i, '');

    // Ensure URL is properly formatted
    if (!this.isValidUrl(sanitized)) {
      return '';
    }

    return sanitized;
  }

  /**
   * Extract filename from URL
   */
  static getFilenameFromUrl(url: string): string {
    if (!this.isValidUrl(url)) return '';

    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop() || '';

      // Remove query parameters from filename
      return filename.split('?')[0];
    } catch {
      return '';
    }
  }

  /**
   * Get file extension from URL
   */
  static getFileExtension(url: string): string {
    const filename = this.getFilenameFromUrl(url);
    const parts = filename.split('.');

    return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
  }

  /**
   * Check if URL points to media content
   */
  static isMediaUrl(url: string): boolean {
    return this.isImageUrl(url) || this.isVideoUrl(url);
  }

  /**
   * Normalize URL by removing unnecessary parameters
   */
  static normalizeUrl(url: string): string {
    if (!this.isValidUrl(url)) return url;

    try {
      const urlObj = new URL(url);

      // Remove tracking parameters
      const trackingParams = [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_content',
        'utm_term',
        'fbclid',
        'gclid',
        'ref',
        'referrer',
      ];

      trackingParams.forEach((param) => {
        urlObj.searchParams.delete(param);
      });

      return urlObj.toString();
    } catch {
      return url;
    }
  }

  /**
   * Convert relative URL to absolute URL
   */
  static makeAbsolute(url: string, baseUrl: string): string {
    if (!url) return '';

    if (this.isValidUrl(url)) {
      return url; // Already absolute
    }

    try {
      return new URL(url, baseUrl).toString();
    } catch {
      return url;
    }
  }

  /**
   * Check if two URLs point to the same resource
   */
  static isSameUrl(url1: string, url2: string): boolean {
    if (!url1 || !url2) return false;

    try {
      const normalized1 = this.normalizeUrl(url1);
      const normalized2 = this.normalizeUrl(url2);
      return normalized1 === normalized2;
    } catch {
      return url1 === url2;
    }
  }

  /**
   * Extract domain from URL
   */
  static getDomain(url: string): string {
    if (!this.isValidUrl(url)) return '';

    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }

  /**
   * Check if URL is from a trusted domain
   */
  static isTrustedDomain(url: string): boolean {
    const trustedDomains = [
      'lemmy.world',
      'lemmy.ml',
      'beehaw.org',
      'sh.itjust.works',
      'lemmy.ca',
      'sopuli.xyz',
      'programming.dev',
      'feddit.de',
      'lemm.ee',
    ];

    const domain = this.getDomain(url);
    return trustedDomains.includes(domain) || domain.includes('.lemmy.');
  }

  /**
   * Generate a cache key from URL
   */
  static generateCacheKey(url: string): string {
    const normalized = this.normalizeUrl(url);

    // Simple hash function for cache key
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(36);
  }
}
