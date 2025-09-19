# Lemmy Media Slideshow - Step-by-Step Implementation Prompts

## Overview

This document provides detailed prompts for implementing the Lemmy Media Slideshow web application. Each prompt is designed to be used with AI-assisted development tools and includes specific acceptance criteria, testing requirements, and validation steps.

## Phase 1: Core Foundation (Weeks 1-2)

### Step 1.1: Project Initialization and Setup

**Prompt:**

```
Create a new React + TypeScript project using Vite for a Lemmy Media Slideshow web application. Set up the following:

1. Initialize a new Vite project with React + TypeScript template
2. Configure the project structure according to this layout:
```

src/
├── components/ # Reusable UI components
│ ├── common/ # Generic components
│ ├── slideshow/ # Slideshow-specific components
│ └── settings/ # Settings panel components
├── hooks/ # Custom React hooks
├── services/ # API clients and external services
├── stores/ # State management (Zustand stores)
├── types/ # TypeScript type definitions
├── utils/ # Utility functions
├── constants/ # Application constants
└── assets/ # Static assets

```

3. Install and configure these dependencies:
- Tailwind CSS for styling
- Zustand for state management
- React Query (TanStack Query) for server state
- React Router for navigation
- Framer Motion for animations
- Headless UI and Radix UI for accessible components

4. Set up development tools:
- ESLint + Prettier configuration
- Husky for Git hooks
- TypeScript strict mode configuration
- Vite environment configuration

5. Create initial TypeScript interfaces for core data models:
- LemmyPost interface
- SlideshowPost interface
- MediaType enum
- Community and Person interfaces
- Application state interfaces (AppState, SlideshowState, ContentState, SettingsState, UIState)

6. Set up basic routing structure with React Router for:
- Slideshow view (main route)
- Settings panel
- Content browser

**Acceptance Criteria:**
- [ ] Project builds successfully with no TypeScript errors
- [ ] Tailwind CSS is properly configured and working
- [ ] All folder structure is created
- [ ] Basic routing navigation works
- [ ] Development server starts without errors
- [ ] Code quality tools (ESLint, Prettier) are functioning

**Testing:**
- Verify the development server runs on localhost:5173
- Test that TypeScript compilation works without errors
- Confirm all installed packages are compatible
- Validate ESLint and Prettier configurations work

**Files to create:**
- package.json (with all dependencies)
- vite.config.ts
- tailwind.config.js
- .eslintrc.js
- .prettierrc
- tsconfig.json
- src/types/index.ts (with all interfaces)
- src/constants/index.ts
- Basic component files for routing
```

### Step 1.2: Lemmy API Client Implementation

**Prompt:**

```
Implement a comprehensive Lemmy API client with proper error handling, rate limiting, and TypeScript support.

Requirements:
1. Create a LemmyAPIClient class with these methods:
   - getPosts(params: GetPostsParams): Promise<LemmyPost[]>
   - getCommunities(search?: string): Promise<Community[]>
   - getUsers(search: string): Promise<Person[]>
   - getSite(): Promise<SiteInfo>

2. Implement rate limiting strategy:
   - Maximum 10 requests per second
   - Exponential backoff for retries
   - Queue system for managing requests

3. Error handling:
   - Custom APIError class with status codes
   - Retry logic for transient failures
   - Timeout handling (10 seconds default)
   - Network failure recovery

4. Support for query parameters:
   - type_: "All" | "Local" | "Subscribed"
   - sort: "Active" | "Hot" | "New" | "Old" | "TopDay" | "TopWeek" | "TopMonth" | "TopYear" | "TopAll" | "MostComments" | "NewComments" | "TopHour" | "TopSixHour" | "TopTwelveHour" | "TopThreeMonths" | "TopSixMonths" | "TopNineMonths" | "Controversial" | "Scaled"
   - community_id and creator_id filters
   - page and limit for pagination
   - show_nsfw boolean flag

5. Media URL handling:
   - Integration with Pictrs service
   - URL validation and sanitization
   - Support for different Lemmy instances

6. Configuration:
   - Default instance: lemmy.world
   - Configurable base URL
   - API version support (v3)

**Acceptance Criteria:**
- [ ] API client successfully fetches posts from lemmy.world
- [ ] Rate limiting prevents API abuse
- [ ] Error handling gracefully manages failures
- [ ] TypeScript types are properly defined
- [ ] All query parameters work correctly
- [ ] Media URLs are properly processed

**Testing:**
Create unit tests for:
- API client methods with mock responses
- Rate limiting functionality
- Error handling scenarios
- URL validation
- Query parameter serialization

**Files to create:**
- src/services/lemmy-api-client.ts
- src/services/rate-limiter.ts
- src/services/error-handler.ts
- src/types/api.ts
- src/utils/url-utils.ts
- src/__tests__/services/lemmy-api-client.test.ts
```

### Step 1.3: State Management Setup

**Prompt:**

```
Implement the complete state management system using Zustand with persistence and React Query integration.

Requirements:
1. Create the main Zustand store with these slices:
   - Slideshow state (isPlaying, currentIndex, posts, timing)
   - Content state (selectedCommunities, selectedUsers, filters)
   - Settings state (autoAdvance, intervals, accessibility options)
   - UI state (showSettingsPanel, fullscreen, mobile detection)

2. Implement persistence for:
   - User settings (localStorage)
   - Starred content (localStorage)
   - Viewed posts (sessionStorage)
   - Selected communities/users (localStorage)

3. Set up React Query:
   - Query client configuration
   - Custom hooks for API calls (usePosts, useCommunities, useUsers)
   - Caching strategies for different data types
   - Background refetching policies

4. Create custom hooks:
   - useAppStore (main store hook)
   - useSlideshow (slideshow-specific state and actions)
   - useContentSelection (community/user selection)
   - useSettings (user preferences)
   - usePersistence (storage management)

5. Implement actions:
   - Slideshow controls (play, pause, next, previous, reset)
   - Content management (addCommunity, removeUser, toggleStar)
   - Settings management (updateInterval, toggleAutoAdvance)
   - State reset and cleanup

**Acceptance Criteria:**
- [ ] Store state persists correctly across browser refreshes
- [ ] All actions update state as expected
- [ ] React Query caching works properly
- [ ] TypeScript inference works for all store slices
- [ ] Settings changes are immediately reflected
- [ ] Session storage tracks viewed content

**Testing:**
Create tests for:
- Store actions and state updates
- Persistence functionality
- React Query hooks
- Custom hook behaviors
- Storage serialization/deserialization

**Files to create:**
- src/stores/app-store.ts
- src/stores/slideshow-store.ts
- src/stores/content-store.ts
- src/stores/settings-store.ts
- src/hooks/use-app-store.ts
- src/hooks/use-slideshow.ts
- src/hooks/use-content-selection.ts
- src/hooks/use-settings.ts
- src/hooks/use-persistence.ts
- src/hooks/use-api-queries.ts
- src/__tests__/stores/app-store.test.ts
- src/__tests__/hooks/use-slideshow.test.ts
```

