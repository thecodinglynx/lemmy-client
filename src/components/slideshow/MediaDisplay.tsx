/**
 * MediaDisplay - Universal media renderer for images, videos, and GIFs
 *
 * Features:
 * - Universal media rendering
 * - Proper aspect ratio handling
 * - Loading states with skeleton screens
 * - Error fallback with retry options
 * - Accessibility features
 */

import React, { useState, useCallback } from 'react';
import { MediaTypeDetector } from '../../utils/media-type-detector';
import { MediaOptimizer } from '../../utils/media-optimizer';
import { MediaType } from '../../constants/media-types';
import type { SlideshowPost } from '../../types';

interface MediaDisplayProps {
  post: SlideshowPost;
  isPlaying?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  className?: string;
}

export const MediaDisplay: React.FC<MediaDisplayProps> = ({
  post,
  isPlaying = true,
  onLoad,
  onError,
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Detect media type and optimize URL
  const detection = MediaTypeDetector.detect(post.url);
  const optimized = MediaOptimizer.optimize(post.url, {
    isMobile: window.innerWidth <= 768,
    width: window.innerWidth,
    quality: 85,
  });

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(
    (error?: Error) => {
      setIsLoading(false);
      setHasError(true);
      const errorObj = error || new Error('Media failed to load');
      onError?.(errorObj);
    },
    [onError]
  );

  const handleRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
    setIsLoading(true);
    setHasError(false);
  }, []);

  // Loading skeleton
  if (isLoading && !hasError) {
    return (
      <div
        className={`media-display ${className} flex items-center justify-center`}
      >
        <div className='animate-pulse bg-gray-700 rounded-lg w-full max-w-4xl h-96 flex items-center justify-center'>
          <div className='text-gray-400'>Loading media...</div>
        </div>
      </div>
    );
  }

  // Error state with retry
  if (hasError) {
    return (
      <div
        className={`media-display ${className} flex items-center justify-center`}
      >
        <div className='text-center text-white'>
          <div className='text-6xl mb-4'>⚠️</div>
          <h3 className='text-xl font-semibold mb-2'>Media failed to load</h3>
          <p className='text-gray-300 mb-4'>{post.title}</p>
          <div className='space-x-4'>
            <button
              onClick={handleRetry}
              className='px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors'
            >
              Retry {retryCount > 0 && `(${retryCount})`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render based on media type
  const renderMedia = () => {
    switch (detection.type) {
      case MediaType.VIDEO:
        return (
          <video
            src={optimized.optimizedUrl}
            className='max-w-full max-h-full object-contain'
            controls={false}
            autoPlay={isPlaying}
            muted
            playsInline
            loop
            onLoadedData={handleLoad}
            onError={() => handleError()}
            key={`${post.url}-${retryCount}`}
            aria-label={post.title}
          />
        );

      case MediaType.GIF:
        return (
          <img
            src={optimized.optimizedUrl}
            alt={post.title}
            className='max-w-full max-h-full object-contain'
            onLoad={handleLoad}
            onError={() => handleError()}
            key={`${post.url}-${retryCount}`}
            loading='eager'
          />
        );

      case MediaType.IMAGE:
      default:
        return (
          <img
            src={optimized.optimizedUrl}
            alt={post.title}
            className='max-w-full max-h-full object-contain'
            onLoad={handleLoad}
            onError={() => handleError()}
            key={`${post.url}-${retryCount}`}
            loading='eager'
            srcSet={optimized.srcSet?.join(', ')}
            sizes={optimized.sizes}
          />
        );
    }
  };

  return (
    <div
      className={`media-display ${className} flex items-center justify-center`}
    >
      {renderMedia()}
    </div>
  );
};

export default MediaDisplay;
