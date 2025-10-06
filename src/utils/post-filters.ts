import type { SlideshowPost, Community } from '@types';

/**
 * Returns true if the post's community is NOT blocked.
 */
export function isNotBlocked(
  post: SlideshowPost,
  blocked: Community[] = []
): boolean {
  if (!post || !post.community) return true;
  return !blocked.some((c) => c.id === post.community.id);
}

/**
 * Apply blocked community filter to an array of posts.
 */
export function filterBlocked(
  posts: SlideshowPost[],
  blocked: Community[] = []
): SlideshowPost[] {
  if (!Array.isArray(posts) || posts.length === 0) return posts;
  if (!blocked || blocked.length === 0) return posts;
  const blockedIds = new Set(blocked.map((c) => c.id));
  return posts.filter((p) => !blockedIds.has(p.community.id));
}
