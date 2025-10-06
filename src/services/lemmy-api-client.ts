import type {
  GetPosts,
  GetPostsResponse,
  GetCommunity,
  ListCommunities,
  PostView as LemmyPostView,
  Community as LemmyCommunity,
  Person as LemmyPerson,
  PaginationCursor,
} from 'lemmy-js-client';
import { RateLimiter } from './rate-limiter';
import { ErrorHandler } from './error-handler';
import { CONTENT_FILTERS } from '@constants';
import { isValidCommunityId, logInvalidCommunityId } from '@utils/validation';
import type { PostView, Community, Person, SiteInfo } from '@types';

// Re-export lemmy-js-client types
export type { GetPosts as GetPostsParams } from 'lemmy-js-client';

// Interface for paginated posts response
export interface PaginatedPostsResponse {
  posts: PostView[];
  nextCursor?: PaginationCursor;
  prevCursor?: PaginationCursor;
}

// Helper function to transform lemmy-js-client PostView to our PostView type
function transformPostView(lemmyPost: LemmyPostView): PostView {
  return {
    post: {
      id: lemmyPost.post.id,
      name: lemmyPost.post.name,
      url: lemmyPost.post.url,
      body: lemmyPost.post.body,
      creator_id: lemmyPost.post.creator_id,
      community_id: lemmyPost.post.community_id,
      removed: lemmyPost.post.removed,
      locked: lemmyPost.post.locked,
      published: lemmyPost.post.published_at,
      updated: lemmyPost.post.updated_at,
      deleted: lemmyPost.post.deleted,
      nsfw: lemmyPost.post.nsfw,
      ap_id: lemmyPost.post.ap_id || '',
      local: lemmyPost.post.local,
      featured_community: lemmyPost.post.featured_community,
      featured_local: lemmyPost.post.featured_local,
      thumbnail_url: lemmyPost.post.thumbnail_url,
      embed_title: lemmyPost.post.embed_title,
      embed_description: lemmyPost.post.embed_description,
      embed_video_url: lemmyPost.post.embed_video_url,
    },
    creator: transformPerson(lemmyPost.creator),
    community: transformCommunity(lemmyPost.community),
    creator_banned_from_community:
      lemmyPost.creator_banned_from_community || false,
    counts: {
      id: 0, // Default value as this field doesn't exist in new API
      post_id: lemmyPost.post.id,
      comments:
        (lemmyPost as any).counts?.comments ??
        (lemmyPost as any).counts?.comment_count ??
        0,
      score:
        (lemmyPost as any).counts?.score ??
        (lemmyPost as any).counts?.score_total ??
        0,
      upvotes:
        (lemmyPost as any).counts?.upvotes ??
        (lemmyPost as any).counts?.upvote_count ??
        0,
      downvotes:
        (lemmyPost as any).counts?.downvotes ??
        (lemmyPost as any).counts?.downvote_count ??
        0,
      published: lemmyPost.post.published_at,
      newest_comment_time_necro: lemmyPost.post.published_at,
      newest_comment_time: lemmyPost.post.published_at,
      featured_community: lemmyPost.post.featured_community,
      featured_local: lemmyPost.post.featured_local,
      hot_rank: 0, // Would need to be calculated
      hot_rank_active: 0, // Would need to be calculated
    },
    subscribed: 'NotSubscribed', // Default value
    saved: !!lemmyPost.post_actions?.saved_at,
    read: !!lemmyPost.post_actions?.read_at,
    creator_blocked: lemmyPost.creator_banned || false,
    my_vote: lemmyPost.post_actions?.like_score ?? undefined,
    unread_comments: 0, // Would need to be calculated
  };
}

