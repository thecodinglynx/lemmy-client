// Core Lemmy API types
export interface LemmyPost {
  id: number;
  name: string;
  url?: string;
  body?: string;
  creator_id: number;
  community_id: number;
  removed: boolean;
  locked: boolean;
  published: string;
  updated?: string;
  deleted: boolean;
  nsfw: boolean;
  ap_id: string;
  local: boolean;
  featured_community: boolean;
  featured_local: boolean;
  thumbnail_url?: string;
  embed_title?: string;
  embed_description?: string;
  embed_video_url?: string;
}

export interface Person {
  id: number;
  name: string;
  display_name?: string;
  avatar?: string;
  banned: boolean;
  published: string;
  updated?: string;
  actor_id: string;
  bio?: string;
  local: boolean;
  banner?: string;
  deleted: boolean;
  inbox_url: string;
  shared_inbox_url?: string;
  matrix_user_id?: string;
  admin: boolean;
  bot_account: boolean;
  ban_expires?: string;
}

export interface Community {
  id: number;
  name: string;
  title: string;
  description?: string;
  removed: boolean;
  published: string;
  updated?: string;
  deleted: boolean;
  nsfw: boolean;
  actor_id: string;
  local: boolean;
  icon?: string;
  banner?: string;
  followers_url: string;
  inbox_url: string;
  shared_inbox_url?: string;
  hidden: boolean;
  posting_restricted_to_mods: boolean;
  instance_id: number;
}

export interface PostView {
  post: LemmyPost;
  creator: Person;
  community: Community;
  creator_banned_from_community: boolean;
  counts: {
    id: number;
    post_id: number;
    comments: number;
    score: number;
    upvotes: number;
    downvotes: number;
    published: string;
    newest_comment_time_necro: string;
    newest_comment_time: string;
    featured_community: boolean;
    featured_local: boolean;
    hot_rank: number;
    hot_rank_active: number;
  };
  subscribed: string;
  saved: boolean;
  read: boolean;
  creator_blocked: boolean;
  my_vote?: number;
  unread_comments: number;
}

export interface SiteInfo {
  site_view: {
    site: {
      id: number;
      name: string;
      sidebar?: string;
      published: string;
      updated?: string;
      icon?: string;
      banner?: string;
      description?: string;
      actor_id: string;
      last_refreshed_at: string;
      inbox_url: string;
      private_key?: string;
      public_key: string;
      default_theme: string;
      default_post_listing_type: string;
      legal_information?: string;
      application_question?: string;
      private_instance: boolean;
      default_post_listing_mode: string;
      federation_enabled: boolean;
      captcha_enabled: boolean;
      captcha_difficulty: string;
      registration_mode: string;
      reports_email_admins: boolean;
    };
    local_site: {
      id: number;
      site_id: number;
      site_setup: boolean;
      enable_downvotes: boolean;
      enable_nsfw: boolean;
      community_creation_admin_only: boolean;
      require_email_verification: boolean;
      application_question?: string;
      private_instance: boolean;
      default_theme: string;
      default_post_listing_type: string;
      legal_information?: string;
      hide_modlog_mod_names: boolean;
      application_email_admins: boolean;
      slur_filter_regex?: string;
      actor_name_max_length: number;
      federation_enabled: boolean;
      captcha_enabled: boolean;
      captcha_difficulty: string;
      registration_mode: string;
      reports_email_admins: boolean;
      published: string;
      updated?: string;
    };
    counts: {
      id: number;
      site_id: number;
      users: number;
      posts: number;
      comments: number;
      communities: number;
      users_active_day: number;
      users_active_week: number;
      users_active_month: number;
      users_active_half_year: number;
    };
  };
}

// Media types
export const MediaType = {
  IMAGE: 'image',
  VIDEO: 'video',
  GIF: 'gif',
  UNKNOWN: 'unknown',
} as const;

export type MediaType = (typeof MediaType)[keyof typeof MediaType];

// Slideshow-specific types
export interface SlideshowPost {
  id: string;
  postId: number;
  title: string;
  url: string;
  mediaType: MediaType;
  thumbnailUrl?: string;
  creator: Person;
  community: Community;
  score: number;
  published: string;
  nsfw: boolean;
  starred: boolean;
  viewed: boolean;
}

// API query parameters
export interface GetPostsParams {
  type_?: 'All' | 'Local' | 'Subscribed';
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
  community_id?: number;
  community_name?: string;
  creator_id?: number;
  show_nsfw?: boolean;
}

// Application state interfaces
export interface SlideshowState {
  isPlaying: boolean;
  currentIndex: number;
  posts: SlideshowPost[];
  timing: {
    images: number; // seconds
    videos: number; // seconds (or full duration)
    gifs: number; // seconds
  };
  autoAdvance: boolean;
  loop: boolean;
}

