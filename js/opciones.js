/* Opciones del juego que no son de sonido (el sonido está en sound.js). Se guardan en este navegador.
   artAlt: usar el arte alternativo (ilustraciones nuevas de personajes). Por ahora solo se guarda la preferencia;
   cuando exista el arte alternativo, las imágenes consultarán Opciones.artAlt para elegir qué cargar. */
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