// Helper function to transform lemmy-js-client Community to our Community type
function transformCommunity(lemmyCommunity: LemmyCommunity): Community {
  return {
    id: lemmyCommunity.id,
    name: lemmyCommunity.name,
    title: lemmyCommunity.title,
    description: lemmyCommunity.description,
    removed: lemmyCommunity.removed,
    published: lemmyCommunity.published_at,
    updated: lemmyCommunity.updated_at,
    deleted: lemmyCommunity.deleted,
    nsfw: lemmyCommunity.nsfw,
    actor_id: lemmyCommunity.ap_id, // Map ap_id to actor_id
    local: lemmyCommunity.local,
    icon: lemmyCommunity.icon,
    banner: lemmyCommunity.banner,
    followers_url: '', // Not available in new API, provide default
    inbox_url: '', // Not available in new API, provide default
    shared_inbox_url: undefined, // Not available in new API
    hidden: false, // Not available in new API, provide default
    posting_restricted_to_mods: lemmyCommunity.posting_restricted_to_mods,
    instance_id: lemmyCommunity.instance_id,
  };
}

// Helper function to transform lemmy-js-client Person to our Person type
function transformPerson(lemmyPerson: LemmyPerson): Person {
  return {
    id: lemmyPerson.id,
    name: lemmyPerson.name,
    display_name: lemmyPerson.display_name,
    avatar: lemmyPerson.avatar,
    banned: false, // Not available in new API, provide default
    published: lemmyPerson.published_at,
    updated: lemmyPerson.updated_at,
    actor_id: lemmyPerson.ap_id, // Map ap_id to actor_id
    bio: lemmyPerson.bio,
    local: lemmyPerson.local,
    banner: lemmyPerson.banner,
    deleted: lemmyPerson.deleted,
    inbox_url: '', // Not available in new API, provide default
    shared_inbox_url: undefined, // Not available in new API
    matrix_user_id: lemmyPerson.matrix_user_id,
    admin: false, // Not available in new API, provide default
    bot_account: lemmyPerson.bot_account,
    ban_expires: undefined, // Not available in new API
  };
}

// Creating a custom HTTP client that bypasses lemmy-js-client's v4 hardcoding
class CustomLemmyHttp {
  private baseUrl: string;
  private headers: Record<string, string> = {};
  private isProxy: boolean = false;
  private serverParam: string | null = null;
  private static REQUEST_TIMEOUT_MS = 10000; // Fallback; can be tuned

  constructor(baseUrl: string) {
    console.log('🔧 CustomLemmyHttp constructor called with baseUrl:', baseUrl);

    // Check if using our local proxy
    if (baseUrl.includes('localhost:5173/api/lemmy')) {
      this.isProxy = true;
      // Extract server parameter if present
      const url = new URL(baseUrl);
      this.serverParam = url.searchParams.get('server');
      // Set base URL without query parameters
      this.baseUrl = `${url.protocol}//${url.host}${url.pathname}`;
      console.log(
        '🌐 Proxy mode detected - server:',
        this.serverParam,
        'baseUrl:',
        this.baseUrl
      );
    } else {
      // For direct connections, add /api/v3
      this.isProxy = false;
      this.baseUrl = `${baseUrl.replace(/\/+$/, '')}/api/v3`;
      console.log('🔗 Direct mode - baseUrl:', this.baseUrl);
    }
  }

  setHeaders(headers: Record<string, string>) {
    this.headers = { ...this.headers, ...headers };
  }

