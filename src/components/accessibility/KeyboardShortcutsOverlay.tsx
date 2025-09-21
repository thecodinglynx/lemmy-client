import React, { useEffect, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useFocusManagement } from '../../hooks/useKeyboardShortcuts';

interface KeyboardShortcut {
  keys: string | string[];
  description: string;
  category?: string;
}

interface KeyboardShortcutsOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  shortcuts?: KeyboardShortcut[];
}

const KeyDisplay: React.FC<{ keys: string | string[] }> = ({ keys }) => {
  const keyArray = Array.isArray(keys) ? keys : [keys];

  const formatKey = (key: string): string => {
    // Format keys for display
    const keyMap: Record<string, string> = {
      arrowleft: '←',
      arrowright: '→',
      arrowup: '↑',
      arrowdown: '↓',
      space: 'Space',
      escape: 'Esc',
      backspace: '⌫',
      enter: '↵',
      home: 'Home',
      end: 'End',
      ctrl: 'Ctrl',
      alt: 'Alt',
      shift: 'Shift',
      cmd: 'Cmd',
      meta: 'Cmd',
    };

    return keyMap[key.toLowerCase()] || key;
  };

  const renderKeyCombo = (keyCombo: string) => {
    const parts = keyCombo.split('+').map((part) => part.trim());

    return parts.map((part, index) => (
      <React.Fragment key={part}>
        <kbd className='inline-flex items-center px-2 py-1 text-xs font-mono font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded'>
          {formatKey(part)}
        </kbd>
        {index < parts.length - 1 && (
          <span className='mx-1 text-gray-500 dark:text-gray-400'>+</span>
        )}
      </React.Fragment>
    ));
  };

  return (
    <div className='flex items-center gap-2'>
      {keyArray.map((keyCombo, index) => (
        <React.Fragment key={keyCombo}>
          <div className='flex items-center'>{renderKeyCombo(keyCombo)}</div>
          {index < keyArray.length - 1 && (
            <span className='text-gray-400 dark:text-gray-500'>or</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

const defaultShortcuts: KeyboardShortcut[] = [
  // Navigation
  {
    keys: ['ArrowRight', 'Space'],
    description: 'Next slide',
    category: 'Navigation',
  },
  {
    keys: ['ArrowLeft', 'Backspace'],
    description: 'Previous slide',
    category: 'Navigation',
  },
  { keys: 'Home', description: 'Go to first slide', category: 'Navigation' },
  { keys: 'End', description: 'Go to last slide', category: 'Navigation' },

  // Playback Control
  {
    keys: ['p', 'k'],
    description: 'Play/Pause slideshow',
    category: 'Playback',
  },
  { keys: 'r', description: 'Restart slideshow', category: 'Playback' },

  // Media Control
  { keys: 'ArrowUp', description: 'Volume up', category: 'Media' },
  { keys: 'ArrowDown', description: 'Volume down', category: 'Media' },
  { keys: 'm', description: 'Toggle mute', category: 'Media' },

  // Interface
  { keys: 'f', description: 'Toggle fullscreen', category: 'Interface' },
  {
    keys: 'c',
    description: 'Toggle controls visibility',
    category: 'Interface',
  },
  {
    keys: 'Escape',
    description: 'Exit fullscreen/Close overlays',
    category: 'Interface',
  },

  // Actions
  { keys: 's', description: 'Star/favorite current item', category: 'Actions' },
  { keys: 'i', description: 'Show item information', category: 'Actions' },

  // Navigation
  { keys: ',', description: 'Open settings', category: 'Navigation' },
  {
    keys: ['?', 'h'],
    description: 'Show help (this overlay)',
    category: 'Help',
  },
];

export const KeyboardShortcutsOverlay: React.FC<
  KeyboardShortcutsOverlayProps
> = ({ isVisible, onClose, shortcuts = defaultShortcuts }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const { focusFirst, trapFocus } = useFocusManagement(
    overlayRef as React.RefObject<HTMLElement>
  );

  // Group shortcuts by category
  const shortcutsByCategory = shortcuts.reduce(
    (acc, shortcut) => {
      const category = shortcut.category || 'General';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(shortcut);
      return acc;
    },
    {} as Record<string, KeyboardShortcut[]>
  );

  // Focus management
  useEffect(() => {
    if (isVisible) {
      // Focus the close button when overlay opens
      setTimeout(() => focusFirst(), 100);
    }
  }, [isVisible, focusFirst]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'Tab') {
        trapFocus(event);
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, onClose, trapFocus]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'
      onClick={onClose}
      role='dialog'
      aria-modal='true'
      aria-labelledby='shortcuts-title'
    >
      <div
        ref={overlayRef}
        className='bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700'>
          <h2
            id='shortcuts-title'
            className='text-xl font-semibold text-gray-900 dark:text-white'
          >
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
            aria-label='Close keyboard shortcuts'
          >
            <XMarkIcon className='w-5 h-5' />
          </button>
        </div>

        {/* Content */}
        <div className='p-6 overflow-y-auto max-h-[calc(90vh-180px)]'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            {Object.entries(shortcutsByCategory).map(
              ([category, categoryShortcuts]) => (
                <div key={category} className='space-y-4'>
                  <h3 className='text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2'>
                    {category}
                  </h3>
                  <div className='space-y-3'>
                    {categoryShortcuts.map((shortcut, index) => (
                      <div
                        key={index}
                        className='flex items-center justify-between gap-4'
                      >
                        <span className='text-sm text-gray-700 dark:text-gray-300 flex-1'>
                          {shortcut.description}
                        </span>
                        <KeyDisplay keys={shortcut.keys} />
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>

          {/* Additional Help */}
          <div className='mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
            <h4 className='text-sm font-medium text-blue-900 dark:text-blue-200 mb-2'>
              Accessibility Features
            </h4>
            <ul className='text-sm text-blue-800 dark:text-blue-300 space-y-1'>
              <li>• Use Tab and Shift+Tab to navigate interactive elements</li>
              <li>• Press Enter or Space to activate buttons and links</li>
              <li>
                • Screen reader announcements provide context for content
                changes
              </li>
              <li>
                • High contrast mode available in settings for better visibility
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className='flex justify-end p-6 border-t border-gray-200 dark:border-gray-700'>
          <button
            onClick={onClose}
            className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsOverlay;
