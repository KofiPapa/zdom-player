// Service Worker for the ZDOM player – provides offline support
// and intelligent caching for media assets.

const CACHE_NAME = "zdom-player-v1";

// App shell resources cached on install
const APP_SHELL = ["/", "/index.html"];

// Maximum total cache entries for media (LRU eviction)
const MAX_MEDIA_CACHE_ENTRIES = 200;

// ---- Helpers ----

function isMediaUrl(url) {
  return (
    url.includes("firebasestorage.googleapis.com") ||
    url.includes("storage.googleapis.com") ||
    /\.(png|jpe?g|gif|webp|svg|mp4|webm|ogg)(\?|$)/i.test(url)
  );
}

function isApiOrFirestore(url) {
  return (
    url.includes("firestore.googleapis.com") ||
    url.includes("cloudfunctions.net") ||
    url.includes("/api/") ||
    url.includes("identitytoolkit.googleapis.com") ||
    url.includes("securetoken.googleapis.com")
  );
}

function isAppShell(url) {
  const path = new URL(url).pathname;
  return (
    path === "/" ||
    path === "/index.html" ||
    path.endsWith(".js") ||
    path.endsWith(".css") ||
    path.endsWith(".svg") ||
    path.endsWith(".ico")
  );
}

/**
 * Evict oldest entries when the media cache grows beyond the limit.
 */
async function evictOldMediaEntries() {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();

  // Only count media entries
  const mediaKeys = keys.filter((req) => isMediaUrl(req.url));

  if (mediaKeys.length > MAX_MEDIA_CACHE_ENTRIES) {
    const toDelete = mediaKeys.length - MAX_MEDIA_CACHE_ENTRIES;
    // Delete the oldest entries (first in the list)
    for (let i = 0; i < toDelete; i++) {
      await cache.delete(mediaKeys[i]);
    }
  }
}

// ---- Install ----

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// ---- Activate ----

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ---- Fetch ----

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== "GET") return;

  const url = request.url;

  if (isMediaUrl(url)) {
    // Media: cache-first, network fallback
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;

          return fetch(request)
            .then((response) => {
              if (response.ok) {
                cache.put(request, response.clone());
                evictOldMediaEntries();
              }
              return response;
            })
            .catch(() => new Response("Media unavailable offline", { status: 503 }));
        })
      )
    );
    return;
  }

  if (isApiOrFirestore(url)) {
    // API / Firestore: network-first, cache fallback
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        fetch(request)
          .then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() =>
            cache
              .match(request)
              .then(
                (cached) =>
                  cached ||
                  new Response(JSON.stringify({ error: "offline" }), {
                    status: 503,
                    headers: { "Content-Type": "application/json" },
                  })
              )
          )
      )
    );
    return;
  }

  if (isAppShell(url)) {
    // App shell: cache-first, network fallback
    event.respondWith(
      caches
        .match(request)
        .then(
          (cached) =>
            cached ||
            fetch(request).then((response) => {
              if (response.ok) {
                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
              }
              return response;
            })
        )
        .catch(() => caches.match("/index.html"))
    );
    return;
  }
});

// ---- Message handling (self-registration, cache control) ----

self.addEventListener("message", (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case "SKIP_WAITING":
      self.skipWaiting();
      break;

    case "CACHE_MEDIA": {
      // Pre-cache a list of media URLs sent from the player app
      const urls = payload?.urls || [];
      event.waitUntil(
        caches.open(CACHE_NAME).then((cache) =>
          Promise.all(
            urls.map((url) =>
              cache.match(url).then((existing) => {
                if (!existing) {
                  return fetch(url)
                    .then((resp) => {
                      if (resp.ok) cache.put(url, resp);
                    })
                    .catch(() => {});
                }
              })
            )
          ).then(() => evictOldMediaEntries())
        )
      );
      break;
    }

    case "CLEAR_CACHE":
      event.waitUntil(
        caches.delete(CACHE_NAME).then(() => caches.open(CACHE_NAME))
      );
      break;

    case "GET_CACHE_SIZE": {
      event.waitUntil(
        caches
          .open(CACHE_NAME)
          .then((cache) => cache.keys())
          .then((keys) => {
            event.source.postMessage({
              type: "CACHE_SIZE",
              payload: { entries: keys.length },
            });
          })
      );
      break;
    }
  }
});
