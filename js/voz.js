/* Voz del líder: frases grabadas (assets/voz/lider_NN.mp3) en momentos concretos de la partida.
   Suena una a la vez, con un intervalo mínimo entre frases (salvo las de final de partida).
   Cada grupo se recorre al azar sin repetir hasta agotarlo. Los números son los de assets/voz/lider_labels.json. */
'use strict';

const Voz = {
  GRUPOS: {
    inicio: [12, 1], turno: [2], amanece: [9], peligro: [7, 8], ataque: [4, 16, 17, 18], retirada: [5, 13, 14],
    herido: [19, 20, 21], municion: [6], barricada: [5, 9], victoria: [11], derrota_centro: [15], derrota_caos: [13, 14], muerte_zed: [10]
  },
  audio: {}, bolsa: {}, cur: null,
  /* prob: probabilidad de que suene (0-1, por defecto siempre). Una frase nueva corta la que esté sonando. */
  say(grupo, prob) {
    if (!Sound.voice.on || Sound.voice.vol <= 0 || !this.GRUPOS[grupo]) return;
    if (prob !== undefined && prob !== null && Math.random() >= prob) return;
    if (this.cur) this.cur.pause();
    const n = this.pick(grupo);
    const a = this.audio[n] || (this.audio[n] = new Audio('assets/voz/lider_' + String(n).padStart(2, '0') + '.mp3'));
    a.volume = Sound.voice.vol; this.cur = a;
    try { a.currentTime = 0; } catch (e) { }
    const p = a.play(); if (p && p.catch) p.catch(() => { });
  },
  pick(grupo) {
    let b = this.bolsa[grupo];
    if (!b || !b.length) b = this.bolsa[grupo] = this.GRUPOS[grupo].slice().sort(() => Math.random() - .5);
    return b.shift();
  }
};
