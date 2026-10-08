/* Motor de reglas de Dawn of the Zeds (3.ª ed.) — núcleo: tablero, unidades, combate, movimiento, disparo, búsqueda. */
'use strict';

const G = {};
let UI = null;
function bindUI(u) { UI = u; }
/* Generador con semilla (mulberry32): su estado se guarda con la partida para que repetir una acción dé las mismas tiradas. */
let RNG_S = 1;
function rngSeed(v) { RNG_S = v >>> 0; }
function rngState() { return RNG_S; }
function rngRestore(v) { RNG_S = v >>> 0; }
function rnd(n) { RNG_S = (RNG_S + 0x6D2B79F5) >>> 0; let t = RNG_S; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return Math.floor(((t ^ (t >>> 14)) >>> 0) / 4294967296 * n); }
/* Modo debug (se activa al empezar la partida): cada dado que se tira pregunta qué valor debe salir. */
let DEBUG_DICE = false;
function d6() {
  const r = 1 + rnd(6); if (!DEBUG_DICE) return r;
  const m = (new Error().stack || '').split('\n').slice(2, 4).map(l => (l.match(/at (?:async )?([\w.$]+)/) || [])[1]).filter(f => f && f !== 'Array.from' && f !== 'map').join(' ← ');
  for (;;) { const v = window.prompt('DEBUG · Tirada de dado' + (m ? ' (' + m + ')' : '') + '\nValor 1-6 (vacío o Cancelar = ' + r + '):', ''); if (v === null || v.trim() === '') return r; const n = parseInt(v, 10); if (n >= 1 && n <= 6) return n; }
}
/* Dado aleatorio solo para la animación (no consume la secuencia ni pregunta). */
const fxD6 = () => 1 + Math.floor(Math.random() * 6);
/* Tirada de 1 dado visible: se muestra el dado y el resultado y hay que confirmar con un clic. fn(r) devuelve el texto del resultado. */
async function rollShown(label, fn) { const [r] = await UI.rollSimple(label, 1, d => fn(d[0])); return r; }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
const LOG = (m, c) => UI && UI.log(m, c);

/* ================= TABLERO ================= */
function buildBoard() {
  G.spaces = {}; G.routes = G.lv.tunnel ? ROUTE_IDS.slice() : SURFACE.slice(); G.last = {};
  for (const r of G.routes) {
    const sps = ROUTES[r].spaces; G.last[r] = sps.length - 1;
    sps.forEach((s, i) => { G.spaces[r + i] = { id: r + i, route: r, i, kind: s.kind, name: s.name || null, x: s.x, y: s.y, units: [], chaos: 0, bar: 0, mine: 0 }; });
  }
  G.spaces.C = { id: 'C', route: null, i: -1, kind: 'centro', name: CENTRO.name, x: CENTRO.x, y: CENTRO.y, units: [], chaos: 0, bar: 0, mine: 0 };
  const ex = [];
  if (G.lv.infection) ex.push('H1', 'H2', 'H3', 'H4');
  if (G.lv.res) ex.push('O1', 'O2', 'LAB');
  if (G.lv.fourR) ex.push('CAMP');
  for (const id of ex) { const e = EXTRA_SPACES[id]; G.spaces[id] = { id, route: null, i: -1, kind: e.kind, name: e.name, x: e.x, y: e.y, units: [], chaos: 0, bar: 0, mine: 0 }; }
}
const sp = id => G.spaces[id];
const isRouteSp = id => !!(sp(id) && sp(id).route);
function lastOf(r) { return G.last[r]; }
function nextToward(id) { const s = sp(id); return s.i === lastOf(s.route) ? 'C' : s.route + (s.i + 1); }
function prevToward(id) { const s = sp(id); return s.i > 0 ? s.route + (s.i - 1) : null; }
function neighbors(id) {
  const s = sp(id);
  if (id === 'C') { const o = G.routes.map(r => r + lastOf(r)); for (const k of ['H1', 'H2', 'H3', 'H4', 'O1', 'O2', 'LAB']) if (G.spaces[k]) o.push(k); return o; }
  if (!s.route) { const o = ['C']; const other = s.kind === 'bed' ? ['O1', 'O2'] : s.kind === 'office' ? ['H1', 'H2', 'H3', 'H4'] : []; for (const k of other) if (G.spaces[k]) o.push(k); return o; }
  const o = []; if (s.i > 0) o.push(s.route + (s.i - 1)); o.push(nextToward(id)); return o;
}
function adjacentIds(id) { // adyacencia para efectos (incluye Hospital ~ Centro)
  const o = neighbors(id).slice(); if (id === 'C') return o; if (!sp(id).route) o.push(...neighbors('C').filter(x => x !== id)); return o;
}
function spaceNum(id) { const s = sp(id); return s.route ? lastOf(s.route) - s.i : null; }
function spaceLabel(id) {
  const s = sp(id);
  if (id === 'C') return 'Centro de la Ciudad';
  if (!s.route) return s.name;
  const rn = ROUTES[s.route].short;
  if (s.name) return s.name + ' (' + rn + ')';
  if (s.i === 0) return 'Inicio ' + rn;
  return rn + ' n.º ' + spaceNum(id);
}
const isInit = id => isRouteSp(id) && sp(id).i === 0;
const isNamed = id => { const s = sp(id); return !!s.name && s.kind !== 'bed' && s.kind !== 'office' && s.kind !== 'lab' && s.kind !== 'camp' || s.kind === 'centro'; };
const isCity = id => sp(id).kind === 'city' || sp(id).kind === 'centro';
const isSurface = id => !isRouteSp(id) ? (id === 'C' || sp(id).kind === 'bed' || sp(id).kind === 'office' || sp(id).kind === 'lab') : sp(id).route !== 'T';
const isCrypt = id => sp(id).kind === 'crypt';
function spaceKindLabel(id) { return sp(id).kind; }

/* ================= UNIDADES ================= */
let UID = 1;
function newUnit(o) { const u = Object.assign({ id: 'u' + (UID++), hits: 0, flipped: false, space: null, free: 0, hf: 1, hr: 1 }, o); G.units[u.id] = u; return u; }
let strength = u => (u.flipped ? u.red : u.full) + (u.trained ? 2 : 0);
const isZedSide = u => u.side === 'zed';
const isFighter = u => u.side === 'pl' && !['refugee', 'aldeano'].includes(u.type);
const isSoft = u => u.type === 'refugee' || u.type === 'aldeano';
const isHero = u => u.type === 'hero';
const isCiv = u => u.type === 'civ';
function putUnit(u, id) {
  if (u.space && G.spaces[u.space]) { const o = sp(u.space); o.units = o.units.filter(x => x !== u.id); }
  u.space = id; if (id && G.spaces[id]) sp(id).units.push(u.id);
}
function removeUnit(u) { if (u.space && G.spaces[u.space]) { const o = sp(u.space); o.units = o.units.filter(x => x !== u.id); } u.space = null; }
function unitsAt(id) { return sp(id).units.map(x => G.units[x]).filter(Boolean); }
const zedsAt = id => unitsAt(id).filter(isZedSide);
const normalZedsAt = id => zedsAt(id).filter(u => u.type !== 'spreader');
const plAt = id => unitsAt(id).filter(isFighter);
const softAt = id => unitsAt(id).filter(isSoft);
const raidAt = id => unitsAt(id).filter(u => u.side === 'raid');
function routeUnits(r, pred) { let a = []; for (let i = 0; i <= lastOf(r); i++) a = a.concat(unitsAt(r + i).filter(pred || (() => true))); return a; }
const routeZeds = r => routeUnits(r, isZedSide);
const allUnits = pred => Object.values(G.units).filter(u => u.space && u.space !== 'CEM' && (!pred || pred(u)));
const hero = key => allUnits(u => u.key === key && u.space !== 'CEM')[0];
const alive = key => { const h = hero(key); return h && !h.ecg ? h : null; };
const controlled = id => !!(zedsAt(id).length || sp(id).chaos);

