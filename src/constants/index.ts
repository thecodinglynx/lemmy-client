// API Configuration
export const API_CONFIG = {
  DEFAULT_INSTANCE: 'lemmy.world',
  API_VERSION: 'v3',
  DEFAULT_BASE_URL: 'https://lemmy.world/api/v3',
  RATE_LIMIT: {
    MAX_REQUESTS_PER_SECOND: 10,
    RETRY_ATTEMPTS: 3,
    BACKOFF_BASE: 1000, // milliseconds
    TIMEOUT: 10000, // 10 seconds
  },
} as const;

// Media Configuration
export const MEDIA_CONFIG = {
  SUPPORTED_IMAGE_FORMATS: [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'webp',
    'avif',
  ] as const,
  SUPPORTED_VIDEO_FORMATS: ['mp4', 'webm', 'ogg'] as const,
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  PRELOAD_COUNT: {
    AHEAD: 3,
    BEHIND: 1,
  },
  CACHE_SIZE: {
    MAX_ITEMS: 50,
    MAX_MEMORY_MB: 100,
  },
  QUALITY_PRESETS: {
    LOW: { width: 480, quality: 60 },
    MEDIUM: { width: 720, quality: 80 },
    HIGH: { width: 1080, quality: 90 },
  },
} as const;

// Slideshow Configuration
export const SLIDESHOW_CONFIG = {
  TIMING: {
    MIN_SECONDS: 5,
    MAX_SECONDS: 60,
    INCREMENT: 5,
    DEFAULT: {
      IMAGES: 10,
      VIDEOS: 0, // 0 means play full duration
      GIFS: 15,
    },
  },
  TRANSITIONS: {
    DURATION: 300, // milliseconds
    EASING: 'ease-out',
  },
  AUTO_ADVANCE: true,
  LOOP: true,
} as const;

// UI Configuration
export const UI_CONFIG = {
  MOBILE_BREAKPOINT: 768, // pixels
  PIXEL6_DIMENSIONS: {
    WIDTH: 412,
    HEIGHT: 915,
  },
  CONTROL_TIMEOUT: 3000, // milliseconds
  NOTIFICATION_TIMEOUT: 5000, // milliseconds
  DEBOUNCE_DELAY: 300, // milliseconds for search inputs
  ANIMATION_DURATION: 200, // milliseconds
} as const;

// Keyboard Shortcuts
export const KEYBOARD_SHORTCUTS = {
  PLAY_PAUSE: ' ', // Space
  NEXT: 'ArrowRight',
  PREVIOUS: 'ArrowLeft',
  VOLUME_UP: 'ArrowUp',
  VOLUME_DOWN: 'ArrowDown',
  STAR: 's',
  FULLSCREEN: 'f',
  ESCAPE: 'Escape',
  HELP: 'h',
  SETTINGS: ',',
} as const;

// Timing Presets
export const TIMING_PRESETS = {
  '1': 5,
  '2': 10,
  '3': 15,
  '4': 20,
  '5': 25,
  '6': 30,
  '7': 45,
  '8': 60,
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  SETTINGS: 'lemmy-slideshow-settings',
  STARRED_CONTENT: 'lemmy-slideshow-starred',
  SELECTED_COMMUNITIES: 'lemmy-slideshow-communities',
  SELECTED_USERS: 'lemmy-slideshow-users',
  VIEWED_POSTS: 'lemmy-slideshow-viewed',
  PERFORMANCE_METRICS: 'lemmy-slideshow-metrics',
  USER_PREFERENCES: 'lemmy-slideshow-preferences',
} as const;

// Default Settings
export const DEFAULT_SETTINGS = {
  theme: 'auto',
  autoAdvance: true,
  intervals: {
    images: 10,
    videos: 0,
    gifs: 15,
  },
  accessibility: {
    highContrast: false,
    reducedMotion: false,
    textSize: 'medium',
    screenReaderAnnouncements: true,
  },
  display: {
    showAttribution: true,
    showControls: true,
    fullscreenDefault: false,
    attributionPosition: 'bottom',
  },
  controls: {
    keyboardShortcuts: KEYBOARD_SHORTCUTS,
    touchGestures: true,
    autoHideControls: true,
    controlTimeout: 3000,
    timingPresets: TIMING_PRESETS,
  },
} as const;

