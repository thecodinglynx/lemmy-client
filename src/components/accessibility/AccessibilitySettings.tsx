import React from 'react';
import { useAppStore } from '../../stores/app-store';

interface AccessibilitySettingsProps {
  className?: string;
}

export const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({
  className = '',
}) => {
  const { settings, updateSettings } = useAppStore();

  const handleAccessibilityChange = (
    key: keyof typeof settings.accessibility,
    value: any
  ) => {
    updateSettings({
      accessibility: {
        ...settings.accessibility,
        [key]: value,
      },
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-4'>
          Accessibility Settings
        </h3>
        <p className='text-sm text-gray-600 dark:text-gray-400 mb-6'>
          Customize the interface to better suit your accessibility needs.
        </p>
      </div>

      {/* High Contrast Mode */}
      <div className='flex items-center justify-between'>
        <div className='flex-1'>
          <label
            htmlFor='high-contrast'
            className='text-sm font-medium text-gray-700 dark:text-gray-300'
          >
            High Contrast Mode
          </label>
          <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
            Increases contrast for better visibility
          </p>
        </div>
        <label className='relative inline-flex items-center cursor-pointer'>
          <input
            id='high-contrast'
            type='checkbox'
            className='sr-only'
            checked={settings.accessibility.highContrast}
            onChange={(e) =>
              handleAccessibilityChange('highContrast', e.target.checked)
            }
          />
          <div
            className={`w-11 h-6 rounded-full transition-colors ${
              settings.accessibility.highContrast
                ? 'bg-blue-600'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${
                settings.accessibility.highContrast
                  ? 'translate-x-6'
                  : 'translate-x-1'
              } mt-1`}
            />
          </div>
        </label>
      </div>

      {/* Reduced Motion */}
      <div className='flex items-center justify-between'>
        <div className='flex-1'>
          <label
            htmlFor='reduced-motion'
            className='text-sm font-medium text-gray-700 dark:text-gray-300'
          >
            Reduce Motion
          </label>
          <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
            Minimizes animations and transitions
          </p>
        </div>
        <label className='relative inline-flex items-center cursor-pointer'>
          <input
            id='reduced-motion'
            type='checkbox'
            className='sr-only'
            checked={settings.accessibility.reducedMotion}
            onChange={(e) =>
              handleAccessibilityChange('reducedMotion', e.target.checked)
            }
          />
          <div
            className={`w-11 h-6 rounded-full transition-colors ${
              settings.accessibility.reducedMotion
                ? 'bg-blue-600'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${
                settings.accessibility.reducedMotion
                  ? 'translate-x-6'
                  : 'translate-x-1'
              } mt-1`}
            />
          </div>
        </label>
      </div>

      {/* Text Size */}
      <div>
        <label
          htmlFor='text-size'
          className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
        >
          Text Size
        </label>
        <p className='text-xs text-gray-500 dark:text-gray-400 mb-3'>
          Adjust text size for better readability
        </p>
        <select
          id='text-size'
          value={settings.accessibility.textSize}
          onChange={(e) =>
            handleAccessibilityChange(
              'textSize',
              e.target.value as 'small' | 'medium' | 'large'
            )
          }
          className='w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
        >
          <option value='small'>Small</option>
          <option value='medium'>Medium (Default)</option>
          <option value='large'>Large</option>
        </select>
      </div>

      {/* Screen Reader Announcements */}
      <div className='flex items-center justify-between'>
        <div className='flex-1'>
          <label
            htmlFor='screen-reader'
            className='text-sm font-medium text-gray-700 dark:text-gray-300'
          >
            Screen Reader Announcements
          </label>
          <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
            Provides audio descriptions of content changes
          </p>
        </div>
        <label className='relative inline-flex items-center cursor-pointer'>
          <input
            id='screen-reader'
            type='checkbox'
            className='sr-only'
            checked={settings.accessibility.screenReaderAnnouncements}
            onChange={(e) =>
              handleAccessibilityChange(
                'screenReaderAnnouncements',
                e.target.checked
              )
            }
          />
          <div
            className={`w-11 h-6 rounded-full transition-colors ${
              settings.accessibility.screenReaderAnnouncements
                ? 'bg-blue-600'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${
                settings.accessibility.screenReaderAnnouncements
                  ? 'translate-x-6'
                  : 'translate-x-1'
              } mt-1`}
            />
          </div>
        </label>
      </div>

      {/* Keyboard Navigation Help */}
      <div className='p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
        <h4 className='text-sm font-medium text-blue-900 dark:text-blue-200 mb-2'>
          Keyboard Navigation
        </h4>
        <p className='text-xs text-blue-800 dark:text-blue-300 mb-3'>
          This application is fully keyboard accessible. Press{' '}
          <kbd className='px-1 py-0.5 text-xs bg-blue-100 dark:bg-blue-800 rounded'>
            ?
          </kbd>{' '}
          or{' '}
          <kbd className='px-1 py-0.5 text-xs bg-blue-100 dark:bg-blue-800 rounded'>
            h
          </kbd>{' '}
          to view all keyboard shortcuts.
        </p>
        <div className='text-xs text-blue-800 dark:text-blue-300 space-y-1'>
          <div>
            • Use{' '}
            <kbd className='px-1 py-0.5 bg-blue-100 dark:bg-blue-800 rounded'>
              Tab
            </kbd>{' '}
            to navigate between interactive elements
          </div>
          <div>
            • Use{' '}
            <kbd className='px-1 py-0.5 bg-blue-100 dark:bg-blue-800 rounded'>
              Space
            </kbd>{' '}
            or{' '}
            <kbd className='px-1 py-0.5 bg-blue-100 dark:bg-blue-800 rounded'>
              Enter
            </kbd>{' '}
            to activate buttons
          </div>
          <div>• Use arrow keys to navigate slideshow content</div>
          <div>
            • Press{' '}
            <kbd className='px-1 py-0.5 bg-blue-100 dark:bg-blue-800 rounded'>
              Escape
            </kbd>{' '}
            to close overlays or exit fullscreen
          </div>
        </div>
      </div>

      {/* Performance Impact Notice */}
      <div className='p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg'>
        <h4 className='text-sm font-medium text-yellow-900 dark:text-yellow-200 mb-2'>
          Performance Impact
        </h4>
        <p className='text-xs text-yellow-800 dark:text-yellow-300'>
          Some accessibility features may impact performance on older devices.
          If you experience slow performance, consider disabling reduced motion
          or high contrast mode.
        </p>
      </div>
    </div>
  );
};

export default AccessibilitySettings;
