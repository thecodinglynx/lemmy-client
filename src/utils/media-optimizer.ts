/**
 * MediaOptimizer - Generates optimized media URLs and handles responsive images
 *
 * Provides functionality for:
 * - Responsive image URL generation
 * - Pictrs service integration
 * - Mobile-specific optimizations
 * - Progressive loading strategies
 */

import { MediaType, OPTIMIZATION_SETTINGS } from '../constants/media-types';
import { MediaTypeDetector } from './media-type-detector';

export interface OptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: string;
  isMobile?: boolean;
  connectionSpeed?: 'slow' | 'medium' | 'fast';
  devicePixelRatio?: number;
}

export interface OptimizedMediaResult {
  originalUrl: string;
  optimizedUrl: string;
  fallbackUrl?: string;
  srcSet?: string[];
  sizes?: string;
  metadata: {
    type: MediaType;
    isPictrs: boolean;
    estimatedSize?: number;
    format: string;
    quality: number;
  };
}

export class MediaOptimizer {
  private static readonly PICTRS_BASE_PATTERN =
    /^(.+\/pictrs\/image\/)([^.]+)\.([^?]+)/;

  /**
   * Generate optimized media URLs with responsive variants
   */
  static optimize(
    url: string,
    options: OptimizationOptions = {}
  ): OptimizedMediaResult {
    const detection = MediaTypeDetector.detect(url);

    const {
      width = this.getDefaultWidth(options.isMobile),
      height,
      quality = this.getDefaultQuality(
        options.isMobile,
        options.connectionSpeed
      ),
      format = this.getOptimalFormat(detection.type, options.connectionSpeed),
      isMobile = false,
      devicePixelRatio = 1,
    } = options;

    // For Pictrs URLs, generate optimized variants
    if (detection.isPictrs) {
      return this.optimizePictrsUrl(url, {
        width,
        height: height || width, // Use width as fallback for height
        quality,
        format,
        isMobile,
        devicePixelRatio,
      });
    }

    // For non-Pictrs URLs, return with metadata
    return {
      originalUrl: url,
      optimizedUrl: url,
      metadata: {
        type: detection.type,
        isPictrs: false,
        format: format,
        quality: quality,
      },
    };
  }

  /**
   * Optimize Pictrs URLs with transformations
   */
  private static optimizePictrsUrl(
    url: string,
    options: Required<Omit<OptimizationOptions, 'connectionSpeed'>>
  ): OptimizedMediaResult {
    const { width, height, quality, format, isMobile, devicePixelRatio } =
      options;

    const match = url.match(this.PICTRS_BASE_PATTERN);
    if (!match) {
      // Fallback if pattern doesn't match
      return {
        originalUrl: url,
        optimizedUrl: url,
        metadata: {
          type: MediaType.IMAGE,
          isPictrs: true,
          format: format,
          quality: quality,
        },
      };
    }

    const [, baseUrl, imageId] = match;

    // Calculate optimal dimensions considering device pixel ratio
    const targetWidth = Math.round(width * devicePixelRatio);
    const targetHeight = height
      ? Math.round(height * devicePixelRatio)
      : undefined;

    // Generate main optimized URL
    const optimizedUrl = this.buildPictrsUrl(baseUrl, imageId, {
      format,
      width: targetWidth,
      height: targetHeight,
      quality,
    });

    // Generate responsive srcSet for different screen sizes
    const srcSet = this.generateSrcSet(baseUrl, imageId, {
      format,
      quality,
      baseWidth: width,
      devicePixelRatio,
      isMobile,
    });

    return {
      originalUrl: url,
      optimizedUrl,
      fallbackUrl: url, // Original URL as fallback
      srcSet,
      sizes: this.generateSizes(isMobile),
      metadata: {
        type: MediaType.IMAGE,
        isPictrs: true,
        format,
        quality,
        estimatedSize: this.estimateImageSize(
          targetWidth,
          targetHeight || targetWidth,
          format,
          quality
        ),
      },
    };
  }

  /**
   * Build Pictrs URL with transformations
   */
  private static buildPictrsUrl(
    baseUrl: string,
    imageId: string,
    params: {
      format: string;
      width: number;
      height?: number;
      quality: number;
    }
  ): string {
    const { format, width, height, quality } = params;

    let transformations = `format=${format}`;

    if (width) {
      transformations += `&width=${width}`;
    }

    if (height) {
      transformations += `&height=${height}`;
    }

    if (quality < 100) {
      transformations += `&quality=${quality}`;
    }

    return `${baseUrl}${imageId}.${format}?${transformations}`;
  }

