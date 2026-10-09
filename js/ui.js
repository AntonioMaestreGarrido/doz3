/* Interfaz: mapa en canvas, paneles y ventanas. */
'use strict';

const $ = id => document.getElementById(id);
const IMG = {};
function loadImg(k, src) { return new Promise(res => { const i = new Image(); i.onload = () => { IMG[k] = i; res(); }; i.onerror = () => res(); i.src = src; }); }
async function loadAssets() {
  const list = [['mapA', 'assets/mapa.jpg'], ['mapB', 'assets/mapaB.jpg'], ['zed', 'assets/tokens/zed.png']];
  for (const k of Object.keys(HEROES)) if (HEROES[k].img) list.push([HEROES[k].img, 'assets/tokens/' + HEROES[k].img + '.png']);
  for (const k of Object.keys(SUPER_ZEDS)) list.push([SUPER_ZEDS[k].img, 'assets/tokens/' + SUPER_ZEDS[k].img + '.png']);
  list.push(['noelle', 'assets/tokens/noelle.png'], ['jaque', 'assets/tokens/jaque.png']);
  for (const k of ['caos', 'barricada', 'bastion', 'mina_4', 'mina_7', 'puente', 'ecg']) list.push(['m_' + k, 'assets/tokens/marcadores/' + k + '.png']);
  for (const k of Object.keys(RUMORS).concat('reverso')) list.push(['rum_' + k, 'assets/tokens/rumores/' + k + '.png']);
  for (const k of ['petra', 'aldeanos', 'refugiados', 'civ1', 'civ2', 'civ3']) list.push(['u_' + k, 'assets/tokens/' + k + '.png']);
  await Promise.all(list.map(([k, s]) => loadImg(k, s)));
}
const SIDE_COL = { train: '#555', civ: '#2b5c85', civh: '#5a2a7a', hero: '#1d3a2a', refugee: '#2f7a45', aldeano: '#a58a1d', raider: '#8a3d12', marine: '#3b4d2a', guard: '#2a4d3b', petra: '#5a2a7a' };

