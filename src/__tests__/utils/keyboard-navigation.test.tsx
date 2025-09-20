/**
 * Test for Keyboard Navigation and Management System
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { keyboardManager } from '../../utils/keyboard-manager';
import { useKeyboardNavigation } from '../../hooks/use-keyboard-navigation';
import HelpOverlay from '../../components/common/HelpOverlay';
import React from 'react';

// Test component for useKeyboardNavigation hook
const TestKeyboardComponent: React.FC<{
  onPlay?: () => void;
  onPause?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onToggleFullscreen?: () => void;
  onStar?: () => void;
  onSetTiming?: (seconds: number) => void;
  isPlaying?: boolean;
}> = (props) => {
  useKeyboardNavigation(props);

  return (
    <div data-testid='keyboard-test-component'>
      <p>Keyboard test component</p>
      <input data-testid='test-input' placeholder='Test input' />
    </div>
  );
};

describe('KeyboardManager', () => {
  beforeEach(() => {
    // Clear any existing bindings
    keyboardManager.destroy();
  });

  afterEach(() => {
    // Clean up after each test
    keyboardManager.destroy();
  });

  it('registers and executes keyboard shortcuts', () => {
    const mockAction = vi.fn();

    keyboardManager.register({
      key: 'k',
      description: 'Test shortcut',
      action: mockAction,
    });

    // Simulate keydown event
    fireEvent.keyDown(document, { key: 'k' });

    expect(mockAction).toHaveBeenCalled();
  });

  it('handles key combinations with modifiers', () => {
    const mockAction = vi.fn();

    keyboardManager.register({
      key: 's',
      ctrlKey: true,
      description: 'Save with Ctrl+S',
      action: mockAction,
    });

    // Simulate Ctrl+S
    fireEvent.keyDown(document, { key: 's', ctrlKey: true });
    expect(mockAction).toHaveBeenCalled();

    // Simulate just 's' (should not trigger)
    mockAction.mockClear();
    fireEvent.keyDown(document, { key: 's' });
    expect(mockAction).not.toHaveBeenCalled();
  });

  it('ignores shortcuts when typing in input fields', () => {
    const mockAction = vi.fn();

    keyboardManager.register({
      key: 's',
      description: 'Test shortcut',
      action: mockAction,
    });

    // Create input element and simulate typing
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    fireEvent.keyDown(input, { key: 's' });

    expect(mockAction).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it('can be enabled and disabled', () => {
    const mockAction = vi.fn();

    keyboardManager.register({
      key: 't',
      description: 'Test shortcut',
      action: mockAction,
    });

    // Disable keyboard manager
    keyboardManager.setEnabled(false);
    fireEvent.keyDown(document, { key: 't' });
    expect(mockAction).not.toHaveBeenCalled();

    // Re-enable keyboard manager
    keyboardManager.setEnabled(true);
    fireEvent.keyDown(document, { key: 't' });
    expect(mockAction).toHaveBeenCalled();
  });

  it('prevents default behavior by default', () => {
    const mockAction = vi.fn();
    const mockEvent = new KeyboardEvent('keydown', { key: 'p' });
    const preventDefaultSpy = vi.spyOn(mockEvent, 'preventDefault');

    keyboardManager.register({
      key: 'p',
      description: 'Test shortcut',
      action: mockAction,
    });

    document.dispatchEvent(mockEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('can be configured not to prevent default', () => {
    const mockAction = vi.fn();
    const mockEvent = new KeyboardEvent('keydown', { key: 'p' });
    const preventDefaultSpy = vi.spyOn(mockEvent, 'preventDefault');

    keyboardManager.register({
      key: 'p',
      preventDefault: false,
      description: 'Test shortcut',
      action: mockAction,
    });

    document.dispatchEvent(mockEvent);

    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });
});

describe('useKeyboardNavigation Hook', () => {
  it('registers slideshow keyboard shortcuts', () => {
    const onPlay = vi.fn();
    const onPause = vi.fn();
    const onNext = vi.fn();
    const onPrevious = vi.fn();

    render(
      <TestKeyboardComponent
        onPlay={onPlay}
        onPause={onPause}
        onNext={onNext}
        onPrevious={onPrevious}
        isPlaying={false}
      />
    );

    // Test space key (play)
    fireEvent.keyDown(document, { key: ' ' });
    expect(onPlay).toHaveBeenCalled();

    // Test arrow keys
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(onPrevious).toHaveBeenCalled();

    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(onNext).toHaveBeenCalled();
  });

  it('toggles between play and pause correctly', () => {
    const onPlay = vi.fn();
    const onPause = vi.fn();

    const { rerender } = render(
      <TestKeyboardComponent
        onPlay={onPlay}
        onPause={onPause}
        isPlaying={false}
      />
    );

    // When not playing, space should trigger play
    fireEvent.keyDown(document, { key: ' ' });
    expect(onPlay).toHaveBeenCalled();
    expect(onPause).not.toHaveBeenCalled();

    // Clear mocks
    onPlay.mockClear();
    onPause.mockClear();

    // When playing, space should trigger pause
    rerender(
      <TestKeyboardComponent
        onPlay={onPlay}
        onPause={onPause}
        isPlaying={true}
      />
    );

    fireEvent.keyDown(document, { key: ' ' });
    expect(onPause).toHaveBeenCalled();
    expect(onPlay).not.toHaveBeenCalled();
  });

  it('registers timing shortcuts (1-9)', () => {
    const onSetTiming = vi.fn();

    render(<TestKeyboardComponent onSetTiming={onSetTiming} />);

    // Test number keys
    fireEvent.keyDown(document, { key: '1' });
    expect(onSetTiming).toHaveBeenCalledWith(5);

    fireEvent.keyDown(document, { key: '5' });
    expect(onSetTiming).toHaveBeenCalledWith(25);

    fireEvent.keyDown(document, { key: '9' });
    expect(onSetTiming).toHaveBeenCalledWith(45);
  });

  it('registers other slideshow shortcuts', () => {
    const onToggleFullscreen = vi.fn();
    const onStar = vi.fn();

    render(
      <TestKeyboardComponent
        onToggleFullscreen={onToggleFullscreen}
        onStar={onStar}
      />
    );

    // Test fullscreen toggle
    fireEvent.keyDown(document, { key: 'f' });
    expect(onToggleFullscreen).toHaveBeenCalled();

    // Test star/favorite
    fireEvent.keyDown(document, { key: 's' });
    expect(onStar).toHaveBeenCalled();
  });

  it('ignores shortcuts when typing in input fields', () => {
    const onPlay = vi.fn();

    render(<TestKeyboardComponent onPlay={onPlay} />);

    const input = screen.getByTestId('test-input');
    input.focus();

    // Space should not trigger play when typing in input
    fireEvent.keyDown(input, { key: ' ' });
    expect(onPlay).not.toHaveBeenCalled();
  });
});

describe('HelpOverlay Component', () => {
  beforeEach(() => {
    // Register some test shortcuts
    keyboardManager.register({
      key: ' ',
      description: 'Play/pause slideshow',
      action: vi.fn(),
    });

    keyboardManager.register({
      key: 'f',
      description: 'Toggle fullscreen',
      action: vi.fn(),
    });

    keyboardManager.register({
      key: 's',
      ctrlKey: true,
      description: 'Save content',
      action: vi.fn(),
    });
  });

  it('renders help overlay when visible', () => {
    render(<HelpOverlay isVisible={true} onClose={vi.fn()} />);

    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    expect(screen.getByText('Play/pause slideshow')).toBeInTheDocument();
    expect(screen.getByText('Toggle fullscreen')).toBeInTheDocument();
  });

  it('does not render when not visible', () => {
    render(<HelpOverlay isVisible={false} onClose={vi.fn()} />);

    expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();

    render(<HelpOverlay isVisible={true} onClose={onClose} />);

    const closeButton = screen.getByLabelText('Close help');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when overlay background is clicked', () => {
    const onClose = vi.fn();

    render(<HelpOverlay isVisible={true} onClose={onClose} />);

    const overlay = screen.getByRole('dialog');
    fireEvent.click(overlay);

    expect(onClose).toHaveBeenCalled();
  });

  it('does not close when clicking inside the modal', () => {
    const onClose = vi.fn();

    render(<HelpOverlay isVisible={true} onClose={onClose} />);

    const modalContent = screen.getByText('Keyboard Shortcuts');
    fireEvent.click(modalContent);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes on escape key', () => {
    const onClose = vi.fn();

    render(<HelpOverlay isVisible={true} onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalled();
  });

  it('filters shortcuts based on search term', () => {
    render(<HelpOverlay isVisible={true} onClose={vi.fn()} />);

    const searchInput = screen.getByPlaceholderText('Search shortcuts...');

    // Initially all shortcuts should be visible
    expect(screen.getByText('Play/pause slideshow')).toBeInTheDocument();
    expect(screen.getByText('Toggle fullscreen')).toBeInTheDocument();

    // Search for "fullscreen"
    fireEvent.change(searchInput, { target: { value: 'fullscreen' } });

    expect(screen.queryByText('Play/pause slideshow')).not.toBeInTheDocument();
    expect(screen.getByText('Toggle fullscreen')).toBeInTheDocument();
  });

  it('formats key combinations correctly', () => {
    render(<HelpOverlay isVisible={true} onClose={vi.fn()} />);

    // Should show "Ctrl + s" for the save shortcut (s is lowercase in rendering)
    expect(screen.getByText('Ctrl')).toBeInTheDocument();
    expect(screen.getByText('s')).toBeInTheDocument();

    // Should show "Space" for the space key
    expect(screen.getByText('Space')).toBeInTheDocument();

    // Should show "f" for the f key
    expect(screen.getByText('f')).toBeInTheDocument();
  });

  it('groups shortcuts by context', () => {
    // Register shortcuts with different contexts
    keyboardManager.register({
      key: 'x',
      context: 'video',
      description: 'Video specific shortcut',
      action: vi.fn(),
    });

    render(<HelpOverlay isVisible={true} onClose={vi.fn()} />);

    // Should have context groups (note: context names are rendered as lowercase)
    expect(screen.getByText('Global Shortcuts')).toBeInTheDocument();
    expect(screen.getByText('video Shortcuts')).toBeInTheDocument();
  });
});
