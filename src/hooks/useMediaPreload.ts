import { useEffect, useRef } from 'react';
import type { SlideshowPost } from '../types';

interface UseImagePreloadOptions {
  /** Number of images to preload ahead */
  preloadCount?: number;
  /** Enable/disable preloading */
  enabled?: boolean;
}

/**
 * Hook for preloading images in the slideshow queue
 * Preloads the next N images to ensure smooth transitions
 */
export const useImagePreload = (
  posts: SlideshowPost[],
  currentIndex: number,
  options: UseImagePreloadOptions = {}
) => {
  const { preloadCount = 3, enabled = true } = options;
  const preloadedImagesRef = useRef<Set<string>>(new Set());
  const preloadQueueRef = useRef<HTMLImageElement[]>([]);

  useEffect(() => {
    if (!enabled || !posts.length) return;

    // Clean up previous preload queue
    preloadQueueRef.current.forEach((img) => {
      img.onload = null;
      img.onerror = null;
    });
    preloadQueueRef.current = [];

    // Calculate which images to preload
    const imagesToPreload: SlideshowPost[] = [];
    for (let i = 1; i <= preloadCount; i++) {
      const nextIndex = (currentIndex + i) % posts.length;
      const post = posts[nextIndex];

      if (
        post &&
        post.mediaType === 'image' &&
        !preloadedImagesRef.current.has(post.url)
      ) {
        imagesToPreload.push(post);
      }
    }

    // Preload images
    imagesToPreload.forEach((post) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        preloadedImagesRef.current.add(post.url);
        console.debug(`Preloaded image: ${post.title}`);
      };

      img.onerror = () => {
        console.warn(`Failed to preload image: ${post.title}`);
      };

      img.src = post.url;
      preloadQueueRef.current.push(img);
    });

    // Clean up old preloaded images from memory (keep last 10)
    if (preloadedImagesRef.current.size > 10) {
      const urlsArray = Array.from(preloadedImagesRef.current);
      const toDelete = urlsArray.slice(0, urlsArray.length - 10);
      toDelete.forEach((url) => preloadedImagesRef.current.delete(url));
    }
  }, [posts, currentIndex, preloadCount, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      preloadQueueRef.current.forEach((img) => {
        img.onload = null;
        img.onerror = null;
      });
      preloadQueueRef.current = [];
      preloadedImagesRef.current.clear();
    };
  }, []);

  return {
    preloadedImages: preloadedImagesRef.current,
    isPreloaded: (url: string) => preloadedImagesRef.current.has(url),
  };
};

/**
 * Hook for preloading video thumbnails and first frame
 */
export const useVideoPreload = (
  posts: SlideshowPost[],
  currentIndex: number,
  options: UseImagePreloadOptions = {}
) => {
  const { preloadCount = 2, enabled = true } = options;
  const preloadedVideosRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || !posts.length) return;

    // Calculate which videos to preload metadata for
    const videosToPreload: SlideshowPost[] = [];
    for (let i = 1; i <= preloadCount; i++) {
      const nextIndex = (currentIndex + i) % posts.length;
      const post = posts[nextIndex];

      if (
        post &&
        post.mediaType === 'video' &&
        !preloadedVideosRef.current.has(post.url)
      ) {
        videosToPreload.push(post);
      }
    }

    // Preload video metadata
    videosToPreload.forEach((post) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        preloadedVideosRef.current.add(post.url);
        console.debug(`Preloaded video metadata: ${post.title}`);
      };

      video.onerror = () => {
        console.warn(`Failed to preload video: ${post.title}`);
      };

      video.src = post.url;
    });

    // Clean up old preloaded videos from memory
    if (preloadedVideosRef.current.size > 5) {
      const urlsArray = Array.from(preloadedVideosRef.current);
      const toDelete = urlsArray.slice(0, urlsArray.length - 5);
      toDelete.forEach((url) => preloadedVideosRef.current.delete(url));
    }
  }, [posts, currentIndex, preloadCount, enabled]);

  return {
    preloadedVideos: preloadedVideosRef.current,
    isVideoPreloaded: (url: string) => preloadedVideosRef.current.has(url),
  };
};
