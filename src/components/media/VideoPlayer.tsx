/**
 * VideoPlayer - Enhanced video player component
 *
 * Features:
 * - Integration with react-player library
 * - Autoplay with muted start (browser compliance)
 * - Custom controls overlay
 * - Volume controls and progress bar
 * - Loading states and buffering indicators
 * - Error handling for unsupported formats
 * - Mobile-optimized controls
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { VideoControls } from './VideoControls';
import type { SlideshowPost } from '../../types';

interface VideoPlayerProps {
  post: SlideshowPost;
  isPlaying?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (error: Error) => void;
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  post,
  isPlaying = false,
  onPlay,
  onPause,
  onEnded,
  onError,
  className = '',
}) => {
  const playerRef = useRef<ReactPlayer>(null);
  const [isReady, setIsReady] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(true); // Start muted for autoplay compliance
  const [showControls, setShowControls] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Hide controls after delay
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hideControlsAfterDelay = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    hideControlsAfterDelay();
  }, [hideControlsAfterDelay]);

  const handleMouseLeave = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(false);
  }, []);

  // Player event handlers
  const handleReady = useCallback(() => {
    setIsReady(true);
    setHasError(false);
    setIsBuffering(false);
  }, []);

  const handleStart = useCallback(() => {
    onPlay?.();
  }, [onPlay]);

  const handlePause = useCallback(() => {
    onPause?.();
  }, [onPause]);

  const handleEnded = useCallback(() => {
    onEnded?.();
  }, [onEnded]);

  const handleError = useCallback(
    (error: any) => {
      console.error('Video player error:', error);
      setHasError(true);
      setIsBuffering(false);
      onError?.(
        new Error(`Video playback failed: ${error.message || 'Unknown error'}`)
      );
    },
    [onError]
  );

  const handleBuffer = useCallback(() => {
    setIsBuffering(true);
  }, []);

  const handleBufferEnd = useCallback(() => {
    setIsBuffering(false);
  }, []);

  const handleProgress = useCallback((state: any) => {
    setCurrentTime(state.playedSeconds);
  }, []);

  const handleDuration = useCallback((duration: number) => {
    setDuration(duration);
  }, []);

  // Control handlers
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      onPause?.();
    } else {
      onPlay?.();
    }
  }, [isPlaying, onPlay, onPause]);

  const handleSeek = useCallback((seconds: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(seconds);
      setCurrentTime(seconds);
    }
  }, []);

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    if (newVolume > 0) {
      setIsMuted(false);
    }
  }, []);

  const handleMuteToggle = useCallback(() => {
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handlePlaybackRateChange = useCallback((rate: number) => {
    setPlaybackRate(rate);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Auto-hide controls initially
  useEffect(() => {
    hideControlsAfterDelay();
  }, [hideControlsAfterDelay]);

  if (hasError) {
    return (
      <div className={`video-player-error ${className}`}>
        <div className='flex flex-col items-center justify-center h-full bg-gray-900 text-white p-8'>
          <svg
            className='w-16 h-16 mb-4 text-red-500'
            fill='currentColor'
            viewBox='0 0 20 20'
          >
            <path
              fillRule='evenodd'
              d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
              clipRule='evenodd'
            />
          </svg>
          <h3 className='text-lg font-semibold mb-2'>Video Playback Error</h3>
          <p className='text-gray-400 text-center'>
            This video format is not supported or the file is corrupted.
          </p>
          <button
            onClick={() => {
              setHasError(false);
              setIsReady(false);
            }}
            className='mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors'
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`video-player relative w-full h-full bg-black ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Loading overlay */}
      {(!isReady || isBuffering) && (
        <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-10'>
          <div className='flex flex-col items-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4'></div>
            <p className='text-white text-sm'>
              {!isReady ? 'Loading video...' : 'Buffering...'}
            </p>
          </div>
        </div>
      )}

      {/* React Player */}
      <ReactPlayer
        ref={playerRef}
        url={post.url}
        playing={isPlaying}
        volume={isMuted ? 0 : volume}
        muted={isMuted}
        playbackRate={playbackRate}
        width='100%'
        height='100%'
        controls={false}
        onReady={handleReady}
        onStart={handleStart}
        onPause={handlePause}
        onEnded={handleEnded}
        onError={handleError}
        onBuffer={handleBuffer}
        onBufferEnd={handleBufferEnd}
        onProgress={handleProgress}
        onDuration={handleDuration}
      />

      {/* Custom Controls */}
      <VideoControls
        isPlaying={isPlaying}
        duration={duration}
        currentTime={currentTime}
        volume={volume}
        isMuted={isMuted}
        playbackRate={playbackRate}
        isVisible={showControls}
        onPlayPause={handlePlayPause}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onMuteToggle={handleMuteToggle}
        onPlaybackRateChange={handlePlaybackRateChange}
        className='absolute bottom-0 left-0 right-0'
      />

      {/* Click to play/pause overlay */}
      <div
        className='absolute inset-0 cursor-pointer'
        onClick={handlePlayPause}
        style={{ zIndex: showControls ? -1 : 1 }}
      />
    </div>
  );
};

export default VideoPlayer;
