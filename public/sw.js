const CACHE_NAME = 'lear-market-v1';

// Assets to pre-cache on install
const PRE_CACHE = ['/admin', '/jobs', '/'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRE_CACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

// Network-first strategy: fresh data, cache as fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;
  // Skip Supabase API calls — always network
  if (event.request.url.includes('supabase.co')) return;
  // Skip Next.js internal routes
  if (event.request.url.includes('/_next/')) return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(event.request)),
  );
});
