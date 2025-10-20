# Lenscape

Lenscape is an immersive Lemmy media slideshow built with React, TypeScript, and Vite. It focuses on
lean media playback, gesture support, and infinite scrolling for community content.

## Requirements

- Node.js 18 or newer (developed against Node 20)
- npm 9 or newer (bundled with Node installations)

## Run Locally

1. Clone the repository and move into the project folder:
   ```bash
   git clone https://github.com/thecodinglynx/lemmy-client.git
   cd lemmy-client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open the printed URL (defaults to `http://localhost:5173`). The dev server exposes two helpful
   proxies:
   - `/api/lemmy` forwards API calls to whichever instance you configure inside the Settings panel.
   - `/api/media` wraps remote media to avoid CORS and content-type surprises.
5. In the UI, open **Settings → Server** to pick your Lemmy instance. The default is
   `https://lemmy.world`, and you can toggle the local proxy if the instance blocks cross-origin
   requests.

## Useful npm Scripts

- `npm run build` – type-check and bundle the app for production.
- `npm run preview` – serve the production build locally.
- `npm run test` – run the Vitest unit test suite.
- `npm run lint` – run ESLint with the project rules.

## Slideshow Infinite Loading

The slideshow supports incremental ("infinite") loading of media:

- Initial batches of posts are fetched via `useBatchPosts` using Lemmy pagination cursors.
- As the viewer approaches the end of the currently loaded posts (within 3 items of the end), an
  additional batch is fetched automatically by the `useLoadMorePosts` hook.
- Pagination uses Lemmy's `page_cursor` (`nextCursor` in the client) for either the global feed or
  each selected community. Cursors are stored per community (and a global cursor) in the app store.
- New posts are de-duplicated by ID before being appended to the slideshow list.
- The store tracks `hasMore`; when an API response returns no `nextCursor` for all relevant sources,
  `hasMore` becomes `false` and further automatic loads stop.
- A loading guard prevents concurrent fetches.

Configuration / thresholds:

- Near-end threshold is currently hard-coded to 3 remaining items in `SlideshowView`.
- Batch sizes: 40 for the global feed, 20 per community (matching existing logic).

Key code locations:

- `src/hooks/useContent.ts`: `useBatchPosts` (initial load) and `useLoadMorePosts` (incremental
  loads)
- `src/stores/app-store.ts`: pagination cursors, `hasMore`, and `setHasMore` action
- `src/components/slideshow/SlideshowView.tsx`: effect that triggers incremental loading

Future improvements (optional):

- Expose the near-end threshold via a user setting.
- Surface a subtle UI indicator when new media is being fetched.
- Add robust tests wrapping the slideshow in a `QueryClientProvider` to simulate progressing through
  content.
