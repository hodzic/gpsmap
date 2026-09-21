const SHELL_CACHE = 'my-location-shell-v3';
const TILE_CACHE = 'map-tiles';
const SHELL_ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL_CACHE).then(cache => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== SHELL_CACHE && k !== TILE_CACHE).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

function isTileRequest(url) {
  return url.hostname === 'tile.openstreetmap.org';
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (isTileRequest(url)) {
    event.respondWith(handleTile(event.request));
    return;
  }

  if (url.origin !== self.location.origin) return; // let other cross-origin requests pass through normally

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});

async function handleTile(request) {
  const cache = await caches.open(TILE_CACHE);
  try {
    // Tile responses are opaque (no CORS headers from the tile server),
    // but opaque responses still cache and render as images just fine —
    // we just can't read their bytes from JS.
    const response = await fetch(request);
    await cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}
