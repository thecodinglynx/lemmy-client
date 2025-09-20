import React, { useState, useEffect } from 'react';

interface GestureFeedbackProps {
  className?: string;
}

export interface GestureFeedbackRef {
  showSwipeLeft: () => void;
  showSwipeRight: () => void;
  showTapFeedback: (x: number, y: number) => void;
  showLongPressFeedback: () => void;
}

export const GestureFeedback = React.forwardRef<
  GestureFeedbackRef,
  GestureFeedbackProps
>(({ className = '' }, ref) => {
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(
    null
  );
  const [tapPosition, setTapPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [showLongPress, setShowLongPress] = useState(false);

  // Clear feedback after animation
  useEffect(() => {
    if (swipeDirection) {
      const timer = setTimeout(() => setSwipeDirection(null), 400);
      return () => clearTimeout(timer);
    }
  }, [swipeDirection]);

  useEffect(() => {
    if (tapPosition) {
      const timer = setTimeout(() => setTapPosition(null), 300);
      return () => clearTimeout(timer);
    }
  }, [tapPosition]);

  useEffect(() => {
    if (showLongPress) {
      const timer = setTimeout(() => setShowLongPress(false), 600);
      return () => clearTimeout(timer);
    }
  }, [showLongPress]);

  // Expose methods via ref
  React.useImperativeHandle(ref, () => ({
    showSwipeLeft: () => setSwipeDirection('left'),
    showSwipeRight: () => setSwipeDirection('right'),
    showTapFeedback: (x: number, y: number) => setTapPosition({ x, y }),
    showLongPressFeedback: () => setShowLongPress(true),
  }));

  return (
    <div className={`pointer-events-none absolute inset-0 z-40 ${className}`}>
      {/* Swipe indicators */}
      {swipeDirection && (
        <div
          className={`absolute top-1/2 transform -translate-y-1/2 transition-all duration-400 ${
            swipeDirection === 'left'
              ? 'right-4 animate-slide-out-left'
              : 'left-4 animate-slide-out-right'
          }`}
        >
          <div className='bg-white bg-opacity-80 rounded-full p-4 shadow-lg'>
            {swipeDirection === 'left' ? (
              <svg
                className='w-8 h-8 text-gray-800'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z'
                  clipRule='evenodd'
                />
              </svg>
            ) : (
              <svg
                className='w-8 h-8 text-gray-800'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z'
                  clipRule='evenodd'
                />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Tap feedback */}
      {tapPosition && (
        <div
          className='absolute transform -translate-x-1/2 -translate-y-1/2 animate-ping'
          style={{
            left: tapPosition.x,
            top: tapPosition.y,
          }}
        >
          <div className='w-8 h-8 bg-white bg-opacity-60 rounded-full'></div>
        </div>
      )}

      {/* Long press feedback */}
      {showLongPress && (
        <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'>
          <div className='bg-white bg-opacity-80 rounded-lg px-4 py-2 shadow-lg animate-pulse'>
            <div className='flex items-center space-x-2'>
              <svg
                className='w-5 h-5 text-gray-800'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12z'
                  clipRule='evenodd'
                />
              </svg>
              <span className='text-sm text-gray-800 font-medium'>
                Fullscreen
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

GestureFeedback.displayName = 'GestureFeedback';
