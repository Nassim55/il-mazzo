// Il Mazzo's service worker (Nov 2026): once opened, the app works offline. The page comes from
// the network when there is one — so a new version arrives at once — and from the cache when there
// isn't; fonts and icons come from the cache first. Progress syncing (the workers.dev server) and
// Google sign-in always go to the network and are never cached.
const CACHE = 'il-mazzo-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.endsWith('workers.dev') || url.hostname === 'accounts.google.com') return;   // never cached
  const page = req.mode === 'navigate' || (url.origin === self.location.origin && /\/(index\.html)?$/.test(url.pathname));
  if (page) {   // the network first, so updates arrive; the cache when offline
    event.respondWith(
      fetch(req)
        .then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(cache => cache.put('./index.html', copy)); } return res; })
        .catch(() => caches.match('./index.html').then(hit => hit || caches.match('./')))
    );
    return;
  }
  if (url.origin === self.location.origin || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(cache => cache.put(req, copy)); }
        return res;
      }))
    );
  }
});
