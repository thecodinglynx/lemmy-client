import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import SettingsPanel from '../../../components/settings/SettingsPanel';
import { useAppStore } from '../../../stores/app-store';

// Mock the store
vi.mock('../../../stores/app-store');

const mockUpdateSettings = vi.fn();
const mockResetSettings = vi.fn();

const defaultMockStoreState = {
  settings: {
    theme: 'auto',
    autoAdvance: true,
    intervals: {
      images: 10,
      videos: 0,
      gifs: 15,
    },
    accessibility: {
      highContrast: false,
      reducedMotion: false,
      textSize: 'medium',
      screenReaderAnnouncements: true,
    },
    display: {
      showAttribution: true,
      showControls: true,
      fullscreenDefault: false,
      attributionPosition: 'bottom',
    },
    controls: {
      keyboardShortcuts: {
        PLAY_PAUSE: ' ',
        NEXT: 'ArrowRight',
        PREVIOUS: 'ArrowLeft',
        VOLUME_UP: 'ArrowUp',
        VOLUME_DOWN: 'ArrowDown',
        STAR: 's',
        FULLSCREEN: 'f',
        ESCAPE: 'Escape',
        HELP: 'h',
        SETTINGS: ',',
      },
      touchGestures: true,
      autoHideControls: true,
      controlTimeout: 3000,
    },
  },
  updateSettings: mockUpdateSettings,
  resetSettings: mockResetSettings,
};

function renderWithRouter(component: React.ReactElement) {
  return render(<BrowserRouter>{component}</BrowserRouter>);
}