// Content Filters
export const CONTENT_FILTERS = {
  SORT_OPTIONS: [
    'Active',
    'Hot',
    'New',
    'Old',
    'TopDay',
    'TopWeek',
    'TopMonth',
    'TopYear',
    'TopAll',
    'MostComments',
    'NewComments',
    'TopHour',
    'TopSixHour',
    'TopTwelveHour',
    'TopThreeMonths',
    'TopSixMonths',
    'TopNineMonths',
    'Controversial',
    'Scaled',
  ] as const,
  TYPE_OPTIONS: ['All', 'Local', 'Subscribed'] as const,
  MIN_SCORE_OPTIONS: [0, 1, 5, 10, 25, 50, 100] as const,
  PAGE_SIZE: 20,
  MAX_PAGES: 100,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error occurred. Please check your connection.',
  API_ERROR: 'Failed to fetch data from Lemmy API.',
  MEDIA_LOAD_ERROR: 'Failed to load media content.',
  STORAGE_ERROR: 'Failed to save data. Storage may be full.',
  INVALID_URL: 'Invalid URL provided.',
  NO_CONTENT: 'No content available with current filters.',
  RATE_LIMITED: 'Too many requests. Please wait a moment.',
  UNAUTHORIZED: 'Authentication required.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'Content not found.',
  SERVER_ERROR: 'Server error occurred.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  CONTENT_STARRED: 'Content added to favorites!',
  CONTENT_UNSTARRED: 'Content removed from favorites.',
  SETTINGS_SAVED: 'Settings saved successfully.',
  COMMUNITY_ADDED: 'Community added to selection.',
  USER_ADDED: 'User added to selection.',
  EXPORT_SUCCESS: 'Data exported successfully.',
  IMPORT_SUCCESS: 'Data imported successfully.',
} as const;

// Accessibility
export const ACCESSIBILITY = {
  ARIA_LABELS: {
    PLAY_BUTTON: 'Play slideshow',
    PAUSE_BUTTON: 'Pause slideshow',
    NEXT_BUTTON: 'Next media item',
    PREVIOUS_BUTTON: 'Previous media item',
    STAR_BUTTON: 'Add to favorites',
    UNSTAR_BUTTON: 'Remove from favorites',
    SETTINGS_BUTTON: 'Open settings',
    FULLSCREEN_BUTTON: 'Enter fullscreen',
    EXIT_FULLSCREEN_BUTTON: 'Exit fullscreen',
    VOLUME_SLIDER: 'Adjust volume',
    TIMING_SLIDER: 'Adjust slideshow timing',
    SEARCH_INPUT: 'Search communities or users',
    MEDIA_CONTENT: 'Media content from',
  },
  ROLE_DESCRIPTIONS: {
    SLIDESHOW: 'Media slideshow viewer',
    CONTROLS: 'Slideshow controls',
    SETTINGS: 'Application settings',
    CONTENT_BROWSER: 'Content selection browser',
  },
} as const;

// Performance Budgets
export const PERFORMANCE_BUDGETS = {
  INITIAL_LOAD_TIME: 3000, // milliseconds
  MEDIA_LOAD_TIME: 2000, // milliseconds
  TRANSITION_TIME: 300, // milliseconds
  MEMORY_LIMIT: 100 * 1024 * 1024, // 100MB
  CACHE_SIZE_LIMIT: 50, // number of items
  FPS_TARGET: 60,
  LCP_TARGET: 2500, // milliseconds
  FID_TARGET: 100, // milliseconds
  CLS_TARGET: 0.1,
} as const;

// Media Type Detection
export const MEDIA_TYPE_PATTERNS = {
  IMAGE: /\.(jpe?g|png|gif|webp|avif|bmp|svg)$/i,
  VIDEO: /\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv)$/i,
  GIF: /\.gif$/i,
  PICTRS: /\/pictrs\/image\/[a-zA-Z0-9-_]+\.(jpe?g|png|gif|webp|avif)$/i,
} as const;

// Queue Management
export const QUEUE_CONFIG = {
  MIN_QUEUE_SIZE: 10,
  PREFETCH_THRESHOLD: 5,
  MAX_QUEUE_SIZE: 100,
  BATCH_SIZE: 20,
  DEDUPLICATION_WINDOW: 1000, // number of recent posts to check for duplicates
} as const;

// Theme Colors
export const THEME_COLORS = {
  LIGHT: {
    BACKGROUND: '#ffffff',
    FOREGROUND: '#000000',
    PRIMARY: '#2563eb',
    SECONDARY: '#64748b',
    ACCENT: '#f59e0b',
    MUTED: '#f1f5f9',
  },
  DARK: {
    BACKGROUND: '#0f172a',
    FOREGROUND: '#f8fafc',
    PRIMARY: '#3b82f6',
    SECONDARY: '#94a3b8',
    ACCENT: '#fbbf24',
    MUTED: '#1e293b',
  },
  HIGH_CONTRAST: {
    BACKGROUND: '#000000',
    FOREGROUND: '#ffffff',
    PRIMARY: '#00ff00',
    SECONDARY: '#ffff00',
    ACCENT: '#ff0000',
    MUTED: '#333333',
  },
} as const;
