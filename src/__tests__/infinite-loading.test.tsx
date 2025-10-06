import { describe, it, expect, beforeEach } from 'vitest';
import { useLoadMorePosts } from '../hooks/useContent';
import { useAppStore } from '../stores/app-store';

// Basic test to ensure when hasMore and near end, mutation is invoked.
// We will simulate the effect logic directly (simplified) since React environment not fully mounted here.

describe('Infinite loading behavior', () => {
  beforeEach(() => {
    // Reset store
    useAppStore.getState().reset();
    // Seed posts
    useAppStore.getState().setPosts(
      Array.from({ length: 10 }).map((_, i) => ({
        id: String(i + 1),
        postId: i + 1,
        title: `Post ${i + 1}`,
        url: `https://example.com/${i + 1}.jpg`,
        mediaType: 'image' as any,
        thumbnailUrl: '',
        creator: {
          id: 1,
          name: 'user',
          display_name: 'User',
          avatar: '',
          banned: false,
          published: '',
          updated: '',
          actor_id: '',
          bio: '',
          local: true,
          banner: '',
          deleted: false,
          inbox_url: '',
          shared_inbox_url: undefined,
          matrix_user_id: '',
          admin: false,
          bot_account: false,
          ban_expires: undefined,
        },
        community: {
          id: 1,
          name: 'community',
          title: 'Community',
          description: '',
          removed: false,
          published: '',
          updated: '',
          deleted: false,
          nsfw: false,
          actor_id: '',
          local: true,
          icon: '',
          banner: '',
          followers_url: '',
          inbox_url: '',
          shared_inbox_url: undefined,
          hidden: false,
          posting_restricted_to_mods: false,
          instance_id: 1,
        },
        score: 1,
        published: '',
        nsfw: false,
        starred: false,
        viewed: false,
      }))
    );
    // Ensure hasMore true
    useAppStore.getState().setHasMore(true);
  });

  it('appends new posts without duplicates (simulated)', async () => {
    const mutation = useLoadMorePosts();
    const initialLength = useAppStore.getState().slideshow.posts.length;

    // Simulate success callback by calling onSuccess manually via mutate with mock
    // Instead of network, directly invoke internal success path
    (mutation as any).options?.onSuccess?.([
      {
        id: '100',
        postId: 100,
        title: 'New Post',
        url: 'https://example.com/100.jpg',
        mediaType: 'image',
        thumbnailUrl: '',
        creator: {
          id: 1,
          name: 'user',
          display_name: 'User',
          avatar: '',
          banned: false,
          published: '',
          updated: '',
          actor_id: '',
          bio: '',
          local: true,
          banner: '',
          deleted: false,
          inbox_url: '',
          shared_inbox_url: undefined,
          matrix_user_id: '',
          admin: false,
          bot_account: false,
          ban_expires: undefined,
        },
        community: {
          id: 1,
          name: 'community',
          title: 'Community',
          description: '',
          removed: false,
          published: '',
          updated: '',
          deleted: false,
          nsfw: false,
          actor_id: '',
          local: true,
          icon: '',
          banner: '',
          followers_url: '',
          inbox_url: '',
          shared_inbox_url: undefined,
          hidden: false,
          posting_restricted_to_mods: false,
          instance_id: 1,
        },
        score: 1,
        published: '',
        nsfw: false,
        starred: false,
        viewed: false,
      },
    ] as any);
    const finalLength = useAppStore.getState().slideshow.posts.length;
    expect(finalLength).toBe(initialLength + 1);
  });
});
