/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useAppStore } from '../../../stores/app-store';
import { SlideshowView } from '../../../components/slideshow/SlideshowView';
import type { SlideshowPost, Community, Person } from '../../../types';
import { MediaType } from '../../../types';

// Helper to seed the store with a current post
function seedPost(post: SlideshowPost) {
  const state = useAppStore.getState();
  state.setPosts([post]);
}

const mockCommunity: Community = {
  id: 999,
  name: 'awesomepics',
  title: 'Awesome Pics',
  description: 'Great pictures',
  removed: false,
  published: '2024-01-01T00:00:00Z',
  updated: '2024-01-01T00:00:00Z',
  deleted: false,
  nsfw: false,
  actor_id: 'https://lemmy.world/c/awesomepics',
  local: true,
  icon: '',
  banner: '',
  followers_url: '',
  inbox_url: '',
  shared_inbox_url: undefined,
  hidden: false,
  posting_restricted_to_mods: false,
  instance_id: 1,
};

const mockPerson: Person = {
  id: 50,
  name: 'photoguy',
  display_name: 'Photo Guy',
  avatar: '',
  banned: false,
  published: '2024-01-01T00:00:00Z',
  updated: '2024-01-01T00:00:00Z',
  actor_id: 'https://lemmy.world/u/photoguy',
  bio: '',
  local: true,
  banner: '',
  deleted: false,
  inbox_url: '',
  shared_inbox_url: undefined,
  matrix_user_id: undefined,
  admin: false,
  bot_account: false,
  ban_expires: undefined,
};

const mockPost: SlideshowPost = {
  id: 'p-1',
  postId: 1,
  title: 'Mountains',
  url: 'https://example.com/mountains.jpg',
  mediaType: MediaType.IMAGE,
  thumbnailUrl: '',
  creator: mockPerson,
  community: mockCommunity,
  score: 10,
  published: '2024-01-05T00:00:00Z',
  nsfw: false,
  starred: false,
  viewed: false,
};

describe('SlideshowView community click add feature', () => {
  beforeEach(() => {
    // Reset store between tests
    useAppStore.getState().reset();
  });

  it('adds community to selected communities when clicked', () => {
    seedPost(mockPost);
    render(<SlideshowView />);

    const button = screen.getByRole('button', {
      name: /add community r\/awesomepics/i,
    });

    fireEvent.click(button);

    const { content } = useAppStore.getState();
    expect(
      content.selectedCommunities.some((c) => c.id === mockCommunity.id)
    ).toBe(true);
  });

  it('does not duplicate community if clicked twice', () => {
    seedPost(mockPost);
    render(<SlideshowView />);
    const button = screen.getByRole('button', {
      name: /add community r\/awesomepics/i,
    });
    fireEvent.click(button);
    fireEvent.click(button);
    const { content } = useAppStore.getState();
    const occurrences = content.selectedCommunities.filter(
      (c) => c.id === mockCommunity.id
    ).length;
    expect(occurrences).toBe(1);
  });
});
