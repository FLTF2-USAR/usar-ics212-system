const CACHE_NAME = 'usar-ics212-v3-coordinates-fix';
const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
  '/#/ics212',
  '/data/rescue_checklist.json',
  '/data/engine_checklist.json',
  '/data/ladder1_checklist.json',
  '/data/ladder3_checklist.json',
  '/data/rope_checklist.json'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Install event - caching app shell and all checklists');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching:', urlsToCache.length, 'resources');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // NETWORK-ONLY for API calls - NEVER cache these
  if (url.pathname.includes('/api/') || url.hostname.includes('workers.dev')) {
    event.respondWith(
      fetch(event.request).catch(err => {
        console.error('[SW] API request failed:', err);
        return new Response(JSON.stringify({ error: 'Network error', message: err.message }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
       })
    );
    return;
  }
  
  // Network-first for HTML navigation requests (fixes blank page bug)
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone response BEFORE using it
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            }).catch(err => {
              console.warn('[SW] Could not cache response:', err.message);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline: serve from cache first, then offline page as fallback
          return caches.match(event.request)
            .then(response => {
              return response || caches.match('/offline.html');
            });
        })
    );
    return;
  }
  
  // Network-first for ALL checklist JSON files (always get latest when online)
  if (url.pathname.includes('_checklist.json')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone response BEFORE using it
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            }).catch(err => {
              console.warn('[SW] Could not cache checklist:', err.message);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline: serve cached version
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Cache-first for other resources (JS, CSS, images)
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});