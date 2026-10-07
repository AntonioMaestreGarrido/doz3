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
        const lab = G.res && !G.turn.researched ? unitsAt('LAB').filter(x => x.sci && canAct(x)) : [];
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
      s.fn = async () => { const h = unitsAt('LAB').filter(isFighter)[0]; if (!h) { LOG('No hay nadie en el Laboratorio.'); return; } await hitPlayer(h, 1); if (d6() >= 2) await revealResearch(); };
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
  G.turn.specials = g.turn.specials.map(s => mkSpecial(s.kind, s.n));
}

/* at: 'actions' (a mitad de la fase de Acciones) o 'turn' (al empezar un turno). */
function saveGame(at) {
  try {
    if (!G.lv || G.over) return;
    localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, at, uid: UID, rng: rngState(), G: snapshotState() }));
  } catch (e) { console.warn('No se pudo guardar la partida', e); }
}
function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    return s && s.v === 1 && s.G && LEVELS[s.G.lv] ? s : null;
  } catch (e) { return null; }
}
function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } }
function applySave(s) { restoreState(s.G); UID = s.uid; rngRestore(s.rng); }

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
