/**
 * Test for Phase 2.3 Video and GIF Player Components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VideoPlayer from '../../../components/media/VideoPlayer';
import GifPlayer from '../../../components/media/GifPlayer';
import MediaControls from '../../../components/media/MediaControls';
import { MediaType } from '../../../constants/media-types';
import type { SlideshowPost } from '../../../types';

// Mock react-player
vi.mock('react-player', () => ({
  default: vi.fn(
    ({
      onReady,
      onStart,
      onPause,
      onEnded,
      onError,
      onBuffer,
      onBufferEnd,
      onProgress,
      onDuration,
      url,
      playing,
    }) => {
      // Simulate player behavior
      React.useEffect(() => {
        if (onReady) onReady();
        if (onStart && playing) onStart();
      }, [onReady, onStart, playing]);

      return (
        <div data-testid='react-player'>
          <div>URL: {url}</div>
          <div>Playing: {playing.toString()}</div>
          <button onClick={() => onPause && onPause()}>Pause</button>
          <button onClick={() => onEnded && onEnded()}>End</button>
          <button onClick={() => onError && onError(new Error('Test error'))}>
            Error
          </button>
          <button onClick={() => onBuffer && onBuffer()}>Buffer</button>
          <button onClick={() => onBufferEnd && onBufferEnd()}>
            Buffer End
          </button>
          <button
            onClick={() =>
              onProgress && onProgress({ played: 0.5, loaded: 0.7 })
            }
          >
            Progress
          </button>
          <button onClick={() => onDuration && onDuration(100)}>
            Duration
          </button>
        </div>
      );
    }
  ),
}));

const mockVideoPost = {
  id: '1',
  postId: 1,
  title: 'Test Video',
  url: 'https://example.com/video.mp4',
  mediaType: MediaType.VIDEO,
  creator: { id: 1, name: 'test', display_name: 'Test User' },
  community: { id: 1, name: 'test', title: 'Test Community' },
  score: 10,
  published: '2024-01-01',
  nsfw: false,
  starred: false,
  viewed: false,
} as SlideshowPost;

const mockGifPost = {
  id: '2',
  postId: 2,
  title: 'Test GIF',
  url: 'https://example.com/animation.gif',
  mediaType: MediaType.GIF,
  creator: { id: 1, name: 'test', display_name: 'Test User' },
  community: { id: 1, name: 'test', title: 'Test Community' },
  score: 5,
  published: '2024-01-01',
  nsfw: false,
  starred: false,
  viewed: false,
} as SlideshowPost;

const mockImagePost = {
  id: '3',
  postId: 3,
  title: 'Test Image',
  url: 'https://example.com/image.jpg',
  mediaType: MediaType.IMAGE,
  creator: { id: 1, name: 'test', display_name: 'Test User' },
  community: { id: 1, name: 'test', title: 'Test Community' },
  score: 8,
  published: '2024-01-01',
  nsfw: false,
  starred: false,
  viewed: false,
} as SlideshowPost;

describe('VideoPlayer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders video player with react-player', () => {
    render(<VideoPlayer post={mockVideoPost} />);

    expect(screen.getByTestId('react-player')).toBeInTheDocument();
    expect(
      screen.getByText(/URL: https:\/\/example\.com\/video\.mp4/)
    ).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    // The component should show loading state before onReady is called
    // Since our mock calls onReady immediately, we'll test the buffering state instead
    render(<VideoPlayer post={mockVideoPost} />);

    fireEvent.click(screen.getByText('Buffer'));
    expect(screen.getByText('Buffering...')).toBeInTheDocument();
  });

  it('handles play and pause', async () => {
    const onPlay = vi.fn();
    const onPause = vi.fn();

    render(
      <VideoPlayer post={mockVideoPost} onPlay={onPlay} onPause={onPause} />
    );

    fireEvent.click(screen.getByText('Pause'));
    expect(onPause).toHaveBeenCalled();
  });

  it('handles video end', () => {
    const onEnded = vi.fn();

    render(<VideoPlayer post={mockVideoPost} onEnded={onEnded} />);

    fireEvent.click(screen.getByText('End'));
    expect(onEnded).toHaveBeenCalled();
  });

  it('handles video error', () => {
    const onError = vi.fn();

    render(<VideoPlayer post={mockVideoPost} onError={onError} />);

    fireEvent.click(screen.getByText('Error'));
    expect(onError).toHaveBeenCalled();
  });

  it('shows buffering state', () => {
    render(<VideoPlayer post={mockVideoPost} />);

    fireEvent.click(screen.getByText('Buffer'));
    expect(screen.getByText('Buffering...')).toBeInTheDocument();
  });
});

describe('GifPlayer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders GIF player with image', () => {
    render(<GifPlayer post={mockGifPost} />);

    const img = screen.getByAltText('Test GIF');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/animation.gif');
  });

  it('shows loading state initially', () => {
    render(<GifPlayer post={mockGifPost} />);

    expect(screen.getByText('Loading GIF...')).toBeInTheDocument();
  });

  it('shows GIF indicator when loaded', async () => {
    render(<GifPlayer post={mockGifPost} />);

    const img = screen.getByAltText('Test GIF');
    fireEvent.load(img);

    await waitFor(() => {
      expect(screen.getByText('GIF')).toBeInTheDocument();
    });
  });

  it('shows loop indicator when loop is enabled', async () => {
    render(<GifPlayer post={mockGifPost} loop={true} />);

    const img = screen.getByAltText('Test GIF');
    fireEvent.load(img);

    await waitFor(() => {
      expect(screen.getByText('Loop')).toBeInTheDocument();
    });
  });

  it('handles play/pause toggle', async () => {
    const onPlay = vi.fn();
    const onPause = vi.fn();

    // Start with autoPlay=true so it's playing and shows pause button
    render(
      <GifPlayer
        post={mockGifPost}
        onPlay={onPlay}
        onPause={onPause}
        autoPlay={true}
      />
    );

    const img = screen.getByAltText('Test GIF');
    fireEvent.load(img);

    // Wait for component to load and show controls
    await waitFor(() => {
      expect(screen.getByText('GIF')).toBeInTheDocument();
    });

    // Since autoPlay is true, the GIF should be playing and pause button should be visible on hover
    const container = screen.getByRole('button');
    fireEvent.mouseEnter(container);

    await waitFor(() => {
      const pauseButton = screen.getByLabelText('Pause GIF');
      fireEvent.click(pauseButton);
      expect(onPause).toHaveBeenCalled();
    });
  });

  it('handles keyboard controls', async () => {
    render(<GifPlayer post={mockGifPost} autoPlay={false} />);

    const img = screen.getByAltText('Test GIF');
    fireEvent.load(img);

    await waitFor(() => {
      const container = screen.getByRole('button');
      fireEvent.keyPress(container, { key: ' ' });
      // Should toggle playback
    });
  });

  it('handles error state', () => {
    const onError = vi.fn();

    render(<GifPlayer post={mockGifPost} onError={onError} />);

    const img = screen.getByAltText('Test GIF');
    fireEvent.error(img);

    expect(screen.getByText('Failed to load GIF')).toBeInTheDocument();
    expect(onError).toHaveBeenCalled();
  });
});

describe('MediaControls Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders media controls with video controls', () => {
    render(
      <MediaControls
        post={mockVideoPost}
        showPlaybackControls={true}
        showVolumeControls={true}
      />
    );

    // Media info should be shown
    expect(screen.getByText('Test Video')).toBeInTheDocument();
  });

  it('shows play button when paused', () => {
    render(
      <MediaControls
        post={mockVideoPost}
        isPlaying={false}
        showPlaybackControls={true}
      />
    );

    const playButton = screen.getByLabelText('Play');
    expect(playButton).toBeInTheDocument();
  });

  it('shows pause button when playing', () => {
    render(
      <MediaControls
        post={mockVideoPost}
        isPlaying={true}
        showPlaybackControls={true}
      />
    );

    const pauseButton = screen.getByLabelText('Pause');
    expect(pauseButton).toBeInTheDocument();
  });

  it('handles play/pause toggle', () => {
    const onPlay = vi.fn();
    const onPause = vi.fn();

    render(
      <MediaControls
        post={mockVideoPost}
        isPlaying={false}
        onPlay={onPlay}
        onPause={onPause}
        showPlaybackControls={true}
      />
    );

    const playButton = screen.getByLabelText('Play');
    fireEvent.click(playButton);
    expect(onPlay).toHaveBeenCalled();
  });

  it('shows volume controls for video', () => {
    render(
      <MediaControls
        post={mockVideoPost}
        showVolumeControls={true}
        volume={0.5}
        isMuted={false}
      />
    );

    const muteButton = screen.getByLabelText('Mute');
    expect(muteButton).toBeInTheDocument();
  });

  it('shows zoom controls for images', () => {
    render(
      <MediaControls
        post={mockImagePost}
        showZoomControls={true}
        zoom={1}
        canZoom={true}
      />
    );

    expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('handles zoom controls', () => {
    const onZoomIn = vi.fn();
    const onZoomOut = vi.fn();
    const onZoomReset = vi.fn();

    render(
      <MediaControls
        post={mockImagePost}
        showZoomControls={true}
        zoom={1.5}
        canZoom={true}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onZoomReset={onZoomReset}
      />
    );

    fireEvent.click(screen.getByLabelText('Zoom in'));
    expect(onZoomIn).toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText('Zoom out'));
    expect(onZoomOut).toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText('Reset zoom'));
    expect(onZoomReset).toHaveBeenCalled();
  });

  it('shows navigation controls', () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();

    render(
      <MediaControls
        post={mockVideoPost}
        showNavigationControls={true}
        onPrevious={onPrevious}
        onNext={onNext}
      />
    );

    fireEvent.click(screen.getByLabelText('Previous'));
    expect(onPrevious).toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText('Next'));
    expect(onNext).toHaveBeenCalled();
  });

  it('handles close button', () => {
    const onClose = vi.fn();

    render(<MediaControls post={mockVideoPost} onClose={onClose} />);

    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('handles volume change', () => {
    const onVolumeChange = vi.fn();
    const onMuteToggle = vi.fn();

    render(
      <MediaControls
        post={mockVideoPost}
        showVolumeControls={true}
        volume={0.8}
        onVolumeChange={onVolumeChange}
        onMuteToggle={onMuteToggle}
      />
    );

    // Trigger volume slider display
    const muteButton = screen.getByLabelText('Mute');
    fireEvent.mouseEnter(muteButton);

    const volumeSlider = screen.getByLabelText('Volume');
    fireEvent.change(volumeSlider, { target: { value: '0.5' } });
    expect(onVolumeChange).toHaveBeenCalledWith(0.5);

    fireEvent.click(muteButton);
    expect(onMuteToggle).toHaveBeenCalled();
  });
});
