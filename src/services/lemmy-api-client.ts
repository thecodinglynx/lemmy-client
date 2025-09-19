import { RateLimiter } from './rate-limiter';
import { ErrorHandler } from './error-handler';
import { API_CONFIG, CONTENT_FILTERS } from '@constants';
import type {
  GetPostsParams,
  PostView,
  Community,
  Person,
  SiteInfo,
} from '@types';

/**
 * Comprehensive Lemmy API client with rate limiting and error handling
 */
export class LemmyAPIClient {
  private baseUrl: string;
  private rateLimiter: RateLimiter;
  private abortController: AbortController | null = null;

  constructor(instanceUrl: string = API_CONFIG.DEFAULT_BASE_URL) {
    this.baseUrl = instanceUrl.endsWith('/')
      ? instanceUrl.slice(0, -1)
      : instanceUrl;
    this.rateLimiter = new RateLimiter();
  }

  /**
   * Make a rate-limited API request with error handling
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Wait for rate limit availability
    await this.rateLimiter.waitForAvailability();

    // Create abort controller for timeout
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    const requestOptions: RequestInit = {
      ...options,
      signal,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'LemmyMediaSlideshow/1.0',
        ...options.headers,
      },
    };

    const fullUrl = `${this.baseUrl}${endpoint}`;

    try {
      // Record the request for rate limiting
      this.rateLimiter.recordRequest();

      // Make the request with timeout
      const response = await ErrorHandler.withTimeout(
        fetch(fullUrl, requestOptions),
        API_CONFIG.RATE_LIMIT.TIMEOUT
      );

      // Handle response errors
      await ErrorHandler.handleResponse(response, endpoint);

      const data = await response.json();
      return data as T;
    } catch (error) {
      ErrorHandler.logError(error, `API request to ${endpoint}`);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request was cancelled');
      }

      // Handle network errors
      if (!(error instanceof Error && error.message.includes('HTTP'))) {
        ErrorHandler.handleNetworkError(error, endpoint);
      }

      throw error;
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Build query string from parameters
   */
  private buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Get posts with comprehensive filtering options
   */
  async getPosts(params: GetPostsParams = {}): Promise<PostView[]> {
    const defaultParams: GetPostsParams = {
      type_: 'All',
      sort: 'Hot',
      page: 1,
      limit: CONTENT_FILTERS.PAGE_SIZE,
      show_nsfw: false,
    };

    const finalParams = { ...defaultParams, ...params };
    const queryString = this.buildQueryString(finalParams);

    const response = await ErrorHandler.retryWithBackoff(() =>
      this.makeRequest<{ posts: PostView[] }>(`/post/list${queryString}`)
    );

    return response.posts || [];
  }

  /**
   * Get posts from specific community
   */
  async getCommunityPosts(
    communityId: number,
    params: Omit<GetPostsParams, 'community_id'> = {}
  ): Promise<PostView[]> {
    return this.getPosts({ ...params, community_id: communityId });
  }

  /**
   * Get posts from specific user
   */
  async getUserPosts(
    userId: number,
    params: Omit<GetPostsParams, 'creator_id'> = {}
  ): Promise<PostView[]> {
    return this.getPosts({ ...params, creator_id: userId });
  }

  /**
   * Search for communities
   */
  async getCommunities(
    search?: string,
    limit: number = 20
  ): Promise<Community[]> {
    const params: Record<string, any> = {
      type_: 'All',
      sort: 'TopAll',
      limit,
    };

    if (search) {
      params.q = search;
    }

    const queryString = this.buildQueryString(params);

    const response = await ErrorHandler.retryWithBackoff(() =>
      this.makeRequest<{ communities: Array<{ community: Community }> }>(
        `/community/list${queryString}`
      )
    );

    return response.communities?.map((item) => item.community) || [];
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
      type_: 'Communities',
      sort: 'TopAll',
      listing_type: 'All',
      limit,
    };

    const queryString = this.buildQueryString(params);

    const response = await ErrorHandler.retryWithBackoff(() =>
      this.makeRequest<{ communities: Array<{ community: Community }> }>(
        `/search${queryString}`
      )
    );

    return response.communities?.map((item) => item.community) || [];
  }

  /**
   * Search for users
   */
  async getUsers(search: string, limit: number = 20): Promise<Person[]> {
    if (!search.trim()) {
      return [];
    }

    const params = {
      q: search,
      type_: 'Users',
      sort: 'TopAll',
      listing_type: 'All',
      limit,
    };

    const queryString = this.buildQueryString(params);

    const response = await ErrorHandler.retryWithBackoff(() =>
      this.makeRequest<{ users: Array<{ person: Person }> }>(
        `/search${queryString}`
      )
    );

    return response.users?.map((item) => item.person) || [];
  }

  /**
   * Get site information
   */
  async getSite(): Promise<SiteInfo> {
    const response = await ErrorHandler.retryWithBackoff(() =>
      this.makeRequest<SiteInfo>('/site')
    );

    return response;
  }

  /**
   * Resolve a Lemmy actor by name (community or user)
   */
  async resolveActor(
    name: string
  ): Promise<{ community?: Community; person?: Person }> {
    const params = {
      q: name,
    };

    const queryString = this.buildQueryString(params);

    const response = await ErrorHandler.retryWithBackoff(() =>
      this.makeRequest<{
        community?: { community: Community };
        person?: { person: Person };
      }>(`/resolve_object${queryString}`)
    );

    return {
      community: response.community?.community,
      person: response.person?.person,
    };
  }

  /**
   * Get community information by name
   */
  async getCommunityByName(name: string): Promise<Community | null> {
    try {
      const params = {
        name,
      };

      const queryString = this.buildQueryString(params);

      const response = await ErrorHandler.retryWithBackoff(() =>
        this.makeRequest<{ community_view: { community: Community } }>(
          `/community${queryString}`
        )
      );

      return response.community_view?.community || null;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get user information by name
   */
  async getUserByName(name: string): Promise<Person | null> {
    try {
      const params = {
        username: name,
      };

      const queryString = this.buildQueryString(params);

      const response = await ErrorHandler.retryWithBackoff(() =>
        this.makeRequest<{ person_view: { person: Person } }>(
          `/user${queryString}`
        )
      );

      return response.person_view?.person || null;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Cancel any ongoing requests
   */
  cancelRequests(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Update the instance URL
   */
  setInstance(instanceUrl: string): void {
    this.baseUrl = instanceUrl.endsWith('/')
      ? instanceUrl.slice(0, -1)
      : instanceUrl;
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
