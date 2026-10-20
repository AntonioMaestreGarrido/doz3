/* Modo móvil: el mapa ocupa toda la pantalla y el resto de la interfaz va encima o al lado.
   - Arriba, una franja de estado (turno, fase, Infección, Munición, Suministros, Caos, Acciones) con ↶ Deshacer y el menú ☰.
   - Un panel con pestañas (Unidad · Rutas · Acciones · Evento · Mano · Registro): abajo en vertical (se pliega) y a la derecha en horizontal.
   - Botones ◀ ▶ para recorrer las unidades amigas (sin Refugiados, Aldeanos ni Trenes) y los Zeds, con la cámara a un zoom legible.
   - Pestaña Rutas: esquema de las cinco rutas (una fila por ruta, del Inicial al n.º 0), que se lee sin zoom; tocar una casilla lleva el mapa allí.
   - Flechas en el borde del mapa hacia los Zeds junto al Centro que quedan fuera de la vista.
   Se activa según Opciones.movil ('auto': teléfonos, por el lado corto de la pantalla). Tab y Mayús+Tab recorren las unidades también en escritorio. */
'use strict';

const MOB_TABS = [['unidad', 'Unidad', '👤'], ['rutas', 'Rutas', '🗺️'], ['acciones', 'Acciones', '⚡'], ['evento', 'Evento', '📜'], ['mano', 'Mano', '🃏'], ['registro', 'Registro', '📋']];
/* Sección (o secciones) de #side que se ven en cada pestaña. */
const MOB_SECTIONS = { unidad: ['unitbox'], rutas: ['radar'], acciones: ['actbox'], evento: ['status', 'eventbox'], mano: ['handbox'], registro: ['logbox'] };
/* Tamaño en pantalla (px) al que la cámara deja las fichas al enfocarlas, y zona táctil mínima. */
const MOB_TOKEN_PX = 46, MOB_TAP_PX = 40;

