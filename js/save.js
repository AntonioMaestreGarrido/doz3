/* Guardado de partida: instantánea del estado (G) + estado del generador aleatorio, en localStorage.
   Se guarda al terminar cada acción y al final de cada turno. La instantánea incluye la semilla, así que
   recargar y repetir una acción da las mismas tiradas. */
'use strict';

const SAVE_KEY = 'doz3.save.v1';

/* Efectos especiales de Evento/Destino que quedan como botón durante el turno. Se describen con {kind, n} para poder guardarlos. */
function mkSpecial(kind, n) {
  const s = { kind, n: n || 0 };
  switch (kind) {
    case 'eficiencia':
      s.label = 'Eficiencia en el Hospital: elegir opción';
      s.fn = async () => {
        const v = await UI.choose({ title: 'Eficiencia en el Hospital', text: 'Elige una opción:', options: [{ label: 'a) 2 Curar gratis en el Hospital (sin reducir la Infección)', value: 'a' }, { label: 'b) −2 de Infección', value: 'b' }, { label: 'c) −1 de Infección y 1 Curar gratis en el Hospital (sin reducir la Infección)', value: 'c' }] });
        if (v === 'a') G.turn.freeHealNoInf = (G.turn.freeHealNoInf || 0) + 2; else if (v === 'b') infDown(2); else { infDown(1); G.turn.freeHealNoInf = (G.turn.freeHealNoInf || 0) + 1; }
      };
      break;
    case 'jornada':
      s.label = 'Jornada doble: +1 Infección → Curar o Investigar gratis';
      s.fn = async () => {
        /* Investigar gratis solo se ofrece si se puede pagar: si la carta en curso cuesta Suministro, hace falta uno (la Infección ya se ha subido). */
        const lab = G.res && G.res.cur && !G.turn.researched && (!G.res.cur.sup || G.supplies >= 1) ?unitsAt('LAB').filter(x => x.sci && canAct(x)) : [];
        const opts = [{ label: 'a) 1 Acción de Curar gratis', value: 'h' }].concat(lab.length ? [{ label: 'b) 1 Acción de Investigar gratis', value: 'i' }] : []).concat([{ label: 'Cancelar', value: '' }]);
        const v = await UI.choose({ title: 'Trabajando una jornada doble (' + (s.n + 1) + '/3)', text: 'Aumentas la Infección en 1 a cambio de:', options: opts });
        if (!v) { G.turn.specials.push(s); return; }
        s.n++; await infUp(1); if (G.over) return;
        if (v === 'h') G.turn.freeHeal = (G.turn.freeHeal || 0) + 1; else await doInvestigate(lab.length === 1 ? lab[0] : G.units[await UI.pickUnit(lab, 'Elige quién investiga.')], true);
        if (s.n < 3) G.turn.specials.push(s);
      };
      break;
    case 'monstruo':
      s.label = '¿Verdadero monstruo?: paciente al Cementerio → Investigación';
      s.fn = async () => {
        const c = BEDS.map(b => G.spaces[b] && unitsAt(b)[0]).filter(Boolean); if (!c.length) { LOG('No hay nadie en el Hospital.'); G.turn.specials.push(s); return; }
        const v = await UI.pickUnit(c, 'Elige la unidad que «das de alta» al Cementerio.'); s.n++; await sendCemetery(G.units[v], 'es «dada de alta» al Cementerio'); if (G.res) await revealResearch();
        if (s.n < 2) G.turn.specials.push(s);
      };
      break;
    case 'atajos':
      s.label = 'Atajos: 1 Impacto a un Héroe del Laboratorio → Investigación';
      s.fn = async () => { G.turn.specials.push(s); /* «Puedes hacer esto tantas veces como quieras»: el botón sigue disponible */ const h = unitsAt('LAB').filter(isFighter)[0]; if (!h) { LOG('No hay nadie en el Laboratorio.'); return; } await hitPlayer(h, 1); if ((await rollShown('Laboratorio: investigación', v => v >= 2 ? '<b>' + v + '</b>: se revela la investigación' : '<b>' + v + '</b>: sin efecto (necesita 2-6)')) >= 2) await revealResearch(); };
      break;
    case 'necesidad':
      s.label = 'Necesidad: 2 Suministros → 1 Munición';
      s.fn = async () => { if (G.supplies >= 2) { G.supplies -= 2; G.ammo = Math.min(20, G.ammo + 1); LOG('2 Suministros → 1 Munición.'); } G.turn.specials.push(s); };
      break;
  }
  return s;
}

