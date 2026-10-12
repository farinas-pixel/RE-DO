/**
 * Application entry point — mounts React to the DOM.
 *
 * This is the first file that runs. It:
 * 1. Imports global styles
 * 2. Creates the React root
 * 3. Renders the App component
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(
    'Root element not found. Make sure there is a <div id="root"></div> in index.html'
  );
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
