import { create } from 'zustand';
import {
  subscribeWithSelector,
  persist,
  createJSONStorage,
} from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import type {
  AppState,
  SlideshowState,
  ContentState,
  SettingsState,
  UIState,
  SlideshowPost,
  Community,
  Person,
  MediaType,
} from '@types';
import { STORAGE_KEYS } from '@constants';

// Enable Immer's MapSet plugin for Set/Map support
enableMapSet();

// Define the initial states
const initialSlideshowState: SlideshowState = {
  isPlaying: false,
  currentIndex: 0,
  posts: [],
  timing: {
    images: 10,
    videos: 0,
    gifs: 15,
  },
  autoAdvance: true,
  loop: true,
};

const initialContentState: ContentState = {
  selectedCommunities: [],
  selectedUsers: [],
  filters: {
    mediaTypes: ['image', 'video', 'gif'] as MediaType[],
    showNSFW: false, // User can now control this via UI
    minScore: 0,
    keywords: [],
    excludeKeywords: [],
    preset: 'default',
    quality: {
      enabled: false,
      threshold: 0.5,
    },
  },
  queue: [],
  viewedPosts: new Set(),
  currentBatch: 1,
  hasMore: true,
};

const initialSettingsState: SettingsState = {
  theme: 'auto' as const,
  autoAdvance: true,
  intervals: {
    images: 10,
    videos: 0,
    gifs: 15,
  },
  server: {
    instanceUrl: 'https://lemmy.world',
    customProxy: false,
  },
  accessibility: {
    highContrast: false,
    reducedMotion: false,
    textSize: 'medium' as const,
    screenReaderAnnouncements: true,
  },
  display: {
    showAttribution: true,
    showControls: true,
    fullscreenDefault: false,
    attributionPosition: 'bottom' as const,
  },
  controls: {
    keyboardShortcuts: {
      PLAY_PAUSE: ' ',
      NEXT: 'ArrowRight',
      PREVIOUS: 'ArrowLeft',
      VOLUME_UP: 'ArrowUp',
      VOLUME_DOWN: 'ArrowDown',
      STAR: 's',
      FULLSCREEN: 'f',
      ESCAPE: 'Escape',
      HELP: 'h',
      SETTINGS: ',',
    },
    touchGestures: true,
    autoHideControls: true,
    controlTimeout: 3000,
  },
  performance: {
    enablePreloading: true,
    preloadCount: 3,
    enableVirtualScrolling: false,
    maxCacheSize: 100,
  },
};

const initialUIState: UIState = {
  showSettingsPanel: false,
  showContentBrowser: false,
  showStarredView: false,
  showHelpOverlay: false,
  isFullscreen: false,
  isMobile: false,
  loading: false,
  notifications: [],
};

// App store interface with actions
interface AppStore extends AppState {
  // Slideshow actions
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  goToIndex: (index: number) => void;
  resetSlideshow: () => void;
  setPosts: (posts: SlideshowPost[]) => void;
  addPosts: (posts: SlideshowPost[]) => void;
  setTiming: (type: keyof SlideshowState['timing'], seconds: number) => void;
  toggleAutoAdvance: () => void;

  // Content actions
  addCommunity: (community: Community) => void;
  removeCommunity: (communityId: number) => void;
  addUser: (user: Person) => void;
  removeUser: (userId: number) => void;
  setFilters: (filters: Partial<ContentState['filters']>) => void;
  addToQueue: (posts: SlideshowPost[]) => void;
  markAsViewed: (postId: string) => void;
  clearViewedHistory: () => void;
  incrementBatch: () => void;
  resetQueue: () => void;

  // Settings actions
  updateSettings: (settings: Partial<SettingsState>) => void;
  resetSettings: () => void;

  // UI actions
  toggleSettingsPanel: () => void;
  toggleContentBrowser: () => void;
  toggleStarredView: () => void;
  toggleHelpOverlay: () => void;
  setFullscreen: (fullscreen: boolean) => void;
  setMobile: (mobile: boolean) => void;
  setLoading: (loading: boolean) => void;
  addNotification: (
    message: string,
    type?: 'info' | 'success' | 'warning' | 'error'
  ) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setError: (error: string | null) => void;

  // Persistence actions
  rehydrate: () => void;
  reset: () => void;
}

