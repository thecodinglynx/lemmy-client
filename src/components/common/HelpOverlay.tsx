/**
 * HelpOverlay - Keyboard shortcuts help overlay
 *
 * Features:
 * - Display all available keyboard shortcuts
 * - Context-aware shortcut filtering
 * - Accessible modal dialog
 * - Clean, organized layout
 * - Search functionality for shortcuts
 */

import React, { useState, useEffect, useMemo } from 'react';
import { keyboardManager } from '../../utils/keyboard-manager';
import type { KeyBinding } from '../../utils/keyboard-manager';

interface HelpOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  className?: string;
}

export const HelpOverlay: React.FC<HelpOverlayProps> = ({
  isVisible,
  onClose,
  className = '',
}) => {
  const [shortcuts, setShortcuts] = useState<KeyBinding[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Load shortcuts when overlay becomes visible
  useEffect(() => {
    if (isVisible) {
      setShortcuts(keyboardManager.getShortcuts());
    }
  }, [isVisible]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isVisible) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isVisible, onClose]);

  // Filter shortcuts based on search term
  const filteredShortcuts = useMemo(() => {
    if (!searchTerm) return shortcuts;

    return shortcuts.filter(
      (shortcut) =>
        shortcut.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shortcut.key.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [shortcuts, searchTerm]);

  // Group shortcuts by context
  const groupedShortcuts = useMemo(() => {
    const groups: Record<string, KeyBinding[]> = {};

    filteredShortcuts.forEach((shortcut) => {
      const context = shortcut.context || 'Global';
      const contextKey = Array.isArray(context) ? context[0] : context;

      if (!groups[contextKey]) {
        groups[contextKey] = [];
      }
      groups[contextKey].push(shortcut);
    });

    return groups;
  }, [filteredShortcuts]);

  // Format key combination for display
  const formatKeyCombo = (binding: KeyBinding): string => {
    const keys = [];

    if (binding.metaKey) keys.push('⌘');
    if (binding.ctrlKey) keys.push('Ctrl');
    if (binding.altKey) keys.push('Alt');
    if (binding.shiftKey) keys.push('Shift');

    // Format special keys
    let key = binding.key;
    const keyMappings: Record<string, string> = {
      ' ': 'Space',
      ArrowLeft: '←',
      ArrowRight: '→',
      ArrowUp: '↑',
      ArrowDown: '↓',
      Escape: 'Esc',
    };

    key = keyMappings[key] || key;
    keys.push(key);

    return keys.join(' + ');
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${className}`}
      onClick={onClose}
      role='dialog'
      aria-modal='true'
      aria-labelledby='help-title'
    >
      <div
        className='bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600'>
          <div className='flex items-center justify-between'>
            <h2
              id='help-title'
              className='text-xl font-semibold text-gray-900 dark:text-white'
            >
              Keyboard Shortcuts
            </h2>
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'
              aria-label='Close help'
            >
              <svg
                className='w-6 h-6'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className='mt-4'>
            <input
              type='text'
              placeholder='Search shortcuts...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>
        </div>

        {/* Content */}
        <div className='p-6 overflow-y-auto max-h-[calc(90vh-12rem)]'>
          {Object.keys(groupedShortcuts).length === 0 ? (
            <div className='text-center text-gray-500 dark:text-gray-400 py-8'>
              {searchTerm
                ? 'No shortcuts found matching your search.'
                : 'No shortcuts available.'}
            </div>
          ) : (
            <div className='space-y-6'>
              {Object.entries(groupedShortcuts).map(
                ([context, contextShortcuts]) => (
                  <div key={context}>
                    <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-3 capitalize'>
                      {context} Shortcuts
                    </h3>
                    <div className='grid gap-2 md:grid-cols-2'>
                      {contextShortcuts.map((shortcut, index) => (
                        <div
                          key={`${context}-${index}`}
                          className='flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'
                        >
                          <span className='text-gray-700 dark:text-gray-300 text-sm'>
                            {shortcut.description}
                          </span>
                          <div className='flex items-center space-x-1'>
                            {formatKeyCombo(shortcut)
                              .split(' + ')
                              .map((key, keyIndex) => (
                                <React.Fragment key={keyIndex}>
                                  {keyIndex > 0 && (
                                    <span className='text-gray-400 text-xs'>
                                      +
                                    </span>
                                  )}
                                  <kbd className='px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded shadow-sm'>
                                    {key}
                                  </kbd>
                                </React.Fragment>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600'>
          <p className='text-sm text-gray-600 dark:text-gray-400 text-center'>
            Press{' '}
            <kbd className='px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded shadow-sm'>
              H
            </kbd>{' '}
            anytime to toggle this help overlay
          </p>
        </div>
      </div>
    </div>
  );
};

export default HelpOverlay;