function zedCap(id) { const s = sp(id); if (s.kind === 'crypt') return 99; if (s.route === 'T') return (s.i === 0 || s.i === lastOf('T')) ? 2 : 1; return 2; }
function playerCap(id) {
  const s = sp(id);
  if (id === 'C' || s.kind === 'camp' || s.kind === 'crypt') return 99;
  if (s.kind === 'bed' || s.kind === 'office' || s.kind === 'lab') return 1;
  if (s.route === 'T') return (s.i === lastOf('T')) ? 2 : 1;
  return 2;
}
function playerRoom(id, u) {
  const s = sp(id); if (s.kind === 'bed') return !unitsAt(id).length;
  const here = unitsAt(id).filter(x => (isFighter(x) || x.side === 'raid') && x !== u).length;
  if (s.route === 'T' && s.kind !== 'crypt' && s.i !== lastOf('T')) return here === 0 && !zedsAt(id).length;
  return here < playerCap(id);
}
function terrainOf(id) {
  if (G.turn.noTerrain) return 0;
  const s = sp(id); let t = 0;
  if (s.kind === 'city' || s.kind === 'centro') t = 2; else if (s.kind === 'pueblo' || s.kind === 'named' || (s.route && s.name && s.kind !== 'init')) t = 1;
  if (s.bar) t = Math.max(t, s.bar === 2 ? 3 : 2);
  return t;
}
const blocked = id => G.turn.block.includes(id);

/* ================= ZEDS ================= */
function drawNormalToken() {
  if (!G.reserve.length) return null;
  if (alreadyHas('antinatural') && G.reserve.length > 1) {
    const a = G.reserve.splice(rnd(G.reserve.length), 1)[0], b = G.reserve.splice(rnd(G.reserve.length), 1)[0];
    const keep = a[0] >= b[0] ? a : b; G.reserve.push(a[0] >= b[0] ? b : a); return keep;
  }
  return G.reserve.splice(rnd(G.reserve.length), 1)[0];
}
function makeZed() {
  const t = drawNormalToken(); if (!t) return null;
  return newUnit({ side: 'zed', type: 'zed', name: 'Zed', full: t[0], red: t[1], hf: 3, hr: 3, token: t });
}
function makeSuper() {
  if (!G.supers.length) return makeZed();
  const k = G.supers.splice(rnd(G.supers.length), 1)[0], d = SUPER_ZEDS[k];
  return newUnit({ side: 'zed', type: 'super', key: k, name: d.name, full: d.full, red: d.red, hf: 3, hr: 3, img: d.img, resistZ: k === 'ferreo' });
}
function discardZed(u) {
  const keepTok = u.token;
  if (u.token) G.reserve.push(u.token);
  removeUnit(u); delete G.units[u.id]; return keepTok;
}
function zedBack(id, n) { // recoloca un Zed retrocediendo hasta hallar sitio; devuelve el id final
  const s = sp(id); if (!s.route) return id;
  let i = s.i;
  while (i >= 0 && normalZedsAt(s.route + i).length >= zedCap(s.route + i) && sp(s.route + i).kind !== 'crypt') i--;
  return i < 0 ? null : s.route + i;
}
async function placeZedAt(id, why, zed) {
  zed = zed || makeZed();
  if (!zed) { LOG('No quedan fichas Zed en la reserva.'); return null; }
  if (id === 'C' || !isRouteSp(id)) { discardZed(zed); return null; }
  let target = id;
  if (zed.type !== 'spreader') {
    target = zedBack(id);
    if (target === null) { target = firstOpenInitial(); if (!target) { returnZed(zed); LOG('No hay sitio para un Zed nuevo.'); return null; } }
  }
  if (!UI.fast) Sfx.zed(); putUnit(zed, target); UI.pulseSpace(target, '#ff4a3a'); UI.toast('Nuevo Zed en ' + spaceLabel(target), '#ff4a3a', 1100);
  LOG('Nuevo ' + (zed.type === 'super' ? 'Súper Zed (' + zed.name + ')' : 'Zed (' + zed.full + ')') + ' en ' + spaceLabel(target) + (why ? ' — ' + why : '') + '.', 'zed');
  UI.redraw();
  if (plAt(target).length || softAt(target).length) { if (!blocked(target)) await zedAttack([zed], target, prevToward(target)); }
  return zed;
}
function returnZed(z) { if (z.token) G.reserve.push(z.token); else if (z.type === 'super') G.supers.push(z.key); removeUnit(z); delete G.units[z.id]; }
function firstOpenInitial() { for (const r of G.routes) if (normalZedsAt(r + '0').length < zedCap(r + '0')) return r + '0'; return null; }
async function placeZedInitial(r, zed) {
  zed = zed || makeZed(); if (!zed) { LOG('No quedan fichas Zed.'); return null; }
  let t = r + '0';
  if (normalZedsAt(t).length >= zedCap(t)) t = firstOpenInitial();
  if (!t) { returnZed(zed); LOG('Todos los espacios Iniciales están llenos.'); return null; }
  UI.focus(t, 1.7); putUnit(zed, t); UI.pulseSpace(t, '#ff4a3a'); UI.toast('Nuevo Zed en ' + spaceLabel(t), '#ff4a3a', 1100); LOG('Nuevo ' + (zed.type === 'super' ? 'Súper Zed' : 'Zed') + ' (' + zed.full + ') en ' + spaceLabel(t) + '.', 'zed'); UI.redraw(); await UI.settle(); return zed;
}
function alreadyHas(rid) { return G.res && G.res.cur && G.res.cur.id === rid; }

/* ================= INFECCIÓN ================= */
async function infUp(n) {
  if (!G.lv.infection || n <= 0) return;
  if (G.berraAnti === 'antidoto') {/* sin cambio */}
  const i0 = G.inf; G.inf = Math.min(13, G.inf + n); UI.updateStats(); UI.fxInf(G.inf - i0);
  if (G.inf >= 13 && !G.inWild) { G.inWild = true; LOG('¡La Infección llega al máximo! Brote Descontrolado.', 'bad'); await outbreak(true); G.inWild = false; }
}
function infDown(n) { if (!G.lv.infection || n <= 0) return; const i0 = G.inf; G.inf = Math.max(0, G.inf - n); UI.updateStats(); UI.fxInf(G.inf - i0); }
function meleeInfection(zs, h) {
  let n = 1;
  for (const z of zs) { if (z.toxic) n = Math.max(n, 3); if (z.key === 'supurador') n = Math.max(n, 3); if (z.key === 'lobo') n = Math.max(n, 2); }
  if (h && (h.key === 'horacio' || h.key === 'antidist')) return 0;
  return n;
}

