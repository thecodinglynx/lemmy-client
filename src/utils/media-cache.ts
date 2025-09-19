/**
 * MediaCache - Intelligent caching system for media content
 *
 * Features:
 * - Multi-level caching (memory, IndexedDB)
 * - LRU eviction policy
 * - Storage quota management
 * - Cache statistics and monitoring
 */

import { OPTIMIZATION_SETTINGS, MediaType } from '../constants/media-types';

export interface CacheItem {
  url: string;
  type: MediaType;
  data: Blob | HTMLImageElement | HTMLVideoElement;
  size: number;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheStats {
  totalItems: number;
  totalSize: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  memoryUsage: number;
  diskUsage: number;
}

export interface CacheOptions {
  maxMemorySize?: number;
  maxDiskSize?: number;
  maxItems?: number;
  enablePersistent?: boolean;
  enableCompression?: boolean;
}

export class MediaCache {
  private static instance: MediaCache | null = null;

  private memoryCache = new Map<string, CacheItem>();
  private memoryCacheSize = 0;
  private dbCache: IDBDatabase | null = null;
  private dbReady = false;

  private stats: CacheStats = {
    totalItems: 0,
    totalSize: 0,
    hitCount: 0,
    missCount: 0,
    hitRate: 0,
    memoryUsage: 0,
    diskUsage: 0,
  };

  private options: Required<CacheOptions> = {
    maxMemorySize: OPTIMIZATION_SETTINGS.MAX_CACHE_SIZE,
    maxDiskSize: OPTIMIZATION_SETTINGS.MAX_CACHE_SIZE * 3, // 3x memory size
    maxItems: OPTIMIZATION_SETTINGS.MAX_CACHE_ITEMS,
    enablePersistent: true,
    enableCompression: false,
  };

