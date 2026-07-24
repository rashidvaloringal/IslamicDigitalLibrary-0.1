// ================================================================
// Islamic Digital Library Pro - Service Worker
// ================================================================

const CACHE_NAME = 'islamic-library-v5';
const ASSETS = [
  'index.html',
  'manifest.json',
  'config.js',
  'icon-192.png',
  'icon-512.png'
];

// ================================================================
// INSTALL - Cache all required files
// ================================================================
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching app assets...');
        return cache.addAll(ASSETS);
      })
      .then(() => {
        console.log('✅ App assets cached!');
        return self.skipWaiting();
      })
  );
});

// ================================================================
// ACTIVATE - Clean up old caches
// ================================================================
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activated!');
      return self.clients.claim();
    })
  );
});

// ================================================================
// FETCH - Serve from cache first, then network
// ================================================================
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        
        return fetch(event.request)
          .then(networkResponse => {
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            const responseToCache = networkResponse.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                const url = new URL(event.request.url);
                if (url.pathname.match(/\.(html|css|js|png|jpg|jpeg|gif|svg|json|mp3|wav|webm|mp4)$/i)) {
                  cache.put(event.request, responseToCache);
                }
              });
            
            return networkResponse;
          })
          .catch(() => {
            return new Response(
              '<h1>📚 Islamic Library</h1><p>You are offline. Please check your internet connection.</p>',
              { headers: { 'Content-Type': 'text/html' } }
            );
          });
      })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