describe('SettingsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAppStore as any).mockReturnValue(defaultMockStoreState);
  });

  it('renders settings panel with all sections', () => {
    renderWithRouter(<SettingsPanel />);

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Customize your slideshow experience, controls, and accessibility options.'
      )
    ).toBeInTheDocument();

    // Check main sections
    expect(screen.getByText('Timing & Playback')).toBeInTheDocument();
    expect(screen.getByText('Display & Appearance')).toBeInTheDocument();
    expect(screen.getByText('Accessibility')).toBeInTheDocument();
    expect(screen.getByText('Controls & Input')).toBeInTheDocument();
  });

  it('can toggle auto-advance setting', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SettingsPanel />);

    const autoAdvanceCheckbox = screen.getByRole('checkbox');
    expect(autoAdvanceCheckbox).toBeChecked();

    await user.click(autoAdvanceCheckbox);

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      autoAdvance: false,
    });
  });

  it('can change theme setting', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SettingsPanel />);

    // Find and click the display section to expand it
    const displaySection = screen.getByRole('button', {
      name: /display & appearance/i,
    });
    await user.click(displaySection);

    await waitFor(async () => {
      const themeSelect = screen.getByDisplayValue('Auto (System)');
      await user.selectOptions(themeSelect, 'dark');

      expect(mockUpdateSettings).toHaveBeenCalledWith({
        theme: 'dark',
      });
    });
  });

  it('can adjust timing sliders', async () => {
    renderWithRouter(<SettingsPanel />);

    // The timing section is open by default
    const imageSlider = screen.getByDisplayValue('10');

    // For sliders, use fireEvent to simulate change
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.change(imageSlider, { target: { value: '15' } });

    // Check that the change was simulated
    expect(imageSlider).toHaveValue('15');
  });

  it('can toggle display settings', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SettingsPanel />);

    // Find and click the display section to expand it first
    const displaySection = screen.getByRole('button', {
      name: /display & appearance/i,
    });
    await user.click(displaySection);

    await waitFor(async () => {
      const showAttributionCheckbox = screen.getByRole('checkbox', {
        name: /show attribution overlay/i,
      });
      expect(showAttributionCheckbox).toBeChecked();

      await user.click(showAttributionCheckbox);

      expect(mockUpdateSettings).toHaveBeenCalledWith({
        display: {
          showAttribution: false,
          showControls: true,
          fullscreenDefault: false,
          attributionPosition: 'bottom',
        },
      });
    });
  });

  it('can toggle accessibility settings', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SettingsPanel />);

    // Find and click the accessibility section to expand it
    const accessibilitySection = screen.getByRole('button', {
      name: /accessibility/i,
    });
    await user.click(accessibilitySection);

    await waitFor(async () => {
      const highContrastCheckbox = screen.getByRole('checkbox', {
        name: /high contrast/i,
      });
      await user.click(highContrastCheckbox);

      expect(mockUpdateSettings).toHaveBeenCalledWith({
        accessibility: {
          highContrast: true,
          reducedMotion: false,
          textSize: 'medium',
          screenReaderAnnouncements: true,
        },
      });
    });
  });

  it('can change text size', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SettingsPanel />);

    // Find and click the accessibility section to expand it
    const accessibilitySection = screen.getByRole('button', {
      name: /accessibility/i,
    });
    await user.click(accessibilitySection);

    await waitFor(async () => {
      const textSizeSelect = screen.getByDisplayValue('Medium');
      await user.selectOptions(textSizeSelect, 'large');

      expect(mockUpdateSettings).toHaveBeenCalledWith({
        accessibility: {
          highContrast: false,
          reducedMotion: false,
          textSize: 'large',
          screenReaderAnnouncements: true,
        },
      });
    });
  });

  it('can toggle control settings', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SettingsPanel />);

    // Find and click the controls section to expand it
    const controlsSection = screen.getByRole('button', {
      name: /controls & input/i,
    });
    await user.click(controlsSection);

    await waitFor(async () => {
      const touchGesturesCheckbox = screen.getByRole('checkbox', {
        name: /enable touch gestures/i,
      });
      await user.click(touchGesturesCheckbox);

      expect(mockUpdateSettings).toHaveBeenCalledWith({
        controls: {
          keyboardShortcuts: {
            PLAY_PAUSE: ' ',
            NEXT: 'ArrowRight',
            PREVIOUS: 'ArrowLeft',
            VOLUME_UP: 'ArrowUp',
            VOLUME_DOWN: 'ArrowDown',
            STAR: 's',
            FULLSCREEN: 'f',
            ESCAPE: 'Escape',
            HELP: 'h',
            SETTINGS: ',',
          },
          touchGestures: false,
          autoHideControls: true,
          controlTimeout: 3000,
        },
      });
    });
  });

  it('shows keyboard shortcuts preview', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SettingsPanel />);

    // Find and click the controls section to expand it
    const controlsSection = screen.getByRole('button', {
      name: /controls & input/i,
    });
    await user.click(controlsSection);

    await waitFor(() => {
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
      expect(screen.getByText('Play/Pause:')).toBeInTheDocument();
      expect(screen.getByText('Next:')).toBeInTheDocument();
    });
  });

  it('can reset settings to defaults', async () => {
    const user = userEvent.setup();

    // Mock window.confirm to return true
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true)
    );

    renderWithRouter(<SettingsPanel />);

    const resetButton = screen.getByText('Reset to Defaults');
    await user.click(resetButton);

    expect(mockResetSettings).toHaveBeenCalled();

    // Cleanup
    vi.unstubAllGlobals();
  });

  it('does not reset settings when user cancels', async () => {
    const user = userEvent.setup();

    // Mock window.confirm to return false
    vi.stubGlobal(
      'confirm',
      vi.fn(() => false)
    );

    renderWithRouter(<SettingsPanel />);

    const resetButton = screen.getByText('Reset to Defaults');
    await user.click(resetButton);

    expect(mockResetSettings).not.toHaveBeenCalled();

    // Cleanup
    vi.unstubAllGlobals();
  });

  it('displays correct values for timing sliders', () => {
    renderWithRouter(<SettingsPanel />);

    // Check that slider values are correct
    const imagesSlider = screen.getByDisplayValue('10');
    expect(imagesSlider).toBeInTheDocument();

    // For videos, it should show "Until end" when value is 0
    expect(screen.getByText('Until end')).toBeInTheDocument();

    // Check GIFs timing slider value
    const gifsSlider = screen.getByDisplayValue('15');
    expect(gifsSlider).toBeInTheDocument();

    // Check that auto-advance is enabled by default
    const autoAdvanceCheckbox = screen.getByRole('checkbox');
    expect(autoAdvanceCheckbox).toBeChecked();
  });

  it('shows correct initial accessibility values', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SettingsPanel />);

    // Find and click the accessibility section to expand it
    const accessibilitySection = screen.getByRole('button', {
      name: /accessibility/i,
    });
    await user.click(accessibilitySection);

    await waitFor(() => {
      // Medium text size should be selected by default
      expect(screen.getByDisplayValue('Medium')).toBeInTheDocument();
    });
  });

  it('allows customizing control timeout', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SettingsPanel />);

    // Find and click the controls section to expand it
    const controlsSection = screen.getByRole('button', {
      name: /controls & input/i,
    });
    await user.click(controlsSection);

    await waitFor(() => {
      // Check that the timeout slider shows correct initial value
      expect(screen.getByText('3s')).toBeInTheDocument();
    });
  });

  it('renders reset button', () => {
    renderWithRouter(<SettingsPanel />);

    const resetButton = screen.getByText('Reset to Defaults');
    expect(resetButton).toBeInTheDocument();
    expect(resetButton).toHaveClass('text-red-600');
  });

  it('has collapsible sections', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SettingsPanel />);

    // All sections should be collapsed by default except timing
    const timingSection = screen.getByRole('button', {
      name: /timing & playback/i,
    });
    expect(timingSection).toHaveAttribute('aria-expanded', 'true');

    // Click to collapse timing section
    await user.click(timingSection);
    expect(timingSection).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows timing preset buttons', () => {
    renderWithRouter(<SettingsPanel />);

    // Check that preset buttons are shown
    expect(screen.getByText('Quick Presets')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '5s' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '10s' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '15s' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '30s' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '60s' })).toBeInTheDocument();
  });

  it('can apply timing presets', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SettingsPanel />);

    const preset15Button = screen.getByRole('button', { name: '15s' });
    await user.click(preset15Button);

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      intervals: {
        images: 15,
        videos: 15,
        gifs: 15,
      },
    });
  });
});