const ui = {
  fast: false, mode: null, rects: [], flash: null, canvas: null, ctx: null, mapH: 1545,
  async init() {
    await loadAssets();
    this.canvas = $('map'); this.ctx = this.canvas.getContext('2d');
    this.canvas.addEventListener('click', e => this.onClick(e));
    this.canvas.addEventListener('mousemove', e => { if (!ui.recentTouch()) this.onMove(e); });
    this.canvas.addEventListener('mouseleave', () => { if (ui.recentTouch()) return; ui._mapZoom = false; ui.zoomHide(); });
    document.addEventListener('mouseover', e => { if (ui.recentTouch()) return; const t = e.target.closest && e.target.closest('[data-zoom]'); if (t) ui.zoomShow(t.dataset.zoom, e); });
    document.addEventListener('mousemove', e => { if (ui.recentTouch()) return; const t = e.target.closest && e.target.closest('[data-zoom]'); if (t) ui.zoomShow(t.dataset.zoom, e); else if (!ui._mapZoom) ui.zoomHide(); });
    this.initTouch();
    /* Imágenes de cartas que fallan (tablet, red o caché inestable): reintento automático con otra URL. */
    document.addEventListener('error', e => {
      const t = e.target; if (!t || t.tagName !== 'IMG' || !/assets\/cartas\//.test(t.getAttribute('src') || '')) return;
      const base = t.getAttribute('src').split('?')[0], n = +(t.dataset.retry || 0); if (n >= 4) return; t.dataset.retry = n + 1;
      setTimeout(() => { t.src = base + '?r=' + Date.now(); }, 400 * (n + 1));
    }, true);
    if (this.initMapZoom) this.initMapZoom();
    window.addEventListener('resize', () => this.arrange());
    $('evimg').addEventListener('click', () => { if (G.event) ui.waitAck(G.event.name, G.event.txt.join('<br>'), 'assets/cartas/e_' + G.event.id + '.jpg', 'e:' + G.event.id); });
    $('fastChk').addEventListener('change', e => { ui.fast = e.target.checked; if (ui.fast) ui.release(); });
    $('soundBtn').addEventListener('click', () => ui.showSound());
    $('camChk').addEventListener('change', e => { ui.camOn = e.target.checked; if (!ui.camOn) ui.release(); });
    $('cancelBtn').addEventListener('click', () => ui.cancelMode());
    $('rulesBtn').addEventListener('click', () => ui.showRules());
    $('cardsBtn').addEventListener('click', () => ui.showHeroCards());
    if ($('undoBtn')) $('undoBtn').addEventListener('click', () => ui.undo());
    $('newBtn').addEventListener('click', () => { if (confirm('¿Volver al menú principal? La partida se guarda al terminar cada acción: lo que hayas hecho en la acción en curso se perderá.')) ui.reloadToMenu(); });
    this.arrange();
  },
  /* Táctil: los ratones emulados tras un toque se ignoran; pulsación larga sobre [data-zoom] o sobre una unidad del mapa amplía; el toque sobre el mapa solo selecciona; cualquier otro toque cierra. */
  recentTouch() { return performance.now() - (this._touchT || 0) < 800; },
  initTouch() {
    let timer = null, start = null;
    const clear = () => { clearTimeout(timer); timer = null; };
    document.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'touch') return;
      this._touchT = performance.now(); clear();
      const z = $('zoom'); if (!z.hidden && !z.contains(e.target)) { this._mapZoom = false; this.zoomHide(); }
      start = { x: e.clientX, y: e.clientY };
      /* Mapa: el toque solo selecciona la unidad; la ficha se amplía con pulsación larga. */
      if (e.target === this.canvas && G.units) {
        const uid = this.hitUnit(this.toMap(e)); if (!uid || !G.units[uid]) return;
        timer = setTimeout(() => { timer = null; this._longT = performance.now(); this._mapZoom = true; this.zoomShow('u:' + uid, { clientX: start.x, clientY: start.y }); }, 450);
        return;
      }
      const t = e.target.closest && e.target.closest('[data-zoom]'); if (!t) return;
      timer = setTimeout(() => { timer = null; this._longT = performance.now(); this.zoomShow(t.dataset.zoom, { clientX: start.x, clientY: start.y }); }, 450);
    });
    document.addEventListener('pointermove', e => { if (timer && start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 10) clear(); });
    ['pointerup', 'pointercancel'].forEach(n => document.addEventListener(n, e => { if (e.pointerType === 'touch') { this._touchT = performance.now(); clear(); } }));
    /* Tras una pulsación larga no debe dispararse la acción del elemento (carta, botón…) ni el menú contextual. */
    document.addEventListener('click', e => { if (performance.now() - (this._longT || 0) < 600) { e.stopPropagation(); e.preventDefault(); } }, true);
    document.addEventListener('contextmenu', e => { if (this.recentTouch() && e.target.closest && e.target.closest('[data-zoom]')) e.preventDefault(); });
  },
  /* Tres columnas en pantallas anchas (acciones · mapa · partida); en estrechas, todo en la columna derecha. */
  arrange() {
    const wide = innerWidth >= 1500, left = $('left'), side = $('side'), ids = ['actbox', 'unitbox', 'handbox'];
    if (wide !== this._wide) {
      this._wide = wide;
      if (wide) ids.forEach(id => left.appendChild($(id)));
      else { const ev = $('eventbox'); side.insertBefore($('actbox'), ev); side.insertBefore($('unitbox'), ev); side.insertBefore($('handbox'), ev.nextSibling); }
      left.hidden = !wide; side.classList.toggle('wide', wide);
    }
    this.fit();
  },
  setMap(board) { this.board = board; this.mapH = board === 'B' ? 1541 : 1545; this.canvas.height = this.mapH; this.fit(); },
  fit() {
    const w = $('mapwrap'); if (!w) return;
    const k = Math.max(0.1, Math.min((w.clientWidth - 12) / 2000, (w.clientHeight - 12) / this.mapH));
    this.canvas.style.width = Math.floor(2000 * k) + 'px'; this.canvas.style.height = Math.floor(this.mapH * k) + 'px';
    if (this.applyView) { this.clampView(); if (!this.camZoom || this.camZoom <= 1) this.applyView(); }
  },
  zoomShow(spec, e) {
    let info; try { info = zoomInfo(spec); } catch (err) { info = null; }
    const z = $('zoom'); if (!info) { z.hidden = true; return; }
    const sig = spec + (spec[0] === 'u' && G.units ? JSON.stringify(G.units[spec.slice(2)]) : '');
    if (z._spec !== sig) {
      z._spec = sig; z.className = info.img ? '' : 'noimg';
      z.innerHTML = (info.img ? '<img ' + (info.tok ? 'class="tok" ' : '') + 'src="' + info.img + '" alt="">' : '') + '<div class="zt"><h4>' + info.title + '</h4>' + info.html + '</div>';
    }
    z.hidden = false;
    const w = z.offsetWidth, h = z.offsetHeight; let x = e.clientX + 18, y = e.clientY + 14;
    if (x + w > innerWidth - 6) x = e.clientX - w - 18; if (x < 6) x = 6;
    if (y + h > innerHeight - 6) y = innerHeight - h - 6; if (y < 6) y = 6;
    z.style.left = x + 'px'; z.style.top = y + 'px';
  },
  zoomHide() { const z = $('zoom'); z.hidden = true; z._spec = null; },

  log(msg, cls) { const d = document.createElement('div'); if (cls) d.className = cls; d.textContent = msg; const l = $('log'); l.appendChild(d); l.scrollTop = l.scrollHeight; },
  updateStats() {
    this.updateUndo();
    if (!G.lv) return;
    const L = G.lv, done = G.eventsRevealed, tot = G.totalEvents;
    let h = '<div class="big">Turno ' + G.turnNo + ' · ' + ({ setup: 'Preparación', fourR: 'Fase 4R', infection: 'Infección', feeding: 'Alimentación', zeds: 'Fase de los Zeds', actions: 'Fase de Acciones', maint: 'Mantenimiento', end: 'Fin de la partida' }[G.phase] || '') + '</div>';
    h += '<div>Munición: <b>' + G.ammo + '</b></div><div>' + (L.supplies ? 'Suministros: <b>' + G.supplies + '</b>' : 'Reserva Zed: <b>' + G.reserve.length + '</b>') + '</div>';
    if (L.infection) h += '<div>Infección: <b id="infv" style="color:' + (G.inf >= 10 ? '#ff6b5a' : G.inf >= 7 ? '#ffb347' : '#fff') + '">' + G.inf + ' / 13</b>' + (G.antidote ? ' (Antídoto)' : '') + (G.berra ? ' (Elwood)' : '') + '</div>';
    if (L.fourR) h += '<div>Caos: <b>' + chaosOnMap() + '</b> (quedan ' + G.chaosLeft + ')</div>';
    if (L.res && G.res) h += '<div style="grid-column:1/3" data-zoom="r:' + G.res.cur.id + '">Investigación: <b>' + G.res.cur.name + '</b> (' + G.res.cur.th + '+' + (G.res.cur.sup ? ', 1 Sum.' : '') + ') · quedan ' + G.res.deck.length + (G.weapon ? '<br>Súper Arma: ' + G.weapon.parts.map(k => '<img class="wpart" src="assets/tokens/arma_' + k + (WEAPON_EXT[k] || '.png') + '" title="' + WEAPON_PARTS[k].name + '" alt="' + WEAPON_PARTS[k].name + '">').join('') : '') + '</div>';
    h += '<div style="grid-column:1/3;font-size:12px;color:var(--mut)">Cartas de Evento: ' + done + ' / ' + tot + '</div><div class="bar"><i style="width:' + (tot ? 100 * done / tot : 0) + '%"></i></div>';
    if (G.phase === 'actions' && !G.busy) h += '<button class="primary" id="endBtn" style="grid-column:1/3">Terminar fase de Acciones ▶</button>';
    $('status').innerHTML = h;
    const eb = $('endBtn'); if (eb) eb.onclick = () => { if (ui._endRes) { const r = ui._endRes; ui._endRes = null; ui.mode = null; ui.setBanner(null); r(); } };
    this.renderActBox();
    this.renderUnitBox();
  },
  /* Panel con todas las acciones que quedan este turno. */
  renderActBox() {
    const box = $('actbox'); if (!box || !G.pool) return;
    const inPhase = G.phase === 'actions';
    const noPl = G.event && G.event.noPlayerAction;
    let h = '<div class="lbl">Acciones disponibles' + (inPhase ? '' : ' · se usan en la fase de Acciones') + '</div>';
    h += '<div class="row"><span>Acción de Jugador</span>' + (G.pool.player ? '<b>1</b>' : '<span class="off">' + (noPl ? 'No disponible este turno' : 'Usada') + '</span>') + '</div>';
    h += '<div class="row"><span>Acciones de Evento</span><b>' + G.pool.event + '</b></div>';
    const gen = (G.pool.player ? 1 : 0) + G.pool.event;
    const fr = allUnits(x => x.side === 'pl' && freeTotal(x) > 0);
    const frN = fr.reduce((a, x) => a + freeTotal(x), 0);
    h += '<div class="row total"><span>Para cualquier unidad</span><span>' + gen + '</span></div>';
    h += '<div class="sub">Acciones gratis de unidades</div>';
    h += fr.length ? '<ul>' + fr.map(x => '<li class="sel" data-uid="' + x.id + '"><span>' + x.name + ' <small style="color:var(--mut)">' + spaceLabel(x.space) + '</small></span><span class="r">' + freeLabel(x) + '</span></li>').join('') + '</ul>' : '<div class="none">— ninguna —</div>';
    const AB = [['schmidt', 'ini', 'Iniciativa', '1 acción para Schmidt'], ['jones', 'planes', 'Sus Propios Planes', '1 acción para Jones'], ['hunt', 'lid', 'Liderazgo', '1 acción a Civiles/Refugiados'],
      ['hernandez', 'cit', 'Ciudadela', 'disparo gratis desde el Centro'], ['seaver', 'medico', 'Médico', 'Curar en el Hospital'], ['seaver', 'aidseaver', 'Primeros auxilios', 'Curar (1 Sum.)'],
      ['salvacion', 'aidsalvacion', 'Campamento Médico', 'Curar (1 Sum.)'], ['bauer', 'bauer', 'Dispositivos explosivos', '2 Sum. → 1 Mun.'], ['agee', 'boost', 'Madre de la Ciencia', '+1 Acción de Evento (+3 Inf.)'],
      ['wzed', 'wzed', 'Transmisión de Emergencia', '1 acción a Civiles/Refugiados'], ['bomberos', 'libera', 'Autoridad Civil', 'liberar Civiles/Aldeanos'], ['lee', 'pura', 'Purasangre', '1 Mover para Lee'],
      ['darling', 'zen', 'Zen', '1 acción al jugar «Guardar»'], ['carter', 'crepair', 'Reparar camión', '1 Impacto por turno']];
    const ab = AB.filter(([k]) => alive(k)).map(([k, f, n, d]) => '<li class="sel' + (G.charUsed[f] ? ' used' : '') + '" data-uid="' + alive(k).id + '"><span>' + alive(k).name + ' — ' + n + '</span><span class="r">' + d + '</span></li>');
    if (alive('hernandez')) ab.push('<li class="sel' + (G.speechUsed ? ' used' : '') + '" data-uid="' + alive('hernandez').id + '"><span>' + alive('hernandez').name + ' — Discurso Motivador</span><span class="r">1 por partida</span></li>');
    if (alive('kingman')) { const k = alive('kingman').id; ab.push('<li class="sel' + (G.once.bast ? ' used' : '') + '" data-uid="' + k + '"><span>' + alive('kingman').name + ' — Bastión</span><span class="r">1 por partida</span></li>', '<li class="sel' + (G.once.mines ? ' used' : '') + '" data-uid="' + k + '"><span>' + alive('kingman').name + ' — Campo de Minas</span><span class="r">1 por partida</span></li>'); }
    h += '<div class="sub">Habilidades de personaje</div>' + (ab.length ? '<ul>' + ab.join('') + '</ul>' : '<div class="none">— ninguna en juego —</div>');
    const T = G.turn || {}, ex = [];
    if (T.freeHeal) ex.push(['Curar gratis', T.freeHeal]);
    if (T.freeHealNoInf) ex.push(['Curar gratis (sin reducir Infección)', T.freeHealNoInf]);
    if (T.freeFromC) ex.push(['Mover gratis', 'desde el Centro']);
    if (T.panic) ex.push(['Mover gratis', 'hacia el Centro junto a Zeds']);
    if (T.vehicle) ex.push(['Vehículos', '+' + T.vehicle + ' Mov. al próximo Mover de un Héroe']);
    if (T.heli) ex.push(['Helicóptero', 'próximo Mover de un Héroe']);
    if (T.mercs) ex.push(['Soldados de fortuna', 'disparos sin Munición, 1►']);
    if (T.combineFire) ex.push(['Plan de guerra negro', 'Fuerza combinada al disparar']);
    for (const s of (T.specials || [])) ex.push([s.label, '']);
    if (G.hand.includes('adrenalina')) ex.push(['Adrenalina (en la mano)', '+2 Acciones de Evento']);
    h += '<div class="sub">Extras del turno</div>' + (ex.length ? '<ul>' + ex.map(([a, b]) => '<li><span>' + a + '</span><span class="r">' + b + '</span></li>').join('') + '</ul>' : '<div class="none">— ninguno —</div>');
    h += '<div class="row total"><span>Total aproximado</span><span>' + (gen + frN) + (ab.length ? ' + habilidades' : '') + '</span></div>';
    box.innerHTML = h;
    box.querySelectorAll('[data-uid]').forEach(li => li.onclick = () => { if (!G.units[li.dataset.uid]) return; G.sel = li.dataset.uid; ui.updateStats(); ui.redraw(); });
  },
  updateHand() {
    const h = $('hand'); h.innerHTML = '';
    for (const k of G.hand) {
      const d = document.createElement('div'); d.className = 'hc'; d.dataset.zoom = 'd:' + k; d.innerHTML = '<b>' + DEST[k].name + '</b>';
      if (handUsable(k) && !G.busy) { const b = document.createElement('button'); b.textContent = 'Usar'; b.onclick = () => ui.guard(() => useHandCard(k)); d.appendChild(b); }
      h.appendChild(d);
    }
    for (const k of (G.rumorsHeld || [])) { const d = document.createElement('div'); d.className = 'hc'; d.dataset.zoom = 'k:' + k; d.innerHTML = '<img class="rumthumb" src="assets/tokens/rumores/' + k + '.png" alt=""><b>Rumor: ' + RUMORS[k].name + '</b>'; if (!G.busy) { const b = document.createElement('button'); b.textContent = 'Usar'; b.onclick = () => ui.guard(() => useRumor(k)); d.appendChild(b); } h.appendChild(d); }
  },
  _undo: [],
  _undoSnap() { return { s: JSON.stringify({ rng: rngState(), uid: UID, G: snapshotState() }) }; },
  undoClear() { this._undo = []; this.updateUndo(); },
  updateUndo() { const b = $('undoBtn'); if (!b) return; const n = this._undo.length, ok = n > 0 && G.phase === 'actions' && !G.busy && !G.over; b.disabled = !ok; b.textContent = '↶ Deshacer' + (n ? ' (' + n + ')' : ''); },
  async undo() {
    if (G.busy || G.phase !== 'actions' || G.over || !this._undo.length) return;
    const p = this._undo.pop(), s = JSON.parse(p.s);
    this.mode = null; this.setBanner(null);
    restoreState(s.G); UID = s.uid; rngRestore(s.rng); G.busy = false; G.sel = null;
    this.log('↶ Deshacer: se vuelve al estado anterior a la última acción.', 'turn');
    saveGame('actions'); this.updateStats(); this.updateHand(); this.redraw();
  },
  async guard(fn) {
    if (G.busy) return;
    /* Deshacer: se guarda el estado antes de cada acción. Si la acción usa el generador aleatorio (una tirada, robar carta…) ya no se puede volver más atrás de ella. */
    const undoable = G.phase === 'actions' && !G.over && !(G.event && G.event.cer);
    const pre = undoable ? ui._undoSnap() : null, rng0 = rngState();
    G.busy = true; ui.mode = null; ui.setBanner(null); ui.updateStats(); ui.updateHand();
    try { await fn(); } catch (e) { console.error(e); ui.log('Error: ' + e.message, 'bad'); }
    G.busy = false;
    if (pre) { if (rngState() !== rng0) ui._undo = []; else if (!G.over && ui._undoSnap().s !== pre.s) { ui._undo.push(pre); if (ui._undo.length > 60) ui._undo.shift(); } }
    if (G.sel && !G.units[G.sel]) G.sel = null;
    if (G.phase === 'actions' && !G.over && !G.event.cer) saveGame('actions');
    if (G.over && ui._endRes) { const r = ui._endRes; ui._endRes = null; r(); }
    ui.updateStats(); ui.updateHand(); ui.redraw();
  },
  setBanner(t) {
    const b = $('banner'), c = $('cancelBtn'); if (!t) { b.hidden = true; if (c) c.hidden = true; return; }
    b.textContent = t; b.hidden = false;
    if (c) c.hidden = !(this.mode && (this.mode.type !== 'pick' || this.mode.cancel));
  },
  cancelMode() { if (this.mode && this.mode.type === 'pick' && this.mode.cancel) { const r = this.mode.resolve; this.mode = null; this.setBanner(null); this.redraw(); r(null); } else if (this.mode && this.mode.type !== 'pick') { this.mode = null; this.setBanner(null); this.redraw(); } },
  renderUnitBox() {
    const box = $('unitbox'), u = G.sel && G.units[G.sel];
    let sph = '';
    if (G.phase === 'actions' && !G.busy && G.turn && G.turn.specials.length) sph = '<div class="acts" style="margin-top:6px">' + G.turn.specials.map((s, i) => '<button data-sp="' + i + '">' + s.label + '</button>').join('') + '</div>';
    if (!u) { box.innerHTML = '<div class="lbl">Unidad</div><div style="color:var(--mut)">Pulsa una unidad del mapa para ver sus acciones. Pasa el ratón sobre cualquier ficha o carta para ver su texto ampliado.</div>' + sph; this.bindSpecials(box); return; }
    let h = '<div class="lbl">Unidad seleccionada</div><h3>' + u.name + '</h3><div class="stat">Fuerza <b style="color:#fff">' + strength(u) + '</b> (' + (u.flipped ? 'reducida' : 'completa') + ') · Impactos ' + u.hits + '/' + capOf(u) + (u.mp ? ' · Mov. ' + u.mp : '') + '<br>' + spaceLabel(u.space) + '</div>';
    const tags = []; if (u.ecg) tags.push('En coma'); if (u.resist) tags.push('Resistiendo'); if (u.armed) tags.push('Bien Armados 1►'); if (u.leader) tags.push('Líder Civil 1►'); if (u.keepCalm) tags.push('Keep calm 2►'); if (u.trained) tags.push('Entrenados +2'); if (freeTotal(u)) tags.push('Acciones gratis: ' + freeLabel(u));
    h += tags.map(t => '<span class="pill">' + t + '</span>').join('');
    if (u.key && heroCard(u.key)) h += '<div class="acts cardbtns"><button data-card="front">Ver carta entera</button><button data-card="back">Ver trasera (trasfondo)</button></div>';
    const acts = unitActions(u);
    if (acts.length) h += '<div class="acts">' + acts.map(a => '<button data-act="' + a.id + '" ' + (a.ok ? '' : 'disabled') + '>' + a.label + '</button>').join('') + '</div>';
    box.innerHTML = h + sph;
    box.querySelectorAll('[data-act]').forEach(b => b.onclick = () => ui.doAct(u, b.dataset.act));
    box.querySelectorAll('[data-card]').forEach(b => b.onclick = () => ui.showHeroCard(u.key, b.dataset.card));
    this.bindSpecials(box);
  },
  bindSpecials(box) { box.querySelectorAll('[data-sp]').forEach(b => b.onclick = () => { const s = G.turn.specials[+b.dataset.sp]; G.turn.specials.splice(+b.dataset.sp, 1); ui.guard(() => s.fn()); }); },
  doAct(u, id) {
    if (id === 'move') {
      const extra = G.turn.vehicle && u.type === 'hero' && !['pepinillos', 'horacio'].includes(u.key) && isSurface(u.space) ? G.turn.vehicle : 0; let opts = reachable(u, extra); if (extra) { const base = reachable(u, 0); for (const k in opts) if (base[k] === undefined && !isSurface(k)) delete opts[k]; }
      if (G.turn.heli && u.type === 'hero') { opts = {}; for (const k in G.spaces) if (isSurface(k) && canStop(u, k) && k !== u.space) opts[k] = 0; }
      if (!canPay(u, 1, 'move')) opts = Object.fromEntries(Object.entries(opts).filter(([k]) => moveIsFree(u, k)));
      ui.mode = { type: 'move', unit: u, opts, extra }; ui.setBanner('Elige el espacio de destino (Esc para cancelar)'); ui.redraw();
    } else if (id === 'fire') { ui.mode = { type: 'fire', unit: u, opts: fireTargets(u) }; ui.setBanner('Elige el espacio del Zed objetivo'); ui.redraw(); }
    else if (id === 'fab') { ui.mode = { type: 'fire', unit: u, opts: fireTargets(u), fab: true }; ui.setBanner('Fabricar munición: elige el objetivo (2 acciones)'); ui.redraw(); }
    else ui.guard(() => runAction(u, id));
  },

  toMap(e) { const r = this.canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * this.canvas.width / r.width, y: (e.clientY - r.top) * this.canvas.height / r.height }; },
  hitUnit(p) { for (let k = this.rects.length - 1; k >= 0; k--) { const r = this.rects[k]; if (p.x >= r.x - r.w / 2 && p.x <= r.x + r.w / 2 && p.y >= r.y - r.h / 2 && p.y <= r.y + r.h / 2) return r.id; } return null; },
  hitSpace(p) { let best = null, bd = 1e9; for (const id in G.spaces) { const s = G.spaces[id]; const d = Math.hypot(p.x - s.x, p.y - s.y); const lim = id === 'C' ? 150 : 80; if (d < lim && d < bd) { bd = d; best = id; } } return best; },
  onMove(e) {
    if (!G.units) return; const p = this.toMap(e), uid = this.hitUnit(p);
    this.canvas.style.cursor = (uid || (this.mode && this.hitSpace(p))) ? 'pointer' : 'default';
    const sid = !uid ? this.hitSpace(p) : null, ms = sid && G.spaces[sid];
    if (uid && G.units[uid]) { this._mapZoom = true; this.zoomShow('u:' + uid, e); }
    else if (ms && (ms.bar || ms.mine)) { this._mapZoom = true; this.zoomShow('m:' + sid, e); }
    else if (this._mapZoom) { this._mapZoom = false; this.zoomHide(); }
  },
  onClick(e) {
    if (!G.units) return; const p = this.toMap(e), uid = this.hitUnit(p), sid = this.hitSpace(p), m = this.mode;
    if (this._pick) { if (uid && this._pick.ids.includes(uid)) this._pick.select(uid); return; }
    if (m && m.type === 'pick') { if (sid && m.ids.includes(sid)) { this.mode = null; this.setBanner(null); this.redraw(); m.resolve(sid); } return; }
    if (G.busy) return;
    if (m && (m.type === 'move' || m.type === 'fire')) {
      if (sid && m.opts[sid] !== undefined) {
        const u = m.unit, dist = m.opts[sid]; this.mode = null; this.setBanner(null);
        if (m.type === 'move') ui.guard(async () => {
          if (!moveIsFree(u, sid)) spendActions(u, 1, 'move'); if (m.extra && dist > u.mp) G.turn.vehicle = 0;
          if (G.turn.heli && u.type === 'hero') { G.turn.heli = false; putUnit(u, sid); LOG(u.name + ' es recogido por el helicóptero.'); ui.redraw(); return; }
          await doMove(u, sid, pathTo(m.opts.prev, u.space, sid));
        });
        else ui.guard(async () => {
          if (m.free) { G.ammo--; G.charUsed.cit = true; await doFire(u, sid, dist, { shift: 1, shiftLabel: 'Ciudadela' }); }
          else if (m.fab) { spendActions(u, 2, 'fire'); await doFire(u, sid, dist); }
          else { spendActions(u, 1, 'fire'); await payFire(u); await doFire(u, sid, dist); }
        });
        return;
      }
      this.mode = null; this.setBanner(null);
    }
    G.sel = uid || null; this.updateStats(); this.redraw();
  },
  redraw() { if (!this.ctx || !G.spaces) return; cancelAnimationFrame(this._raf); this._raf = requestAnimationFrame(() => this.draw()); },
  layout() {
    const rects = [];
    for (const id in G.spaces) {
      const s = G.spaces[id], us = s.units.map(x => G.units[x]).filter(Boolean);
      const big = us.filter(u => !isSoft(u)), soft = us.filter(isSoft);
      big.forEach((u, k) => {
        let x, y;
        if (id === 'C') { x = s.x + ((k % 5) - 2) * 76; y = s.y - 30 + Math.floor(k / 5) * 88; }
        else if (s.kind === 'camp') { x = s.x + ((k % 6) - 2.5) * 50; y = s.y + 60 + Math.floor(k / 6) * 52; }
        else { x = s.x + (k - (big.length - 1) / 2) * 66; y = s.y; }
        if (u.type === 'train') { rects.push({ id: u.id, x: s.x + (k - (big.length - 1) / 2) * 66, y: s.y - 52, w: 52, h: 34 }); return; }
        const z = isZedSide(u); const w = z ? 62 : u.side === 'raid' ? 60 : (u.type === 'civ' ? 56 : 58), h = z ? 62 : (u.type === 'civ' ? 56 : u.type === 'hero' ? 76 : 60);
        rects.push({ id: u.id, x, y, w, h });
      });
      soft.forEach((u, k) => { if (s.kind === 'camp') rects.push({ id: u.id, x: s.x + ((k % 8) - 3.5) * 36, y: s.y + 30 + Math.floor(k / 8) * 34, w: 30, h: 30 }); else rects.push({ id: u.id, x: s.x + 38 + k * 30, y: s.y + 46, w: 30, h: 30 }); });
    }
    this.rects = rects;
  },
  draw() {
    const c = this.ctx, W = this.canvas.width, H = this.canvas.height;
    const im = IMG[this.board === 'B' ? 'mapB' : 'mapA']; if (im) c.drawImage(im, 0, 0, W, H);
    this.layout(); const m = this.mode;
    const ring = (id, col, lw, dash) => { const s = G.spaces[id]; c.beginPath(); c.arc(s.x, s.y, id === 'C' ? 150 : 72, 0, 7); c.lineWidth = lw; c.strokeStyle = col; c.setLineDash(dash || []); c.stroke(); c.setLineDash([]); };
    if (m && m.type === 'move') for (const id in m.opts) ring(id, controlled(id) ? '#ff5a44' : '#7bd45a', 7);
    if (m && m.type === 'fire') for (const id in m.opts) ring(id, '#ff5a44', 8);
    if (m && m.type === 'pick') for (const id of m.ids) ring(id, '#ffd54a', 8, [14, 8]);
    for (const id in G.spaces) {
      const s = G.spaces[id];
      if (s.chaos && IMG.m_caos) { c.save(); c.drawImage(IMG.m_caos, s.x - 66, s.y - 66, 44, 42); if (s.chaos > 1) { c.font = '900 18px Impact'; c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.lineWidth = 4; c.textAlign = 'center'; c.textBaseline = 'middle'; c.strokeText('x' + s.chaos, s.x - 44, s.y - 28); c.fillText('x' + s.chaos, s.x - 44, s.y - 28); } c.restore(); }
      else if (s.chaos) { c.save(); c.fillStyle = '#d6361f'; c.strokeStyle = '#000'; c.lineWidth = 3; c.beginPath(); c.arc(s.x - 42, s.y - 40, 15, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#fff'; c.font = '900 16px Impact'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('C' + (s.chaos > 1 ? s.chaos : ''), s.x - 42, s.y - 39); c.restore(); }
      if (s.bar && IMG[s.bar === 2 ? 'm_bastion' : 'm_barricada']) c.drawImage(IMG[s.bar === 2 ? 'm_bastion' : 'm_barricada'], s.x + 20, s.y - 70, 60, 34);
      else if (s.bar) { c.save(); c.fillStyle = s.bar === 2 ? '#7a5a2a' : '#9a7b3a'; c.strokeStyle = '#000'; c.lineWidth = 3; c.fillRect(s.x + 24, s.y - 56, 40, 20); c.strokeRect(s.x + 24, s.y - 56, 40, 20); c.fillStyle = '#fff'; c.font = '700 11px Segoe UI'; c.textAlign = 'center'; c.fillText(s.bar === 2 ? 'BASTIÓN' : 'BARRIC.', s.x + 44, s.y - 42); c.restore(); }
      if (s.mine && IMG[s.mine === 1 ? 'm_mina_7' : 'm_mina_4']) c.drawImage(IMG[s.mine === 1 ? 'm_mina_7' : 'm_mina_4'], s.x + 36, s.y + 22, 40, 38);
      else if (s.mine) { c.save(); c.fillStyle = '#b03030'; c.strokeStyle = '#000'; c.lineWidth = 3; c.beginPath(); c.arc(s.x + 52, s.y + 40, 13, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#fff'; c.font = '700 12px Segoe UI'; c.textAlign = 'center'; c.fillText(s.mine === 1 ? '7' : '4', s.x + 52, s.y + 45); c.restore(); }
      if (s.rumor && IMG.rum_reverso) { c.save(); c.shadowColor = '#000'; c.shadowBlur = 6; c.drawImage(IMG.rum_reverso, s.x - 70, s.y + 18, 40, 40); c.restore(); }
      else if (s.rumor) { c.save(); c.fillStyle = '#2a7a4a'; c.strokeStyle = '#000'; c.lineWidth = 3; c.beginPath(); c.arc(s.x - 50, s.y + 40, 14, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#fff'; c.font = '900 16px Impact'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', s.x - 50, s.y + 41); c.restore(); }
      if (s.cem || s.base || s.tall || s.registro) { c.save(); c.fillStyle = '#7a4aa8'; c.strokeStyle = '#000'; c.lineWidth = 3; c.beginPath(); c.arc(s.x - 50, s.y + 40, 14, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#fff'; c.font = '800 11px Segoe UI'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s.cem ? 'CEM' : s.base ? 'AIR' : s.tall ? 'TM' : 'REG', s.x - 50, s.y + 41); c.restore(); }
      if (s.bridge === 'down' && IMG.m_puente) { c.save(); c.drawImage(IMG.m_puente, s.x - 28, s.y + 46, 56, 52); c.font = '900 16px Impact'; c.fillStyle = '#ff3b2a'; c.strokeStyle = '#000'; c.lineWidth = 4; c.textAlign = 'center'; c.strokeText('ROTO', s.x, s.y + 112); c.fillText('ROTO', s.x, s.y + 112); c.restore(); }
      else if (s.bridge === 'down') { c.save(); c.font = '900 20px Impact'; c.fillStyle = '#ff3b2a'; c.strokeStyle = '#000'; c.lineWidth = 4; c.textAlign = 'center'; c.strokeText('PUENTE ROTO', s.x, s.y + 62); c.fillText('PUENTE ROTO', s.x, s.y + 62); c.restore(); }
    }
    if (this.flash) { const t = (performance.now() - this.flash.t0) / 900; if (t < 1) { const r = this.flash.r; c.save(); c.globalAlpha = 1 - t; c.strokeStyle = ROUTES[r].color; c.lineWidth = 16; c.lineCap = 'round'; c.beginPath(); ROUTES[r].spaces.forEach((s, i) => i ? c.lineTo(s.x, s.y) : c.moveTo(s.x, s.y)); c.lineTo(CENTRO.x, CENTRO.y); c.stroke(); c.restore(); this.redraw(); } else this.flash = null; }
    for (const id of (G.turn && G.turn.block) || []) { const s = G.spaces[id]; if (!s) continue; c.save(); c.font = '900 22px Impact'; c.fillStyle = '#ff3b2a'; c.strokeStyle = '#000'; c.lineWidth = 4; c.textAlign = 'center'; c.strokeText('NO PASAR', s.x, s.y + 70); c.fillText('NO PASAR', s.x, s.y + 70); c.restore(); }
    this.drawUnits();
  },
  drawUnit(u, r) {
    const c = this.ctx, sel = G.sel === u.id || this.hl === u.id;
    c.save(); c.translate(r.x, r.y); if (r.scale && r.scale !== 1) c.scale(r.scale, r.scale); const hw = r.w / 2, hh = r.h / 2;
    if (sel) { c.shadowColor = '#ffd54a'; c.shadowBlur = 26; } else if (r.glow) { c.shadowColor = r.glow; c.shadowBlur = 34; }
    if (u.type === 'train') { c.fillStyle = u.state === 'leaving' ? '#d9822b' : '#3c7fc4'; rr(c, -hw - 8, -hh / 2, r.w + 16, hh, 6); c.fill(); c.strokeStyle = sel ? '#ffd54a' : '#000'; c.lineWidth = sel ? 5 : 3; c.stroke(); c.shadowBlur = 0; c.fillStyle = '#fff'; c.font = '800 11px Segoe UI'; c.textAlign = 'center'; c.fillText(u.tkey === 'local' ? 'TREN L' : 'TREN M', 0, 4); }
    else if (isZedSide(u)) {
      const img = IMG[u.img] || IMG.zed;
      c.fillStyle = u.type === 'super' ? '#4a0d6a' : u.type === 'spreader' ? '#1d6a2a' : '#7a1d12'; rr(c, -hw, -hh, r.w, r.h, 8); c.fill();
      c.save(); rr(c, -hw + 3, -hh + 3, r.w - 6, r.h - 6, 6); c.clip(); if (img) c.drawImage(img, 0, 0, img.width, img.height, -hw + 2, -hh + 2, r.w - 4, r.h - 4); if (u.flipped) { c.fillStyle = 'rgba(40,0,0,.5)'; c.fillRect(-hw, -hh, r.w, r.h); } c.restore();
      c.strokeStyle = sel ? '#ffd54a' : (u.type === 'super' ? '#c26bff' : '#2a0a06'); c.lineWidth = sel ? 5 : 3; rr(c, -hw, -hh, r.w, r.h, 8); c.stroke(); c.shadowBlur = 0;
      badge(c, hw - 14, hh - 14, String(strength(u)), u.flipped ? '#5a1010' : '#a52a1b', '#fff');
      if (u.hits) { c.font = '700 15px Segoe UI'; c.fillStyle = '#ff6b6b'; c.strokeStyle = '#000'; c.lineWidth = 3; c.textAlign = 'left'; const t = '♥'.repeat(u.hits); c.strokeText(t, -hw + 3, hh - 5); c.fillText(t, -hw + 3, hh - 5); }
      let ty = -hh + 10; for (const [f, t, col] of [['zresist', 'R', '#c26b00'], ['fast', '»', '#2a7fc2'], ['toxic', 'T', '#4a9a1a'], ['smart', 'I', '#7a3fc2'], ['leader', 'L', '#c22a2a'], ['pest', 'P', '#6a6a1a']]) if (u[f]) { tag(c, -hw + 11, ty, t, col); ty += 18; }
    } else if (isSoft(u) && IMG[u.type === 'aldeano' ? 'u_aldeanos' : 'u_refugiados']) {
      const im = IMG[u.type === 'aldeano' ? 'u_aldeanos' : 'u_refugiados'], w = r.w + 12, h = w * im.height / im.width;
      c.drawImage(im, -w / 2, -h / 2, w, h); c.shadowBlur = 0; c.strokeStyle = sel ? '#ffd54a' : '#000'; c.lineWidth = sel ? 4 : 2; rr(c, -w / 2, -h / 2, w, h, 12); c.stroke();
      if (u.vip) tag(c, 0, h / 2 - 8, 'VIP', '#2a7fc2');
    } else if (isSoft(u)) {
      c.beginPath(); c.arc(0, 0, hw, 0, 7); c.fillStyle = u.type === 'aldeano' ? '#d4a017' : '#2f9a55'; c.fill(); c.strokeStyle = sel ? '#ffd54a' : '#000'; c.lineWidth = sel ? 4 : 2.5; c.stroke(); c.shadowBlur = 0; c.fillStyle = '#fff'; c.font = '800 11px Segoe UI'; c.textAlign = 'center'; c.fillText(u.type === 'aldeano' ? 'ALD' : u.vip ? 'VIP' : 'REF', 0, 4);
    } else {
      const col = SIDE_COL[u.type] || '#2b5c85'; const img = u.img && IMG[u.img] || (u.skey === 'petra' && IMG.u_petra);
      const civIm = u.type === 'civ' && IMG['u_civ' + (1 + (parseInt(String(u.id).replace(/\D/g, ''), 10) || 0) % 3)];
      if (civIm) { c.beginPath(); c.arc(0, 0, hw, 0, 7); c.fillStyle = col; c.fill(); c.save(); c.beginPath(); c.arc(0, 0, hw - 2, 0, 7); c.clip(); c.drawImage(civIm, 0, 0, civIm.width * 0.78, civIm.height * 0.82, -hw, -hw * 0.7, r.w, r.w * 0.82); c.restore(); c.beginPath(); c.arc(0, 0, hw, 0, 7); c.strokeStyle = sel ? '#ffd54a' : '#0c1a26'; c.lineWidth = sel ? 5 : 3; c.stroke(); c.shadowBlur = 0; }
      else if (u.type === 'civ') { c.beginPath(); c.arc(0, 0, hw, 0, 7); c.fillStyle = col; c.fill(); c.strokeStyle = sel ? '#ffd54a' : '#0c1a26'; c.lineWidth = sel ? 5 : 3; c.stroke(); c.shadowBlur = 0; c.fillStyle = '#cfe6f7'; c.font = '700 13px Segoe UI'; c.textAlign = 'center'; c.fillText('CIV', 0, -8); }
      else {
        c.beginPath(); c.ellipse(0, 0, hw, hh, 0, 0, 7); c.fillStyle = col; c.fill();
        if (img) { c.save(); c.beginPath(); c.ellipse(0, 0, hw - 2, hh - 2, 0, 0, 7); c.clip(); c.drawImage(img, 0, 0, img.width, img.height * (img.width === img.height ? 1 : 0.86), -hw, -hh, r.w, r.h); c.restore(); }
        else { c.fillStyle = '#e8d3ff'; c.font = '800 10px Segoe UI'; c.textAlign = 'center'; u.name.split(' ').slice(0, 3).forEach((t, i) => c.fillText(t.slice(0, 9), 0, -8 + i * 12)); }
        c.beginPath(); c.ellipse(0, 0, hw, hh, 0, 0, 7); c.strokeStyle = sel ? '#ffd54a' : (u.ecg ? '#6fd3ff' : u.flipped ? '#9b2c1f' : '#e8dcb5'); c.lineWidth = sel ? 5 : 3; c.stroke(); c.shadowBlur = 0;
      }
      if (u.flipped && !u.ecg) { c.font = '700 11px Segoe UI'; c.fillStyle = '#ff8a76'; c.textAlign = 'center'; c.strokeStyle = '#000'; c.lineWidth = 3; c.strokeText('herido', 0, -hh + 10); c.fillText('herido', 0, -hh + 10); }
      if (u.ecg) { if (IMG.m_ecg) c.drawImage(IMG.m_ecg, -16, -hh - 4, 32, 32); else tag(c, 0, -hh + 8, 'ECG', '#2a8fc2'); }
      if (u.hits) { c.font = '700 14px Segoe UI'; c.fillStyle = '#ff6b6b'; c.strokeStyle = '#000'; c.lineWidth = 3; c.textAlign = 'left'; const t = '♥'.repeat(u.hits); c.strokeText(t, -hw + 2, hh - 12); c.fillText(t, -hw + 2, hh - 12); }
      badge(c, 0, hh - 8, String(strength(u)), u.flipped ? '#7a1d12' : '#2f6b3a', '#fff');
      if (u.resist) tag(c, -hw + 4, -hh + 8, 'RES', '#c2a000'); if (u.armed) tag(c, hw - 4, -hh + 8, 'ARM', '#c2561a'); if (u.leader) tag(c, hw - 4, -hh + 24, 'LÍD', '#8a3fc2'); if (u.keepCalm) tag(c, -hw + 4, -hh + 24, '2►', '#2a7fc2'); if (u.trained) tag(c, hw - 4, -hh + 40, '+2', '#2a9f5a'); if (freeTotal(u)) tag(c, hw - 4, hh - 30, '+' + freeTotal(u), '#2a9f5a');
    }
    c.restore();
  },
  flashRoute(r) { this.flash = { r, t0: performance.now() }; this.redraw(); },

  _modal(html, cls) { const b = $('modalbox'); b.className = cls || ''; b.innerHTML = html; $('modal').hidden = false; return b; },
  _close() { $('modal').classList.remove('pick'); $('modal').hidden = true; $('modalbox').innerHTML = ''; },
  choose({ title, text, options, cancel, img }) {
    return new Promise(res => {
      const b = this._modal('<h2>' + title + '</h2>' + (img ? '<div class="cardrow"><img src="' + img + '" alt=""><div><p>' + (text || '') + '</p></div></div>' : '<p>' + (text || '') + '</p>') + '<div class="opts"></div>'); const o = b.querySelector('.opts');
      options.forEach(opt => { const bt = document.createElement('button'); bt.innerHTML = (opt.color ? '<span class="sw" style="background:' + opt.color + '"></span>' : '') + opt.label; bt.onclick = () => { ui._close(); res(opt.value); }; o.appendChild(bt); });
      if (cancel) { const bt = document.createElement('button'); bt.textContent = 'Cancelar'; bt.onclick = () => { ui._close(); res(null); }; o.appendChild(bt); }
    });
  },
  /* Elección sobre cartas: rejilla con la imagen de cada opción. options: [{value,label,img?,sub?}]; extra: botones sin carta (p. ej. «Terminar»). */
  chooseCards({ title, text, options, extra }) {
    return new Promise(res => {
      const b = this._modal('<h2>' + title + '</h2><p>' + (text || '') + '</p><div class="pickhint">Toca una carta para elegirla y leerla en grande; pulsa Aceptar para confirmar.</div><div class="cpwrap"><div class="cardpick"></div><div class="cpprev"><div class="cpph">Selecciona una carta para leerla aquí</div></div></div><div class="opts"></div>', 'cardpickbox');
      const grid = b.querySelector('.cardpick'), ops = b.querySelector('.opts'), prev = b.querySelector('.cpprev'); let cur;
      const ok = document.createElement('button'); ok.className = 'primary'; ok.textContent = 'Aceptar'; ok.disabled = true; ops.appendChild(ok);
      const sel = i => { cur = i; ok.disabled = false; grid.querySelectorAll('.cpc').forEach(x => x.classList.toggle('on', +x.dataset.i === i)); const o = options[i]; prev.innerHTML = o.img ? '<img src="' + o.img + '" alt=""><div class="cpn">' + o.label + (o.sub ? '<small>' + o.sub + '</small>' : '') + '</div>' : '<div class="cpph"><b>' + o.label + '</b>' + (o.sub ? '<br>' + o.sub : '') + '<br><small>(sin carta ilustrada)</small></div>'; };
      options.forEach((o, i) => {
        const d = document.createElement('div'); d.className = 'cpc' + (o.img ? '' : ' noimg'); d.dataset.i = i;
        d.innerHTML = (o.img ? '<img src="' + o.img + '" alt="">' : '') + '<div class="cpn">' + o.label + (o.sub ? '<small>' + o.sub + '</small>' : '') + '</div>';
        d.onclick = () => sel(i);
        grid.appendChild(d);
      });
      ok.onclick = () => { if (cur !== undefined) { ui._close(); res(options[cur].value); } };
      (extra || []).forEach(e => { const bt = document.createElement('button'); bt.textContent = e.label; bt.onclick = () => { ui._close(); res(e.value); }; ops.appendChild(bt); });
    });
  },
  confirm(text) { return this.choose({ title: 'Confirmar', text, options: [{ label: 'Sí', value: true }, { label: 'No', value: false }] }); },
  waitAck(title, text, img, spec) {
    return new Promise(res => {
      const im = img ? '<img src="' + img + '" alt="" ' + (spec ? 'data-zoom="' + spec + '"' : '') + '>' : '';
      this._modal('<h2>' + title + '</h2><div class="cardrow">' + im + '<div><p>' + (text || '') + '</p></div></div><div class="opts"><button class="primary" id="ackb">Continuar</button></div>');
      $('ackb').onclick = () => { ui._close(); res(); }; $('ackb').focus();
    });
  },
  /* Elegir unidad: panel inferior que no tapa el mapa. Un toque sobre una opción (o sobre la unidad en el mapa) la resalta y centra la cámara;
     solo el botón Aceptar confirma. */
  pickUnit(units, text, cancel) {
    return new Promise(res => {
      const b = this._modal('<h2>Elige una unidad</h2><p>' + text + '</p><div class="pickhint">Toca una opción (o la unidad en el mapa) para verla; pulsa Aceptar para confirmar.</div><div class="pickopts"></div><div class="opts"><button class="primary" id="pkok" disabled>Aceptar</button>' + (cancel ? '<button id="pkcancel">Cancelar</button>' : '') + '</div>', 'pickpanel');
      $('modal').classList.add('pick');
      const box = b.querySelector('.pickopts'); let cur = null, focused = false;
      const done = id => { this._pick = null; this.hl = null; if (focused) this.release(); this._close(); this.redraw(); res(id); };
      const select = id => {
        cur = id; this.hl = id; $('pkok').disabled = false;
        box.querySelectorAll('button').forEach(x => x.classList.toggle('on', x.dataset.id === id));
        const u = G.units[id]; if (u && u.space) { this.focus(u.space); focused = focused || (this.camOn && !this.fast); this.pulse(G.spaces[u.space].x, G.spaces[u.space].y, '#ffd54a'); }
        this.redraw();
      };
      units.forEach(u => { const bt = document.createElement('button'); bt.dataset.id = u.id; bt.textContent = u.name + ' — ' + spaceLabel(u.space); bt.onclick = () => select(u.id); box.appendChild(bt); });
      $('pkok').onclick = () => { if (cur) done(cur); };
      if (cancel) $('pkcancel').onclick = () => done(null);
      this._pick = { ids: units.map(u => u.id), select };
    });
  },
  pickSpace(ids, text, cancel) { return new Promise(res => { this.mode = { type: 'pick', ids, resolve: res, cancel: !!cancel }; this.setBanner(text); this.redraw(); }); },
  async rollSimple(label, n, resultFn) {
    const b = this._modal('<h2>' + label + '</h2><div class="dice">' + '<div class="die roll">?</div>'.repeat(n) + '</div><div id="rres" style="text-align:center;margin:8px 0;font-size:15px"></div><div class="opts" id="rb"></div>', 'cbt');
    const dice = Array.from({ length: n }, d6); await this._animate(b.querySelectorAll('.die'), dice);
    const show = () => { if (resultFn) $('rres').innerHTML = resultFn(dice); }; show();
    /* Pensar fríamente: se puede repetir cualquier dado con un 1 (con doble 1 se repiten los dos), igual que en combate. */
    if (G.hand && G.hand.includes('pensar') && dice.includes(1)) {
      const idx = dice.length === 2 && dice[0] === 1 && dice[1] === 1 ? [0, 1] : [dice.indexOf(1)];
      const v = await this._ask('rb', 'Pensar fríamente: ¿repites ' + (idx.length > 1 ? 'los dos dados' : 'el dado con 1') + '?', [{ label: 'Repetir (juega la carta)', value: 'y' }, { label: 'No', value: 'n' }]);
      if (v === 'y') {
        G.hand.splice(G.hand.indexOf('pensar'), 1); G.destDiscard.push('pensar'); zenPlayed(); this.updateHand();
        idx.forEach(i => dice[i] = d6());
        const els = [...b.querySelectorAll('.die')];
        await this._animate(idx.map(i => els[i]), idx.map(i => dice[i]));
        LOG('Pensar fríamente: se repite ' + (idx.length > 1 ? 'la tirada' : 'el 1') + ' → ' + dice.join(' y ') + '.', 'good');
        show();
      }
    }
    if (DEBUG_DICE) await this._dbgDice([...b.querySelectorAll('.die')], dice, show); else await this._btn('rb', 'Continuar');
    this._close(); return dice;
  },
  /* Debug: botones Continuar / Debug. Con Debug, cada clic sobre un dado le sube el valor (1→6→1). Modifica vals en el sitio. */
  _dbgDice(els, vals, onChange) {
    return new Promise(res => {
      const rb = $('rb'); rb.innerHTML = '';
      const ok = document.createElement('button'); ok.className = 'primary'; ok.textContent = 'Continuar';
      const dbg = document.createElement('button'); dbg.textContent = '🐞 Debug';
      dbg.onclick = () => { dbg.disabled = true; dbg.textContent = '🐞 Debug activo';
        els.forEach((e, i) => { e.style.cursor = 'pointer'; e.style.outline = '2px dashed #ffd54a'; e.onclick = ev => { const left = ev.offsetX < e.offsetWidth / 2; vals[i] = left ? (vals[i] + 4) % 6 + 1 : vals[i] % 6 + 1; e.textContent = vals[i]; if (onChange) onChange(); }; });
        const hint = document.createElement('div'); hint.style.cssText = 'width:100%;font-size:12px;color:#ffd54a;margin-top:4px'; hint.textContent = 'Mitad izquierda del dado: −1 · mitad derecha: +1'; rb.appendChild(hint); };
      ok.onclick = () => { els.forEach(e => { e.onclick = null; e.style.outline = ''; }); rb.innerHTML = ''; res(); };
      rb.append(ok, dbg); ok.focus();
    });
  },
  _animate(els, vals) {
    return new Promise(res => {
      Sfx.dice(); els.forEach(e => e.classList.add('roll')); const t = setInterval(() => els.forEach(e => e.textContent = fxD6()), 70);
      setTimeout(() => { clearInterval(t); els.forEach((e, i) => { e.classList.remove('roll'); e.textContent = vals[i]; }); res(); }, this.fast ? 120 : 700);
    });
  },
  _btn(areaId, label) { return new Promise(res => { const a = $(areaId); a.innerHTML = ''; const bt = document.createElement('button'); bt.className = 'primary'; bt.textContent = label; bt.onclick = () => { a.innerHTML = ''; res(); }; a.appendChild(bt); bt.focus(); }); },
  _ask(areaId, text, options) { return new Promise(res => { const a = $(areaId); a.innerHTML = '<div style="width:100%;margin-bottom:4px">' + text + '</div>'; options.forEach(o => { const bt = document.createElement('button'); bt.textContent = o.label; bt.onclick = () => { a.innerHTML = ''; res(o.value); }; a.appendChild(bt); }); }); },
  _cacTable(initCol, finalCol) {
    let h = '<table class="tbl"><tr><th>2d6</th>' + CAC_COLS.map((n, i) => '<th class="' + (i === initCol ? 'c-init ' : '') + (i === finalCol ? 'c-final' : '') + '">' + n + '</th>').join('') + '</tr>';
    CAC.forEach((row, r) => { h += '<tr data-r="' + r + '"><td class="rowh">' + CAC_ROWS[r] + '</td>' + row.map((c, i) => '<td data-c="' + i + '" class="' + (i === finalCol ? 'c-final' : '') + '">' + c[0] + ' – ' + c[1] + '</td>').join('') + '</tr>'; });
    return h + '</table>';
  },
  _fireTable(col) {
    let h = '<table class="tbl"><tr><th>2d6</th>' + ['Fuerza 1', '2', '3', '4', '5', '6', '7+'].map((n, i) => '<th class="' + (i === col ? 'c-final' : '') + '">' + n + '</th>').join('') + '</tr>';
    FIRE.forEach((row, r) => { h += '<tr data-r="' + r + '"><td class="rowh">' + CAC_ROWS[r] + '</td>' + row.map((c, i) => '<td data-c="' + i + '" class="' + (i === col ? 'c-final' : '') + '">' + c + '</td>').join('') + '</tr>'; });
    return h + '</table>';
  },
  async _rollDice(b, extra, onChange) {
    await new Promise(r => { $('rb').innerHTML = '<button class="primary" id="rollb">🎲 Tirar ' + (2 + (extra || 0)) + ' dados</button>'; $('rollb').onclick = () => r(); $('rollb').focus(); if (ui.fast) r(); });
    $('rb').innerHTML = '';
    const area = b.querySelector('.dice'); area.innerHTML = '<div class="die"></div>'.repeat(2 + (extra || 0));
    const vals = Array.from({ length: 2 + (extra || 0) }, d6); await ui._animate(area.querySelectorAll('.die'), vals);
    const topTwo = () => vals.slice().sort((a, c) => c - a).slice(0, 2);
    if (DEBUG_DICE) await ui._dbgDice([...area.querySelectorAll('.die')], vals, () => { if (onChange) onChange(topTwo()); });
    const best = topTwo();
    if (extra) { const used = best.slice(); area.querySelectorAll('.die').forEach((e, i) => { const k = used.indexOf(vals[i]); if (k >= 0) used.splice(k, 1); else e.style.opacity = '.35'; }); }
    return best;
  },
  /* Repite los dados indicados (idx) de una tirada ya mostrada y recoloca el resultado resaltado. */
  async _rerollIn(b, info, vals, idx) {
    const area = b.querySelector('.dice'); area.innerHTML = vals.map(d => '<div class="die">' + d + '</div>').join('');
    const els = [...area.querySelectorAll('.die')], nv = idx.map(() => d6());
    await this._animate(idx.map(i => els[i]), nv);
    if (DEBUG_DICE) await this._dbgDice(idx.map(i => els[i]), nv);
    const out = vals.slice(); idx.forEach((i, k) => out[i] = nv[k]);
    const col = info.finalCol !== undefined ? info.finalCol : info.col, row = sumRow(out[0] + out[1]);
    b.querySelectorAll('td.hit').forEach(x => x.classList.remove('hit')); const cell = b.querySelector('tr[data-r="' + row + '"] td[data-c="' + col + '"]'); if (cell) cell.classList.add('hit');
    return out;
  },
  combatOpen(info) {
    const zs = info.zeds.map(z => z.name + ' ' + strength(z) + (z.hits ? ' <span class="bad">(' + '♥'.repeat(z.hits) + ')</span>' : '')).join(' + ');
    const sh = info.shifts.length ? info.shifts.map(s => '<li>' + s.label + ': ' + (s.v > 0 ? s.v + '►' : (-s.v) + '◄') + '</li>').join('') : '<li>Sin modificadores de columna</li>';
    const b = this._modal('<h2>' + info.title + '</h2><div class="sides"><div class="side z"><div>' + (info.zeds.length > 1 ? 'Horda' : 'Atacantes / Zeds') + '</div><div class="big" style="color:#ff8a76">' + info.zStr + '</div><div style="font-size:12px">' + zs + '</div></div><div class="vs">VS</div><div class="side"><div>' + info.fighter.name + '</div><div class="big" style="color:#9bd68a">' + info.pStr + '</div><div style="font-size:12px">Fuerza ' + (info.fighter.flipped ? 'reducida' : 'completa') + '</div></div></div><div class="cols">Columna inicial: <b>' + CAC_COLS[info.initCol] + '</b><ul style="margin:2px 0 2px 18px;padding:0">' + sh + '</ul>' + (info.extraDice ? '<div>+' + info.extraDice + ' dado(s) extra: se usan los 2 mejores.</div>' : '') + 'Columna final: <b style="color:var(--gold)">' + CAC_COLS[info.finalCol] + '</b></div>' + this._cacTable(info.initCol, info.finalCol) + '<div class="dice"><div class="die">·</div><div class="die">·</div></div><div class="result" id="rr"></div><div class="opts" id="rb"></div>', 'cbt');
    const mark = best => { const row = sumRow(best[0] + best[1]); const cell = b.querySelector('tr[data-r="' + row + '"] td[data-c="' + info.finalCol + '"]'); b.querySelectorAll('td.hit').forEach(x => x.classList.remove('hit')); if (cell) cell.classList.add('hit'); $('rr').innerHTML = 'Suma <b>' + (best[0] + best[1]) + '</b>'; };
    return {
      mark,
      roll: async extra => { const best = await ui._rollDice(b, extra, mark); mark(best); return best; },
      ask: (t, o) => ui._ask('rb', t, o),
      reroll: (v, idx) => ui._rerollIn(b, info, v, idx),
      setResult: (row, col, [zh, ph], zedLoses) => { b.querySelectorAll('td.hit').forEach(x => x.classList.remove('hit')); const cell = b.querySelector('tr[data-r="' + row + '"] td[data-c="' + col + '"]'); if (cell) cell.classList.add('hit'); $('rr').innerHTML = 'Impactos a los Zeds: <b class="p">' + zh + '</b> · Impactos a tu unidad: <b class="z">' + ph + '</b><br>' + (zedLoses ? '<span class="good">Los Zeds pierden y se retiran.</span>' : '<span class="bad">Tus unidades pierden y se retiran.</span>'); },
      done: async () => { await ui._btn('rb', 'Aplicar resultado'); ui._close(); }
    };
  },
  fireOpen(info) {
    const sh = info.shifts.length ? info.shifts.map(s => s.label + ': ' + (s.v > 0 ? s.v + '►' : (-s.v) + '◄')).join(', ') : 'sin modificadores';
    const title = info.ground ? 'Ataque sorpresa sobre ' + info.shooter.name : info.shooter.name + ' dispara' + (info.dist ? ' (a ' + info.dist + ' espacio' + (info.dist > 1 ? 's' : '') + ')' : '');
    const b = this._modal('<h2>' + title + '</h2><div class="cols">' + (info.ground ? 'Columna «Igual»' : 'Fuerza de disparo <b>' + info.str + '</b>') + ' · ' + sh + '</div>' + (info.ground ? this._cacTable(3, info.col) : this._fireTable(info.col)) + '<div class="dice"><div class="die">·</div><div class="die">·</div></div><div class="result" id="rr"></div><div class="opts" id="rb"></div>', 'cbt');
    const mark = best => { const row = sumRow(best[0] + best[1]); const cell = b.querySelector('tr[data-r="' + row + '"] td[data-c="' + info.col + '"]'); b.querySelectorAll('td.hit').forEach(x => x.classList.remove('hit')); if (cell) cell.classList.add('hit'); };
    return {
      mark,
      ask: (t, o) => ui._ask('rb', t, o),
      reroll: (v, idx) => ui._rerollIn(b, info, v, idx),
      roll: async () => { const best = await ui._rollDice(b, 0, mark); mark(best); return best; },
      setResult: (row, col, hits, _x, ground) => { if (ground) { $('rr').innerHTML = 'Tu unidad sufre <b class="z">' + hits + '</b> Impacto(s).'; return; } $('rr').innerHTML = hits ? 'Impactos al objetivo: <b class="p">' + hits + '</b>' : '<span class="bad">Sin impactos.</span>'; },
      done: async () => { await ui._btn('rb', 'Continuar'); ui._close(); }
    };
  },
  showRules() {
    this._modal('<div class="rules"><h2>Cómo se juega</h2><p><b>Objetivo:</b> sobrevive a todas las cartas de Evento sin que un Zed entre en el <b>Centro de la Ciudad</b>' + (G.lv && G.lv.fourR ? ' y sin quedarte sin fichas de Caos' : '') + '.</p><h3>Cada turno</h3><ol><li><b>Evento:</b> se revela una carta.</li><li><b>Fases 4R, Infección y Alimentación</b> (según el nivel).</li><li><b>Fase de los Zeds:</b> las rutas de la carta se activan: nuevo Zed en el Inicial si la ruta está vacía; si no, todos avanzan 1 espacio (Hordas de hasta 2). Si chocan con tus unidades hay combate.</li><li><b>Fase de Acciones:</b> 1 Acción de Jugador + las Acciones de Evento. Cada Acción: Mover, Disparar (1 Munición), Buscar, Curar (en el Hospital), Construir, Investigar… Las habilidades de personaje son extras.</li><li><b>Mantenimiento:</b> se restaura el orden, el Antídoto baja la Infección…</li></ol><h3>Combate</h3><p>Se compara la Fuerza para la columna inicial; los ► / ◄ la desplazan; tiras 2d6 (alto es bueno para ti). Izquierda: Impactos a los Zeds; derecha: a tu unidad. El perdedor se retira. Al defender en un espacio con nombre obtienes Terreno.</p><h3>Controles</h3><ul><li>Pulsa una unidad para ver sus acciones y pasa el ratón sobre cualquier ficha o carta para ver su texto.</li></ul><div class="opts"><button class="primary" id="xb">Cerrar</button></div></div>');
    $('xb').onclick = () => this._close();
  },
  showHeroCards() {
    this._modal('<h2>Héroes y unidades</h2><div class="herogrid" style="grid-template-columns:repeat(auto-fill,minmax(210px,1fr))">' + Object.keys(HEROES).map(k => { const tk = heroTok(k); return '<div class="hc2" data-zoom="h:' + k + '">' + (tk ? '<img class="htok" src="' + tk + '" alt="">' : '') + '<b>' + HEROES[k].name + '</b><br><span style="color:var(--mut);font-size:12px">' + HEROES[k].cls + ' · ' + HEROES[k].full + '/' + HEROES[k].red + ' · Mov ' + HEROES[k].mp + '</span>' + (heroCard(k) ? '<div class="acts cardbtns"><button data-hc="' + k + '" data-card="front">Carta entera</button><button data-hc="' + k + '" data-card="back">Trasera</button></div>' : '') + '</div>'; }).join('') + '</div><div class="opts"><button class="primary" id="xb">Cerrar</button></div>');
    document.querySelectorAll('#modalbox [data-hc]').forEach(b => b.onclick = () => ui.showHeroCard(b.dataset.hc, b.dataset.card, true));
    $('xb').onclick = () => this._close();
  },
  /* Carta de personaje entera: frente o trasera (trasfondo); `fromList` vuelve al listado al cerrar. */
  showHeroCard(k, side, fromList) {
    const h = HEROES[k]; if (!h || !heroCard(k)) return;
    this.zoomHide();
    const back = side === 'back';
    this._modal('<h2>' + h.name + ' · ' + (back ? 'Trasera (trasfondo)' : 'Carta') + '</h2><div class="bigcard"><img src="' + (back ? heroBack(k) : heroCard(k)) + '" alt=""></div><div class="opts"><button id="flipb">' + (back ? 'Ver carta entera' : 'Ver trasera (trasfondo)') + '</button><button class="primary" id="xb">' + (fromList ? 'Volver al listado' : 'Cerrar') + '</button></div>', 'herocard');
    $('flipb').onclick = () => ui.showHeroCard(k, back ? 'front' : 'back', fromList);
    $('xb').onclick = () => fromList ? ui.showHeroCards() : ui._close();
  },
  setupScreen() {
    return new Promise(res => {
      const lvls = LEVELS.map(l => '<label class="lvl"><input type="radio" name="lv" value="' + l.n + '" ' + (l.n === 0 ? 'checked' : '') + '><span><b>' + l.name + '</b><br><span>' + l.sub + '</span></span></label>').join('');
      const b = this._modal('<h2>Dawn of the Zeds</h2><p>Elige el nivel de juego (en solitario).</p><div class="lvls">' + lvls + '</div><div class="row"><label><input type="checkbox" id="x1"> Exp. 1 · Un paso al frente</label> <label><input type="checkbox" id="x2"> Exp. 2 · El blues del novato</label> <label><input type="checkbox" id="x3"> Exp. 3 · Rumores y ferrocarriles</label></div><div class="row"><label><input type="checkbox" id="dbgDice"> Debug: botón para cambiar los dados tras cada tirada</label></div><div class="row"><label>Duración: <select id="lenSel"></select></label> <label>Héroe personal: <select id="heroSel"></select></label></div><div class="opts"><button id="backBtn">Volver</button><button class="primary" id="goBtn">Empezar la partida</button></div>', 'setup');
      $('backBtn').onclick = () => { ui._close(); res(null); };
      const upd = () => {
        const n = +b.querySelector('input[name=lv]:checked').value, L = LEVELS[n];
        $('lenSel').innerHTML = L.lengths.map((x, i) => '<option value="' + i + '">' + x.name + '</option>').join('');
        G.expSel = [1, 2, 3].filter(k => $('x' + k) && $('x' + k).checked); const pool = n === 0 ? [] : heroPoolFor(n);
        $('heroSel').innerHTML = n === 0 ? '<option value="">(los 4 Héroes básicos)</option>' : '<option value="">Al azar</option>' + pool.map(k => '<option value="' + k + '">' + HEROES[k].name + '</option>').join('');
      };
      b.querySelectorAll('input[name=lv], #x1, #x2, #x3').forEach(i => i.onchange = upd); upd();
      $('goBtn').onclick = () => { const n = +b.querySelector('input[name=lv]:checked').value, len = +$('lenSel').value, hero = $('heroSel').value || null; const ex = [1, 2, 3].filter(k => $('x' + k).checked); DEBUG_DICE = $('dbgDice').checked; ui._close(); res({ level: n, len, hero, exps: ex }); };
    });
  },
  /* Música de menú: suena en portada y selección de partida; el navegador exige un gesto del usuario para arrancar. */
  musicOn() {
    if (!this._mus) { this._mus = new Audio('assets/sonidos/musica/musica_menu.mp3'); this._mus.loop = true; }
    const m = this._mus; m.volume = .5 * Sound.music.vol;
    if (!Sound.music.on) { m.pause(); return; }
    const p = m.play(); if (p && p.catch) p.catch(() => { });
  },
  /* Lo llama Sound.set al cambiar música: ajusta volumen o pausa/reanuda lo que esté sonando. */
  applyMusic() {
    if (this._mus) this.musicOn();
    this._gamePlay();
  },
  showSound() {
    const row = (k, name) => { const v = Math.round(Sound[k].vol * 100); return '<div class="snd"><label class="chk"><input type="checkbox" id="on_' + k + '"' + (Sound[k].on ? ' checked' : '') + '> ' + name + '</label><input type="range" min="0" max="100" id="vol_' + k + '" value="' + v + '"' + (Sound[k].on ? '' : ' disabled') + '><span id="pct_' + k + '">' + v + '%</span></div>'; };
    this._modal('<h2>Sonido</h2><p>Cada canal tiene su propio interruptor y volumen.</p>' + row('music', 'Música') + row('sfx', 'Efectos') + row('voice', 'Voz del líder') + '<div class="opts"><button class="primary" id="sndOk">Cerrar</button></div>', 'sound');
    ['music', 'sfx', 'voice'].forEach(k => {
      $('on_' + k).onchange = e => { Sound.set(k, { on: e.target.checked }); $('vol_' + k).disabled = !e.target.checked; if (k === 'sfx' && e.target.checked && typeof Sfx !== 'undefined') Sfx.warm(); };
      $('vol_' + k).oninput = e => { $('pct_' + k).textContent = e.target.value + '%'; Sound.set(k, { vol: e.target.value / 100 }); };
    });
    $('sndOk').onclick = () => ui._close();
  },
  hideCover() { const t = $('title'); if (t) t.remove(); },
  /* Vuelve al menú de la portada sin repetir la intro. */
  reloadToMenu() { try { sessionStorage.setItem('doz3.skipIntro', '1'); } catch (e) { } location.reload(); },
  /* Intro (en cada arranque de la web): imagen sin fondo; al pulsar suenan la música y el vídeo, y al acabar el vídeo aparece la portada. */
  intro() {
    return new Promise(res => {
      /* Se salta solo si la recarga viene de volver al menú desde la partida (reloadToMenu). */
      try { const skip = sessionStorage.getItem('doz3.skipIntro') === '1'; sessionStorage.removeItem('doz3.skipIntro'); if (skip) return res(); } catch (e) { }
      const t = document.createElement('div'); t.id = 'intro';
      t.innerHTML = '<img src="assets/intro.png" alt=""><p>Pulsa para empezar</p>';
      document.body.appendChild(t);
      const done = () => { t.remove(); res(); };
      t.onclick = () => {
        t.onclick = null; const p0 = t.querySelector('p'); if (p0) p0.remove();
        this.musicOn();
        const v = document.createElement('video'); v.id = 'openVid'; v.src = 'assets/opening.mp4'; v.playsInline = true;
        v.onended = done; v.onerror = done; t.appendChild(v);
        const p = v.play(); if (p && p.catch) p.catch(done);
      };
    });
  },
  musicStop() {
    const m = this._mus; if (!m || m.paused) return; this._mus = null;
    const f = setInterval(() => { m.volume = Math.max(0, m.volume - .05); if (m.volume <= 0) { clearInterval(f); m.pause(); } }, 80);
  },
  /* Música de partida: dos temas de fondo que se turnan y un tema de peligro (ver setDanger). */
  gameMusicOn() {
    if (this._bg) return;
    this._bg = [1, 2].map(n => { const a = new Audio('assets/sonidos/musica/musica_juego' + n + '.mp3'); a.volume = .4; a.onended = () => { a.currentTime = 0; this._bgI = 1 - this._bgI; this._gamePlay(); }; return a; });
    this._bgI = 0; this._danger = false;
    this._dg = new Audio('assets/sonidos/musica/musica_peligro.mp3'); this._dg.loop = true; this._dg.volume = .5;
    this._gamePlay();
  },
  /* Fin de partida: para la música de fondo y el tema de peligro y toca el tema de victoria o derrota. */
  gameMusicEnd(win) {
    if (this._bg) { this._bg.forEach(a => { a.onended = null; a.pause(); }); this._dg.pause(); this._bg = null; }
    this._danger = false;
    try { if (this._endMus) this._endMus.pause(); } catch (e) { }
    if (!Sound.music.on) return;
    const a = this._endMus = new Audio('assets/sonidos/musica/' + (win ? 'musica_victoria' : 'musica_derrota') + '.mp3'); a.volume = .6 * Sound.music.vol;
    const p = a.play(); if (p && p.catch) p.catch(() => { });
  },
  /* Toca el tema que corresponde; el de fondo se reanuda donde se quedó al acabar el peligro. */
  _gamePlay() {
    if (!this._bg) return;
    const bg = this._bg[this._bgI], cur = this._danger ? this._dg : bg, other = this._danger ? bg : this._dg;
    bg.volume = .4 * Sound.music.vol; this._dg.volume = .5 * Sound.music.vol;
    other.pause();
    if (!Sound.music.on) { cur.pause(); return; }
    const p = cur.play(); if (p && p.catch) p.catch(() => { });
  },
  /* Lo llama el mapa: true si hay Zeds en el penúltimo espacio (o junto al Centro). Al entrar en peligro, la voz avisa. */
  setDanger(v) { if (G && G.phase === 'end') return; v = !!v; if (v === this._danger) return; this._danger = v; if (v) Voz.say('peligro'); this._gamePlay(); },
  /* Portada: devuelve 'new' o 'load'. */
  titleScreen() {
    return new Promise(res => {
      const prev = $('title'); if (prev) prev.remove();
      const sv = listSaves(), t = document.createElement('div'); t.id = 'title';
      const info = sv.length ? sv.length + (sv.length === 1 ? ' partida' : ' partidas') + ' · ' + LEVELS[sv[0].G.lv].name + ', turno ' + sv[0].G.turnNo : 'No hay partidas guardadas';
      t.innerHTML = '<div class="tbtns"><button class="primary" data-a="new">Nueva partida</button><button data-a="load"' + (sv.length ? '' : ' disabled') + '>Cargar partida<small>' + info + '</small></button><button data-a="top">Top supervivientes</button><button data-a="sound">Sonido</button><button data-a="ost">OST</button><button data-a="credits">Créditos</button></div><button class="mute" id="muteBtn" title="Música"></button><div id="buildTag">' + (typeof BUILD_TIME !== 'undefined' ? 'build ' + BUILD_TIME : '') + '</div>';
      document.body.appendChild(t);
      this.musicOn();
      const mb = $('muteBtn'), paint = () => { mb.textContent = Sound.music.on ? '🔊' : '🔇'; }; paint();
      mb.onclick = e => { e.stopPropagation(); Sound.set('music', { on: !Sound.music.on }); paint(); };
      const kick = () => { if (ui._mus && ui._mus.paused) ui.musicOn(); }; ['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, kick, { once: true, capture: true }));
      t.querySelectorAll('.tbtns button').forEach(bt => bt.onclick = () => {
        const a = bt.dataset.a;
        if (a === 'top') return ui.showTop();
        if (a === 'sound') return ui.showSound();
        if (a === 'ost') return Ost.open();
        if (a === 'credits') return ui.showCredits();
        t.classList.add('bg'); if (a === 'new') t.classList.add('bgnew'); t.querySelectorAll('button').forEach(b => b.hidden = true); res(a);
      });
      const first = t.querySelector('.tbtns button'); if (first) first.focus();
    });
  },
  /* Lista de partidas guardadas. Devuelve el id elegido (o null). mode 'full': ya hay MAX_SLOTS y hay que borrar una para empezar otra (devuelve true). */
  slotsScreen(mode) {
    return new Promise(res => {
      const full = mode === 'full', fmt = d => { const x = new Date(d); return x.toLocaleDateString('es-ES') + ' ' + x.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }); };
      const draw = () => {
        const l = listSaves();
        if (!l.length && !full) { this._close(); return res(null); }
        const rows = l.map(s => '<div class="slot"><div><b>' + s.meta.lv + '</b> · ' + s.meta.len + ' · turno ' + s.meta.turn + '<small>' + (s.meta.heroes || []).join(', ') + ' · ' + fmt(s.meta.date) + '</small></div><div class="sbt">' + (full ? '' : '<button class="primary" data-load="' + s.id + '">Cargar</button>') + '<button data-del="' + s.id + '">' + (full ? 'Borrar y empezar nueva' : 'Borrar') + '</button></div></div>').join('');
        const b = this._modal('<h2>' + (full ? 'Partidas guardadas (máximo ' + MAX_SLOTS + ')' : 'Cargar partida') + '</h2>' + (full ? '<p>Has llegado al máximo. Borra una partida para empezar otra.</p>' : '') + '<div class="slots">' + rows + '</div><div class="opts"><button id="slotx">' + (full ? 'Cancelar' : 'Volver') + '</button></div>', 'toppanel');
        $('slotx').onclick = () => { this._close(); res(null); };
        b.querySelectorAll('[data-load]').forEach(bt => bt.onclick = () => { this._close(); res(bt.dataset.load); });
        b.querySelectorAll('[data-del]').forEach(bt => bt.onclick = () => {
          if (!confirm('¿Borrar esta partida guardada?')) return;
          deleteSave(bt.dataset.del); if (full) { this._close(); res(true); } else draw();
        });
      };
      draw();
    });
  },
  showTop() {
    const tt = $('title'); if (tt) tt.classList.add('bgrank');
    const list = loadTop(), fmt = d => new Date(d).toLocaleDateString('es-ES');
    const rows = list.length ? list.map((r, i) => '<tr><td>' + (i + 1) + '</td><td class="' + (r.win ? 'good' : 'bad') + '">' + (r.win ? 'Victoria' : 'Derrota') + '</td><td><b>' + r.score + '</b></td><td>' + r.lv + ' · ' + r.len + '</td><td>' + r.turns + '</td><td>' + r.killed + '</td><td>' + fmt(r.date) + '</td></tr>').join('')
      : '<tr><td colspan="7" style="text-align:center;color:var(--mut)">Aún no hay partidas terminadas.</td></tr>';
    this._modal('<h2>Top supervivientes</h2><table class="toptbl"><tr><th>#</th><th>Resultado</th><th>Puntos</th><th>Partida</th><th>Turnos</th><th>Zeds</th><th>Fecha</th></tr>' + rows + '</table><div class="opts">' + (list.length ? '<button id="topclr">Borrar</button>' : '') + '<button class="primary" id="xb">Cerrar</button></div>', 'toppanel');
    $('xb').onclick = () => { this._close(); const t2 = $('title'); if (t2) t2.classList.remove('bgrank'); };
    if ($('topclr')) $('topclr').onclick = () => { if (confirm('¿Borrar todo el ranking?')) { clearTop(); this.showTop(); } };
  },
  showCredits() {
    this._modal('<h2>Créditos</h2><p><b>Dawn of the Zeds</b> (3.ª edición)<br>Diseño del juego original: <b>Hermann Luttmann</b><br>Editorial: Victory Point Games</p><p>Esta adaptación web en solitario es un proyecto de aficionados, sin ánimo de lucro y no oficial. Las ilustraciones, cartas y marcas pertenecen a sus respectivos autores y editores.</p><p style="color:var(--mut);font-size:13px">Adaptación y programación: Antonio Maestre Garrido, con la ayuda de Claude.</p><div class="opts"><button class="primary" id="xb">Cerrar</button></div>');
    $('xb').onclick = () => this._close();
  },
  async endScreen() {
    const s = scoreGame(), win = G.over === 'win';
    const tiers = [[-999, 'Menos de 0: vuestro reconocimiento por salvar Farmingdale tiene un regusto amargo.'], [1, '1 a 5: no os dan la espalda del todo, pero vuestra reputación queda cuestionada.'], [6, '6 a 12: la mayoría de vecinos dice que lo hicisteis lo mejor que pudisteis.'], [13, '13 a 20: os reconocen como líderes pragmáticos durante la crisis.'], [21, '21 o más: ¡Medalla de Oro del Congreso! Os aclaman como dirigentes de Farmingdale.']];
    let t = tiers[0][1]; for (const x of tiers) if (s.total >= x[0]) t = x[1];
    const ch = chaosOnMap(), chTxt = ch <= 6 ? 'Poco Caos en el mapa' : ch <= 9 ? 'Mucha ruina a vuestro paso' : 'Una devastación infernal';
    const refTxt = s.soft === 0 ? 'Ningún refugiado superviviente' : s.soft <= 2 ? 'Unos pocos refugiados supervivientes' : 'Muchos refugiados supervivientes';
    const why = G.loseWhy === 'caos' ? 'Habéis perdido por el Caos.' : 'Un Zed ha entrado en el Centro de la Ciudad.';
    G.phase = 'end'; this.updateStats(); this.gameMusicEnd(win);
    Voz.say(win ? 'victoria' : G.loseWhy === 'caos' ? 'derrota_caos' : 'derrota_centro');
    saveTop({ win, score: s.total, lv: G.lv.name, len: G.len.name, turns: G.turnNo, killed: G.stats.killed, date: Date.now() });
    this._modal('<div class="endcard"><h2 class="' + (win ? 'good' : 'bad') + '">' + (win ? '¡HABÉIS GANADO!' : 'FARMINGDALE HA CAÍDO') + '</h2><p>' + (win ? 'Habéis sobrevivido a todas las cartas de Evento.' : why) + '</p><p>Unidades de jugador vivas: <b>' + s.units + '</b> · Aldeanos y Refugiados: <b>' + s.soft + '</b><br>Bien: <b>' + s.good + '</b> · Mal (Caos' + (win ? '' : ' + cartas sin revelar') + '): <b>' + s.bad + '</b><br>Zeds eliminados: <b>' + G.stats.killed + '</b></p><p style="font-size:20px">Puntuación: <b style="color:var(--gold)">' + s.total + '</b></p><p style="color:var(--mut);font-size:13px">' + t + '<br>' + chTxt + ' · ' + refTxt + (G.antidote ? ' · Antídoto descubierto' : '') + (G.weapon && G.weapon.parts.length ? ' · Súper Arma de ' + G.weapon.parts.length + ' componente(s)' : '') + '.</p><div class="opts" style="justify-content:center"><button class="primary" id="nb">Nueva partida</button></div></div>');
    $('nb').onclick = () => ui.reloadToMenu();
  }
};
function payFire(u) {
  if (G.turn.mercs) return;
  if (u.key === 'jones' || u.type === 'petra') { G.supplies--; return; }
  if ((u.key === 'staub' || u.key === 'division12') && !G.firstFreeUsed[u.key]) { G.firstFreeUsed[u.key] = true; return; }
  G.ammo -= (u.type === 'guard' ? 2 : 1); if (UI) UI.updateStats();
}
function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function badge(c, x, y, t, bg, fg) { c.save(); c.font = '900 22px Impact'; const w = Math.max(26, c.measureText(t).width + 14); c.fillStyle = bg; rr(c, x - w / 2, y - 14, w, 28, 8); c.fill(); c.strokeStyle = '#000'; c.lineWidth = 2; c.stroke(); c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(t, x, y + 1); c.restore(); }
function tag(c, x, y, t, bg) { c.save(); c.font = '800 11px Segoe UI'; const w = c.measureText(t).width + 8; c.fillStyle = bg; rr(c, x - w / 2, y - 8, w, 16, 5); c.fill(); c.strokeStyle = '#000'; c.lineWidth = 1.5; c.stroke(); c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(t, x, y + 1); c.restore(); }