/* ================= IMPACTOS ================= */
const capOf = u => (u.flipped ? u.hr : u.hf);
function hitUnitOnce(u) { u.hits++; if (u.hits >= capOf(u)) { if (!u.flipped) { u.flipped = true; u.hits = 0; return 'flip'; } return 'dead'; } return 'hit'; }
async function applyZedHits(zeds, n) {
  for (let k = 0; k < n; k++) {
    zeds = zeds.filter(z => G.units[z.id] && z.space);
    if (!zeds.length) break;
    let pool = zeds.filter(z => z.type !== 'spreader'); if (!pool.length) pool = zeds;
    let t = pool[0];
    if (pool.length > 1) {
      const v = await UI.choose({ title: 'Impacto ' + (k + 1) + ' de ' + n, text: 'Elige a qué unidad Zed aplicas este Impacto.', options: pool.map(z => ({ label: z.name + ' ' + strength(z) + (z.hits ? ' (' + z.hits + ' ♥)' : '') + (z.flipped ? ' · reducido' : ''), value: z.id })) });
      t = G.units[v];
    }
    await hitZed(t);
  }
}
async function hitZed(t) {
  if (t.zresist || t.resistZ) { const r = d6(); if (r <= 3) { LOG('Resistente: el Impacto se cancela (dado ' + r + ').'); await UI.fxResist(t, r); return; } }
  const before = { flipped: t.flipped, hits: t.hits };
  const r = hitUnitOnce(t);
  if (r === 'flip') { LOG(t.name + ' queda con Fuerza reducida (' + t.red + ').'); await UI.fxFlip(t, before); }
  else if (r === 'dead') await zedDies(t);
  else { LOG('Impacto a ' + t.name + ' ' + strength(t) + ' (' + t.hits + ').'); await UI.fxHit(t); }
  UI.redraw();
}
async function zedDies(t) {
  G.stats.killed++; Voz.say('muerte_zed', .1);
  if (t.type === 'spreader') {
    const r = d6(); const rt = routeOfZ(t);
    if (r <= 3 && rt) { await UI.fxResist(t, r, 'Huye'); t.hits = 0; t.flipped = false; putUnit(t, rt + '0'); LOG(t.name + ' vuelve al espacio Inicial (tirada ' + r + ').'); }
    else { await UI.fxBoom(t); LOG(t.name + ' queda fuera de juego.', 'good'); removeUnit(t); delete G.units[t.id]; }
    return;
  }
  await UI.fxBoom(t);
  LOG(t.name + ' eliminado.', 'good');
  if (t.type === 'super') { removeUnit(t); delete G.units[t.id]; } else discardZed(t);
}
function routeOfZ(z) { return z.space && sp(z.space).route; }
const resistsPl = u => u.res === 'r' ? 4 : u.res === 'f' ? 5 : 0;
async function hitPlayer(u, n) {
  for (let k = 0; k < n; k++) {
    if (!u.space) return;
    if (u.type === 'aldeano') return;
    if (u.type === 'refugee') { if (u.space && sp(u.space).kind === 'bed') await sendCemetery(u, 'recibe un Impacto en el Hospital'); else await unitDown(u); return; }
    const th = resistsPl(u);
    if (th) { const r = await zen1(d6(), 'resistir el Impacto (' + th + '+)'); if (r >= th) { LOG(u.name + ' ignora el Impacto (dado ' + r + ').', 'good'); await UI.fxResist(u, r, u.res === 'f' ? 'Reforzada' : 'Resistente'); continue; } }
    if ((u.chips || []).includes('traje')) { const r = d6(); if (r >= 4) { LOG(u.name + ' (DARPA) ignora el Impacto.', 'good'); await UI.fxResist(u, r, 'DARPA'); continue; } }
    if (u.space && sp(u.space).kind === 'bed' && u.ecg) { await sendCemetery(u, 'recibe un Impacto estando en coma'); return; }
    const before = { flipped: u.flipped, hits: u.hits };
    const r = hitUnitOnce(u);
    if (r === 'flip') { LOG(u.name + ' queda con Fuerza reducida (' + u.red + ').', 'bad'); await UI.fxFlip(u, before); }
    else if (r === 'hit') await UI.fxHit(u);
    else if (r === 'dead') { if (u.space && sp(u.space).kind === 'bed') await sendCemetery(u, 'recibe su último Impacto en el Hospital'); else await unitDown(u); return; }
    if (u.type === 'hero') Voz.say('herido');
    UI.redraw();
  }
}
async function sendCemetery(u, why) {
  LOG(u.name + ' ' + (why || 'muere') + ' → al Cementerio.', 'bad');
  if (u.type === 'hero') G.stats.heroLost++; if (u.type === 'civ') G.stats.civLost++;
  const where = u.space;
  if (where && G.spaces[where]) await UI.fxBoom(u);
  if ((u.chips || []).length) { const mates = where && G.spaces[where] ? unitsAt(where).filter(x => x !== u && isFighter(x)) : []; if (mates.length) { const t = mates.length === 1 ? mates[0] : G.units[await UI.pickUnit(mates, 'Fichas de Rumor de ' + u.name + ': ¿quién las recoge?')]; t.chips = (t.chips || []).concat(u.chips); LOG(t.name + ' recoge las fichas de Rumor.', 'good'); } else LOG('Las fichas de Rumor de ' + u.name + ' se pierden.', 'bad'); u.chips = []; }
  removeUnit(u); u.space = 'CEM'; G.cemetery.push(u);
  UI.redraw();
  if (G.turn.propag && u.type === 'civ' && where && isRouteSp(where)) await placeZedAt(where, 'Propagación');
}
function saveBonus() {
  let b = 0; if (alreadyHas('esperanza')) b++;
  const w = alive('wright'); if (w && w.space && sp(w.space).kind === 'office') b++;
  return b;
}
async function unitDown(u) {
  const where = u.space;
  if (G.lv.infection && u.side === 'pl') { const v = await UI.choose({ title: 'Último Impacto: ' + u.name, text: '¿Haces la tirada de Salvación (4-6: al Hospital, +1 Infección) o la mandas directamente al Cementerio?', options: [{ label: 'Tirada de Salvación', value: 'y' }, { label: 'Al Cementerio', value: 'n' }] }); if (v === 'n') { await sendCemetery(u, 'renuncia a la tirada de Salvación'); return; } }
  let r = d6();
  if (u.key === 'staub' || u.key === 'betty') { const r2 = d6(); r = Math.max(r, r2); }
  else r = await zen1(r, 'Tirada de Salvación');
  const tot = r + saveBonus();
  if (u.side === 'raid') { await sendCemetery(u, 'es eliminada'); return; }
  LOG(u.name + ' recibe su último Impacto. Tirada de Salvación: ' + r + (saveBonus() ? '+' + saveBonus() : '') + '.', 'bad');
  await UI.fxSave(u, r, tot > 3, saveBonus());
  if (tot <= 3) { await sendCemetery(u, 'no se salva'); return; }
  const wasCiv = u.type === 'civ';
  if (!G.lv.infection) {
    putUnit(u, 'C'); u.hits = 0; u.flipped = u.type !== 'hero'; u.resist = false;
    LOG(u.name + ' se salva y va al Centro.', 'good'); UI.redraw(); await UI.settle();
  } else {
    if (u.type === 'refugee' || u.type === 'aldeano') u.type = 'refugee';
    const bed = freeBed();
    if (!bed) {
      if (await dischargeSomeone(true, { title: 'Hospital lleno', text: u.name + ' se ha salvado pero no hay Camas libres. Elige a quién dar de alta para hacer sitio (sin ECG: al Centro; con ECG: Cementerio) o manda a ' + u.name + ' al Cementerio.', none: 'Mandar a ' + u.name + ' al Cementerio' })) { return unitDown2(u, where); }
      await sendCemetery(u, 'no encuentra cama'); return;
    }
    await unitDown2(u, where);
    return;
  }
  UI.redraw();
  if (G.turn.propag && wasCiv && where && isRouteSp(where)) await placeZedAt(where, 'Propagación');
  if (G.turn.outbreakLocal && wasCiv && where && isRouteSp(where)) await placeZedAt(where, 'Brote local');
}
async function unitDown2(u, where) {
  const bed = freeBed(); if (!bed) { await sendCemetery(u, 'no encuentra cama'); return; }
  const wasCiv = u.type === 'civ';
  putUnit(u, bed); u.hits = 0; u.flipped = true; u.ecg = true; u.resist = false;
  if (u.type === 'refugee') { u.flipped = false; }
  LOG(u.name + ' ingresa en el Hospital (coma).', 'good');
  UI.redraw(); await UI.settle(); await UI.fxHospital(u);
  await infUp(1); UI.redraw();
  if (G.turn.propag && wasCiv && where && isRouteSp(where)) await placeZedAt(where, 'Propagación');
  if (G.turn.outbreakLocal && wasCiv && where && isRouteSp(where)) await placeZedAt(where, 'Brote local');
}
async function dischargeSomeone(forceCem, o) {
  const cands = BEDS.map(b => unitsAt(b)[0]).filter(Boolean);
  if (!cands.length) return false;
  const v = await UI.chooseCards({ title: (o && o.title) || 'Dar de alta', text: (o && o.text) || 'Elige la unidad a dar de alta (sin ECG: al Centro; con ECG: Cementerio).', options: cands.map(u => unitOpt(u, u.ecg ? ' (coma → Cementerio)' : '')), extra: o && o.none ? [{ label: o.none, value: null }] : null });
  if (v === null) return false;
  const u = G.units[v];
  if (u.ecg) await sendCemetery(u, 'es dada de alta en coma'); else { putUnit(u, 'C'); LOG(u.name + ' recibe el alta y vuelve al Centro.', 'good'); mayDischargeBonus(u); }
  UI.redraw(); return true;
}