## Phase 2: Basic Slideshow (Weeks 3-4)

### Step 2.1: Media Type Detection and Handling

**Prompt:**

```
Implement a comprehensive media type detection and handling system for images, videos, and GIFs.

Requirements:
1. Create MediaTypeDetector class:
   - Detect media type from URL and MIME type
   - Support for JPEG, PNG, GIF, WebP, MP4, WebM
   - Handle Pictrs URLs and transformations
   - Validate media URLs and handle malformed URLs

2. Create MediaOptimizer class:
   - Generate responsive image URLs for different screen sizes
   - Optimize images for mobile (Pixel 6 specific optimizations)
   - Handle video thumbnail generation
   - Implement progressive loading strategies

3. Create MediaPreloader class:
   - Preload next 3 images/videos in queue
   - Smart preloading based on connection speed
   - Memory management for cached media
   - Cancel preloading when not needed

4. Handle different media formats:
   - Static images with proper aspect ratio handling
   - Animated GIFs with loop controls
   - Videos with autoplay and muting options
   - Audio handling for videos
   - Fallback handling for unsupported formats

5. Error handling:
   - Graceful fallback for failed media loads
   - Retry mechanism for temporary failures
   - User notification for permanently broken media
   - Skip broken media in slideshow

**Acceptance Criteria:**
- [ ] All supported media formats are correctly identified
- [ ] Media preloading improves slideshow performance
- [ ] Responsive images work on different screen sizes
- [ ] Error handling gracefully manages broken media
- [ ] Memory usage remains reasonable during long sessions
- [ ] Mobile optimizations work on Pixel 6 dimensions

**Testing:**
Create tests for:
- Media type detection with various URLs
- Responsive image URL generation
- Preloading queue management
- Error handling scenarios
- Memory cleanup

**Files to create:**
- src/utils/media-type-detector.ts
- src/utils/media-optimizer.ts
- src/utils/media-preloader.ts
- src/utils/media-cache.ts
- src/constants/media-types.ts
- src/__tests__/utils/media-type-detector.test.ts
- src/__tests__/utils/media-optimizer.test.ts
```

### Step 2.2: Core Slideshow Components

**Prompt:**

```
Create the core slideshow components with proper media display, controls, and mobile responsiveness.

Requirements:
1. SlideshowView component:
   - Full-screen slideshow container
   - Auto-advance with configurable timing
   - Keyboard navigation support
   - Touch gesture support for mobile
   - Attribution overlay display
   - Loading states and error boundaries

2. MediaDisplay component:
   - Universal media renderer (images, videos, GIFs)
   - Proper aspect ratio handling
   - Loading states with skeleton screens
   - Error fallback with retry options
   - Accessibility features (alt text, ARIA labels)

3. SlideshowControls component:
   - Play/pause toggle button
   - Previous/next navigation
   - Progress indicator
   - Timing controls
   - Fullscreen toggle
   - Star/favorite button

4. AttributionOverlay component:
   - Community and user attribution
   - Post title and metadata
   - Clickable links to source
   - Subtle, non-intrusive design
   - Mobile-optimized layout

5. Mobile-specific features:
   - Touch gestures (swipe left/right, tap to play/pause)
   - Responsive design for Pixel 6 (412x915px)
   - Touch-friendly control sizes
   - Optimized for portrait orientation

6. Keyboard shortcuts:
   - Space: Play/pause
   - Arrow keys: Navigation
   - S: Star content
   - F: Fullscreen
   - Numbers 1-9: Set timing intervals

**Acceptance Criteria:**
- [ ] Slideshow displays media in full-screen format
- [ ] Auto-advance works with configurable timing
- [ ] All keyboard shortcuts function correctly
- [ ] Touch gestures work on mobile devices
- [ ] Attribution is clearly visible but not intrusive
- [ ] Loading states provide good user feedback
- [ ] Controls are accessible via keyboard and screen readers

**Testing:**
Create tests for:
- Component rendering with different media types
- Keyboard event handling
- Touch gesture recognition
- Auto-advance timing
- Accessibility compliance
- Mobile responsive behavior

**Files to create:**
- src/components/slideshow/SlideshowView.tsx
- src/components/slideshow/MediaDisplay.tsx
- src/components/slideshow/SlideshowControls.tsx
- src/components/slideshow/AttributionOverlay.tsx
- src/components/slideshow/ProgressIndicator.tsx
- src/components/common/LoadingSkeleton.tsx
- src/components/common/ErrorBoundary.tsx
- src/hooks/use-keyboard-shortcuts.ts
- src/hooks/use-touch-gestures.ts
- src/hooks/use-slideshow-timer.ts
- src/__tests__/components/slideshow/SlideshowView.test.tsx
- src/__tests__/hooks/use-touch-gestures.test.ts
```

### Step 2.3: Video and GIF Player Components

**Prompt:**

