import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTouchGestures } from '../hooks/use-touch-gestures';

// Mock timer functions and Date.now
vi.useFakeTimers();

// Mock Date.now to work with fake timers
const mockDateNow = vi.fn();
global.Date.now = mockDateNow;

// Helper function to create mock touch events
const createTouchEvent = (
  type: string,
  touches: Array<{ clientX: number; clientY: number }>,
  changedTouches?: Array<{ clientX: number; clientY: number }>
): TouchEvent => {
  const touchList = touches.map((touch) => ({
    ...touch,
    identifier: 0,
    target: null,
    radiusX: 10,
    radiusY: 10,
    rotationAngle: 0,
    force: 1,
    pageX: touch.clientX,
    pageY: touch.clientY,
    screenX: touch.clientX,
    screenY: touch.clientY,
  }));

  const changedTouchList = (changedTouches || touches).map((touch) => ({
    ...touch,
    identifier: 0,
    target: null,
    radiusX: 10,
    radiusY: 10,
    rotationAngle: 0,
    force: 1,
    pageX: touch.clientX,
    pageY: touch.clientY,
    screenX: touch.clientX,
    screenY: touch.clientY,
  }));

  // Create a proper TouchEvent with proper prototype chain
  const event = new Event(type, { bubbles: true, cancelable: true }) as any;
  Object.defineProperties(event, {
    touches: { value: touchList, enumerable: true },
    changedTouches: { value: changedTouchList, enumerable: true },
    preventDefault: { value: vi.fn(), enumerable: true },
    type: { value: type, enumerable: true },
  });

  return event as TouchEvent;
};

