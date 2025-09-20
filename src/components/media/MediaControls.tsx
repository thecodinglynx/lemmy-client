/**
 * MediaControls - Universal media control interface
 *
 * Features:
 * - Universal controls for images, videos, and GIFs
 * - Zoom controls for images
 * - Play/pause for videos and GIFs
 * - Volume controls for videos
 * - Slideshow navigation controls
 * - Mobile-optimized touch interface
 * - Keyboard accessibility
 */

import React, { useState, useCallback } from 'react';
import type { SlideshowPost } from '../../types';
import { getMediaType } from '../../utils/media';

interface MediaControlsProps {
  post: SlideshowPost;
  isPlaying?: boolean;
  volume?: number;
  isMuted?: boolean;
  zoom?: number;
  canZoom?: boolean;
  showVolumeControls?: boolean;
  showPlaybackControls?: boolean;
  showZoomControls?: boolean;
  showNavigationControls?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onVolumeChange?: (volume: number) => void;
  onMuteToggle?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onClose?: () => void;
  className?: string;
}

export const MediaControls: React.FC<MediaControlsProps> = ({
  post,
  isPlaying = false,
  volume = 1,
  isMuted = false,
  zoom = 1,
  canZoom = false,
  showVolumeControls = true,
  showPlaybackControls = true,
  showZoomControls = true,
  showNavigationControls = true,
  onPlay,
  onPause,
  onVolumeChange,
  onMuteToggle,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onPrevious,
  onNext,
  onClose,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const mediaType = getMediaType(post.url);

  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      onPause?.();
    } else {
      onPlay?.();
    }
  }, [isPlaying, onPlay, onPause]);

  const handleVolumeSliderChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseFloat(event.target.value);
      onVolumeChange?.(newVolume);
    },
    [onVolumeChange]
  );

  const shouldShowPlaybackControls =
    showPlaybackControls && (mediaType === 'video' || mediaType === 'gif');
  const shouldShowVolumeControls = showVolumeControls && mediaType === 'video';
  const shouldShowZoomControls =
    showZoomControls && (mediaType === 'image' || canZoom);

  return (
    <div
      className={`absolute inset-0 z-30 ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => {
        setIsVisible(false);
        setShowVolumeSlider(false);
      }}
    >
      {/* Control overlay - shown on hover or mobile */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0 md:pointer-events-none'
        }`}
      >
        {/* Top controls */}
        <div className='absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4'>
          <div className='flex items-center justify-between'>
            {/* Media info */}
            <div className='flex items-center space-x-3 text-white max-w-2xl'>
              <div className='bg-white/20 px-2 py-1 rounded text-xs uppercase font-medium'>
                {mediaType}
              </div>
              {post.title && (
                <h3 className='text-sm font-medium truncate'>{post.title}</h3>
              )}
            </div>

            {/* Close button */}
            {onClose && (
              <button
                onClick={onClose}
                className='text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-colors'
                aria-label='Close'
              >
                <svg
                  className='w-6 h-6'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Center controls */}
        <div className='absolute inset-0 flex items-center justify-center'>
          {/* Main playback control */}
          {shouldShowPlaybackControls && (
            <button
              onClick={togglePlayback}
              className='bg-black/50 hover:bg-black/70 text-white rounded-full p-4 transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50'
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg
                  className='w-8 h-8'
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
                  className='w-8 h-8 ml-1'
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
          )}
        </div>

        {/* Bottom controls */}
        <div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4'>
          <div className='flex items-center justify-between'>
            {/* Left controls */}
            <div className='flex items-center space-x-4'>
              {/* Volume controls */}
              {shouldShowVolumeControls && (
                <div className='relative flex items-center'>
                  <button
                    onClick={onMuteToggle}
                    onMouseEnter={() => setShowVolumeSlider(true)}
                    className='text-white/80 hover:text-white p-2 rounded transition-colors'
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted || volume === 0 ? (
                      <svg
                        className='w-5 h-5'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path
                          fillRule='evenodd'
                          d='M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.846 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.846l3.537-3.816a1 1 0 011.617.816zM16 8a1 1 0 011 1v2a1 1 0 11-2 0V9a1 1 0 011-1z'
                          clipRule='evenodd'
                        />
                        <path d='M17.293 6.293a1 1 0 011.414 1.414L16.414 10l2.293 2.293a1 1 0 01-1.414 1.414L15 11.414l-2.293 2.293a1 1 0 01-1.414-1.414L13.586 10l-2.293-2.293a1 1 0 111.414-1.414L15 8.586l2.293-2.293z' />
                      </svg>
                    ) : volume < 0.5 ? (
                      <svg
                        className='w-5 h-5'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path
                          fillRule='evenodd'
                          d='M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.846 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.846l3.537-3.816a1 1 0 011.617.816zM16 8a1 1 0 011 1v2a1 1 0 11-2 0V9a1 1 0 011-1z'
                          clipRule='evenodd'
                        />
                      </svg>
                    ) : (
                      <svg
                        className='w-5 h-5'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path
                          fillRule='evenodd'
                          d='M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.846 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.846l3.537-3.816a1 1 0 011.617.816zM14.657 5.757a1 1 0 011.414 0A9.972 9.972 0 0118 10a9.972 9.972 0 01-1.929 4.243 1 1 0 11-1.414-1.414A7.971 7.971 0 0016 10c0-1.053-.2-2.061-.571-2.829a1 1 0 010-1.414zM12.828 7.586a1 1 0 011.414 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-.758 2.414 1 1 0 11-1.414-1.414A3.987 3.987 0 0013 10c0-.407-.1-.793-.286-1.121a1 1 0 010-1.293z'
                          clipRule='evenodd'
                        />
                      </svg>
                    )}
                  </button>

                  {/* Volume slider */}
                  {showVolumeSlider && (
                    <div className='absolute bottom-full left-0 mb-2 p-2 bg-black/80 rounded'>
                      <input
                        type='range'
                        min='0'
                        max='1'
                        step='0.1'
                        value={volume}
                        onChange={handleVolumeSliderChange}
                        className='w-20 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider'
                        aria-label='Volume'
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Zoom controls */}
              {shouldShowZoomControls && (
                <div className='flex items-center space-x-2'>
                  <button
                    onClick={onZoomOut}
                    disabled={zoom <= 0.5}
                    className='text-white/80 hover:text-white disabled:text-white/40 disabled:cursor-not-allowed p-2 rounded transition-colors'
                    aria-label='Zoom out'
                  >
                    <svg
                      className='w-5 h-5'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7'
                      />
                    </svg>
                  </button>

                  <span className='text-white/80 text-sm font-medium min-w-[3rem] text-center'>
                    {Math.round(zoom * 100)}%
                  </span>

                  <button
                    onClick={onZoomIn}
                    disabled={zoom >= 3}
                    className='text-white/80 hover:text-white disabled:text-white/40 disabled:cursor-not-allowed p-2 rounded transition-colors'
                    aria-label='Zoom in'
                  >
                    <svg
                      className='w-5 h-5'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7'
                      />
                    </svg>
                  </button>

                  {zoom !== 1 && onZoomReset && (
                    <button
                      onClick={onZoomReset}
                      className='text-white/80 hover:text-white p-2 rounded transition-colors'
                      aria-label='Reset zoom'
                    >
                      <svg
                        className='w-5 h-5'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                        />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Right controls - Navigation */}
            {showNavigationControls && (
              <div className='flex items-center space-x-2'>
                {onPrevious && (
                  <button
                    onClick={onPrevious}
                    className='text-white/80 hover:text-white p-2 rounded transition-colors'
                    aria-label='Previous'
                  >
                    <svg
                      className='w-6 h-6'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M15 19l-7-7 7-7'
                      />
                    </svg>
                  </button>
                )}

                {onNext && (
                  <button
                    onClick={onNext}
                    className='text-white/80 hover:text-white p-2 rounded transition-colors'
                    aria-label='Next'
                  >
                    <svg
                      className='w-6 h-6'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M9 5l7 7-7 7'
                      />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile touch controls */}
      <div className='md:hidden'>
        {/* Touch area for play/pause */}
        {shouldShowPlaybackControls && (
          <div
            className='absolute inset-0'
            onClick={togglePlayback}
            aria-hidden='true'
          />
        )}
      </div>
    </div>
  );
};

export default MediaControls;
