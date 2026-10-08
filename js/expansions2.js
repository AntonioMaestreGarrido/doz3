/* Expansiones (parte 2): reglas de turno de las nuevas cartas, Rumores guardados y Base aérea. */
'use strict';

const _reachable = reachable;
reachable = function (u, extra) {
  if (G.turn.cLock && u.space === 'C') return {};
  if (G.turn.negation && (zedsAt(u.space).length || adjacentIds(u.space).some(i => zedsAt(i).length))) return {};
  const r = _reachable(u, extra);
  if (G.turn.noFight) for (const k in r) if (controlled(k) || zedsAt(k).length) delete r[k];
  return r;
};
const _fireTargets = fireTargets;
fireTargets = function (u) {
  if (G.turn.noFight) return {};
  if (G.turn.negation && (zedsAt(u.space).length || adjacentIds(u.space).some(i => zedsAt(i).length))) return {};
  return _fireTargets(u);
};
function moveIsFree(u, dest) {
  if (G.turn.freeFromC && u.space === 'C') return true;
  if (G.turn.panic && (adjacentIds(u.space).some(i => zedsAt(i).length) || zedsAt(u.space).length)) { const cur = sp(u.space), d = sp(dest); if (dest === 'C' || (cur.route && d.route === cur.route && d.i > cur.i)) return true; }
  return false;
}

function canMoveFree(u) { return !!(u.space && (G.turn.freeFromC && u.space === 'C' || G.turn.panic && (zedsAt(u.space).length || adjacentIds(u.space).some(i => zedsAt(i).length)))); }

const _DEST_FX = DEST_FX;
DEST_FX = async function (id, route) {
  if (id === 'hija') { G.turn.cLock = true; LOG('Las unidades del Centro no pueden mover este turno.', 'bad'); return; }
  if (id === 'discutiendo') {
    const spaces = Object.values(G.spaces).filter(s => unitsAt(s.id).filter(isFighter).length >= 2).map(s => s.id);
    if (!spaces.length) { LOG('No hay dos unidades juntas.'); return; }
    const t = await UI.pickSpace(spaces, 'Discusión: elige el espacio con dos unidades.');
    unitsAt(t).filter(isFighter).slice(0, 2).forEach(u => u.locked = true); LOG('Dos unidades discuten y no pueden actuar este turno.', 'bad'); return;
  }
  return _DEST_FX(id, route);
};
const _resolveTwist = resolveTwist;
resolveTwist = async function (dr) {
  if (dr && !DEST[dr.id].keep && G.hand.includes('pensar')) {
    const v = await UI.choose({ title: 'Pensar fríamente', text: 'Acaba de salir «' + DEST[dr.id].name + '». ¿Cancelas este evento?', options: [{ label: 'Cancelarlo', value: 'y' }, { label: 'No', value: 'n' }] });
    if (v === 'y') { G.hand.splice(G.hand.indexOf('pensar'), 1); G.destDiscard.push('pensar', dr.id); zenPlayed(); UI.updateHand(); return; }
  }
  return _resolveTwist(dr);
};
const _maint2 = maintenance;
maintenance = async function () { for (const u of Object.values(G.units)) u.locked = false; await _maint2(); };

