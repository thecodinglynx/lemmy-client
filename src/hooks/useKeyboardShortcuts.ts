import { useEffect, useCallback, useRef } from 'react';

interface KeyboardShortcut {
  /** Key combination (e.g., 'Space', 'ArrowRight', 'Ctrl+S') */
  keys: string | string[];
  /** Description of what the shortcut does */
  description: string;
  /** Function to execute when shortcut is pressed */
  action: () => void;
  /** Whether the shortcut should prevent default browser behavior */
  preventDefault?: boolean;
  /** Whether the shortcut requires exact modifier match */
  exact?: boolean;
  /** Category for help display */
  category?: string;
}

interface UseKeyboardShortcutsOptions {
  /** Enable/disable all keyboard shortcuts */
  enabled?: boolean;
  /** Element to attach listeners to (defaults to document) */
  target?: HTMLElement | Document;
  /** Whether to capture events during capture phase */
  capture?: boolean;
}

/**
 * Advanced keyboard shortcuts hook with accessibility features
 * Supports complex key combinations, categories, and help display
 */
export const useKeyboardShortcuts = (
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) => {
  const { enabled = true, target = document, capture = false } = options;
  const shortcutsRef = useRef<Map<string, KeyboardShortcut>>(new Map());

  // Normalize key combinations
  const normalizeKey = useCallback((key: string): string => {
    return key
      .replace(/\s+/g, '')
      .toLowerCase()
      .replace('control', 'ctrl')
      .replace('command', 'cmd')
      .replace('option', 'alt');
  }, []);

  // Parse key event to standardized format
  const parseKeyEvent = useCallback((event: KeyboardEvent): string => {
    const parts: string[] = [];

    if (event.ctrlKey || event.metaKey) parts.push('ctrl');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');

    let key = event.key.toLowerCase();
    if (key === ' ') key = 'space';
    if (key === 'escape') key = 'esc';
    if (key.startsWith('arrow')) key = key.replace('arrow', '');

    parts.push(key);

    return parts.join('+');
  }, []);

  // Update shortcuts map when shortcuts change
  useEffect(() => {
    const newMap = new Map<string, KeyboardShortcut>();

    shortcuts.forEach((shortcut) => {
      const keys = Array.isArray(shortcut.keys)
        ? shortcut.keys
        : [shortcut.keys];
      keys.forEach((key) => {
        const normalizedKey = normalizeKey(key);
        newMap.set(normalizedKey, shortcut);
      });
    });

    shortcutsRef.current = newMap;
  }, [shortcuts, normalizeKey]);

  // Handle keyboard events
  const handleKeydown = useCallback(
    (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;
      if (!enabled) return;

      // Skip if user is typing in an input field
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }

      const keyCombo = parseKeyEvent(keyboardEvent);
      const shortcut = shortcutsRef.current.get(keyCombo);

      if (shortcut) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }

        try {
          shortcut.action();
        } catch (error) {
          console.error('Error executing keyboard shortcut:', error);
        }
      }
    },
    [enabled, parseKeyEvent]
  );

  // Attach/detach event listeners
  useEffect(() => {
    if (!enabled || !target) return;

    target.addEventListener('keydown', handleKeydown, capture);

    return () => {
      target.removeEventListener('keydown', handleKeydown, capture);
    };
  }, [enabled, target, handleKeydown, capture]);

  // Get shortcuts organized by category
  const getShortcutsByCategory = useCallback(() => {
    const categories: Record<string, KeyboardShortcut[]> = {};

    shortcuts.forEach((shortcut) => {
      const category = shortcut.category || 'General';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(shortcut);
    });

    return categories;
  }, [shortcuts]);

  // Check if a specific shortcut is active
  const isShortcutActive = useCallback(
    (keys: string | string[]): boolean => {
      const keysArray = Array.isArray(keys) ? keys : [keys];
      return keysArray.some((key) =>
        shortcutsRef.current.has(normalizeKey(key))
      );
    },
    [normalizeKey]
  );

  return {
    shortcuts: shortcutsRef.current,
    getShortcutsByCategory,
    isShortcutActive,
    enabled,
  };
};

/**
 * Hook for slideshow-specific keyboard navigation
 */
