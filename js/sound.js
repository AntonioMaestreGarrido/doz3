/* Ajustes de sonido: música, efectos y voz del líder. Cada canal tiene interruptor y volumen (0-1), guardados en este navegador. */
'use strict';

const Sound = {
  music: { on: true, vol: 1 }, sfx: { on: true, vol: 1 }, voice: { on: true, vol: 1 },
  load() {
    let s = null; try { s = JSON.parse(localStorage.getItem('doz3.audio') || 'null'); } catch (e) { }
    if (s) { for (const k of ['music', 'sfx', 'voice']) if (s[k]) Object.assign(this[k], s[k]); return; }
    /* Compatibilidad con los ajustes antiguos (solo interruptores). */
    try { this.music.on = localStorage.getItem('doz3.mute') !== '1'; this.sfx.on = localStorage.getItem('doz3.sfx') !== '0'; } catch (e) { }
  },
  set(k, patch) {
    Object.assign(this[k], patch);
    try { localStorage.setItem('doz3.audio', JSON.stringify({ music: this.music, sfx: this.sfx, voice: this.voice })); } catch (e) { }
    this.apply();
  },
  /* Aplica el estado actual a los motores de audio que ya están sonando. */
  apply() {
    if (typeof Sfx !== 'undefined' && Sfx.master) Sfx.master.gain.value = this.sfx.vol;
    if (typeof ui !== 'undefined') ui.applyMusic();
  }
};
Sound.load();
