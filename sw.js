// LiftLog service worker.
// App files: served from cache instantly, then refreshed in the background.
// After you push an update, it applies the next time LiftLog is fully closed and reopened.
const SHELL_CACHE = 'liftlog-shell-v1';
const IMG_CACHE = 'liftlog-images-v1';
const SHELL = ['./', './index.html', './css/app.css', './js/app.js', './js/db.js', './js/data.js', './js/musclemap.js', './js/charts.js',
  './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/maskable-512.png', './exercises/assets.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL_CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => ![SHELL_CACHE, IMG_CACHE].includes(k)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

async function staleWhileRevalidate(req, key) {
  const cache = await caches.open(SHELL_CACHE);
  const cached = await cache.match(key || req, { ignoreSearch: true });
  const net = fetch(req, { cache: 'no-cache' }).then(r => { if (r.ok) cache.put(key || req, r.clone()); return r; }).catch(() => null);
  return cached || (await net) || new Response('Offline', { status: 503 });
}
async function networkFirst(req) {
  const cache = await caches.open(SHELL_CACHE);
  try { const r = await fetch(req, { cache: 'no-cache' }); if (r.ok) cache.put(req, r.clone()); return r; }
  catch { return (await cache.match(req, { ignoreSearch: true })) || new Response('{"exercises":{}}', { headers: { 'Content-Type': 'application/json' } }); }
}
async function cacheFirstImage(req) {
  const cache = await caches.open(IMG_CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  try { const r = await fetch(req); if (r.ok) cache.put(req, r.clone()); return r; }
  catch { return new Response('', { status: 404 }); }
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (req.mode === 'navigate') { e.respondWith(staleWhileRevalidate(req, new URL('./index.html', self.registration.scope).href)); return; }
  if (url.pathname.endsWith('/exercises/assets.json')) { e.respondWith(networkFirst(req)); return; }
  if (url.pathname.includes('/exercises/') && /\.(webp|png|jpe?g|svg)$/.test(url.pathname)) { e.respondWith(cacheFirstImage(req)); return; }
  e.respondWith(staleWhileRevalidate(req));
});
