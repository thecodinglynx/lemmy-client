import { useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@stores/app-store';
import type { SlideshowPost } from '@types';
import { MediaType } from '@types';

// Hook for slideshow functionality
export function useSlideshow() {
  const {
    slideshow,
    play,
    pause,
    next,
    previous,
    goToIndex,
    resetSlideshow,
    setPosts,
    setTiming,
    toggleAutoAdvance,
    togglePlay,
  } = useAppStore();

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const navLockRef = useRef(false);

  // Defensive check for slideshow.posts
  const posts = slideshow.posts || [];
  const currentPost = posts[slideshow.currentIndex];

  // Auto-advance logic
  useEffect(() => {
    if (!slideshow.isPlaying || !slideshow.autoAdvance || posts.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const getCurrentTimingMs = () => {
      if (!currentPost) return slideshow.timing.images * 1000;

      switch (currentPost.mediaType) {
        case MediaType.VIDEO:
          return slideshow.timing.videos === 0
            ? 0 // play full duration; advance on onEnded
            : slideshow.timing.videos * 1000;
        case MediaType.GIF:
          return slideshow.timing.gifs * 1000;
        case MediaType.IMAGE:
        default:
          return slideshow.timing.images * 1000;
      }
    };

    const timing = getCurrentTimingMs();

    if (timing > 0) {
      intervalRef.current = setInterval(() => {
        next();
      }, timing);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    slideshow.isPlaying,
    slideshow.autoAdvance,
    slideshow.currentIndex,
    slideshow.timing,
    posts.length,
    currentPost,
    next,
  ]);

  // Wrap next/previous with a short re-entrancy guard
  const guardedNext = useCallback(() => {
    if (navLockRef.current) return;
    navLockRef.current = true;
    try {
      next();
    } finally {
      setTimeout(() => (navLockRef.current = false), 50);
    }
  }, [next]);

  const guardedPrevious = useCallback(() => {
    if (navLockRef.current) return;
    navLockRef.current = true;
    try {
      previous();
    } finally {
      setTimeout(() => (navLockRef.current = false), 50);
    }
  }, [previous]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const { settings } = useAppStore.getState();
      const shortcuts = settings.controls.keyboardShortcuts;

      switch (event.key) {
        case shortcuts.PLAY_PAUSE:
          event.preventDefault();
          togglePlay();
          break;
        case shortcuts.NEXT:
          event.preventDefault();
          next();
          break;
        case shortcuts.PREVIOUS:
          event.preventDefault();
          previous();
          break;
        case shortcuts.FULLSCREEN:
          event.preventDefault();
          toggleFullscreen();
          break;
        case shortcuts.STAR:
          event.preventDefault();
          if (currentPost) {
            toggleStar(currentPost.id);
          }
          break;
        case shortcuts.ESCAPE:
          event.preventDefault();
          if (slideshow.isPlaying) {
            pause();
          }
          break;
        default:
          // Handle timing presets (1-8)
          if (event.key >= '1' && event.key <= '8') {
            const timing = settings.controls.timingPresets?.[event.key];
            if (timing) {
              setTiming('images', timing);
              setTiming('gifs', timing);
            }
          }
          break;
      }
    },
    [currentPost, next, previous, pause, togglePlay, setTiming]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Fullscreen handling
  const toggleFullscreen = useCallback(async () => {
    const { setFullscreen } = useAppStore.getState();

    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
        setFullscreen(true);
      } catch (error) {
        console.warn('Failed to enter fullscreen:', error);
      }
    } else {
      try {
        await document.exitFullscreen();
        setFullscreen(false);
      } catch (error) {
        console.warn('Failed to exit fullscreen:', error);
      }
    }
  }, []);

  // Star/unstar posts
  const toggleStar = useCallback((postId: string) => {
    const state = useAppStore.getState();
    const post = state.slideshow.posts.find((p) => p.id === postId);
    if (!post) return;
    state.toggleLike(post);
    // Reflect liked state in slideshow.posts visually by marking starred
    const liked = !!state.content.likedPosts?.[postId];
    const updated = state.slideshow.posts.map((p) =>
      p.id === postId ? { ...p, starred: liked } : p
    );
    state.setPosts(updated);
  }, []);

  // Load starred status for posts
  const loadStarredStatus = useCallback((posts: SlideshowPost[]) => {
    const { content } = useAppStore.getState();
    const likedMap = content.likedPosts || {};
    return posts.map((post) => ({
      ...post,
      starred: !!likedMap[post.id],
    }));
  }, []);

  // Media preloading
  const preloadMedia = useCallback((post: SlideshowPost) => {
    if (post.mediaType === MediaType.IMAGE) {
      const img = new Image();
      img.src = post.url;
    } else if (post.mediaType === MediaType.VIDEO) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = post.url;
    }
  }, []);

  // Preload next few posts
  useEffect(() => {
    const { PRELOAD_COUNT } = { PRELOAD_COUNT: { AHEAD: 3, BEHIND: 1 } }; // From constants
    const currentIndex = slideshow.currentIndex;
    if (posts.length === 0) return;

    // Preload ahead
    for (let i = 1; i <= PRELOAD_COUNT.AHEAD; i++) {
      const nextIndex = (currentIndex + i) % posts.length;
      if (posts[nextIndex]) {
        preloadMedia(posts[nextIndex]);
      }
    }

    // Preload behind
    for (let i = 1; i <= PRELOAD_COUNT.BEHIND; i++) {
      const prevIndex = (currentIndex - i + posts.length) % posts.length;
      if (posts[prevIndex]) {
        preloadMedia(posts[prevIndex]);
      }
    }
  }, [slideshow.currentIndex, posts, preloadMedia]);

  return {
    // State
    slideshow,
    currentPost,

    // Actions
    play,
    pause,
    togglePlay,
    next: guardedNext,
    previous: guardedPrevious,
    goToIndex,
    resetSlideshow,
    setPosts,
    setTiming,
    toggleAutoAdvance,
    toggleFullscreen,
    toggleStar,

    // Utilities
    loadStarredStatus,
    preloadMedia,

    // Computed values
    hasNext: slideshow.currentIndex < posts.length - 1 || slideshow.loop,
    hasPrevious: slideshow.currentIndex > 0 || slideshow.loop,
    progress:
      posts.length > 0 ? (slideshow.currentIndex + 1) / posts.length : 0,
    isLastPost: slideshow.currentIndex === posts.length - 1,
    isFirstPost: slideshow.currentIndex === 0,
  };
}

