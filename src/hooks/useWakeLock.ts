import { useEffect, useRef } from 'react';
import { useAppStore } from '@stores/app-store';

/**
 * useWakeLock
 * Requests a screen wake lock (if supported) while `active` is true.
 * Automatically releases on component unmount, when `active` becomes false,
 * or when the document becomes hidden. Re-acquires on visibility change.
 * Provides fallback behavior if Wake Lock API is unsupported.
 */
export function useWakeLock(active: boolean) {
  const wakeLockRef = useRef<any>(null);
  const fallbackIntervalRef = useRef<number | null>(null);
  const addNotification = useAppStore((s) => s.addNotification);

  useEffect(() => {
    if (!active) {
      release();
      return;
    }

    let cancelled = false;

    async function request() {
      if (cancelled) return;
      try {
        if ('wakeLock' in navigator && (navigator as any).wakeLock?.request) {
          wakeLockRef.current = await (navigator as any).wakeLock.request(
            'screen'
          );
          addNotification('Screen wake lock acquired', 'info');
          wakeLockRef.current.addEventListener('release', () => {
            if (!document.hidden) {
              // Attempt re-acquire if still active
              request().catch(() => {});
            }
          });
        } else {
          // Fallback: periodically play a no-op to hint activity (very mild)
          if (fallbackIntervalRef.current) {
            window.clearInterval(fallbackIntervalRef.current);
          }
          fallbackIntervalRef.current = window.setInterval(() => {
            window.dispatchEvent(new Event('mousemove'));
          }, 60000); // once per minute
          addNotification(
            'Wake Lock not supported; using passive fallback',
            'warning'
          );
        }
      } catch (err) {
        console.warn('[useWakeLock] Failed to acquire wake lock', err);
        addNotification('Failed to acquire wake lock', 'warning');
      }
    }

    function release() {
      try {
        if (wakeLockRef.current) {
          wakeLockRef.current.release?.();
          wakeLockRef.current = null;
          addNotification('Screen wake lock released', 'info');
        }
        if (fallbackIntervalRef.current) {
          window.clearInterval(fallbackIntervalRef.current);
          fallbackIntervalRef.current = null;
        }
      } catch (e) {
        console.warn('[useWakeLock] Release error', e);
      }
    }

    // Visibility change handler: re-request if needed
    const handleVisibility = () => {
      if (document.hidden) {
        // Let it release naturally; some browsers auto-release
        release();
      } else if (active) {
        request();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    request();

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      release();
    };
  }, [active, addNotification]);
}