```
Implement specialized components for video and GIF playback with proper controls and optimization.

Requirements:
1. VideoPlayer component:
   - Integration with react-player library
   - Autoplay with muted start (for browser compliance)
   - Custom controls overlay
   - Volume controls
   - Play/pause on click
   - Loading states and buffering indicators
   - Error handling for unsupported formats

2. GifPlayer component:
   - Optimized GIF playback
   - Play/pause controls
   - Loop count management
   - Memory optimization for large GIFs
   - Fallback to static image if needed

3. VideoControls component:
   - Play/pause button
   - Volume slider
   - Progress bar with seek functionality
   - Fullscreen toggle
   - Playback speed controls
   - Mute/unmute toggle

4. Media optimization:
   - Adaptive quality based on connection speed
   - Preload strategies for videos
   - Progressive enhancement for slower connections
   - Mobile-specific optimizations

5. Accessibility features:
   - Keyboard controls for video players
   - Screen reader support
   - Closed captions support (if available)
   - Focus management
   - ARIA labels for all controls

**Acceptance Criteria:**
- [ ] Videos autoplay muted and can be unmuted by user
- [ ] GIFs play smoothly without performance issues
- [ ] All video controls are functional
- [ ] Mobile video playback works properly
- [ ] Error handling manages unsupported formats
- [ ] Accessibility features work with screen readers

**Testing:**
Create tests for:
- Video player functionality
- GIF playback controls
- Keyboard navigation
- Error scenarios
- Mobile touch controls
- Accessibility compliance

**Files to create:**
- src/components/media/VideoPlayer.tsx
- src/components/media/GifPlayer.tsx
- src/components/media/VideoControls.tsx
- src/components/media/MediaControls.tsx
- src/hooks/use-video-player.ts
- src/hooks/use-media-controls.ts
- src/utils/media-optimization.ts
- src/__tests__/components/media/VideoPlayer.test.tsx
- src/__tests__/components/media/GifPlayer.test.tsx
```

## Phase 3: Content Management (Weeks 5-6)

### Step 3.1: Community and User Selection Interface

**Prompt:**

```
Build a comprehensive interface for selecting communities and users as content sources.

Requirements:
1. ContentBrowser component:
   - Tabbed interface for communities and users
   - Search functionality with debounced input
   - Infinite scroll for large result sets
   - Selection state management
   - Preview of selected sources

2. CommunitySelector component:
   - Search communities by name
   - Display community information (name, description, subscriber count)
   - Add/remove communities from selection
   - Show selected communities list
   - Community icons and metadata display

3. UserSelector component:
   - Search users by username
   - Display user profiles and post counts
   - Add/remove users from selection
   - Show selected users list
   - User avatars and metadata display

4. ContentPreview component:
   - Preview recent posts from selected sources
   - Media thumbnails
   - Post metadata (title, score, comments)
   - Quick add/remove from slideshow

5. Search functionality:
   - Real-time search with API integration
   - Search result caching
   - Search history
   - Advanced filtering options
   - Empty state handling

6. Selection management:
   - Persistent storage of selections
   - Bulk selection/deselection
   - Import/export selection lists
   - Favorite source management

**Acceptance Criteria:**
- [ ] Search returns relevant communities and users
- [ ] Selection state persists across sessions
- [ ] Interface is responsive on mobile devices
- [ ] Loading states provide good user feedback
- [ ] Search debouncing prevents excessive API calls
- [ ] Selected sources are clearly indicated

**Testing:**
Create tests for:
- Search functionality
- Selection state management
- API integration
- Mobile responsive behavior
- Persistence functionality
- Error handling

**Files to create:**
- src/components/content/ContentBrowser.tsx
- src/components/content/CommunitySelector.tsx
- src/components/content/UserSelector.tsx
- src/components/content/ContentPreview.tsx
- src/components/content/SearchInput.tsx
- src/components/content/SourceList.tsx
- src/hooks/use-content-search.ts
- src/hooks/use-selection-manager.ts
- src/__tests__/components/content/ContentBrowser.test.tsx
- src/__tests__/hooks/use-content-search.test.ts
```

### Step 3.2: Content Deduplication and Queue Management

**Prompt:**

```
Implement a sophisticated content deduplication system and queue management for the slideshow.

Requirements:
1. ContentQueue class:
   - Manage slideshow content queue
   - Implement deduplication based on post ID and URL
   - Support for different queue strategies (chronological, random, score-based)
   - Infinite loading with pagination
   - Memory-efficient queue management

2. DeduplicationManager class:
   - Track viewed content in session storage
   - Implement content fingerprinting for similar posts
   - Handle cross-community duplicate detection
   - Reset functionality for viewed content
   - Cleanup old tracking data

3. QueueStrategies:
   - Hot: Sort by current engagement
   - New: Chronological ordering
   - Top: Sort by score/upvotes
   - Random: Shuffle content
   - Mixed: Balanced combination

4. ContentFilter class:
   - Filter by media type (images, videos, GIFs)
   - NSFW content filtering
   - Minimum score thresholds
   - Date range filtering
   - Community/user specific filters

5. Queue management features:
   - Prefetch next batch when queue is low
   - Remove broken/failed content from queue
   - Priority system for starred content
   - Smart queue replenishment
   - Queue state persistence

6. Performance optimizations:
   - Lazy loading of queue items
   - Efficient memory management
   - Background queue updates
   - Optimistic UI updates

**Acceptance Criteria:**
- [ ] No duplicate content appears in the same session
- [ ] Queue never runs empty during normal usage
- [ ] Filtering works correctly for all criteria
- [ ] Queue strategies produce expected ordering
- [ ] Performance remains good with large queues
- [ ] Reset functionality clears viewed history

**Testing:**
Create tests for:
- Deduplication logic
- Queue management operations
- Filter functionality
- Performance with large datasets
- Memory usage optimization
- Persistence mechanisms

**Files to create:**
- src/utils/content-queue.ts
- src/utils/deduplication-manager.ts
- src/utils/content-filter.ts
- src/utils/queue-strategies.ts
- src/hooks/use-content-queue.ts
- src/hooks/use-deduplication.ts
- src/__tests__/utils/content-queue.test.ts
- src/__tests__/utils/deduplication-manager.test.ts
```

### Step 3.3: Favorites and Starring System

**Prompt:**