/* ================= RETIRADAS ================= */
/* dest === 'C' significa «retirarse hacia el Centro» (1 espacio); otro valor es el espacio concreto al que se vuelve. */
function retreatPlayers(units, dest, back) {
  if (units.length) Voz.say('retirada');
  for (const u of units) {
    if (!u.space || !G.spaces[u.space] || ['bed', 'office', 'lab', 'camp'].includes(sp(u.space).kind)) continue; let d = dest === 'C' ? (sp(u.space).route ? nextToward(u.space) : 'C') : dest;
    let k = back ? back.indexOf(d) : -1; /* sin sitio: se sigue hacia atrás por el recorrido del Mover, y luego hacia el Centro */
    while (d !== 'C' && (!playerRoom(d, u) || blocked(d) || (u.type === 'petra' && false))) d = (k >= 0 && k + 1 < back.length) ? back[++k] : nextToward(d);
    putUnit(u, d); LOG(u.name + ' se retira a ' + spaceLabel(d) + '.');
  }
  UI.redraw();
}
/* Los Zeds se retiran hacia el espacio Inicial de su ruta (startId = primer espacio de la retirada).
   Si acaban en un espacio con unidades de jugador, se produce un nuevo combate en el que atacan ellos (6.4.3). */
async function retreatZeds(zeds, startId) {
  const sorted = zeds.filter(z => z.space).sort((a, b) => strength(b) - strength(a));
  const s0 = sp(startId); if (!s0 || !s0.route) return;
  const landed = {};
  for (const z of sorted) {
    let i = s0.i;
    while (i >= 0 && (z.type !== 'spreader') && (normalZedsAt(s0.route + i).length >= zedCap(s0.route + i) && sp(s0.route + i).kind !== 'crypt' || blocked(s0.route + i))) i--;
    if (i < 0) { const f = firstOpenInitial(); if (f) { putUnit(z, f); LOG('Un Zed retirado se coloca en ' + spaceLabel(f) + '.'); } else { returnZed(z); } continue; }
    const d = s0.route + i; putUnit(z, d); z.moved = true; LOG(z.name + ' (' + strength(z) + ') se retira a ' + spaceLabel(d) + '.');
    (landed[d] = landed[d] || []).push(z);
  }
  UI.redraw();
  for (const d in landed) {
    if (G.over || isInit(d)) continue;
    const zs = landed[d].filter(z => z.space === d);
    if (zs.length && (plAt(d).length || raidAt(d).length || softAt(d).some(u => u.type === 'refugee'))) { LOG('Los Zeds se retiran a un espacio ocupado y atacan.', 'zed'); await zedAttack(zs, d, zedOrigin(zs[0])); }
  }
}