  /**
   * Generate responsive srcSet for different screen densities
   */
  private static generateSrcSet(
    baseUrl: string,
    imageId: string,
    options: {
      format: string;
      quality: number;
      baseWidth: number;
      devicePixelRatio: number;
      isMobile: boolean;
    }
  ): string[] {
    const { format, quality, baseWidth, isMobile } = options;
    const srcSet: string[] = [];

    // Generate variants for different pixel densities
    const densities = isMobile ? [1, 2, 3] : [1, 1.5, 2];

    densities.forEach((density) => {
      const width = Math.round(baseWidth * density);
      const url = this.buildPictrsUrl(baseUrl, imageId, {
        format,
        width,
        quality: this.adjustQualityForDensity(quality, density),
      });

      srcSet.push(`${url} ${density}x`);
    });

    return srcSet;
  }

  /**
   * Generate sizes attribute for responsive images
   */
  private static generateSizes(isMobile: boolean): string {
    if (isMobile) {
      return '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';
    }

    return '(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw';
  }

  /**
   * Get default width based on device type
   */
  private static getDefaultWidth(isMobile: boolean = false): number {
    return isMobile ? OPTIMIZATION_SETTINGS.PIXEL6_WIDTH : 1920;
  }

  /**
   * Get default quality based on device and connection
   */
  private static getDefaultQuality(
    isMobile: boolean = false,
    connectionSpeed: 'slow' | 'medium' | 'fast' = 'medium'
  ): number {
    const baseQuality = isMobile
      ? OPTIMIZATION_SETTINGS.MOBILE_QUALITY
      : OPTIMIZATION_SETTINGS.DESKTOP_QUALITY;

    switch (connectionSpeed) {
      case 'slow':
        return Math.max(baseQuality - 20, 50);
      case 'fast':
        return Math.min(baseQuality + 10, 95);
      default:
        return baseQuality;
    }
  }

  /**
   * Get optimal format based on media type and connection
   */
  private static getOptimalFormat(
    mediaType: MediaType,
    connectionSpeed: 'slow' | 'medium' | 'fast' = 'medium'
  ): string {
    switch (mediaType) {
      case MediaType.IMAGE:
        if (connectionSpeed === 'slow') {
          return 'jpg'; // Better compression for slow connections
        }
        return MediaTypeDetector.getOptimalFormat(mediaType);

      case MediaType.GIF:
        return 'gif'; // Keep GIFs as GIFs

      case MediaType.VIDEO:
        return 'mp4';

      default:
        return 'jpg';
    }
  }

  /**
   * Adjust quality based on pixel density to balance file size
   */
  private static adjustQualityForDensity(
    baseQuality: number,
    density: number
  ): number {
    // Reduce quality slightly for higher density images to control file size
    const adjustment = Math.min((density - 1) * 5, 15);
    return Math.max(baseQuality - adjustment, 50);
  }

  /**
   * Estimate image file size for bandwidth planning
   */
  private static estimateImageSize(
    width: number,
    height: number = width,
    format: string,
    quality: number
  ): number {
    const pixels = width * height;

    // Rough estimates based on format and quality
    let bytesPerPixel: number;

    switch (format.toLowerCase()) {
      case 'jpg':
      case 'jpeg':
        bytesPerPixel = (quality / 100) * 0.3;
        break;
      case 'webp':
        bytesPerPixel = (quality / 100) * 0.2;
        break;
      case 'avif':
        bytesPerPixel = (quality / 100) * 0.15;
        break;
      case 'png':
        bytesPerPixel = 3; // Uncompressed estimate
        break;
      default:
        bytesPerPixel = 0.3;
    }

    return Math.round(pixels * bytesPerPixel);
  }

  /**
   * Generate video thumbnail URL from video URL
   */
  static generateVideoThumbnail(
    videoUrl: string,
    timeOffset: number = 1
  ): string {
    // For now, return a placeholder or try to generate from video service
    // This would need integration with a video processing service
    return videoUrl + `#t=${timeOffset}`;
  }

  /**
   * Check if optimization is worthwhile for given URL
   */
  static shouldOptimize(url: string, currentWidth?: number): boolean {
    const detection = MediaTypeDetector.detect(url);

    // Only optimize images and Pictrs URLs
    if (!detection.isPictrs || detection.type === MediaType.VIDEO) {
      return false;
    }

    // Don't optimize if the requested size is very small
    if (currentWidth && currentWidth < 200) {
      return false;
    }

    return true;
  }

  /**
   * Get pixel ratio for device optimization
   */
  static getDevicePixelRatio(): number {
    return typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  }

  /**
   * Detect connection speed based on navigator API
   */
  static detectConnectionSpeed(): 'slow' | 'medium' | 'fast' {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        const effectiveType = connection.effectiveType;

        switch (effectiveType) {
          case 'slow-2g':
          case '2g':
            return 'slow';
          case '3g':
            return 'medium';
          case '4g':
          default:
            return 'fast';
        }
      }
    }

    // Default to medium if detection not available
    return 'medium';
  }
}
