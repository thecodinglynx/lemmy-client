import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LemmyAPIClient } from '@services/lemmy-api-client';
import { queryOptions, queryKeys } from '@services/query-client';
import { useAppStore } from '@stores/app-store';
import type { PostView, SlideshowPost } from '@types';
import { MediaType } from '@types';

// Function to get API client based on current server settings
function getApiClient() {
  const { settings } = useAppStore.getState();

  console.log('🔍 Current settings object:', settings);
  console.log('🔍 Current server settings:', settings.server);

  // Fallback to defaults if server settings are not initialized - match app-store.ts defaults
  const serverSettings = settings.server || {
    instanceUrl: 'https://lemmy.world',
    customProxy: false,
  };

  console.log('🔍 Final serverSettings used:', serverSettings);
  console.log('🔍 customProxy setting:', serverSettings.customProxy);
  console.log('🔍 instanceUrl setting:', serverSettings.instanceUrl);

  // Strip protocol from instanceUrl for consistent handling
  const cleanInstanceUrl = serverSettings.instanceUrl.replace(
    /^https?:\/\//,
    ''
  );

  const baseUrl = serverSettings.customProxy
    ? `http://localhost:5173/api/lemmy?server=${encodeURIComponent(cleanInstanceUrl)}`
    : `https://${cleanInstanceUrl}`;

  // Log which server we're connecting to
  console.log(
    `🌐 Connecting to Lemmy server: ${cleanInstanceUrl}${serverSettings.customProxy ? ' (via proxy)' : ' (direct)'}`
  );
  console.log(`🔗 API Base URL: ${baseUrl}`);

  return new LemmyAPIClient(baseUrl);
}

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
      const apiClient = getApiClient();
      const response = await apiClient.getPosts({
        community_id: communityId,
        sort: (params.sort || 'Hot') as any,
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

      console.log(`🔍 Searching for communities with query: "${query}"`);
      const apiClient = getApiClient();

      const response = await apiClient.searchCommunities(query, 50);
      console.log(
        `📊 Search response for "${query}":`,
        response.length,
        'communities found'
      );

      return response;
    },
  });
}

// Hook for getting site information
export function useSiteInfo() {
  return useQuery({
    ...queryOptions.site.info(),
    queryFn: async () => {
      const apiClient = getApiClient();
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
  const { content, setLoading, setPosts } = useAppStore();

  return useMutation({
    mutationFn: async () => {
      setLoading(true);
      const allPosts: SlideshowPost[] = [];

      try {
        const apiClient = getApiClient();

        // If no communities are selected, fetch from the "All" feed as fallback
        if (content.selectedCommunities.length === 0) {
          console.log('📡 No communities selected, fetching from All feed...');
          const response = await apiClient.getPosts({
            sort: 'Hot' as any,
            limit: 50, // Get more posts from All feed for variety
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
          console.log(`📊 Loaded ${posts.length} posts from All feed`);
        } else {
          // Fetch from selected communities
          console.log(
            `📡 Fetching from ${content.selectedCommunities.length} selected communities...`
          );
          for (const community of content.selectedCommunities) {
            console.log(
              `🏘️ Fetching posts from community: ${community.name} (ID: ${community.id})`
            );
            const response = await apiClient.getPosts({
              community_id: community.id,
              sort: 'Hot' as any,
              limit: 20,
              type_: 'All',
            });

            console.log(
              `📊 Raw response from ${community.name}: ${response.length} posts`
            );

            const posts = response
              .filter((post: PostView) => {
                const hasUrl = !!post.post.url;
                if (!hasUrl) {
                  console.log(`❌ Post "${post.post.name}" has no URL`);
                  return false;
                }

                const url = post.post.url!;
                const isImage = /\.(jpe?g|png|gif|webp|avif)$/i.test(url);
                const isVideo = /\.(mp4|webm|ogg)$/i.test(url);
                const isGif = /\.gif$/i.test(url);

                console.log(
                  `🔍 Post: "${post.post.name}" | URL: ${url.substring(0, 60)}...`
                );
                console.log(
                  `   - isImage: ${isImage} | isVideo: ${isVideo} | isGif: ${isGif}`
                );
                console.log(
                  `   - mediaTypes filter: ${JSON.stringify(content.filters.mediaTypes)}`
                );

                const hasMedia =
                  (content.filters.mediaTypes.includes(MediaType.IMAGE) &&
                    isImage) ||
                  (content.filters.mediaTypes.includes(MediaType.VIDEO) &&
                    isVideo) ||
                  (content.filters.mediaTypes.includes(MediaType.GIF) && isGif);

                const meetsMinScore =
                  post.counts.score >= content.filters.minScore;
                const isNSFWAllowed =
                  content.filters.showNSFW || !post.post.nsfw;

                console.log(
                  `   - hasMedia: ${hasMedia} | score: ${post.counts.score} (min: ${content.filters.minScore}) | NSFW: ${post.post.nsfw} (allowed: ${content.filters.showNSFW})`
                );
                console.log(
                  `   - Final result: ${hasMedia && meetsMinScore && isNSFWAllowed}`
                );

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

            console.log(
              `✅ After filtering ${community.name}: ${posts.length} valid media posts`
            );
            allPosts.push(...posts);
          }
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

        console.log(
          `📊 Final result: ${uniquePosts.length} unique posts ready for slideshow`
        );
        return uniquePosts;
      } finally {
        setLoading(false);
      }
    },
    onSuccess: (posts) => {
      setPosts(posts);
    },
  });
}

// Hook to check if a community has media content
export function useCheckCommunityMedia() {
  return useMutation({
    mutationFn: async (communityId: number) => {
      try {
        const apiClient = getApiClient();
        const response = await apiClient.getPosts({
          community_id: communityId,
          sort: 'Hot' as any,
          limit: 20, // Check first 20 posts for media
          type_: 'All',
        });

        // Check if any posts have media URLs
        const hasMedia = response.some((post: PostView) => {
          const url = post.post.url;
          return url && /\.(jpe?g|png|gif|webp|avif|mp4|webm|ogg)$/i.test(url);
        });

        return {
          hasMedia,
          totalPosts: response.length,
          mediaCount: response.filter((post: PostView) => {
            const url = post.post.url;
            return (
              url && /\.(jpe?g|png|gif|webp|avif|mp4|webm|ogg)$/i.test(url)
            );
          }).length,
        };
      } catch (error) {
        console.error('Error checking community media:', error);
        throw error;
      }
    },
  });
}

// Utility function to determine media type
function getMediaType(url: string): MediaType {
  if (/\.gif$/i.test(url)) return MediaType.GIF;
  if (/\.(mp4|webm|ogg|avi|mov)$/i.test(url)) return MediaType.VIDEO;
  return MediaType.IMAGE;
}
