import { useRef, useState, useCallback, useMemo } from 'react';

interface VirtualScrollOptions {
  /** Height of each item in pixels */
  itemHeight: number;
  /** Height of the visible container in pixels */
  containerHeight: number;
  /** Number of items to render outside the visible area for smooth scrolling */
  overscan?: number;
  /** Enable/disable virtual scrolling (fallback to regular rendering) */
  enabled?: boolean;
}

interface VirtualScrollResult {
  /** Visible items with their indexes and positions */
  visibleItems: Array<{
    index: number;
    offsetTop: number;
  }>;
  /** Total height of all items for scrollbar calculation */
  totalHeight: number;
  /** Props to spread on the scroll container */
  containerProps: {
    ref: React.RefObject<HTMLDivElement | null>;
    onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
    style: React.CSSProperties;
  };
  /** Props to spread on the inner container that holds all items */
  innerProps: {
    style: React.CSSProperties;
  };
  /** Current scroll position */
  scrollTop: number;
}

/**
 * Hook for implementing virtual scrolling to efficiently render large lists
 * Only renders items visible in the viewport plus a small overscan buffer
 */
export const useVirtualScroll = <T>(
  items: T[],
  options: VirtualScrollOptions
): VirtualScrollResult => {
  const { itemHeight, containerHeight, overscan = 5, enabled = true } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    if (!enabled || items.length === 0) {
      return { start: 0, end: items.length };
    }

    const start = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = start + visibleCount;

    // Add overscan buffer
    const bufferedStart = Math.max(0, start - overscan);
    const bufferedEnd = Math.min(items.length, end + overscan);

    return { start: bufferedStart, end: bufferedEnd };
  }, [scrollTop, itemHeight, containerHeight, overscan, enabled, items.length]);

  // Calculate visible items
  const visibleItems = useMemo(() => {
    const result = [];
    for (let i = visibleRange.start; i < visibleRange.end; i++) {
      result.push({
        index: i,
        offsetTop: i * itemHeight,
      });
    }
    return result;
  }, [visibleRange, itemHeight]);

  // Total height for scrollbar
  const totalHeight = useMemo(() => {
    return enabled ? items.length * itemHeight : 'auto';
  }, [items.length, itemHeight, enabled]);

  // Handle scroll events
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);
  }, []);

  // Container props
  const containerProps = {
    ref: containerRef,
    onScroll: handleScroll,
    style: {
      height: containerHeight,
      overflow: 'auto',
    } as React.CSSProperties,
  };

  // Inner container props (holds the positioned items)
  const innerProps = {
    style: {
      height: totalHeight,
      position: 'relative',
    } as React.CSSProperties,
  };

  return {
    visibleItems,
    totalHeight: typeof totalHeight === 'number' ? totalHeight : 0,
    containerProps,
    innerProps,
    scrollTop,
  };
};

/**
 * Hook for virtual scrolling with dynamic item heights
 * More complex but supports variable height items
 */
export const useVirtualScrollDynamic = <T>(
  items: T[],
  getItemHeight: (index: number, item: T) => number,
  containerHeight: number,
  options: { overscan?: number; enabled?: boolean } = {}
) => {
  const { overscan = 5, enabled = true } = options;
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const heightCache = useRef<Map<number, number>>(new Map());

  // Calculate cumulative heights for positioning
  const offsets = useMemo(() => {
    const result: number[] = [0];
    for (let i = 0; i < items.length; i++) {
      const height = getItemHeight(i, items[i]);
      heightCache.current.set(i, height);
      result.push(result[i] + height);
    }
    return result;
  }, [items, getItemHeight]);

  // Find visible range using binary search
  const visibleRange = useMemo(() => {
    if (!enabled || items.length === 0) {
      return { start: 0, end: items.length };
    }

    // Binary search for start index
    let start = 0;
    let end = offsets.length - 1;
    while (start < end) {
      const mid = Math.floor((start + end) / 2);
      if (offsets[mid] < scrollTop) {
        start = mid + 1;
      } else {
        end = mid;
      }
    }
    const startIndex = Math.max(0, start - 1);

    // Find end index
    const visibleEnd = scrollTop + containerHeight;
    let endIndex = startIndex;
    while (endIndex < offsets.length - 1 && offsets[endIndex] < visibleEnd) {
      endIndex++;
    }

    // Add overscan
    const bufferedStart = Math.max(0, startIndex - overscan);
    const bufferedEnd = Math.min(items.length, endIndex + overscan);

    return { start: bufferedStart, end: bufferedEnd };
  }, [scrollTop, containerHeight, offsets, overscan, enabled, items.length]);

  // Calculate visible items with positions
  const visibleItems = useMemo(() => {
    const result = [];
    for (let i = visibleRange.start; i < visibleRange.end; i++) {
      result.push({
        index: i,
        offsetTop: offsets[i],
      });
    }
    return result;
  }, [visibleRange, offsets]);

  const totalHeight = offsets[offsets.length - 1] || 0;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);
  }, []);

  const containerProps = {
    ref: containerRef,
    onScroll: handleScroll,
    style: {
      height: containerHeight,
      overflow: 'auto',
    } as React.CSSProperties,
  };

  const innerProps = {
    style: {
      height: enabled ? totalHeight : 'auto',
      position: 'relative',
    } as React.CSSProperties,
  };

  return {
    visibleItems,
    totalHeight,
    containerProps,
    innerProps,
    scrollTop,
  };
};

export default useVirtualScroll;
