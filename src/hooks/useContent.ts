import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LemmyAPIClient } from '@services/lemmy-api-client';
import { queryOptions, queryKeys } from '@services/query-client';
import { useAppStore } from '@stores/app-store';
import type { PostView, SlideshowPost } from '@types';
import { MediaType } from '@types';

// Initialize API client with default instance
const apiClient = new LemmyAPIClient();

// Hook for fetching posts from communities
export function useCommunityPosts(
  communityId: number,
  params: {
    sort?:
      | 'Active'
      | 'Hot'
      | 'New'
      | 'Old'
      | 'TopDay'
      | 'TopWeek'
      | 'TopMonth'
      | 'TopYear'
      | 'TopAll'
      | 'MostComments'
      | 'NewComments'
      | 'TopHour'
      | 'TopSixHour'
      | 'TopTwelveHour'
      | 'TopThreeMonths'
      | 'TopSixMonths'
      | 'TopNineMonths'
      | 'Controversial'
      | 'Scaled';
    page?: number;
    limit?: number;
    type_?: 'All' | 'Local' | 'Subscribed';
  } = {}
) {
  const { content } = useAppStore();

  return useQuery({
    ...queryOptions.posts.community(communityId, params),
    queryFn: async () => {
      const response = await apiClient.getPosts({
        community_id: communityId,
        sort: params.sort || 'Hot',
        page: params.page || 1,
        limit: params.limit || 20,
        type_: params.type_ || 'All',
      });

      // Transform to slideshow posts and filter based on content settings
      const slideshowPosts: SlideshowPost[] = response
        .filter((post: PostView) => {
          // Filter by media type
          const hasMedia =
            post.post.url &&
            ((content.filters.mediaTypes.includes(MediaType.IMAGE) &&
              /\.(jpe?g|png|gif|webp|avif)$/i.test(post.post.url)) ||
              (content.filters.mediaTypes.includes(MediaType.VIDEO) &&
                /\.(mp4|webm|ogg)$/i.test(post.post.url)) ||
              (content.filters.mediaTypes.includes(MediaType.GIF) &&
                /\.gif$/i.test(post.post.url)));

          // Filter by score
          const meetsMinScore = post.counts.score >= content.filters.minScore;

          // Filter by NSFW setting
          const isNSFWAllowed = content.filters.showNSFW || !post.post.nsfw;

          return hasMedia && meetsMinScore && isNSFWAllowed;
        })
        .map(
          (post: PostView): SlideshowPost => ({
            id: post.post.id.toString(),
            postId: post.post.id,
            title: post.post.name,
            url: post.post.url!,
            mediaType: getMediaType(post.post.url!),
            thumbnailUrl: post.post.thumbnail_url,
            creator: post.creator,
            community: post.community,
            score: post.counts.score,
            published: post.post.published,
            nsfw: post.post.nsfw,
            starred: false, // Will be updated from local storage
            viewed: false,
          })
        );

      return slideshowPosts;
    },
    enabled: communityId > 0,
  });
}

// Hook for searching communities
export function useSearchCommunities(query: string) {
  return useQuery({
    ...queryOptions.communities.search(query),
    queryFn: async () => {
      if (query.length < 3) return [];

      const response = await apiClient.searchCommunities(query, 50);
      return response;
    },
  });
}

// Hook for getting site information
export function useSiteInfo() {
  return useQuery({
    ...queryOptions.site.info(),
    queryFn: async () => {
      return await apiClient.getSite();
    },
  });
}

// Mutation hooks for actions
export function useStarPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      starred,
    }: {
      postId: string;
      starred: boolean;
    }) => {
      // This would typically save to local storage or a backend
      const starredPosts = JSON.parse(
        localStorage.getItem('lemmy-slideshow-starred') || '[]'
      );

      if (starred) {
        if (!starredPosts.includes(postId)) {
          starredPosts.push(postId);
        }
      } else {
        const index = starredPosts.indexOf(postId);
        if (index > -1) {
          starredPosts.splice(index, 1);
        }
      }

      localStorage.setItem(
        'lemmy-slideshow-starred',
        JSON.stringify(starredPosts)
      );
      return { postId, starred };
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.posts(),
      });
    },
  });
}

// Hook for batch loading posts from multiple sources
export function useBatchPosts() {
  const { content, addToQueue, setLoading } = useAppStore();

  return useMutation({
    mutationFn: async () => {
      setLoading(true);
      const allPosts: SlideshowPost[] = [];

      try {
        // Fetch from selected communities
        for (const community of content.selectedCommunities) {
          const response = await apiClient.getPosts({
            community_id: community.id,
            sort: 'Hot',
            page: 1,
            limit: 20,
            type_: 'All',
          });

          const posts = response
            .filter((post: PostView) => {
              const hasMedia =
                post.post.url &&
                ((content.filters.mediaTypes.includes(MediaType.IMAGE) &&
                  /\.(jpe?g|png|gif|webp|avif)$/i.test(post.post.url)) ||
                  (content.filters.mediaTypes.includes(MediaType.VIDEO) &&
                    /\.(mp4|webm|ogg)$/i.test(post.post.url)) ||
                  (content.filters.mediaTypes.includes(MediaType.GIF) &&
                    /\.gif$/i.test(post.post.url)));

              const meetsMinScore =
                post.counts.score >= content.filters.minScore;
              const isNSFWAllowed = content.filters.showNSFW || !post.post.nsfw;

              return hasMedia && meetsMinScore && isNSFWAllowed;
            })
            .map(
              (post: PostView): SlideshowPost => ({
                id: post.post.id.toString(),
                postId: post.post.id,
                title: post.post.name,
                url: post.post.url!,
                mediaType: getMediaType(post.post.url!),
                thumbnailUrl: post.post.thumbnail_url,
                creator: post.creator,
                community: post.community,
                score: post.counts.score,
                published: post.post.published,
                nsfw: post.post.nsfw,
                starred: false,
                viewed: false,
              })
            );

          allPosts.push(...posts);
        }

        // Shuffle and deduplicate posts
        const uniquePosts = allPosts.filter(
          (post, index, self) =>
            index === self.findIndex((p) => p.id === post.id)
        );

        // Shuffle array
        for (let i = uniquePosts.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [uniquePosts[i], uniquePosts[j]] = [uniquePosts[j], uniquePosts[i]];
        }

        return uniquePosts;
      } finally {
        setLoading(false);
      }
    },
    onSuccess: (posts) => {
      addToQueue(posts);
    },
  });
}

// Utility function to determine media type
function getMediaType(url: string): MediaType {
  if (/\.gif$/i.test(url)) return MediaType.GIF;
  if (/\.(mp4|webm|ogg|avi|mov)$/i.test(url)) return MediaType.VIDEO;
  return MediaType.IMAGE;
}