  private constructor(options: CacheOptions = {}) {
    this.options = { ...this.options, ...options };

    if (this.options.enablePersistent) {
      this.initIndexedDB();
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(options?: CacheOptions): MediaCache {
    if (!MediaCache.instance) {
      MediaCache.instance = new MediaCache(options);
    }
    return MediaCache.instance;
  }

  /**
   * Store item in cache
   */
  async set(
    url: string,
    data: Blob | HTMLImageElement | HTMLVideoElement,
    type: MediaType
  ): Promise<boolean> {
    const size = this.calculateSize(data);
    const now = Date.now();

    const item: CacheItem = {
      url,
      type,
      data,
      size,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
    };

    // Store in memory cache
    await this.setInMemory(item);

    // Store in persistent cache if enabled and appropriate
    if (
      this.options.enablePersistent &&
      this.dbReady &&
      size < 10 * 1024 * 1024
    ) {
      await this.setInDB(item);
    }

    this.updateStats();
    return true;
  }

  /**
   * Get item from cache
   */
  async get(url: string): Promise<CacheItem | null> {
    // Try memory cache first
    const memoryItem = this.memoryCache.get(url);
    if (memoryItem) {
      memoryItem.accessCount++;
      memoryItem.lastAccessed = Date.now();
      this.stats.hitCount++;
      this.updateStats();
      return memoryItem;
    }

    // Try persistent cache
    if (this.options.enablePersistent && this.dbReady) {
      const dbItem = await this.getFromDB(url);
      if (dbItem) {
        // Move to memory cache for faster access
        await this.setInMemory(dbItem);
        this.stats.hitCount++;
        this.updateStats();
        return dbItem;
      }
    }

    this.stats.missCount++;
    this.updateStats();
    return null;
  }

  /**
   * Check if item exists in cache
   */
  async has(url: string): Promise<boolean> {
    if (this.memoryCache.has(url)) {
      return true;
    }

    if (this.options.enablePersistent && this.dbReady) {
      return await this.hasInDB(url);
    }

    return false;
  }

  /**
   * Remove item from cache
   */
  async delete(url: string): Promise<boolean> {
    const memoryItem = this.memoryCache.get(url);
    if (memoryItem) {
      this.memoryCache.delete(url);
      this.memoryCacheSize -= memoryItem.size;
    }

    if (this.options.enablePersistent && this.dbReady) {
      await this.deleteFromDB(url);
    }

    this.updateStats();
    return true;
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    this.memoryCacheSize = 0;

    if (this.options.enablePersistent && this.dbReady) {
      await this.clearDB();
    }

    this.resetStats();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Preload multiple URLs
   */
  async preload(urls: string[]): Promise<boolean[]> {
    const results = await Promise.allSettled(
      urls.map((url) => this.preloadSingle(url))
    );

    return results.map(
      (result) => result.status === 'fulfilled' && result.value
    );
  }

  /**
   * Store item in memory cache with LRU eviction
   */
  private async setInMemory(item: CacheItem): Promise<void> {
    // Check if we need to evict items
    while (
      this.memoryCacheSize + item.size > this.options.maxMemorySize ||
      this.memoryCache.size >= this.options.maxItems
    ) {
      await this.evictLRU();
    }

    // Remove existing item if present
    const existing = this.memoryCache.get(item.url);
    if (existing) {
      this.memoryCacheSize -= existing.size;
    }

    this.memoryCache.set(item.url, item);
    this.memoryCacheSize += item.size;
  }

  /**
   * Evict least recently used item from memory
   */
  private async evictLRU(): Promise<void> {
    if (this.memoryCache.size === 0) return;

    let oldestItem: CacheItem | null = null;
    let oldestUrl = '';

    for (const [url, item] of this.memoryCache) {
      if (!oldestItem || item.lastAccessed < oldestItem.lastAccessed) {
        oldestItem = item;
        oldestUrl = url;
      }
    }

    if (oldestUrl) {
      await this.delete(oldestUrl);
    }
  }

  /**
   * Calculate size of cached data
   */
  private calculateSize(
    data: Blob | HTMLImageElement | HTMLVideoElement
  ): number {
    if (data instanceof Blob) {
      return data.size;
    }

    if (data instanceof HTMLImageElement) {
      return (data.naturalWidth || 800) * (data.naturalHeight || 600) * 4;
    }

    if (data instanceof HTMLVideoElement) {
      return (data.videoWidth || 1280) * (data.videoHeight || 720) * 4;
    }

    return 1024 * 1024; // 1MB default
  }

  /**
   * Preload single URL
   */
  private async preloadSingle(url: string): Promise<boolean> {
    if (await this.has(url)) {
      return true; // Already cached
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const type = this.getTypeFromMime(blob.type);

      await this.set(url, blob, type);
      return true;
    } catch (error) {
      console.warn('Failed to preload:', url, error);
      return false;
    }
  }

  /**
   * Get media type from MIME type
   */
  private getTypeFromMime(mimeType: string): MediaType {
    if (mimeType.startsWith('image/gif')) {
      return MediaType.GIF;
    }
    if (mimeType.startsWith('image/')) {
      return MediaType.IMAGE;
    }
    if (mimeType.startsWith('video/')) {
      return MediaType.VIDEO;
    }
    return MediaType.UNKNOWN;
  }

  /**
   * Initialize IndexedDB for persistent storage
   */
  private async initIndexedDB(): Promise<void> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return;
    }

    return new Promise((resolve) => {
      const request = indexedDB.open('LemmyMediaCache', 1);

      request.onerror = () => {
        console.warn('Failed to open IndexedDB');
        resolve();
      };

      request.onsuccess = () => {
        this.dbCache = request.result;
        this.dbReady = true;
        resolve();
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('media')) {
          const store = db.createObjectStore('media', { keyPath: 'url' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('type', 'type');
        }
      };
    });
  }

  /**
   * Store item in IndexedDB
   */
  private async setInDB(item: CacheItem): Promise<void> {
    if (!this.dbCache) return;

    return new Promise((resolve) => {
      const transaction = this.dbCache!.transaction(['media'], 'readwrite');
      const store = transaction.objectStore('media');

      // Convert HTMLElement to blob for storage
      const storageItem = {
        ...item,
        data: item.data instanceof Blob ? item.data : null, // Only store blobs in IndexedDB
      };

      const request = store.put(storageItem);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.warn('Failed to store in IndexedDB:', request.error);
        resolve(); // Don't fail the entire operation
      };
    });
  }

  /**
   * Get item from IndexedDB
   */
  private async getFromDB(url: string): Promise<CacheItem | null> {
    if (!this.dbCache) return null;

    return new Promise((resolve) => {
      const transaction = this.dbCache!.transaction(['media'], 'readonly');
      const store = transaction.objectStore('media');
      const request = store.get(url);

      request.onsuccess = () => {
        const item = request.result;
        if (item && item.data) {
          item.lastAccessed = Date.now();
          item.accessCount++;
          resolve(item);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.warn('Failed to get from IndexedDB:', request.error);
        resolve(null);
      };
    });
  }

  /**
   * Check if item exists in IndexedDB
   */
  private async hasInDB(url: string): Promise<boolean> {
    const item = await this.getFromDB(url);
    return item !== null;
  }

  /**
   * Delete item from IndexedDB
   */
  private async deleteFromDB(url: string): Promise<void> {
    if (!this.dbCache) return;

    return new Promise((resolve) => {
      const transaction = this.dbCache!.transaction(['media'], 'readwrite');
      const store = transaction.objectStore('media');
      const request = store.delete(url);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.warn('Failed to delete from IndexedDB:', request.error);
        resolve();
      };
    });
  }

  /**
   * Clear all items from IndexedDB
   */
  private async clearDB(): Promise<void> {
    if (!this.dbCache) return;

    return new Promise((resolve) => {
      const transaction = this.dbCache!.transaction(['media'], 'readwrite');
      const store = transaction.objectStore('media');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.warn('Failed to clear IndexedDB:', request.error);
        resolve();
      };
    });
  }

  /**
   * Update cache statistics
   */
  private updateStats(): void {
    this.stats.totalItems = this.memoryCache.size;
    this.stats.memoryUsage = this.memoryCacheSize;
    this.stats.totalSize = this.memoryCacheSize;
    this.stats.hitRate =
      this.stats.hitCount / (this.stats.hitCount + this.stats.missCount) || 0;
  }

  /**
   * Reset cache statistics
   */
  private resetStats(): void {
    this.stats = {
      totalItems: 0,
      totalSize: 0,
      hitCount: 0,
      missCount: 0,
      hitRate: 0,
      memoryUsage: 0,
      diskUsage: 0,
    };
  }
}
