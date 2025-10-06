# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react)
  uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc)
  uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable
type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install
[eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x)
and
[eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom)
for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x';
import reactDom from 'eslint-plugin-react-dom';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

## Slideshow Infinite Loading

The slideshow now supports incremental ("infinite") loading of media:

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