Object.assign(ui, {
  mob: false, mobTab: 'unidad', mobOpen: true, _mobFold: null, _zIdx: -1,
  /* ¿Disposición de móvil? Automática: pantallas con el lado corto de teléfono (táctiles hasta 620 px, cualquier puntero hasta 520 px). */
  mobWanted() {
    const o = typeof Opciones !== 'undefined' ? Opciones.movil : 'auto';
    if (o === 'on') return true; if (o === 'off') return false;
    const s = Math.min(innerWidth, innerHeight), coarse = matchMedia('(pointer:coarse)').matches;
    return s <= 520 || (coarse && s <= 620);
  },
  mobPortrait() { return innerHeight >= innerWidth; },
  /* Crea los elementos del modo móvil (una vez); se muestran u ocultan solo con la clase body.mob. */
  mobBuild() {
    if ($('hud')) return;
    const hd = document.querySelector('header');
    const hud = document.createElement('div'); hud.id = 'hud';
    hud.innerHTML = '<button id="hPl" hidden></button><span id="hPh"></span><span id="hStats"></span><button id="hUndo" title="Deshacer">↶</button><button id="hMenu" title="Menú" aria-label="Menú">☰</button>';
    hd.insertBefore(hud, hd.firstChild);
    $('hMenu').onclick = e => { e.stopPropagation(); hd.classList.toggle('open'); };
    $('hUndo').onclick = () => ui.undo();
    $('hPl').onclick = () => { if (G.busy || !$('modal').hidden || !multiP()) return; G.act = ((G.act || 0) + 1) % nPlayers(); ui.updateStats(); };
    /* El menú se cierra al usar cualquiera de sus botones o al tocar fuera. */
    hd.querySelector('nav').addEventListener('click', e => { if (e.target.closest('button')) hd.classList.remove('open'); });
    document.addEventListener('pointerdown', e => { if (hd.classList.contains('open') && !hd.contains(e.target)) hd.classList.remove('open'); }, true);

    const side = $('side');
    const tabs = document.createElement('div'); tabs.id = 'mtabs';
    tabs.innerHTML = MOB_TABS.map(([k, t, ic]) => '<button data-tab="' + k + '"><span class="ti">' + ic + '</span>' + t + '<i></i></button>').join('') + '<button id="mEnd" class="primary" hidden>Fin ▶</button>';
    side.insertBefore(tabs, side.firstChild);
    tabs.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => ui.mobShowTab(b.dataset.tab, true));
    $('mEnd').onclick = () => ui.mobEndPhase();
    const radar = document.createElement('section'); radar.id = 'radar'; side.insertBefore(radar, $('actbox'));

    const wrap = $('mapwrap');
    const cyc = document.createElement('div'); cyc.id = 'cyc';
    cyc.innerHTML = '<div class="grp"><button id="cPrev" aria-label="Unidad anterior">◀</button><button id="cName">Unidades</button><button id="cNext" aria-label="Unidad siguiente">▶</button></div>' +
      '<div class="grp z"><button id="zPrev" aria-label="Zed anterior">◀</button><button id="zName">Zeds</button><button id="zNext" aria-label="Zed siguiente">▶</button></div>';
    wrap.appendChild(cyc);
    $('cPrev').onclick = () => ui.cycleUnit(-1); $('cNext').onclick = () => ui.cycleUnit(1); $('cName').onclick = () => ui.cycleUnit(0);
    $('zPrev').onclick = () => ui.cycleZed(-1); $('zNext').onclick = () => ui.cycleZed(1); $('zName').onclick = () => ui.cycleZed(0);
    const edge = document.createElement('div'); edge.id = 'edge'; wrap.appendChild(edge);
  },
  /* Activa o desactiva la disposición de móvil según la pantalla (al cargar, al girar y al cambiar la opción). */
  mobApply() {
    const on = this.mobWanted(), was = this.mob;
    this.mobBuild();
    this.mob = on; document.body.classList.toggle('mob', on);
    document.body.classList.toggle('mob-land', on && !this.mobPortrait());
    /* «Cancelar acción» va sobre el mapa (la cabecera está plegada en el menú). */
    const cb = $('cancelBtn'), nav = document.querySelector('header nav');
    if (on && cb.parentNode !== $('mapwrap')) $('mapwrap').insertBefore(cb, $('banner'));
    if (!on && cb.parentNode !== nav) nav.insertBefore(cb, nav.firstChild);
    cb.textContent = on ? '✕ Cancelar' : '✕ Cancelar acción';
    this.mobShowTab(this.mobTab);
    this.mobSheet();
    this.arrange();
    /* En móvil se puede acercar más: hasta 1,6 veces el zoom con el que las fichas se leen bien. */
    this.MAXZ = on ? Math.max(4, this.mobReadZoom(true) * 1.6) : 4;
    if (on !== was && this.clampView) { this.clampView(); this.applyView(); }
    if (on) this.mobRefresh();
  },
  /* Zoom con el que una ficha Zed (62 unidades del mapa) se ve de unos MOB_TOKEN_PX px. raw: sin el tope de MAXZ. */
  mobReadZoom(raw) {
    const cv = this.canvas; if (!cv || !cv.clientWidth) return 2;
    const z = MOB_TOKEN_PX / (62 * cv.clientWidth / cv.width);
    return raw ? z : Math.max(1, Math.min(this.MAXZ, z));
  },
  /* Lleva la cámara a un espacio con zoom legible (siempre, aunque la Cámara guiada esté desactivada: lo pide el jugador). */
  mobFocus(id) {
    const cv = this.canvas, w = $('mapwrap'), s = G.spaces && G.spaces[id]; if (!cv || !w || !s) return;
    const k = cv.clientWidth / cv.width, v = this.view, z = Math.max(v.z, this.mobReadZoom());
    v.z = z; v.tx = w.clientWidth / 2 - cv.offsetLeft - s.x * k * z; v.ty = w.clientHeight / 2 - cv.offsetTop - s.y * k * z;
    this.camZoom = 1; this.clampView(); this.applyView();
    this.pulse(s.x, s.y, '#ffd54a');
  },

  /* ---------- panel con pestañas ---------- */
  mobShowTab(tab, user) {
    if (!MOB_SECTIONS[tab]) tab = 'unidad';
    /* Tocar la pestaña abierta pliega o despliega el panel (en vertical). */
    if (user && tab === this.mobTab && this.mob && this.mobPortrait()) { this.mobOpen = !this.mobOpen; this._mobFold = null; this.mobSheet(); return; }
    this.mobTab = tab; if (user) { this.mobOpen = true; this._mobFold = null; }
    const side = $('side'); MOB_TABS.forEach(([k]) => side.classList.toggle('tab-' + k, k === tab));
    document.querySelectorAll('#mtabs [data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    if (tab === 'rutas') this.mobRadar();
    if (tab === 'registro') { const l = $('log'); if (l) l.scrollTop = l.scrollHeight; }
    this.mobSheet();
  },
  /* Panel plegado (solo la barra de pestañas) o desplegado. En horizontal siempre está desplegado, a la derecha. */
  mobSheet() {
    const fold = this.mob && this.mobPortrait() && (!this.mobOpen || !!this._mobFold);
    const changed = document.body.classList.contains('mob-fold') !== fold;
    document.body.classList.toggle('mob-fold', fold);
    if (changed) { this.fit(); setTimeout(() => this.fit(), 60); }
  },
  /* Mientras se elige un espacio en el mapa (Mover, Disparar, preguntas) el panel se pliega para dejar ver el mapa; al terminar vuelve. */
  mobFoldFor(on) {
    if (!this.mob) return;
    if (on && !this._mobFold) { this._mobFold = true; this.mobSheet(); }
    else if (!on && this._mobFold) { this._mobFold = null; this.mobSheet(); }
  },
  async mobEndPhase() {
    if (!ui._endRes || G.busy || !$('modal').hidden) return;
    const left = plTok() + G.pool.event + allUnits(x => x.side === 'pl' && freeTotal(x) > 0).reduce((a, x) => a + freeTotal(x), 0);
    if (left > 0 && !(await this.confirm('¿Terminar la fase de Acciones? Aún te quedan ' + left + ' acción(es).'))) return;
    const eb = $('endBtn'); if (eb) eb.click(); else if (ui._endRes) { const r = ui._endRes; ui._endRes = null; ui.mode = null; ui.setBanner(null); r(); }
  },

  /* ---------- franja de estado y botones ---------- */
  mobRefresh() {
    if (!this.mob || !$('hud')) return;
    if (!G.lv) { $('hPh').textContent = ''; $('hStats').innerHTML = ''; return; }
    const L = G.lv, ph = { setup: 'Prep.', fourR: '4R', infection: 'Infección', feeding: 'Aliment.', zeds: 'Zeds', actions: 'Acciones', maint: 'Mant.', end: 'Fin' }[G.phase] || '';
    $('hPh').innerHTML = '<b>T' + G.turnNo + '</b> ' + ph;
    const st = [];
    if (L.infection) st.push('<span title="Infección" style="color:' + (G.inf >= 10 ? '#ff6b5a' : G.inf >= 7 ? '#ffb347' : '#fff') + '">💀' + G.inf + '</span>');
    st.push('<span title="Munición">🔫' + G.ammo + '</span>');
    if (L.supplies) st.push('<span title="Suministros">🍞' + G.supplies + '</span>');
    if (L.fourR) st.push('<span title="Caos en el mapa (fichas que quedan)"' + (G.chaosLeft <= 3 ? ' style="color:#ff6b5a"' : '') + '>🔥' + chaosOnMap() + '<small>/' + G.chaosLeft + '</small></span>');
    if (G.pool && G.phase === 'actions') st.push('<span title="Acciones para cualquier unidad">⚡' + (plTok() + G.pool.event) + '</span>');
    st.push('<span title="Cartas de Evento" class="ev">📜' + G.eventsRevealed + '/' + G.totalEvents + '</span>');
    $('hStats').innerHTML = st.join('');
    const hp = $('hPl'); hp.hidden = !multiP(); if (multiP()) { const p = G.players[G.act || 0]; hp.textContent = p.name; hp.style.borderColor = p.color; hp.style.color = p.color; }
    const ub = $('undoBtn'); $('hUndo').disabled = !ub || ub.disabled;
    $('mEnd').hidden = !(G.phase === 'actions' && !G.busy && ui._endRes);
    /* Número de cartas en la mano en la pestaña. */
    const nh = (G.hand || []).length + (G.rumorsHeld || []).length, mi = document.querySelector('#mtabs [data-tab="mano"] i'); if (mi) mi.textContent = nh ? nh : '';
    this.mobCycleLabel();
    if (this.mobTab === 'rutas') this.mobRadar();
  },
  /* Unidades amigas que se recorren con ◀ ▶: primero las que aún pueden actuar; luego por posición (Centro, rutas del Centro hacia fuera, Oficinas y Laboratorio, Hospital). */
  friendlyList() {
    const us = allUnits(u => u.side === 'pl' && !['refugee', 'aldeano', 'train'].includes(u.type) && u.space && G.spaces[u.space]);
    const acts = G.phase === 'actions' && !G.busy;
    const key = u => { const s = sp(u.space); const can = acts && unitActions(u).some(a => a.ok && a.id !== 'visions') ? 0 : 1;
      const w = u.space === 'C' ? [0, 0, 0] : s.route ? [1, G.routes.indexOf(s.route), spaceNum(u.space)] : s.kind === 'bed' ? [3, 0, 0] : [2, 0, 0];
      return [can].concat(w); };
    const ks = new Map(us.map(u => [u.id, key(u)]));
    return us.sort((a, b) => { const x = ks.get(a.id), y = ks.get(b.id); for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0; }).map(u => ({ u, can: ks.get(u.id)[0] === 0 }));
  },
  /* dir: 1 siguiente, -1 anterior, 0 vuelve a enfocar la actual (o la primera). Si la unidad elegida ya no puede actuar, ▶ salta a la primera que sí pueda. */
  cycleUnit(dir) {
    if (!G.units || G.busy || !$('modal').hidden) return;
    if (this.mode && this.mode.type !== 'pick') { this.mode = null; this.setBanner(null); }
    if (this.mode && this.mode.type === 'pick') return;
    const L = this.friendlyList(); if (!L.length) return;
    let i = L.findIndex(x => x.u.id === G.sel);
    const anyCan = L.some(x => x.can);
    if (dir === 0) i = i < 0 ? 0 : i;
    else if (i < 0 || (anyCan && !L[i].can)) i = dir > 0 ? 0 : L.filter(x => x.can).length - 1;
    else i = (i + dir + L.length) % L.length;
    const u = L[Math.max(0, i)].u;
    this.selectUnit(u.id, { noMove: true });
    this.mobFocus(u.space);
    if (this.mob) this.mobShowTab('unidad');
    this.mobCycleLabel();
  },
  mobCycleLabel() {
    const cn = $('cName'); if (!cn || !G.units) return;
    const L = this.friendlyList(), i = L.findIndex(x => x.u.id === G.sel);
    cn.innerHTML = i >= 0 ? '<b>' + (i + 1) + '/' + L.length + '</b> ' + L[i].u.name.replace(/\s*\(.*\)$/, '') : 'Unidades <b>' + L.length + '</b>';
    /* Aviso: la unidad elegida ya no puede actuar y otras sí → ▶ parpadea. */
    const cur = i >= 0 && L[i];
    $('cNext').classList.toggle('hint', G.phase === 'actions' && !G.busy && !!cur && !cur.can && L.some(x => x.can));
  },
  /* Espacios con Zeds, del más cercano al Centro al más lejano. */
  zedSpaces() {
    const ids = []; for (const r of G.routes) for (let i = 0; i <= lastOf(r); i++) if (zedsAt(r + i).length) ids.push(r + i);
    return ids.sort((a, b) => spaceNum(a) - spaceNum(b) || zedsAt(b).reduce((s, z) => s + strength(z), 0) - zedsAt(a).reduce((s, z) => s + strength(z), 0));
  },
  cycleZed(dir) {
    if (!G.units || !$('modal').hidden) return;
    const ids = this.zedSpaces(); if (!ids.length) { this.toast('No hay Zeds en el mapa', '#7bd45a', 1200); return; }
    this._zIdx = dir === 0 ? Math.max(0, Math.min(this._zIdx, ids.length - 1)) : (this._zIdx + dir + ids.length) % ids.length;
    if (this._zIdx < 0) this._zIdx = 0;
    const id = ids[this._zIdx];
    this.mobFocus(id);
    $('zName').innerHTML = '<b>' + (this._zIdx + 1) + '/' + ids.length + '</b> ' + ROUTES[sp(id).route].short + ' ' + spaceNum(id);
    this.toast(zedGroupName(zedsAt(id), id), '#ff5a44', 1600);
  },

  /* ---------- esquema de rutas ---------- */
  mobRadar() {
    const box = $('radar'); if (!box || !G.spaces) return;
    const maxN = Math.max(...G.routes.map(r => lastOf(r)));
    let h = '<div class="lbl">Rutas · del Inicial (izquierda) al n.º 0, junto al Centro</div><table class="rad"><tr><th class="rl"></th>';
    for (let n = maxN; n >= 0; n--) h += '<th>' + n + '</th>';
    h += '</tr>';
    for (const r of G.routes) {
      h += '<tr><th class="rl" data-route="' + r + '" style="color:' + ROUTES[r].color + '">' + ROUTES[r].short + '</th>';
      for (let n = maxN; n >= 0; n--) {
        const i = lastOf(r) - n, id = r + i;
        if (i < 0) { h += '<td class="na"></td>'; continue; }
        const s = sp(id), zs = zedsAt(id), pl = unitsAt(id).filter(u => u.side === 'pl' && u.type !== 'train'), rd = raidAt(id);
        const zsum = zs.reduce((a, z) => a + strength(z), 0), sup = zs.some(z => z.type === 'super' || z.type === 'spreader');
        const cls = ['c', s.name ? 'nm' : '', s.kind === 'crypt' ? 'cr' : '', s.chaos ? 'ch' : '', zs.length && n <= 1 ? 'dg' : '', i === 0 ? 'ini' : ''].filter(Boolean).join(' ');
        const tip = spaceLabel(id) + (zs.length ? ' · Zeds: ' + zs.map(strength).join('+') : '') + (pl.length ? ' · ' + pl.map(u => u.name).join(', ') : '') + (s.chaos ? ' · Caos ' + s.chaos : '');
        h += '<td class="' + cls + '" data-sp="' + id + '" title="' + tip.replace(/"/g, '') + '">' + (zs.length ? '<b class="z' + (sup ? ' s' : '') + '">' + zsum + (zs.length > 1 ? '<small>×' + zs.length + '</small>' : '') + '</b>' : '') +
          (pl.length ? '<b class="p">' + pl.length + '</b>' : '') + (rd.length ? '<b class="r">S</b>' : '') + (s.bar ? '<i class="br"></i>' : '') + '</td>';
      }
      h += '</tr>';
    }
    h += '</table>';
    const inC = unitsAt('C').filter(u => u.side === 'pl'), hosp = BEDS.filter(b => G.spaces[b] && unitsAt(b).length).length;
    h += '<div class="radc" data-sp="C">Centro: <b>' + inC.length + '</b> unidad(es)' + (G.lv.infection ? ' · Hospital: <b>' + hosp + '</b>' : '') + '</div>';
    h += '<div class="radk"><b class="z">5</b> Fuerza Zed · <b class="p">2</b> unidades tuyas · <b class="r">S</b> Saqueadores · borde naranja: Caos · rojo: Zeds junto al Centro</div>';
    box.innerHTML = h;
    box.querySelectorAll('[data-sp]').forEach(td => td.onclick = () => { const id = td.dataset.sp; ui.mobFocus(id); const z = zedsAt(id); if (z.length) ui.toast(zedGroupName(z, id), '#ff5a44', 1400); });
    box.querySelectorAll('[data-route]').forEach(th => th.onclick = () => ui.zoomToRoute(th.dataset.route));
  },

  /* ---------- flechas hacia los Zeds junto al Centro fuera de la vista ---------- */
  mobEdge() {
    const box = $('edge'); if (!box) return;
    if (!this.mob || !G.spaces || !G.routes) { box.innerHTML = ''; return; }
    const cv = this.canvas, w = $('mapwrap'), v = this.view, k = cv.clientWidth / cv.width, z = v.z > 1.001 ? v.z : 1;
    const W = w.clientWidth, H = w.clientHeight, placed = []; let h = '';  /* el aviso (≈ 80×28 px) queda entero dentro del mapa */
    for (const r of G.routes) for (const n of [0, 1]) {
      const i = lastOf(r) - n, id = r + i; if (i < 0 || !zedsAt(id).length) continue;
      const s = sp(id); const x = cv.offsetLeft + (z > 1 ? v.tx : 0) + s.x * k * z, y = cv.offsetTop + (z > 1 ? v.ty : 0) + s.y * k * z;
      if (x >= 0 && x <= W && y >= 0 && y <= H) continue;
      const cx = W / 2, cy = H / 2, dx = x - cx, dy = y - cy, t = Math.min((W / 2 - 46) / Math.abs(dx || 1e-6), (H / 2 - 52) / Math.abs(dy || 1e-6));
      let ex = cx + dx * t, ey = cy + dy * t; const ang = Math.atan2(dy, dx) * 180 / Math.PI;
      /* Si dos avisos caen en el mismo sitio, el siguiente se desplaza a lo largo del borde. */
      const side = Math.abs(ex - cx) >= W / 2 - 50;
      for (let g = 0; g < 8 && placed.some(q => Math.abs(q[0] - ex) < 86 && Math.abs(q[1] - ey) < 30); g++) { if (side) ey = Math.min(H - 50, ey + 32); else ex = Math.min(W - 46, ex + 88); }
      placed.push([ex, ey]);
      h += '<button class="ed' + (n === 0 ? ' n0' : '') + '" data-sp="' + id + '" style="left:' + ex + 'px;top:' + ey + 'px" title="' + spaceLabel(id) + '"><i style="transform:rotate(' + ang + 'deg)">➤</i>' + ROUTES[r].short + '</button>';
    }
    if (box._h !== h) { box._h = h; box.innerHTML = h; box.querySelectorAll('[data-sp]').forEach(b => b.onclick = () => ui.mobFocus(b.dataset.sp)); }
  }
});

/* ---------- enganches con la interfaz existente ---------- */
(function () {
  const _init = ui.init, _updateStats = ui.updateStats, _setBanner = ui.setBanner, _selectUnit = ui.selectUnit, _applyView = ui.applyView, _draw = ui.draw, _focus = ui.focus;
  const _hitUnit = ui.hitUnit, _hitSpace = ui.hitSpace, _arrange = ui.arrange, _cac = ui._cacTable, _fire = ui._fireTable;
  ui.init = async function () {
    await _init.call(this);
    this.mobApply();
    let rt = null; const re = () => { clearTimeout(rt); rt = setTimeout(() => ui.mobApply(), 120); };
    window.addEventListener('resize', re); window.addEventListener('orientationchange', re);
    /* Tab / Mayús+Tab: recorre las unidades amigas (también en escritorio). */
    document.addEventListener('keydown', e => {
      if (e.key !== 'Tab' || e.altKey || e.ctrlKey || e.metaKey || !G.units || !$('modal').hidden) return;
      const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA')) return;
      e.preventDefault(); ui.cycleUnit(e.shiftKey ? -1 : 1);
    });
  };
  ui.arrange = function () { _arrange.call(this); };
  ui.updateStats = function () { _updateStats.call(this); if (this.mob) this.mobRefresh(); };
  ui.setBanner = function (t) {
    if (this.mob && t) t = t.replace(/\s*\(Esc para cancelar\)/, '');
    _setBanner.call(this, t);
    if (this.mob) this.mobFoldFor(!!t);
  };
  ui.selectUnit = function (uid, opts) {
    _selectUnit.call(this, uid, opts);
    if (this.mob && uid) { this.mobShowTab('unidad'); this.mobOpen = true; this.mobSheet(); }
  };
  ui.applyView = function () { _applyView.call(this); if (this.mob) this.mobEdge(); };
  ui.draw = function () { _draw.call(this); if (this.mob) this.mobEdge(); };
  /* Cámara guiada en móvil: con un espacio, como mínimo el zoom legible; con varios, el zoom que los encuadra a todos (sin pasar del legible). */
  ui.focus = function (id, zoom) {
    if (this.mob && G.spaces) {
      const ids = (Array.isArray(id) ? id : [id]).filter(x => G.spaces[x]);
      if (ids.length) {
        const rz = this.mobReadZoom(), cv = this.canvas, w = $('mapwrap'), k = cv.clientWidth / cv.width;
        if (ids.length === 1) zoom = Math.max(zoom || 1.9, rz * 0.9);
        else { const xs = ids.map(x => G.spaces[x].x), ys = ids.map(x => G.spaces[x].y), pad = 150;
          const fz = Math.min(w.clientWidth / ((Math.max(...xs) - Math.min(...xs) + pad) * k), w.clientHeight / ((Math.max(...ys) - Math.min(...ys) + pad) * k));
          zoom = Math.max(1.5, Math.min(rz, fz)); }
        zoom = Math.min(this.MAXZ, zoom);
      }
    }
    _focus.call(this, id, zoom);
    if (this.mob) this.mobEdge();
  };
  /* Zona táctil mínima en píxeles de pantalla (en móvil): la ficha más cercana al dedo dentro de esa zona. */
  ui.hitUnit = function (p) {
    if (!this.mob) return _hitUnit.call(this, p);
    const r0 = this.canvas.getBoundingClientRect(), u = this.canvas.width / r0.width, min = MOB_TAP_PX * u;
    let best = null, bd = 1e9;
    for (let k = this.rects.length - 1; k >= 0; k--) {
      const r = this.rects[k], w = Math.max(r.w, min), h = Math.max(r.h, min), dx = Math.abs(p.x - r.x), dy = Math.abs(p.y - r.y);
      if (dx <= w / 2 && dy <= h / 2) { const d = Math.hypot(dx, dy); if (d < bd) { bd = d; best = r.id; } }
    }
    return best;
  };
  ui.hitSpace = function (p) {
    const hit = _hitSpace.call(this, p); if (hit || !this.mob) return hit;
    const r0 = this.canvas.getBoundingClientRect(), u = this.canvas.width / r0.width, lim = MOB_TAP_PX * u * 0.8;
    let best = null, bd = 1e9; for (const id in G.spaces) { const s = G.spaces[id], d = Math.hypot(p.x - s.x, p.y - s.y); if (d < Math.max(80, lim) + 30 && d < bd) { bd = d; best = id; } }
    return best;
  };
  /* Combate y disparo en móvil: tabla reducida a la columna que se aplica; tocarla muestra la tabla entera (y otra vez la reduce). */
  const compact = h => ui.mob ? '<div class="tblhint">Toca la tabla para verla entera</div>' + h.replace('<table class="tbl">', '<table class="tbl compact">') : h;
  ui._cacTable = function (a, b) { return compact(_cac.call(this, a, b)); };
  ui._fireTable = function (c) { return compact(_fire.call(this, c)); };
  document.addEventListener('click', e => { const t = e.target.closest && e.target.closest('#modalbox table.tbl'); if (t && ui.mob) t.classList.toggle('compact'); });
})();