/* Referencias a datos estáticos (niveles, cartas) se guardan por id. */
function snapshotState() {
  const g = {};
  for (const k of Object.keys(G)) g[k] = G[k];
  g.lv = G.lv.n; g.len = G.lv.lengths.indexOf(G.len); g.event = G.event ? G.event.id : null;
  if (G.res) g.res = Object.assign({}, G.res, { cur: G.res.cur ? G.res.cur.id : null });
  if (G.turn) g.turn = Object.assign({}, G.turn, { specials: (G.turn.specials || []).map(s => ({ kind: s.kind, n: s.n })) });
  g.busy = false; g.sel = null;
  return g;
}
function restoreState(g) {
  for (const k of Object.keys(G)) delete G[k];
  Object.assign(G, g);
  G.lv = LEVELS[g.lv]; G.len = G.lv.lengths[g.len]; G.event = g.event ? EV[g.event] : null;
  if (g.res) G.res.cur = g.res.cur ? RES[g.res.cur] : null;
  /* Las unidades del Cementerio siguen en G.units: tras el JSON son copias separadas, así que se vuelven a enlazar con el mismo objeto. */
  /* Partidas guardadas con el fallo antiguo: se quitan las unidades que ya volvieron al tablero y las repetidas. */
  if (G.cemetery) { const seen = new Set(); G.cemetery = G.cemetery.map(c => (c && G.units[c.id]) || c).filter(c => c && c.space === 'CEM' && !seen.has(c.id) && seen.add(c.id)); }
  G.turn.specials = g.turn.specials.map(s => mkSpecial(s.kind, s.n));
  /* Partidas guardadas antes del modo cooperativo: un solo jugador. */
  if (!G.players) { initPlayers(null); G.pool = { pl: [(g.pool && g.pool.player) ? 1 : 0], event: g.pool ? g.pool.event : 0 }; }
  if (!G.turn.perm) G.turn.perm = {};
  /* Partidas guardadas antes de que los Civiles Normales mostraran sus valores en el nombre. */
  for (const u of Object.values(G.units || {})) if (u && u.type === 'civ' && u.name === 'Civiles') u.name = civName(u.full, u.red);
}

/* Slots: hasta MAX_SLOTS partidas en curso, una ranura por partida (G.saveId). El guardado automático solo pisa la ranura de su partida.
   Claves: doz3.slot.<id> (instantánea) y doz3.slots.idx (lista de ids, la más reciente primero). */
const MAX_SLOTS = 10, SLOT_PREFIX = 'doz3.slot.', SLOT_IDX = 'doz3.slots.idx';
function slotIds() { try { const l = JSON.parse(localStorage.getItem(SLOT_IDX) || '[]'); return Array.isArray(l) ? l : []; } catch (e) { return []; } }
function setSlotIds(l) { try { localStorage.setItem(SLOT_IDX, JSON.stringify(l)); } catch (e) { } }
function newSaveId() { return 's' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36); }
/* Migra la partida del sistema antiguo (una sola ranura) si existe. */
function migrateOldSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY); if (!raw) return;
    const s = JSON.parse(raw); localStorage.removeItem(SAVE_KEY);
    if (!s || s.v !== 1 || !s.G || !LEVELS[s.G.lv]) return;
    const id = newSaveId(); s.G.saveId = id; s.meta = slotMeta(s.G);
    localStorage.setItem(SLOT_PREFIX + id, JSON.stringify(s)); setSlotIds([id].concat(slotIds()));
  } catch (e) { }
}
function slotMeta(g) {
  const lv = LEVELS[g.lv];
  return { lv: lv.name, len: lv.lengths[g.len] ? lv.lengths[g.len].name : '', turn: g.turnNo, players: g.players ? g.players.length : 1, heroes: (g.heroKeys || []).map(k => HEROES[k] ? HEROES[k].name : k), date: Date.now() };
}
/* El registro de eventos (G.evlog, para depurar) va en su propia clave: doz3.log.<id>. Así un registro grande nunca impide guardar la partida:
   si no cabe, se recorta, y si ni así cabe, se guarda la partida sin él. */
