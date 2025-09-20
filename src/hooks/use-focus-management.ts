/**
 * useFocusManagement - Hook for accessibility focus management
 *
 * Features:
 * - Focus trapping in modals and overlays
 * - Focus restoration after dialogs close
 * - Skip links for main navigation
 * - Visual focus indicators
 * - Logical tab order management
 */

import { useEffect, useRef, useCallback } from 'react';

export interface FocusOptions {
  trapFocus?: boolean;
  restoreFocus?: boolean;
  autoFocus?: boolean;
  skipLinks?: boolean;
}

export function useFocusManagement(
  isActive: boolean,
  options: FocusOptions = {}
) {
  const containerRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const {
    trapFocus = false,
    restoreFocus = false,
    autoFocus = false,
    skipLinks = false,
  } = options;

  // Get focusable elements within a container
  const getFocusableElements = useCallback(
    (container: HTMLElement): HTMLElement[] => {
      const focusableSelectors = [
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]',
        'audio[controls]',
        'video[controls]',
        'summary',
      ].join(', ');

      return Array.from(container.querySelectorAll(focusableSelectors)).filter(
        (element): element is HTMLElement => {
          // Check if element is visible and not disabled
          return (
            element instanceof HTMLElement &&
            !element.hidden &&
            element.offsetParent !== null &&
            !element.hasAttribute('disabled') &&
            !element.getAttribute('aria-hidden')
          );
        }
      );
    },
    []
  );

  // Handle focus trapping
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!trapFocus || !containerRef.current || event.key !== 'Tab') return;

      const focusableElements = getFocusableElements(containerRef.current);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab: moving backwards
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: moving forwards
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    },
    [trapFocus, getFocusableElements]
  );

  // Setup focus management when active
  useEffect(() => {
    if (!isActive) return;

    // Store current focus for restoration
    if (restoreFocus) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }

    // Auto-focus first focusable element
    if (autoFocus && containerRef.current) {
      const focusableElements = getFocusableElements(containerRef.current);
      if (focusableElements.length > 0) {
        // Small delay to ensure element is rendered
        setTimeout(() => {
          focusableElements[0].focus();
        }, 100);
      }
    }

    // Add focus trap listener
    if (trapFocus) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (trapFocus) {
        document.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [
    isActive,
    autoFocus,
    trapFocus,
    handleKeyDown,
    getFocusableElements,
    restoreFocus,
  ]);

  // Restore focus when becoming inactive
  useEffect(() => {
    return () => {
      if (restoreFocus && previousFocusRef.current) {
        // Small delay to ensure the element is still in the DOM
        setTimeout(() => {
          if (
            previousFocusRef.current &&
            document.contains(previousFocusRef.current)
          ) {
            previousFocusRef.current.focus();
          }
        }, 100);
      }
    };
  }, [isActive, restoreFocus]);

  // Create skip link properties
  const getSkipLinkProps = useCallback(
    (targetId: string, text: string = 'Skip to main content') => {
      if (!skipLinks) return null;

      return {
        href: `#${targetId}`,
        className:
          'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded focus:text-sm focus:font-medium focus:shadow-lg',
        onFocus: (e: React.FocusEvent<HTMLAnchorElement>) => {
          // Ensure skip link is visible when focused
          e.currentTarget.style.position = 'absolute';
          e.currentTarget.style.top = '1rem';
          e.currentTarget.style.left = '1rem';
          e.currentTarget.style.zIndex = '50';
        },
        children: text,
      };
    },
    [skipLinks]
  );

  // Focus first element in container
  const focusFirst = useCallback(() => {
    if (!containerRef.current) return false;

    const focusableElements = getFocusableElements(containerRef.current);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
      return true;
    }
    return false;
  }, [getFocusableElements]);

  // Focus last element in container
  const focusLast = useCallback(() => {
    if (!containerRef.current) return false;

    const focusableElements = getFocusableElements(containerRef.current);
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
      return true;
    }
    return false;
  }, [getFocusableElements]);

  return {
    containerRef,
    getSkipLinkProps,
    focusFirst,
    focusLast,
    getFocusableElements: () =>
      containerRef.current ? getFocusableElements(containerRef.current) : [],
  };
}
