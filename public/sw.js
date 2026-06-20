// Asmar Coffee PWA service worker — basic offline caching
const CACHE = "asmar-v1";
const PRECACHE = ["/offline.html", "/icons/icon-192.png", "/manifest.json"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;                       // never cache writes (POST/PATCH)
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;             // skip cross-origin
  if (url.pathname.startsWith("/api")) return;            // always hit network for data

  if (req.mode === "navigate") {
    // network-first for pages, fallback to cache/offline
    e.respondWith(
      fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })
        .catch(() => caches.match(req).then((r) => r || caches.match("/offline.html")))
    );
    return;
  }
  // cache-first for static assets (JS/CSS/img)
  e.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res;
    }).catch(() => cached))
  );
});
