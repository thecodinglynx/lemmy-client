/**
 * MediaTypeDetector - Comprehensive media type detection and validation
 *
 * Handles detection of media types from URLs, MIME types, and file extensions.
 * Supports images, videos, GIFs, and Pictrs URL transformations.
 */

import {
  MediaType,
  SUPPORTED_IMAGE_EXTENSIONS,
  SUPPORTED_VIDEO_EXTENSIONS,
  SUPPORTED_GIF_EXTENSIONS,
  SUPPORTED_IMAGE_MIMES,
  SUPPORTED_VIDEO_MIMES,
  SUPPORTED_GIF_MIMES,
  MEDIA_ERRORS,
  type MediaError,
} from '../constants/media-types';

export interface MediaDetectionResult {
  type: MediaType;
  isValid: boolean;
  isPictrs: boolean;
  originalUrl: string;
  optimizedUrl?: string;
  error?: MediaError;
  metadata?: {
    extension?: string;
    mimeType?: string;
    isProbablyAnimated?: boolean;
    size?: number;
  };
}

export class MediaTypeDetector {
  private static readonly PICTRS_REGEX =
    /\/pictrs\/image\/[a-zA-Z0-9]+\.(jpg|jpeg|png|webp|gif)/i;
  private static readonly URL_EXTENSION_REGEX = /\.([a-zA-Z0-9]+)(?:\?.*)?$/i;

  /**
   * Detect media type from URL and optional MIME type
   */
  static detect(url: string, mimeType?: string): MediaDetectionResult {
    const result: MediaDetectionResult = {
      type: MediaType.UNKNOWN,
      isValid: false,
      isPictrs: false,
      originalUrl: url,
    };

    // Validate URL first
    if (!this.isValidUrl(url)) {
      result.error = MEDIA_ERRORS.INVALID_URL;
      return result;
    }

    // Check if it's a Pictrs URL
    result.isPictrs = this.isPictrsUrl(url);

    // Extract file extension from URL
    const extension = this.extractExtension(url);

    // Determine media type from MIME type (most reliable)
    if (mimeType) {
      result.type = this.getTypeFromMime(mimeType);
      result.metadata = {
        ...result.metadata,
        mimeType,
        extension: extension || undefined,
      };
    }

    // Fall back to extension detection if MIME type detection failed
    if (result.type === MediaType.UNKNOWN && extension) {
      result.type = this.getTypeFromExtension(extension);
      result.metadata = {
        ...result.metadata,
        extension: extension || undefined,
      };
    }

    // Special handling for GIFs
    if (result.type === MediaType.GIF) {
      result.metadata = {
        ...result.metadata,
        isProbablyAnimated: true,
      };
    }

    // Validate the detected type
    result.isValid = result.type !== MediaType.UNKNOWN;

    if (!result.isValid) {
      result.error = MEDIA_ERRORS.UNSUPPORTED_FORMAT;
    }

    return result;
  }

  /**
   * Detect media type from file extension
   */
  private static getTypeFromExtension(extension: string): MediaType {
    const ext = extension.toLowerCase();

    if (SUPPORTED_IMAGE_EXTENSIONS.includes(ext as any)) {
      return MediaType.IMAGE;
    }

    if (SUPPORTED_VIDEO_EXTENSIONS.includes(ext as any)) {
      return MediaType.VIDEO;
    }

    if (SUPPORTED_GIF_EXTENSIONS.includes(ext as any)) {
      return MediaType.GIF;
    }

    return MediaType.UNKNOWN;
  }

  /**
   * Detect media type from MIME type
   */
  private static getTypeFromMime(mimeType: string): MediaType {
    const mime = mimeType.toLowerCase();

    if (SUPPORTED_IMAGE_MIMES.includes(mime as any)) {
      return MediaType.IMAGE;
    }

    if (SUPPORTED_VIDEO_MIMES.includes(mime as any)) {
      return MediaType.VIDEO;
    }

    if (SUPPORTED_GIF_MIMES.includes(mime as any)) {
      return MediaType.GIF;
    }

    return MediaType.UNKNOWN;
  }

  /**
   * Extract file extension from URL
   */
  private static extractExtension(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const match = pathname.match(this.URL_EXTENSION_REGEX);
      return match ? `.${match[1].toLowerCase()}` : null;
    } catch {
      return null;
    }
  }

  /**
   * Check if URL is a Pictrs image service URL
   */
  static isPictrsUrl(url: string): boolean {
    return this.PICTRS_REGEX.test(url);
  }

  /**
   * Validate URL format
   */
  private static isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Get optimal media format based on browser support
   */
  static getOptimalFormat(originalType: MediaType): string {
    // Check browser support for modern formats
    const supportsWebP = this.supportsFormat('image/webp');
    const supportsAVIF = this.supportsFormat('image/avif');

    switch (originalType) {
      case MediaType.IMAGE:
        if (supportsAVIF) return 'avif';
        if (supportsWebP) return 'webp';
        return 'jpg';

      case MediaType.VIDEO:
        return 'mp4'; // MP4 has best compatibility

      case MediaType.GIF:
        return 'gif'; // Keep GIFs as GIFs for animation

      default:
        return 'jpg';
    }
  }

  /**
   * Check if browser supports a specific format
   */
  private static supportsFormat(mimeType: string): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;

    try {
      return canvas.toDataURL(mimeType).indexOf('data:' + mimeType) === 0;
    } catch {
      return false;
    }
  }

  /**
   * Analyze URL to determine if it's likely to be animated
   */
  static isLikelyAnimated(url: string): boolean {
    const result = this.detect(url);

    // GIFs are likely animated
    if (result.type === MediaType.GIF) {
      return true;
    }

    // Videos are animated by definition
    if (result.type === MediaType.VIDEO) {
      return true;
    }

    // Check for common animated image indicators in URL
    const animatedKeywords = ['animated', 'gif', 'video', 'motion'];
    const lowerUrl = url.toLowerCase();

    return animatedKeywords.some((keyword) => lowerUrl.includes(keyword));
  }

  /**
   * Get media metadata from headers (for advanced detection)
   */
  static async getMediaMetadata(
    url: string
  ): Promise<Partial<MediaDetectionResult>> {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';
      const contentLength = response.headers.get('content-length');

      const result = this.detect(url, contentType);

      return {
        ...result,
        metadata: {
          ...result.metadata,
          mimeType: contentType,
          size: contentLength ? parseInt(contentLength, 10) : undefined,
        },
      };
    } catch (error) {
      return {
        type: MediaType.UNKNOWN,
        isValid: false,
        isPictrs: false,
        originalUrl: url,
        error: MEDIA_ERRORS.NETWORK_ERROR,
      };
    }
  }
}
