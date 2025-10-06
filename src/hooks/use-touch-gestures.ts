import { useRef, useEffect, useCallback } from 'react';

interface TouchGestureConfig {
  // Swipe detection thresholds
  minSwipeDistance: number;
  maxSwipeTime: number;
  preventDefaultOnSwipe: boolean;

  // Tap detection
  maxTapDuration: number;
  maxTapMovement: number;

  // Pinch detection (future enhancement)
  enablePinch: boolean;
}

interface TouchGestureCallbacks {
  onSwipeLeft?: (event: TouchEvent, velocity: number) => void;
  onSwipeRight?: (event: TouchEvent, velocity: number) => void;
  onSwipeUp?: (event: TouchEvent, velocity: number) => void;
  onSwipeDown?: (event: TouchEvent, velocity: number) => void;
  onTap?: (event: TouchEvent) => void;
  onLongPress?: (event: TouchEvent) => void;
  onPinch?: (event: TouchEvent, scale: number) => void;
}

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

const DEFAULT_CONFIG: TouchGestureConfig = {
  minSwipeDistance: 30,
  maxSwipeTime: 300,
  preventDefaultOnSwipe: true,
  maxTapDuration: 300,
  maxTapMovement: 10,
  enablePinch: false,
};

export function useTouchGestures(
  callbacks: TouchGestureCallbacks,
  config: Partial<TouchGestureConfig> = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Touch tracking state
  const touchStart = useRef<TouchPoint | null>(null);
  const touchEnd = useRef<TouchPoint | null>(null);
  const isTouching = useRef(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  // Helper function to get touch coordinates
  const getTouchPoint = useCallback((event: TouchEvent): TouchPoint => {
    const touch = event.touches[0] || event.changedTouches[0];
    return {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
    };
  }, []);

  // Calculate swipe velocity (pixels per millisecond)
  const calculateVelocity = useCallback(
    (start: TouchPoint, end: TouchPoint): number => {
      const distance = Math.sqrt(
        Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
      );
      const time = end.timestamp - start.timestamp;
      return time > 0 ? distance / time : 0;
    },
    []
  );

  // Determine swipe direction and trigger callback
  const handleSwipe = useCallback(
    (start: TouchPoint, end: TouchPoint, event: TouchEvent) => {
      const deltaX = end.x - start.x;
      const deltaY = end.y - start.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const time = end.timestamp - start.timestamp;

      // Check if it meets swipe criteria
      if (
        distance < finalConfig.minSwipeDistance ||
        time > finalConfig.maxSwipeTime
      ) {
        return false;
      }

      const velocity = calculateVelocity(start, end);

      // Determine primary direction
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0) {
          callbacks.onSwipeRight?.(event, velocity);
        } else {
          callbacks.onSwipeLeft?.(event, velocity);
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          callbacks.onSwipeDown?.(event, velocity);
        } else {
          callbacks.onSwipeUp?.(event, velocity);
        }
      }

      return true;
    },
    [callbacks, finalConfig, calculateVelocity]
  );

  // Check if movement qualifies as a tap
  const isTap = useCallback(
    (start: TouchPoint, end: TouchPoint): boolean => {
      const distance = Math.sqrt(
        Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
      );
      const time = end.timestamp - start.timestamp;

      return (
        distance <= finalConfig.maxTapMovement &&
        time <= finalConfig.maxTapDuration
      );
    },
    [finalConfig]
  );

  // Helper function to check if touch target is an interactive element
  const isInteractiveElement = useCallback(
    (target: EventTarget | null): boolean => {
      if (!target || !(target instanceof Element)) return false;

      const tagName = target.tagName.toLowerCase();
      const interactiveTags = ['button', 'a', 'input', 'select', 'textarea'];

      // Check if it's a direct interactive element
      if (interactiveTags.includes(tagName)) return true;

      // Check if it's inside an interactive element (like SVG inside a button)
      const closestInteractive = target.closest(
        'button, a, input, select, textarea'
      );
      return !!closestInteractive;
    },
    []
  );

  // Touch event handlers
  const handleTouchStart = useCallback(
    (event: TouchEvent) => {
      // Skip gesture handling for interactive elements
      if (isInteractiveElement(event.target)) {
        return;
      }

      if (event.touches.length > 1) {
        // Multi-touch - cancel any ongoing gesture
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
        return;
      }

      touchStart.current = getTouchPoint(event);
      touchEnd.current = null;
      isTouching.current = true;

      // Start long press timer
      if (callbacks.onLongPress) {
        longPressTimer.current = setTimeout(() => {
          if (isTouching.current && touchStart.current) {
            callbacks.onLongPress?.(event);
            longPressTimer.current = null;
          }
        }, 500); // Long press threshold: 500ms
      }
    },
    [getTouchPoint, callbacks.onLongPress, isInteractiveElement]
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      // Skip gesture handling for interactive elements
      if (isInteractiveElement(event.target)) {
        return;
      }

      if (
        !touchStart.current ||
        !isTouching.current ||
        event.touches.length > 1
      ) {
        return;
      }

      const currentPoint = getTouchPoint(event);
      const distance = Math.sqrt(
        Math.pow(currentPoint.x - touchStart.current.x, 2) +
          Math.pow(currentPoint.y - touchStart.current.y, 2)
      );

      // Cancel long press if movement is too significant
      if (distance > finalConfig.maxTapMovement && longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }

      // Prevent default for potential swipes to avoid scrolling
      if (
        finalConfig.preventDefaultOnSwipe &&
        distance > finalConfig.minSwipeDistance / 2
      ) {
        event.preventDefault();
      }
    },
    [getTouchPoint, finalConfig, isInteractiveElement]
  );

  const handleTouchEnd = useCallback(
    (event: TouchEvent) => {
      // Skip gesture handling for interactive elements
      if (isInteractiveElement(event.target)) {
        return;
      }

      if (!touchStart.current || !isTouching.current) {
        return;
      }

      // Clear long press timer
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }

      touchEnd.current = getTouchPoint(event);
      isTouching.current = false;

      const wasSwipe = handleSwipe(touchStart.current, touchEnd.current, event);

      // If not a swipe, check for tap
      if (!wasSwipe && isTap(touchStart.current, touchEnd.current)) {
        callbacks.onTap?.(event);
      }

      if (wasSwipe && finalConfig.preventDefaultOnSwipe) {
        event.preventDefault();
      }

      // Reset state
      touchStart.current = null;
      touchEnd.current = null;
    },
    [
      getTouchPoint,
      handleSwipe,
      isTap,
      callbacks.onTap,
      finalConfig.preventDefaultOnSwipe,
      isInteractiveElement,
    ]
  );

  const handleTouchCancel = useCallback(() => {
    // Reset all touch state
    isTouching.current = false;
    touchStart.current = null;
    touchEnd.current = null;

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Return ref to attach to target element
  const attachToElement = useCallback(
    (element: HTMLElement | null) => {
      // Clean up previous element if exists
      const previousElement = elementRef.current;
      if (previousElement) {
        previousElement.removeEventListener('touchstart', handleTouchStart);
        previousElement.removeEventListener('touchmove', handleTouchMove);
        previousElement.removeEventListener('touchend', handleTouchEnd);
        previousElement.removeEventListener('touchcancel', handleTouchCancel);
      }

      // Set new element
      elementRef.current = element;

      // Attach listeners to new element
      if (element) {
        element.addEventListener('touchstart', handleTouchStart, {
          passive: false,
        });
        element.addEventListener('touchmove', handleTouchMove, {
          passive: false,
        });
        element.addEventListener('touchend', handleTouchEnd, {
          passive: false,
        });
        element.addEventListener('touchcancel', handleTouchCancel, {
          passive: true,
        });
      }
    },
    [handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel]
  );

  // Cleanup effect
  useEffect(() => {
    return () => {
      const element = elementRef.current;
      if (element) {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchmove', handleTouchMove);
        element.removeEventListener('touchend', handleTouchEnd);
        element.removeEventListener('touchcancel', handleTouchCancel);
      }
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel]);

  return {
    attachToElement,
    config: finalConfig,
  };
}
