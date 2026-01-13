// ⚠️ SELF-DESTRUCTING SERVICE WORKER ⚠️
// Version: KILL_SWITCH_v1
// Purpose: Break zombie cache loop by forcing unregistration and hard reload

console.log('🔥 [SW KILL_SWITCH_v1] Self-destruct worker loaded');

self.addEventListener('install', function(e) {
  console.log('🔥 [SW KILL_SWITCH_v1] Installing - forcing immediate activation');
  self.skipWaiting(); // Force activation immediately without waiting
});

self.addEventListener('activate', function(e) {
  console.log('🔥 [SW KILL_SWITCH_v1] Activated - executing self-destruct sequence');
  
  e.waitUntil(
    // Step 1: Clear ALL caches
    caches.keys().then(function(cacheNames) {
      console.log('🗑️ [SW KILL_SWITCH_v1] Deleting', cacheNames.length, 'caches');
      return Promise.all(
        cacheNames.map(function(cacheName) {
          console.log('🗑️ [SW KILL_SWITCH_v1] Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(function() {
      // Step 2: Unregister this worker
      console.log('💣 [SW KILL_SWITCH_v1] Unregistering self');
      return self.registration.unregister();
    }).then(function() {
      // Step 3: Get all open tabs/windows
      return self.clients.matchAll({ type: 'window' });
    }).then(function(clients) {
      // Step 4: Force hard reload on all tabs (bypasses cache)
      console.log('🔄 [SW KILL_SWITCH_v1] Forcing hard reload on', clients.length, 'clients');
      clients.forEach(function(client) {
        console.log('🔄 [SW KILL_SWITCH_v1] Reloading client:', client.url);
        client.navigate(client.url);
      });
    }).catch(function(error) {
      console.error('❌ [SW KILL_SWITCH_v1] Error during self-destruct:', error);
    })
  );
});

// Block ALL fetch requests - force network
self.addEventListener('fetch', function(e) {
  console.log('🚫 [SW KILL_SWITCH_v1] Blocking cached response, forcing network for:', e.request.url);
  // Do NOT respond with cache - let request go to network
  return;
});