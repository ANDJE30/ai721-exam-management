/* AI721_ASTRA_LUZ_2.0 : service worker (application installable, travail hors connexion) */
const VERSION = '__VERSION__';
const CACHE = 'astraluz-' + VERSION;
const CORE = __CORE__;
self.addEventListener('install', ev => { ev.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', ev => { ev.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('astraluz-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', ev => {
  const req = ev.request; const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return; // Firebase et autres domaines : réseau direct
  if (req.mode === 'navigate') {
    ev.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put('./', cp)); return r; }).catch(() => caches.match('./').then(r => r || caches.match('index.html'))));
    return;
  }
  ev.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return r; })));
});
