/**
 * MediaPreloader - Smart preloading system for slideshow media
 *
 * Features:
 * - Intelligent preloading based on connection speed
 * - Memory management for cached media
 * - Priority-based loading queue
 * - Cancel/cleanup mechanisms
 */

import {
  MediaType,
  OPTIMIZATION_SETTINGS,
  MEDIA_ERRORS,
  type MediaError,
} from '../constants/media-types';
import { MediaTypeDetector } from './media-type-detector';
import { MediaOptimizer } from './media-optimizer';

export interface PreloadItem {
  url: string;
  type: MediaType;
  priority: number;
  timestamp: number;
  size?: number;
}

export interface PreloadResult {
  url: string;
  success: boolean;
  loadTime: number;
  size?: number;
  error?: MediaError;
}

export interface PreloadOptions {
  maxConcurrent?: number;
  maxCacheSize?: number;
  timeout?: number;
  enableOptimization?: boolean;
  connectionSpeed?: 'slow' | 'medium' | 'fast';
}

export class MediaPreloader {
  private static instance: MediaPreloader | null = null;

  private preloadQueue: PreloadItem[] = [];
  private loadingItems = new Set<string>();
  private cache = new Map<string, HTMLImageElement | HTMLVideoElement>();
  private cacheSize = 0;
  private loadPromises = new Map<string, Promise<PreloadResult>>();

  private options: Required<PreloadOptions> = {
    maxConcurrent: 3,
    maxCacheSize: OPTIMIZATION_SETTINGS.MAX_CACHE_SIZE,
    timeout: OPTIMIZATION_SETTINGS.PRELOAD_TIMEOUT,
    enableOptimization: true,
    connectionSpeed: 'medium',
  };

  private constructor(options: PreloadOptions = {}) {
    this.options = { ...this.options, ...options };
    this.detectConnectionSpeed();
  }

  /**
   * Get singleton instance
   */
  static getInstance(options?: PreloadOptions): MediaPreloader {
    if (!MediaPreloader.instance) {
      MediaPreloader.instance = new MediaPreloader(options);
    }
    return MediaPreloader.instance;
  }

  /**
   * Add items to preload queue with priority
   */
  preload(urls: string[], priority: number = 1): Promise<PreloadResult[]> {
    const items: PreloadItem[] = urls.map((url) => {
      const detection = MediaTypeDetector.detect(url);
      return {
        url,
        type: detection.type,
        priority,
        timestamp: Date.now(),
      };
    });

    // Add to queue sorted by priority
    this.preloadQueue.push(...items);
    this.preloadQueue.sort((a, b) => b.priority - a.priority);

    // Start processing queue
    this.processQueue();

    // Return promises for all items
    return Promise.all(urls.map((url) => this.getLoadPromise(url)));
  }

  /**
   * Preload next items in slideshow sequence
   */
  preloadNext(
    currentIndex: number,
    items: any[],
    count: number = 3
  ): Promise<PreloadResult[]> {
    const nextUrls: string[] = [];

    for (let i = 1; i <= count; i++) {
      const nextIndex = (currentIndex + i) % items.length;
      const item = items[nextIndex];

      if (item?.url) {
        nextUrls.push(item.url);
      }
    }

    return this.preload(nextUrls, 2); // High priority for next items
  }

  /**
   * Check if media is already cached
   */
  isCached(url: string): boolean {
    return this.cache.has(url);
  }

  /**
   * Get cached media element
   */
  getCached(url: string): HTMLImageElement | HTMLVideoElement | null {
    return this.cache.get(url) || null;
  }

  /**
   * Clear cache and cancel all pending loads
   */
  clear(): void {
    // Cancel all pending loads
    this.loadingItems.clear();

    // Clear cache
    this.cache.clear();
    this.cacheSize = 0;

    // Clear queue
    this.preloadQueue = [];

    // Clear promises
    this.loadPromises.clear();
  }

  /**
   * Remove specific items from cache
   */
  evict(urls: string[]): void {
    urls.forEach((url) => {
      const cached = this.cache.get(url);
      if (cached) {
        this.cache.delete(url);
        // Estimate size reduction (rough calculation)
        this.cacheSize = Math.max(0, this.cacheSize - 1024 * 1024); // 1MB estimate
      }
    });
  }

  /**
   * Get current cache statistics
   */
  getCacheStats(): {
    itemCount: number;
    estimatedSize: number;
    hitRate: number;
  } {
    return {
      itemCount: this.cache.size,
      estimatedSize: this.cacheSize,
      hitRate: 0, // TODO: Implement hit rate tracking
    };
  }

  /**
   * Process preload queue
   */
  private async processQueue(): Promise<void> {
    while (
      this.preloadQueue.length > 0 &&
      this.loadingItems.size < this.options.maxConcurrent
    ) {
      const item = this.preloadQueue.shift();
      if (!item || this.isCached(item.url) || this.loadingItems.has(item.url)) {
        continue;
      }

      this.loadingItems.add(item.url);

      // Start loading
      const promise = this.loadMedia(item);
      this.loadPromises.set(item.url, promise);

      // Handle completion
      promise.finally(() => {
        this.loadingItems.delete(item.url);
        this.processQueue(); // Continue processing queue
      });
    }
  }