const _eventEnd = eventEnd;
eventEnd = async function () {
  await _eventEnd();
};
/* Base aérea secreta: al final de la fase de Acciones (antes de cerrarla). Devuelve true si se elige la Acción de Evento extra. */
async function baseAereaEnd() {
  if (G.turn.baseDone) return false;
  for (const s of Object.values(G.spaces)) if (s.base && unitsAt(s.id).some(isFighter)) {
    G.turn.baseDone = true;
    const opts = [{ label: '1 Curación gratis', value: 'h' }, { label: '1 Acción de Evento extra (para usar ya)', value: 'e' }]; if (G.res && !G.turn.researched) opts.splice(1, 0, { label: '1 Investigación gratis', value: 'i' });
    const v = await UI.choose({ title: 'Base aérea secreta', text: 'Elige tu beneficio:', options: opts });
    if (v === 'h') { const c = allUnits(x => isFighter(x) && x.space && curable(x)); if (c.length) { const w = await UI.pickUnit(c, '¿A quién curas?'); healUnit(G.units[w]); G.units[w].curedTurn = G.turnNo; cureInf(); } }
    else if (v === 'i') { const c = G.res.cur, d = await UI.rollSimple('Investigar gratis (hace falta ' + c.th + '+)', 1); if (d[0] >= c.th) { G.turn.researched = true; await revealResearch(); } }
    else { G.pool.event++; return true; }
    return false;
  }
  return false;
}
/* Inicio de la fase de Acciones: Cristal, Jaque Mates, Sirena */
async function startOfActions() {
  /* ¡No hay tiempo para eso!: al inicio de la fase de Acciones, la ficha de Acción de Jugador pasa a Usada. */
  if (G.event && G.event.noPlayerAction) { G.pool.player = 0; LOG('¡No hay tiempo para eso!: la Acción de Jugador no está disponible este turno.', 'bad'); }
  for (const u of Object.values(G.units)) if (u.side === 'pl' && (u.chips || []).includes('cristal') && u.space) { u.free++; }
  const j = alive('jaque'); if (j) { const r = await rollShown('Jaque Mates: Acción de Evento extra', v => v > G.pool.event ? '<b>' + v + '</b> &gt; tus ' + G.pool.event + ' Acciones de Evento: <b>+1 Acción de Evento</b>' : '<b>' + v + '</b> ≤ tus ' + G.pool.event + ' Acciones de Evento: sin Acción extra'); if (r > G.pool.event) { G.pool.event++; LOG('Jaque Mates: ' + r + ' > ' + (G.pool.event - 1) + ' → +1 Acción de Evento.', 'good'); } else LOG('Jaque Mates: ' + r + ' (sin Acción extra).'); }
  for (const u of Object.values(G.units)) if (u.space && sp(u.space) && sp(u.space).rumor === undefined) {}
  // Rumores revelables gratis al inicio por héroes que ya están encima
  for (const s of Object.values(G.spaces)) if (s.rumor && !s.chaos) { const who = unitsAt(s.id).find(u => ['hero', 'civh', 'marine', 'petra'].includes(u.type)); if (who) { const v = await UI.choose({ title: 'Rumor', text: who.name + ' está sobre un Rumor boca abajo. ¿Lo revelas gratis ahora?', options: [{ label: 'Revelar', value: 'y' }, { label: 'Después', value: 'n' }] }); if (v === 'y') await revealRumor(who, true); } }
}

/* «Pensar fríamente supuso el triunfo» (2.ª opción): repite un resultado de 1 dado o de 2 dados en el que haya un 1; con doble 1 se repiten los dos.
   `h` es el manejador de la ventana de combate/disparo (si lo hay); si no, se pregunta con un diálogo. */
async function zenReroll(vals, label, h) {
  if (!G.hand || !G.hand.includes('pensar') || !vals.includes(1)) return vals;
  const idx = vals.length === 2 && vals[0] === 1 && vals[1] === 1 ? [0, 1] : [vals.indexOf(1)];
  const q = 'Pensar fríamente: ' + (label ? label + ' — ' : '') + 'sale ' + vals.join(' y ') + '. ¿Juegas la carta para repetir ' + (idx.length > 1 ? 'los dos dados' : vals.length > 1 ? 'el dado con 1' : 'el dado') + '?';
  const opts = [{ label: 'Repetir', value: 'y' }, { label: 'No', value: 'n' }];
  const v = h && h.ask ? await h.ask(q, opts) : await UI.choose({ title: 'Pensar fríamente', text: q, options: opts });
  if (v !== 'y') return vals;
  G.hand.splice(G.hand.indexOf('pensar'), 1); G.destDiscard.push('pensar'); zenPlayed(); UI.updateHand();
  const out = h && h.reroll ? await h.reroll(vals, idx) : vals.map((x, i) => idx.includes(i) ? d6() : x);
  LOG('Pensar fríamente: se repite ' + (idx.length > 1 ? 'la tirada' : 'el 1') + ' → ' + out.join(' y ') + '.', 'good');
  return out;
}
async function zen1(r, label) { return (await zenReroll([r], label))[0]; }