```
Create a comprehensive favorites system for saving and managing starred content.

Requirements:
1. StarredContentManager class:
   - Add/remove content from favorites
   - Persistent storage in localStorage
   - Export/import functionality
   - Search within starred content
   - Metadata preservation

2. StarredContentView component:
   - Grid view of starred content
   - Thumbnail previews
   - Sorting options (date added, score, title)
   - Filtering capabilities
   - Bulk management operations

3. StarButton component:
   - Toggle star state
   - Visual feedback for starring
   - Keyboard accessibility
   - Touch-friendly design
   - Animation effects

4. StarredSlideshow component:
   - Slideshow mode for starred content only
   - Same controls as main slideshow
   - Option to remove from favorites during viewing
   - Shuffle starred content

5. Storage and synchronization:
   - Efficient storage format
   - Data migration for updates
   - Backup and restore functionality
   - Storage quota management
   - Cleanup of deleted content

6. Features:
   - Star counter and indicators
   - Recently starred section
   - Categories/tags for organization
   - Share starred collections
   - Statistics and insights

**Acceptance Criteria:**
- [ ] Star button works in all slideshow contexts
- [ ] Starred content persists across browser sessions
- [ ] Starred content view displays all saved items
- [ ] Starred slideshow mode functions properly
- [ ] Storage efficiently manages large collections
- [ ] Bulk operations work correctly

**Testing:**
Create tests for:
- Starring and un-starring functionality
- Persistence mechanisms
- Starred content view
- Storage efficiency
- Data migration
- Error handling

**Files to create:**
- src/utils/starred-content-manager.ts
- src/components/starred/StarredContentView.tsx
- src/components/starred/StarButton.tsx
- src/components/starred/StarredSlideshow.tsx
- src/components/starred/StarredGrid.tsx
- src/hooks/use-starred-content.ts
- src/hooks/use-star-button.ts
- src/__tests__/utils/starred-content-manager.test.ts
- src/__tests__/components/starred/StarredContentView.test.tsx
```

## Phase 4: Advanced Features (Weeks 7-8)

### Step 4.1: Settings and Customization Panel

**Prompt:**

```
Create a comprehensive settings panel with all user customization options.

Requirements:
1. SettingsPanel component:
   - Collapsible panel design
   - Organized sections with clear labels
   - Mobile-responsive layout
   - Save/cancel functionality
   - Reset to defaults option

2. TimingSettings component:
   - Slider for auto-advance timing (5-60 seconds)
   - Quick preset buttons (5s, 10s, 15s, 30s, 60s)
   - Different timing for images vs videos
   - Auto-advance enable/disable toggle
   - Real-time preview of changes

3. ContentFilters component:
   - Media type checkboxes (images, videos, GIFs)
   - NSFW content toggle
   - Minimum score slider
   - Content age filters (hot, new, top)
   - Source-specific filters

4. DisplayOptions component:
   - Theme selection (light, dark, auto)
   - Control visibility settings
   - Attribution display options
   - Fullscreen preferences
   - Mobile-specific settings

5. AccessibilityOptions component:
   - High contrast mode
   - Text size adjustments
   - Motion reduction preferences
   - Screen reader optimizations
   - Keyboard navigation aids

6. KeyboardShortcuts component:
   - Customizable shortcut keys
   - Shortcut help overlay
   - Conflict detection
   - Reset to defaults
   - Export/import shortcuts

**Acceptance Criteria:**
- [ ] All settings are properly saved and restored
- [ ] Changes take effect immediately
- [ ] Settings panel is accessible via keyboard
- [ ] Mobile layout works on all devices
- [ ] Settings validation prevents invalid values
- [ ] Reset functionality works correctly

**Testing:**
Create tests for:
- Settings persistence
- Validation logic
- Mobile responsiveness
- Accessibility features
- Default value handling
- Setting migrations

**Files to create:**
- src/components/settings/SettingsPanel.tsx
- src/components/settings/TimingSettings.tsx
- src/components/settings/ContentFilters.tsx
- src/components/settings/DisplayOptions.tsx
- src/components/settings/AccessibilityOptions.tsx
- src/components/settings/KeyboardShortcuts.tsx
- src/components/settings/SettingsSection.tsx
- src/hooks/use-settings-panel.ts
- src/utils/settings-validator.ts
- src/__tests__/components/settings/SettingsPanel.test.tsx
```

### Step 4.2: Keyboard Navigation and Accessibility

**Prompt:**

```
Implement comprehensive keyboard navigation and accessibility features throughout the application.

Requirements:
1. KeyboardManager class:
   - Global keyboard event handling
   - Customizable key bindings
   - Context-aware shortcuts
   - Conflict resolution
   - Help system integration

2. Accessibility features:
   - Full keyboard navigation for all components
   - Focus management and visual indicators
   - Screen reader support with ARIA labels
   - High contrast mode support
   - Reduced motion preferences

3. Keyboard shortcuts:
   - Space: Play/pause slideshow
   - Arrow Left/Right: Navigate slides
   - Arrow Up/Down: Volume control
   - S: Star current content
   - F: Toggle fullscreen
   - Escape: Exit fullscreen/close panels
   - H: Show help overlay
   - Numbers 1-9: Set timing presets

4. Focus management:
   - Logical tab order
   - Focus trapping in modals
   - Skip links for navigation
   - Focus restoration after dialogs
   - Visual focus indicators

5. Screen reader support:
   - Meaningful ARIA labels
   - Live regions for status updates
   - Role attributes for custom components
   - Alt text for images
   - Description of slideshow state

6. Help system:
   - Keyboard shortcut overlay
   - Context-sensitive help
   - Voice-over friendly instructions
   - Tooltip explanations
   - Documentation links

**Acceptance Criteria:**
- [ ] All functionality is accessible via keyboard
- [ ] Screen readers can navigate the entire app
- [ ] Focus management works correctly
- [ ] WCAG 2.1 AA compliance is achieved
- [ ] High contrast mode improves visibility
- [ ] Help system provides clear guidance

**Testing:**
Create tests for:
- Keyboard navigation flows
- ARIA attribute presence
- Focus management
- Screen reader compatibility
- Accessibility compliance
- High contrast mode

**Files to create:**
- src/utils/keyboard-manager.ts
- src/hooks/use-keyboard-navigation.ts
- src/hooks/use-accessibility.ts
- src/hooks/use-focus-management.ts
- src/components/common/HelpOverlay.tsx
- src/components/common/SkipLink.tsx
- src/components/common/FocusTrap.tsx
- src/utils/accessibility-utils.ts
- src/__tests__/utils/keyboard-manager.test.ts
- src/__tests__/accessibility/navigation.test.ts
```

### Step 4.3: Performance Optimization and Caching

