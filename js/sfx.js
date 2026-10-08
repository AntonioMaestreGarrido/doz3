/* Efectos de sonido (Web Audio: baja latencia y disparos que se pueden solapar). Se salta el silencio inicial de cada archivo y se corta la cola muda.
   El navegador solo permite sonar tras un gesto del usuario; se prepara en la primera pulsación. */
'use strict';

const Sfx = {
  ctx: null, bufs: {}, loading: {}, master: null,
  defs: {
    shot: { url: 'assets/sonidos/efectos/sfx_disparo.mp3', from: 0.15, to: 1.35, gain: 0.55 },
    long: { url: 'assets/sonidos/efectos/sfx_disparo_largo.mp3', from: 0.0, to: 2.6, gain: 0.7 },
    dice: { url: 'assets/sonidos/efectos/sfx_dados.mp3', from: 0.0, to: 1.05, fade: 0.25, gain: 0.8 },
    zombi1: { url: 'assets/sonidos/efectos/sfx_zombi1.mp3', from: 0.0, to: 99, gain: 0.55 },
    zombi2: { url: 'assets/sonidos/efectos/sfx_zombi2.mp3', from: 0.0, to: 99, gain: 0.55 },
    growl1: { url: 'assets/sonidos/efectos/sfx_growl1.mp3', from: 0.0, to: 2.6, fade: 0.5, gain: 0.6 },
    growl2: { url: 'assets/sonidos/efectos/sfx_growl2.mp3', from: 0.0, to: 2.6, fade: 0.5, gain: 0.6 },
    horde: { url: 'assets/sonidos/efectos/sfx_horda_ataque.mp3', from: 0.0, to: 3.8, fade: 0.8, gain: 0.7 },
    amb: { url: 'assets/sonidos/efectos/sfx_horda_ambiente.mp3', from: 0.0, to: 5.5, fade: 1.2, gain: 0.4 }
  },
  last: {},
  enabled() { return Sound.sfx.on; },
  init() {
    if (this.ctx || !(window.AudioContext || window.webkitAudioContext)) return;
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); this.master = this.ctx.createGain(); this.master.gain.value = Sound.sfx.vol; this.master.connect(this.ctx.destination); } catch (e) { this.ctx = null; }
  },
  async load(k) {
    if (this.bufs[k]) return this.bufs[k];
    if (!this.loading[k]) this.loading[k] = fetch(this.defs[k].url).then(r => r.arrayBuffer()).then(ab => new Promise((res, rej) => this.ctx.decodeAudioData(ab, res, rej))).then(b => (this.bufs[k] = b)).catch(() => null);
    return this.loading[k];
  },
  /* Carga todo en cuanto hay un gesto del usuario. */
  warm() { this.init(); if (!this.ctx) return; if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => { }); Object.keys(this.defs).forEach(k => this.load(k)); },
  async play(k) {
    if (!this.enabled()) return false;
    this.init(); if (!this.ctx) return false;
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => { });
    const d = this.defs[k], buf = await this.load(k); if (!buf) return false;
    const t = this.ctx.currentTime, len = Math.min(d.to, buf.duration) - d.from;
    const src = this.ctx.createBufferSource(), g = this.ctx.createGain(); src.buffer = buf; src.connect(g); g.connect(this.master);
    g.gain.setValueAtTime(d.gain, t); const fd = Math.min(d.fade || 0.08, len); g.gain.setValueAtTime(d.gain, t + Math.max(0, len - fd)); g.gain.linearRampToValueAtTime(0, t + len);
    src.start(t, d.from, len); return true;
  },
  /* Evita que un mismo grupo de sonidos se amontone: ms mínimos entre repeticiones. */
  once(group, ms, k) { const n = performance.now(); if (n - (this.last[group] || -1e9) < ms) return false; this.last[group] = n; return this.play(k); },
  pick(a) { return a[Math.floor(Math.random() * a.length)]; },
  shot(dist) { return this.play(dist > 1 ? 'long' : 'shot'); },
  dice() { return this.once('dice', 200, 'dice'); },
  zed() { return this.once('zed', 500, this.pick(['zombi1', 'zombi2'])); },
  growl() { return this.once('zed', 500, this.pick(['growl1', 'growl2'])); },
  horde() { return this.once('zed', 500, 'horde'); },
  ambience() { return this.once('amb', 20000, 'amb'); }
};
['pointerdown', 'keydown', 'touchstart'].forEach(ev => document.addEventListener(ev, () => Sfx.warm(), { once: true, capture: true }));