const LOG_PREFIX = 'doz3.log.';
function trySet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
/* Sin sitio: se liberan los registros de las otras partidas guardadas (las partidas no se tocan). */
function freeOtherLogs(keep) { for (const id of slotIds()) if (id !== keep) try { localStorage.removeItem(LOG_PREFIX + id); } catch (e) { } }
let saveWarned = false;
/* at: 'actions' (a mitad de la fase de Acciones) o 'turn' (al empezar un turno). */
function saveGame(at) {
  /* Ventana de acciones gratis abierta (freeWindow): no se guarda, para que cargar la partida no salte la activación de los Zeds ni repita acciones gratis. Se retoma desde el último guardado de turno. */
  if (!G.lv || G.over || G.freeWin) return;
  if (!G.saveId) G.saveId = newSaveId();
  const snap = snapshotState(); delete snap.evlog;
  const data = JSON.stringify({ v: 1, at, uid: UID, rng: rngState(), dbg: !!DEBUG_DICE, G: snap, meta: slotMeta(snap) });
  let ok = trySet(SLOT_PREFIX + G.saveId, data);
  if (!ok) { try { localStorage.removeItem(LOG_PREFIX + G.saveId); } catch (e) { } freeOtherLogs(G.saveId); ok = trySet(SLOT_PREFIX + G.saveId, data); }
  if (!ok) {
    console.warn('No se pudo guardar la partida: el almacenamiento del navegador está lleno.');
    if (!saveWarned && typeof UI !== 'undefined' && UI) { saveWarned = true; UI.log('No se ha podido guardar la partida: el almacenamiento del navegador está lleno. Borra alguna partida guardada desde «Cargar partida».', 'bad'); }
    return;
  }
  saveWarned = false;
  const ids = slotIds(); if (ids[0] !== G.saveId) setSlotIds([G.saveId].concat(ids.filter(x => x !== G.saveId)));
  const log = G.evlog || [];
  if (!trySet(LOG_PREFIX + G.saveId, JSON.stringify(log)) && !trySet(LOG_PREFIX + G.saveId, JSON.stringify(log.slice(-1000)))) { try { localStorage.removeItem(LOG_PREFIX + G.saveId); } catch (e) { } }
}
/* Lista de partidas guardadas (la más reciente primero). */
function listSaves() {
  migrateOldSave();
  const out = [], ids = slotIds();
  for (const id of ids) {
    try { const s = JSON.parse(localStorage.getItem(SLOT_PREFIX + id) || 'null'); if (s && s.v === 1 && s.G && LEVELS[s.G.lv]) { s.id = id; out.push(s); } } catch (e) { }
  }
  if (out.length !== ids.length) setSlotIds(out.map(s => s.id));
  return out;
}
function loadSave(id) {
  const s = listSaves().find(x => x.id === id) || null;
  /* Las partidas antiguas llevan el registro dentro; las nuevas, en su clave aparte. */
  if (s && !s.G.evlog) { try { const l = JSON.parse(localStorage.getItem(LOG_PREFIX + id) || '[]'); s.G.evlog = Array.isArray(l) ? l : []; } catch (e) { s.G.evlog = []; } }
  return s;
}
function deleteSave(id) { if (!id) return; try { localStorage.removeItem(SLOT_PREFIX + id); localStorage.removeItem(LOG_PREFIX + id); } catch (e) { } setSlotIds(slotIds().filter(x => x !== id)); }
function applySave(s) { restoreState(s.G); G.saveId = s.id || G.saveId; UID = s.uid; rngRestore(s.rng); DEBUG_DICE = !!s.dbg || !!ui.dbgDice; /* el modo debug se guarda con la partida */ }

/* Ranking local de partidas terminadas (victorias primero, luego por puntos). */
const TOP_KEY = 'doz3.top.v1';
function loadTop() { try { const l = JSON.parse(localStorage.getItem(TOP_KEY) || '[]'); return Array.isArray(l) ? l : []; } catch (e) { return []; } }
function saveTop(r) {
  try {
    const l = loadTop(); l.push(r);
    l.sort((a, b) => (b.win - a.win) || (b.score - a.score) || (a.turns - b.turns));
    localStorage.setItem(TOP_KEY, JSON.stringify(l.slice(0, 10)));
  } catch (e) { console.warn('No se pudo guardar el ranking', e); }
}
function clearTop() { try { localStorage.removeItem(TOP_KEY); } catch (e) { } }
