/* Animación: fichas que se deslizan, foco/estela, cámara guiada, avisos y peligro. Se carga después de ui.js. */
'use strict';

Object.assign(ui, {
  anim: {}, ghosts: [], fx: [], camOn: true, camZoom: 1, moveMs: 560, dangerSet: {}, slow: 1.5,
  flights: [], spawnOn: false, spawnN: 0,
  now() { return performance.now(); },
  dur() { return this.fast ? 90 : this.moveMs; },
  ease(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; },

  /* ---- sincroniza las posiciones objetivo con las animaciones ---- */
  syncAnim() {
    const now = this.now(), seen = new Set();
    for (const r of this.rects) {
      seen.add(r.id); const u = G.units[r.id]; let a = this.anim[r.id];
      if (!a) {
        if (this.spawnOn && u && !u._flown && u.type !== 'super' && !this.fast) { /* aparición: sale de la columna junto a la carta de evento */
          u._flown = true; const k = this.spawnN++;
          this.flights.push({ id: r.id, u, k, t0: now + k * 150, d: this.dur() * 1.6, from: this.takePk(u) }); this.spawnFxStart();
          continue;
        }
        a = this.anim[r.id] = { x: r.x, y: r.y, ox: r.x, oy: r.y, tx: r.x, ty: r.y, fx: r.x, fy: r.y, t0: 0, d: 0, moving: false, born: 0, trail: 0, u };
        if (G.turnNo > 0 && !this.fast) { a.born = now; this.pulse(r.x, r.y, u && isZedSide(u) ? '#ff4a3a' : '#5fd35a'); }
      } else if (a.tx !== r.x || a.ty !== r.y) {
        const cur = this.pos(a, now);
        if (!a.moving) { a.ox = cur.x; a.oy = cur.y; }
        a.fx = cur.x; a.fy = cur.y; a.tx = r.x; a.ty = r.y; a.t0 = now; a.d = this.dur(); a.moving = true;
      }
      a.u = u || a.u; a.w = r.w; a.h = r.h;
    }
    for (const id of Object.keys(this.anim)) if (!seen.has(id)) {
      const a = this.anim[id]; const p = this.pos(a, now);
      if (a.u && !this.fast) this.ghosts.push({ u: a.u, x: p.x, y: p.y, w: a.w, h: a.h, t0: now, d: 650 });
      delete this.anim[id];
    }
  },
  pos(a, now) {
    if (!a.moving) return { x: a.tx, y: a.ty };
    const t = Math.max(0, Math.min(1, (now - a.t0) / Math.max(1, a.d)));
    if (t >= 1) return { x: a.tx, y: a.ty };
    const e = this.ease(t); return { x: a.fx + (a.tx - a.fx) * e, y: a.fy + (a.ty - a.fy) * e };
  },
  isAnimating() {
    const now = this.now();
    for (const id in this.anim) { const a = this.anim[id]; if (a.moving && now - a.t0 < a.d) return true; if (a.born && now - a.born < 650) return true; }
    return !!this.vb || this.ghosts.some(g => now - g.t0 < g.d) || this.fx.some(f => now - f.t0 < f.d) || Object.keys(this.ufx).length > 0;
  },
  settle(max) {
    return new Promise(res => {
      if (this.fast) { setTimeout(res, 40); return; }
      const t0 = this.now(), lim = max || 1500;
      const tick = () => { if (!this.isAnimating() || this.now() - t0 > lim) res(); else requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    });
  },
  /* Aparición en columna junto a la carta de evento: durante un bloque de apariciones (spawnBatch) cada unidad nueva
     se dibuja en una columna al lado de la carta de evento y, cuando le llega su turno, vuela a su espacio.
     Los Súper Zeds no entran aquí: ya tienen su presentación (superIntro). */
  async spawnBatch(fn) {
    if (this.fast || this.spawnOn) return fn();
    this.spawnOn = true; this.spawnN = 0;
    try { return await fn(); }
    finally { this.syncAnim(); this.spawnOn = false; this.pkOrigins = null; this.redraw(); await this.settleFlights(); }
  },
  /* Antes de cerrar el aviso se guarda dónde están las fichas preparadas (en pantalla) para que las nuevas salgan de ahí. */
  _pkCapture() {
    const list = [...document.querySelectorAll('#modalbox .pktok')].map(el => { const r = el.getBoundingClientRect(); return { full: +el.dataset.full, red: +el.dataset.red, x: r.left + r.width / 2, y: r.top + r.height / 2, used: false }; });
    /* Se acumulan: un aviso de Destino dentro del mismo bloque no borra las fichas del evento. */
    this.pkOrigins = (this.pkOrigins || []).filter(p => !p.used).concat(list);
  },
  takePk(u) {
    if (!u || !u.token || !this.pkOrigins) return null;
    const o = this.pkOrigins.find(p => !p.used && p.full === u.token[0] && p.red === u.token[1]);
    if (!o) return null; o.used = true; return { x: o.x, y: o.y };
  },
  inFlight(id) { return this.flights.some(f => f.id === id); },
  spawnColumn(k) {
    const ev = $('evimg'), r = ev && ev.getBoundingClientRect();
    return r ? { x: r.left - 48, y: r.top + 20 + k * 72 } : { x: 20, y: 120 + k * 72 };
  },
  mapScreen(id) {
    const cv = this.canvas, r = cv.getBoundingClientRect(), s = G.spaces[id];
    return s ? { x: r.left + s.x * (r.width / cv.width), y: r.top + s.y * (r.height / cv.height) } : null;
  },
  spawnFxStart() {
    if (this._spawnRaf) return;
    const step = () => { this._spawnRaf = null; this.drawSpawnFx(); if (this.flights.length) this._spawnRaf = requestAnimationFrame(step); };
    this._spawnRaf = requestAnimationFrame(step);
  },
  drawSpawnFx() {
    const c = $('spawnfx'); if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    if (c.width !== Math.round(innerWidth * dpr) || c.height !== Math.round(innerHeight * dpr)) { c.width = Math.round(innerWidth * dpr); c.height = Math.round(innerHeight * dpr); }
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, innerWidth, innerHeight);
    const now = this.now(), done = [];
    for (const f of this.flights) {
      const col = f.from || this.spawnColumn(f.k), tgt = this.mapScreen(f.u.space);
      let x = col.x, y = col.y, sc = 1;
      if (now >= f.t0 && tgt) {
        const t = Math.min(1, (now - f.t0) / f.d), e = this.ease(t);
        x = col.x + (tgt.x - col.x) * e; y = col.y + (tgt.y - col.y) * e - Math.sin(Math.PI * e) * 60; sc = 1 - .3 * e;
      }
      if (now >= f.t0 + f.d) done.push(f);
      const img = IMG[f.u.img] || IMG.zed, S = 56 * sc;
      if (img && img.complete && img.naturalWidth) g.drawImage(img, x - S / 2, y - S / 2, S, S);
      else { g.fillStyle = isZedSide(f.u) ? '#ff4a3a' : '#5fd35a'; g.beginPath(); g.arc(x, y, S / 2, 0, 7); g.fill(); }
    }
    if (done.length) { this.flights = this.flights.filter(f => !done.includes(f)); this.redraw(); }
  },
  settleFlights() {
    return new Promise(res => {
      if (this.fast) { res(); return; }
      const t0 = this.now();
      const tick = () => { if (!this.flights.length || this.now() - t0 > 6000) res(); else requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    });
  },
  pulse(x, y, col) { if (this.fast) return; this.fx.push({ x, y, col, t0: this.now(), d: 1000 }); this.redraw(); },
  pulseSpace(id, col) { const s = G.spaces[id]; if (s) this.pulse(s.x, s.y, col || '#ff4a3a'); },

  /* ---- cámara guiada ---- */
  focus(id, zoom) {
    if (!this.camOn || this.fast || !G.spaces || !G.spaces[id] || (this.userBusy && this.userBusy())) return;
    const s = G.spaces[id], cv = this.canvas, wrap = $('mapwrap'); zoom = zoom || 1.9;
    const k = cv.clientWidth / cv.width, px = s.x * k, py = s.y * k;
    const ol = cv.offsetLeft, ot = cv.offsetTop, cw = cv.clientWidth, ch = cv.clientHeight, ww = wrap.clientWidth, wh = wrap.clientHeight;
    let tx = ww / 2 - ol - px * zoom, ty = wh / 2 - ot - py * zoom;
    tx = Math.min(-ol, Math.max(ww - ol - cw * zoom, tx)); ty = Math.min(-ot, Math.max(wh - ot - ch * zoom, ty));
    /* Se guarda también en la vista del zoom del usuario (mapzoom.js) para que el zoom y el arrastre sigan desde aquí. */
    this.view.z = zoom; this.view.tx = tx; this.view.ty = ty;
    cv.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + zoom + ')'; this.camZoom = zoom;
  },
  release() { this.camZoom = 1; this.resetView(); },

  /* ---- avisos ---- */
  toast(text, color, ms, big) {
    const box = $('toast'); if (!box) return;
    const d = document.createElement('div'); d.className = 'toast' + (big ? ' big' : ''); d.textContent = text; if (color) d.style.borderColor = color, d.style.boxShadow = '0 0 22px ' + color;
    box.appendChild(d); while (box.children.length > 3) box.removeChild(box.firstChild);
    setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 400); }, ms || 1500);
  },
  announce(text, color, ms, big) {
    this.toast(text, color, ms, big);
    return this.fast ? Promise.resolve() : new Promise(r => setTimeout(r, Math.min(ms || 700, 800)));
  },

  /* ---- dibujo de fichas con animación ---- */
  drawUnits() {
    this.syncAnim(); const c = this.ctx, now = this.now();
    if (this.vb) this.victoriaTick(now);
    // estelas
    for (const r of this.rects) {
      const a = this.anim[r.id]; if (!a) continue;
      if (a.moving && now - a.t0 >= a.d) { a.moving = false; a.trail = now + 650; }
      const cur = this.pos(a, now); const u = G.units[r.id]; if (!u) continue;
      const showing = a.moving || now < a.trail; if (!showing || Math.hypot(a.tx - a.ox, a.ty - a.oy) < 8) { if (!a.moving && now >= a.trail) { a.ox = a.tx; a.oy = a.ty; } continue; }
      const col = isZedSide(u) ? '255,90,70' : '110,230,110', al = a.moving ? .85 : Math.max(0, (a.trail - now) / 650) * .85;
      c.save(); c.strokeStyle = 'rgba(' + col + ',' + al + ')'; c.fillStyle = c.strokeStyle; c.lineWidth = 7; c.setLineDash([16, 10]); c.lineCap = 'round';
      c.beginPath(); c.moveTo(a.ox, a.oy); c.lineTo(cur.x, cur.y); c.stroke(); c.setLineDash([]);
      const ang = Math.atan2(cur.y - a.oy, cur.x - a.ox), ax = a.moving ? cur.x : a.tx, ay = a.moving ? cur.y : a.ty;
      c.translate(ax, ay); c.rotate(ang); c.beginPath(); c.moveTo(-6, -16); c.lineTo(22, 0); c.lineTo(-6, 16); c.closePath(); c.fill(); c.restore();
    }
    for (const g of this.ghosts) {
      const t = (now - g.t0) / g.d; if (t >= 1) continue;
      c.save(); c.globalAlpha = 1 - t; this.drawUnit(g.u, { x: g.x, y: g.y, w: g.w, h: g.h, scale: 1 - t * .45 }); c.restore();
    }
    this.ghosts = this.ghosts.filter(g => now - g.t0 < g.d);
    for (const r of this.rects) {
      const u = G.units[r.id], a = this.anim[r.id]; if (!u || !a) continue;
      let cur = this.pos(a, now); let scale = 1, glow = null;
      if (a.moving) { scale = 1.22; glow = isZedSide(u) ? '#ff3b2a' : '#4cff6a'; }
      if (a.born && now - a.born < 650) { const t = (now - a.born) / 650; scale = this.ease(t) * (1 + .25 * Math.sin(Math.PI * t)); glow = isZedSide(u) ? '#ff3b2a' : '#4cff6a'; }
      const bp = this.vb && this.victoriaPos(r.id, now); if (bp) { cur = bp.p; scale = bp.s; glow = bp.g; }
      this.drawUnitFx(u, Object.assign({}, r, { x: cur.x, y: cur.y, scale, glow }));
    }
    // ondas
    for (const f of this.fx) { const t = (now - f.t0) / f.d; if (t >= 1) continue; c.save(); this.drawFx(f, t); c.restore(); }
    this.fx = this.fx.filter(f => now - f.t0 < f.d);
    // peligro
    const pt = (Math.sin(now / 220) + 1) / 2;
    const dang = {};
    for (const rt of G.routes) { const L = lastOf(rt); for (const k of [L, L - 1]) if (k >= 1 && zedsAt(rt + k).length) { dang[rt + k] = k === L ? 2 : 1; } }
    for (const id in dang) { const s = G.spaces[id]; c.save(); c.strokeStyle = 'rgba(255,40,30,' + (.35 + .5 * pt) + ')'; c.lineWidth = dang[id] === 2 ? 11 : 6; c.beginPath(); c.arc(s.x, s.y, 74 + pt * 6, 0, 7); c.stroke(); if (dang[id] === 2) { c.fillStyle = 'rgba(255,40,30,' + (.15 + .2 * pt) + ')'; c.fill(); } c.restore(); }
    for (const id in dang) if (dang[id] === 2 && !this.dangerSet[id] && G.turnNo > 0) this.toast('⚠ ¡Peligro! Zeds junto al Centro (' + ROUTES[sp(id).route].short + ')', '#ff3b2a', 2200, true);
    this.dangerSet = dang; this._needLoop = Object.keys(dang).length > 0;
    this.setDanger(this._needLoop || chaosLow());
  },
  /* ---- efectos de combate ----
     Por unidad (ufx): temblor (Impacto), volteo (cambio de cara) y embestida (inicio del Cuerpo a Cuerpo).
     En el mapa (fx): texto flotante, destello, escudo, estallido, trazadora, choque, dado y cruz del Hospital.
     Todas las duraciones se multiplican por «slow». */
  ufx: {},
  D(ms) { return ms * this.slow; },
  unitXY(u) {
    if (!u) return null;
    const a = this.anim[u.id]; if (a) return this.pos(a, this.now());
    const r = this.rects.find(x => x.id === u.id); if (r) return { x: r.x, y: r.y };
    const s = u.space && G.spaces && G.spaces[u.space]; return s ? { x: s.x, y: s.y } : null;
  },
  fxWait(ms) { if (this.fast) return Promise.resolve(); this.redraw(); return new Promise(r => setTimeout(r, this.D(ms))); },
  fxText(x, y, text, col, size, d) { this.fx.push({ kind: 'text', x, y, text, col, size: size || 40, t0: this.now(), d: this.D(d || 1100) }); },
  fxFocus(id, zoom) { if (this.camOn && !this.fast && id && G.spaces[id]) this.focus(id, zoom || 1.9); },
  async fxHit(u) {
    const p = this.unitXY(u); if (!p || this.fast) return;
    if (isZedSide(u)) Sfx.zed();
    (this.ufx[u.id] = this.ufx[u.id] || {}).shake = { t0: this.now(), d: this.D(420) };
    this.fx.push({ kind: 'flash', x: p.x, y: p.y, col: '255,59,42', t0: this.now(), d: this.D(320) });
    this.fxText(p.x, p.y - 44, '−1', '#ff5a44', 48);
    await this.fxWait(460);
  },
  async fxFlip(u, before, label, col) {
    const p = this.unitXY(u); if (!p || this.fast) return;
    (this.ufx[u.id] = this.ufx[u.id] || {}).flip = { t0: this.now(), d: this.D(760), from: before };
    this.fxText(p.x, p.y - 50, label || 'Fuerza reducida', col || '#ffb347', 34, 1300);
    await this.fxWait(820);
  },
  async fxResist(u, roll, label) {
    Sfx.dice(); const p = this.unitXY(u); if (!p || this.fast) return;
    this.fx.push({ kind: 'shield', x: p.x, y: p.y, roll, t0: this.now(), d: this.D(900) });
    this.fxText(p.x, p.y - 58, (label || 'Resiste') + ' (' + roll + ')', '#8fd0ff', 32, 1200);
    await this.fxWait(760);
  },
  async fxBoom(u, label) {
    const p = this.unitXY(u); if (!p || this.fast) return;
    const parts = []; for (let i = 0; i < 22; i++) { const a = Math.random() * Math.PI * 2, v = 60 + Math.random() * 110; parts.push({ vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: 5 + Math.random() * 8 }); }
    const zed = isZedSide(u); if (zed) Sfx.zed();
    this.fx.push({ kind: 'burst', x: p.x, y: p.y, col: zed ? '255,120,60' : '230,230,230', parts, t0: this.now(), d: this.D(800) });
    this.fxText(p.x, p.y - 50, label || (zed ? 'Eliminado' : 'Al Cementerio'), zed ? '#ffd54a' : '#ff7a66', 36, 1300);
    await this.fxWait(700);
  },
  /* Disparo: trazadora del tirador al objetivo, fogonazo en la boca y destello al llegar */
  async fxShot(u, targetId, dist) {
    if (this.fast) { Sfx.shot(dist); return; } const p1 = this.unitXY(u), tz = zedsAt(targetId)[0], p2 = tz ? this.unitXY(tz) : (G.spaces[targetId] && { x: G.spaces[targetId].x, y: G.spaces[targetId].y });
    if (!p1 || !p2) { Sfx.shot(dist); return; }
    this.fxFocus(targetId, 1.7); await this.fxWait(250); Sfx.shot(dist);
    this.fx.push({ kind: 'tracer', x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, t0: this.now(), d: this.D(700) });
    await this.fxWait(700);
  },
  /* Inicio del Cuerpo a Cuerpo: el atacante embiste hacia el defensor y salta un choque en el espacio */
  async fxClash(space, atk, def) {
    if (this.fast || !G.spaces[space]) return; const s = G.spaces[space];
    this.fxFocus(space, 2.1); await this.fxWait(300);
    const pa = this.unitXY(atk), pd = this.unitXY(def);
    if (atk && pa && pd) { const dx = pd.x - pa.x, dy = pd.y - pa.y, L = Math.hypot(dx, dy) || 1, k = Math.min(L * .6, 46); (this.ufx[atk.id] = this.ufx[atk.id] || {}).lunge = { t0: this.now(), d: this.D(520), dx: dx / L * k, dy: dy / L * k }; }
    await this.fxWait(260);
    for (const u of unitsAt(space)) (this.ufx[u.id] = this.ufx[u.id] || {}).shake = { t0: this.now(), d: this.D(380) };
    this.fx.push({ kind: 'clash', x: s.x, y: s.y - 10, t0: this.now(), d: this.D(800) });
    await this.fxWait(620);
  },
  /* Tirada de Salvación: dado con el resultado; verde si se salva, rojo si no */
  async fxSave(u, roll, ok, bonus) {
    Sfx.dice(); const p = this.unitXY(u); if (!p || this.fast) return;
    this.fx.push({ kind: 'die', x: p.x, y: p.y - 6, roll, ok, t0: this.now(), d: this.D(1100) });
    this.fxText(p.x, p.y - 66, 'Salvación ' + roll + (bonus ? '+' + bonus : '') + (ok ? ' ✓' : ' ✗'), ok ? '#7bd45a' : '#ff5a44', 32, 1300);
    await this.fxWait(950);
  },
  async fxHospital(u) {
    const p = this.unitXY(u); if (!p || this.fast) return;
    this.fx.push({ kind: 'cross', x: p.x, y: p.y, t0: this.now(), d: this.D(1000) });
    this.fxText(p.x, p.y - 52, 'Hospital', '#ff8a8a', 32, 1200);
    await this.fxWait(800);
  },
  /* Curación: +1 verde; si recupera la cara completa, volteo inverso; si sale del coma, aviso */
  fxHeal(u, before) {
    const p = this.unitXY(u); if (!p || this.fast) return Promise.resolve();
    this.fx.push({ kind: 'flash', x: p.x, y: p.y, col: '95,211,90', t0: this.now(), d: this.D(500) });
    if (before && before.flipped && !u.flipped) return this.fxFlip(u, before, 'Fuerza completa', '#7bd45a');
    this.fxText(p.x, p.y - 46, before && before.ecg && !u.ecg ? 'Sale del coma' : '+1 ♥', '#7bd45a', before && before.ecg ? 32 : 44);
    return this.fxWait(600);
  },
  /* Infección: número flotante junto al marcador del panel */
  fxInf(n) {
    if (this.fast || !n) return; const b = $('infv'); if (!b) return;
    const r = b.getBoundingClientRect(), d = document.createElement('div');
    d.className = 'inffx ' + (n > 0 ? 'up' : 'down') + (n > 0 && G.inf >= 10 ? ' danger' : '');
    d.textContent = (n > 0 ? '+' : '−') + Math.abs(n) + ' Infección'; d.style.left = (r.right + 8) + 'px'; d.style.top = (r.top - 2 + 22 * document.querySelectorAll('.inffx').length) + 'px'; d.style.animationDuration = (1.6 * this.slow) + 's';
    document.body.appendChild(d); setTimeout(() => d.remove(), 1700 * this.slow);
    b.classList.add(n > 0 ? 'pulse' : 'pulsedown'); b.style.animationDuration = (.9 * this.slow) + 's';
  },
  drawFx(f, t) {
    const c = this.ctx;
    if (f.kind === 'text') {
      const y = f.y - this.ease(Math.min(1, t * 1.4)) * 60; c.globalAlpha = t < .7 ? 1 : (1 - t) / .3;
      c.font = '900 ' + f.size + 'px Impact, "Arial Black", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.lineWidth = 8; c.strokeStyle = '#000'; c.strokeText(f.text, f.x, y); c.fillStyle = f.col; c.fillText(f.text, f.x, y);
    } else if (f.kind === 'flash') {
      const g = c.createRadialGradient(f.x, f.y, 0, f.x, f.y, 70); g.addColorStop(0, 'rgba(' + f.col + ',' + (.75 * (1 - t)) + ')'); g.addColorStop(1, 'rgba(' + f.col + ',0)');
      c.fillStyle = g; c.beginPath(); c.arc(f.x, f.y, 70, 0, 7); c.fill();
    } else if (f.kind === 'shield') {
      const s = t < .25 ? this.ease(t / .25) * 1.15 : 1.15 - .15 * Math.min(1, (t - .25) / .2);
      c.globalAlpha = t < .75 ? 1 : (1 - t) / .25; c.translate(f.x, f.y); c.scale(s, s);
      c.beginPath(); c.moveTo(0, -46); c.lineTo(40, -30); c.lineTo(34, 16); c.quadraticCurveTo(22, 36, 0, 48); c.quadraticCurveTo(-22, 36, -34, 16); c.lineTo(-40, -30); c.closePath();
      c.fillStyle = 'rgba(40,110,200,.78)'; c.fill(); c.lineWidth = 5; c.strokeStyle = '#dff0ff'; c.stroke();
      c.font = '900 40px Impact, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff'; c.fillText(String(f.roll), 0, 2);
    } else if (f.kind === 'burst') {
      const e = this.ease(t);
      if (t < .35) { const g = c.createRadialGradient(f.x, f.y, 0, f.x, f.y, 110); g.addColorStop(0, 'rgba(255,240,200,' + (1 - t / .35) + ')'); g.addColorStop(1, 'rgba(255,120,40,0)'); c.fillStyle = g; c.beginPath(); c.arc(f.x, f.y, 110, 0, 7); c.fill(); }
      c.globalAlpha = 1 - t;
      for (const p of f.parts) { c.fillStyle = 'rgba(' + f.col + ',1)'; c.beginPath(); c.arc(f.x + p.vx * e, f.y + p.vy * e + 40 * t * t, p.r * (1 - t * .7), 0, 7); c.fill(); }
      c.strokeStyle = 'rgba(' + f.col + ',1)'; c.lineWidth = 6 * (1 - t) + 1; c.beginPath(); c.arc(f.x, f.y, 30 + e * 110, 0, 7); c.stroke();
    } else if (f.kind === 'tracer') {
      const fly = .55, e = Math.min(1, t / fly), hx = f.x1 + (f.x2 - f.x1) * e, hy = f.y1 + (f.y2 - f.y1) * e;
      if (t < .22) { const g = c.createRadialGradient(f.x1, f.y1, 0, f.x1, f.y1, 46); g.addColorStop(0, 'rgba(255,240,160,' + (1 - t / .22) + ')'); g.addColorStop(1, 'rgba(255,170,40,0)'); c.fillStyle = g; c.beginPath(); c.arc(f.x1, f.y1, 46, 0, 7); c.fill(); }
      if (t < fly + .15) { const tail = Math.max(0, e - .35), tx = f.x1 + (f.x2 - f.x1) * tail, ty = f.y1 + (f.y2 - f.y1) * tail;
        const g = c.createLinearGradient(tx, ty, hx, hy); g.addColorStop(0, 'rgba(255,220,120,0)'); g.addColorStop(1, 'rgba(255,240,170,' + (t < fly ? 1 : 1 - (t - fly) / .15) + ')');
        c.shadowColor = '#ffcf5a'; c.shadowBlur = 18; c.strokeStyle = g; c.lineWidth = 12; c.lineCap = 'round'; c.beginPath(); c.moveTo(tx, ty); c.lineTo(hx, hy); c.stroke(); c.shadowBlur = 0;
        if (t < fly) { c.fillStyle = '#fff6c8'; c.beginPath(); c.arc(hx, hy, 10, 0, 7); c.fill(); } }
      if (t >= fly) { const k = (t - fly) / (1 - fly), g = c.createRadialGradient(f.x2, f.y2, 0, f.x2, f.y2, 30 + 60 * k); g.addColorStop(0, 'rgba(255,230,150,' + (1 - k) + ')'); g.addColorStop(1, 'rgba(255,90,40,0)'); c.fillStyle = g; c.beginPath(); c.arc(f.x2, f.y2, 30 + 60 * k, 0, 7); c.fill(); }
    } else if (f.kind === 'clash') {
      const s = t < .2 ? this.ease(t / .2) * 1.3 : 1.3 - .3 * Math.min(1, (t - .2) / .3);
      c.strokeStyle = 'rgba(255,150,60,' + (1 - t) + ')'; c.lineWidth = 10 * (1 - t) + 2; c.beginPath(); c.arc(f.x, f.y, 30 + this.ease(t) * 120, 0, 7); c.stroke();
      c.globalAlpha = t < .7 ? 1 : (1 - t) / .3; c.translate(f.x, f.y); c.scale(s, s);
      c.font = '900 84px "Segoe UI Emoji", "Segoe UI Symbol", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 8; c.strokeStyle = '#000'; c.strokeText('⚔', 0, 0); c.fillStyle = '#ffd54a'; c.fillText('⚔', 0, 0);
    } else if (f.kind === 'die') {
      const s = t < .2 ? this.ease(t / .2) * 1.1 : 1.1 - .1 * Math.min(1, (t - .2) / .2), rot = t < .2 ? (1 - t / .2) * 1.6 : 0;
      c.globalAlpha = t < .8 ? 1 : (1 - t) / .2; c.translate(f.x, f.y); c.rotate(rot); c.scale(s, s);
      c.shadowColor = f.ok ? '#5fd35a' : '#ff3b2a'; c.shadowBlur = 30; c.fillStyle = '#f3ead2'; rr(c, -30, -30, 60, 60, 12); c.fill(); c.shadowBlur = 0;
      c.lineWidth = 4; c.strokeStyle = f.ok ? '#3a9a36' : '#b02a1c'; rr(c, -30, -30, 60, 60, 12); c.stroke();
      c.font = '900 40px Impact, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#111'; c.fillText(String(f.roll), 0, 2);
    } else if (f.kind === 'cross') {
      const s = t < .25 ? this.ease(t / .25) : 1; c.globalAlpha = t < .7 ? 1 : (1 - t) / .3; c.translate(f.x, f.y); c.scale(s, s);
      c.shadowColor = '#ff3b2a'; c.shadowBlur = 24; c.fillStyle = '#fff'; c.fillRect(-15, -39, 30, 78); c.fillRect(-39, -15, 78, 30); c.shadowBlur = 0;
      c.fillStyle = '#d93a2b'; c.fillRect(-10, -34, 20, 68); c.fillRect(-34, -10, 68, 20);
    } else {
      c.globalAlpha = (1 - t) * .9; c.strokeStyle = f.col; c.lineWidth = 8 * (1 - t) + 2; c.beginPath(); c.arc(f.x, f.y, 20 + t * 80, 0, 7); c.stroke();
    }
  },
  /* dibuja la ficha aplicando temblor, embestida y volteo; durante la primera mitad del volteo se ve la cara anterior */
  drawUnitFx(u, o) {
    const e = this.ufx[u.id]; if (!e) return this.drawUnit(u, o);
    const now = this.now(), c = this.ctx; let x = o.x, y = o.y, sx = 1, face = null;
    if (e.shake) { const t = (now - e.shake.t0) / e.shake.d; if (t < 1) { x += Math.sin(t * Math.PI * 9) * 12 * (1 - t); o.glow = '#ff3b2a'; } else delete e.shake; }
    if (e.lunge) { const t = (now - e.lunge.t0) / e.lunge.d; if (t < 1) { const k = t < .45 ? this.ease(t / .45) : 1 - this.ease((t - .45) / .55); x += e.lunge.dx * k; y += e.lunge.dy * k; o.scale = (o.scale || 1) * (1 + .15 * k); o.glow = '#ffb347'; } else delete e.lunge; }
    if (e.flip) { const t = (now - e.flip.t0) / e.flip.d; if (t < 1) { sx = Math.max(.05, Math.abs(Math.cos(Math.PI * t))); if (t < .5) face = e.flip.from; o.glow = '#ffb347'; o.scale = (o.scale || 1) * (1 + .18 * Math.sin(Math.PI * t)); } else delete e.flip; }
    if (!e.shake && !e.flip && !e.lunge) delete this.ufx[u.id];
    let keep = null; if (face) { keep = { flipped: u.flipped, hits: u.hits, ecg: u.ecg }; Object.assign(u, face); }
    c.save(); c.translate(x, y); c.scale(sx, 1); c.translate(-x, -y); this.drawUnit(u, Object.assign({}, o, { x, y })); c.restore();
    if (keep) Object.assign(u, keep);
  },

  /* ---- baile de la victoria ----
     Al ganar, las fichas de jugador bailan al ritmo de la música (los Zeds se quedan quietos). Coreografía, medida en pulsos:
     1) cada ficha salta en el sitio; 2) salta de espacio en espacio por la ciudad hasta el Centro; 3) ya en el Centro,
     parejas de fichas intercambian sitio en cada pulso. Al acabar, vuelven a su espacio del tablero.
     Los pulsos vienen de la pista: un analizador de graves detecta los golpes; sin sonido (o si no detecta nada), marca 120 BPM.
     Se puede saltar con cualquier clic o tecla. */
  victoriaBaile(audio) {
    return new Promise(res => {
      /* Solo bailan las fichas de jugador: los Zeds se quedan donde están. */
      const rs = this.rects.filter(r => G.units[r.id] && this.anim[r.id] && !isZedSide(G.units[r.id]));
      if (this.fast || !rs.length) return res();
      const now0 = this.now(), n = rs.length, cols = Math.ceil(Math.sqrt(n)), rows = Math.ceil(n / cols);
      const sz = Math.max(...rs.map(r => Math.max(r.w, r.h))), gap = sz * .9;
      const B = this.vb = { t0: now0, ms: audio ? 300000 : 16000, audio, ivl: 500, last: 0, hist: [], avg: 0, beats: 0, abeats: 0, beatT: now0, prev: null, from: {}, to: {}, hops: {}, endB: 0, an: null, buf: null, fin: res };
      /* Casilla de cada ficha alrededor del Centro (rejilla). */
      const slot = i => ({ x: CENTRO.x + (i % cols - (cols - 1) / 2) * gap, y: CENTRO.y + (Math.floor(i / cols) - (rows - 1) / 2) * gap });
      /* STAY: saltos en el sitio en cada casilla (mínimo 10). SWAPS: pulsos de intercambio en el Centro, de sobra para toda la canción. */
      const STAY = 10, MAX_PATH = 8, ARC_A = 34, ARC_B = 46, ARC_C = 40, SWAPS = 600;
      /* Fases 1 y 2: en cada casilla salta en el sitio STAY veces, luego salta a la siguiente, y así hasta su casilla del Centro. */
      let tEnd = 0;
      rs.forEach((r, i) => {
        const from = this.pos(this.anim[r.id], now0), hops = [];
        let p = from, t = 0; /* todas arrancan a la vez, en pulsos enteros */
        const salto = (q, arc) => { hops.push({ t, x0: p.x, y0: p.y, x1: q.x, y1: q.y, arc }); p = q; t += 1; };
        const ruta = this.victoriaRuta(G.units[r.id].space).slice(-MAX_PATH);
        if (!ruta.length) ruta.push(CENTRO);
        ruta[ruta.length - 1] = slot(i); /* el último salto cae en la casilla de la ficha, no en el hueco del Centro */
        for (const q of ruta) { for (let k = 0; k < STAY; k++) salto(p, ARC_A); salto(q, ARC_B); }
        for (let k = 0; k < STAY; k++) salto(p, ARC_A); /* en su casilla final también salta antes de los intercambios */
        B.from[r.id] = from; B.hops[r.id] = hops; tEnd = Math.max(tEnd, t);
      });
      /* Fase 3: en el Centro, en cada pulso intercambian sitio las parejas de casillas (pares e impares alternos). */
      const T = Math.ceil(tEnd), arr = rs.map(r => r.id);
      /* Hasta T, cada ficha que termina antes sigue saltando en su casilla, para que todas empiecen los intercambios a la vez. */
      for (const id of arr) { const hs = B.hops[id], L = hs[hs.length - 1]; for (let t = L.t + 1; t < T; t++) hs.push({ t, x0: L.x1, y0: L.y1, x1: L.x1, y1: L.y1, arc: ARC_A }); }
      /* Cada pulso de intercambio: pares de casillas alternos. Cada ficha recibe exactamente un salto por pulso (con o sin cambio). */
      for (let k = 0; k < SWAPS; k++) {
        const par = k % 2, next = arr.slice();
        for (let s = 0; s < n; s++) {
          const partner = (s + par) % 2 === 0 ? s + 1 : s - 1, id = arr[s], a = slot(s);
          const ok = partner >= 0 && partner < n, b = ok ? slot(partner) : a;
          B.hops[id].push({ t: T + k, x0: a.x, y0: a.y, x1: b.x, y1: b.y, arc: ok ? ARC_C : ARC_A });
          if (ok) next[partner] = id;
        }
        arr.splice(0, n, ...next);
      }
      arr.forEach((id, s) => { B.to[id] = slot(s); }); /* posición final: desde aquí vuelven al tablero */
      B.endB = T + SWAPS + 1;
      try {
        if (audio) {
          const AC = window.AudioContext || window.webkitAudioContext, ctx = this._vctx || (this._vctx = new AC());
          if (ctx.state === 'suspended') ctx.resume();
          const src = audio._vsrc || (audio._vsrc = ctx.createMediaElementSource(audio));
          const an = ctx.createAnalyser(); an.fftSize = 256; src.connect(an); an.connect(ctx.destination);
          B.an = an; B.buf = new Float32Array(an.frequencyBinCount); B.prev = new Float32Array(an.frequencyBinCount);
        }
      } catch (e) { B.an = null; }
      /* Mapa de beats pregenerado (ver tools/generar_beats.py): si carga, los pulsos salen del reloj del audio; si no, se detectan en vivo. */
      if (audio) fetch('assets/sonidos/musica/musica_victoria.beats.json').then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(j => { if (this.vb === B) { B.map = j.beats; B.pre = j.entrada != null ? j.beats.filter(t => t < j.entrada).length : 0; } }).catch(() => { });
      const skip = () => this.victoriaFin();
      B.skip = skip; document.addEventListener('pointerdown', skip, true); document.addEventListener('keydown', skip, true);
      this.redraw();
    });
  },
  /* Camino de espacios desde un espacio hasta el Centro (BFS por la adyacencia del tablero). Devuelve coordenadas, terminando en el Centro. */
  victoriaRuta(from) {
    if (!from || !G.spaces[from]) return [CENTRO];
    if (from === 'C') return [];
    const prev = { [from]: null }, q = [from]; let found = false;
    for (let k = 0; k < q.length && !found; k++) {
      let nb = []; try { nb = neighbors(q[k]); } catch (e) { }
      for (const x of nb) { if (x in prev || !G.spaces[x]) continue; prev[x] = q[k]; if (x === 'C') { found = true; break; } q.push(x); }
    }
    if (!found) return [CENTRO];
    const ids = []; for (let c = 'C'; c !== from; c = prev[c]) ids.unshift(c);
    return ids.map(id => id === 'C' ? CENTRO : G.spaces[id]);
  },
  /* Cada golpe es un pulso: mide el tempo con la mediana de los últimos intervalos (entre 60 y 210 BPM). */
  victoriaGolpe(now) {
    const B = this.vb; if (B.last) { const d = now - B.last; if (d > 280 && d < 1000) { B.hist.push(d); if (B.hist.length > 8) B.hist.shift(); const s = [...B.hist].sort((a, b) => a - b); B.ivl = s[s.length >> 1]; } }
    B.last = now; B.beats++; B.beatT = now;
  },
  /* Tiempo de la coreografía en pulsos: 0 en el primer golpe, con la fracción dentro del pulso actual. */
  victoriaBeat(now) {
    const B = this.vb;
    /* Con mapa: el reloj es el tiempo de la pista (entre dos golpes se interpola). */
    if (B.map && B.audio && !B.audio.paused) {
      const t = B.audio.currentTime, m = B.map; let lo = 0, hi = m.length - 1, k = -1;
      while (lo <= hi) { const c = (lo + hi) >> 1; if (m[c] <= t) { k = c; lo = c + 1; } else hi = c - 1; }
      if (k < 0) return -1;
      const nx = k + 1 < m.length ? m[k + 1] : m[k] + .45;
      /* Corte de batería (hueco sin pulsos): las fichas se quedan quietas en el último pulso hasta el siguiente. */
      if (nx - m[k] > .7) return k;
      return k + Math.min(1, (t - m[k]) / (nx - m[k]));
    }
    if (!B.beats) return -1;
    return (B.beats - 1) + Math.min(1, Math.max(0, (now - B.beatT) / B.ivl));
  },
  /* Cada cuadro: sin mapa, busca golpes en los graves; si no los hay (sin sonido, o pista muda), marca el pulso a 120 BPM. */
  victoriaTick(now) {
    const B = this.vb;
    if (B.audio && B.audio.ended) return this.victoriaFin();
    if (now - B.t0 >= B.ms) return this.victoriaFin();
    /* Con mapa, la coreografía dura lo que suene la pista (termina en audio.ended o al saltar). */
    if (B.map && B.audio && !B.audio.paused) return;
    if (B.an) {
      /* Flujo espectral: cuánto sube la energía de los graves respecto al cuadro anterior (en dB, así no se satura con bajos sostenidos). */
      B.an.getFloatFrequencyData(B.buf); let fl = 0;
      for (let i = 1; i <= 6; i++) { const v = Math.max(-140, B.buf[i]), d = v - B.prev[i]; if (d > 0) fl += d; B.prev[i] = v; }
      B.avg = B.avg * .9 + fl * .1;
      if (fl > B.avg * 1.8 + 3 && now - B.last > 280) { B.abeats++; this.victoriaGolpe(now); }
    }
    if (!B.abeats && now - B.t0 > (B.an ? 1500 : 0) && now - B.last >= 500) this.victoriaGolpe(now);
    if (this.victoriaBeat(now) >= B.endB) this.victoriaFin();
  },
  /* Posición, escala y brillo de una ficha en el pulso actual (null si no baila). Cada salto es un arco entre dos puntos. */
  victoriaPos(id, now) {
    const B = this.vb, hs = B.hops[id], f = B.from[id]; if (!hs || !f) return null;
    /* Antes de la entrada de la batería (B.pre pulsos) las fichas solo saltan en su casilla, sin desplazarse. */
    const b0 = this.victoriaBeat(now), b = b0 - (B.pre || 0);
    if (b0 < 0 || b < 0) { const ph = b0 < 0 ? 0 : b0 - Math.floor(b0); return { p: { x: f.x, y: f.y - Math.abs(Math.sin(Math.PI * ph)) * 34 }, s: 1, g: null }; }
    let x = f.x, y = f.y, cur = null, last = null;
    /* Los saltos son consecutivos (uno por pulso): el índice sale directo, sin recorrer la lista. */
    const i0 = Math.floor(b - hs[0].t);
    if (i0 >= 0 && i0 < hs.length) cur = hs[i0];
    else if (i0 >= hs.length) last = hs[hs.length - 1];
    if (cur) { const q = b - cur.t; x = cur.x0 + (cur.x1 - cur.x0) * q; y = cur.y0 + (cur.y1 - cur.y0) * q - Math.sin(Math.PI * q) * cur.arc; }
    else if (last) { x = last.x1; y = last.y1; }
    const ph = b - Math.floor(b);
    if (!cur && last) y -= Math.abs(Math.sin(Math.PI * ph)) * 12; /* parada: sigue latiendo con el pulso */
    return { p: { x, y }, s: cur ? 1.1 : 1, g: cur ? '#ffd54a' : null };
  },
  /* Fin del baile: las fichas vuelven a su espacio en el tablero y, cuando terminan, se resuelve la promesa. */
  victoriaFin() {
    const B = this.vb; if (!B) return;
    this.vb = null; document.removeEventListener('pointerdown', B.skip, true); document.removeEventListener('keydown', B.skip, true);
    const now = this.now();
    for (const r of this.rects) {
      const a = this.anim[r.id]; if (!a || !B.to[r.id]) continue;
      a.fx = a.ox = B.to[r.id].x; a.fy = a.oy = B.to[r.id].y; a.t0 = now; a.d = this.dur(); a.moving = true;
    }
    this.redraw();
    this.settle(1500).then(B.fin);
  },

  /* bucle de dibujo mientras haya animaciones o peligro. Si solo late el aviso de peligro, unos 20 fps bastan:
     redibujar el mapa entero a 60 fps sin necesidad hace que el zoom y el arrastre vayan a tirones en tablets. */
  redraw() {
    if (!this.ctx || !G.spaces) return;
    if (this._loop) return; this._loop = true;
    const step = () => {
      this.draw();
      if (this.isAnimating() || this.flash) requestAnimationFrame(step);
      else if (this._needLoop) setTimeout(() => requestAnimationFrame(step), 45);
      else this._loop = false;
    };
    requestAnimationFrame(step);
  }
});