**Prompt:**

```
Implement comprehensive performance optimization strategies including caching, lazy loading, and memory management.

Requirements:
1. CacheManager class:
   - Multi-level caching strategy
   - Memory cache for frequently accessed data
   - IndexedDB for persistent storage
   - Cache invalidation policies
   - Storage quota management

2. ImagePreloader enhancement:
   - Adaptive preloading based on connection speed
   - Progressive image loading
   - WebP format detection and optimization
   - Responsive image generation
   - Background preloading queue

3. LazyLoading implementation:
   - Route-based code splitting
   - Component lazy loading
   - Image lazy loading with intersection observer
   - Virtual scrolling for large lists
   - Progressive enhancement

4. Memory management:
   - Automatic cleanup of unused resources
   - Memory usage monitoring
   - Large media file handling
   - Cache size limits
   - Garbage collection optimization

5. Bundle optimization:
   - Tree shaking unused code
   - Dynamic imports for heavy libraries
   - Asset optimization (images, fonts)
   - Compression and minification
   - Service worker implementation

6. Performance monitoring:
   - Core Web Vitals tracking
   - Custom performance metrics
   - Error boundary reporting
   - User experience analytics
   - Performance budgets

**Acceptance Criteria:**
- [ ] Initial page load under 3 seconds
- [ ] Media loading under 2 seconds
- [ ] Memory usage remains stable during long sessions
- [ ] Bundle size is optimized
- [ ] Core Web Vitals meet "Good" thresholds
- [ ] Offline functionality works

**Testing:**
Create tests for:
- Cache functionality
- Performance metrics
- Memory usage
- Loading speeds
- Offline capabilities
- Bundle analysis

**Files to create:**
- src/utils/cache-manager.ts
- src/utils/performance-monitor.ts
- src/utils/memory-manager.ts
- src/utils/lazy-loading.ts
- src/hooks/use-performance.ts
- src/hooks/use-intersection-observer.ts
- src/workers/cache-worker.ts
- src/__tests__/utils/cache-manager.test.ts
- src/__tests__/performance/core-vitals.test.ts
```

## Phase 5: Polish and Testing (Weeks 9-10)

### Step 5.1: Comprehensive Error Handling and Edge Cases

**Prompt:**

```
Implement robust error handling and edge case management throughout the application.

Requirements:
1. ErrorBoundary components:
   - Global error boundary for app-level errors
   - Component-specific error boundaries
   - Fallback UI components
   - Error reporting integration
   - Recovery mechanisms

2. Network error handling:
   - Connection loss detection
   - Retry strategies with exponential backoff
   - Offline mode functionality
   - Error notifications
   - Graceful degradation

3. Media error handling:
   - Broken image/video detection
   - Automatic fallback mechanisms
   - Skip corrupted content
   - User notification system
   - Alternative content suggestions

4. API error handling:
   - Rate limiting responses
   - Server error recovery
   - Authentication failures
   - Invalid response handling
   - API versioning conflicts

5. Edge cases:
   - Empty content scenarios
   - Very large content sets
   - Slow network conditions
   - Browser compatibility issues
   - Storage quota exceeded

6. User experience improvements:
   - Informative error messages
   - Recovery action suggestions
   - Error state illustrations
   - Progress indicators during recovery
   - Support contact information

**Acceptance Criteria:**
- [ ] App doesn't crash on any error scenario
- [ ] Users receive helpful error messages
- [ ] Automatic recovery works when possible
- [ ] Offline mode provides basic functionality
- [ ] Error reporting captures useful information
- [ ] Edge cases are handled gracefully

**Testing:**
Create tests for:
- Error boundary functionality
- Network failure scenarios
- Corrupted media handling
- Empty state handling
- Recovery mechanisms
- Browser compatibility

**Files to create:**
- src/components/common/GlobalErrorBoundary.tsx
- src/components/common/ErrorFallback.tsx
- src/components/common/OfflineNotice.tsx
- src/utils/error-handler.ts
- src/utils/network-monitor.ts
- src/hooks/use-error-recovery.ts
- src/hooks/use-offline-mode.ts
- src/__tests__/components/common/ErrorBoundary.test.tsx
- src/__tests__/utils/error-handler.test.ts
```

### Step 5.2: Comprehensive Testing Suite

**Prompt:**

```
Create a complete testing suite covering unit tests, integration tests, and end-to-end tests.

Requirements:
1. Unit tests (Vitest):
   - All utility functions (90% coverage)
   - Custom hooks testing
   - Component logic testing
   - State management testing
   - API client testing

2. Integration tests:
   - Component interaction testing
   - API integration testing
   - State persistence testing
   - User workflow testing
   - Performance testing

3. End-to-end tests (Playwright):
   - Complete user journeys
   - Cross-browser testing
   - Mobile device testing
   - Accessibility testing
   - Performance testing

4. Test scenarios:
   - Happy path: Complete slideshow workflow
   - Error scenarios: Network failures, broken media
   - Edge cases: Empty content, large datasets
   - Accessibility: Keyboard navigation, screen readers
   - Performance: Loading times, memory usage

5. Test utilities:
   - Mock API responses
   - Test data generators
   - Component render helpers
   - Accessibility testing helpers
   - Performance measurement tools

6. Continuous testing:
   - GitHub Actions setup
   - Automated test execution
   - Coverage reporting
   - Performance regression detection
   - Visual regression testing

**Acceptance Criteria:**
- [ ] Unit test coverage above 90%
- [ ] Integration test coverage above 80%
- [ ] All critical user flows covered by E2E tests
- [ ] Cross-browser compatibility verified
- [ ] Accessibility compliance tested
- [ ] Performance thresholds validated

**Testing:**
Create test files for:
- All components and utilities
- User interaction flows
- API integration scenarios
- Error handling paths
- Performance benchmarks
- Accessibility compliance

**Files to create:**
- src/__tests__/setup.ts
- src/__tests__/utils/test-helpers.ts
- src/__tests__/utils/mock-api.ts
- src/__tests__/components/ (all component tests)
- src/__tests__/hooks/ (all hook tests)
- src/__tests__/integration/ (integration tests)
- e2e/slideshow.spec.ts
- e2e/content-selection.spec.ts
- e2e/settings.spec.ts
- e2e/accessibility.spec.ts
- e2e/mobile.spec.ts
- vitest.config.ts
- playwright.config.ts
```