/* ================= COMBATE CUERPO A CUERPO ================= */
function ratioCol(z, p) {
  if (z >= 3 * p) return 0; if (z >= 2 * p) return 1; if (z > p) return 2; if (z === p) return 3;
  if (p >= 3 * z) return 6; if (p >= 2 * z) return 5; return 4;
}
function humanShifts(f, o) { // o: { attacking, space }
  const s = [];
  if (f.key === 'schmidt') s.push({ label: 'Boy Scout (Schmidt)', v: 1 });
  if (f.key === 'wright') s.push({ label: 'Equipo de apoyo (Wright)', v: 1 });
  if (f.key === 'kingman' && !o.attacking) s.push({ label: 'Defensor (Kingman)', v: 1 });
  if (f.armed) s.push({ label: 'Bien Armados', v: 1 });
  if (f.leader) s.push({ label: 'Líder Civil', v: 1 });
  if (f.bonus) s.push({ label: 'Bonificación de la unidad', v: f.bonus });
  if (f.type === 'marine') s.push({ label: 'Marines', v: 1 });
  if (f.bubba) s.push({ label: o.vsPlayers ? 'Banda de Bubba (contra jugadores)' : 'Banda de Bubba (contra Zeds)', v: o.vsPlayers ? -1 : 1 });
  if (o.attacking && f.keepCalm) s.push({ label: '«Keep calm»', v: 2 });
  if (o.attacking && hasPart('nudillos') && f.side === 'pl') s.push({ label: 'Nudillos Zeds', v: 1 });
  return s;
}
function hasPart(k) { return G.weapon && G.weapon.parts.includes(k); }
function zedShifts(zs, o) {
  const s = [];
  if (zs.some(z => z.smart)) s.push({ label: 'Inteligentes', v: -1 });
  if (zs.some(z => z.leader)) s.push({ label: 'Líder Zed', v: -1 });
  if (G.turn.flamed && zs.some(z => G.turn.flamedUnits && G.turn.flamedUnits.includes(z.id))) s.push({ label: 'Zeds flambeados', v: -2 });
  if (G.turn.frenzy) s.push({ label: 'Súper Zeds enloquecidos', v: -2 });
  return s;
}
async function offerCards(f, o) {
  const out = [];
  if (!o.attackerIsHuman && !o.attacking) {/* defendiendo */ }
  for (const [k, lab, v, extra] of [['excavadora', 'Excavadora asesina (2►)', 2, o.attacking], ['sin_nombre', 'El Hombre sin nombre (3►)', 3, true], ['trago', 'Un trago para coger fuerzas (2►, 1 Impacto después)', 2, true]]) {
    if (!extra || f.side !== 'pl') continue;
    const i = G.hand.indexOf(k); if (i < 0) continue;
    const r = await UI.choose({ title: DEST[k].name, text: '¿Juegas la carta?', options: [{ label: 'Jugarla', value: 'y' }, { label: 'No', value: 'n' }] });
    if (r === 'y') { G.hand.splice(i, 1); G.destDiscard.push(k); zenPlayed(); out.push({ label: lab, v }); if (k === 'trago') o.trago = true; UI.updateHand(); }
  }
  return out;
}
async function melee(o) { // { zeds, hum, space, attacker:'z'|'h', from, forceCol, noInf, assassin }
  let zeds = o.zeds.filter(z => z.space), hum = o.hum.filter(u => u.space);
  if (!zeds.length || !hum.length) return {};
  const attackerHuman = o.attacker === 'h';
  const space = o.space;
  let fighter = hum[0];
  if (!attackerHuman && hum.length > 1) {
    const v = await UI.choose({ title: 'Elige la unidad defensora', text: 'Varias unidades en ' + spaceLabel(space) + '. La elegida recibe todos los Impactos.', options: hum.map(u => ({ label: u.name + ' (Fuerza ' + strength(u) + ')', value: u.id })) });
    fighter = G.units[v];
  }
  if (!attackerHuman) for (const u of unitsAt(space)) if (u.resist && (fighter.side === 'pl')) { u.resist = false; LOG(u.name + ' deja de estar Resistiendo.'); }
  const isZedAtk = !attackerHuman && fighter.side === 'pl';
  // Habilidades de evasión al ser atacado por Zeds
  if (isZedAtk && !G.turn.noEvade) {
    if (G.turn.cardio) {
      const v = await UI.choose({ title: 'Regla n.º 7: Cardio', text: '¿Retiras a ' + fighter.name + ' en lugar de luchar?', options: [{ label: 'Retirarse', value: 'y' }, { label: 'Luchar', value: 'n' }] });
      if (v === 'y') { retreatPlayers([fighter], 'C'); return { evaded: true }; }
    }
    if (fighter.key === 'pepinillos') {
      const r = await rollShown('Sigilo de Pepinillos', r => r >= 2 ? '<b>' + r + '</b>: pasa desapercibido' : '<b>' + r + '</b>: combate Cuerpo a Cuerpo'); LOG('Sigilo de Pepinillos: ' + r);
      if (r >= 2) { LOG('Pepinillos pasa desapercibido.', 'good'); return { evaded: true }; }
    }
    if (fighter.key === 'darling') {
      const r = await rollShown('Ataque asesino (Alyssa Darling)', r => r >= 3 ? '<b>' + r + '</b>: ataque asesino (2 columnas a favor, sin Infección ni daño)' : r === 1 ? '<b>' + r + '</b>: combate normal' : '<b>' + r + '</b>: puede retroceder o luchar'); LOG('Ataque asesino: ' + r);
      if (r >= 3) { o.assassin = true; o.noInf = true; }
      else if (r === 2) { const v = await UI.choose({ title: 'Darling', text: 'Puedes retroceder o luchar.', options: [{ label: 'Retroceder', value: 'b' }, { label: 'Luchar', value: 'f' }] }); if (v === 'b') { retreatPlayers([fighter], 'C'); return { evaded: true }; } }
    }
    if (fighter.key === 'johnson') {
      const r = await rollShown('Trampas de Johnson', r => r >= 4 ? '<b>' + r + '</b>: las trampas funcionan' : '<b>' + r + '</b>: las trampas fallan (necesita 4-6)'); LOG('Trampas de Johnson: ' + r);
      if (r >= 4) { await hitZed(zeds[0]); retreatPlayers(unitsAt(space).filter(x => isFighter(x) && x.key !== 'pepinillos'), 'C'); LOG('Johnson retrocede (las trampas funcionan).', 'good'); return { evaded: true }; }
    }
  }
  if (isZedAtk && G.turn.noRetreatOnce) {/* se maneja al final */ }
  if (!UI.fast) { if (zeds.length > 1) Sfx.horde(); else Sfx.growl(); }
  await UI.fxClash(space, attackerHuman ? fighter : zeds[0], attackerHuman ? zeds[0] : fighter);
  let initialCard = 0;
  const zStr = zeds.reduce((a, z) => a + strength(z), 0), pStr = strength(fighter) + meleeStrengthBonus(fighter, { attacking: attackerHuman });
  const betty = fighter.key === 'betty' && zeds.every(z => isZedSide(z));
  const initCol = betty ? bettyCol(fighter) : ratioCol(zStr, pStr);
  const shifts = betty ? (hasPart('nudillos') && attackerHuman ? [{ label: 'Nudillos Zeds', v: 1 }] : []) : humanShifts(fighter, { attacking: attackerHuman, vsPlayers: false });
  const vsPl = zeds.every(z => z.side === 'raid') && fighter.side === 'pl';
  const zs = betty ? [] : zedShifts(zeds, o); for (const s of zs) shifts.push(s);
  if (!attackerHuman && !betty) {
    const sal = zeds.some(z => z.key === 'saltarin');
    const t = (G.lv.n >= 0 && !sal) ? terrainOf(space) : 0;
    if (t) shifts.push({ label: 'Terreno (' + spaceLabel(space) + ')', v: t });
    if (fighter.res === undefined) {/* noop */ }
  }
  if (o.assassin && !betty) shifts.push({ label: 'Ataque asesino (Darling)', v: 2 });
  if (attackerHuman && fighter.key === 'santana' && zeds.every(z => z.type === 'zed')) {
    const r = await rollShown('Carga del Toro', r => r >= 4 ? '<b>' + r + '</b>: ¡los Zeds retroceden!' : '<b>' + r + '</b>: sin efecto (necesita 4-6)'); LOG('Carga del Toro: ' + r);
    if (r >= 4) { await hitZed(zeds[0]); const zl = zeds.filter(z => z.space); if (zl.length) await retreatZeds(zl, zedOrigin(zl[0])); LOG('¡La Carga hace retroceder a los Zeds!', 'good'); return { humanWon: true }; }
  }
  const extraShifts = fighter.side === 'pl' ? await offerCards(fighter, { attacking: attackerHuman }) : [];
  for (const e of extraShifts) shifts.push(e);
  const total = shifts.reduce((a, s) => a + s.v, 0);
  const finalCol = clamp(initCol + total, 0, 6);
  const medal = (fighter.chips || []).includes('medallon') && !G.turn.medalUsed;
  const wilsonBuddy = fighter.side === 'pl' && unitsAt(fighter.space).some(u => u.key === 'wilson' && u !== fighter) && fighter.space !== 'C';
  const wzed = !attackerHuman && fighter.side === 'pl' && alive('wzed') && isCity(space);
  let extraDice = (wilsonBuddy ? 1 : 0) + (wzed ? 1 : 0);
  const h = UI.combatOpen({ title: attackerHuman ? 'Combate: ' + fighter.name + ' ataca' : 'Combate: ataque a ' + spaceLabel(space), zeds, fighter, zStr, pStr, initCol, shifts, finalCol, extraDice });
  let dice = await h.roll(extraDice);
  if (fighter.key === 'schmidt' || fighter.key === 'hunt' || fighter.key === 'horacio') {
    const again = await h.ask('Artes marciales: ¿repites la tirada?', [{ label: 'Repetir', value: 'y' }, { label: 'Aceptar', value: 'n' }]);
    if (again === 'y') dice = await h.roll(extraDice);
  }
  dice = await zenReroll(dice, 'combate', h);
  if (medal && dice.some(d => d < 6)) { const v = await h.ask('Medallón místico: ¿cambias un dado a 6?', [{ label: 'Sí', value: 'y' }, { label: 'No', value: 'n' }]); if (v === 'y') { dice = dice.slice().sort((a, b) => a - b); dice[0] = 6; G.turn.medalUsed = true; } }
  const sum = dice[0] + dice[1], row = sumRow(sum);
  let [zh, ph] = CAC[row][finalCol];
  let zedLoses = finalCol >= CAC_HUMAN_LOSES[row];
  if (zeds.some(z => z.key === 'condenado')) zedLoses = false;
  if (fighter.key === 'division12' && zeds.every(z => z.side === 'zed')) zedLoses = true;
  if (isZedAtk && !zedLoses && G.hand.includes('ferrea')) {
    const v = await h.ask('Los Zeds ganan. ¿Juegas «Férrea determinación»?', [{ label: 'Jugar', value: 'y' }, { label: 'No', value: 'n' }]);
    if (v === 'y') { G.hand.splice(G.hand.indexOf('ferrea'), 1); G.destDiscard.push('ferrea'); zenPlayed(); UI.updateHand(); zh = 1; ph = 0; zedLoses = true; }
  }
  if (o.assassin) ph = 0;
  if ((fighter.chips || []).includes('traje')) zh += 2;
  h.setResult(row, finalCol, [zh, ph], zedLoses);
  await h.done();
  if (!o.noInf && G.lv.infection && !vsPl) await infUp(meleeInfection(zeds, fighter));
  await applyZedHits(zeds, zh);
  if (hasPart('cebo') && !attackerHuman) await applyZedHits(zeds, 1);
  if (fighter.space) { if (fighter.side === 'raid') await hitRaider(fighter, ph); else await hitPlayer(fighter, ph); }
  if (o.trago || false) { if (fighter.space) await hitPlayer(fighter, 1); }
  if (isZedAtk && G.turn.noRetreatOnce && !G.turn.noRetreatDone) { G.turn.noRetreatDone = true; return { again: true, zedWon: !zedLoses }; }
  const left = zeds.filter(z => z.space);
  if (zedLoses) { if (left.length) await retreatZeds(left, attackerHuman ? zedOrigin(left[0]) : (o.from || zedOrigin(left[0]))); }
  else {
    const all = hum.filter(u => u.space === space);
    // todas las unidades de jugador del espacio se retiran
    const extra = unitsAt(space).filter(u => isFighter(u) || u.side === 'raid');
    let arr = [...new Set(all.concat(extra))];
    const pep = arr.find(u => u.key === 'pepinillos' && u !== fighter);
    if (pep && !attackerHuman) { const r = await rollShown('Sigilo de Pepinillos', r => r >= 2 ? '<b>' + r + '</b>: se queda sin retroceder' : '<b>' + r + '</b>: retrocede con los demás'); if (r >= 2) { arr = arr.filter(u => u !== pep); LOG('Sigilo de Pepinillos (' + r + '): se queda en ' + spaceLabel(space) + '.', 'good'); } }
    const pl = arr.filter(u => u.side === 'pl');
    if (attackerHuman) await retreatAndFight(pl, o.from || 'C', o.back);
    else if (arr.some(u => u.side === 'raid')) retreatRaiders(arr.filter(u => u.side === 'raid'));
    else await retreatAndFight(arr, 'C');
  }
  await UI.settle();
  return { zedWon: !zedLoses, humanWon: zedLoses, fighter };
}
/* Retirada de unidades de jugador; si alguna acaba en un espacio con Zeds, entabla un nuevo combate como atacante (6.4.3). */
async function retreatAndFight(units, dest, back) {
  units = units.filter(u => u.space && G.spaces[u.space]);
  if (units.length > 1) {
    const u0 = units[0], first = dest === 'C' ? (sp(u0.space).route ? nextToward(u0.space) : 'C') : dest;
    if (first !== 'C' && G.spaces[first]) {
      const room = playerCap(first) - unitsAt(first).filter(x => (isFighter(x) || x.side === 'raid') && !units.includes(x)).length;
      if (room > 0 && room < units.length) {
        const v = await UI.choose({ title: 'Retirada', text: 'No hay sitio para todas en ' + spaceLabel(first) + '. ¿Qué unidad se queda ahí? (las demás siguen retirándose)', options: units.map(x => ({ label: x.name, value: x.id })) });
        units = [G.units[v]].concat(units.filter(x => x.id !== v));
      }
    }
  }
  retreatPlayers(units, dest, back);
  for (const u of units) {
    if (G.over || !u.space || u.space === 'C' || !G.spaces[u.space] || !zedsAt(u.space).length) continue;
    LOG(u.name + ' se retira a un espacio con Zeds y tiene que combatir.', 'bad');
    await melee({ zeds: zedsAt(u.space), hum: [u], space: u.space, attacker: 'h', from: sp(u.space).route ? nextToward(u.space) : 'C' });
  }
}
function prevPlayerBack(u) { const p = u.space && sp(u.space).route ? nextToward(u.space) : null; return p && playerRoom(p, u) ? p : 'C'; }
function zedOrigin(z) { const s = sp(z.space); return s.route ? s.route + Math.max(0, s.i - 1) : 'C'; }
function retreatRaiders(rs) { for (const r of rs) { const p = prevToward(r.space); if (p) putUnit(r, p); } UI.redraw(); }
async function hitRaider(u, n) { for (let k = 0; k < n && u.space; k++) { const before = { flipped: u.flipped, hits: u.hits }; const r = hitUnitOnce(u); if (r === 'dead') { await sendCemetery(u, 'es destruida'); return; } if (r === 'flip') await UI.fxFlip(u, before); else await UI.fxHit(u); } }

