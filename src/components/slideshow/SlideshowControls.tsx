/**
 * SlideshowControls - Control buttons for slideshow navigation
 *
 * Features:
 * - Play/pause toggle button
 * - Previous/next navigation
 * - Fullscreen toggle
 * - Star/favorite button
 * - Progress indicator
 */

import React from 'react';

interface SlideshowControlsProps {
  isPlaying: boolean;
  canGoNext: boolean;
  canGoPrevious: boolean;
  isFullscreen: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onFullscreen: () => void;
  onStar?: () => void;
  className?: string;
}

export const SlideshowControls: React.FC<SlideshowControlsProps> = ({
  isPlaying,
  canGoNext,
  canGoPrevious,
  isFullscreen,
  onPlayPause,
  onNext,
  onPrevious,
  onFullscreen,
  onStar,
  className = '',
}) => {
  return (
    <div className={`slideshow-controls ${className}`}>
      <div className='flex items-center space-x-4 bg-black bg-opacity-50 rounded-full px-6 py-3'>
        {/* Previous button */}
        <button
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className='text-white hover:text-blue-400 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors'
          aria-label='Previous slide'
        >
          <svg className='w-6 h-6' fill='currentColor' viewBox='0 0 20 20'>
            <path
              fillRule='evenodd'
              d='M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z'
              clipRule='evenodd'
            />
          </svg>
        </button>

        {/* Play/Pause button */}
        <button
          onClick={onPlayPause}
          className='text-white hover:text-blue-400 transition-colors'
          aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
        >
          {isPlaying ? (
            <svg className='w-8 h-8' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z'
                clipRule='evenodd'
              />
            </svg>
          ) : (
            <svg className='w-8 h-8' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z'
                clipRule='evenodd'
              />
            </svg>
          )}
        </button>

        {/* Next button */}
        <button
          onClick={onNext}
          disabled={!canGoNext}
          className='text-white hover:text-blue-400 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors'
          aria-label='Next slide'
        >
          <svg className='w-6 h-6' fill='currentColor' viewBox='0 0 20 20'>
            <path
              fillRule='evenodd'
              d='M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z'
              clipRule='evenodd'
            />
          </svg>
        </button>

        {/* Divider */}
        <div className='w-px h-6 bg-gray-400'></div>

        {/* Star button */}
        {onStar && (
          <button
            onClick={onStar}
            className='text-white hover:text-yellow-400 transition-colors'
            aria-label='Star this content'
          >
            <svg className='w-6 h-6' fill='currentColor' viewBox='0 0 20 20'>
              <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
            </svg>
          </button>
        )}

        {/* Fullscreen button */}
        <button
          onClick={onFullscreen}
          className='text-white hover:text-blue-400 transition-colors'
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
    </div>
  );
};

export default SlideshowControls;
