import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { useAppStore } from './stores/app-store';

// Make app store available globally for development/testing
if (import.meta.env.DEV) {
  // @ts-ignore
  window.useAppStore = useAppStore;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