async function zedAttack(zeds, space, from) {
  const pl = plAt(space).concat(raidAt(space)); const soft = softAt(space);
  if (!pl.length) { await devourSoft(zeds, space); return {}; }
  const r = await melee({ zeds, hum: pl, space, attacker: 'z', from });
  if (r.fighter && r.fighter.key === 'betty' && r.humanWon && r.fighter.space) await bettyChain(r.fighter);
  if (!r.again && zedsAt(space).length && !plAt(space).length && softAt(space).some(u => u.type === 'refugee')) await devourSoft(zedsAt(space), space);
  if (r.again) { const z2 = zeds.filter(z => z.space === space); if (z2.length && plAt(space).length) { const r2 = await melee({ zeds: z2, hum: plAt(space), space, attacker: 'z', from }); return r2; } }
  return r;
}
async function devourSoft(zeds, space) {
  for (const u of softAt(space)) {
    if (u.type === 'aldeano') continue;
    LOG(u.name + ' es devorado.', 'bad'); await infUp(2);
    await unitDown(u);
  }
}
/* Aldeanos → Refugiados cuando los Zeds ocupan su espacio */
async function convertAldeanos(space) {
  for (const u of softAt(space).filter(x => x.type === 'aldeano')) {
    u.type = 'refugee'; u.name = 'Refugiados'; LOG('Los Aldeanos huyen: ahora son Refugiados.', 'bad');
    const nx = nextToward(space); if (nx !== 'C' && !zedsAt(nx).length) putUnit(u, nx); else if (nx === 'C') await refugeeArrives(u);
  }
}
async function refugeeArrives(u) {
  await infUp(1); putUnit(u, 'CAMP'); LOG(u.name + ' llega al Campo de Refugiados.', 'good');
  if (u.vip) await vipBenefit(u);
}
async function vipBenefit(u) {
  const v = await UI.choose({ title: 'Supervivientes V.I.P.', text: 'Elige un beneficio:', options: [{ label: 'Técnico de Control de Plagas: Infección a 0', value: 'a' }, { label: 'Técnico médico: cura todas tus unidades', value: 'b' }, { label: 'Recolectores: +4 Suministros y +2 Munición', value: 'c' }] });
  if (v === 'a') G.inf = 0; else if (v === 'b') { for (const x of allUnits(isFighter)) { x.hits = 0; x.flipped = false; x.ecg = false; } } else { G.supplies = Math.min(20, G.supplies + 4); G.ammo = Math.min(20, G.ammo + 2); }
  UI.updateStats();
}

/* ================= MOVIMIENTO ================= */
function surfaceOnly(u) { return u.type === 'guard' || u.type === 'petra' || u.key === 'carter'; }
function canAct(u) { return u && !u.locked && u.space && u.space !== 'CEM' && G.spaces[u.space] && !u.ecg && (!sp(u.space).chaos || u.key === 'pepinillos' || u.key === 'horacio') && u.space !== 'CEM'; }
function moveCost(u, to) { return (to === 'C' && alive('hernandez') && isFighter(u)) ? 0 : 1; }
function officeOk(u, s) { return u.sci || (s.kind !== 'office' && s.kind !== 'lab') || (s.kind === 'office' && u.key === 'may'); }
function canStop(u, id) {
  const s = sp(id);
  if (isInit(id)) return false; if (blocked(id)) return false;
  if (s.kind === 'camp') return false;
  if (!officeOk(u, s)) return false;
  if (!playerRoom(id, u) && !isSoft(u)) return false;
  if (s.bridge === 'down' && true) return false;
  return true;
}
/* Wilson «Atajos»: de un espacio numerado al del mismo número en una ruta de superficie adyacente (1 Movimiento).
   Una unidad que empiece en el espacio de Wilson también puede tomar el atajo desde ahí. */
