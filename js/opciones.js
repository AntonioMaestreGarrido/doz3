/* Opciones del juego que no son de sonido (el sonido está en sound.js). Se guardan en este navegador.
   artAlt: usar el arte alternativo (assets/arte_alt): cartas, fichas y obituario consultan Opciones.artAlt para elegir qué cargar.
   Se cambia desde el menú Opciones de la portada. */
'use strict';

const Opciones = {
  KEY: 'doz3.opts',
  artAlt: false,
  load() {
    try { const s = JSON.parse(localStorage.getItem(this.KEY) || 'null'); if (s && typeof s.artAlt === 'boolean') this.artAlt = s.artAlt; } catch (e) { }
  },
  set(patch) {
    Object.assign(this, patch);
    try { localStorage.setItem(this.KEY, JSON.stringify({ artAlt: this.artAlt })); } catch (e) { }
  }
};
Opciones.load();
