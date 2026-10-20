/* Opciones del juego que no son de sonido (el sonido está en sound.js). Se guardan en este navegador.
   artAlt: usar el arte alternativo (assets/arte_alt): cartas, fichas y obituario consultan Opciones.artAlt para elegir qué cargar.
   movil: disposición de móvil ('auto' según la pantalla, 'on' siempre, 'off' nunca; ver movil.js).
   Se cambia desde el menú Opciones de la portada. */
'use strict';

const Opciones = {
  KEY: 'doz3.opts',
  artAlt: false,
  movil: 'auto',
  load() {
    try { const s = JSON.parse(localStorage.getItem(this.KEY) || 'null'); if (s && typeof s.artAlt === 'boolean') this.artAlt = s.artAlt; if (s && ['auto', 'on', 'off'].includes(s.movil)) this.movil = s.movil; } catch (e) { }
  },
  set(patch) {
    Object.assign(this, patch);
    try { localStorage.setItem(this.KEY, JSON.stringify({ artAlt: this.artAlt, movil: this.movil })); } catch (e) { }
  }
};
Opciones.load();