const ROUTE_RING = ['B', 'M', 'A', 'F'];
function shortcuts(u, cur) {
  const s = sp(cur); if (!s || !SURFACE.includes(s.route) || isInit(cur)) return [];
  const w = alive('wilson'); if (!w) return [];
  if (!(u === w || (cur === u.space && w.space === u.space))) return [];
  const k = ROUTE_RING.indexOf(s.route), n = spaceNum(cur);
  return [ROUTE_RING[(k + 1) % 4], ROUTE_RING[(k + 3) % 4]].filter(r => G.routes.includes(r)).map(r => r + (lastOf(r) - n)).filter(id => G.spaces[id]);
}
function reachable(u, extra) {
  const out = {}; if (!canAct(u) || u.resist || u.type === 'aldeano') return out;
  if (G.turn.noSurfaceMove && isSurface(u.space)) return out;
  const mp = u.mp + (extra || 0), best = { [u.space]: 0 }, q = [u.space], prev = {};
  while (q.length) {
    const cur = q.shift();
    if (cur !== u.space && (zedsAt(cur).length || raidAt(cur).length)) continue;
    if (cur !== u.space && sp(cur).chaos && u.key !== 'pepinillos' && u.key !== 'horacio' && !isSoft(u)) continue;
    for (const n of neighbors(cur).concat(shortcuts(u, cur))) {
      const s = sp(n);
      if (isInit(n) || blocked(n) || s.kind === 'camp') continue;
      if (surfaceOnly(u) && s.route === 'T') continue;
      if (G.turn.rain && s.route === 'M') continue;
      if (s.bridge === 'down' && u.type !== 'zed') continue;
      if (!officeOk(u, s)) continue;
      if (s.kind === 'bed' && cur !== 'C' && sp(cur).kind !== 'office') continue;
      if (s.kind === 'bed' && false) continue;
      if (isSoft(u) && (zedsAt(n).length)) continue;
      const c = best[cur] + (G.spaces[n] ? moveCost(u, n) : 1);
      if (c > mp) continue;
      if (best[n] === undefined || c < best[n]) { best[n] = c; prev[n] = cur; q.push(n); }
    }
  }
  for (const id in best) if (id !== u.space && canStop(u, id)) out[id] = best[id];
  Object.defineProperty(out, 'prev', { value: prev, enumerable: false });
  return out;
}
/* Recorrido (origen … destino) reconstruido con los predecesores de reachable(). */
function pathTo(prev, start, dest) {
  if (!prev) return null; const p = [dest]; let c = dest;
  for (let i = 0; i < 60 && c !== start && prev[c] !== undefined; i++) { c = prev[c]; p.push(c); }
  return c === start ? p.reverse() : null;
}
/* path: recorrido de la acción de Mover. Si se pierde el combate, la unidad se retira UN espacio (al anterior del recorrido). */
async function doMove(u, dest, path) {
  const from = u.space, back = path && path.length > 1 ? path.slice(0, -1).reverse() : null, prevSp = back ? back[0] : from; putUnit(u, dest); LOG(u.name + ' se mueve a ' + spaceLabel(dest) + '.'); UI.redraw(); await UI.settle();
  if (isSoft(u)) { if (dest === 'C') await refugeeArrives(u); return; }
  if (dest === 'C' && u.space === 'C') {/* ok */ }
  const zs = zedsAt(dest), rs = raidAt(dest);
  if (zs.length) {
    let assassin = false;
    if (u.key === 'darling') { const r = await rollShown('Ataque asesino (Alyssa Darling)', r => r >= 3 ? '<b>' + r + '</b>: ataque asesino (2 columnas a favor, sin Infección ni daño)' : r === 1 ? '<b>' + r + '</b>: combate normal' : '<b>' + r + '</b>: puede retroceder o luchar'); LOG('Ataque asesino: ' + r); if (r >= 3) assassin = true; else if (r === 1) {/* combate normal */} else { const v = await UI.choose({ title: 'Darling', text: 'Puedes retroceder o luchar.', options: [{ label: 'Retroceder', value: 'b' }, { label: 'Luchar', value: 'f' }] }); if (v === 'b') { putUnit(u, from); return; } } }
    const rr0 = await melee({ zeds: zs, hum: [u], space: dest, attacker: 'h', from: prevSp, back, assassin, noInf: assassin });
    if (u.key === 'betty' && rr0.humanWon) await bettyChain(u);
  } else if (rs.length) { await melee({ zeds: rs, hum: [u], space: dest, attacker: 'h', from: prevSp, back }); }
  if (dest === 'C' && u.space === 'C') { /* nada */ }
}

/* ================= DISPARO ================= */
function fireRange(u) { if (u.nofire || u.key === 'furias' || u.type === 'refugee' || u.type === 'aldeano') return 0; if (u.space && sp(u.space).route === 'T') return 1; return u.key === 'piazza' ? 3 : (u.key === 'hunt' || u.type === 'marine') ? 2 : 1; }
function fireTargets(u) {
  const out = {}; const r = fireRange(u); if (!r || !u.space || isInit(u.space)) return out;
  const s = sp(u.space);
  const add = (id, d) => { if (id && sp(id) && (zedsAt(id).length) && !isInit(id) && (!out[id] || out[id] > d)) out[id] = d; };
  for (let d = 1; d <= r; d++) {
    if (s.route) for (const ii of [s.i + d, s.i - d]) { if (ii >= 1 && ii <= lastOf(s.route)) add(s.route + ii, d); }
    else if (u.space === 'C') for (const rr of G.routes) { const ii = lastOf(rr) + 1 - d; if (ii >= 1) add(rr + ii, d); }
  }
  return out;
}
function fireStrength(u, d) {
  if (u.key === 'piazza') return d === 1 ? 2 : d === 2 ? 4 : 3;
  if (u.key === 'santana') return u.flipped ? 2 : 3;
  if (u.key === 'staub' && u.flipped) return 2;
  return strength(u);
}
async function doFire(u, targetId, dist, opts) {
  opts = opts || {};
  await UI.fxShot(u, targetId, dist);
  const zs = zedsAt(targetId); let target = zs[0];
  if (zs.length > 1) { const v = await UI.choose({ title: 'Objetivo', text: 'Elige la unidad Zed objetivo.', options: zs.map(z => ({ label: z.name + ' ' + strength(z) + (z.hits ? ' (' + z.hits + ' ♥)' : ''), value: z.id })) }); target = G.units[v]; }
  let str = opts.str || fireStrength(u, dist); const shifts = [];
  if (G.turn.combineFire && !opts.str) { const mates = unitsAt(u.space).filter(x => x !== u && isFighter(x) && !x.nofire && fireRange(x) >= dist); if (mates.length) { str += mates.reduce((a, x) => a + fireStrength(x, dist), 0); LOG('Plan de guerra negro: ' + mates.map(x => x.name).join(', ') + ' suman su Fuerza (' + str + ').', 'good'); } }
  if (u.armed) shifts.push({ label: 'Bien Armados', v: 1 }); if (u.leader) shifts.push({ label: 'Líder Civil', v: 1 });
  if (u.key === 'wright') shifts.push({ label: 'Equipo de apoyo', v: 1 });
  if (u.key === 'johnson') shifts.push({ label: 'Armas (Johnson)', v: 2 });
  if (u.type === 'marine' && dist > 1) shifts.push({ label: 'Largo Alcance', v: -1 });
  if (u.key === 'hunt' && dist === 2) shifts.push({ label: 'Largo Alcance (Hunt)', v: -1 });
  if (hasPart('rifle') && u.side === 'pl') shifts.push({ label: 'Rifle Hipno-Z', v: 1 });
  if (G.turn.mercs) shifts.push({ label: 'Soldados de fortuna', v: 1 });
  if (opts.shift) shifts.push({ label: opts.shiftLabel || 'Bonificación', v: opts.shift });
  if (G.hand.includes('tiradles')) {/* se usa en combate */ }
  const col = clamp(clamp(str, 1, 7) - 1 + shifts.reduce((a, s) => a + s.v, 0), 0, 6);
  const h = UI.fireOpen({ shooter: u, target, str, shifts, col, dist });
  let dice = await h.roll(0); dice = await zenReroll(dice, 'disparo', h);
  const row = sumRow(dice[0] + dice[1]); const hits = FIRE[row][col];
  h.setResult(row, col, hits); await h.done();
  if (hits) { await applyZedHits([target], hits); if (hits >= 2 && hasPart('balas')) { const left = zedsAt(targetId); if (left.length) await retreatZeds(left, zedOrigin(left[0])); } }
  else LOG('El disparo no impacta.');
  if (u.key === 'piazza' && u.space && u.space !== 'C' && !opts.noVig) {
    // Retroceder = alejarse del objetivo, es decir, hacia el Centro (índice mayor en la ruta).
    const s = sp(u.space); let back = s.route ? nextToward(u.space) : null;
    while (back && back !== 'C' && (!playerRoom(back, u) || blocked(back))) back = nextToward(back);
    if (back && !zedsAt(back).length && !raidAt(back).length) {
      const v = await UI.choose({ title: 'Vigilancia', text: 'Piazza puede retroceder 1 espacio (hacia el Centro) tras disparar.', options: [{ label: 'Retroceder a ' + spaceLabel(back), value: 'y' }, { label: 'Quedarse', value: 'n' }] });
      if (v === 'y') {
        const from = u.space, mates = unitsAt(from).filter(x => x !== u && (isFighter(x) || isSoft(x)) && !x.mount);
        const go = [u]; for (const m of mates) { const w = await UI.choose({ title: 'Vigilancia', text: '¿' + m.name + ' retrocede con Piazza?', options: [{ label: 'Sí', value: 'y' }, { label: 'No', value: 'n' }] }); if (w === 'y') { go.push(m); } }
        for (const g of go) { if (back === 'C' || playerRoom(back, g)) { putUnit(g, back); if (g.resist) g.resist = false; if (g.type === 'aldeano') { g.type = 'refugee'; g.name = 'Refugiados'; LOG('Los Aldeanos que acompañan a Piazza pasan a ser Refugiados.'); } } }
        UI.redraw();
      }
    }
  }
}

