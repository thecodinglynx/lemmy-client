# Lemmy Media Slideshow Web App - Technical Specification

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Data Models](#data-models)
5. [API Integration Layer](#api-integration-layer)
6. [Component Architecture](#component-architecture)
7. [Media Handling System](#media-handling-system)
8. [State Management](#state-management)
9. [User Interface Design](#user-interface-design)
10. [Performance Optimization](#performance-optimization)
11. [Security Considerations](#security-considerations)
12. [Implementation Roadmap](#implementation-roadmap)
13. [Development Guidelines](#development-guidelines)
14. [Testing Strategy](#testing-strategy)

## Executive Summary

This technical specification defines the implementation approach for a web application that provides an interactive slideshow experience using media content from Lemmy communities and users. The application will be built as a modern single-page application (SPA) using React/TypeScript with a focus on performance, mobile responsiveness, and user experience.

### Key Technical Goals

- **Performance**: Sub-3-second page loads and sub-2-second media loading
- **Mobile-First**: Optimized for mobile devices, especially Pixel 6
- **Scalability**: Efficient handling of large content sets with pagination
- **Offline Capability**: Basic functionality available without network connection
- **Accessibility**: WCAG 2.1 AA compliance for inclusive design

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │  Slideshow  │ │   Settings  │ │    Content Browser     │ │
│  │ Components  │ │   Panel     │ │                         │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │   State     │ │   Media     │ │      Content           │ │
│  │ Management  │ │  Handler    │ │     Manager            │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                     Service Layer                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │   Lemmy     │ │   Cache     │ │     Storage            │ │
│  │ API Client  │ │  Manager    │ │     Manager            │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                     External APIs                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │   Lemmy     │ │   Pictrs    │ │     Browser APIs       │ │
│  │ REST API    │ │  Service    │ │                         │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

1. **Slideshow Engine**: Manages media presentation, timing, and transitions
2. **Content Manager**: Handles content fetching, filtering, and deduplication
3. **Media Handler**: Processes different media types (images, videos, GIFs)
4. **Storage Manager**: Manages local/session storage for settings and viewed content
5. **API Client**: Interfaces with Lemmy REST API with rate limiting and error handling

## Technology Stack

### Frontend Framework

- **React 18**: Core UI framework with Concurrent Features
- **TypeScript**: Type safety and enhanced developer experience
- **Vite**: Build tool for fast development and optimized production builds
- **React Router**: Client-side routing for navigation

### State Management

- **Zustand**: Lightweight state management with persistence
- **React Query (TanStack Query)**: Server state management and caching
- **Immer**: Immutable state updates

### UI Components & Styling

- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Headless UI**: Accessible UI components
- **Framer Motion**: Animations and transitions
- **Radix UI**: Low-level UI primitives

### Media Handling

- **React Player**: Universal video player component
- **Image optimization libraries**: For responsive image loading
- **Web APIs**: Intersection Observer, Fullscreen API

### Development Tools

- **ESLint + Prettier**: Code quality and formatting
- **Husky**: Git hooks for quality control
- **Vitest**: Unit testing framework
- **Playwright**: End-to-end testing
- **Storybook**: Component development and documentation

## Data Models

### Core Data Types

```typescript
// Post data structure from Lemmy API
interface LemmyPost {
  id: number;
  name: string;
  url?: string;
  body?: string;
  creator_id: number;
  community_id: number;
  published: string;
  updated?: string;
  deleted: boolean;
  removed: boolean;
  locked: boolean;
  nsfw: boolean;
  featured_community: boolean;
  featured_local: boolean;
  thumbnail_url?: string;
  embed_title?: string;
  embed_description?: string;
  embed_video_url?: string;
  language_id: number;
  ap_id: string;
  local: boolean;
}

// Enhanced post for slideshow
interface SlideshowPost {
  id: string; // Unique identifier
  lemmyPost: LemmyPost;
  creator: Person;
  community: Community;
  mediaType: MediaType;
  mediaUrl: string;
  thumbnailUrl?: string;
  title: string;
  description?: string;
  duration?: number; // For videos
  isViewed: boolean;
  isStarred: boolean;
  viewedAt?: Date;
  starredAt?: Date;
}

// Media type classification
enum MediaType {
  IMAGE = "image",
  VIDEO = "video",
  GIF = "gif",
  UNKNOWN = "unknown",
}

// User/Creator information
interface Person {
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
  matrix_user_id?: string;
  admin: boolean;
  bot_account: boolean;
  instance_id: number;
}

// Community information
interface Community {
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
  hidden: boolean;
  posting_restricted_to_mods: boolean;
  instance_id: number;
}
```

### Application State Models

```typescript
// Main application state
interface AppState {
  slideshow: SlideshowState;
  content: ContentState;
  settings: SettingsState;
  ui: UIState;
}

// Slideshow-specific state
interface SlideshowState {
  isPlaying: boolean;
  currentIndex: number;
  posts: SlideshowPost[];
  autoAdvanceInterval: number; // seconds
  showControls: boolean;
  isFullscreen: boolean;
  lastAdvanceTime: number;
}

// Content management state
interface ContentState {
  selectedCommunities: Community[];
  selectedUsers: Person[];
  viewedPosts: Set<string>;
  starredPosts: Map<string, SlideshowPost>;
  contentFilters: ContentFilters;
  loadingState: LoadingState;
  errorState?: ErrorState;
}

// User settings
interface SettingsState {
  autoAdvanceEnabled: boolean;
  autoAdvanceInterval: number;
  showNSFW: boolean;
  mediaTypeFilters: Set<MediaType>;
  sortType: SortType;
  theme: "light" | "dark" | "system";
  keyboardShortcutsEnabled: boolean;
  accessibilityOptions: AccessibilityOptions;
}

// UI state
interface UIState {
  showSettingsPanel: boolean;
  showContentBrowser: boolean;
  showAttributionOverlay: boolean;
  isMobile: boolean;
  orientation: "portrait" | "landscape";
  networkStatus: "online" | "offline";
}
```

### Storage Schemas

```typescript
// Local Storage schema for persistent data
interface LocalStorageSchema {
  settings: SettingsState;
  starredPosts: SlideshowPost[];
  selectedCommunities: Community[];
  selectedUsers: Person[];
  lastSession?: {
    timestamp: number;
    currentIndex: number;
    posts: SlideshowPost[];
  };
}

// Session Storage schema for temporary data
interface SessionStorageSchema {
  viewedPosts: string[];
  currentSession: {
    startTime: number;
    posts: SlideshowPost[];
    currentIndex: number;
  };
  apiCache: {
    [key: string]: {
      data: any;
      timestamp: number;
      ttl: number;
    };
  };
}
```

## API Integration Layer

### Lemmy API Client

```typescript
class LemmyAPIClient {
  private baseUrl: string;
  private headers: Record<string, string>;
  private rateLimiter: RateLimiter;
  private cache: APICache;

  // Core post fetching method
  async getPosts(params: GetPostsParams): Promise<PostResponse> {
    const endpoint = "/api/v3/post/list";
    const query = this.buildQueryParams(params);

    return this.makeRequest(`${endpoint}?${query}`, {
      method: "GET",
      cache: true,
      ttl: 300000, // 5 minutes
    });
  }

  // Community discovery
  async getCommunities(params: GetCommunitiesParams): Promise<Community[]> {
    const endpoint = "/api/v3/community/list";
    return this.makeRequest(endpoint, { method: "GET" });
  }

  // User search
  async searchUsers(query: string): Promise<Person[]> {
    const endpoint = "/api/v3/search";
    const params = {
      q: query,
      type_: "Users",
      sort: "TopAll",
      listing_type: "All",
    };
    return this.makeRequest(endpoint, { method: "GET", params });
  }

  // Rate limiting implementation
  private async makeRequest(
    url: string,
    options: RequestOptions
  ): Promise<any> {
    await this.rateLimiter.checkLimit();

    try {
      const response = await fetch(url, {
        headers: this.headers,
        ...options,
      });

      if (!response.ok) {
        throw new APIError(response.status, response.statusText);
      }

      const data = await response.json();

      if (options.cache) {
        this.cache.set(url, data, options.ttl);
      }

      return data;
    } catch (error) {
      throw new APIError(500, "Network error", error);
    }
  }
}

// Query parameters for post fetching
interface GetPostsParams {
  type_?: "All" | "Local" | "Subscribed";
  sort?: SortType;
  page?: number;
  limit?: number;
  community_id?: number;
  community_name?: string;
  creator_id?: number;
  show_nsfw?: boolean;
}

// Sort options
type SortType =
  | "Active"
  | "Hot"
  | "New"
  | "Old"
  | "TopDay"
  | "TopWeek"
  | "TopMonth"
  | "TopYear"
  | "TopAll"
  | "MostComments"
  | "NewComments"
  | "TopHour"
  | "TopSixHour"
  | "TopTwelveHour"
  | "TopThreeMonths"
  | "TopSixMonths"
  | "TopNineMonths"
  | "Controversial"
  | "Scaled";
```

### Rate Limiting Strategy

```typescript
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number = 30; // requests per minute
  private readonly timeWindow: number = 60000; // 1 minute

  async checkLimit(): Promise<void> {
    const now = Date.now();

    // Remove expired timestamps
    this.requests = this.requests.filter(
      (timestamp) => now - timestamp < this.timeWindow
    );

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.timeWindow - (now - oldestRequest);

      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        return this.checkLimit();
      }
    }

    this.requests.push(now);
  }
}
```

### Error Handling Strategy

```typescript
class APIError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public originalError?: Error
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = "APIError";
  }
}

// Error recovery strategies
class ErrorHandler {
  static async handleAPIError(error: APIError, context: string): Promise<void> {
    switch (error.status) {
      case 429: // Rate limited
        await this.handleRateLimit();
        break;
      case 404: // Not found
        this.handleNotFound(context);
        break;
      case 500: // Server error
        this.handleServerError(context);
        break;
      default:
        this.handleGenericError(error, context);
    }
  }

  private static async handleRateLimit(): Promise<void> {
    // Exponential backoff
    const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}
```

## Component Architecture

### Component Hierarchy

```
App
├── SlideshowView
│   ├── MediaDisplay
│   │   ├── ImageDisplay
│   │   ├── VideoDisplay
│   │   └── GifDisplay
│   ├── SlideshowControls
│   │   ├── PlayPauseButton
│   │   ├── PreviousButton
│   │   ├── NextButton
│   │   └── ProgressIndicator
│   ├── AttributionOverlay
│   └── FullscreenControls
├── SettingsPanel
│   ├── TimingSettings
│   ├── ContentFilters
│   ├── DisplayOptions
│   └── KeyboardShortcuts
├── ContentBrowser
│   ├── CommunitySelector
│   ├── UserSelector
│   ├── ContentPreview
│   └── StarredContent
└── ErrorBoundary
    └── ErrorDisplay
```

### Core Components Implementation Guide

#### SlideshowView Component

```typescript
interface SlideshowViewProps {
  posts: SlideshowPost[];
  currentIndex: number;
  isPlaying: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onTogglePlay: () => void;
  onToggleStar: (postId: string) => void;
}

const SlideshowView: React.FC<SlideshowViewProps> = ({
  posts,
  currentIndex,
  isPlaying,
  onNext,
  onPrevious,
  onTogglePlay,
  onToggleStar,
}) => {
  // Auto-advance logic
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setTimeout(() => {
      onNext();
    }, autoAdvanceInterval * 1000);

    return () => clearTimeout(timer);
  }, [currentIndex, isPlaying, autoAdvanceInterval]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    Space: onTogglePlay,
    ArrowRight: onNext,
    ArrowLeft: onPrevious,
    KeyS: () => onToggleStar(currentPost.id),
    Escape: exitFullscreen,
  });

  const currentPost = posts[currentIndex];

  return (
    <div className="slideshow-container">
      <MediaDisplay post={currentPost} />
      <SlideshowControls
        isPlaying={isPlaying}
        onTogglePlay={onTogglePlay}
        onNext={onNext}
        onPrevious={onPrevious}
      />
      <AttributionOverlay post={currentPost} />
    </div>
  );
};
```

#### MediaDisplay Component

```typescript
const MediaDisplay: React.FC<{ post: SlideshowPost }> = ({ post }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const renderMedia = () => {
    switch (post.mediaType) {
      case MediaType.IMAGE:
        return (
          <img
            src={post.mediaUrl}
            alt={post.title}
            onLoad={() => setIsLoading(false)}
            onError={() => setError("Failed to load image")}
            className="slideshow-image"
          />
        );

      case MediaType.VIDEO:
        return (
          <ReactPlayer
            url={post.mediaUrl}
            playing={true}
            muted={false}
            controls={true}
            width="100%"
            height="100%"
            onReady={() => setIsLoading(false)}
            onError={() => setError("Failed to load video")}
          />
        );

      case MediaType.GIF:
        return (
          <img
            src={post.mediaUrl}
            alt={post.title}
            onLoad={() => setIsLoading(false)}
            onError={() => setError("Failed to load GIF")}
            className="slideshow-gif"
          />
        );

      default:
        return <div>Unsupported media type</div>;
    }
  };

  return (
    <div className="media-display">
      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      {renderMedia()}
    </div>
  );
};
```

#### Mobile-Responsive Design

```typescript
// Touch gesture handling for mobile
const useTouchGestures = (onNext: () => void, onPrevious: () => void) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      onNext();
    } else if (distance < -minSwipeDistance) {
      onPrevious();
    }
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
};
```

## Media Handling System

### Media Type Detection

```typescript
class MediaTypeDetector {
  static detectMediaType(url: string, contentType?: string): MediaType {
    // Check content type first
    if (contentType) {
      if (contentType.startsWith("image/gif")) return MediaType.GIF;
      if (contentType.startsWith("image/")) return MediaType.IMAGE;
      if (contentType.startsWith("video/")) return MediaType.VIDEO;
    }

    // Fallback to URL extension
    const extension = this.getFileExtension(url);

    const imageExtensions = ["jpg", "jpeg", "png", "webp", "svg"];
    const videoExtensions = ["mp4", "webm", "mov", "avi"];
    const gifExtensions = ["gif"];

    if (gifExtensions.includes(extension)) return MediaType.GIF;
    if (imageExtensions.includes(extension)) return MediaType.IMAGE;
    if (videoExtensions.includes(extension)) return MediaType.VIDEO;

    return MediaType.UNKNOWN;
  }

  private static getFileExtension(url: string): string {
    return url.split(".").pop()?.toLowerCase() || "";
  }
}
```

### Image Optimization

```typescript
class ImageOptimizer {
  static generateResponsiveImageUrl(
    originalUrl: string,
    width: number,
    quality: number = 80
  ): string {
    // For Pictrs service URLs
    if (originalUrl.includes("/pictrs/image/")) {
      const url = new URL(originalUrl);
      url.searchParams.set("thumbnail", width.toString());
      url.searchParams.set("format", "webp");
      return url.toString();
    }

    // For external images, return original
    return originalUrl;
  }

  static preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });
  }
}
```

### Media Caching Strategy

```typescript
class MediaCache {
  private cache = new Map<string, CacheEntry>();
  private readonly maxSize = 100; // Maximum cached items
  private readonly maxAge = 3600000; // 1 hour

  async getOrFetch(url: string): Promise<Blob> {
    const cached = this.cache.get(url);

    if (cached && Date.now() - cached.timestamp < this.maxAge) {
      return cached.data;
    }

    const response = await fetch(url);
    const blob = await response.blob();

    this.set(url, blob);
    return blob;
  }

  private set(url: string, data: Blob): void {
    // Implement LRU eviction
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(url, {
      data,
      timestamp: Date.now(),
    });
  }
}

interface CacheEntry {
  data: Blob;
  timestamp: number;
}
```

## State Management

### Zustand Store Implementation

```typescript
// Main store
interface AppStore extends AppState {
  // Actions
  setCurrentIndex: (index: number) => void;
  togglePlayback: () => void;
  addStarredPost: (post: SlideshowPost) => void;
  removeStarredPost: (postId: string) => void;
  markPostAsViewed: (postId: string) => void;
  updateSettings: (settings: Partial<SettingsState>) => void;
  addCommunity: (community: Community) => void;
  removeCommunity: (communityId: number) => void;
  addUser: (user: Person) => void;
  removeUser: (userId: number) => void;
  resetViewedPosts: () => void;
}

const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      slideshow: {
        isPlaying: false,
        currentIndex: 0,
        posts: [],
        autoAdvanceInterval: 10,
        showControls: true,
        isFullscreen: false,
        lastAdvanceTime: Date.now(),
      },
      content: {
        selectedCommunities: [],
        selectedUsers: [],
        viewedPosts: new Set(),
        starredPosts: new Map(),
        contentFilters: {
          showNSFW: false,
          mediaTypes: new Set([
            MediaType.IMAGE,
            MediaType.VIDEO,
            MediaType.GIF,
          ]),
          sortType: "Hot",
          minScore: 0,
        },
        loadingState: "idle",
      },
      settings: {
        autoAdvanceEnabled: true,
        autoAdvanceInterval: 10,
        showNSFW: false,
        mediaTypeFilters: new Set([
          MediaType.IMAGE,
          MediaType.VIDEO,
          MediaType.GIF,
        ]),
        sortType: "Hot",
        theme: "system",
        keyboardShortcutsEnabled: true,
        accessibilityOptions: {
          reduceMotion: false,
          highContrast: false,
          largeText: false,
        },
      },
      ui: {
        showSettingsPanel: false,
        showContentBrowser: false,
        showAttributionOverlay: true,
        isMobile: false,
        orientation: "landscape",
        networkStatus: "online",
      },

      // Actions
      setCurrentIndex: (index) =>
        set((state) => ({
          slideshow: {
            ...state.slideshow,
            currentIndex: index,
            lastAdvanceTime: Date.now(),
          },
        })),

      togglePlayback: () =>
        set((state) => ({
          slideshow: {
            ...state.slideshow,
            isPlaying: !state.slideshow.isPlaying,
          },
        })),

      addStarredPost: (post) =>
        set((state) => ({
          content: {
            ...state.content,
            starredPosts: new Map(state.content.starredPosts).set(post.id, {
              ...post,
              isStarred: true,
              starredAt: new Date(),
            }),
          },
        })),

      removeStarredPost: (postId) =>
        set((state) => {
          const newStarredPosts = new Map(state.content.starredPosts);
          newStarredPosts.delete(postId);
          return {
            content: {
              ...state.content,
              starredPosts: newStarredPosts,
            },
          };
        }),

      markPostAsViewed: (postId) =>
        set((state) => ({
          content: {
            ...state.content,
            viewedPosts: new Set(state.content.viewedPosts).add(postId),
          },
        })),

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ...newSettings,
          },
        })),

      // ... other actions
    }),
    {
      name: "lemmy-slideshow-storage",
      partialize: (state) => ({
        settings: state.settings,
        content: {
          selectedCommunities: state.content.selectedCommunities,
          selectedUsers: state.content.selectedUsers,
          starredPosts: Array.from(state.content.starredPosts.values()),
        },
      }),
    }
  )
);
```

### React Query Integration

```typescript
// Custom hooks for API data
export const usePosts = (params: GetPostsParams) => {
  return useInfiniteQuery({
    queryKey: ["posts", params],
    queryFn: ({ pageParam = 1 }) =>
      lemmyClient.getPosts({ ...params, page: pageParam }),
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.posts.length < (params.limit || 20)) {
        return undefined;
      }
      return pages.length + 1;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useCommunities = (searchQuery?: string) => {
  return useQuery({
    queryKey: ["communities", searchQuery],
    queryFn: () => lemmyClient.getCommunities({ search: searchQuery }),
    enabled: !!searchQuery,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUsers = (searchQuery: string) => {
  return useQuery({
    queryKey: ["users", searchQuery],
    queryFn: () => lemmyClient.searchUsers(searchQuery),
    enabled: searchQuery.length >= 3,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
```

## User Interface Design

### Responsive Design Strategy

```css
/* Mobile-first approach with Tailwind CSS */
.slideshow-container {
  @apply relative w-full h-screen bg-black overflow-hidden;
}

.slideshow-image {
  @apply w-full h-full object-contain;
}

.slideshow-controls {
  @apply absolute bottom-4 left-1/2 transform -translate-x-1/2 
         flex items-center space-x-4 bg-black bg-opacity-50 
         rounded-lg px-4 py-2;
}

/* Tablet styles */
@screen md {
  .slideshow-controls {
    @apply bottom-8 px-6 py-3;
  }
}

/* Desktop styles */
@screen lg {
  .slideshow-controls {
    @apply bottom-12 px-8 py-4;
  }
}

/* Pixel 6 specific optimizations */
@media (width: 412px) and (height: 915px) {
  .slideshow-container {
    @apply h-screen;
  }

  .attribution-overlay {
    @apply text-sm p-3;
  }
}
```

### Accessibility Implementation

```typescript
// Accessibility hooks and components
const useAccessibility = () => {
  const { settings } = useAppStore();

  useEffect(() => {
    if (settings.accessibilityOptions.reduceMotion) {
      document.documentElement.style.setProperty("--animation-duration", "0s");
    }

    if (settings.accessibilityOptions.highContrast) {
      document.documentElement.classList.add("high-contrast");
    }

    if (settings.accessibilityOptions.largeText) {
      document.documentElement.classList.add("large-text");
    }
  }, [settings.accessibilityOptions]);
};

// Screen reader announcements
const useScreenReader = () => {
  const announce = (message: string) => {
    const announcement = document.createElement("div");
    announcement.setAttribute("aria-live", "polite");
    announcement.setAttribute("aria-atomic", "true");
    announcement.className = "sr-only";
    announcement.textContent = message;

    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  };

  return { announce };
};
```

### Keyboard Navigation

```typescript
const useKeyboardShortcuts = (handlers: Record<string, () => void>) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (["INPUT", "TEXTAREA"].includes((event.target as Element).tagName)) {
        return;
      }

      const key = event.code;
      if (handlers[key]) {
        event.preventDefault();
        handlers[key]();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handlers]);
};

// Keyboard shortcuts mapping
const KEYBOARD_SHORTCUTS = {
  Space: "Toggle play/pause",
  ArrowRight: "Next slide",
  ArrowLeft: "Previous slide",
  KeyS: "Star current post",
  KeyF: "Toggle fullscreen",
  Escape: "Exit fullscreen",
  KeyH: "Show/hide controls",
  KeyI: "Show/hide info overlay",
  Digit1: "Set 5-second timing",
  Digit2: "Set 10-second timing",
  Digit3: "Set 15-second timing",
};
```

## Performance Optimization

### Image Loading Strategy

```typescript
class ImagePreloader {
  private preloadQueue: string[] = [];
  private currentlyLoading = new Set<string>();
  private loaded = new Set<string>();
  private maxConcurrent = 3;

  async preloadNext(urls: string[], currentIndex: number): Promise<void> {
    // Preload current + next 3 images
    const toPreload = urls.slice(currentIndex, currentIndex + 4);

    for (const url of toPreload) {
      if (!this.loaded.has(url) && !this.currentlyLoading.has(url)) {
        this.addToQueue(url);
      }
    }

    this.processQueue();
  }

  private addToQueue(url: string): void {
    if (!this.preloadQueue.includes(url)) {
      this.preloadQueue.push(url);
    }
  }

  private async processQueue(): Promise<void> {
    while (
      this.preloadQueue.length > 0 &&
      this.currentlyLoading.size < this.maxConcurrent
    ) {
      const url = this.preloadQueue.shift()!;
      this.currentlyLoading.add(url);

      try {
        await ImageOptimizer.preloadImage(url);
        this.loaded.add(url);
      } catch (error) {
        console.warn(`Failed to preload image: ${url}`, error);
      } finally {
        this.currentlyLoading.delete(url);
      }
    }
  }
}
```

### Virtual Scrolling for Large Lists

```typescript
// Virtual scrolling for content browser
const VirtualizedList: React.FC<{
  items: any[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: any, index: number) => React.ReactNode;
}> = ({ items, itemHeight, containerHeight, renderItem }) => {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = items.slice(startIndex, endIndex);

  return (
    <div
      style={{ height: containerHeight, overflow: "auto" }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: items.length * itemHeight, position: "relative" }}>
        {visibleItems.map((item, index) => (
          <div
            key={startIndex + index}
            style={{
              position: "absolute",
              top: (startIndex + index) * itemHeight,
              height: itemHeight,
              width: "100%",
            }}
          >
            {renderItem(item, startIndex + index)}
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Bundle Optimization

```typescript
// Lazy loading for route components
const SlideshowView = lazy(() => import("./components/SlideshowView"));
const SettingsPanel = lazy(() => import("./components/SettingsPanel"));
const ContentBrowser = lazy(() => import("./components/ContentBrowser"));

// Code splitting for media players
const VideoPlayer = lazy(() => import("./components/VideoPlayer"));
const ImageViewer = lazy(() => import("./components/ImageViewer"));

// Dynamic imports for heavy libraries
const loadReactPlayer = () => import("react-player/lazy");
const loadFramerMotion = () => import("framer-motion");
```

## Security Considerations

### Content Security Policy

```typescript
// CSP configuration for Vite
const cspConfig = {
  "default-src": ["'self'"],
  "img-src": ["'self'", "data:", "https://*.lemmy.ml", "https://*.pictrs.host"],
  "media-src": ["'self'", "https://*.lemmy.ml", "https://*.pictrs.host"],
  "connect-src": ["'self'", "https://*.lemmy.ml"],
  "script-src": ["'self'", "'wasm-unsafe-eval'"],
  "style-src": ["'self'", "'unsafe-inline'"],
  "font-src": ["'self'", "data:"],
  "frame-src": ["'none'"],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
};
```

### Input Validation and Sanitization

```typescript
class InputValidator {
  static validateUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ["http:", "https:"].includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  static sanitizeSearchQuery(query: string): string {
    return query
      .trim()
      .replace(/[<>]/g, "") // Remove potential HTML
      .substring(0, 100); // Limit length
  }

  static validateCommunityName(name: string): boolean {
    return /^[a-zA-Z0-9_]{1,50}$/.test(name);
  }
}
```

### NSFW Content Handling

```typescript
class ContentFilter {
  static shouldShowContent(
    post: SlideshowPost,
    settings: SettingsState
  ): boolean {
    // NSFW filtering
    if (post.lemmyPost.nsfw && !settings.showNSFW) {
      return false;
    }

    // Media type filtering
    if (!settings.mediaTypeFilters.has(post.mediaType)) {
      return false;
    }

    // Blocked communities/users would be checked here

    return true;
  }

  static blurNSFWContent(element: HTMLElement): void {
    element.style.filter = "blur(20px)";
    element.setAttribute("data-nsfw-blurred", "true");
  }
}
```

## Implementation Roadmap

### Phase 1: Core Foundation (Weeks 1-2)

1. **Project Setup**
   - Initialize Vite + React + TypeScript project
   - Configure Tailwind CSS and development tools
   - Set up Git hooks and code quality tools

2. **Basic API Integration**
   - Implement Lemmy API client with basic endpoints
   - Create data models and TypeScript interfaces
   - Set up error handling and rate limiting

3. **Core State Management**
   - Implement Zustand store with persistence
   - Set up React Query for server state
   - Create basic data flow architecture

### Phase 2: Basic Slideshow (Weeks 3-4)

1. **Media Display Components**
   - Create image, video, and GIF display components
   - Implement basic media type detection
   - Add loading states and error handling

2. **Slideshow Engine**
   - Implement auto-advance functionality
   - Add manual navigation controls
   - Create progress indicators and timing controls

3. **Mobile Responsiveness**
   - Implement touch gestures for navigation
   - Optimize for Pixel 6 and other mobile devices
   - Add responsive design breakpoints

### Phase 3: Content Management (Weeks 5-6)

1. **Content Selection**
   - Build community and user selection interface
   - Implement search functionality
   - Add content filtering options

2. **Content Deduplication**
   - Track viewed content in session storage
   - Implement content queue management
   - Add "reset viewed" functionality

3. **Favorites System**
   - Implement starring/favoriting posts
   - Create starred content viewing mode
   - Add persistent storage for favorites

### Phase 4: Advanced Features (Weeks 7-8)

1. **Settings and Customization**
   - Build comprehensive settings panel
   - Implement theme switching (light/dark)
   - Add accessibility options

2. **Keyboard Navigation**
   - Implement keyboard shortcuts
   - Add help overlay for shortcuts
   - Ensure accessibility compliance

3. **Performance Optimization**
   - Implement image preloading
   - Add virtual scrolling for large lists
   - Optimize bundle size with code splitting

### Phase 5: Polish and Testing (Weeks 9-10)

1. **Error Handling and Edge Cases**
   - Comprehensive error boundaries
   - Network failure recovery
   - Content validation and sanitization

2. **Testing Implementation**
   - Unit tests for core functionality
   - Integration tests for API client
   - End-to-end tests for user flows

3. **Performance and Accessibility Audit**
   - Lighthouse performance optimization
   - WCAG 2.1 AA compliance verification
   - Cross-browser testing

### Phase 6: Deployment and Documentation (Week 11)

1. **Production Build**
   - Configure production environment
   - Set up CI/CD pipeline
   - Implement monitoring and analytics

2. **Documentation**
   - User guide and feature documentation
   - Developer documentation
   - API integration examples

## Development Guidelines

### Code Organization

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Generic components
│   ├── slideshow/       # Slideshow-specific components
│   └── settings/        # Settings panel components
├── hooks/               # Custom React hooks
├── services/            # API clients and external services
├── stores/              # State management (Zustand stores)
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
├── constants/           # Application constants
└── assets/              # Static assets
```

### Naming Conventions

- **Components**: PascalCase (e.g., `SlideshowView`, `MediaDisplay`)
- **Hooks**: camelCase with "use" prefix (e.g., `useAppStore`, `useKeyboardShortcuts`)
- **Types/Interfaces**: PascalCase (e.g., `SlideshowPost`, `ContentState`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_INTERVAL`, `MAX_CACHE_SIZE`)
- **Files**: kebab-case (e.g., `slideshow-view.tsx`, `media-handler.ts`)

### Code Quality Standards

```typescript
// Example component with proper TypeScript and documentation
/**
 * Displays media content in the slideshow with proper error handling
 * and accessibility features.
 */
interface MediaDisplayProps {
  /** The post to display */
  post: SlideshowPost;
  /** Whether the media should auto-play */
  autoPlay?: boolean;
  /** Callback fired when media loads successfully */
  onLoad?: () => void;
  /** Callback fired when media fails to load */
  onError?: (error: string) => void;
}

const MediaDisplay: React.FC<MediaDisplayProps> = ({
  post,
  autoPlay = false,
  onLoad,
  onError,
}) => {
  // Component implementation...
};
```

### Testing Strategy

```typescript
// Unit test example
describe("MediaTypeDetector", () => {
  it("should detect image types correctly", () => {
    expect(MediaTypeDetector.detectMediaType("image.jpg")).toBe(
      MediaType.IMAGE
    );
    expect(MediaTypeDetector.detectMediaType("photo.png")).toBe(
      MediaType.IMAGE
    );
  });

  it("should detect video types correctly", () => {
    expect(MediaTypeDetector.detectMediaType("video.mp4")).toBe(
      MediaType.VIDEO
    );
    expect(MediaTypeDetector.detectMediaType("movie.webm")).toBe(
      MediaType.VIDEO
    );
  });

  it("should handle unknown types gracefully", () => {
    expect(MediaTypeDetector.detectMediaType("document.pdf")).toBe(
      MediaType.UNKNOWN
    );
  });
});

// Integration test example
describe("SlideshowView Integration", () => {
  it("should advance to next slide automatically", async () => {
    const { user } = renderWithProviders(<SlideshowView posts={mockPosts} />);

    expect(screen.getByText(mockPosts[0].title)).toBeInTheDocument();

    // Wait for auto-advance
    await waitFor(
      () => {
        expect(screen.getByText(mockPosts[1].title)).toBeInTheDocument();
      },
      { timeout: 11000 }
    );
  });
});
```

## Testing Strategy

### Test Coverage Requirements

- **Unit Tests**: 90% coverage for utility functions and services
- **Integration Tests**: 80% coverage for component interactions
- **E2E Tests**: 100% coverage for critical user flows

### Testing Framework Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      threshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
});

// playwright.config.ts
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "Mobile Chrome", use: { ...devices["Pixel 5"] } },
    { name: "Mobile Safari", use: { ...devices["iPhone 12"] } },
  ],
});
```

### Critical Test Scenarios

```typescript
// E2E test examples
test("Complete slideshow workflow", async ({ page }) => {
  await page.goto("/");

  // Select communities
  await page.click('[data-testid="content-browser"]');
  await page.fill('[data-testid="community-search"]', "memes");
  await page.click('[data-testid="add-community"]');

  // Start slideshow
  await page.click('[data-testid="start-slideshow"]');
  await expect(page.locator('[data-testid="slideshow-view"]')).toBeVisible();

  // Test navigation
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('[data-testid="slide-2"]')).toBeVisible();

  // Test starring
  await page.keyboard.press("KeyS");
  await expect(page.locator('[data-testid="star-indicator"]')).toBeVisible();
});

test("Mobile touch navigation", async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 }); // Pixel 6
  await page.goto("/slideshow");

  // Swipe left to go to next slide
  await page.touchscreen.tap(200, 400);
  await page.mouse.move(300, 400);
  await page.mouse.move(100, 400);

  await expect(page.locator('[data-testid="next-slide"]')).toBeVisible();
});
```

## Conclusion

This technical specification provides a comprehensive roadmap for implementing the Lemmy Media Slideshow web application. The architecture emphasizes performance, accessibility, and user experience while maintaining code quality and maintainability.

Key success factors:

- **Modular Architecture**: Clean separation of concerns for easy maintenance
- **Performance First**: Optimized for fast loading and smooth interactions
- **Mobile Responsive**: Excellent experience across all device sizes
- **Accessible Design**: Inclusive for users with different abilities
- **Robust Error Handling**: Graceful degradation under adverse conditions
- **Comprehensive Testing**: High confidence in application reliability

The implementation should proceed incrementally, with each phase building upon the previous one while maintaining a working application at all times. Regular testing and user feedback should guide refinements to ensure the final product meets all requirements outlined in the PRD.

<function_calls>
<invoke name="manage_todo_list">
<parameter name="operation">write