export const useSlideshowKeyboardShortcuts = () => {
  const shortcuts: KeyboardShortcut[] = [
    // Navigation
    {
      keys: ['ArrowRight', 'Space'],
      description: 'Next slide',
      action: () => {
        // TODO: Implement next slide action
        console.log('Next slide');
      },
      category: 'Navigation',
    },
    {
      keys: ['ArrowLeft', 'Backspace'],
      description: 'Previous slide',
      action: () => {
        // TODO: Implement previous slide action
        console.log('Previous slide');
      },
      category: 'Navigation',
    },
    {
      keys: ['Home'],
      description: 'Go to first slide',
      action: () => {
        // TODO: Implement go to first slide
        console.log('First slide');
      },
      category: 'Navigation',
    },
    {
      keys: ['End'],
      description: 'Go to last slide',
      action: () => {
        // TODO: Implement go to last slide
        console.log('Last slide');
      },
      category: 'Navigation',
    },

    // Playback Control
    {
      keys: ['p', 'k'],
      description: 'Play/Pause slideshow',
      action: () => {
        // TODO: Implement play/pause toggle
        console.log('Toggle play/pause');
      },
      category: 'Playback',
    },
    {
      keys: ['r'],
      description: 'Restart slideshow',
      action: () => {
        // TODO: Implement restart
        console.log('Restart slideshow');
      },
      category: 'Playback',
    },

    // Volume Control (for videos)
    {
      keys: ['ArrowUp'],
      description: 'Volume up',
      action: () => {
        // TODO: Implement volume up
        console.log('Volume up');
      },
      category: 'Media',
    },
    {
      keys: ['ArrowDown'],
      description: 'Volume down',
      action: () => {
        // TODO: Implement volume down
        console.log('Volume down');
      },
      category: 'Media',
    },
    {
      keys: ['m'],
      description: 'Toggle mute',
      action: () => {
        // TODO: Implement mute toggle
        console.log('Toggle mute');
      },
      category: 'Media',
    },

    // Interface
    {
      keys: ['f'],
      description: 'Toggle fullscreen',
      action: () => {
        // TODO: Implement fullscreen toggle
        console.log('Toggle fullscreen');
      },
      category: 'Interface',
    },
    {
      keys: ['c'],
      description: 'Toggle controls visibility',
      action: () => {
        // TODO: Implement controls toggle
        console.log('Toggle controls');
      },
      category: 'Interface',
    },
    {
      keys: ['s'],
      description: 'Star/favorite current item',
      action: () => {
        // TODO: Implement star toggle
        console.log('Toggle star');
      },
      category: 'Actions',
    },
    {
      keys: ['i'],
      description: 'Show item information',
      action: () => {
        // TODO: Implement info display
        console.log('Show info');
      },
      category: 'Actions',
    },

    // Navigation to different views
    {
      keys: [','],
      description: 'Open settings',
      action: () => {
        window.location.href = '/settings';
      },
      category: 'Navigation',
    },
    {
      keys: ['?', 'h'],
      description: 'Show help/shortcuts',
      action: () => {
        // TODO: Implement help overlay toggle
        console.log('Show help');
      },
      category: 'Help',
    },
    {
      keys: ['Escape'],
      description: 'Close overlays/Exit fullscreen',
      action: () => {
        // TODO: Implement escape actions
        console.log('Escape');
      },
      category: 'Interface',
    },
  ];

  return useKeyboardShortcuts(shortcuts, {
    enabled: true,
  });
};

/**
 * Hook for accessible focus management
 */
export const useFocusManagement = (
  containerRef: React.RefObject<HTMLElement>
) => {
  const focusableSelectors = [
    'button',
    '[href]',
    'input',
    'select',
    'textarea',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];

    const elements = containerRef.current.querySelectorAll(focusableSelectors);
    return Array.from(elements).filter(
      (el): el is HTMLElement =>
        el instanceof HTMLElement &&
        !el.hasAttribute('disabled') &&
        el.offsetParent !== null // Visible elements only
    );
  }, [focusableSelectors]);

  const focusFirst = useCallback(() => {
    const elements = getFocusableElements();
    if (elements.length > 0) {
      elements[0].focus();
    }
  }, [getFocusableElements]);

  const focusLast = useCallback(() => {
    const elements = getFocusableElements();
    if (elements.length > 0) {
      elements[elements.length - 1].focus();
    }
  }, [getFocusableElements]);

  const trapFocus = useCallback(
    (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const elements = getFocusableElements();
      if (elements.length === 0) return;

      const firstElement = elements[0];
      const lastElement = elements[elements.length - 1];
      const activeElement = document.activeElement as HTMLElement;

      if (event.shiftKey) {
        // Shift + Tab
        if (activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    },
    [getFocusableElements]
  );

  return {
    getFocusableElements,
    focusFirst,
    focusLast,
    trapFocus,
  };
};

export default useKeyboardShortcuts;
