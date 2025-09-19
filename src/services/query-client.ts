import { QueryClient } from '@tanstack/react-query';

// Create a client with custom configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache time of 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep unused data for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 3 times
      retry: 3,
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Don't refetch on window focus by default
      refetchOnWindowFocus: false,
      // Don't refetch on reconnect by default
      refetchOnReconnect: false,
      // Don't refetch on mount if data exists
      refetchOnMount: false,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      // Retry delay for mutations
      retryDelay: 1000,
    },
  },
});

// Query key factory for consistent cache key management
export const queryKeys = {
  all: ['lemmy'] as const,

  posts: () => [...queryKeys.all, 'posts'] as const,
  post: (id: string) => [...queryKeys.posts(), id] as const,
  postsInCommunity: (communityId: number, params?: Record<string, any>) =>
    [...queryKeys.posts(), 'community', communityId, params] as const,
  postsFromUser: (userId: number, params?: Record<string, any>) =>
    [...queryKeys.posts(), 'user', userId, params] as const,

  communities: () => [...queryKeys.all, 'communities'] as const,
  community: (id: number) => [...queryKeys.communities(), id] as const,
  searchCommunities: (query: string) =>
    [...queryKeys.communities(), 'search', query] as const,

  users: () => [...queryKeys.all, 'users'] as const,
  user: (id: number) => [...queryKeys.users(), id] as const,
  searchUsers: (query: string) =>
    [...queryKeys.users(), 'search', query] as const,

  site: () => [...queryKeys.all, 'site'] as const,
  siteInfo: () => [...queryKeys.site(), 'info'] as const,
} as const;

// Query options factory for type safety
export const queryOptions = {
  posts: {
    community: (
      communityId: number,
      params: {
        sort?: string;
        page?: number;
        limit?: number;
        type_?: string;
      } = {}
    ) => ({
      queryKey: queryKeys.postsInCommunity(communityId, params),
      staleTime: 2 * 60 * 1000, // 2 minutes for posts
      gcTime: 5 * 60 * 1000, // 5 minutes
    }),

    user: (
      userId: number,
      params: {
        sort?: string;
        page?: number;
        limit?: number;
      } = {}
    ) => ({
      queryKey: queryKeys.postsFromUser(userId, params),
      staleTime: 2 * 60 * 1000, // 2 minutes for posts
      gcTime: 5 * 60 * 1000, // 5 minutes
    }),
  },

  communities: {
    search: (query: string) => ({
      queryKey: queryKeys.searchCommunities(query),
      staleTime: 5 * 60 * 1000, // 5 minutes for community searches
      gcTime: 10 * 60 * 1000, // 10 minutes
      enabled: query.length > 2, // Only search if query is at least 3 characters
    }),

    single: (id: number) => ({
      queryKey: queryKeys.community(id),
      staleTime: 10 * 60 * 1000, // 10 minutes for single community
      gcTime: 30 * 60 * 1000, // 30 minutes
    }),
  },

  users: {
    search: (query: string) => ({
      queryKey: queryKeys.searchUsers(query),
      staleTime: 5 * 60 * 1000, // 5 minutes for user searches
      gcTime: 10 * 60 * 1000, // 10 minutes
      enabled: query.length > 2, // Only search if query is at least 3 characters
    }),

    single: (id: number) => ({
      queryKey: queryKeys.user(id),
      staleTime: 10 * 60 * 1000, // 10 minutes for single user
      gcTime: 30 * 60 * 1000, // 30 minutes
    }),
  },

  site: {
    info: () => ({
      queryKey: queryKeys.siteInfo(),
      staleTime: 30 * 60 * 1000, // 30 minutes for site info
      gcTime: 60 * 60 * 1000, // 1 hour
    }),
  },
} as const;

// Utility functions for cache management
export const cacheUtils = {
  // Invalidate all posts
  invalidatePosts: () => {
    return queryClient.invalidateQueries({
      queryKey: queryKeys.posts(),
    });
  },

  // Invalidate posts from specific community
  invalidatePostsInCommunity: (communityId: number) => {
    return queryClient.invalidateQueries({
      queryKey: [...queryKeys.posts(), 'community', communityId],
      exact: false,
    });
  },

  // Invalidate posts from specific user
  invalidatePostsFromUser: (userId: number) => {
    return queryClient.invalidateQueries({
      queryKey: [...queryKeys.posts(), 'user', userId],
      exact: false,
    });
  },

  // Clear all cached data
  clearCache: () => {
    return queryClient.clear();
  },

  // Get cached data without triggering a fetch
  getCachedPosts: (communityId: number, params: Record<string, any> = {}) => {
    return queryClient.getQueryData(
      queryKeys.postsInCommunity(communityId, params)
    );
  },

  // Set cached data manually
  setCachedPosts: (
    communityId: number,
    params: Record<string, any>,
    data: any
  ) => {
    queryClient.setQueryData(
      queryKeys.postsInCommunity(communityId, params),
      data
    );
  },

  // Prefetch data
  prefetchPosts: async (
    communityId: number,
    params: Record<string, any> = {}
  ) => {
    return queryClient.prefetchQuery({
      ...queryOptions.posts.community(communityId, params),
      // Add fetch function here when available
    });
  },
} as const;
