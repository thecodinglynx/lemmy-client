import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryProvider } from '@components/providers/QueryProvider';
import { useAppStore } from '@stores/app-store';
import SlideshowView from './components/slideshow/SlideshowView';
import ContentBrowser from './components/content/ContentBrowser';
import SettingsPanel from './components/settings/SettingsPanel';
import StarredContentView from './components/starred/StarredContentView';
import './index.css';

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
          <Route path='/content' element={<ContentBrowser />} />
          <Route path='/starred' element={<StarredContentView />} />
          <Route path='/settings' element={<SettingsPanel />} />
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