/* ================= BUSCAR ================= */
function canSearch(u) { return canAct(u) && u.type !== 'refugee' && u.type !== 'aldeano' && isNamed(u.space) && !isInit(u.space) && !['bed', 'office', 'lab', 'camp'].includes(sp(u.space).kind); }
function searchBonus(u) {
  let b = 0; if (u.key === 'hauser') b++;
  if (alive('hernandez') && u.key !== 'hernandez' && isCity(u.space)) b++;
  if (alreadyHas('ahora')) b++;
  return b;
}
async function doSearch(u) {
  const s = sp(u.space); const bonus = searchBonus(u);
  let dice = []; const two = u.rapi && !(u.key === 'pepinillos' && controlled(u.space));
  const n = two ? 2 : 1;
  const rolled = await UI.rollSimple('Buscar en ' + spaceLabel(u.space) + (two ? ' (Rapiñador: 2 dados)' : ''), n, d => {
    const top = Math.max(...d), fin = Math.min(6, top + bonus), dbl = d.length === 2 && d[0] === d[1];
    return (d.length === 2 ? 'Se usa el <b>mejor dado</b> (no la suma): <b>' + top + '</b>' : 'Dado: <b>' + top + '</b>') + (bonus ? ' +' + bonus + ' = <b>' + fin + '</b>' : '') + ' → ' + (fin >= 6 ? 'resultado alto' : fin >= 4 ? 'encuentras algo' : 'no encuentras nada') + (dbl ? '<br>¡Dobles! Se busca 2 veces.' : '');
  });
  let results = rolled.map(r => [r, Math.min(6, r + bonus)]);
  let best = results.slice().sort((a, b) => b[1] - a[1])[0];
  const doubles = two && rolled[0] === rolled[1];
  let count = doubles ? 2 : 1;
  let msgs = [];
  for (let k = 0; k < count; k++) {
    const res = best[1], big = res >= 6, mid = res >= 4 && res <= 5;
    if (!mid && !big) { if (k === 0) msgs.push('no encuentras nada'); continue; }
    const nm = s.name || '';
    const mina = nm === 'Mina Lucky Strike' || nm === 'Garita de Seguridad', granja = nm === 'Granja', city = isCity(u.space);
    let sup = 0, am = 0, choose = false;
    if (city) { sup = 1; if (big) choose = true; }
    else if (granja) { sup = big ? 2 : 1; }
    else if (mina) { am = big ? 2 : 1; }
    else { if (big) am = 1; else sup = 1; }
    if (choose) { const v = await UI.choose({ title: 'Buscar: elige', text: 'Resultado ' + res + ' en un espacio de Ciudad.', options: [{ label: '1 Suministro', value: 's' }, { label: '1 Munición', value: 'a' }] }); if (v === 'a') { sup = 0; am = 1; } }
    if (!G.lv.supplies) sup = 0;
    if (G.res && G.res.cur && G.res.cur.id === 'cecina' && false) { }
    G.supplies = Math.min(20, G.supplies + sup); G.ammo = Math.min(20, G.ammo + am);
    msgs.push((sup ? '+' + sup + ' Suministro(s) ' : '') + (am ? '+' + am + ' Munición' : '') || 'solo hay Suministros (no se usan en el Juego Básico)');
  }
  /* Registro federal de armas: un 1 o un 2 (resultado natural) al Buscar en Ciudad o Pueblo da 1 de Munición. */
  if (sp('C').registro && (isCity(u.space) || s.kind === 'pueblo') && best[0] <= 2) { G.ammo = Math.min(20, G.ammo + 1); msgs.push('+1 Munición (Registro federal de armas)'); }
  if (u.key === 'staub' && G.lv.supplies) { G.supplies = Math.min(20, G.supplies + 1); msgs.push('+1 Suministro (Experto en supervivencia)'); }
  LOG(u.name + ' busca en ' + spaceLabel(u.space) + ' (' + rolled.join('/') + (bonus ? '+' + bonus : '') + '): ' + msgs.join(', ') + '.', 'good');
  UI.updateStats();
}

/* Camas: 3 normales; la 4.ª solo si Doc Seaver está en una Oficina (o ya estaba ocupada). */
function seaverInOffice() { const s = hero('seaver'); return s && s.space && sp(s.space).kind === 'office'; }
function freeBed() { return BEDS.find(b => G.spaces[b] && !unitsAt(b).length && (b !== 'H4' || seaverInOffice())); }

async function bettyChain(u) {
  for (let g = 0; g < 12 && u.space && G.spaces[u.space] && G.units[u.id] && !G.over; g++) {
    if (!sp(u.space).route) return; const n = nextToward(u.space); if (n === 'C' || !G.spaces[n] || !zedsAt(n).length) return;
    const from = u.space; putUnit(u, n); LOG('¡Betty se lanza temerariamente a ' + spaceLabel(n) + '!', 'good'); UI.redraw();
    const r = await melee({ zeds: zedsAt(n), hum: [u], space: n, attacker: 'h', from });
    if (!r.humanWon) return;
  }
}