  /**
   * Load individual media item
   */
  private async loadMedia(item: PreloadItem): Promise<PreloadResult> {
    const startTime = Date.now();

    try {
      // Optimize URL if enabled
      let targetUrl = item.url;
      if (this.options.enableOptimization) {
        const optimized = MediaOptimizer.optimize(item.url, {
          isMobile: this.isMobileDevice(),
          connectionSpeed: this.options.connectionSpeed,
        });
        targetUrl = optimized.optimizedUrl;
      }

      const element = await this.createMediaElement(item.type, targetUrl);

      // Add to cache if not too large
      if (this.cacheSize < this.options.maxCacheSize) {
        this.cache.set(item.url, element);
        this.cacheSize += this.estimateElementSize(element);

        // Cleanup cache if needed
        this.cleanupCache();
      }

      const loadTime = Date.now() - startTime;

      return {
        url: item.url,
        success: true,
        loadTime,
        size: this.estimateElementSize(element),
      };
    } catch (error) {
      return {
        url: item.url,
        success: false,
        loadTime: Date.now() - startTime,
        error: this.categorizeError(error),
      };
    }
  }

  /**
   * Create media element for preloading
   */
  private createMediaElement(
    type: MediaType,
    url: string
  ): Promise<HTMLImageElement | HTMLVideoElement> {
    return new Promise((resolve, reject) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        reject(new Error('Timeout'));
      }, this.options.timeout);

      if (type === MediaType.VIDEO) {
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.preload = 'metadata';

        const handleLoad = () => {
          clearTimeout(timeoutId);
          video.removeEventListener('loadedmetadata', handleLoad);
          video.removeEventListener('error', handleError);
          resolve(video);
        };

        const handleError = () => {
          clearTimeout(timeoutId);
          video.removeEventListener('loadedmetadata', handleLoad);
          video.removeEventListener('error', handleError);
          reject(new Error('Video load failed'));
        };

        video.addEventListener('loadedmetadata', handleLoad);
        video.addEventListener('error', handleError);
        video.src = url;
      } else {
        // Handle images and GIFs
        const img = new Image();
        img.crossOrigin = 'anonymous';

        const handleLoad = () => {
          clearTimeout(timeoutId);
          img.removeEventListener('load', handleLoad);
          img.removeEventListener('error', handleError);
          resolve(img);
        };

        const handleError = () => {
          clearTimeout(timeoutId);
          img.removeEventListener('load', handleLoad);
          img.removeEventListener('error', handleError);
          reject(new Error('Image load failed'));
        };

        img.addEventListener('load', handleLoad);
        img.addEventListener('error', handleError);
        img.src = url;
      }
    });
  }

  /**
   * Get or create load promise for URL
   */
  private getLoadPromise(url: string): Promise<PreloadResult> {
    const existing = this.loadPromises.get(url);
    if (existing) {
      return existing;
    }

    // If already cached, return resolved promise
    if (this.isCached(url)) {
      return Promise.resolve({
        url,
        success: true,
        loadTime: 0,
      });
    }

    // Create new promise that will be resolved when item is processed
    return new Promise((resolve) => {
      const checkAndResolve = () => {
        const promise = this.loadPromises.get(url);
        if (promise) {
          promise.then(resolve);
        } else {
          setTimeout(checkAndResolve, 100);
        }
      };
      checkAndResolve();
    });
  }

  /**
   * Estimate memory size of cached element
   */
  private estimateElementSize(
    element: HTMLImageElement | HTMLVideoElement
  ): number {
    if (element instanceof HTMLImageElement) {
      return (element.naturalWidth || 800) * (element.naturalHeight || 600) * 4; // 4 bytes per pixel
    } else if (element instanceof HTMLVideoElement) {
      return (element.videoWidth || 1280) * (element.videoHeight || 720) * 4; // Estimate for video frame
    }
    return 1024 * 1024; // 1MB default estimate
  }

  /**
   * Cleanup cache when it gets too large
   */
  private cleanupCache(): void {
    if (this.cacheSize <= this.options.maxCacheSize) {
      return;
    }

    // Remove oldest items until under limit
    const entries = Array.from(this.cache.entries());

    // Sort by usage (for now, just remove random items)
    const toRemove = entries.slice(0, Math.ceil(entries.length * 0.3));

    toRemove.forEach(([url]) => {
      this.cache.delete(url);
    });

    // Recalculate cache size
    this.cacheSize = Array.from(this.cache.values()).reduce(
      (total, element) => total + this.estimateElementSize(element),
      0
    );
  }

  /**
   * Categorize loading errors
   */
  private categorizeError(error: any): MediaError {
    const message = error?.message?.toLowerCase() || '';

    if (message.includes('timeout')) {
      return MEDIA_ERRORS.TIMEOUT;
    }

    if (message.includes('network') || message.includes('fetch')) {
      return MEDIA_ERRORS.NETWORK_ERROR;
    }

    return MEDIA_ERRORS.LOAD_FAILED;
  }

  /**
   * Detect connection speed and update options
   */
  private detectConnectionSpeed(): void {
    this.options.connectionSpeed = MediaOptimizer.detectConnectionSpeed();

    // Adjust concurrent loading based on connection speed
    switch (this.options.connectionSpeed) {
      case 'slow':
        this.options.maxConcurrent = 1;
        break;
      case 'medium':
        this.options.maxConcurrent = 2;
        break;
      case 'fast':
        this.options.maxConcurrent = 4;
        break;
    }
  }

  /**
   * Check if running on mobile device
   */
  private isMobileDevice(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 768;
  }
}
