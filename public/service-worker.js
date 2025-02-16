const VERSION = "1.0.1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => {
      return cache.addAll([
        "/",
        // Add other assets you want to cache
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== VERSION) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      clients.claim(),
    ])
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