  private async makeRequest<T>(endpoint: string, params?: any): Promise<T> {
    const start = performance.now();
    let url = `${this.baseUrl}${endpoint}`;

    // Create URL object to handle query parameters properly
    const urlObj = new URL(url);

    // If using proxy, add the server parameter
    if (this.isProxy && this.serverParam) {
      urlObj.searchParams.set('server', this.serverParam);
    }

    // Add endpoint parameters to the URL
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          urlObj.searchParams.append(key, String(value));
        }
      });
    }

    const finalUrl = urlObj.toString();
    console.log('📡 Making request to:', finalUrl);

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      if (!controller.signal.aborted) {
        console.warn('⏰ Request timeout, aborting:', finalUrl);
        controller.abort();
      }
    }, CustomLemmyHttp.REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(finalUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...this.headers,
        },
        signal: controller.signal,
      });
    } catch (err) {
      const elapsed = Math.round(performance.now() - start);
      if ((err as any)?.name === 'AbortError') {
        console.error('🛑 Fetch aborted after timeout', { finalUrl, elapsed });
        throw new Error(`Request timed out after ${elapsed}ms: ${finalUrl}`);
      }
      console.error('❌ Network fetch failed before response', {
        finalUrl,
        elapsed,
        error: err,
      });
      throw err;
    } finally {
      clearTimeout(timeout);
    }

    console.log('📥 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response body:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const responseText = await response.text();
    console.log('📄 Response body length:', responseText.length);
    console.log(
      '📄 Response body preview:',
      responseText.substring(0, 200) + '...'
    );

    try {
      const jsonData = JSON.parse(responseText);
      const elapsed = Math.round(performance.now() - start);
      console.log('✅ Successfully parsed JSON response in', `${elapsed}ms`);
      return jsonData;
    } catch (parseError) {
      const elapsed = Math.round(performance.now() - start);
      console.log('❌ JSON parse error after', `${elapsed}ms`, parseError);
      console.log('📄 Full response body:', responseText);
      throw new Error(`Failed to parse JSON response: ${parseError}`);
    }
  }

  async getPosts(params: any = {}): Promise<any> {
    return this.makeRequest('/post/list', params);
  }

  async getSite(): Promise<any> {
    return this.makeRequest('/site');
  }

  async search(params: any): Promise<any> {
    return this.makeRequest('/search', params);
  }

  async resolveObject(params: any): Promise<any> {
    return this.makeRequest('/resolve_object', params);
  }

  async listCommunities(params: any = {}): Promise<any> {
    return this.makeRequest('/community/list', params);
  }

  async getCommunity(params: any): Promise<any> {
    return this.makeRequest('/community', params);
  }

  async getPersonDetails(params: any): Promise<any> {
    return this.makeRequest('/user', params);
  }
}
export class LemmyAPIClient {
  private client: CustomLemmyHttp;
  private rateLimiter: RateLimiter;
  private jwt?: string;

  constructor(instanceUrl: string = 'http://localhost:5173/api/lemmy') {
    // Use our custom client that properly handles v3 URLs
    const baseUrl = instanceUrl.startsWith('http')
      ? instanceUrl.replace(/\/api\/v[0-9]+.*$/, '') // Remove any existing API path
      : `https://${instanceUrl}`;

    this.client = new CustomLemmyHttp(baseUrl);
    this.rateLimiter = new RateLimiter();
  }

  /**
   * Set authentication token if needed
   */
  setAuth(jwt: string) {
    this.jwt = jwt;
    this.client.setHeaders({ Authorization: `Bearer ${jwt}` });
  }

  /**
   * Make a rate-limited API request with error handling
   */
  private async makeRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    // Wait for rate limit availability
    await this.rateLimiter.waitForAvailability();