### Step 5.3: Performance and Accessibility Audit

**Prompt:**

```
Conduct comprehensive performance and accessibility audits and implement optimizations.

Requirements:
1. Lighthouse audit:
   - Performance score > 90
   - Accessibility score > 95
   - Best Practices score > 90
   - SEO score > 90
   - Progressive Web App features

2. Core Web Vitals optimization:
   - Largest Contentful Paint (LCP) < 2.5s
   - First Input Delay (FID) < 100ms
   - Cumulative Layout Shift (CLS) < 0.1
   - First Contentful Paint (FCP) < 1.8s

3. Accessibility audit (WCAG 2.1 AA):
   - Keyboard navigation testing
   - Screen reader compatibility
   - Color contrast validation
   - Focus management verification
   - ARIA attribute validation

4. Performance optimizations:
   - Bundle size optimization
   - Image compression and optimization
   - Code splitting refinement
   - Caching strategy optimization
   - Memory usage optimization

5. Browser compatibility:
   - Chrome (latest 2 versions)
   - Firefox (latest 2 versions)
   - Safari (latest 2 versions)
   - Edge (latest 2 versions)
   - Mobile browsers (iOS Safari, Chrome Mobile)

6. Mobile performance:
   - Touch response optimization
   - Viewport configuration
   - Mobile-specific optimizations
   - Battery usage considerations
   - Data usage optimization

**Acceptance Criteria:**
- [ ] Lighthouse scores meet target thresholds
- [ ] WCAG 2.1 AA compliance achieved
- [ ] Cross-browser functionality verified
- [ ] Mobile performance optimized
- [ ] Core Web Vitals in "Good" range
- [ ] Accessibility testing passes

**Testing:**
Create audit reports for:
- Lighthouse performance analysis
- Accessibility compliance testing
- Cross-browser compatibility
- Mobile device testing
- Core Web Vitals measurement
- Bundle size analysis

**Files to create:**
- scripts/performance-audit.js
- scripts/accessibility-audit.js
- scripts/lighthouse-ci.js
- docs/performance-report.md
- docs/accessibility-report.md
- docs/browser-compatibility.md
- .lighthouserc.js
- performance-budget.json
```

## Phase 6: Deployment and Documentation (Week 11)

### Step 6.1: Production Build and Deployment Setup

**Prompt:**

```
Set up production build configuration and deployment infrastructure.

Requirements:
1. Production build optimization:
   - Environment-specific configurations
   - Asset optimization and compression
   - Service worker implementation
   - Progressive Web App setup
   - Security headers configuration

2. Deployment configurations:
   - Vercel deployment setup
   - Netlify deployment setup
   - GitHub Pages deployment
   - Docker containerization
   - Environment variable management

3. CI/CD pipeline:
   - GitHub Actions workflow
   - Automated testing on PR
   - Build and deployment automation
   - Performance regression testing
   - Security scanning

4. Monitoring and analytics:
   - Error tracking (Sentry)
   - Performance monitoring
   - User analytics (optional)
   - Uptime monitoring
   - Core Web Vitals tracking

5. Security configuration:
   - Content Security Policy
   - HTTPS enforcement
   - XSS protection
   - CSRF protection
   - Dependency vulnerability scanning

6. Infrastructure as Code:
   - Deployment scripts
   - Environment provisioning
   - Database setup (if needed)
   - CDN configuration
   - SSL certificate setup

**Acceptance Criteria:**
- [ ] Production build generates optimized assets
- [ ] Deployment pipeline works automatically
- [ ] Security headers are properly configured
- [ ] Monitoring captures key metrics
- [ ] PWA features function correctly
- [ ] Performance meets production standards

**Testing:**
Create deployment tests for:
- Build process validation
- Deployment success verification
- Production environment testing
- Security configuration testing
- Performance monitoring validation
- Error tracking functionality

**Files to create:**
- vite.config.prod.ts
- Dockerfile
- .github/workflows/deploy.yml
- .github/workflows/test.yml
- vercel.json
- netlify.toml
- public/manifest.json
- public/sw.js
- scripts/build.sh
- scripts/deploy.sh
- security-headers.json
```

### Step 6.2: User Documentation and Guides

**Prompt:**

```
Create comprehensive user documentation and guides for the application.

Requirements:
1. User Guide:
   - Getting started tutorial
   - Feature walkthrough with screenshots
   - Troubleshooting common issues
   - Tips and best practices
   - FAQ section

2. Feature documentation:
   - Slideshow controls explanation
   - Content selection guide
   - Settings and customization
   - Keyboard shortcuts reference
   - Mobile usage guide

3. Technical documentation:
   - Installation instructions
   - Configuration options
   - API documentation
   - Browser requirements
   - Performance guidelines

4. Accessibility documentation:
   - Screen reader usage guide
   - Keyboard navigation help
   - Accessibility features overview
   - Customization for disabilities
   - Support resources

5. Video tutorials:
   - Quick start video
   - Feature demonstration videos
   - Accessibility usage videos
   - Mobile app tour
   - Advanced features walkthrough

6. Help system integration:
   - In-app help tooltips
   - Context-sensitive help
   - Interactive tutorials
   - Onboarding flow
   - Support contact information

**Acceptance Criteria:**
- [ ] Documentation covers all features
- [ ] Screenshots are current and accurate
- [ ] Accessibility guide is comprehensive
- [ ] Video tutorials are clear and helpful
- [ ] In-app help is contextually relevant
- [ ] Troubleshooting guide addresses common issues

**Testing:**
Create documentation tests for:
- Link validation
- Screenshot accuracy
- Video accessibility
- Content completeness
- Translation accuracy (if applicable)
- Mobile documentation usability

**Files to create:**
- docs/user-guide.md
- docs/getting-started.md
- docs/features/slideshow.md
- docs/features/content-selection.md
- docs/features/settings.md
- docs/accessibility-guide.md
- docs/troubleshooting.md
- docs/keyboard-shortcuts.md
- docs/mobile-guide.md
- docs/faq.md
- docs/videos/ (video files)
- src/components/help/HelpSystem.tsx
- src/components/help/OnboardingTour.tsx
```

