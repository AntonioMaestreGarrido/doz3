/* Zoom propio del mapa, independiente del zoom de la página: botones +/−, rueda, pellizco y arrastre para desplazarse. Se carga después de anim.js. */
'use strict';

Object.assign(ui, {
  view: { z: 1, tx: 0, ty: 0 },
  MAXZ: 4,
  _axis(t, o, c, w, z) { const size = c * z; return size <= w ? (w - size) / 2 - o : Math.min(-o, Math.max(w - o - size, t)); },
  clampView() {
    const v = this.view, cv = this.canvas, w = $('mapwrap'); if (!cv || !w) return;
    v.z = Math.min(this.MAXZ, Math.max(1, v.z));
    v.tx = this._axis(v.tx, cv.offsetLeft, cv.clientWidth, w.clientWidth, v.z);
    v.ty = this._axis(v.ty, cv.offsetTop, cv.clientHeight, w.clientHeight, v.z);
  },
  applyView() {
    const v = this.view, cv = this.canvas; if (!cv) return;
    cv.style.transform = v.z > 1.001 ? 'translate(' + v.tx + 'px,' + v.ty + 'px) scale(' + v.z + ')' : '';
    const r = $('zReset'); if (r) r.classList.toggle('on', v.z > 1.001);
  },
  release() { this.camZoom = 1; this.resetView(); },
  /* Cambia el zoom manteniendo fijo el punto (px, py), en coordenadas del contenedor del mapa. */
  zoomAt(factor, px, py) {
    const v = this.view, cv = this.canvas, w = $('mapwrap'); if (this.camZoom > 1) this.camZoom = 1;
    if (px === undefined) { px = w.clientWidth / 2; py = w.clientHeight / 2; }
    const nz = Math.min(this.MAXZ, Math.max(1, v.z * factor)); if (nz === v.z) return;
    const lx = (px - cv.offsetLeft - v.tx) / v.z, ly = (py - cv.offsetTop - v.ty) / v.z;
    v.z = nz; v.tx = px - cv.offsetLeft - nz * lx; v.ty = py - cv.offsetTop - nz * ly;
    this.clampView(); this.applyView();
  },
  /* Desplaza la vista (sin cambiar el zoom) para centrar un espacio. El CSS de #map anima el movimiento. */
  panTo(id) {
    const cv = this.canvas, w = $('mapwrap'), s = G.spaces && G.spaces[id]; if (!cv || !w || !s) return;
    const k = cv.clientWidth / cv.width, v = this.view;
    v.tx = w.clientWidth / 2 - cv.offsetLeft - s.x * k * v.z; v.ty = w.clientHeight / 2 - cv.offsetTop - s.y * k * v.z;
    this.clampView(); this.applyView();
  },
  /* Acerca el mapa para ver una ruta entera (o el Centro, con r = 'C'). Usa la misma vista que el zoom del usuario. */
  zoomToRoute(r) {
    const cv = this.canvas, w = $('mapwrap'); if (!cv || !w || !G.spaces) return;
    /* Centro: el Centro, los espacios n.º 1 de cada ruta (los que tocan el Centro) y el Hospital, las Oficinas y el Laboratorio. */
    const ids = r === 'C' ? Object.values(G.spaces).filter(s => s.id === 'C' || (s.route && spaceNum(s.id) === 1) || ['bed', 'office', 'lab'].includes(s.kind)).map(s => s.id) : Object.values(G.spaces).filter(s => s.route === r).map(s => s.id);
    if (!ids.length) { UI.toast('Esa ruta no está en esta partida', '#ffd54a', 1400); return; }
    const xs = ids.map(id => G.spaces[id].x), ys = ids.map(id => G.spaces[id].y), pad = 70;
    const minX = Math.min(...xs) - pad, maxX = Math.max(...xs) + pad, minY = Math.min(...ys) - pad, maxY = Math.max(...ys) + pad;
    const k = cv.clientWidth / cv.width, W = w.clientWidth, H = w.clientHeight;
    const z = Math.max(1, Math.min(this.MAXZ, W / ((maxX - minX) * k), H / ((maxY - minY) * k)));
    const cx = (minX + maxX) / 2 * k, cy = (minY + maxY) / 2 * k;
    this.camZoom = 1; const v = this.view;
    v.z = z; v.tx = W / 2 - cv.offsetLeft - cx * z; v.ty = H / 2 - cv.offsetTop - cy * z;
    this.clampView(); this.applyView();
  },
  resetView() { this.view.z = 1; this.view.tx = 0; this.view.ty = 0; this.clampView(); this.applyView(); },
  initMapZoom() {
    const cv = this.canvas, wrap = $('mapwrap'), self = this, ptrs = new Map();
    const local = e => { const r = wrap.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const still = () => { cv.style.transition = 'none'; };
    const live = () => { cv.style.transition = ''; };
    document.querySelectorAll('#routebtns button').forEach(b => b.onclick = () => self.zoomToRoute(b.dataset.route));
    $('zIn').onclick = () => self.zoomAt(1.5); $('zOut').onclick = () => self.zoomAt(1 / 1.5); $('zReset').onclick = () => self.resetView();
    /* Rueda y pellizco del trackpad envían decenas de eventos por segundo: cada uno reiniciaba la transición de .95 s (que arranca casi plana) y el mapa se quedaba congelado hasta soltar. Mientras llegan, sin transición. */
    let wheelT = null;
    cv.addEventListener('wheel', e => {
      e.preventDefault(); still(); clearTimeout(wheelT); wheelT = setTimeout(() => { wheelT = null; if (!ptrs.size) live(); }, 250);
      const p = local(e); self.zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), p.x, p.y);
    }, { passive: false });
    /* Tras arrastrar no debe dispararse el clic sobre una unidad o espacio. */
    cv.addEventListener('click', e => { if (performance.now() - (self._mapDragT || 0) < 350) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
    let moved = false, last = null, pinch = null;
    /* Los gestos (arrastrar, pellizcar) se leen en toda la zona del mapa, también si empiezan sobre un botón flotante:
       así el pellizco nunca hace zoom de la página (los botones no crecen) y siempre mueve el mapa. */
    wrap.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (e.pointerType === 'mouse' || !e.isPrimary && !ptrs.size) { ptrs.clear(); pinch = null; }
      if (e.isPrimary && ptrs.size) { ptrs.clear(); pinch = null; live(); }
      ptrs.set(e.pointerId, local(e)); moved = false; last = local(e);
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 }; moved = true; still(); }
    });
    wrap.addEventListener('pointermove', e => {
      if (!ptrs.has(e.pointerId)) return; const p = local(e); ptrs.set(e.pointerId, p);
      if (ptrs.size >= 2 && pinch) {
        const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y), cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
        const v = self.view; v.tx += cx - pinch.cx; v.ty += cy - pinch.cy;
        if (pinch.d > 10) self.zoomAt(d / pinch.d, cx, cy); else { self.clampView(); self.applyView(); }
        pinch = { d, cx, cy }; return;
      }
      if (self.view.z <= 1.001 || ptrs.size !== 1) return;
      if (!moved && Math.hypot(p.x - last.x, p.y - last.y) < 6) return;
      if (!moved) { moved = true; still(); try { cv.setPointerCapture(e.pointerId); } catch (x) { } last = p; cv.style.cursor = 'grabbing'; return; }
      self.view.tx += p.x - last.x; self.view.ty += p.y - last.y; last = p; self.clampView(); self.applyView();
    });
    const end = e => {
      if (!ptrs.delete(e.pointerId)) return;
      if (ptrs.size < 2) pinch = null;
      if (moved) { self._mapDragT = performance.now(); }
      if (!ptrs.size) { moved = false; if (!wheelT) live(); cv.style.cursor = ''; }
      else if (ptrs.size === 1) { last = [...ptrs.values()][0]; }
    };
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(n => wrap.addEventListener(n, end));
    /* Red de seguridad: si se pierde un pointerup/cancel (soltar fuera del mapa, gestos del sistema, cambio de pestaña) el estado queda atascado. */
    const reset = () => { ptrs.clear(); pinch = null; if (moved) self._mapDragT = performance.now(); moved = false; clearTimeout(wheelT); wheelT = null; live(); cv.style.cursor = ''; };
    /* La cámara guiada (anim.js focus) no debe mover el mapa mientras el jugador lo arrastra, pellizca o usa la rueda. */
    self.userBusy = () => ptrs.size > 0 || !!wheelT;
    ['pointerup', 'pointercancel'].forEach(n => window.addEventListener(n, e => { if (ptrs.has(e.pointerId)) end(e); }, true));
    ['touchend', 'touchcancel'].forEach(n => window.addEventListener(n, e => { if (!e.touches.length && ptrs.size) reset(); }, true));
    window.addEventListener('blur', reset); document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
    cv.addEventListener('mouseleave', () => { if (ptrs.size && !moved) reset(); });
    this.clampView(); this.applyView();
  }
});
