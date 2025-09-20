import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useSlideshow } from '../../hooks/useSlideshow';
import { useAppStore } from '../../stores/app-store';
import { useKeyboardNavigation } from '../../hooks/use-keyboard-navigation';
import { useTouchGestures } from '../../hooks/use-touch-gestures';
import HelpOverlay from '../common/HelpOverlay';
import { GestureFeedback, type GestureFeedbackRef } from './GestureFeedback';
import { MediaType } from '../../types';
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showHelpOverlay, setShowHelpOverlay] = useState(false);

  // Store and hooks
  const slideshow = useSlideshow();
  const {
    ui: { isMobile },
  } = useAppStore();

  // Current post data
  const currentPost = slideshow.currentPost;
  const hasContent = (slideshow.slideshow.posts || []).length > 0;

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
      // Set timing for both images and gifs
      slideshow.setTiming('images', seconds * 1000); // Convert to milliseconds
      slideshow.setTiming('gifs', seconds * 1000);
      console.log('Set timing to:', seconds, 'seconds');
    },
    [slideshow]
  );

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
      minSwipeDistance: 50, // Increased for more deliberate swipes
      maxSwipeTime: 500,
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

  // Load mock data for testing (TODO: Remove this and load real data)
  useEffect(() => {
    if (hasContent) return; // Only load if no content exists

    const mockPosts = [
      {
        id: '1',
        postId: 1,
        title: 'Beautiful Nature Scene',
        url: 'https://picsum.photos/800/600?random=1',
        mediaType: MediaType.IMAGE,
        thumbnailUrl: 'https://picsum.photos/200/150?random=1',
        creator: {
          id: 1,
          name: 'testuser',
          display_name: 'Test User',
          published: '2024-01-01T00:00:00Z',
          avatar: undefined,
          banned: false,
          deleted: false,
          actor_id: 'https://lemmy.world/u/testuser',
          bio: undefined,
          local: true,
          banner: undefined,
          updated: undefined,
          inbox_url: 'https://lemmy.world/u/testuser/inbox',
          shared_inbox_url: 'https://lemmy.world/inbox',
          matrix_user_id: undefined,
          admin: false,
          bot_account: false,
          ban_expires: undefined,
        },
        community: {
          id: 1,
          name: 'pics',
          title: 'Pictures',
          description: 'A community for pictures',
          removed: false,
          published: '2024-01-01T00:00:00Z',
          updated: undefined,
          deleted: false,
          nsfw: false,
          actor_id: 'https://lemmy.world/c/pics',
          local: true,
          icon: undefined,
          banner: undefined,
          followers_url: 'https://lemmy.world/c/pics/followers',
          inbox_url: 'https://lemmy.world/c/pics/inbox',
          shared_inbox_url: 'https://lemmy.world/inbox',
          hidden: false,
          posting_restricted_to_mods: false,
          instance_id: 1,
        },
        score: 42,
        published: '2024-01-15T10:30:00Z',
        nsfw: false,
        starred: false,
        viewed: false,
      },
      {
        id: '2',
        postId: 2,
        title: 'Amazing Sunset',
        url: 'https://picsum.photos/800/600?random=2',
        mediaType: MediaType.IMAGE,
        thumbnailUrl: 'https://picsum.photos/200/150?random=2',
        creator: {
          id: 2,
          name: 'photographer',
          display_name: 'Photographer',
          published: '2024-01-01T00:00:00Z',
          avatar: undefined,
          banned: false,
          deleted: false,
          actor_id: 'https://lemmy.world/u/photographer',
          bio: undefined,
          local: true,
          banner: undefined,
          updated: undefined,
          inbox_url: 'https://lemmy.world/u/photographer/inbox',
          shared_inbox_url: 'https://lemmy.world/inbox',
          matrix_user_id: undefined,
          admin: false,
          bot_account: false,
          ban_expires: undefined,
        },
        community: {
          id: 1,
          name: 'pics',
          title: 'Pictures',
          description: 'A community for pictures',
          removed: false,
          published: '2024-01-01T00:00:00Z',
          updated: undefined,
          deleted: false,
          nsfw: false,
          actor_id: 'https://lemmy.world/c/pics',
          local: true,
          icon: undefined,
          banner: undefined,
          followers_url: 'https://lemmy.world/c/pics/followers',
          inbox_url: 'https://lemmy.world/c/pics/inbox',
          shared_inbox_url: 'https://lemmy.world/inbox',
          hidden: false,
          posting_restricted_to_mods: false,
          instance_id: 1,
        },
        score: 128,
        published: '2024-01-16T14:20:00Z',
        nsfw: false,
        starred: false,
        viewed: false,
      },
    ];

    slideshow.setPosts(mockPosts);
  }, [hasContent, slideshow]);

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

  // Empty state
  if (!hasContent) {
    return (
      <div
        className={`slideshow-container ${className} bg-black flex items-center justify-center min-h-screen`}
      >
        <div className='text-center text-white'>
          <h2 className='text-2xl font-bold mb-4'>No content available</h2>
          <p className='text-gray-300 mb-6'>
            Select some communities or users to start the slideshow
          </p>
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
                src={currentPost.url}
                className='max-w-full max-h-full object-contain'
                controls={false}
                autoPlay
                muted
                playsInline
              />
            ) : (
              <img
                src={currentPost.url}
                alt={currentPost.title}
                className='max-w-full max-h-full object-contain'
                onError={() => {
                  console.error('Image load error for:', currentPost.url);
                  slideshow.next();
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
              <span>r/{currentPost.community.name}</span>
              <span className='mx-2'>•</span>
              <span>u/{currentPost.creator.name}</span>
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

      {/* Mobile fullscreen button (top right) */}
      {isMobile && (
        <div
          className={`absolute top-4 right-4 z-20 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <button
            onClick={toggleFullscreen}
            className='text-white hover:text-blue-400 p-3 bg-black bg-opacity-50 rounded-full'
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
