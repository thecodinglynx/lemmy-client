/**
 * @jest-environment jsdom
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AttributionOverlay } from '../../../components/slideshow/AttributionOverlay';
import type { SlideshowPost, Community, Person } from '../../../types';
import { MediaType } from '../../../types';

// Mock data
const mockCommunity: Community = {
  id: 1,
  name: 'pics',
  title: 'Pictures',
  description: 'A community for pictures',
  removed: false,
  published: '2024-01-01T00:00:00Z',
  updated: '2024-01-01T00:00:00Z',
  deleted: false,
  nsfw: false,
  actor_id: 'https://lemmy.world/c/pics',
  local: true,
  icon: 'https://example.com/icon.png',
  banner: 'https://example.com/banner.png',
  followers_url: 'https://lemmy.world/c/pics/followers',
  inbox_url: 'https://lemmy.world/c/pics/inbox',
  shared_inbox_url: 'https://lemmy.world/inbox',
  hidden: false,
  posting_restricted_to_mods: false,
  instance_id: 1,
};

const mockCreator: Person = {
  id: 1,
  name: 'testuser',
  display_name: 'Test User',
  published: '2024-01-01T00:00:00Z',
  avatar: 'https://example.com/avatar.png',
  banned: false,
  deleted: false,
  actor_id: 'https://lemmy.world/u/testuser',
  bio: 'Test bio',
  local: true,
  banner: 'https://example.com/banner.png',
  updated: '2024-01-01T00:00:00Z',
  inbox_url: 'https://lemmy.world/u/testuser/inbox',
  shared_inbox_url: 'https://lemmy.world/inbox',
  matrix_user_id: undefined,
  admin: false,
  bot_account: false,
  ban_expires: undefined,
};

const mockPost: SlideshowPost = {
  id: '123',
  postId: 123,
  title: 'Beautiful sunset photo',
  url: 'https://example.com/sunset.jpg',
  mediaType: MediaType.IMAGE,
  thumbnailUrl: 'https://example.com/thumb.jpg',
  creator: mockCreator,
  community: mockCommunity,
  score: 42,
  published: '2024-01-15T10:30:00Z',
  nsfw: false,
  starred: false,
  viewed: false,
};

describe('AttributionOverlay', () => {
  it('renders post attribution correctly', () => {
    render(<AttributionOverlay post={mockPost} />);

    // Check post title
    expect(screen.getByText('Beautiful sunset photo')).toBeInTheDocument();

    // Check community attribution
    expect(screen.getByText('r/pics')).toBeInTheDocument();

    // Check user attribution
    expect(screen.getByText('u/testuser')).toBeInTheDocument();

    // Check score
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('formats large scores correctly', () => {
    const highScorePost = { ...mockPost, score: 1500 };
    render(<AttributionOverlay post={highScorePost} />);

    expect(screen.getByText('1.5k')).toBeInTheDocument();
  });

  it('handles community click callback', () => {
    const onCommunityClick = vi.fn();
    render(
      <AttributionOverlay post={mockPost} onCommunityClick={onCommunityClick} />
    );

    const communityButton = screen.getByLabelText('View community pics');
    fireEvent.click(communityButton);

    expect(onCommunityClick).toHaveBeenCalledWith('pics');
  });

  it('handles user click callback', () => {
    const onUserClick = vi.fn();
    render(<AttributionOverlay post={mockPost} onUserClick={onUserClick} />);

    const userButton = screen.getByLabelText('View user testuser');
    fireEvent.click(userButton);

    expect(onUserClick).toHaveBeenCalledWith('testuser');
  });

  it('displays media type indicator for images', () => {
    render(<AttributionOverlay post={mockPost} />);
    expect(screen.getByText('Image')).toBeInTheDocument();
  });

  it('displays media type indicator for videos', () => {
    const videoPost = { ...mockPost, mediaType: MediaType.VIDEO };
    render(<AttributionOverlay post={videoPost} />);
    expect(screen.getByText('Video')).toBeInTheDocument();
  });

  it('displays media type indicator for GIFs', () => {
    const gifPost = { ...mockPost, mediaType: MediaType.GIF };
    render(<AttributionOverlay post={gifPost} />);
    expect(screen.getByText('GIF')).toBeInTheDocument();
  });

  it('formats time ago correctly', () => {
    // Test with a recent date (within 24 hours)
    const recentDate = new Date();
    recentDate.setHours(recentDate.getHours() - 2);
    const recentPost = { ...mockPost, published: recentDate.toISOString() };

    render(<AttributionOverlay post={recentPost} />);
    expect(screen.getByText('2h ago')).toBeInTheDocument();
  });

  it('formats time ago for older posts', () => {
    // Test with an older date (days ago)
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 3);
    const oldPost = { ...mockPost, published: oldDate.toISOString() };

    render(<AttributionOverlay post={oldPost} />);
    expect(screen.getByText('3d ago')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <AttributionOverlay post={mockPost} className='custom-class' />
    );

    expect(container.firstChild).toHaveClass(
      'attribution-overlay',
      'custom-class'
    );
  });

  it('works without callback handlers', () => {
    expect(() => {
      render(<AttributionOverlay post={mockPost} />);
    }).not.toThrow();
  });
});
