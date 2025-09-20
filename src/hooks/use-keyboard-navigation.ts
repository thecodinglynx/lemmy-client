/**
 * useKeyboardNavigation - Hook for slideshow keyboard navigation
 *
 * Features:
 * - Slideshow-specific keyboard shortcuts
 * - Integration with KeyboardManager
 * - Context-aware shortcut registration
 * - Accessibility support
 */

import { useEffect, useCallback } from 'react';
import { keyboardManager } from '../utils/keyboard-manager';
import type { KeyBinding } from '../utils/keyboard-manager';

export interface KeyboardNavigationConfig {
  onPlay?: () => void;
  onPause?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onToggleFullscreen?: () => void;
  onStar?: () => void;
  onOpenSettings?: () => void;
  onVolumeUp?: () => void;
  onVolumeDown?: () => void;
  onMute?: () => void;
  onSetTiming?: (seconds: number) => void;
  isPlaying?: boolean;
  context?: string;
}

export function useKeyboardNavigation(config: KeyboardNavigationConfig) {
  const {
    onPlay,
    onPause,
    onNext,
    onPrevious,
    onToggleFullscreen,
    onStar,
    onOpenSettings,
    onVolumeUp,
    onVolumeDown,
    onMute,
    onSetTiming,
    isPlaying = false,
    context = 'slideshow',
  } = config;

  // Register slideshow context
  useEffect(() => {
    keyboardManager.registerContext({
      name: context,
      priority: 1,
      isActive: () => true, // Always active for slideshow
    });
  }, [context]);

  // Play/Pause toggle handler
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      onPause?.();
    } else {
      onPlay?.();
    }
  }, [isPlaying, onPlay, onPause]);

  // Register keyboard shortcuts
  useEffect(() => {
    const bindings: KeyBinding[] = [];

    // Space: Play/Pause
    if (onPlay || onPause) {
      bindings.push({
        key: ' ',
        context,
        description: 'Play/pause slideshow',
        action: handlePlayPause,
      });
    }

    // Arrow Left: Previous
    if (onPrevious) {
      bindings.push({
        key: 'ArrowLeft',
        context,
        description: 'Go to previous item',
        action: onPrevious,
      });
    }

    // Arrow Right: Next
    if (onNext) {
      bindings.push({
        key: 'ArrowRight',
        context,
        description: 'Go to next item',
        action: onNext,
      });
    }

    // Arrow Up: Volume Up
    if (onVolumeUp) {
      bindings.push({
        key: 'ArrowUp',
        context,
        description: 'Increase volume',
        action: onVolumeUp,
      });
    }

    // Arrow Down: Volume Down
    if (onVolumeDown) {
      bindings.push({
        key: 'ArrowDown',
        context,
        description: 'Decrease volume',
        action: onVolumeDown,
      });
    }

    // F: Fullscreen
    if (onToggleFullscreen) {
      bindings.push({
        key: 'f',
        context,
        description: 'Toggle fullscreen',
        action: onToggleFullscreen,
      });
    }

    // S: Star/Favorite
    if (onStar) {
      bindings.push({
        key: 's',
        context,
        description: 'Star/favorite current item',
        action: onStar,
      });
    }

    // Comma: Settings
    if (onOpenSettings) {
      bindings.push({
        key: ',',
        context,
        description: 'Open settings',
        action: onOpenSettings,
      });
    }

    // M: Mute
    if (onMute) {
      bindings.push({
        key: 'm',
        context,
        description: 'Toggle mute',
        action: onMute,
      });
    }

    // Numbers 1-9: Set timing
    if (onSetTiming) {
      for (let i = 1; i <= 9; i++) {
        bindings.push({
          key: i.toString(),
          context,
          description: `Set slideshow timing to ${i * 5} seconds`,
          action: () => onSetTiming(i * 5),
        });
      }
    }

    // Register all bindings
    bindings.forEach((binding) => keyboardManager.register(binding));

    // Cleanup function to unregister bindings
    return () => {
      bindings.forEach((binding) => keyboardManager.unregister(binding));
    };
  }, [
    context,
    handlePlayPause,
    onNext,
    onPrevious,
    onToggleFullscreen,
    onStar,
    onOpenSettings,
    onVolumeUp,
    onVolumeDown,
    onMute,
    onSetTiming,
  ]);

  // Return keyboard manager methods for advanced usage
  return {
    registerShortcut: (binding: KeyBinding) =>
      keyboardManager.register(binding),
    unregisterShortcut: (binding: Partial<KeyBinding>) =>
      keyboardManager.unregister(binding),
    setEnabled: (enabled: boolean) => keyboardManager.setEnabled(enabled),
    getShortcuts: () => keyboardManager.getShortcuts(),
  };
}
