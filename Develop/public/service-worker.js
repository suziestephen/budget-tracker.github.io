const CACHE_STATIC = 'static-cache-v2';
const DATA_CACHE = 'data-cache-v1';
const FILES_TO_CACHE = [
    "/",
    '/manifest.webmanifest',
    "/index.html",
    "/index.js",
    "/styles.css",
    "/db.js",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png"
];



// Install
self.addEventListener("install", function (evt) {
    // Pre cache data
    evt.waitUntil(
        caches.open(CACHE_STATIC).then((cache) => {
            return cache.addAll(FILES_TO_CACHE);
        })
    );

    // evt.waitUntil(
    //     caches.open(CACHE_STATIC).then((cache) => cache.addAll(FILES_TO_CACHE))
    // );

    self.skipWaiting();
});
  
  // Activate
  self.addEventListener("activate", function(evt) {
    evt.waitUntil(
      caches.keys().then(keyList => {
        return Promise.all(
          keyList.map(key => {
            if (key !== CACHE_STATIC && key !== DATA_CACHE) {
              console.log("Removing old cache data", key);
              return caches.delete(key);
            }
          })
        );
      })
    );
  
    self.clients.claim();
  });
  
  // Fetch
  self.addEventListener("fetch", function(evt) {
    if (evt.request.url.includes("/api/")) {
      evt.respondWith(
        caches.open(DATA_CACHE).then(cache => {
          return fetch(evt.request)
            .then(response => {
              // Clone good response to store in cache 
              if (response.status === 200) {
                cache.put(evt.request.url, response.clone());
              }
  
              return response;
            })
            .catch(err => {
              // Network request failed, attempt to get from cache.
              return cache.match(evt.request);
            });
        }).catch(err => console.log(err))
      );
  
      return;
    }
  
    evt.respondWith(
      caches.open(CACHE_STATIC).then(cache => {
        return cache.match(evt.request).then(response => {
          return response || fetch(evt.request);
        });
      })
    );
  });