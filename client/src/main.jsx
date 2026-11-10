import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './context/App';
import App from './App';
import ErrorBoundary, { reloadOnce } from './components/ErrorBoundary';

// Vite fires this when a lazy page's file is gone after a new release.
window.addEventListener('vite:preloadError', e => { if (reloadOnce()) e.preventDefault() });
import './styles.css';
import './home.css';
import './boutique.css';
import './nav.css';
import './mahana.css';
import './night.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ErrorBoundary><AppProvider><App /></AppProvider></ErrorBoundary>
    </BrowserRouter>
  </StrictMode>
);
