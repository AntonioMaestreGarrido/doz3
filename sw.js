/* Service worker: permite instalar la web como app y jugar sin conexión.
   Código (html/js/css): red primero, con copia local de reserva. Imágenes y audio: caché primero. */
'use strict';
const CACHE = 'doz3-v47';
const SHELL = ['./', 'index.html', 'style.css', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'assets/portada.jpg', 'assets/fondo_nueva.webp', 'assets/fondo_ranking.webp',
  'js/version.js', 'js/data.js', 'js/events.js', 'js/dest.js', 'js/evlog.js', 'js/preview.js', 'js/obituario.js', 'js/engine.js', 'js/game.js', 'js/phases.js', 'js/actions.js', 'js/cardtext.js', 'js/ui.js', 'js/anim.js',
  'js/expansions.js', 'js/expansions2.js', 'js/sfx.js', 'js/sound.js', 'js/opciones.js', 'js/voz.js', 'js/ost.js', 'assets/sonidos/letras/letras.js', 'assets/sonidos/efectos/sfx_disparo.mp3', 'assets/sonidos/efectos/sfx_disparo_largo.mp3', 'js/mapzoom.js', 'js/seedcode.js', 'js/save.js', 'js/main.js', 'js/bot.js'];

/* Fichas, mapas e intro: se guardan en segundo plano tras instalar (sin bloquear ni fallar la instalación) para que la segunda visita y el modo sin conexión vayan desde caché. */
const PRECACHE = [
  'assets/tokens/agee.webp', 'assets/tokens/aldeanos.webp', 'assets/tokens/alia.webp', 'assets/tokens/antidist.webp',
  'assets/tokens/arma_balas.webp', 'assets/tokens/arma_cebo.webp', 'assets/tokens/arma_nudillos.webp', 'assets/tokens/arma_rifle_pieza.webp',
  'assets/tokens/bauer.webp', 'assets/tokens/betty.webp', 'assets/tokens/bomberos.webp', 'assets/tokens/carter.webp',
  'assets/tokens/civ1.webp', 'assets/tokens/civ2.webp', 'assets/tokens/civ3.webp', 'assets/tokens/clarin.webp',
  'assets/tokens/darling.webp', 'assets/tokens/division12.webp', 'assets/tokens/elwood.webp', 'assets/tokens/elwood_reverso.webp',
  'assets/tokens/furias.webp', 'assets/tokens/guardia.webp', 'assets/tokens/hauser.webp', 'assets/tokens/hernandez.webp',
  'assets/tokens/horacio.webp', 'assets/tokens/hunt.webp', 'assets/tokens/jaque.webp', 'assets/tokens/johnson.webp',
  'assets/tokens/jones.webp', 'assets/tokens/kingman.webp', 'assets/tokens/lee.webp', 'assets/tokens/marcadores/barricada.webp',
  'assets/tokens/marcadores/bastion.webp', 'assets/tokens/marcadores/caos.webp', 'assets/tokens/marcadores/ecg.webp', 'assets/tokens/marcadores/mina_4.webp',
  'assets/tokens/marcadores/mina_7.webp', 'assets/tokens/marcadores/puente.webp', 'assets/tokens/marines.webp', 'assets/tokens/may.webp',
  'assets/tokens/noelle.webp', 'assets/tokens/pepinillos.webp', 'assets/tokens/petra.webp', 'assets/tokens/petra_full.webp',
  'assets/tokens/petra_red.webp', 'assets/tokens/piazza.webp', 'assets/tokens/porter.webp', 'assets/tokens/porter_r.webp', 'assets/tokens/sar.webp', 'assets/tokens/sar_r.webp', 'assets/tokens/caza.webp', 'assets/tokens/caza_r.webp', 'assets/tokens/heli.webp', 'assets/tokens/heli_r.webp',
  'assets/tokens/refugiados.webp', 'assets/tokens/rumores/ayuda.webp', 'assets/tokens/rumores/base.webp', 'assets/tokens/rumores/cementerio.webp',
  'assets/tokens/rumores/cristal.webp', 'assets/tokens/rumores/deposito.webp', 'assets/tokens/rumores/diario.webp', 'assets/tokens/rumores/ferreteria.webp',
  'assets/tokens/rumores/medallon.webp', 'assets/tokens/rumores/muerte.webp', 'assets/tokens/rumores/plan.webp', 'assets/tokens/rumores/registro.webp',
  'assets/tokens/rumores/reverso.webp', 'assets/tokens/rumores/sirena.webp', 'assets/tokens/rumores/tallmart.webp', 'assets/tokens/rumores/telefono.webp',
  'assets/tokens/rumores/tesis.webp', 'assets/tokens/rumores/traje.webp', 'assets/tokens/salvacion.webp', 'assets/tokens/santana.webp',
  'assets/tokens/schmidt.webp', 'assets/tokens/seaver.webp', 'assets/tokens/staub.webp', 'assets/tokens/sz_berserker.webp',
  'assets/tokens/sz_berserker_reverso.webp', 'assets/tokens/sz_condenado.webp', 'assets/tokens/sz_condenado_reverso.webp', 'assets/tokens/sz_devastador.webp',
  'assets/tokens/sz_devastador_reverso.webp', 'assets/tokens/sz_ferreo.webp', 'assets/tokens/sz_ferreo_reverso.webp', 'assets/tokens/sz_gigante.webp',
  'assets/tokens/sz_gigante_reverso.webp', 'assets/tokens/sz_lobo.webp', 'assets/tokens/sz_lobo_reverso.webp', 'assets/tokens/sz_reanimador.webp',
  'assets/tokens/sz_reanimador_reverso.webp', 'assets/tokens/sz_saltarin.webp', 'assets/tokens/sz_saltarin_reverso.webp', 'assets/tokens/sz_supurador.webp',
  'assets/tokens/sz_supurador_reverso.webp', 'assets/tokens/tren_a.webp', 'assets/tokens/tren_b.webp', 'assets/tokens/wilson.webp',
  'assets/tokens/wright.webp', 'assets/tokens/wzed.webp', 'assets/tokens/zed.webp', 'assets/tokens/zeds/full_2.webp',
  'assets/tokens/zeds/full_3.webp', 'assets/tokens/zeds/full_4.webp', 'assets/tokens/zeds/full_5.webp', 'assets/tokens/zeds/full_6.webp',
  'assets/tokens/zeds/full_7.webp', 'assets/tokens/zeds/full_8.webp', 'assets/tokens/zeds/full_9.webp', 'assets/tokens/zeds/red_1.webp',
  'assets/tokens/zeds/red_2.webp', 'assets/tokens/zeds/red_3.webp', 'assets/tokens/zeds/red_4.webp', 'assets/tokens/zeds/red_5.webp',
  'assets/mapa.jpg', 'assets/mapaB.jpg', 'assets/intro.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).then(() => { Promise.all(PRECACHE.map(u => c.add(u).catch(() => { }))); })).then(() => self.skipWaiting())); });
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
