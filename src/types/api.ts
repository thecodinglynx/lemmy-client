// Additional API types for Lemmy API responses
import type { PostView, Community, Person } from './index';

export interface GetPostsResponse {
  posts: PostView[];
}

export interface GetCommunitiesResponse {
  communities: Array<{
    community: Community;
    subscribed: 'NotSubscribed' | 'Subscribed' | 'Pending';
    blocked: boolean;
    counts: {
      id: number;
      community_id: number;
      subscribers: number;
      posts: number;
      comments: number;
      published: string;
      users_active_day: number;
      users_active_week: number;
      users_active_month: number;
      users_active_half_year: number;
      hot_rank: number;
    };
  }>;
}

export interface SearchResponse {
  type_: string;
  communities?: Array<{
    community: Community;
    subscribed: 'NotSubscribed' | 'Subscribed' | 'Pending';
    blocked: boolean;
    counts: {
      id: number;
      community_id: number;
      subscribers: number;
      posts: number;
      comments: number;
      published: string;
      users_active_day: number;
      users_active_week: number;
      users_active_month: number;
      users_active_half_year: number;
      hot_rank: number;
    };
  }>;
  users?: Array<{
    person: Person;
    counts: {
      id: number;
      person_id: number;
      post_count: number;
      post_score: number;
      comment_count: number;
      comment_score: number;
    };
  }>;
  posts?: PostView[];
  comments?: any[];
}

export interface ResolveObjectResponse {
  community?: {
    community: Community;
    subscribed: 'NotSubscribed' | 'Subscribed' | 'Pending';
    blocked: boolean;
    counts: {
      id: number;
      community_id: number;
      subscribers: number;
      posts: number;
      comments: number;
      published: string;
      users_active_day: number;
      users_active_week: number;
      users_active_month: number;
      users_active_half_year: number;
      hot_rank: number;
    };
  };
  person?: {
    person: Person;
    counts: {
      id: number;
      person_id: number;
      post_count: number;
      post_score: number;
      comment_count: number;
      comment_score: number;
    };
  };
  post?: PostView;
  comment?: any;
}

export interface GetCommunityResponse {
  community_view: {
    community: Community;
    subscribed: 'NotSubscribed' | 'Subscribed' | 'Pending';
    blocked: boolean;
    counts: {
      id: number;
      community_id: number;
      subscribers: number;
      posts: number;
      comments: number;
      published: string;
      users_active_day: number;
      users_active_week: number;
      users_active_month: number;
      users_active_half_year: number;
      hot_rank: number;
    };
  };
  site?: {
    site: any;
    local_site: any;
    local_site_rate_limit: any;
    counts: any;
  };
  online: number;
  discussion_languages: number[];
  default_post_language?: number;
  moderators: any[];
}

export interface GetPersonResponse {
  person_view: {
    person: Person;
    counts: {
      id: number;
      person_id: number;
      post_count: number;
      post_score: number;
      comment_count: number;
      comment_score: number;
    };
  };
  posts: PostView[];
  comments: any[];
  moderates: any[];
}

// Re-export all types from main types file
export * from '@types';
