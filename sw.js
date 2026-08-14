const CACHE_NAME = "gastos-cache-v7";

/* Precache list. Anything that 404s is skipped rather than failing the whole
   install. cache.addAll() rejects if a single file is missing, which silently
   aborts the install and leaves the previous service worker in charge, so the
   app keeps serving stale code with no visible error. That is exactly the
   failure this file is meant to prevent. */
const ASSETS = [
  "./",
  "./expense-tracker.html",
  "./quick-add.html",
  "./manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        ASSETS.map((url) =>
          fetch(new Request(url, { cache: "reload" }))
            .then((res) => (res && res.ok) ? cache.put(url, res) : null)
            .catch(() => null)
        )
      )
    )
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* Cache-first for offline use. Network responses are cached as they arrive. */
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME).then((cache) =>
              cache.put(event.request, copy)
            );
          }

          return response;
        })
        .catch(() => cached);
    })
  );
});
