import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// CRITICAL: Unregister all service workers and clear caches
// This prevents stale cached content from interfering with the app
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(reg => {
      console.log('🛑 [Main] Unregistering Service Worker:', reg.scope);
      reg.unregister();
    });
  });
  
  // Clear all caches
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        console.log('🗑️ [Main] Deleting cache:', name);
        caches.delete(name);
      });
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