// Hook for media loading and error handling
export function useMediaLoader(post: SlideshowPost | undefined) {
  const { addNotification } = useAppStore();

  const handleMediaError = useCallback(
    (error: Event) => {
      console.error('Media loading error:', error);
      addNotification(
        `Failed to load ${post?.mediaType || 'media'}: ${post?.title || 'Unknown'}`,
        'error'
      );
    },
    [post, addNotification]
  );

  const handleMediaLoad = useCallback(() => {
    // Media loaded successfully
  }, []);

  return {
    handleMediaError,
    handleMediaLoad,
  };
}

// Hook for slideshow settings
export function useSlideshowSettings() {
  const { settings, updateSettings, resetSettings } = useAppStore();

  const updateInterval = useCallback(
    (type: 'images' | 'videos' | 'gifs', value: number) => {
      updateSettings({
        intervals: {
          ...settings.intervals,
          [type]: value,
        },
      });
    },
    [settings.intervals, updateSettings]
  );

  const toggleAutoAdvance = useCallback(() => {
    updateSettings({
      autoAdvance: !settings.autoAdvance,
    });
  }, [settings.autoAdvance, updateSettings]);

  const updateAccessibility = useCallback(
    (key: keyof typeof settings.accessibility, value: any) => {
      updateSettings({
        accessibility: {
          ...settings.accessibility,
          [key]: value,
        },
      });
    },
    [settings.accessibility, updateSettings]
  );

  const updateDisplay = useCallback(
    (key: keyof typeof settings.display, value: any) => {
      updateSettings({
        display: {
          ...settings.display,
          [key]: value,
        },
      });
    },
    [settings.display, updateSettings]
  );

  const updateControls = useCallback(
    (key: keyof typeof settings.controls, value: any) => {
      updateSettings({
        controls: {
          ...settings.controls,
          [key]: value,
        },
      });
    },
    [settings.controls, updateSettings]
  );

  return {
    settings,
    updateInterval,
    toggleAutoAdvance,
    updateAccessibility,
    updateDisplay,
    updateControls,
    resetSettings,
  };
}
