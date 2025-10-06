import { describe, it, expect } from 'vitest';
import { filterBlocked, isNotBlocked } from '../utils/post-filters';

// Minimal shape satisfying Community type fields used by filter utilities
type MockCommunity = {
  id: number;
  name: string;
  title: string;
  removed: boolean;
  published: string;
  deleted: boolean;
  nsfw: boolean;
  actor_id: string;
  local: boolean;
  followers_url: string;
  icon: string;
  banner: string;
  description: string;
  inbox_url: string;
  hidden: boolean;
  posting_restricted_to_mods: boolean;
  instance_id: number;
};

type MockPost = any;

function makePost(id: number, community: MockCommunity): MockPost {
  return {
    id: id.toString(),
    postId: id,
    title: `Post ${id}`,
    url: `https://example.com/${id}.jpg`,
    mediaType: 'image',
    thumbnailUrl: '',
    creator: { id: 1, name: 'user' },
    community,
    score: 1,
    published: new Date().toISOString(),
    nsfw: false,
    starred: false,
    viewed: false,
  };
}

describe('blocked community filtering', () => {
  const base = () => ({
    title: 'title',
    removed: false,
    published: new Date().toISOString(),
    deleted: false,
    nsfw: false,
    actor_id: '',
    local: false,
    followers_url: '',
    icon: '',
    banner: '',
    description: '',
    inbox_url: '',
    hidden: false,
    posting_restricted_to_mods: false,
    instance_id: 1,
  });
  const c1: MockCommunity = { id: 1, name: 'one', ...base() };
  const c2: MockCommunity = { id: 2, name: 'two', ...base() };
  const c3: MockCommunity = { id: 3, name: 'three', ...base() };

  const posts = [makePost(101, c1), makePost(102, c2), makePost(103, c3)];

  it('returns all when no blocked', () => {
    expect(filterBlocked(posts, []).length).toBe(3);
  });

  it('filters blocked community ids', () => {
    const filtered = filterBlocked(posts, [c2]);
    expect(filtered.map((p) => p.community.id)).toEqual([1, 3]);
  });

  it('isNotBlocked works', () => {
    expect(isNotBlocked(posts[0], [c2])).toBe(true);
    expect(isNotBlocked(posts[1], [c2])).toBe(false);
  });
});
