import React, { useEffect, useCallback, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSlideshow } from '../../hooks/useSlideshow';
import { useAppStore } from '../../stores/app-store';
import { useKeyboardNavigation } from '../../hooks/use-keyboard-navigation';
import { useTouchGestures } from '../../hooks/use-touch-gestures';
import { useBatchPosts, useLoadMorePosts } from '../../hooks/useContent';
import { useWakeLock } from '../../hooks/useWakeLock';
import { getProxiedMediaUrl } from '../../utils/media-proxy';
import HelpOverlay from '../common/HelpOverlay';
import { GestureFeedback, type GestureFeedbackRef } from './GestureFeedback';
import './gesture-feedback.css';

interface SlideshowViewProps {
  className?: string;
  onError?: (error: Error) => void;
}

export const SlideshowView: React.FC<SlideshowViewProps> = ({
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gestureFeedbackRef = useRef<GestureFeedbackRef>(null);
  const hasTriedInitialLoad = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showHelpOverlay, setShowHelpOverlay] = useState(false);
  const [progress, setProgress] = useState(0); // Progress percentage (0-100)
  const consecutiveErrorSkipsRef = useRef(0);

  // Store and hooks
  const slideshow = useSlideshow();
  const batchPostsMutation = useBatchPosts();
  const loadMoreMutation = useLoadMorePosts();
  const {
    ui: { isMobile },
    content: { selectedCommunities },
    settings: {
      display: { keepScreenAwake = false } = { keepScreenAwake: false },
      contentSource = 'feed',
      orderingMode = 'hot',
    },
    toggleLike,
    loadLikedIntoSlideshow,
  } = useAppStore();

  // Current post data
  const currentPost = slideshow.currentPost;
  const hasContent = (slideshow.slideshow.posts || []).length > 0;
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [initialAttemptDone, setInitialAttemptDone] = useState(false);

  // Wake Lock: keep screen on while playing if user enabled the setting
  useWakeLock(!!keepScreenAwake && slideshow.slideshow.isPlaying && hasContent);

  // Guard against silent blank screen: detect rapid failures / empty responses
  useEffect(() => {
    if (batchPostsMutation.error) {
      const err = batchPostsMutation.error as any;
      const msg = err?.message || String(err);
      // Flag DNS / proxy faults explicitly
      if (/ENOTFOUND|EAI_AGAIN|DNS_RESOLUTION_FAILED/i.test(msg)) {
        setFatalError(
          'Cannot reach selected Lemmy instance (DNS lookup failed). Check your network or try a different instance.'
        );
      } else if (/Proxy error/i.test(msg)) {
        setFatalError('Upstream proxy failed to fetch data from instance.');
      }
    }
  }, [batchPostsMutation.error]);

  // Auto-hide controls on mobile
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hideControlsAfterDelay = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    if (isMobile) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000); // Hide after 3 seconds of inactivity
    }
  }, [isMobile]);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    hideControlsAfterDelay();
  }, [hideControlsAfterDelay]);

  // Fullscreen management
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.warn('Fullscreen toggle failed:', error);
    }
  }, []);

  // Star/favorite handler
  const handleStar = useCallback(() => {
    if (currentPost) {
      // TODO: Implement starring functionality
      console.log('Starring post:', currentPost.id);
    }
  }, [currentPost]);

  // Set timing handler
  const handleSetTiming = useCallback(
    (seconds: number) => {
      // Set timing for both images and gifs (seconds; conversion happens in hook)
      slideshow.setTiming('images', seconds);
      slideshow.setTiming('gifs', seconds);
      console.log('Set timing to:', seconds, 'seconds');
    },
    [slideshow]
  );

  // Reset error-skip counter on successful media load
  const handleMediaLoadSuccess = useCallback(() => {
    consecutiveErrorSkipsRef.current = 0;
  }, []);

  // On media error (e.g., 404), skip forward until something loads or we hit a safe cap
  const handleMediaError = useCallback(() => {
    const total = (slideshow.slideshow.posts || []).length;
    const maxSkips = Math.max(total, 10); // allow at least 10 attempts even with few posts
    consecutiveErrorSkipsRef.current += 1;
    console.warn(
      `[Slideshow] Media failed to load. Skipping ${consecutiveErrorSkipsRef.current}/${maxSkips}`
    );
    if (consecutiveErrorSkipsRef.current > maxSkips) {
      console.error('[Slideshow] Too many consecutive media errors. Pausing.');
      consecutiveErrorSkipsRef.current = 0;
      slideshow.pause();
      return;
    }
    slideshow.next();
  }, [slideshow]);

  // Setup keyboard navigation
  useKeyboardNavigation({
    onPlay: slideshow.play,
    onPause: slideshow.pause,
    onNext: slideshow.next,
    onPrevious: slideshow.previous,
    onToggleFullscreen: toggleFullscreen,
    onStar: handleStar,
    onSetTiming: handleSetTiming,
    isPlaying: slideshow.slideshow.isPlaying,
  });

  // Setup touch gestures
  const touchGestures = useTouchGestures(
    {
      onSwipeLeft: useCallback(() => {
        // Swipe left = next slide
        if (!slideshow.isLastPost) {
          slideshow.next();
          showControlsTemporarily();
          gestureFeedbackRef.current?.showSwipeLeft();
        }
      }, [slideshow, showControlsTemporarily]),

      onSwipeRight: useCallback(() => {
        // Swipe right = previous slide
        if (!slideshow.isFirstPost) {
          slideshow.previous();
          showControlsTemporarily();
          gestureFeedbackRef.current?.showSwipeRight();
        }
      }, [slideshow, showControlsTemporarily]),

      onTap: useCallback(
        (event: TouchEvent) => {
          // Single tap = toggle controls visibility
          if (isMobile) {
            if (showControls) {
              setShowControls(false);
            } else {
              showControlsTemporarily();
            }
            // Show tap feedback at touch location
            const touch = event.changedTouches[0];
            if (touch && containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              const x = touch.clientX - rect.left;
              const y = touch.clientY - rect.top;
              gestureFeedbackRef.current?.showTapFeedback(x, y);
            }
          } else {
            // On desktop, tap to play/pause
            slideshow.togglePlay();
          }
        },
        [isMobile, showControls, showControlsTemporarily, slideshow]
      ),

      onLongPress: useCallback(() => {
        // Long press = toggle fullscreen
        toggleFullscreen();
        gestureFeedbackRef.current?.showLongPressFeedback();
      }, [toggleFullscreen]),
    },
    {
      minSwipeDistance: 30, // More forgiving for mobile swipes
      maxSwipeTime: 600,
      preventDefaultOnSwipe: true,
      maxTapDuration: 300,
      maxTapMovement: 10,
    }
  );

  // Attach touch gestures to container
  useEffect(() => {
    if (containerRef.current) {
      touchGestures.attachToElement(containerRef.current);
    }
  }, [touchGestures]);

  // Handle help overlay
  const toggleHelpOverlay = useCallback(() => {
    setShowHelpOverlay(!showHelpOverlay);
  }, [showHelpOverlay]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Mouse movement handler for showing controls
  const handleMouseMove = useCallback(() => {
    if (!isMobile) {
      showControlsTemporarily();
    }
  }, [isMobile, showControlsTemporarily]);

  // Load real data from Lemmy API - run once on mount only
  useEffect(() => {
    if (hasTriedInitialLoad.current) return; // Only run once

    hasTriedInitialLoad.current = true;
    console.log('[SlideshowView] 🟢 Initial load effect running');

    // Get current posts to check if we need to load
    const currentPosts = useAppStore.getState().slideshow.posts;
    console.log(
      '[SlideshowView] Current posts length at mount:',
      currentPosts?.length || 0
    );

    // Only load if no content exists
    if (currentPosts && currentPosts.length > 0) return;

    // Randomize pagination to get fresh content on restart
    const { getRandomizedFreshContent } = useAppStore.getState();
    getRandomizedFreshContent();
    console.log('[SlideshowView] 🎲 Randomized pagination cursors');

    if (contentSource === 'liked') {
      console.log('[SlideshowView] Loading liked posts into slideshow');
      loadLikedIntoSlideshow();
    } else if (selectedCommunities && selectedCommunities.length > 0) {
      console.log(
        '[SlideshowView] Fetching initial posts from selected communities'
      );
      batchPostsMutation.mutate();
    } else {
      // If no communities selected, load from the "All" feed as a fallback
      // This gives users some content to browse while they select communities
      console.log(
        '[SlideshowView] No communities selected, fetching from global feed'
      );
      batchPostsMutation.mutate();
    }
    setInitialAttemptDone(true);

    // Watchdog: if after 2500ms we still have no posts & not loading & no error, retry once
    const watchdog = setTimeout(() => {
      const state = useAppStore.getState();
      if (
        state.slideshow.posts.length === 0 &&
        !batchPostsMutation.isPending &&
        !batchPostsMutation.error
      ) {
        console.warn(
          '[SlideshowView] ⏰ Watchdog retrying initial load (no posts after 2.5s)'
        );
        batchPostsMutation.mutate();
      }
    }, 2500);

    return () => clearTimeout(watchdog);
  }, [contentSource, loadLikedIntoSlideshow]); // run once unless source mode changes to liked first load

  // Reload content when selected communities change
  useEffect(() => {
    // Skip initial mount (handled by initial load effect above)
    if (!hasTriedInitialLoad.current) return;

    // Clear existing posts before loading new ones
    if (contentSource === 'feed') {
      slideshow.resetSlideshow();
      batchPostsMutation.mutate();
    }
  }, [selectedCommunities]); // Only depend on selectedCommunities

  // React to content source switching (feed <-> liked) after initial mount
  useEffect(() => {
    if (!hasTriedInitialLoad.current) return; // skip until first load done

    // Avoid redundant work if posts already represent desired source
    const state = useAppStore.getState();
    const isLikedMode = contentSource === 'liked';

    if (isLikedMode) {
      // If already showing liked posts (all starred + hasMore false), skip
      const allStarred = state.slideshow.posts.every((p) => p.starred);
      if (!(allStarred && state.content.hasMore === false)) {
        loadLikedIntoSlideshow();
      }
    } else {
      // Feed mode
      if (state.content.hasMore === false) {
        state.setHasMore(true);
      }
      // Only refetch if we are currently showing 0 posts or all posts are starred (came from liked)
      const posts = state.slideshow.posts;
      const shouldRefetch =
        posts.length === 0 || posts.every((p) => p.starred === true);
      if (shouldRefetch) {
        slideshow.resetSlideshow();
        batchPostsMutation.mutate();
      }
    }
  }, [contentSource]);

  // Refetch when ordering mode changes (feed only)
  useEffect(() => {
    if (!hasTriedInitialLoad.current) return;
    if (contentSource !== 'feed') return;
    console.log(
      '[SlideshowView] 🔁 Ordering mode changed to',
      orderingMode,
      '— refetching feed'
    );
    slideshow.resetSlideshow();
    batchPostsMutation.mutate();
  }, [orderingMode]);

  // Auto-start slideshow when content is available and auto-advance is enabled
  useEffect(() => {
    if (
      hasContent &&
      slideshow.slideshow.autoAdvance &&
      !slideshow.slideshow.isPlaying
    ) {
      // Small delay to ensure content is fully loaded
      const timer = setTimeout(() => {
        slideshow.play();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [
    hasContent,
    slideshow.slideshow.autoAdvance,
    slideshow.slideshow.isPlaying,
    slideshow,
  ]);

  // Progress tracking for current slide
  useEffect(() => {
    let progressInterval: NodeJS.Timeout | null = null;
    let startTime: number | null = null;

    if (
      slideshow.slideshow.isPlaying &&
      slideshow.slideshow.autoAdvance &&
      currentPost
    ) {
      const getCurrentTiming = () => {
        switch (currentPost.mediaType) {
          case 'video':
            return slideshow.slideshow.timing.videos === 0
              ? 0
              : slideshow.slideshow.timing.videos * 1000;
          case 'gif':
            return slideshow.slideshow.timing.gifs * 1000;
          case 'image':
          default:
            return slideshow.slideshow.timing.images * 1000;
        }
      };

      const totalDuration = getCurrentTiming();

      if (totalDuration > 0) {
        startTime = Date.now();
        setProgress(0);

        progressInterval = setInterval(() => {
          if (startTime !== null) {
            const elapsed = Date.now() - startTime;
            const progressPercent = Math.min(
              (elapsed / totalDuration) * 100,
              100
            );
            setProgress(progressPercent);
          }
        }, 100); // Update every 100ms for smooth animation
      }
    } else {
      setProgress(0);
    }

    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [
    slideshow.slideshow.isPlaying,
    slideshow.slideshow.autoAdvance,
    slideshow.slideshow.currentIndex,
    slideshow.slideshow.timing,
    currentPost,
  ]);

  // Infinite loading: when near end (within 3 of last) load more if available
  useEffect(() => {
    const state = useAppStore.getState();
    const posts = Array.isArray(state.slideshow?.posts)
      ? state.slideshow.posts
      : [];
    const hasMore = Boolean(state.content?.hasMore);
    const loading = Boolean(state.ui?.loading) || loadMoreMutation.isPending;
    const currentIndex = state.slideshow?.currentIndex ?? 0;
    const threshold = 3; // when user is within last 3 items
    if (
      contentSource === 'feed' &&
      hasMore &&
      !loading &&
      posts.length > 0 &&
      currentIndex >= Math.max(posts.length - threshold, 0)
    ) {
      // Trigger load more
      loadMoreMutation.mutate();
    }
  }, [slideshow.slideshow.currentIndex, loadMoreMutation, contentSource]);

  // Stuck playback watchdog: if we have >1 posts, playing is enabled, but index stays at 0 for too long, attempt a nudge
  useEffect(() => {
    if (!slideshow.slideshow.autoAdvance) return;
    const startPostsLen = (slideshow.slideshow.posts || []).length;
    if (startPostsLen <= 1) return; // Single post case handled elsewhere
    const startIndex = slideshow.slideshow.currentIndex;
    let cleared = false;
    const timer = setTimeout(() => {
      if (cleared) return;
      const state = useAppStore.getState();
      const stillIndex = state.slideshow.currentIndex;
      const len = state.slideshow.posts.length;
      if (len > 1 && stillIndex === startIndex) {
        console.warn(
          '[SlideshowView] Watchdog detected stagnation at first slide. Attempting recovery.'
        );
        // Try advancing manually
        slideshow.next();
        // If that fails to change index shortly, force re-fetch
        setTimeout(() => {
          const st2 = useAppStore.getState();
          if (st2.slideshow.currentIndex === startIndex) {
            console.warn(
              '[SlideshowView] Recovery advance failed; forcing slideshow reset & refetch.'
            );
            slideshow.resetSlideshow();
            batchPostsMutation.mutate();
          }
        }, 750);
      }
    }, 5000); // 5s of no progress after mount/change
    return () => {
      cleared = true;
      clearTimeout(timer);
    };
  }, [
    slideshow.slideshow.currentIndex,
    slideshow.slideshow.posts,
    slideshow.slideshow.autoAdvance,
    slideshow,
    batchPostsMutation,
  ]);

  // Listen for help overlay toggle (H key)

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Loading state
  if (!currentPost && hasContent) {
    return (
      <div className={`slideshow-container ${className} bg-black`}>
        <div className='flex items-center justify-center h-full'>
          <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-white'></div>
        </div>
      </div>
    );
  }

  // Fatal overlay (takes precedence)
  if (fatalError) {
    return (
      <div
        className={`slideshow-container ${className} bg-black flex items-center justify-center min-h-screen`}
      >
        <div className='text-center text-white max-w-xl px-6'>
          <h2 className='text-2xl font-bold mb-4'>Connection Problem</h2>
          <p className='text-red-400 mb-4'>{fatalError}</p>
          <ul className='text-sm text-gray-300 text-left mb-4 list-disc pl-5 space-y-1'>
            <li>Verify the instance domain is correct (e.g. lemmy.world)</li>
            <li>Try toggling the custom proxy option in settings</li>
            <li>Check local DNS / VPN / firewall interference</li>
            <li>Pick a different instance temporarily</li>
          </ul>
          <button
            onClick={() => {
              setFatalError(null);
              slideshow.resetSlideshow();
              batchPostsMutation.mutate();
            }}
            className='px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors'
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!hasContent) {
    if (contentSource === 'liked') {
      return (
        <div
          className={`slideshow-container ${className} bg-black flex items-center justify-center min-h-screen`}
        >
          <div className='text-center text-white max-w-md px-6'>
            <h2 className='text-2xl font-bold mb-4'>No liked media yet</h2>
            <p className='text-gray-300 mb-4'>
              Like some media while browsing the feed, then switch back to Liked
              Mode here to view your curated collection.
            </p>
            <Link
              to='/settings'
              className='inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors'
            >
              <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                <path
                  fillRule='evenodd'
                  d='M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z'
                  clipRule='evenodd'
                />
              </svg>
              Back to Settings
            </Link>
          </div>
        </div>
      );
    }
    return (
      <div
        className={`slideshow-container ${className} bg-black flex items-center justify-center min-h-screen`}
      >
        <div className='text-center text-white'>
          <h2 className='text-2xl font-bold mb-4'>No content available</h2>
          {initialAttemptDone && !batchPostsMutation.isPending && (
            <p className='text-yellow-400 mb-2'>
              Attempted to load but received 0 posts. A fallback to the global
              feed may have been tried.
            </p>
          )}
          <p className='text-gray-300 mb-2'>
            Selected communities: {selectedCommunities?.length ?? 0}
          </p>
          <p className='text-gray-300 mb-2'>
            Total posts: {slideshow.slideshow.posts?.length || 0}
          </p>
          <p className='text-gray-300 mb-2'>
            Loading: {batchPostsMutation.isPending ? 'Yes' : 'No'}
          </p>
          <p className='text-gray-300 mb-2'>
            Error:{' '}
            {batchPostsMutation.error
              ? String(batchPostsMutation.error)
              : 'None'}
          </p>
          <p className='text-gray-300 mb-6'>
            Select some communities or users to start the slideshow
          </p>
          <Link
            to='/settings'
            className='inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors'
          >
            <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z'
                clipRule='evenodd'
              />
            </svg>
            Go to Settings
          </Link>
        </div>
      </div>
    );
  }

  // Error state
  if (!currentPost && !hasContent) {
    return (
      <div
        className={`slideshow-container ${className} bg-black flex items-center justify-center min-h-screen`}
      >
        <div className='text-center text-white'>
          <h2 className='text-2xl font-bold mb-4'>Unable to load content</h2>
          <p className='text-gray-300 mb-6'>Something went wrong</p>
          <button
            onClick={slideshow.resetSlideshow}
            className='px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors'
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`slideshow-container ${className} ${
        isFullscreen ? 'fullscreen' : ''
      } bg-black min-h-screen relative overflow-hidden`}
      style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}
      onMouseMove={handleMouseMove}
      tabIndex={0}
      role='region'
      aria-label={`Media slideshow - ${currentPost?.title || 'Loading...'} (${slideshow.slideshow.currentIndex + 1} of ${(slideshow.slideshow.posts || []).length})`}
      aria-live='polite'
    >
      {/* Main media display */}
      <div className='absolute inset-0 flex items-center justify-center'>
        {currentPost && (
          <div className='max-w-full max-h-full'>
            {currentPost.mediaType === 'video' ? (
              <video
                src={getProxiedMediaUrl(currentPost.url)}
                className='max-w-full max-h-full object-contain'
                controls={false}
                autoPlay
                muted
                playsInline
                onLoadedData={handleMediaLoadSuccess}
                onCanPlay={handleMediaLoadSuccess}
                onEnded={() => {
                  // When video timing is 0 => play full duration, then advance
                  if (slideshow.slideshow.timing.videos === 0) {
                    slideshow.next();
                  }
                }}
                onError={() => {
                  console.error('Video load error for:', currentPost.url);
                  handleMediaError();
                }}
              />
            ) : (
              <img
                src={getProxiedMediaUrl(currentPost.url)}
                alt={currentPost.title}
                className='max-w-full max-h-full object-contain'
                onLoad={handleMediaLoadSuccess}
                onError={() => {
                  console.error('Image load error for:', currentPost.url);
                  handleMediaError();
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Progress indicator */}
      <div
        className={`absolute top-4 left-1/2 transform -translate-x-1/2 z-20 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className='bg-black bg-opacity-50 rounded-full px-4 py-2 text-white text-sm'>
          {(slideshow.slideshow.currentIndex || 0) + 1} /{' '}
          {(slideshow.slideshow.posts || []).length}
          {slideshow.slideshow.isPlaying && (
            <span className='ml-2 animate-pulse'>▶</span>
          )}
        </div>
      </div>

      {/* Time Progress Bar */}
      {slideshow.slideshow.isPlaying &&
        slideshow.slideshow.autoAdvance &&
        currentPost && (
          <div
            className={`absolute bottom-0 left-0 right-0 z-30 transition-opacity duration-300 ${
              showControls || !isMobile ? 'opacity-100' : 'opacity-50'
            }`}
          >
            <div className='h-0.5 bg-black bg-opacity-20'>
              <div
                className='h-full bg-white bg-opacity-60 transition-all duration-100 ease-linear shadow-sm'
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

      {/* Attribution overlay */}
      {currentPost && (
        <div
          className={`absolute bottom-20 left-4 right-4 z-20 transition-opacity duration-300 ${
            showControls || !isMobile ? 'opacity-100' : 'opacity-30'
          }`}
        >
          <div className='bg-black bg-opacity-50 rounded-lg p-4 text-white'>
            <h3 className='font-semibold text-lg mb-1 truncate'>
              {currentPost.title}
            </h3>
            <div className='text-sm text-gray-300'>
              <button
                type='button'
                onClick={() => {
                  try {
                    const exists = selectedCommunities.some(
                      (c) => c.id === currentPost.community.id
                    );
                    if (exists) {
                      useAppStore
                        .getState()
                        .addNotification?.(
                          `Community r/${currentPost.community.name} already added`,
                          'info'
                        );
                      return;
                    }
                    useAppStore.getState().addCommunity(currentPost.community);
                    useAppStore
                      .getState()
                      .addNotification?.(
                        `Added r/${currentPost.community.name}`,
                        'success'
                      );
                  } catch (err) {
                    console.warn('Failed adding community from click', err);
                  }
                }}
                className='underline decoration-dotted underline-offset-2 hover:text-blue-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-sm'
                aria-label={`Add community r/${currentPost.community.name} to selection`}
                title='Click to add this community to your selection'
              >
                r/{currentPost.community.name}
              </button>
              <button
                type='button'
                onClick={() => {
                  const { blockCommunity, addNotification } =
                    useAppStore.getState();
                  blockCommunity(currentPost.community);
                  addNotification?.(
                    `Blocked r/${currentPost.community.name}`,
                    'warning'
                  );
                }}
                className='ml-2 text-xs px-2 py-0.5 rounded bg-red-600/70 hover:bg-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400'
                aria-label={`Block community r/${currentPost.community.name}`}
                title='Block this community'
              >
                Block
              </button>
              <span className='mx-2'>•</span>
              <button
                type='button'
                onClick={() => {
                  try {
                    const state = useAppStore.getState();
                    const exists = state.content.selectedUsers.some(
                      (u) =>
                        u.name.toLowerCase() ===
                        currentPost.creator.name.toLowerCase()
                    );
                    if (exists) {
                      state.addNotification?.(
                        `User u/${currentPost.creator.name} already added`,
                        'info'
                      );
                      return;
                    }
                    state.addUser(currentPost.creator as any);
                    state.addNotification?.(
                      `Added u/${currentPost.creator.name}`,
                      'success'
                    );
                  } catch (err) {
                    console.warn('Failed adding user from click', err);
                  }
                }}
                className='underline decoration-dotted underline-offset-2 hover:text-blue-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-sm'
                aria-label={`Add user u/${currentPost.creator.name} to selection`}
                title='Click to add this user to your selection'
              >
                u/{currentPost.creator.name}
              </button>
              <span className='mx-2'>•</span>
              <span>{currentPost.score} points</span>
            </div>
          </div>
        </div>
      )}

      {/* Slideshow controls */}
      <div
        className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className={`flex items-center ${
            isMobile
              ? 'space-x-6 bg-black bg-opacity-70 rounded-2xl px-8 py-4'
              : 'space-x-4 bg-black bg-opacity-50 rounded-full px-6 py-3'
          }`}
        >
          <button
            onClick={slideshow.previous}
            disabled={slideshow.isFirstPost}
            className={`text-white hover:text-blue-400 disabled:text-gray-500 disabled:cursor-not-allowed transition-all ${
              isMobile ? 'p-3 bg-white bg-opacity-20 rounded-full' : ''
            }`}
            aria-label='Previous slide'
          >
            <svg
              className={`${isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
              fill='currentColor'
              viewBox='0 0 20 20'
            >
              <path
                fillRule='evenodd'
                d='M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z'
                clipRule='evenodd'
              />
            </svg>
          </button>

          <button
            onClick={slideshow.togglePlay}
            className={`text-white hover:text-blue-400 transition-all ${
              isMobile ? 'p-3 bg-white bg-opacity-20 rounded-full' : ''
            }`}
            aria-label={
              slideshow.slideshow.isPlaying
                ? 'Pause slideshow'
                : 'Play slideshow'
            }
          >
            {slideshow.slideshow.isPlaying ? (
              <svg
                className={`${isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z'
                  clipRule='evenodd'
                />
              </svg>
            ) : (
              <svg
                className={`${isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z'
                  clipRule='evenodd'
                />
              </svg>
            )}
          </button>

          <button
            onClick={slideshow.next}
            disabled={slideshow.isLastPost}
            className={`text-white hover:text-blue-400 disabled:text-gray-500 disabled:cursor-not-allowed transition-all ${
              isMobile ? 'p-3 bg-white bg-opacity-20 rounded-full' : ''
            }`}
            aria-label='Next slide'
          >
            <svg
              className={`${isMobile ? 'w-8 h-8' : 'w-6 h-6'}`}
              fill='currentColor'
              viewBox='0 0 20 20'
            >
              <path
                fillRule='evenodd'
                d='M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z'
                clipRule='evenodd'
              />
            </svg>
          </button>

          {!isMobile && (
            <button
              onClick={toggleFullscreen}
              className='text-white hover:text-blue-400'
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? (
                <svg
                  className='w-6 h-6'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z'
                    clipRule='evenodd'
                  />
                </svg>
              ) : (
                <svg
                  className='w-6 h-6'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12z'
                    clipRule='evenodd'
                  />
                </svg>
              )}
            </button>
          )}

          {!isMobile && (
            <button
              onClick={() => currentPost && toggleLike(currentPost)}
              className='text-white hover:text-pink-400'
              aria-label={currentPost?.starred ? 'Unlike media' : 'Like media'}
              title={currentPost?.starred ? 'Unlike' : 'Like'}
            >
              {currentPost?.starred ? (
                <svg
                  className='w-6 h-6'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                >
                  <path d='M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 18.657l-6.828-6.829a4 4 0 010-5.656z' />
                </svg>
              ) : (
                <svg
                  className='w-6 h-6'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <path d='M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 000-7.8z' />
                </svg>
              )}
            </button>
          )}

          {!isMobile && contentSource === 'liked' && (
            <div className='text-xs text-gray-400 font-medium tracking-wide'>
              Liked Mode
            </div>
          )}
          {!isMobile && contentSource === 'feed' && (
            <button
              onClick={() => {
                console.log('🔄 User requested fresh content');
                const { getRandomizedFreshContent } = useAppStore.getState();
                getRandomizedFreshContent();
                batchPostsMutation.mutate();
              }}
              className='text-white hover:text-blue-400'
              title='Get fresh content'
              aria-label='Get fresh content'
            >
              <svg className='w-6 h-6' fill='currentColor' viewBox='0 0 20 20'>
                <path
                  fillRule='evenodd'
                  d='M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z'
                  clipRule='evenodd'
                />
              </svg>
            </button>
          )}

          {!isMobile && (
            <button
              onClick={toggleHelpOverlay}
              className='text-white hover:text-blue-400'
              title='Keyboard shortcuts (H)'
              aria-label='Show keyboard shortcuts'
            >
              <svg className='w-6 h-6' fill='currentColor' viewBox='0 0 20 20'>
                <path
                  fillRule='evenodd'
                  d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z'
                  clipRule='evenodd'
                />
              </svg>
            </button>
          )}

          {!isMobile && (
            <Link
              to='/settings'
              className='text-white hover:text-blue-400 transition-colors'
              title='Settings (,)'
              aria-label='Open settings'
            >
              <svg className='w-6 h-6' fill='currentColor' viewBox='0 0 20 20'>
                <path
                  fillRule='evenodd'
                  d='M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z'
                  clipRule='evenodd'
                />
              </svg>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile-specific gesture hints */}
      {isMobile && (
        <div
          className={`absolute top-1/2 left-4 transform -translate-y-1/2 z-10 transition-opacity duration-300 ${
            showControls ? 'opacity-0' : 'opacity-60'
          }`}
        >
          <div className='text-white text-xs bg-black bg-opacity-30 rounded px-2 py-1'>
            ← Swipe →
          </div>
        </div>
      )}

      {/* Mobile controls (top right) */}
      {isMobile && (
        <div
          className={`absolute top-4 right-4 z-20 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          } flex flex-col gap-2`}
        >
          {/* Like button (mobile) */}
          <button
            onClick={() => {
              if (currentPost) {
                toggleLike(currentPost);
                // Keep controls visible / reset auto-hide timer after liking
                showControlsTemporarily();
              }
            }}
            className='text-white hover:text-pink-400 active:text-pink-300 active:scale-95 p-3 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full transition-all duration-150 touch-manipulation'
            aria-label={currentPost?.starred ? 'Unlike media' : 'Like media'}
            title={currentPost?.starred ? 'Unlike' : 'Like'}
          >
            {currentPost?.starred ? (
              <svg className='w-6 h-6' viewBox='0 0 20 20' fill='currentColor'>
                <path d='M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 18.657l-6.828-6.829a4 4 0 010-5.656z' />
              </svg>
            ) : (
              <svg
                className='w-6 h-6'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <path d='M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 000-7.8z' />
              </svg>
            )}
          </button>
          {/* Refresh button */}
          <button
            onClick={() => {
              console.log('🔄 User requested fresh content');
              const { getRandomizedFreshContent } = useAppStore.getState();
              getRandomizedFreshContent();
              batchPostsMutation.mutate();
            }}
            className='text-white hover:text-blue-400 active:text-blue-300 active:scale-95 p-3 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full transition-all duration-150 touch-manipulation'
            aria-label='Get fresh content'
          >
            <svg className='w-6 h-6' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z'
                clipRule='evenodd'
              />
            </svg>
          </button>

          {/* Settings button */}
          <Link
            to='/settings'
            className='text-white hover:text-blue-400 active:text-blue-300 active:scale-95 p-3 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full transition-all duration-150 touch-manipulation'
            aria-label='Settings'
          >
            <svg className='w-6 h-6' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z'
                clipRule='evenodd'
              />
            </svg>
          </Link>

          {/* Fullscreen button */}
          <button
            onClick={toggleFullscreen}
            className='text-white hover:text-blue-400 active:text-blue-300 active:scale-95 p-3 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full transition-all duration-150 touch-manipulation'
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <svg className='w-6 h-6' fill='currentColor' viewBox='0 0 20 20'>
                <path
                  fillRule='evenodd'
                  d='M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z'
                  clipRule='evenodd'
                />
              </svg>
            ) : (
              <svg className='w-6 h-6' fill='currentColor' viewBox='0 0 20 20'>
                <path
                  fillRule='evenodd'
                  d='M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12z'
                  clipRule='evenodd'
                />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Gesture feedback component */}
      <GestureFeedback ref={gestureFeedbackRef} />

      {/* Help overlay for keyboard shortcuts */}
      <HelpOverlay
        isVisible={showHelpOverlay}
        onClose={() => setShowHelpOverlay(false)}
      />
    </div>
  );
};

export default SlideshowView;
