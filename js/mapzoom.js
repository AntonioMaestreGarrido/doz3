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
  release() { this.camZoom = 1; this.applyView(); },
  /* Cambia el zoom manteniendo fijo el punto (px, py), en coordenadas del contenedor del mapa. */
  zoomAt(factor, px, py) {
    const v = this.view, cv = this.canvas, w = $('mapwrap'); if (this.camZoom > 1) this.camZoom = 1;
    if (px === undefined) { px = w.clientWidth / 2; py = w.clientHeight / 2; }
    const nz = Math.min(this.MAXZ, Math.max(1, v.z * factor)); if (nz === v.z) return;
    const lx = (px - cv.offsetLeft - v.tx) / v.z, ly = (py - cv.offsetTop - v.ty) / v.z;
    v.z = nz; v.tx = px - cv.offsetLeft - nz * lx; v.ty = py - cv.offsetTop - nz * ly;
    this.clampView(); this.applyView();
  },
  resetView() { this.view.z = 1; this.view.tx = 0; this.view.ty = 0; this.clampView(); this.applyView(); },
  initMapZoom() {
    const cv = this.canvas, wrap = $('mapwrap'), self = this, ptrs = new Map();
    const local = e => { const r = wrap.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const still = () => { cv.style.transition = 'none'; };
    const live = () => { cv.style.transition = ''; };
    $('zIn').onclick = () => self.zoomAt(1.5); $('zOut').onclick = () => self.zoomAt(1 / 1.5); $('zReset').onclick = () => self.resetView();
    cv.addEventListener('wheel', e => { e.preventDefault(); const p = local(e); self.zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), p.x, p.y); }, { passive: false });
    /* Tras arrastrar no debe dispararse el clic sobre una unidad o espacio. */
    cv.addEventListener('click', e => { if (performance.now() - (self._mapDragT || 0) < 350) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
    let moved = false, last = null, pinch = null;
    cv.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      ptrs.set(e.pointerId, local(e)); moved = false; last = local(e);
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 }; moved = true; still(); }
    });
    cv.addEventListener('pointermove', e => {
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
      if (!ptrs.size) { moved = false; live(); cv.style.cursor = ''; }
      else if (ptrs.size === 1) { last = [...ptrs.values()][0]; }
    };
    ['pointerup', 'pointercancel'].forEach(n => cv.addEventListener(n, end));
    this.clampView(); this.applyView();
  }
});
