// Robo Groove service worker: makes the app work offline.
// The browser keeps this file on the device and runs it in the background.
//
// Strategy: "stale-while-revalidate"
//   1. Answer instantly from the saved copy (works with no internet).
//   2. At the same time, if online, download a fresh copy for next time.
// So updates you push to GitHub reach devices on their next launch.
// Bump CACHE_VERSION if you ever add or rename files in FILES.

const CACHE_VERSION = "robo-groove-v1";

// Everything the app needs to run. The sounds and fonts live inside index.html
const FILES = [
  "./",
  "./index.html",
  "./icon.png",
  "./icon-192.png",
  "./icon-512.png",
  "./manifest.json"
];

// INSTALL: runs once, on the first visit. Save every file.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(FILES))
  );
  self.skipWaiting();                 // start working right away
});

// ACTIVATE: delete saved copies from older versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_VERSION).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();               // take control of open tabs too
});

// FETCH: every time the app asks for a file
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.open(CACHE_VERSION).then(async (cache) => {
      // ignoreSearch: "index.html?x=1" still matches the saved "index.html"
      const saved = await cache.match(event.request, { ignoreSearch: true });

      // Try the internet in the background and refresh the saved copy
      const fresh = fetch(event.request)
        .then((response) => {
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        })
        .catch(() => saved);          // offline: fall back to the saved copy

      return saved || fresh;          // saved copy first, internet if nothing saved
    })
  );
});