// Create the main app store
export const useAppStore = create<AppStore>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        // Initial state
        slideshow: initialSlideshowState,
        content: initialContentState,
        settings: initialSettingsState,
        ui: initialUIState,

        // Slideshow actions
        play: () =>
          set((state) => {
            state.slideshow.isPlaying = true;
          }),

        pause: () =>
          set((state) => {
            state.slideshow.isPlaying = false;
          }),

        togglePlay: () =>
          set((state) => {
            state.slideshow.isPlaying = !state.slideshow.isPlaying;
          }),

        next: () =>
          set((state) => {
            const currentIndex = state.slideshow.currentIndex;
            const postsLength = state.slideshow.posts.length;

            if (postsLength === 0) return;

            if (currentIndex < postsLength - 1) {
              state.slideshow.currentIndex = currentIndex + 1;
            } else if (state.slideshow.loop) {
              state.slideshow.currentIndex = 0;
            }

            // Mark current post as viewed
            const currentPost =
              state.slideshow.posts[state.slideshow.currentIndex];
            if (currentPost) {
              state.content.viewedPosts.add(currentPost.id);
            }
          }),

        previous: () =>
          set((state) => {
            const currentIndex = state.slideshow.currentIndex;
            const postsLength = state.slideshow.posts.length;

            if (postsLength === 0) return;

            if (currentIndex > 0) {
              state.slideshow.currentIndex = currentIndex - 1;
            } else if (state.slideshow.loop) {
              state.slideshow.currentIndex = postsLength - 1;
            }
          }),

        goToIndex: (index: number) =>
          set((state) => {
            const postsLength = state.slideshow.posts.length;
            if (index >= 0 && index < postsLength) {
              state.slideshow.currentIndex = index;

              // Mark current post as viewed
              const currentPost = state.slideshow.posts[index];
              if (currentPost) {
                state.content.viewedPosts.add(currentPost.id);
              }
            }
          }),

        resetSlideshow: () =>
          set((state) => {
            state.slideshow.currentIndex = 0;
            state.slideshow.isPlaying = false;
          }),

        setPosts: (posts: SlideshowPost[]) =>
          set((state) => {
            state.slideshow.posts = posts;
            state.slideshow.currentIndex = 0;
          }),

        addPosts: (posts: SlideshowPost[]) =>
          set((state) => {
            state.slideshow.posts.push(...posts);
          }),

        setTiming: (type, seconds) =>
          set((state) => {
            state.slideshow.timing[type] = seconds;
            state.settings.intervals[type] = seconds;
          }),

        toggleAutoAdvance: () =>
          set((state) => {
            state.slideshow.autoAdvance = !state.slideshow.autoAdvance;
            state.settings.autoAdvance = state.slideshow.autoAdvance;
          }),

        // Content actions
        addCommunity: (community: Community) =>
          set((state) => {
            const exists = state.content.selectedCommunities.find(
              (c: Community) => c.id === community.id
            );
            if (!exists) {
              state.content.selectedCommunities.push(community);
            }
          }),

        removeCommunity: (communityId: number) =>
          set((state) => {
            state.content.selectedCommunities =
              state.content.selectedCommunities.filter(
                (c: Community) => c.id !== communityId
              );
          }),

        addUser: (user: Person) =>
          set((state) => {
            const exists = state.content.selectedUsers.find(
              (u: Person) => u.id === user.id
            );
            if (!exists) {
              state.content.selectedUsers.push(user);
            }
          }),

        removeUser: (userId: number) =>
          set((state) => {
            state.content.selectedUsers = state.content.selectedUsers.filter(
              (u: Person) => u.id !== userId
            );
          }),

        setFilters: (filters) =>
          set((state) => {
            state.content.filters = { ...state.content.filters, ...filters };
          }),

        addToQueue: (posts: SlideshowPost[]) =>
          set((state) => {
            // Filter out already queued posts
            const newPosts = posts.filter(
              (post: SlideshowPost) =>
                !state.content.queue.find(
                  (queuedPost: SlideshowPost) => queuedPost.id === post.id
                )
            );
            state.content.queue.push(...newPosts);
          }),

        markAsViewed: (postId: string) =>
          set((state) => {
            state.content.viewedPosts.add(postId);
          }),

        clearViewedHistory: () =>
          set((state) => {
            state.content.viewedPosts.clear();
          }),

        incrementBatch: () =>
          set((state) => {
            state.content.currentBatch += 1;
          }),

        resetQueue: () =>
          set((state) => {
            state.content.queue = [];
            state.content.currentBatch = 1;
            state.content.hasMore = true;
          }),

        // Settings actions
        updateSettings: (settings) =>
          set((state) => {
            state.settings = { ...state.settings, ...settings };
          }),

        resetSettings: () =>
          set((state) => {
            state.settings = initialSettingsState;
          }),

        // UI actions
        toggleSettingsPanel: () =>
          set((state) => {
            state.ui.showSettingsPanel = !state.ui.showSettingsPanel;
          }),

        toggleContentBrowser: () =>
          set((state) => {
            state.ui.showContentBrowser = !state.ui.showContentBrowser;
          }),

        toggleStarredView: () =>
          set((state) => {
            state.ui.showStarredView = !state.ui.showStarredView;
          }),

        toggleHelpOverlay: () =>
          set((state) => {
            state.ui.showHelpOverlay = !state.ui.showHelpOverlay;
          }),

        setFullscreen: (fullscreen: boolean) =>
          set((state) => {
            state.ui.isFullscreen = fullscreen;
          }),

        setMobile: (mobile: boolean) =>
          set((state) => {
            state.ui.isMobile = mobile;
          }),

        setLoading: (loading: boolean) =>
          set((state) => {
            state.ui.loading = loading;
          }),

        addNotification: (message, type = 'info') =>
          set((state) => {
            const notification = {
              id: Date.now().toString(),
              type,
              message,
              timestamp: Date.now(),
            };
            state.ui.notifications.push(notification);

            // Auto-remove after 5 seconds
            setTimeout(() => {
              const currentState = get();
              currentState.removeNotification(notification.id);
            }, 5000);
          }),

        removeNotification: (id: string) =>
          set((state) => {
            state.ui.notifications = state.ui.notifications.filter(
              (n: any) => n.id !== id
            );
          }),

        clearNotifications: () =>
          set((state) => {
            state.ui.notifications = [];
          }),

        setError: (error: string | null) =>
          set((state) => {
            state.ui.error = error;
          }),

        // Persistence actions
        rehydrate: () => {
          // This will be called after the store is rehydrated from storage
          set((state) => {
            // Ensure server settings exist with defaults
            if (!state.settings.server) {
              state.settings.server = {
                instanceUrl: 'https://lemmy.world',
                customProxy: false,
              };
            }

            // Ensure performance settings exist with defaults
            if (!state.settings.performance) {
              state.settings.performance = {
                enablePreloading: true,
                preloadCount: 3,
                enableVirtualScrolling: false,
                maxCacheSize: 100,
              };
            }

            // Ensure content state has all required fields
            if (!state.content.viewedPosts) {
              state.content.viewedPosts = new Set();
            }
            if (!state.content.queue) {
              state.content.queue = [];
            }
            if (typeof state.content.currentBatch !== 'number') {
              state.content.currentBatch = 1;
            }
            if (typeof state.content.hasMore !== 'boolean') {
              state.content.hasMore = true;
            }

            // Convert Set back from array if needed
            if (Array.isArray(state.content.viewedPosts)) {
              state.content.viewedPosts = new Set(
                state.content.viewedPosts as string[]
              );
            }

            // Detect if mobile
            if (typeof window !== 'undefined') {
              state.ui.isMobile = window.innerWidth <= 768;
            }
          });
        },

        reset: () =>
          set(() => ({
            slideshow: initialSlideshowState,
            content: initialContentState,
            settings: initialSettingsState,
            ui: initialUIState,
          })),
      })),
      {
        name: STORAGE_KEYS.SETTINGS,
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Only persist certain parts of the state
          settings: state.settings,
          content: {
            selectedCommunities: state.content.selectedCommunities,
            selectedUsers: state.content.selectedUsers,
            filters: state.content.filters,
          },
          slideshow: {
            timing: state.slideshow.timing,
            autoAdvance: state.slideshow.autoAdvance,
            loop: state.slideshow.loop,
          },
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            state.rehydrate();
          }
        },
      }
    )
  )
);

// Initialize mobile detection
if (typeof window !== 'undefined') {
  const handleResize = () => {
    useAppStore.getState().setMobile(window.innerWidth <= 768);
  };

  window.addEventListener('resize', handleResize);
  handleResize(); // Initial check
}