describe('useTouchGestures', () => {
  let mockElement: HTMLElement;
  let callbacks: any;
  let fakeTime = 0;

  beforeEach(() => {
    fakeTime = 1000; // Start at a base time
    mockDateNow.mockImplementation(() => fakeTime);

    mockElement = document.createElement('div');
    document.body.appendChild(mockElement);

    callbacks = {
      onSwipeLeft: vi.fn(),
      onSwipeRight: vi.fn(),
      onSwipeUp: vi.fn(),
      onSwipeDown: vi.fn(),
      onTap: vi.fn(),
      onLongPress: vi.fn(),
    };
  });

  afterEach(() => {
    document.body.removeChild(mockElement);
    vi.clearAllMocks();
    vi.clearAllTimers();
    fakeTime = 0;
  });

  describe('swipe detection', () => {
    it('should detect swipe left gesture', async () => {
      const { result } = renderHook(() => useTouchGestures(callbacks));

      // Add spy to verify event listeners are attached
      const addEventListenerSpy = vi.spyOn(mockElement, 'addEventListener');

      act(() => {
        result.current.attachToElement(mockElement);
      });

      // Verify event listeners were attached
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'touchstart',
        expect.any(Function),
        { passive: false }
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'touchend',
        expect.any(Function),
        { passive: false }
      );

      // Simulate swipe left (start at right, move to left)
      const touchStart = createTouchEvent('touchstart', [
        { clientX: 200, clientY: 100 },
      ]);

      act(() => {
        mockElement.dispatchEvent(touchStart);
      });

      // Advance time slightly to simulate realistic swipe timing
      fakeTime += 50;
      mockDateNow.mockReturnValue(fakeTime);

      const touchEnd = createTouchEvent(
        'touchend',
        [],
        [{ clientX: 100, clientY: 100 }]
      );

      act(() => {
        mockElement.dispatchEvent(touchEnd);
      });

      expect(callbacks.onSwipeLeft).toHaveBeenCalledTimes(1);
      expect(callbacks.onSwipeRight).not.toHaveBeenCalled();
    });

    it('should detect swipe right gesture', async () => {
      const { result } = renderHook(() => useTouchGestures(callbacks));

      act(() => {
        result.current.attachToElement(mockElement);
      });

      // Simulate swipe right (start at left, move to right)
      const touchStart = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100 },
      ]);

      act(() => {
        mockElement.dispatchEvent(touchStart);
      });

      // Advance time slightly to simulate realistic swipe timing
      fakeTime += 50;
      mockDateNow.mockReturnValue(fakeTime);

      const touchEnd = createTouchEvent(
        'touchend',
        [],
        [{ clientX: 200, clientY: 100 }]
      );

      act(() => {
        mockElement.dispatchEvent(touchEnd);
      });

      expect(callbacks.onSwipeRight).toHaveBeenCalledTimes(1);
      expect(callbacks.onSwipeLeft).not.toHaveBeenCalled();
    });

    it('should detect swipe up gesture', async () => {
      const { result } = renderHook(() => useTouchGestures(callbacks));

      act(() => {
        result.current.attachToElement(mockElement);
      });

      // Simulate swipe up (start at bottom, move to top)
      const touchStart = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 200 },
      ]);

      act(() => {
        mockElement.dispatchEvent(touchStart);
      });

      // Advance time slightly to simulate realistic swipe timing
      fakeTime += 50;
      mockDateNow.mockReturnValue(fakeTime);

      const touchEnd = createTouchEvent(
        'touchend',
        [],
        [{ clientX: 100, clientY: 100 }]
      );

      act(() => {
        mockElement.dispatchEvent(touchEnd);
      });

      expect(callbacks.onSwipeUp).toHaveBeenCalledTimes(1);
      expect(callbacks.onSwipeDown).not.toHaveBeenCalled();
    });

    it('should detect swipe down gesture', async () => {
      const { result } = renderHook(() => useTouchGestures(callbacks));

      act(() => {
        result.current.attachToElement(mockElement);
      });

      // Simulate swipe down (start at top, move to bottom)
      const touchStart = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100 },
      ]);

      act(() => {
        mockElement.dispatchEvent(touchStart);
      });

      // Advance time slightly to simulate realistic swipe timing
      fakeTime += 50;
      mockDateNow.mockReturnValue(fakeTime);

      const touchEnd = createTouchEvent(
        'touchend',
        [],
        [{ clientX: 100, clientY: 200 }]
      );

      act(() => {
        mockElement.dispatchEvent(touchEnd);
      });

      expect(callbacks.onSwipeDown).toHaveBeenCalledTimes(1);
      expect(callbacks.onSwipeUp).not.toHaveBeenCalled();
    });

    it('should not trigger swipe for short distances', async () => {
      const { result } = renderHook(() =>
        useTouchGestures(callbacks, {
          minSwipeDistance: 50,
        })
      );

      act(() => {
        result.current.attachToElement(mockElement);
      });

      // Simulate short movement (below threshold)
      const touchStart = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100 },
      ]);

      act(() => {
        mockElement.dispatchEvent(touchStart);
      });

      // Advance time slightly to simulate realistic swipe timing
      fakeTime += 50;
      mockDateNow.mockReturnValue(fakeTime);

      const touchEnd = createTouchEvent(
        'touchend',
        [],
        [{ clientX: 120, clientY: 100 }]
      );

      act(() => {
        mockElement.dispatchEvent(touchEnd);
      });

      expect(callbacks.onSwipeLeft).not.toHaveBeenCalled();
      expect(callbacks.onSwipeRight).not.toHaveBeenCalled();
    });
  });

  describe('tap detection', () => {
    it('should detect tap gesture', async () => {
      const { result } = renderHook(() => useTouchGestures(callbacks));

      act(() => {
        result.current.attachToElement(mockElement);
      });

      // Simulate tap (minimal movement)
      const touchStart = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100 },
      ]);

      act(() => {
        mockElement.dispatchEvent(touchStart);
      });

      // Advance time slightly
      fakeTime += 100;
      mockDateNow.mockReturnValue(fakeTime);

      const touchEnd = createTouchEvent(
        'touchend',
        [],
        [{ clientX: 102, clientY: 101 }]
      );

      act(() => {
        mockElement.dispatchEvent(touchEnd);
      });

      expect(callbacks.onTap).toHaveBeenCalledTimes(1);
    });

    it('should not detect tap if movement is too large', async () => {
      const { result } = renderHook(() =>
        useTouchGestures(callbacks, {
          maxTapMovement: 10,
        })
      );

      act(() => {
        result.current.attachToElement(mockElement);
      });

      // Simulate movement beyond tap threshold
      const touchStart = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100 },
      ]);
      const touchEnd = createTouchEvent(
        'touchend',
        [],
        [{ clientX: 120, clientY: 100 }]
      );

      act(() => {
        mockElement.dispatchEvent(touchStart);
      });

      act(() => {
        mockElement.dispatchEvent(touchEnd);
      });

      expect(callbacks.onTap).not.toHaveBeenCalled();
    });

    it('should not detect tap if duration is too long', async () => {
      const { result } = renderHook(() =>
        useTouchGestures(callbacks, {
          maxTapDuration: 300,
        })
      );

      act(() => {
        result.current.attachToElement(mockElement);
      });

      // Simulate long press (beyond tap threshold)
      const touchStart = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100 },
      ]);

      act(() => {
        mockElement.dispatchEvent(touchStart);
      });

      // Advance time beyond tap threshold
      fakeTime += 400;
      mockDateNow.mockReturnValue(fakeTime);

      const touchEnd = createTouchEvent(
        'touchend',
        [],
        [{ clientX: 102, clientY: 101 }]
      );

      act(() => {
        mockElement.dispatchEvent(touchEnd);
      });

      expect(callbacks.onTap).not.toHaveBeenCalled();
    });
  });

  describe('long press detection', () => {
    it('should detect long press gesture', async () => {
      const { result } = renderHook(() => useTouchGestures(callbacks));

      act(() => {
        result.current.attachToElement(mockElement);
      });

      // Simulate long press
      const touchStart = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100 },
      ]);

      act(() => {
        mockElement.dispatchEvent(touchStart);
      });

      // Advance time to trigger long press
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(callbacks.onLongPress).toHaveBeenCalledTimes(1);
    });

    it('should cancel long press on significant movement', async () => {
      const { result } = renderHook(() =>
        useTouchGestures(callbacks, {
          maxTapMovement: 10,
        })
      );

      act(() => {
        result.current.attachToElement(mockElement);
      });

      // Start touch
      const touchStart = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100 },
      ]);
      act(() => {
        mockElement.dispatchEvent(touchStart);
      });

      // Move beyond threshold
      const touchMove = createTouchEvent('touchmove', [
        { clientX: 120, clientY: 100 },
      ]);
      act(() => {
        mockElement.dispatchEvent(touchMove);
      });

      // Advance time
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(callbacks.onLongPress).not.toHaveBeenCalled();
    });
  });

  describe('multi-touch handling', () => {
    it('should ignore multi-touch events', async () => {
      const { result } = renderHook(() => useTouchGestures(callbacks));

      act(() => {
        result.current.attachToElement(mockElement);
      });

      // Simulate multi-touch start
      const touchStart = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100 },
        { clientX: 200, clientY: 100 },
      ]);

      act(() => {
        mockElement.dispatchEvent(touchStart);
      });

      // Advance time
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(callbacks.onLongPress).not.toHaveBeenCalled();
    });
  });

  describe('configuration', () => {
    it('should use custom configuration values', () => {
      const customConfig = {
        minSwipeDistance: 100,
        maxSwipeTime: 200,
        preventDefaultOnSwipe: false,
        maxTapDuration: 400,
        maxTapMovement: 15,
      };

      const { result } = renderHook(() =>
        useTouchGestures(callbacks, customConfig)
      );

      expect(result.current.config).toEqual({
        ...customConfig,
        enablePinch: false, // default value
      });
    });
  });

  describe('cleanup', () => {
    it('should remove event listeners when element changes', () => {
      const { result } = renderHook(() => useTouchGestures(callbacks));

      const removeSpy = vi.spyOn(mockElement, 'removeEventListener');

      act(() => {
        result.current.attachToElement(mockElement);
      });

      act(() => {
        result.current.attachToElement(null);
      });

      expect(removeSpy).toHaveBeenCalledWith(
        'touchstart',
        expect.any(Function)
      );
      expect(removeSpy).toHaveBeenCalledWith('touchmove', expect.any(Function));
      expect(removeSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
      expect(removeSpy).toHaveBeenCalledWith(
        'touchcancel',
        expect.any(Function)
      );
    });
  });
});