### Step 6.3: Developer Documentation and API Reference

**Prompt:**

```
Create comprehensive developer documentation for future maintenance and contributions.

Requirements:
1. Architecture documentation:
   - System architecture overview
   - Component hierarchy diagrams
   - Data flow documentation
   - State management patterns
   - API integration patterns

2. API documentation:
   - Lemmy API integration guide
   - Rate limiting implementation
   - Error handling strategies
   - Authentication patterns
   - Data transformation logic

3. Component documentation:
   - Storybook setup and stories
   - Component API reference
   - Props documentation
   - Usage examples
   - Styling guidelines

4. Development setup:
   - Local development guide
   - Environment setup
   - Testing procedures
   - Build process documentation
   - Deployment procedures

5. Contributing guidelines:
   - Code style guidelines
   - Pull request process
   - Testing requirements
   - Documentation standards
   - Issue reporting templates

6. Maintenance documentation:
   - Performance monitoring
   - Security update procedures
   - Dependency management
   - Bug fixing workflows
   - Feature development process

**Acceptance Criteria:**
- [ ] Architecture is clearly documented
- [ ] All components have Storybook stories
- [ ] API integration is well documented
- [ ] Development setup is straightforward
- [ ] Contributing guidelines are clear
- [ ] Maintenance procedures are documented

**Testing:**
Create development tests for:
- Documentation accuracy
- Code example validity
- Storybook functionality
- Setup procedure verification
- Contributing workflow testing
- Maintenance procedure validation

**Files to create:**
- docs/architecture.md
- docs/api-reference.md
- docs/development-setup.md
- docs/contributing.md
- docs/maintenance.md
- docs/code-style.md
- .storybook/main.js
- .storybook/preview.js
- stories/ (component stories)
- .github/CONTRIBUTING.md
- .github/ISSUE_TEMPLATE/
- .github/PULL_REQUEST_TEMPLATE.md
- README.md (comprehensive)
```

## Final Validation and Completeness Check

### Step 7.1: Acceptance Criteria Validation

**Prompt:**

```
Conduct a comprehensive validation of all acceptance criteria from the PRD to ensure complete implementation.

Requirements:
1. User Story validation:
   - US-001: Basic Slideshow Experience
     ✓ Media displays in full-screen slideshow format
     ✓ Slideshow automatically progresses to next media item
     ✓ Images display properly with appropriate scaling
     ✓ Videos and GIFs play automatically with proper controls
     ✓ Community and user attribution is clearly visible
     ✓ Navigation controls (previous/next, pause/play) are available

   - US-002: Community Content Selection
     ✓ Can browse available communities
     ✓ Can search for communities by name
     ✓ Can select multiple communities for a single slideshow
     ✓ Selected communities are saved for future sessions
     ✓ Can remove communities from selection

   - US-003: User Content Selection
     ✓ Can search for users by username
     ✓ Can select multiple users for a single slideshow
     ✓ Selected users are saved for future sessions
     ✓ Can remove users from selection
     ✓ Can combine user and community selections

   - US-004: Content Attribution and Interaction
     ✓ Community name is displayed for each media item
     ✓ Username of the poster is displayed for each media item
     ✓ Clicking community name adds it to known communities list
     ✓ Clicking username adds user to known users list
     ✓ Attribution is clearly visible but not intrusive

   - US-005: Slideshow Timing Configuration
     ✓ Can set display duration from 5-60 seconds
     ✓ Duration adjustable in 5-second increments
     ✓ Settings persist between sessions
     ✓ Changes take effect immediately
     ✓ Different timing for images vs videos (videos play full duration)

   - US-006: Content Deduplication
     ✓ Each media item shown only once per session
     ✓ Viewed content tracking persists during session
     ✓ Option to reset viewed content history
     ✓ Clear indication when no new content is available

   - US-007: Favorite Content Management
     ✓ "Star" button available during slideshow
     ✓ Starred content saved persistently
     ✓ Option to view slideshow of only starred content
     ✓ Can remove items from starred collection
     ✓ Starred content counter/indicator

   - US-008: Content Filtering
     ✓ Filter by media type (images, videos, GIFs)
     ✓ NSFW content filtering option
     ✓ Content age filtering (new, hot, top)
     ✓ Minimum score filtering

   - US-009: Slideshow Controls
     ✓ Pause/resume slideshow functionality
     ✓ Skip to next/previous media
     ✓ Keyboard shortcuts for controls
     ✓ Touch/swipe gestures for mobile

   - US-010: Session Persistence
     ✓ Save current position in content queue
     ✓ Restore slideshow state on app reload
     ✓ Maintain user preferences
     ✓ Preserve starred content across sessions

2. Technical Requirements validation:
   - Lemmy API Integration:
     ✓ Use Lemmy REST API v3 endpoints
     ✓ Primary endpoint GET /post/list with filters
     ✓ Support for sorting options (Hot, New, Top)
     ✓ Handle pagination for continuous content loading
     ✓ Implement proper rate limiting and error handling

   - Media Handling:
     ✓ Support for image formats: JPEG, PNG, GIF, WebP
     ✓ Support for video formats: MP4, WebM
     ✓ Integration with Lemmy's Pictrs image service
     ✓ Responsive image loading and optimization
     ✓ Proper video player controls and autoplay

   - Data Storage:
     ✓ Local storage for user preferences and settings
     ✓ Session storage for viewed content tracking
     ✓ Persistent storage for starred content and favorite communities/users
     ✓ Efficient data structures for content queues

   - Performance Requirements:
     ✓ Fast media loading and caching
     ✓ Smooth transitions between media items
     ✓ Minimal memory usage for long sessions
     ✓ Efficient handling of large content sets
     ✓ Page load times under 3 seconds
     ✓ Media loading times under 2 seconds

   - User Interface Requirements:
     ✓ Full-screen slideshow view as primary interface
     ✓ Overlay controls that don't interfere with content
     ✓ Settings panel accessible via menu
     ✓ Mobile-responsive design (especially Pixel 6)
     ✓ Clean, minimal interface focusing on content
     ✓ Smooth animations and transitions

3. Accessibility compliance:
   - WCAG 2.1 AA Compliance:
     ✓ Keyboard navigation support for all functionality
     ✓ Screen reader compatibility with proper ARIA labels
     ✓ High contrast mode support
     ✓ Configurable text sizes
     ✓ Focus management and visual indicators
     ✓ Alternative text for images
     ✓ Color contrast ratios meet standards
     ✓ No content that flashes more than 3 times per second
     ✓ Meaningful heading structure
     ✓ Skip links for main content navigation

4. Create comprehensive test plan:
   - Manual testing checklist
   - Automated test coverage report
   - Performance benchmark results
   - Accessibility audit results
   - Cross-browser compatibility matrix

5. Quality assurance checklist:
   - Code quality metrics
   - Security vulnerability scan
   - Performance optimization verification
   - Documentation completeness check
   - Deployment readiness assessment

**Acceptance Criteria:**
- [ ] All user stories meet their acceptance criteria
- [ ] Technical requirements are fully implemented
- [ ] Performance targets are achieved
- [ ] Accessibility standards are met
- [ ] Quality gates are satisfied

**Testing:**
Create validation reports for:
- Feature completeness matrix
- Performance test results
- Accessibility compliance report
- Security audit results
- Cross-browser compatibility results

**Files to create:**
- docs/validation/acceptance-criteria-matrix.md
- docs/validation/performance-report.md
- docs/validation/accessibility-audit.md
- docs/validation/security-audit.md
- docs/validation/quality-checklist.md
- scripts/validation-suite.js

### Additional Core Features Verification

Ensure these key features from the PRD are implemented:

1. **Media Slideshow Core Features:**
   ✓ Display images, videos, and GIFs from Lemmy posts
   ✓ Automatic slideshow progression with configurable timing
   ✓ Support for common media formats (JPEG, PNG, GIF, MP4, WebM)
   ✓ Proper video and GIF playback with audio support
   ✓ Responsive design for various screen sizes
   ✓ Works on both desktop and mobile devices (especially Pixel 6)

2. **Content Source Selection:**
   ✓ Select specific Lemmy communities as content sources
   ✓ Select specific Lemmy users as content sources
   ✓ Combine multiple communities and users in a single slideshow
   ✓ Browse and search for communities and users

3. **Content Management:**
   ✓ Track viewed media to prevent duplicates in the same session
   ✓ "Star" functionality to save favorite media for later viewing
   ✓ Option to view only starred content
   ✓ Clear viewed content history

4. **User Configuration:**
   ✓ Configurable slideshow timing (5-60 seconds in 5-second intervals)
   ✓ Save and manage favorite communities and users
   ✓ Content filtering options (NSFW, content types)

5. **Mobile and Accessibility Features:**
   ✓ Touch/swipe gestures for mobile navigation
   ✓ Keyboard shortcuts for all controls
   ✓ Screen reader support
   ✓ High contrast mode
   ✓ Focus management
```

