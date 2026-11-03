import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './context/App';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
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
