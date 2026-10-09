/* Service worker: permite instalar la web como app y jugar sin conexión.
   Código (html/js/css): red primero, con copia local de reserva. Imágenes y audio: caché primero. */
'use strict';
const CACHE = 'doz3-v11';
const SHELL = ['./', 'index.html', 'style.css', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'assets/portada.jpg', 'assets/fondo_nueva.webp', 'assets/fondo_ranking.webp',
  'js/version.js', 'js/data.js', 'js/events.js', 'js/dest.js', 'js/engine.js', 'js/game.js', 'js/phases.js', 'js/actions.js', 'js/cardtext.js', 'js/ui.js', 'js/anim.js',
  'js/expansions.js', 'js/expansions2.js', 'js/sfx.js', 'js/sound.js', 'js/voz.js', 'js/ost.js', 'assets/sonidos/efectos/sfx_disparo.mp3', 'assets/sonidos/efectos/sfx_disparo_largo.mp3', 'js/mapzoom.js', 'js/save.js', 'js/main.js', 'js/bot.js'];

self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url); if (url.origin !== location.origin) return;
  const isCode = req.mode === 'navigate' || /\.(html|js|css|webmanifest)$/.test(url.pathname) || url.pathname.endsWith('/');
  if (isCode) {
    e.respondWith(fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return r; }).catch(() => caches.match(req).then(r => r || caches.match('index.html'))));
  } else {
    const get = () => fetch(req).then(r => { if (r.ok && r.status === 200) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)).catch(() => { }); } return r; });
    e.respondWith(caches.match(req).then(hit => hit || get().catch(() => new Promise(res => setTimeout(res, 500)).then(get))).catch(() => caches.match(req)));
  }
});
