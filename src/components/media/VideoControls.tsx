/**
 * VideoControls - Custom video player controls
 *
 * Features:
 * - Play/pause button
 * - Volume slider and mute toggle
 * - Progress bar with seek functionality
 * - Playback speed controls
 * - Mobile-optimized touch targets
 * - Keyboard accessibility
 */

import React, { useCallback } from 'react';

interface VideoControlsProps {
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isVisible: boolean;
  onPlayPause: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onPlaybackRateChange: (rate: number) => void;
  className?: string;
}

export const VideoControls: React.FC<VideoControlsProps> = ({
  isPlaying,
  duration,
  currentTime,
  volume,
  isMuted,
  playbackRate,
  isVisible,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onMuteToggle,
  onPlaybackRateChange,
  className = '',
}) => {
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleProgressClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const progress = clickX / rect.width;
      const seekTime = progress * duration;
      onSeek(seekTime);
    },
    [duration, onSeek]
  );

  const handleVolumeClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const newVolume = clickX / rect.width;
      onVolumeChange(Math.max(0, Math.min(1, newVolume)));
    },
    [onVolumeChange]
  );

  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`video-controls bg-gradient-to-t from-black via-black/80 to-transparent p-4 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      } ${className}`}
    >
      {/* Progress bar */}
      <div className='mb-4'>
        <div
          className='w-full h-2 bg-gray-600 rounded-full cursor-pointer relative'
          onClick={handleProgressClick}
        >
          <div
            className='h-full bg-blue-500 rounded-full relative'
            style={{ width: `${progress}%` }}
          >
            <div className='absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg'></div>
          </div>
        </div>
        <div className='flex justify-between text-xs text-white mt-1'>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Control buttons */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-4'>
          {/* Play/Pause button */}
          <button
            onClick={onPlayPause}
            className='flex items-center justify-center w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500'
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg
                className='w-6 h-6 text-white'
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
                className='w-6 h-6 text-white ml-1'
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

          {/* Volume controls */}
          <div className='flex items-center space-x-2'>
            <button
              onClick={onMuteToggle}
              className='text-white hover:text-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded'
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <svg
                  className='w-6 h-6'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.814L4.617 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.617l3.766-3.814a1 1 0 011.617.814zM14.657 5.757a1 1 0 10-1.414 1.414L15.828 10l-2.585 2.829a1 1 0 101.414 1.414L17.243 11.5a1 1 0 000-1.414L14.657 5.757z'
                    clipRule='evenodd'
                  />
                </svg>
              ) : volume < 0.5 ? (
                <svg
                  className='w-6 h-6'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.814L4.617 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.617l3.766-3.814a1 1 0 011.617.814zM12.828 11.5a1 1 0 10-1.414 1.414L13.5 14.5a1 1 0 101.414-1.414L12.828 11.5z'
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
                    d='M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.814L4.617 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.617l3.766-3.814a1 1 0 011.617.814zM16.5 12a1 1 0 01-1 1H14a1 1 0 01-1-1V8a1 1 0 011-1h1.5a1 1 0 011 1v4z'
                    clipRule='evenodd'
                  />
                </svg>
              )}
            </button>

            {/* Volume slider */}
            <div className='w-20 hidden sm:block'>
              <div
                className='h-2 bg-gray-600 rounded-full cursor-pointer relative'
                onClick={handleVolumeClick}
              >
                <div
                  className='h-full bg-blue-500 rounded-full'
                  style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className='flex items-center space-x-4'>
          {/* Playback speed */}
          <div className='relative group'>
            <button className='text-white hover:text-blue-400 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1'>
              {playbackRate}x
            </button>
            <div className='absolute bottom-full right-0 mb-2 bg-gray-800 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto'>
              <div className='p-2 space-y-1'>
                {playbackRates.map((rate) => (
                  <button
                    key={rate}
                    onClick={() => onPlaybackRateChange(rate)}
                    className={`block w-full text-left px-3 py-1 text-sm rounded transition-colors ${
                      rate === playbackRate
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoControls;
