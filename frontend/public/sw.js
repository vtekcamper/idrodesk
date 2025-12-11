// Service Worker per PWA
const CACHE_NAME = 'idrodesk-v1';
const STATIC_CACHE = 'idrodesk-static-v1';

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
];

// Install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  return self.clients.claim();
});

// Fetch
self.addEventListener('fetch', (event) => {
  // Cache strategy: Network First, fallback to cache
  if (event.request.method === 'GET') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response
          const responseToCache = response.clone();

          // Cache static assets
          if (
            event.request.destination === 'script' ||
            event.request.destination === 'style' ||
            event.request.destination === 'image'
          ) {
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }

          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(event.request).then((response) => {
            if (response) {
              return response;
            }

            // If it's a navigation request, return offline page
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }

            return new Response('Offline', { status: 503 });
          });
        })
    );
  }
});

