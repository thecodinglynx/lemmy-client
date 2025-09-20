import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import {
  GestureFeedback,
  type GestureFeedbackRef,
} from '../components/slideshow/GestureFeedback';
import React from 'react';

// Mock timer functions
vi.useFakeTimers();

describe('GestureFeedback', () => {
  let feedbackRef: React.RefObject<GestureFeedbackRef | null>;

  beforeEach(() => {
    feedbackRef = React.createRef();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('swipe feedback', () => {
    it('should show left swipe indicator', () => {
      render(<GestureFeedback ref={feedbackRef} />);

      act(() => {
        feedbackRef.current?.showSwipeLeft();
      });

      // Should show right arrow (indicating left swipe direction)
      expect(
        document.querySelector('.animate-slide-out-left')
      ).toBeInTheDocument();
      expect(document.querySelector('svg')).toBeInTheDocument();
    });

    it('should show right swipe indicator', () => {
      render(<GestureFeedback ref={feedbackRef} />);

      act(() => {
        feedbackRef.current?.showSwipeRight();
      });

      // Should show left arrow (indicating right swipe direction)
      expect(
        document.querySelector('.animate-slide-out-right')
      ).toBeInTheDocument();
      expect(document.querySelector('svg')).toBeInTheDocument();
    });

    it('should auto-hide swipe indicator after animation', () => {
      render(<GestureFeedback ref={feedbackRef} />);

      act(() => {
        feedbackRef.current?.showSwipeLeft();
      });

      expect(
        document.querySelector('.animate-slide-out-left')
      ).toBeInTheDocument();

      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(400);
      });

      expect(
        document.querySelector('.animate-slide-out-left')
      ).not.toBeInTheDocument();
    });
  });

  describe('tap feedback', () => {
    it('should show tap feedback at specified position', () => {
      render(<GestureFeedback ref={feedbackRef} />);

      act(() => {
        feedbackRef.current?.showTapFeedback(150, 200);
      });

      const tapElement = document.querySelector('.animate-ping');
      expect(tapElement).toBeInTheDocument();

      // Check position
      const style = (tapElement as HTMLElement)?.style;
      expect(style?.left).toBe('150px');
      expect(style?.top).toBe('200px');
    });

    it('should auto-hide tap feedback after animation', () => {
      render(<GestureFeedback ref={feedbackRef} />);

      act(() => {
        feedbackRef.current?.showTapFeedback(100, 100);
      });

      expect(document.querySelector('.animate-ping')).toBeInTheDocument();

      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(document.querySelector('.animate-ping')).not.toBeInTheDocument();
    });
  });

  describe('long press feedback', () => {
    it('should show long press feedback', () => {
      render(<GestureFeedback ref={feedbackRef} />);

      act(() => {
        feedbackRef.current?.showLongPressFeedback();
      });

      expect(screen.getByText('Fullscreen')).toBeInTheDocument();
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('should auto-hide long press feedback after animation', () => {
      render(<GestureFeedback ref={feedbackRef} />);

      act(() => {
        feedbackRef.current?.showLongPressFeedback();
      });

      expect(screen.getByText('Fullscreen')).toBeInTheDocument();

      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(600);
      });

      expect(screen.queryByText('Fullscreen')).not.toBeInTheDocument();
    });
  });

  describe('multiple gestures', () => {
    it('should handle multiple gestures simultaneously', () => {
      render(<GestureFeedback ref={feedbackRef} />);

      act(() => {
        feedbackRef.current?.showSwipeLeft();
        feedbackRef.current?.showTapFeedback(100, 100);
        feedbackRef.current?.showLongPressFeedback();
      });

      expect(
        document.querySelector('.animate-slide-out-left')
      ).toBeInTheDocument();
      expect(document.querySelector('.animate-ping')).toBeInTheDocument();
      expect(screen.getByText('Fullscreen')).toBeInTheDocument();
    });

    it('should clear all feedback independently', () => {
      render(<GestureFeedback ref={feedbackRef} />);

      act(() => {
        feedbackRef.current?.showSwipeLeft();
        feedbackRef.current?.showTapFeedback(100, 100);
        feedbackRef.current?.showLongPressFeedback();
      });

      // Fast-forward partial time
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Tap should be gone, others should remain
      expect(document.querySelector('.animate-ping')).not.toBeInTheDocument();
      expect(
        document.querySelector('.animate-slide-out-left')
      ).toBeInTheDocument();
      expect(screen.getByText('Fullscreen')).toBeInTheDocument();

      // Fast-forward more time
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Swipe should be gone
      expect(
        document.querySelector('.animate-slide-out-left')
      ).not.toBeInTheDocument();
      expect(screen.getByText('Fullscreen')).toBeInTheDocument();

      // Fast-forward remaining time
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Long press should be gone
      expect(screen.queryByText('Fullscreen')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should not interfere with pointer events', () => {
      render(<GestureFeedback ref={feedbackRef} />);

      const container = document.querySelector('.pointer-events-none');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('pointer-events-none');
    });

    it('should use appropriate z-index for layering', () => {
      render(<GestureFeedback ref={feedbackRef} />);

      const container = document.querySelector('.z-40');
      expect(container).toBeInTheDocument();
    });
  });

  describe('component props', () => {
    it('should apply custom className', () => {
      render(<GestureFeedback ref={feedbackRef} className='custom-class' />);

      const container = document.querySelector('.custom-class');
      expect(container).toBeInTheDocument();
    });

    it('should have default styling when no className provided', () => {
      render(<GestureFeedback ref={feedbackRef} />);

      const container = document.querySelector(
        '.pointer-events-none.absolute.inset-0.z-40'
      );
      expect(container).toBeInTheDocument();
    });
  });
});
