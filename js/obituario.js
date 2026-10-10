/* Obituario: al terminar la partida, un ciclo a pantalla completa con cada baja (héroes y civiles heroicos del Cementerio).
   Por baja: la ilustración entra a color con un foco de luz sobre el personaje y su nombre; pasa a blanco y negro; se apaga a negro;
   y todo se funde para dar paso a la siguiente. Suena el tema «Obituario» y se repite el ciclo hasta que acaba la canción
   o el jugador pulsa Salir (Esc). Sin música (canal apagado) se hace un solo ciclo. */
'use strict';

const Obit = {
  /* Posición horizontal (%) del personaje principal en cada ilustración: centra el foco de luz. */
  FOCO: { piazza: 40, hernandez: 46, schmidt: 57, hunt: 47, hauser: 49, johnson: 29, kingman: 42, pepinillos: 53, santana: 46, darling: 45, staub: 23, horacio: 43, seaver: 38, agee: 42, jones: 46, wright: 45, wilson: 50, furias: 50, bomberos: 42, bauer: 46, antidist: 50, salvacion: 48, clarin: 44, wzed: 42, division12: 50, jaque: 46 },
  FOCO_Y: 42,
  MUSICA: 'assets/sonidos/musica/musica_obituario.m4a',
  vel: 1,            /* factor de tiempo (1 = real); lo usan las pruebas */
  run: 0, fin: false, activo: false, audio: null, _pend: [],

  /* Bajas con ilustración, por orden de caída. */
  bajas() {
    if (typeof G === 'undefined' || !G.cemetery) return [];
    const d = u => (G.ust && G.ust[u.id] && G.ust[u.id].diedT) || 0;
    return G.cemetery.filter(u => u.key && HEROES[u.key] && ALT_KEYS.includes(u.key)).sort((a, b) => d(a) - d(b));
  },
  url: k => 'assets/arte_alt/obituario/' + k + '.webp',

  /* Espera ms (escalados por vel); devuelve false si se canceló mientras tanto. */
  wait(ms, run) {
    return new Promise(res => { const p = { res }; p.t = setTimeout(() => { this._pend = this._pend.filter(x => x !== p); res(this.run === run && !this.fin); }, ms * this.vel); this._pend.push(p); });
  },
  _cancelaEsperas() { for (const p of this._pend) { clearTimeout(p.t); p.res(false); } this._pend = []; },

  _dom() {
    const o = document.createElement('div'); o.id = 'obit';
    o.innerHTML = '<div class="ob-stage"><img class="ob-img" alt=""><div class="ob-spot"></div></div>' +
      '<div class="ob-txt"><div class="ob-name"></div><div class="ob-rule"></div><div class="ob-sub"></div><div class="ob-epi"></div></div>' +
      '<button class="ob-exit" type="button">✕ Salir</button>';
    document.body.appendChild(o); this.el = o;
    o.querySelector('.ob-exit').onclick = () => this.salir();
    this._key = e => { if (e.key === 'Escape') this.salir(); }; document.addEventListener('keydown', this._key);
  },

  async start() {
    const list = this.bajas(); if (!list.length || this.activo) return;
    this.activo = true; this.fin = false; const run = ++this.run;
    $('modal').hidden = true; this._dom();
    try { if (ui._endMus) ui._endMus.pause(); } catch (e) { }
    this.audio = null;
    if (Sound.music.on) {
      const a = this.audio = new Audio(this.MUSICA); a.volume = Math.min(1, .9 * Sound.music.vol);
      a.onended = () => { this.fin = true; this._cancelaEsperas(); };
      const p = a.play(); if (p && p.catch) p.catch(() => { });
    }
    this.el.style.opacity = 0; this.el.style.transition = 'opacity ' + (0.8 * this.vel) + 's'; void this.el.offsetWidth; this.el.style.opacity = 1;
    let i = 0;
    while (this.run === run && !this.fin) {
      await this.slide(list[i % list.length], run, list[(i + 1) % list.length]);
      i++;
      if (!this.audio && i >= list.length) break;       /* sin música: un solo ciclo */
    }
    await this.cerrar(run);
  },

  /* Una baja: color con foco → blanco y negro → negro → se funde todo. */
  async slide(u, run, next) {
    const h = HEROES[u.key], st = (G.ust && G.ust[u.id]) || {}, el = this.el, img = el.querySelector('.ob-img'), spot = el.querySelector('.ob-spot'), txt = el.querySelector('.ob-txt');
    const fx = this.FOCO[u.key] || 50, fy = this.FOCO_Y, v = this.vel, T = s => (s * v) + 's';
    const kills = st.kills || 0;
    el.querySelector('.ob-name').textContent = h.name.replace(/\s*\(.*?\)/, '');
    el.querySelector('.ob-sub').textContent = h.cls + (st.diedT ? ' · cayó en el turno ' + st.diedT : '');
    el.querySelector('.ob-epi').textContent = kills ? 'Eliminó ' + kills + ' Zed' + (kills > 1 ? 's' : '') + ' antes de caer.' : 'Sostuvo la línea hasta el final.';
    txt.classList.remove('on'); txt.style.transition = 'opacity ' + T(1.2);
    spot.style.background = 'radial-gradient(ellipse 36% 58% at ' + fx + '% ' + fy + '%, rgba(0,0,0,0) 0%, rgba(0,0,0,.32) 55%, rgba(0,0,0,.9) 100%)';
    img.style.transition = 'none'; img.style.opacity = 0; img.style.filter = 'grayscale(0) brightness(1)'; img.style.transform = 'scale(1)';
    img.style.objectPosition = fx + '% ' + fy + '%'; img.style.transformOrigin = fx + '% ' + fy + '%';
    const cargada = new Promise(r => { img.onload = img.onerror = () => r(); });
    img.src = this.url(u.key);
    if (!(img.complete && img.naturalWidth)) await Promise.race([cargada, new Promise(r => setTimeout(r, 4000))]);   /* tope: la imagen nunca bloquea el ciclo */
    if (next && next.key !== u.key) { const pre = new Image(); pre.src = this.url(next.key); }
    if (this.run !== run || this.fin) return;
    const zoom = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches ? 'none' : 'transform ' + T(11) + ' linear, ';
    void img.offsetWidth;
    img.style.transition = (zoom === 'none' ? '' : zoom) + 'opacity ' + T(1.2) + ' ease, filter ' + T(2.4) + ' ease';
    img.style.opacity = 1; if (zoom !== 'none') img.style.transform = 'scale(1.1)';
    if (!await this.wait(900, run)) return;  txt.classList.add('on');                                   /* aparece el nombre */
    if (!await this.wait(2700, run)) return; img.style.filter = 'grayscale(1) brightness(.9)';            /* a blanco y negro */
    if (!await this.wait(2800, run)) return; img.style.transition = 'filter ' + T(1.6) + ' ease, transform ' + T(11) + ' linear'; img.style.filter = 'grayscale(1) brightness(0)'; /* a negro */
    if (!await this.wait(1700, run)) return; txt.classList.remove('on');                                  /* se funde el nombre */
    await this.wait(1500, run);                                                                           /* y entra la siguiente */
  },

  salir() { this.fin = true; this._cancelaEsperas(); },

  async cerrar(run) {
    if (this.audio) { const a = this.audio; this.audio = null; a.onended = null; const f = setInterval(() => { a.volume = Math.max(0, a.volume - .08); if (a.volume <= 0) { clearInterval(f); a.pause(); } }, 60); }
    document.removeEventListener('keydown', this._key);
    const el = this.el; if (el) { el.style.transition = 'opacity ' + (0.8 * this.vel) + 's'; el.style.opacity = 0; await new Promise(r => setTimeout(r, 800 * this.vel)); el.remove(); }
    this.el = null; this.activo = false; this.fin = false;
    if (ui._endHtml) { ui._modal(ui._endHtml); ui._bindEnd(); }
  }
};
