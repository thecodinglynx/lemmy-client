import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  /** Page load time in milliseconds */
  pageLoadTime?: number;
  /** Time to first byte */
  ttfb?: number;
  /** First contentful paint */
  fcp?: number;
  /** Largest contentful paint */
  lcp?: number;
  /** Cumulative layout shift */
  cls?: number;
  /** Component render time */
  renderTime?: number;
}

interface UsePerformanceOptions {
  /** Enable/disable performance monitoring */
  enabled?: boolean;
  /** Component name for identification */
  componentName?: string;
  /** Callback when metrics are collected */
  onMetrics?: (metrics: PerformanceMetrics) => void;
}

/**
 * Hook for monitoring and reporting performance metrics
 * Tracks page load times, Core Web Vitals, and component render performance
 */
export const usePerformanceMonitoring = (
  options: UsePerformanceOptions = {}
) => {
  const { enabled = true, componentName = 'Unknown', onMetrics } = options;
  const renderStartTime = useRef<number>(Date.now());
  const metricsRef = useRef<PerformanceMetrics>({});

  // Measure component render time
  const measureRenderTime = useCallback(() => {
    if (!enabled) return;

    const renderTime = Date.now() - renderStartTime.current;
    metricsRef.current.renderTime = renderTime;

    if (renderTime > 100) {
      console.warn(`Slow render detected in ${componentName}: ${renderTime}ms`);
    }
  }, [enabled, componentName]);

  // Collect Core Web Vitals
  const collectWebVitals = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Use Performance Observer if available
    if ('PerformanceObserver' in window) {
      try {
        // Largest Contentful Paint (LCP)
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          metricsRef.current.lcp = lastEntry.startTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Contentful Paint (FCP)
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcpEntry = entries.find(
            (entry) => entry.name === 'first-contentful-paint'
          );
          if (fcpEntry) {
            metricsRef.current.fcp = fcpEntry.startTime;
          }
        });
        fcpObserver.observe({ entryTypes: ['paint'] });

        // Cumulative Layout Shift (CLS)
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          metricsRef.current.cls = clsValue;
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // Navigation timing
        const navigationEntries = performance.getEntriesByType(
          'navigation'
        ) as PerformanceNavigationTiming[];
        if (navigationEntries.length > 0) {
          const nav = navigationEntries[0];
          metricsRef.current.pageLoadTime = nav.loadEventEnd - nav.fetchStart;
          metricsRef.current.ttfb = nav.responseStart - nav.fetchStart;
        }
      } catch (error) {
        console.warn('Performance Observer not supported:', error);
      }
    }

    // Fallback to performance.timing for older browsers
    if ('timing' in performance) {
      const timing = performance.timing;
      metricsRef.current.pageLoadTime =
        timing.loadEventEnd - timing.navigationStart;
      metricsRef.current.ttfb = timing.responseStart - timing.navigationStart;
    }
  }, [enabled]);

  // Report metrics
  const reportMetrics = useCallback(() => {
    if (!enabled) return;

    const metrics = { ...metricsRef.current };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`Performance Metrics - ${componentName}`);
      console.log(
        'Render Time:',
        metrics.renderTime ? `${metrics.renderTime}ms` : 'N/A'
      );
      console.log(
        'Page Load Time:',
        metrics.pageLoadTime ? `${metrics.pageLoadTime}ms` : 'N/A'
      );
      console.log('TTFB:', metrics.ttfb ? `${metrics.ttfb}ms` : 'N/A');
      console.log('FCP:', metrics.fcp ? `${metrics.fcp}ms` : 'N/A');
      console.log('LCP:', metrics.lcp ? `${metrics.lcp}ms` : 'N/A');
      console.log('CLS:', metrics.cls ? metrics.cls.toFixed(4) : 'N/A');
      console.groupEnd();
    }

    // Call user-provided callback
    onMetrics?.(metrics);

    // In a real app, you would send this to your analytics service
    // analytics.track('performance_metrics', {
    //   component: componentName,
    //   ...metrics
    // });
  }, [enabled, componentName, onMetrics]);

  // Initialize monitoring
  useEffect(() => {
    if (!enabled) return;

    renderStartTime.current = Date.now();
    collectWebVitals();

    // Measure render time after component mounts
    const timeoutId = setTimeout(measureRenderTime, 0);

    // Report metrics after a delay to capture all vitals
    const reportTimeoutId = setTimeout(reportMetrics, 5000);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(reportTimeoutId);
    };
  }, [enabled, collectWebVitals, measureRenderTime, reportMetrics]);

  // Manual trigger for reporting metrics
  const triggerReport = useCallback(() => {
    measureRenderTime();
    reportMetrics();
  }, [measureRenderTime, reportMetrics]);

  return {
    metrics: metricsRef.current,
    triggerReport,
  };
};

/**
 * Hook for measuring function execution time
 */
export const usePerformanceTimer = (enabled: boolean = true) => {
  const measure = useCallback(
    <T extends any[], R>(
      fn: (...args: T) => R,
      name: string = 'Operation'
    ): ((...args: T) => R) => {
      if (!enabled) return fn;

      return (...args: T): R => {
        const start = performance.now();
        const result = fn(...args);
        const end = performance.now();
        const duration = end - start;

        if (duration > 10) {
          console.warn(`Slow operation ${name}: ${duration.toFixed(2)}ms`);
        }

        return result;
      };
    },
    [enabled]
  );

  const measureAsync = useCallback(
    <T extends any[], R>(
      fn: (...args: T) => Promise<R>,
      name: string = 'Async Operation'
    ): ((...args: T) => Promise<R>) => {
      if (!enabled) return fn;

      return async (...args: T): Promise<R> => {
        const start = performance.now();
        const result = await fn(...args);
        const end = performance.now();
        const duration = end - start;

        if (duration > 100) {
          console.warn(
            `Slow async operation ${name}: ${duration.toFixed(2)}ms`
          );
        }

        return result;
      };
    },
    [enabled]
  );

  return { measure, measureAsync };
};

export default usePerformanceMonitoring;