export interface ContentState {
  selectedCommunities: Community[];
  selectedUsers: Person[];
  filters: {
    mediaTypes: MediaType[];
    showNSFW: boolean;
    minScore: number;
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
  queue: SlideshowPost[];
  viewedPosts: Set<string>;
  currentBatch: number;
  hasMore: boolean;
}

export interface SettingsState {
  theme: 'light' | 'dark' | 'auto';
  autoAdvance: boolean;
  intervals: {
    images: number;
    videos: number;
    gifs: number;
  };
  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
    textSize: 'small' | 'medium' | 'large';
    screenReaderAnnouncements: boolean;
  };
  display: {
    showAttribution: boolean;
    showControls: boolean;
    fullscreenDefault: boolean;
    attributionPosition: 'top' | 'bottom' | 'overlay';
  };
  controls: {
    keyboardShortcuts: Record<string, string>;
    touchGestures: boolean;
    autoHideControls: boolean;
    controlTimeout: number; // seconds
    timingPresets?: Record<string, number>;
  };
}

export interface UIState {
  showSettingsPanel: boolean;
  showContentBrowser: boolean;
  showStarredView: boolean;
  showHelpOverlay: boolean;
  isFullscreen: boolean;
  isMobile: boolean;
  loading: boolean;
  error?: string | null;
  notifications: Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    timestamp: number;
  }>;
}

export interface AppState {
  slideshow: SlideshowState;
  content: ContentState;
  settings: SettingsState;
  ui: UIState;
}

// Storage interfaces
export interface StoredStarredContent {
  [postId: string]: {
    post: SlideshowPost;
    starredAt: number;
    tags?: string[];
  };
}

export interface StoredSettings {
  version: number;
  settings: SettingsState;
  lastUpdated: number;
}

export interface StoredCommunities {
  [communityId: number]: Community & {
    addedAt: number;
    lastUsed: number;
  };
}

export interface StoredUsers {
  [userId: number]: Person & {
    addedAt: number;
    lastUsed: number;
  };
}

// Error types
export class APIError extends Error {
  public status: number;
  public endpoint: string;
  public response?: unknown;

  constructor(
    message: string,
    status: number,
    endpoint: string,
    response?: unknown
  ) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.endpoint = endpoint;
    this.response = response;
  }
}

export class MediaError extends Error {
  public url: string;
  public mediaType: MediaType;

  constructor(message: string, url: string, mediaType: MediaType) {
    super(message);
    this.name = 'MediaError';
    this.url = url;
    this.mediaType = mediaType;
  }
}

// Hook return types
export interface UseSlideshowReturn {
  state: SlideshowState;
  actions: {
    play: () => void;
    pause: () => void;
    next: () => void;
    previous: () => void;
    goToIndex: (index: number) => void;
    reset: () => void;
    setTiming: (type: keyof SlideshowState['timing'], seconds: number) => void;
    toggleAutoAdvance: () => void;
  };
}

export interface UseContentSelectionReturn {
  communities: Community[];
  users: Person[];
  actions: {
    addCommunity: (community: Community) => void;
    removeCommunity: (communityId: number) => void;
    addUser: (user: Person) => void;
    removeUser: (userId: number) => void;
    clearAll: () => void;
    importSelection: (data: {
      communities: Community[];
      users: Person[];
    }) => void;
    exportSelection: () => { communities: Community[]; users: Person[] };
  };
}

export interface UseSettingsReturn {
  settings: SettingsState;
  actions: {
    updateSetting: <K extends keyof SettingsState>(
      key: K,
      value: SettingsState[K]
    ) => void;
    resetToDefaults: () => void;
    exportSettings: () => StoredSettings;
    importSettings: (settings: StoredSettings) => void;
  };
}

// Component prop types
export interface SlideshowViewProps {
  posts: SlideshowPost[];
  currentIndex: number;
  isPlaying: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onTogglePlay: () => void;
  onToggleStar: (postId: string) => void;
  className?: string;
}

export interface MediaDisplayProps {
  post: SlideshowPost;
  isActive: boolean;
  onLoad: () => void;
  onError: () => void;
  className?: string;
}

export interface AttributionOverlayProps {
  post: SlideshowPost;
  position: 'top' | 'bottom' | 'overlay';
  onCommunityClick: (community: Community) => void;
  onUserClick: (user: Person) => void;
  className?: string;
}

// Utility types
export type QueueStrategy =
  | 'chronological'
  | 'random'
  | 'hot'
  | 'top'
  | 'mixed';

export interface ContentFilter {
  mediaTypes: MediaType[];
  showNSFW: boolean;
  minScore: number;
  communities?: number[];
  users?: number[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface PreloadOptions {
  ahead: number; // number of items to preload ahead
  behind: number; // number of items to keep in cache behind
  quality: 'low' | 'medium' | 'high';
  adaptiveQuality: boolean;
}

// Performance monitoring types
export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  errorRate: number;
  userEngagement: {
    sessionDuration: number;
    postsViewed: number;
    postsStarred: number;
    settingsChanged: number;
  };
}
