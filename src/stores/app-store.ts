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
  // Permanently excluded communities (user never wants to see content from these)
  blockedCommunities: [],
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
  paginationCursors: {},
  globalCursor: undefined,
  likedPosts: {},
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
    auth: null,
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
    keepScreenAwake: false,
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
  contentSource: 'feed',
  orderingMode: 'hot',
  // feedMode controls how feed sourcing works when contentSource === 'feed'
  // 'random-communities' -> random public communities sample
  // 'communities' -> only user-selected communities
  // 'users' -> only user-selected users (client-side filtered)
  feedMode: 'random-communities' as any,
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
  // Community block list actions
  blockCommunity: (community: Community) => void;
  unblockCommunity: (communityId: number) => void;
  setFilters: (filters: Partial<ContentState['filters']>) => void;
  addToQueue: (posts: SlideshowPost[]) => void;
  markAsViewed: (postId: string) => void;
  clearViewedHistory: () => void;
  incrementBatch: () => void;
  resetQueue: () => void;
  // Pagination actions
  setPaginationCursor: (communityId: string, cursor: string) => void;
  setGlobalCursor: (cursor: string) => void;
  getNextCursor: (communityId?: string) => string | undefined;
  advancePagination: (communityId?: string) => void;
  getRandomizedFreshContent: () => void;
  setHasMore: (hasMore: boolean) => void;
  // Likes
  toggleLike: (post: SlideshowPost) => void;
  removeLike: (postId: string) => void;
  loadLikedIntoSlideshow: () => void;

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
            // Clear posts so a fresh fetch repopulates cleanly
            state.slideshow.posts = [];
            // Also clear viewed history to avoid treating future posts as already consumed
            if (state.content) {
              // If rehydration hasn't yet converted an array -> Set, do it now
              if (Array.isArray(state.content.viewedPosts)) {
                state.content.viewedPosts = new Set(state.content.viewedPosts);
              }
              if (
                state.content.viewedPosts &&
                typeof (state.content.viewedPosts as any).clear === 'function'
              ) {
                state.content.viewedPosts.clear();
              } else {
                // Fallback: reinitialize
                state.content.viewedPosts = new Set();
              }
            }
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

        // Block community (permanent exclusion)
        blockCommunity: (community: Community) =>
          set((state) => {
            const alreadyBlocked = state.content.blockedCommunities?.some(
              (c) => c.id === community.id
            );
            if (!alreadyBlocked) {
              state.content.blockedCommunities?.push(community);
              // Also remove from selectedCommunities if present
              state.content.selectedCommunities =
                state.content.selectedCommunities.filter(
                  (c) => c.id !== community.id
                );
              state.addNotification?.(
                `Blocked community c/${community.name}`,
                'warning'
              );
            } else {
              state.addNotification?.(
                `Community c/${community.name} already blocked`,
                'info'
              );
            }
          }),

        // Unblock community
        unblockCommunity: (communityId: number) =>
          set((state) => {
            const before = state.content.blockedCommunities?.length || 0;
            state.content.blockedCommunities = (
              state.content.blockedCommunities || []
            ).filter((c) => c.id !== communityId);
            const after = state.content.blockedCommunities.length;
            if (after < before) {
              state.addNotification?.('Unblocked community', 'success');
            }
          }),

        setFilters: (filters: Partial<ContentState['filters']>) =>
          set((state) => {
            state.content.filters = { ...state.content.filters, ...filters };
          }),

        addToQueue: (posts: SlideshowPost[]) =>
          set((state) => {
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

        setHasMore: (hasMore: boolean) =>
          set((state) => {
            state.content.hasMore = hasMore;
          }),

        // Like / Unlike handling
        toggleLike: (post: SlideshowPost) =>
          set((state) => {
            if (!state.content.likedPosts) state.content.likedPosts = {};
            const existing = state.content.likedPosts[post.id];
            const isLiking = !existing;

            if (isLiking) {
              // Add to liked map with timestamp snapshot
              state.content.likedPosts[post.id] = {
                ...post,
                starred: true, // ensure snapshot reflects liked state
                likedAt: Date.now(),
              } as any;
              state.addNotification?.('Added to liked', 'success');
            } else {
              // Remove from liked map
              delete state.content.likedPosts[post.id];
              state.addNotification?.('Removed from liked', 'info');
            }

            // Optimistically update the current slideshow.posts array
            if (Array.isArray(state.slideshow.posts)) {
              for (let i = 0; i < state.slideshow.posts.length; i++) {
                if (state.slideshow.posts[i].id === post.id) {
                  state.slideshow.posts[i].starred = isLiking; // mutate in-place (immer handled)
                  break;
                }
              }
            }

            // If currently viewing liked content, rebuild ordered list from liked items (all starred=true)
            if (state.settings.contentSource === 'liked') {
              state.slideshow.posts = Object.values(state.content.likedPosts)
                .sort((a: any, b: any) => b.likedAt - a.likedAt)
                .map((p: any) => ({ ...p, starred: true }));
              // Adjust index to remain within bounds
              state.slideshow.currentIndex = Math.min(
                state.slideshow.currentIndex,
                Math.max(state.slideshow.posts.length - 1, 0)
              );
            }
          }),

        removeLike: (postId: string) =>
          set((state) => {
            if (!state.content.likedPosts) return;
            if (state.content.likedPosts[postId]) {
              delete state.content.likedPosts[postId];
              if (state.settings.contentSource === 'liked') {
                state.slideshow.posts = Object.values(
                  state.content.likedPosts
                ).sort((a: any, b: any) => b.likedAt - a.likedAt);
                state.slideshow.currentIndex = Math.min(
                  state.slideshow.currentIndex,
                  Math.max(state.slideshow.posts.length - 1, 0)
                );
              }
            }
          }),

        loadLikedIntoSlideshow: () =>
          set((state) => {
            const liked = state.content.likedPosts || {};
            state.slideshow.posts = Object.values(liked).sort(
              (a: any, b: any) => b.likedAt - a.likedAt
            );
            state.slideshow.currentIndex = 0;
            state.slideshow.isPlaying = false;
            state.content.hasMore = false; // No infinite loading for liked
          }),

        // Pagination actions
        setPaginationCursor: (communityId: string, cursor: string) =>
          set((state) => {
            if (
              !state.content.paginationCursors ||
              typeof state.content.paginationCursors !== 'object'
            ) {
              console.warn(
                '[app-store] paginationCursors missing; reinitializing to {}'
              );
              state.content.paginationCursors = {} as any;
            }
            state.content.paginationCursors[communityId] = cursor;
          }),

        setGlobalCursor: (cursor: string) =>
          set((state) => {
            state.content.globalCursor = cursor;
          }),

        getNextCursor: (communityId?: string) => {
          const state = get();
          if (communityId) {
            const cursors = state.content?.paginationCursors;
            if (!cursors || typeof cursors !== 'object') return undefined;
            return (cursors as Record<string, string | undefined>)[communityId];
          }
          return state.content?.globalCursor;
        },

        advancePagination: (communityId?: string) =>
          set((state) => {
            // This will be called when we want to advance to the next page
            // The actual cursor update happens in the hook when we receive new data
            if (communityId) {
              if (
                !state.content.paginationCursors ||
                typeof state.content.paginationCursors !== 'object'
              ) {
                state.content.paginationCursors = {} as any;
              }
              // Reset cursor to get fresh content from this community
              delete state.content.paginationCursors[communityId];
            } else {
              // Reset global cursor to get fresh content
              state.content.globalCursor = undefined;
            }
          }),

        // Helper action to advance pagination to get fresh content on restart
        getRandomizedFreshContent: () => {
          try {
            const { content, advancePagination } = get();
            if (!content) {
              console.warn(
                '[app-store] getRandomizedFreshContent: content slice undefined'
              );
              return;
            }
            const rawCursors = (content as any).paginationCursors;
            if (!rawCursors || typeof rawCursors !== 'object') {
              console.log(
                '[app-store] getRandomizedFreshContent: no paginationCursors present, skipping'
              );
              return;
            }
            const paginationCursors: Record<string, string> = rawCursors;
            const globalCursor = content.globalCursor;
            const hasCursors =
              !!globalCursor || Object.keys(paginationCursors).length > 0;
            if (!hasCursors) return;
            const shouldAdvance = Math.random() < 0.3;
            if (!shouldAdvance) return;
            console.log(
              '🎲 Advancing pagination to get fresh content on restart'
            );
            if (globalCursor) {
              advancePagination();
            }
            Object.keys(paginationCursors).forEach((communityId) => {
              advancePagination(communityId);
            });
          } catch (err) {
            console.error('[app-store] getRandomizedFreshContent error:', err);
          }
        },

        // Settings actions
        updateSettings: (settings) =>
          set((state) => {
            const previousInstance = state.settings?.server?.instanceUrl;
            const nextInstance = settings.server?.instanceUrl;
            const instanceChanged =
              typeof nextInstance === 'string' &&
              nextInstance.trim().length > 0 &&
              nextInstance !== previousInstance;

            const previousAuthToken = state.settings?.server?.auth?.jwt ?? null;
            let nextAuthToken = previousAuthToken;
            if (settings.server && 'auth' in settings.server) {
              nextAuthToken = settings.server.auth?.jwt ?? null;
            }
            const authChanged =
              settings.server !== undefined &&
              (settings.server.auth !== undefined || instanceChanged) &&
              nextAuthToken !== previousAuthToken;

            state.settings = { ...state.settings, ...settings };

            if (instanceChanged || authChanged) {
              state.content.globalCursor = undefined;
              state.content.paginationCursors = {} as any;
              state.content.hasMore = true;
            }

            if (authChanged) {
              state.content.queue = [];
              state.content.viewedPosts = new Set();
              state.slideshow.posts = [];
              state.slideshow.currentIndex = 0;
            }
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
            // Initialize blockedCommunities if missing
            if (!state.content.blockedCommunities) {
              state.content.blockedCommunities = [];
            }
            // If somehow persisted as plain array and not yet converted
            if (Array.isArray(state.content.viewedPosts)) {
              state.content.viewedPosts = new Set(
                state.content.viewedPosts as string[]
              );
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

            // (Removed duplicate conversion block; handled above)

            // Detect if mobile
            if (typeof window !== 'undefined') {
              state.ui.isMobile = window.innerWidth <= 768;
            }

            // Initialize likedPosts map if missing
            if (!state.content.likedPosts) {
              state.content.likedPosts = {};
            }
            // Backfill settings.contentSource default
            if (!state.settings.contentSource) {
              state.settings.contentSource = 'feed';
            }
            if (!state.settings.feedMode) {
              (state.settings as any).feedMode = 'random-communities';
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
        // Persist everything under one key; reuse SETTINGS key to avoid schema explosion
        name: STORAGE_KEYS.SETTINGS,
        storage: createJSONStorage(() => localStorage),
        migrate: (persistedState: any) => {
          if (!persistedState) return persistedState;
          if (!persistedState.content) {
            persistedState.content = { ...initialContentState };
          } else {
            const c = persistedState.content;
            if (!Array.isArray(c.selectedCommunities))
              c.selectedCommunities = [];
            if (!Array.isArray(c.selectedUsers)) c.selectedUsers = [];
            if (!c.filters) c.filters = { ...initialContentState.filters };
            if (!c.paginationCursors || typeof c.paginationCursors !== 'object')
              c.paginationCursors = {};
            if (typeof c.hasMore !== 'boolean') c.hasMore = true;
            if (!('currentBatch' in c)) c.currentBatch = 1;
            if (Array.isArray(c.viewedPosts)) {
              c.viewedPosts = new Set(c.viewedPosts);
            }
            if (!c.viewedPosts) {
              c.viewedPosts = new Set();
            }
          }
          if (!persistedState.slideshow) {
            persistedState.slideshow = { ...initialSlideshowState };
          } else {
            const s = persistedState.slideshow;
            if (!Array.isArray(s.posts)) s.posts = [];
            if (typeof s.currentIndex !== 'number') s.currentIndex = 0;
          }
          if (!persistedState.settings) {
            persistedState.settings = { ...initialSettingsState };
          } else {
            const setg = persistedState.settings;
            if (!setg.server) setg.server = { ...initialSettingsState.server };
            if (!setg.intervals)
              setg.intervals = { ...initialSettingsState.intervals };
            if (!setg.display)
              setg.display = { ...initialSettingsState.display };
            else if (typeof setg.display.keepScreenAwake === 'undefined')
              setg.display.keepScreenAwake = false;
            if (!setg.contentSource) setg.contentSource = 'feed';
            if (!setg.orderingMode) setg.orderingMode = 'hot';
            if (!setg.feedMode) (setg as any).feedMode = 'random-communities';
          }
          if (!persistedState.ui) {
            persistedState.ui = { ...initialUIState };
          }
          if (!persistedState.content.likedPosts) {
            persistedState.content.likedPosts = {};
          }
          if (!persistedState.content.blockedCommunities) {
            persistedState.content.blockedCommunities = [];
          }
          return persistedState;
        },
        // Persist entire state since we have migrate + defensive rehydrate
        onRehydrateStorage: () => (state) => {
          if (state) state.rehydrate();
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