### Step 7.2: Production Readiness Checklist

**Prompt:**

```
Create and execute a comprehensive production readiness checklist to ensure the application is ready for deployment.

Requirements:
1. Technical readiness:
   - [ ] All core features implemented and tested
   - [ ] Performance benchmarks meet requirements
   - [ ] Security vulnerabilities addressed
   - [ ] Cross-browser compatibility verified
   - [ ] Mobile responsiveness confirmed
   - [ ] Accessibility compliance achieved

2. Quality assurance:
   - [ ] Code coverage meets minimum thresholds
   - [ ] End-to-end tests pass consistently
   - [ ] Error handling covers edge cases
   - [ ] User experience flows validated
   - [ ] Performance under load tested

3. Documentation completeness:
   - [ ] User documentation available
   - [ ] Developer documentation complete
   - [ ] API documentation accurate
   - [ ] Deployment procedures documented
   - [ ] Maintenance guides available

4. Deployment readiness:
   - [ ] Production build configuration tested
   - [ ] Environment variables configured
   - [ ] Monitoring and logging set up
   - [ ] SSL certificates configured
   - [ ] CDN and caching configured

5. Legal and compliance:
   - [ ] Privacy policy created (if needed)
   - [ ] Terms of service defined (if needed)
   - [ ] Content licensing verified
   - [ ] GDPR compliance addressed (if applicable)
   - [ ] Accessibility compliance documented

6. Launch preparation:
   - [ ] Support procedures established
   - [ ] Issue tracking configured
   - [ ] Update procedures documented
   - [ ] Rollback procedures tested
   - [ ] Post-launch monitoring plan

**Acceptance Criteria:**
- [ ] All checklist items are completed
- [ ] Production deployment is successful
- [ ] Application performs as expected in production
- [ ] Monitoring captures key metrics
- [ ] Support procedures are functional

**Testing:**
Execute final validation tests:
- Production environment testing
- Load testing under realistic conditions
- Security penetration testing
- Accessibility compliance verification
- User acceptance testing
- Performance monitoring validation

**Files to create:**
- docs/production-readiness-checklist.md
- docs/launch-plan.md
- docs/support-procedures.md
- docs/rollback-procedures.md
- docs/post-launch-monitoring.md
- scripts/production-validation.js
```

## Summary

This comprehensive implementation guide provides detailed prompts for building the Lemmy Media Slideshow application across 6 phases with 18 major steps. Each prompt includes:

- Specific technical requirements
- Clear acceptance criteria
- Testing strategies
- File structure guidance
- Validation procedures

The prompts are designed to be used sequentially, with each building upon the previous work. The final phases include comprehensive testing, documentation, and production readiness validation to ensure a high-quality, accessible, and performant application that meets all requirements outlined in the PRD and technical specification.

**Key Features Covered:**

- Full-screen media slideshow with auto-advance
- Community and user content selection
- Content deduplication and queue management
- Favorites/starring system
- Comprehensive settings and customization
- Keyboard navigation and accessibility
- Performance optimization and caching
- Error handling and edge cases
- Complete testing suite
- Production deployment and documentation

**Quality Assurance:**

- 90%+ unit test coverage
- 80%+ integration test coverage
- WCAG 2.1 AA accessibility compliance
- Cross-browser compatibility
- Mobile responsiveness (Pixel 6 optimized)
- Performance targets (3s page load, 2s media load)
- Comprehensive documentation
- Production readiness validation
