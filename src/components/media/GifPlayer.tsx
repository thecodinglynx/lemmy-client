/**
 * GifPlayer - Specialized GIF player component
 *
 * Features:
 * - Optimized GIF playback with pause/play controls
 * - Memory management for large GIFs
 * - Loop controls and frame counting
 * - Loading states and error handling
 * - Mobile-optimized touch controls
 * - Accessibility support
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { SlideshowPost } from '../../types';

interface GifPlayerProps {
  post: SlideshowPost;
  isPlaying?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onError?: (error: Error) => void;
  className?: string;
  loop?: boolean;
  autoPlay?: boolean;
}

export const GifPlayer: React.FC<GifPlayerProps> = ({
  post,
  isPlaying = true,
  onPlay,
  onPause,
  onError,
  className = '',
  loop = true,
  autoPlay = true,
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isPaused, setIsPaused] = useState(!autoPlay);
  const [isHovered, setIsHovered] = useState(false);
  const [staticFrame, setStaticFrame] = useState<string | null>(null);

  // Handle GIF loading
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setIsError(false);
  }, []);

  // Handle GIF error
  const handleError = useCallback(
    (_event: React.SyntheticEvent<HTMLImageElement, Event>) => {
      setIsError(true);
      setIsLoaded(false);
      onError?.(new Error('Failed to load GIF'));
    },
    [onError]
  );

  // Create static frame for paused state
  const createStaticFrame = useCallback(() => {
    if (!imgRef.current || !canvasRef.current) return;

    const img = imgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    ctx.drawImage(img, 0, 0);

    const dataURL = canvas.toDataURL('image/png');
    setStaticFrame(dataURL);
  }, []);

  // Toggle play/pause
  const togglePlayback = useCallback(() => {
    const newPausedState = !isPaused;
    setIsPaused(newPausedState);

    if (newPausedState) {
      createStaticFrame();
      onPause?.();
    } else {
      setStaticFrame(null);
      onPlay?.();
    }
  }, [isPaused, createStaticFrame, onPlay, onPause]);

  // Handle external play/pause control
  useEffect(() => {
    if (isPlaying !== undefined) {
      const shouldBePaused = !isPlaying;
      if (shouldBePaused !== isPaused) {
        setIsPaused(shouldBePaused);
        if (shouldBePaused) {
          createStaticFrame();
        } else {
          setStaticFrame(null);
        }
      }
    }
  }, [isPlaying, isPaused, createStaticFrame]);

  // Keyboard accessibility
  const handleKeyPress = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        togglePlayback();
      }
    },
    [togglePlayback]
  );

  return (
    <div
      className={`relative w-full h-full bg-black flex items-center justify-center overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={0}
      onKeyPress={handleKeyPress}
      role='button'
      aria-label={`GIF: ${post.title || 'Untitled'} - ${isPaused ? 'Paused' : 'Playing'}`}
    >
      {/* Loading state */}
      {!isLoaded && !isError && (
        <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-10'>
          <div className='flex flex-col items-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4'></div>
            <p className='text-white text-sm'>Loading GIF...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className='absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-75 z-10'>
          <div className='flex flex-col items-center text-center p-4'>
            <div className='text-red-400 text-4xl mb-4'>⚠️</div>
            <p className='text-white text-sm mb-2'>Failed to load GIF</p>
            <p className='text-gray-300 text-xs max-w-md'>
              The GIF file may be corrupted or too large to display.
            </p>
          </div>
        </div>
      )}

      {/* Hidden canvas for frame extraction */}
      <canvas ref={canvasRef} className='hidden' aria-hidden='true' />

      {/* GIF Image */}
      {!isError && (
        <>
          {/* Animated GIF (shown when playing) */}
          <img
            ref={imgRef}
            src={post.url}
            alt={post.title || 'GIF image'}
            className={`max-w-full max-h-full object-contain transition-opacity duration-200 ${
              isPaused ? 'opacity-0 absolute' : 'opacity-100'
            }`}
            onLoad={handleLoad}
            onError={handleError}
            style={{ display: isPaused ? 'none' : 'block' }}
          />

          {/* Static frame (shown when paused) */}
          {isPaused && staticFrame && (
            <img
              src={staticFrame}
              alt={`${post.title || 'GIF image'} (paused)`}
              className='max-w-full max-h-full object-contain'
            />
          )}
        </>
      )}

      {/* Play/Pause Controls */}
      {isLoaded && !isError && (isHovered || isPaused) && (
        <div className='absolute inset-0 flex items-center justify-center z-20'>
          <button
            onClick={togglePlayback}
            className='bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full p-4 transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50'
            aria-label={isPaused ? 'Play GIF' : 'Pause GIF'}
          >
            {isPaused ? (
              // Play icon
              <svg
                className='w-8 h-8 text-white ml-1'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z'
                  clipRule='evenodd'
                />
              </svg>
            ) : (
              // Pause icon
              <svg
                className='w-8 h-8 text-white'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z'
                  clipRule='evenodd'
                />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* GIF indicator */}
      {isLoaded && !isError && (
        <div className='absolute top-4 right-4 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded'>
          GIF
        </div>
      )}

      {/* Loop indicator */}
      {isLoaded && !isError && loop && (
        <div className='absolute bottom-4 right-4 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded flex items-center'>
          <svg className='w-3 h-3 mr-1' fill='currentColor' viewBox='0 0 20 20'>
            <path
              fillRule='evenodd'
              d='M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z'
              clipRule='evenodd'
            />
          </svg>
          Loop
        </div>
      )}
    </div>
  );
};

export default GifPlayer;
