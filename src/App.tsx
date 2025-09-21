import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryProvider } from '@components/providers/QueryProvider';
import { useAppStore } from '@stores/app-store';
import SlideshowView from './components/slideshow/SlideshowView';
import './index.css';

// Lazy load components for code splitting
const ContentBrowser = lazy(
  () => import('./components/content/ContentBrowser')
);
const ContentFilters = lazy(
  () => import('./components/content/ContentFilters')
);
const SettingsPanel = lazy(() => import('./components/settings/SettingsPanel'));
const StarredContentView = lazy(
  () => import('./components/starred/StarredContentView')
);
const VirtualizedContentBrowser = lazy(
  () => import('./components/content/VirtualizedContentBrowser')
);

// Loading component for lazy-loaded routes
const LoadingSpinner = () => (
  <div className='min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center'>
    <div className='text-center'>
      <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
      <p className='text-gray-600 dark:text-gray-400'>Loading...</p>
    </div>
  </div>
);

function AppContent() {
  const { rehydrate, setMobile } = useAppStore();

  useEffect(() => {
    // Initialize the app store
    rehydrate();

    // Set up mobile detection
    const handleResize = () => {
      setMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [rehydrate, setMobile]);

  return (
    <Router>
      <div className='app min-h-screen bg-background text-foreground'>
        <Routes>
          <Route path='/' element={<SlideshowView />} />
          <Route
            path='/content'
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <ContentBrowser />
              </Suspense>
            }
          />
          <Route
            path='/content-filters'
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <ContentFilters />
              </Suspense>
            }
          />
          <Route
            path='/content-virtual'
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <VirtualizedContentBrowser posts={[]} />
              </Suspense>
            }
          />
          <Route
            path='/starred'
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <StarredContentView />
              </Suspense>
            }
          />
          <Route
            path='/settings'
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <SettingsPanel />
              </Suspense>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <QueryProvider>
      <AppContent />
    </QueryProvider>
  );
}

export default App;
