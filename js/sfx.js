/* Efectos de sonido (Web Audio: baja latencia y disparos que se pueden solapar). Se salta el silencio inicial de cada archivo y se corta la cola muda.
   El navegador solo permite sonar tras un gesto del usuario; se prepara en la primera pulsación. */
'use strict';

const Sfx = {
  ctx: null, bufs: {}, loading: {}, master: null,
  defs: {
    shot: { url: 'assets/sfx/disparo.mp3', from: 0.15, to: 1.35, gain: 0.55 },
    long: { url: 'assets/sfx/disparo_largo.mp3', from: 0.0, to: 2.6, gain: 0.7 }
  },
  enabled() { try { return localStorage.getItem('doz3.sfx') !== '0'; } catch (e) { return true; } },
  setEnabled(v) { try { localStorage.setItem('doz3.sfx', v ? '1' : '0'); } catch (e) { } },
  init() {
    if (this.ctx || !(window.AudioContext || window.webkitAudioContext)) return;
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); this.master = this.ctx.createGain(); this.master.gain.value = 1; this.master.connect(this.ctx.destination); } catch (e) { this.ctx = null; }
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
    g.gain.setValueAtTime(d.gain, t); g.gain.setValueAtTime(d.gain, t + Math.max(0, len - 0.08)); g.gain.linearRampToValueAtTime(0, t + len);
    src.start(t, d.from, len); return true;
  },
  shot(dist) { return this.play(dist > 1 ? 'long' : 'shot'); }
};
['pointerdown', 'keydown', 'touchstart'].forEach(ev => document.addEventListener(ev, () => Sfx.warm(), { once: true, capture: true }));