    try {
      // Record the request for rate limiting
      this.rateLimiter.recordRequest();

      // Make the request with error handling
      const result = await ErrorHandler.retryWithBackoff(requestFn);
      return result;
    } catch (error) {
      ErrorHandler.logError(error, 'Lemmy API request');
      throw error;
    }
  }

  /**
   * Get posts with comprehensive filtering options
   */
  async getPosts(
    params: Partial<GetPosts> = {}
  ): Promise<PaginatedPostsResponse> {
    // Validate community_id if provided
    if (
      params.community_id !== undefined &&
      !isValidCommunityId(params.community_id)
    ) {
      logInvalidCommunityId(params.community_id, 'getPosts');
      throw new Error(
        `Invalid community ID: ${params.community_id} (exceeds i32 limit)`
      );
    }

    const defaultParams: Partial<GetPosts> = {
      type_: 'All',
      sort: 'Hot',
      limit: CONTENT_FILTERS.PAGE_SIZE,
    };

    const finalParams = { ...defaultParams, ...params };

    const response: GetPostsResponse = await this.makeRequest(() =>
      this.client.getPosts(finalParams)
    );

    // Transform the response posts to our format and return with pagination info
    return {
      posts: response.posts?.map(transformPostView) || [],
      nextCursor: response.next_page,
      prevCursor: response.prev_page,
    };
  }

  /**
   * Get posts from specific community
   */
  async getCommunityPosts(
    communityId: number,
    params: Omit<GetPosts, 'community_id'> = {}
  ): Promise<PaginatedPostsResponse> {
    // Validate community ID before making API call
    if (!isValidCommunityId(communityId)) {
      logInvalidCommunityId(communityId, 'getCommunityPosts');
      throw new Error(
        `Invalid community ID: ${communityId} (exceeds i32 limit)`
      );
    }

    return this.getPosts({ ...params, community_id: communityId });
  }

  /**
   * Get posts from specific user
   */
  async getUserPosts(
    userId: number,
    params: { sort?: string; page?: number; limit?: number } = {}
  ): Promise<PaginatedPostsResponse> {
    const { sort = 'Hot', page = 1, limit = 30 } = params;
    try {
      const response: any = await this.makeRequest(() =>
        this.client.getPersonDetails({ person_id: userId, sort, page, limit })
      );
      const rawPosts = Array.isArray(response?.posts) ? response.posts : [];
      const posts = rawPosts.map((p: any) => transformPostView(p));
      const hasMore = rawPosts.length === limit; // heuristic for page-based pagination
      return {
        posts,
        nextCursor: hasMore ? (page + 1).toString() : undefined,
      };
    } catch (err) {
      console.warn('[lemmy-api-client] getUserPosts failed', { userId, err });
      return { posts: [] };
    }
  }

  /**
   * Get community list
   */
  async getCommunities(limit: number = 20): Promise<Community[]> {
    const params: ListCommunities = {
      type_: 'All',
      sort: 'Hot', // Use valid sort type
      limit,
    };

    const response = await this.makeRequest(() =>
      this.client.listCommunities(params)
    );

    return (
      response.communities?.map((item: any) =>
        transformCommunity(item.community)
      ) || []
    );
  }

  /**
   * Search for communities by name
   */
  async searchCommunities(
    query: string,
    limit: number = 20
  ): Promise<Community[]> {
    if (!query.trim()) {
      return [];
    }

    const params = {
      q: query,
      type_: 'Communities' as const,
      sort: 'New' as const, // Use valid SearchSortType
      listing_type: 'All' as const,
      limit,
    };

    console.log(
      `🔍 API Client searchCommunities - Query: "${query}", Params:`,
      params
    );

    const response = await this.makeRequest(() => this.client.search(params));

    console.log(`📡 Raw search response for "${query}":`, response);

    // Get communities from the correct property in the response
    const communityResults = response.communities || [];

    console.log(`📊 Community results found: ${communityResults.length}`);

    // Transform community results - each item has a 'community' property
    const communities = communityResults
      .map((item: any) => transformCommunity(item.community))
      .filter(Boolean); // Filter out any null/undefined results

    // Filter out communities with invalid IDs before returning
    const validCommunities = communities.filter((community: Community) => {
      if (!isValidCommunityId(community.id)) {
        logInvalidCommunityId(
          community.id,
          `searchCommunities result for query: "${query}"`
        );
        return false;
      }
      return true;
    });

    console.log(`✅ Valid communities returned: ${validCommunities.length}`);

    return validCommunities;
  }

  /**
   * Search for users
   */
  async searchUsers(query: string, limit: number = 20): Promise<Person[]> {
    if (!query.trim()) {
      return [];
    }

    const params = {
      q: query,
      type_: 'Users' as const,
      sort: 'New' as const, // Use valid SearchSortType
      listing_type: 'All' as const,
      limit,
    };

    const response = await this.makeRequest(() => this.client.search(params));

    // Get users from the correct property in the response
    const userResults = response.users || [];

    // Transform user results - each item has a 'person' property
    return userResults
      .map((item: any) => transformPerson(item.person))
      .filter(Boolean); // Filter out any null/undefined results
  }

  /**
   * Get site information
   */
  async getSite(): Promise<SiteInfo> {
    const response = await this.makeRequest(() => this.client.getSite());

    // Create a compatible SiteInfo structure from the response
    return response as unknown as SiteInfo;
  }

  /**
   * Resolve a Lemmy actor by name (community or user)
   */
  async resolveActor(
    name: string
  ): Promise<{ community?: Community; person?: Person }> {
    const params = { q: name };

    const response = await this.makeRequest(() =>
      this.client.resolveObject(params)
    );

    // Use search response format to find resolved objects
    const communityResult = response.results?.find(
      (item: any) => item.type_ === 'Community'
    );
    const personResult = response.results?.find(
      (item: any) => item.type_ === 'Person'
    );

    return {
      community: communityResult
        ? transformCommunity((communityResult as any).community)
        : undefined,
      person: personResult
        ? transformPerson((personResult as any).person)
        : undefined,
    };
  }

  /**
   * Get community information by name
   */
  async getCommunityByName(name: string): Promise<Community | null> {
    try {
      const params: GetCommunity = { name };

      const response = await this.makeRequest(() =>
        this.client.getCommunity(params)
      );

      if (response.community_view?.community) {
        const community = transformCommunity(response.community_view.community);

        // Validate community ID before returning
        if (!isValidCommunityId(community.id)) {
          logInvalidCommunityId(
            community.id,
            `getCommunityByName result for: "${name}"`
          );
          return null;
        }

        return community;
      }

      return null;
    } catch (error) {
      ErrorHandler.logError(error, `Get community by name: ${name}`);
      return null;
    }
  }

  /**
   * Get user information by name
   */
  async getUserByName(name: string): Promise<Person | null> {
    try {
      const params = { username: name };

      const response = await this.makeRequest(() =>
        this.client.getPersonDetails(params)
      );

      return response.person_view?.person
        ? transformPerson(response.person_view.person)
        : null;
    } catch (error) {
      ErrorHandler.logError(error, `Get user by name: ${name}`);
      return null;
    }
  }

  /**
   * Cancel any ongoing requests
   */
  cancelRequests(): void {
    // lemmy-js-client doesn't expose abort controllers directly
    console.warn(
      'Request cancellation not directly supported by lemmy-js-client'
    );
  }

  /**
   * Update the instance URL
   */
  setInstance(instanceUrl: string): void {
    const baseUrl = instanceUrl.startsWith('http')
      ? instanceUrl.replace(/\/api\/v[0-9]+.*$/, '') // Remove any existing API path
      : `https://${instanceUrl}`;

    this.client = new CustomLemmyHttp(baseUrl);

    // Re-apply auth if it was set
    if (this.jwt) {
      this.setAuth(this.jwt);
    }
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(): {
    canMakeRequest: boolean;
    timeUntilAvailable: number;
  } {
    return {
      canMakeRequest: this.rateLimiter.canMakeRequest(),
      timeUntilAvailable: this.rateLimiter.getTimeUntilAvailable(),
    };
  }

  /**
   * Reset rate limiter
   */
  resetRateLimit(): void {
    this.rateLimiter.reset();
  }
}

// Export a default instance
export const lemmyApi = new LemmyAPIClient();

// Function to create API client with custom server settings
export function createLemmyApiClient(
  instanceUrl: string,
  useProxy: boolean = false
): LemmyAPIClient {
  // Strip protocol from instanceUrl for consistent handling
  const cleanInstanceUrl = instanceUrl.replace(/^https?:\/\//, '');

  const baseUrl = useProxy
    ? `http://localhost:5173/api/lemmy?server=${encodeURIComponent(cleanInstanceUrl)}`
    : `https://${cleanInstanceUrl}`;

  console.log(
    `🔧 createLemmyApiClient: instanceUrl=${instanceUrl}, useProxy=${useProxy}, baseUrl=${baseUrl}`
  );

  return new LemmyAPIClient(baseUrl);
}
