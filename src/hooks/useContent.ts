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
      const slideshowPosts: SlideshowPost[] = response.posts
        .filter((post: PostView) => {
          // Filter by media type
          const hasMedia =
            post.post.url &&
            ((content.filters.mediaTypes.includes(MediaType.IMAGE) &&
              isImageUrl(post.post.url)) ||
              (content.filters.mediaTypes.includes(MediaType.VIDEO) &&
                isVideoUrl(post.post.url)) ||
              (content.filters.mediaTypes.includes(MediaType.GIF) &&
                isGifUrl(post.post.url)));

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
  const {
    content,
    setLoading,
    setPosts,
    getNextCursor,
    setGlobalCursor,
    setPaginationCursor,
    setHasMore,
  } = useAppStore();

  return useMutation({
    mutationFn: async () => {
      console.log('[useBatchPosts] 🚀 Starting batch post load mutation');
      setLoading(true);
      const allPosts: SlideshowPost[] = [];

      try {
        const apiClient = getApiClient();
        console.log(
          '[useBatchPosts] ✅ API client created, proceeding with fetch logic'
        );
        // Determine ordering based on settings
        const { settings } = useAppStore.getState();
        const ordering = settings.orderingMode || 'hot';
        const mapOrderingToSort = (mode: string): any => {
          switch (mode) {
            case 'new':
              return 'New';
            case 'active':
              return 'Active';
            case 'most-comments':
              return 'MostComments';
            case 'top-day':
              return 'TopDay';
            case 'top-week':
              return 'TopWeek';
            case 'top-month':
              return 'TopMonth';
            case 'top-year':
              return 'TopYear';
            case 'top-all':
              return 'TopAll';
            // 'random' and default fall back to 'Hot' as base sort before shuffle
            case 'random':
            case 'hot':
            default:
              return 'Hot';
          }
        };
        const baseSort = mapOrderingToSort(ordering);

        const blockedIds = new Set(
          (content.blockedCommunities || []).map((c) => c.id)
        );
        const feedMode = settings.feedMode || 'random-communities';

        if (feedMode === 'random-communities') {
          console.log(
            '📡 FeedMode=random-communities: fetching global feed sample'
          );

          // Get the current cursor for the global feed
          const currentCursor = getNextCursor();

          const response = await apiClient.getPosts({
            sort: baseSort as any,
            limit: 50, // Get more posts from All feed for variety
            type_: 'All',
            page_cursor: currentCursor,
          });
          console.log('[useBatchPosts] 🌐 Fetch to global feed completed');

          console.log(
            `📊 Raw response from All feed: ${response.posts.length} posts`
          );
          console.log(`📄 Next cursor available: ${!!response.nextCursor}`);

          // Update the global cursor for next time
          if (response.nextCursor) {
            setGlobalCursor(response.nextCursor as string);
            setHasMore(true);
          } else {
            // No further pages
            setHasMore(false);
          }

          const posts = response.posts
            .filter((post: PostView) => {
              console.log(`🔍 Checking post: "${post.post.name}"`);
              console.log(`   URL: ${post.post.url || 'NO URL'}`);

              if (!post.post.url) {
                console.log(`   ❌ No URL found`);
                return false;
              }

              const isImage = isImageUrl(post.post.url);
              const isVideo = isVideoUrl(post.post.url);
              const isGif = isGifUrl(post.post.url);

              console.log(
                `   Image: ${isImage} | Video: ${isVideo} | GIF: ${isGif}`
              );
              console.log(
                `   Media types enabled: ${JSON.stringify(content.filters.mediaTypes)}`
              );

              const hasMedia =
                (content.filters.mediaTypes.includes(MediaType.IMAGE) &&
                  isImage) ||
                (content.filters.mediaTypes.includes(MediaType.VIDEO) &&
                  isVideo) ||
                (content.filters.mediaTypes.includes(MediaType.GIF) && isGif);

              const meetsMinScore =
                post.counts.score >= content.filters.minScore;
              const isNSFWAllowed = content.filters.showNSFW || !post.post.nsfw;

              console.log(
                `   Has media: ${hasMedia} | Score: ${post.counts.score} >= ${content.filters.minScore} = ${meetsMinScore} | NSFW: ${post.post.nsfw} (allowed: ${content.filters.showNSFW}) = ${isNSFWAllowed}`
              );
              console.log(
                `   Final result: ${hasMedia && meetsMinScore && isNSFWAllowed}`
              );

              // Blocked community exclusion
              if (blockedIds.has(post.post.community_id)) return false;

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
        } else if (feedMode === 'communities') {
          // Determine active subset (if any defined)
          const activeIds = (settings as any).activeCommunityIds as
            | number[]
            | undefined;
          const communities =
            activeIds && activeIds.length > 0
              ? content.selectedCommunities.filter((c) =>
                  activeIds.includes(c.id)
                )
              : content.selectedCommunities;
          if (communities.length === 0) {
            console.log(
              '[useBatchPosts] ℹ️ No active communities selected (subset empty).'
            );
            setHasMore(false);
            return allPosts; // nothing to fetch
          }
          console.log(
            `📡 Fetching from ${communities.length} active communities (subset applied: ${!!activeIds && activeIds.length > 0})...`
          );
          for (const community of communities) {
            if (blockedIds.has(community.id)) {
              console.log(
                `⛔ Skipping blocked community ${community.name} (${community.id})`
              );
              continue;
            }
            console.log(
              `🏘️ Fetching posts from community: ${community.name} (ID: ${community.id})`
            );

            // Get the current cursor for this community
            const currentCursor = getNextCursor(community.id.toString());
            const communityFetchStart = performance.now();
            let communityErrored = false;

            let response = await apiClient.getPosts({
              community_id: community.id,
              sort: baseSort as any,
              limit: 20,
              type_: 'All',
              page_cursor: currentCursor,
            });
            console.log(
              `[useBatchPosts] ⏱️ Community ${community.name} fetch took ${Math.round(
                performance.now() - communityFetchStart
              )}ms`
            );
            if (!response || !Array.isArray(response.posts)) {
              console.warn(
                `[useBatchPosts] ⚠️ Unexpected response shape for community ${community.name}`
              );
              communityErrored = true;
            }
            console.log(
              `[useBatchPosts] 🌐 Fetch completed for community ${community.name}`
            );

            console.log(
              `📊 Raw response from ${community.name}: ${response.posts.length} posts`
            );
            console.log(`📄 Next cursor available: ${!!response.nextCursor}`);

            // Update the cursor for this community for next time
            if (response.nextCursor) {
              setPaginationCursor(
                community.id.toString(),
                response.nextCursor as string
              );
              setHasMore(true);
            } else {
              setHasMore(false);
            }

            let posts = response.posts
              .filter((post: PostView) => {
                const hasUrl = !!post.post.url;
                if (!hasUrl) {
                  console.log(`❌ Post "${post.post.name}" has no URL`);
                  return false;
                }

                const url = post.post.url!;
                const isImage = isImageUrl(url);
                const isVideo = isVideoUrl(url);
                const isGif = isGifUrl(url);

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

                if (blockedIds.has(post.post.community_id)) return false;
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

            // Fallback: if this ordering produced 0 posts for this community, try Hot
            if (
              posts.length === 0 &&
              ordering !== 'hot' &&
              ordering !== 'random'
            ) {
              console.warn(
                `[useBatchPosts] ⚠️ No media after filtering for community ${community.name} with sort ${baseSort}. Falling back to Hot.`
              );
              const fallbackResp = await apiClient.getPosts({
                community_id: community.id,
                sort: 'Hot' as any,
                limit: 20,
                type_: 'All',
              });
              posts = fallbackResp.posts
                .filter((post: PostView) => {
                  if (!post.post.url) return false;
                  const url = post.post.url!;
                  const isImage = isImageUrl(url);
                  const isVideo = isVideoUrl(url);
                  const isGif = isGifUrl(url);
                  const hasMedia =
                    (content.filters.mediaTypes.includes(MediaType.IMAGE) &&
                      isImage) ||
                    (content.filters.mediaTypes.includes(MediaType.VIDEO) &&
                      isVideo) ||
                    (content.filters.mediaTypes.includes(MediaType.GIF) &&
                      isGif);
                  const meetsMinScore =
                    post.counts.score >= content.filters.minScore;
                  const isNSFWAllowed =
                    content.filters.showNSFW || !post.post.nsfw;
                  if (blockedIds.has(post.post.community_id)) return false;
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
              if (posts.length > 0) {
                console.warn(
                  `[useBatchPosts] ✅ Fallback Hot fetched ${posts.length} media posts for community ${community.name}`
                );
              }
            }

            console.log(
              `✅ After filtering ${community.name}: ${posts.length} valid media posts`
            );
            allPosts.push(...posts);
            if (
              !communityErrored &&
              posts.length === 0 &&
              !response.nextCursor
            ) {
              console.log(
                `[useBatchPosts] 🔚 Community ${community.name} appears exhausted (no cursor, no posts)`
              );
            }
          }

          // Supplement with selected users if any (communities mode)
          if (content.selectedUsers.length > 0) {
            console.log(
              `👤 Fetching posts for ${content.selectedUsers.length} selected users (client-side filter)...`
            );
            // Single wider global fetch to reduce API calls
            const response = await apiClient.getPosts({
              sort: baseSort as any,
              limit: 60,
              type_: 'All',
            });
            const selectedIds = new Set(content.selectedUsers.map((u) => u.id));
            const selectedNames = new Set(
              content.selectedUsers.map((u) => u.name.toLowerCase())
            );
            const userPosts = response.posts
              .filter((post: PostView) => {
                if (!post.post.url) return false;
                const creatorName = post.creator.name?.toLowerCase?.();
                if (
                  !selectedIds.has(post.post.creator_id) &&
                  !(creatorName && selectedNames.has(creatorName))
                )
                  return false;
                if (blockedIds.has(post.post.community_id)) return false;
                const url = post.post.url!;
                const isImage = isImageUrl(url);
                const isVideo = isVideoUrl(url);
                const isGif = isGifUrl(url);
                const hasMedia =
                  (content.filters.mediaTypes.includes(MediaType.IMAGE) &&
                    isImage) ||
                  (content.filters.mediaTypes.includes(MediaType.VIDEO) &&
                    isVideo) ||
                  (content.filters.mediaTypes.includes(MediaType.GIF) && isGif);
                if (!hasMedia) return false;
                if (post.counts.score < content.filters.minScore) return false;
                if (!content.filters.showNSFW && post.post.nsfw) return false;
                return true;
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
            if (
              userPosts.length === 0 &&
              ordering !== 'hot' &&
              ordering !== 'random'
            ) {
              console.warn(
                '[useBatchPosts] ⚠️ No media for selected users under chosen sort. Fallback to Hot.'
              );
              const fb = await apiClient.getPosts({
                sort: 'Hot' as any,
                limit: 60,
                type_: 'All',
              });
              const fbUserPosts = fb.posts
                .filter((post: PostView) => {
                  if (!post.post.url) return false;
                  const creatorName = post.creator.name?.toLowerCase?.();
                  if (
                    !selectedIds.has(post.post.creator_id) &&
                    !(creatorName && selectedNames.has(creatorName))
                  )
                    return false;
                  if (blockedIds.has(post.post.community_id)) return false;
                  const url = post.post.url!;
                  const isImage = isImageUrl(url);
                  const isVideo = isVideoUrl(url);
                  const isGif = isGifUrl(url);
                  const hasMedia =
                    (content.filters.mediaTypes.includes(MediaType.IMAGE) &&
                      isImage) ||
                    (content.filters.mediaTypes.includes(MediaType.VIDEO) &&
                      isVideo) ||
                    (content.filters.mediaTypes.includes(MediaType.GIF) &&
                      isGif);
                  if (!hasMedia) return false;
                  if (post.counts.score < content.filters.minScore)
                    return false;
                  if (!content.filters.showNSFW && post.post.nsfw) return false;
                  return true;
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
              if (fbUserPosts.length > 0) {
                console.warn(
                  `[useBatchPosts] ✅ Hot fallback yielded ${fbUserPosts.length} user media posts.`
                );
                allPosts.push(...fbUserPosts);
              }
            } else {
              console.log(
                `✅ After filtering selected users: ${userPosts.length} media posts`
              );
              allPosts.push(...userPosts);
            }
          }
        }

        // Deduplicate first
        const uniquePosts = allPosts.filter(
          (post, index, self) =>
            index === self.findIndex((p) => p.id === post.id)
        );
        // Apply ordering post-processing
        if (ordering === 'random') {
          for (let i = uniquePosts.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [uniquePosts[i], uniquePosts[j]] = [uniquePosts[j], uniquePosts[i]];
          }
        } else if (ordering === 'new') {
          uniquePosts.sort(
            (a, b) =>
              new Date(b.published).getTime() - new Date(a.published).getTime()
          );
        } else if (ordering === 'active') {
          // Lacking comment freshness metadata here; fall back to score tie-breaker
          uniquePosts.sort(
            (a, b) =>
              b.score - a.score ||
              new Date(b.published).getTime() - new Date(a.published).getTime()
          );
        } else if (
          ordering.startsWith('top-') ||
          ordering === 'most-comments' ||
          ordering === 'hot'
        ) {
          // Preserve API order (already sorted) but ensure stable fallback tie-breakers
          // No resort needed; optionally could enforce deterministic tie-break
        }

        console.log(
          `📊 Final result: ${uniquePosts.length} unique posts after community fetch`
        );
        if (feedMode === 'users' && uniquePosts.length === 0) {
          console.warn(
            '[useBatchPosts] Users-only mode produced 0 posts. Check if selected user IDs match API person_id and that their recent posts include media URLs.'
          );
        }

        // If we ended up with 0 or 1 posts after selecting communities, fetch supplemental content from global feed
        if (
          feedMode !== 'users' && // In users-only mode we rely on per-user pagination, skip global supplement
          (content.selectedCommunities.length > 0 ||
            content.selectedUsers.length > 0) &&
          uniquePosts.length <= 1
        ) {
          console.warn(
            '[useBatchPosts] ⚠️ Insufficient media from selected communities (<=1). Fetching supplemental global feed posts.'
          );
          try {
            const currentCursor = getNextCursor();
            const response = await getApiClient().getPosts({
              sort: baseSort as any,
              limit: 40,
              type_: 'All',
              page_cursor: currentCursor,
            });
            const supplemental = response.posts
              .filter((post: PostView) => {
                if (!post.post.url) return false;
                if (blockedIds.has(post.post.community_id)) return false;
                const url = post.post.url;
                return (
                  (content.filters.mediaTypes.includes(MediaType.IMAGE) &&
                    isImageUrl(url)) ||
                  (content.filters.mediaTypes.includes(MediaType.VIDEO) &&
                    isVideoUrl(url)) ||
                  (content.filters.mediaTypes.includes(MediaType.GIF) &&
                    isGifUrl(url))
                );
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
            console.warn(
              `[useBatchPosts] 🛟 Supplemental global feed supplied ${supplemental.length} posts.`
            );
            // Merge & dedupe again
            const merged = [...uniquePosts, ...supplemental].filter(
              (post, index, self) =>
                index === self.findIndex((p) => p.id === post.id)
            );
            console.log(
              `[useBatchPosts] 📊 Final merged posts count: ${merged.length}`
            );
            return merged;
          } catch (suppErr) {
            console.error(
              '[useBatchPosts] ❌ Supplemental global fetch failed:',
              suppErr
            );
          }
        }

        // Fallback: if we selected communities but ended with zero posts (over-filter / no media)
        if (
          feedMode !== 'users' &&
          (content.selectedCommunities.length > 0 ||
            content.selectedUsers.length > 0) &&
          uniquePosts.length === 0
        ) {
          console.warn(
            '⚠️ No media posts found in selected communities. Attempting one-time fallback to All feed.'
          );
          try {
            const currentCursor = getNextCursor();
            const response = await getApiClient().getPosts({
              sort: baseSort as any,
              limit: 30,
              type_: 'All',
              page_cursor: currentCursor,
            });
            const fallbackPosts = response.posts
              .filter((post: PostView) => {
                if (!post.post.url) return false;
                if (blockedIds.has(post.post.community_id)) return false;
                const url = post.post.url;
                return (
                  (content.filters.mediaTypes.includes(MediaType.IMAGE) &&
                    isImageUrl(url)) ||
                  (content.filters.mediaTypes.includes(MediaType.VIDEO) &&
                    isVideoUrl(url)) ||
                  (content.filters.mediaTypes.includes(MediaType.GIF) &&
                    isGifUrl(url))
                );
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
            console.warn(
              `🛟 Fallback All feed supplied ${fallbackPosts.length} posts.`
            );
            return fallbackPosts;
          } catch (fallbackErr) {
            console.error('❌ Fallback to All feed failed:', fallbackErr);
            return uniquePosts; // still empty
          }
        }

        return uniquePosts;
      } finally {
        setLoading(false);
      }
    },
    onSuccess: (posts) => {
      console.log(
        `✅ Mutation success - setting ${posts.length} posts to slideshow state`
      );
      setPosts(posts);
    },
  });
}

// Hook to load additional posts when user nears end of slideshow
export function useLoadMorePosts() {
  const {
    content,
    setLoading,
    addPosts,
    getNextCursor,
    setGlobalCursor,
    setPaginationCursor,
    setHasMore,
  } = useAppStore();

  return useMutation({
    mutationFn: async () => {
      if (!content.hasMore) return [] as SlideshowPost[];
      setLoading(true);
      const apiClient = getApiClient();
      const newPosts: SlideshowPost[] = [];
      try {
        const { settings } = useAppStore.getState();
        const ordering = settings.orderingMode || 'hot';
        const mapOrderingToSort = (mode: string): any => {
          switch (mode) {
            case 'new':
              return 'New';
            case 'active':
              return 'Active';
            case 'most-comments':
              return 'MostComments';
            case 'top-day':
              return 'TopDay';
            case 'top-week':
              return 'TopWeek';
            case 'top-month':
              return 'TopMonth';
            case 'top-year':
              return 'TopYear';
            case 'top-all':
              return 'TopAll';
            case 'random':
            case 'hot':
            default:
              return 'Hot';
          }
        };
        const baseSort = mapOrderingToSort(ordering);
        const blockedIds = new Set(
          (content.blockedCommunities || []).map((c) => c.id)
        );
        const feedMode = settings.feedMode || 'random-communities';

        // Users-only mode branch
        if (feedMode === 'users') {
          if (content.selectedUsers.length === 0) {
            setHasMore(false);
            return [] as SlideshowPost[];
          }
          const selectedIds = new Set(content.selectedUsers.map((u) => u.id));
          const selectedNames = new Set(
            content.selectedUsers.map((u) => u.name.toLowerCase())
          );
          const cursor = getNextCursor();
          const response = await apiClient.getPosts({
            sort: baseSort as any,
            limit: 80,
            type_: 'All',
            page_cursor: cursor,
          });
          if (response.nextCursor) {
            setGlobalCursor(response.nextCursor as string);
          } else {
            setHasMore(false);
          }
          response.posts.forEach((post: PostView) => {
            if (!post.post.url) return;
            const creatorName = post.creator.name?.toLowerCase?.();
            if (
              !selectedIds.has(post.post.creator_id) &&
              !(creatorName && selectedNames.has(creatorName))
            )
              return;
            if (blockedIds.has(post.post.community_id)) return;
            const url = post.post.url;
            const isImage = isImageUrl(url);
            const isVideo = isVideoUrl(url);
            const isGif = isGifUrl(url);
            const hasMedia =
              (content.filters.mediaTypes.includes(MediaType.IMAGE) &&
                isImage) ||
              (content.filters.mediaTypes.includes(MediaType.VIDEO) &&
                isVideo) ||
              (content.filters.mediaTypes.includes(MediaType.GIF) && isGif);
            if (!hasMedia) return;
            if (post.counts.score < content.filters.minScore) return;
            if (!content.filters.showNSFW && post.post.nsfw) return;
            newPosts.push({
              id: post.post.id.toString(),
              postId: post.post.id,
              title: post.post.name,
              url: url!,
              mediaType: getMediaType(url!),
              thumbnailUrl: post.post.thumbnail_url,
              creator: post.creator,
              community: post.community,
              score: post.counts.score,
              published: post.post.published,
              nsfw: post.post.nsfw,
              starred: false,
              viewed: false,
            });
          });
          return newPosts;
        }

        if (
          content.selectedCommunities.length === 0 &&
          content.selectedUsers.length === 0
        ) {
          const cursor = getNextCursor();
          const response = await apiClient.getPosts({
            sort: baseSort as any,
            limit: 40,
            type_: 'All',
            page_cursor: cursor,
          });
          if (response.nextCursor) {
            setGlobalCursor(response.nextCursor as string);
          } else {
            setHasMore(false);
          }
          response.posts.forEach((post: PostView) => {
            if (!post.post.url) return;
            if (blockedIds.has(post.post.community_id)) return;
            const url = post.post.url;
            if (!url) return;
            const isImage = isImageUrl(url);
            const isVideo = isVideoUrl(url);
            const isGif = isGifUrl(url);
            const hasMedia =
              (content.filters.mediaTypes.includes(MediaType.IMAGE) &&
                isImage) ||
              (content.filters.mediaTypes.includes(MediaType.VIDEO) &&
                isVideo) ||
              (content.filters.mediaTypes.includes(MediaType.GIF) && isGif);
            if (!hasMedia) return;
            if (post.counts.score < content.filters.minScore) return;
            if (!content.filters.showNSFW && post.post.nsfw) return;
            newPosts.push({
              id: post.post.id.toString(),
              postId: post.post.id,
              title: post.post.name,
              url: url,
              mediaType: getMediaType(url),
              thumbnailUrl: post.post.thumbnail_url,
              creator: post.creator,
              community: post.community,
              score: post.counts.score,
              published: post.post.published,
              nsfw: post.post.nsfw,
              starred: false,
              viewed: false,
            });
          });
        } else {
          // Communities fetch (subset-aware) if any
          const activeIds = (useAppStore.getState().settings as any)
            .activeCommunityIds as number[] | undefined;
          const communities =
            activeIds && activeIds.length > 0
              ? content.selectedCommunities.filter((c) =>
                  activeIds.includes(c.id)
                )
              : content.selectedCommunities;
          if (communities.length === 0) {
            console.log(
              '[useLoadMorePosts] ℹ️ No active communities subset to load.'
            );
          }
          for (const community of communities) {
            if (blockedIds.has(community.id)) {
              console.log(
                `⛔ (loadMore) Skipping blocked community ${community.name} (${community.id})`
              );
              continue;
            }
            const cursor = getNextCursor(community.id.toString());
            let response = await apiClient.getPosts({
              community_id: community.id,
              sort: baseSort as any,
              limit: 20,
              type_: 'All',
              page_cursor: cursor,
            });
            if (response.nextCursor) {
              setPaginationCursor(
                community.id.toString(),
                response.nextCursor as string
              );
            } else {
              // If one community has no next page, we set hasMore to false only if ALL are exhausted
              // This simple approach: track absence and evaluate after loop
            }
            let communityPosts = response.posts.filter((post: PostView) => {
              if (!post.post.url) return false;
              if (blockedIds.has(post.post.community_id)) return false;
              const url = post.post.url;
              const isImage = isImageUrl(url);
              const isVideo = isVideoUrl(url);
              const isGif = isGifUrl(url);
              const hasMedia =
                (content.filters.mediaTypes.includes(MediaType.IMAGE) &&
                  isImage) ||
                (content.filters.mediaTypes.includes(MediaType.VIDEO) &&
                  isVideo) ||
                (content.filters.mediaTypes.includes(MediaType.GIF) && isGif);
              if (!hasMedia) return false;
              if (post.counts.score < content.filters.minScore) return false;
              if (!content.filters.showNSFW && post.post.nsfw) return false;
              return true;
            });
            // Fallback to Hot if empty under non-hot/random ordering
            if (
              communityPosts.length === 0 &&
              ordering !== 'hot' &&
              ordering !== 'random'
            ) {
              console.warn(
                `[useLoadMorePosts] ⚠️ No posts for community ${community.name} under ${baseSort}. Fallback to Hot.`
              );
              const fb = await apiClient.getPosts({
                community_id: community.id,
                sort: 'Hot' as any,
                limit: 20,
                type_: 'All',
              });
              communityPosts = fb.posts.filter((post: PostView) => {
                if (!post.post.url) return false;
                if (blockedIds.has(post.post.community_id)) return false;
                const url = post.post.url;
                const isImage = isImageUrl(url);
                const isVideo = isVideoUrl(url);
                const isGif = isGifUrl(url);
                const hasMedia =
                  (content.filters.mediaTypes.includes(MediaType.IMAGE) &&
                    isImage) ||
                  (content.filters.mediaTypes.includes(MediaType.VIDEO) &&
                    isVideo) ||
                  (content.filters.mediaTypes.includes(MediaType.GIF) && isGif);
                if (!hasMedia) return false;
                if (post.counts.score < content.filters.minScore) return false;
                if (!content.filters.showNSFW && post.post.nsfw) return false;
                return true;
              });
            }
            communityPosts.forEach((post: PostView) => {
              const url = post.post.url!;
              newPosts.push({
                id: post.post.id.toString(),
                postId: post.post.id,
                title: post.post.name,
                url: url,
                mediaType: getMediaType(url),
                thumbnailUrl: post.post.thumbnail_url,
                creator: post.creator,
                community: post.community,
                score: post.counts.score,
                published: post.post.published,
                nsfw: post.post.nsfw,
                starred: false,
                viewed: false,
              });
            });
          }
          // Users fetch (client-side filter) if users selected
          if (content.selectedUsers.length > 0) {
            const response = await apiClient.getPosts({
              sort: baseSort as any,
              limit: 50,
              type_: 'All',
            });
            const selectedIds = new Set(content.selectedUsers.map((u) => u.id));
            let userPosts = response.posts.filter((post: PostView) => {
              if (!post.post.url) return false;
              if (blockedIds.has(post.post.community_id)) return false;
              if (!selectedIds.has(post.post.creator_id)) return false;
              const url = post.post.url;
              const isImage = isImageUrl(url);
              const isVideo = isVideoUrl(url);
              const isGif = isGifUrl(url);
              const hasMedia =
                (content.filters.mediaTypes.includes(MediaType.IMAGE) &&
                  isImage) ||
                (content.filters.mediaTypes.includes(MediaType.VIDEO) &&
                  isVideo) ||
                (content.filters.mediaTypes.includes(MediaType.GIF) && isGif);
              if (!hasMedia) return false;
              if (post.counts.score < content.filters.minScore) return false;
              if (!content.filters.showNSFW && post.post.nsfw) return false;
              return true;
            });
            if (
              userPosts.length === 0 &&
              ordering !== 'hot' &&
              ordering !== 'random'
            ) {
              console.warn(
                '[useLoadMorePosts] ⚠️ No filtered user posts under current sort. Fallback to Hot.'
              );
              const fb = await apiClient.getPosts({
                sort: 'Hot' as any,
                limit: 50,
                type_: 'All',
              });
              userPosts = fb.posts.filter((post: PostView) => {
                if (!post.post.url) return false;
                if (blockedIds.has(post.post.community_id)) return false;
                if (!selectedIds.has(post.post.creator_id)) return false;
                const url = post.post.url;
                const isImage = isImageUrl(url);
                const isVideo = isVideoUrl(url);
                const isGif = isGifUrl(url);
                const hasMedia =
                  (content.filters.mediaTypes.includes(MediaType.IMAGE) &&
                    isImage) ||
                  (content.filters.mediaTypes.includes(MediaType.VIDEO) &&
                    isVideo) ||
                  (content.filters.mediaTypes.includes(MediaType.GIF) && isGif);
                if (!hasMedia) return false;
                if (post.counts.score < content.filters.minScore) return false;
                if (!content.filters.showNSFW && post.post.nsfw) return false;
                return true;
              });
            }
            userPosts.forEach((post: PostView) => {
              const url = post.post.url!;
              newPosts.push({
                id: post.post.id.toString(),
                postId: post.post.id,
                title: post.post.name,
                url: url,
                mediaType: getMediaType(url),
                thumbnailUrl: post.post.thumbnail_url,
                creator: post.creator,
                community: post.community,
                score: post.counts.score,
                published: post.post.published,
                nsfw: post.post.nsfw,
                starred: false,
                viewed: false,
              });
            });
          }
        }
        return newPosts;
      } finally {
        setLoading(false);
      }
    },
    onSuccess: (newPosts) => {
      if (!newPosts || newPosts.length === 0) {
        // No new posts returned -> assume no more
        setHasMore(false);
        return;
      }
      // De-duplicate against existing posts
      const existingIds = new Set(
        useAppStore.getState().slideshow.posts.map((p) => p.id)
      );
      const filtered = newPosts.filter((p) => !existingIds.has(p.id));
      if (filtered.length > 0) {
        addPosts(filtered);
        // If ordering is random, reshuffle appended posts lightly (optional: only shuffle new subset)
        const { settings } = useAppStore.getState();
        if (settings.orderingMode === 'random') {
          const state = useAppStore.getState();
          const posts = [...state.slideshow.posts];
          for (let i = posts.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [posts[i], posts[j]] = [posts[j], posts[i]];
          }
          state.setPosts(posts);
        } else if (settings.orderingMode === 'new') {
          const state = useAppStore.getState();
          state.setPosts(
            [...state.slideshow.posts].sort(
              (a, b) =>
                new Date(b.published).getTime() -
                new Date(a.published).getTime()
            )
          );
        }
      }
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
        const hasMedia = response.posts.some((post: PostView) => {
          const url = post.post.url;
          return url && (isImageUrl(url) || isVideoUrl(url) || isGifUrl(url));
        });

        return {
          hasMedia,
          totalPosts: response.posts.length,
          mediaCount: response.posts.filter((post: PostView) => {
            const url = post.post.url;
            return url && (isImageUrl(url) || isVideoUrl(url) || isGifUrl(url));
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
  if (isGifUrl(url)) return MediaType.GIF;
  if (isVideoUrl(url)) return MediaType.VIDEO;
  return MediaType.IMAGE;
}

// Enhanced media detection functions
function isImageUrl(url: string): boolean {
  // Traditional file extensions
  if (/\.(jpe?g|png|gif|webp|avif|bmp|tiff?)$/i.test(url)) {
    return true;
  }

  // Common image hosting patterns
  const imageHostPatterns = [
    /imgur\.com\/[a-zA-Z0-9]+/i, // imgur.com/abc123
    /i\.imgur\.com\/[a-zA-Z0-9]+/i, // i.imgur.com/abc123
    /redd\.it\/[a-zA-Z0-9]+/i, // i.redd.it/abc123
    /preview\.redd\.it\/[a-zA-Z0-9]/i, // preview.redd.it/abc123
    /pictrs\/image\/[a-zA-Z0-9-]+/i, // lemmy pictrs images
    /images\.unsplash\.com/i, // unsplash
    /cdn\.discordapp\.com.*\.(jpe?g|png|gif|webp)/i, // discord cdn
    /media\.discordapp\.net.*\.(jpe?g|png|gif|webp)/i, // discord media
  ];

  return imageHostPatterns.some((pattern) => pattern.test(url));
}

function isVideoUrl(url: string): boolean {
  // Traditional video file extensions
  if (/\.(mp4|webm|ogg|avi|mov|mkv|m4v|3gp|flv)$/i.test(url)) {
    return true;
  }

  // Common video hosting patterns
  const videoHostPatterns = [
    /v\.redd\.it\/[a-zA-Z0-9]+/i, // v.redd.it/abc123
    /youtube\.com\/watch\?v=/i, // youtube
    /youtu\.be\/[a-zA-Z0-9_-]+/i, // youtube short links
    /vimeo\.com\/[0-9]+/i, // vimeo
    /streamable\.com\/[a-zA-Z0-9]+/i, // streamable
    /gfycat\.com\/[a-zA-Z0-9]+/i, // gfycat
    /redgifs\.com\/watch\/[a-zA-Z0-9]+/i, // redgifs
  ];

  return videoHostPatterns.some((pattern) => pattern.test(url));
}

function isGifUrl(url: string): boolean {
  // Traditional gif extension
  if (/\.gif$/i.test(url)) {
    return true;
  }

  // Gif hosting patterns
  const gifHostPatterns = [
    /giphy\.com\/gifs\/[a-zA-Z0-9-]+/i, // giphy
    /tenor\.com\/view\/[a-zA-Z0-9-]+/i, // tenor
    /imgur\.com\/[a-zA-Z0-9]+\.gif/i, // imgur gif direct
    /i\.imgur\.com\/[a-zA-Z0-9]+\.gif/i, // imgur gif
  ];

  return gifHostPatterns.some((pattern) => pattern.test(url));
}
