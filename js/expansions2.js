/* Expansiones (parte 2): reglas de turno de las nuevas cartas, Rumores guardados y Base aérea. */
'use strict';

const _reachable = reachable;
reachable = function (u, extra) {
  if (G.turn.cLock && u.space === 'C') return {};
  if (G.turn.negation && (zedsAt(u.space).length || adjacentIds(u.space).some(i => zedsAt(i).length))) return {};
  const r = _reachable(u, extra);
  /* Instinto equino: sin jinete, el General Lee no entra voluntariamente en espacios con Caos ni en el Túnel. */
  if (u.key === 'lee' && !u.rider) for (const k in r) if (sp(k).chaos || sp(k).route === 'T') delete r[k];
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

/* Solo si existe algún destino gratis de verdad: con «El pánico…», una unidad del Centro está junto a Zeds pero no puede moverse «hacia el Centro». */
function canMoveFree(u) {
  if (!u.space || !(G.turn.freeFromC && u.space === 'C' || G.turn.panic && (zedsAt(u.space).length || adjacentIds(u.space).some(i => zedsAt(i).length)))) return false;
  return Object.keys(reachable(u)).some(k => moveIsFree(u, k));
}

const _DEST_FX = DEST_FX;
DEST_FX = async function (id, route) {
  if (id === 'hija') { G.turn.cLock = true; LOG('Las unidades del Centro no pueden mover este turno.', 'bad'); return; }
  if (id === 'discutiendo') {
    const spaces = Object.values(G.spaces).filter(s => s.id !== 'AIR' && unitsAt(s.id).filter(isFighter).length >= 2).map(s => s.id);
    if (!spaces.length) { LOG('No hay dos unidades juntas.'); return; }
    const t = await UI.pickSpace(spaces, 'Discusión: elige el espacio con dos unidades.');
    let us = unitsAt(t).filter(isFighter);
    if (us.length > 2) { const a = await UI.pickUnit(us, 'Discusión: elige la primera unidad que discute.'); const b = await UI.pickUnit(us.filter(x => x.id !== a), 'Discusión: elige la segunda unidad.'); us = [G.units[a], G.units[b]]; }
    us.forEach(u => u.locked = true); LOG('Dos unidades discuten y no pueden actuar este turno.', 'bad'); return;
  }
  return _DEST_FX(id, route);
};
const _resolveTwist = resolveTwist;
resolveTwist = async function (dr) {
  if (dr && !DEST[dr.id].keep && G.hand.includes('pensar')) {
    const v = await UI.choose({ title: 'Pensar fríamente', text: 'Acaba de salir «' + DEST[dr.id].name + '». ¿Cancelas este evento?', img: destImg(dr.id), options: [{ label: 'Cancelarlo', value: 'y' }, { label: 'No', value: 'n' }] });
    if (v === 'y') { G.hand.splice(G.hand.indexOf('pensar'), 1); G.destDiscard.push('pensar', dr.id); zenPlayed(); UI.updateHand(); return; }
  }
  return _resolveTwist(dr);
};
const _maint2 = maintenance;
maintenance = async function () { for (const u of Object.values(G.units)) u.locked = false; await _maint2(); };

/* Base aérea secreta: al final de la fase de Acciones (antes de cerrarla). Devuelve true si se elige la Acción de Evento extra. */
async function baseAereaEnd() {
  if (G.turn.baseDone) return false;
  for (const s of Object.values(G.spaces)) if (s.base && unitsAt(s.id).some(isFighter)) {
    G.turn.baseDone = true;
    const opts = [{ label: '1 Curación gratis', value: 'h' }, { label: '1 Acción de Evento extra (para usar ya)', value: 'e' }]; if (G.res && !G.turn.researched) opts.splice(1, 0, { label: '1 Investigación gratis', value: 'i' });
    const v = await UI.choose({ title: 'Base aérea secreta', text: 'Elige tu beneficio:', options: opts });
    if (v === 'h') { const c = allUnits(x => isFighter(x) && x.space && curable(x)); if (c.length) { const w = await UI.pickUnit(c, '¿A quién curas?'); healUnit(G.units[w]); G.units[w].curedTurn = G.turnNo; cureInf(); } }
    else if (v === 'i') { const c = G.res.cur, d = await UI.rollSimple('Investigar gratis (hace falta ' + c.th + '+)', 1); if (d[0] >= c.th) { G.turn.researched = true; await revealResearch(); } }
    else { addEventActions(1); return true; }
    return false;
  }
  return false;
}
/* Inicio de la fase de Acciones: Cristal, Jaque Mates, Sirena */
async function startOfActions() {
  /* ¡No hay tiempo para eso!: al inicio de la fase de Acciones, la ficha de Acción de Jugador pasa a Usada. */
  if (G.event && G.event.noPlayerAction) { G.pool.pl = G.pool.pl.map(() => 0); LOG('¡No hay tiempo para eso!: la Acción de Jugador no está disponible este turno.', 'bad'); }
  for (const u of Object.values(G.units)) if (u.side === 'pl' && (u.chips || []).includes('cristal') && u.space) { u.free++; }
  const j = alive('jaque'); if (j) { const r = await rollShown('Jaque Mates: Acción de Evento extra', v => v > G.pool.event ? '<b>' + v + '</b> &gt; tus ' + G.pool.event + ' Acciones de Evento: <b>+1 Acción de Evento</b>' : '<b>' + v + '</b> ≤ tus ' + G.pool.event + ' Acciones de Evento: sin Acción extra'); if (r > G.pool.event) { G.pool.event++; LOG('Jaque Mates: ' + r + ' > ' + (G.pool.event - 1) + ' → +1 Acción de Evento.', 'good'); } else LOG('Jaque Mates: ' + r + ' (sin Acción extra).'); }
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
  if (h && h.mark) h.mark(vals); /* antes de decidir: se marca la casilla del resultado actual */
  const v = h && h.ask ? await h.ask(q, opts) : await UI.choose({ title: 'Pensar fríamente', text: q, options: opts });
  if (v !== 'y') return vals;
  G.hand.splice(G.hand.indexOf('pensar'), 1); G.destDiscard.push('pensar'); zenPlayed(); UI.updateHand();
  const out = h && h.reroll ? await h.reroll(vals, idx) : vals.map((x, i) => idx.includes(i) ? d6() : x);
  LOG('Pensar fríamente: se repite ' + (idx.length > 1 ? 'la tirada' : 'el 1') + ' → ' + out.join(' y ') + '.', 'good');
  return out;
}
async function zen1(r, label) { return (await zenReroll([r], label))[0]; }

/* ---------- Helicóptero Medevac (exp. 4) ---------- */
/* Pasajeros posibles: Héroes de su espacio, salvo los que tampoco puede llevar Doc. */
const heliCands = u => unitsAt(u.space).filter(x => x !== u && x.type === 'hero' && !DOC_NO_RIDE.includes(x.key) && !x.ecg && !x.mount && !x.rider && !x.resist && !isPetra(x));
/* Espacios donde puede aterrizar: superficie sin Zeds que no sea Inicial, o el Centro. */
function heliLandSpaces(u, comp) {
  const ids = docJumpSpaces(u, comp);
  if (G.spaces.C && !blocked('C') && !zedsAt('C').length && !ids.includes('C')) ids.push('C');
  return ids;
}
/* Vuelo: despega con un Héroe de su espacio (opcional) y queda en el aire. Aterriza gratis más tarde (Aterrizar) o sigue arriba y patrulla al inicio del siguiente turno. */
async function heliVuelo(u) {
  await heliTakeoff(u, null, 'Vuelo');
}
/* Al despegar se elige qué ruta patrulla lo que queda de turno (la ruta del despegue sale la primera). */
async function heliElegirRuta(why, hint) {
  const rs = G.routes.slice().sort((a, b) => (b === hint) - (a === hint));
  const opts = rs.map(r => ({ label: 'Patrullar: ' + ROUTES[r].name + (r === hint ? ' (donde estaba)' : ''), value: r, color: ROUTES[r].color, focus: routeSpaces(r) }));
  return await UI.choose({ title: 'Helicóptero Medevac', text: why + ': ¿qué ruta patrulla el resto del turno? Al inicio del siguiente turno, si sigue en el aire, pagará 1 Suministro y volverá a elegir (o aterrizará gratis).', options: opts });
}
/* Despega (de emergencia o no): queda en el aire con su Héroe y patrulla la ruta elegida lo que queda de turno. */
async function heliTakeoff(h, hint, why) {
  let pas = null; const cands = heliCands(h);
  if (cands.length) { const v = await UI.pickUnit(cands, why + ': ¿qué Héroe se lleva el helicóptero? (cancelar = ninguno)', true); if (v != null) pas = G.units[v]; }
  G.supplies = Math.max(0, G.supplies - 1); G.charUsed.vuelo = true;
  putUnit(h, 'AIR'); h.pasajero = pas ? pas.id : null; if (pas) putUnit(pas, 'AIR');
  UI.updateStats(); UI.redraw();
  const ruta = await heliElegirRuta(why, hint); if (ruta) G.turn.patrol = ruta;
  LOG(why + ': ' + h.name + (pas ? ' y ' + pas.name : '') + ' despegan y quedan en el aire' + (ruta ? ' patrullando ' + ROUTES[ruta].name : '') + ' (−1 Suministro).', 'good');
  UI.updateStats(); UI.redraw();
}
/* Tirada de Despegue de emergencia: 'now' (despega sin combate), 'after' (combate y luego despega si sobrevive) o null. */
async function heliEmergency(h, space) {
  if (!h || h.ecg || h.resist || G.supplies < 1 || !sp(space).route || G.turn.vueloEmerg === G.turnNo + ':' + space) return null;
  const r = await rollShown('Despegue de emergencia: ' + h.name, v => v === 1 ? '<b>1</b>: combate normal y no despega' : v === 2 ? '<b>2</b>: combate normal y, si sigue vivo, despega' : '<b>' + v + '</b>: despega sin combate');
  if (r === 1) return null; if (r === 2) return 'after';
  await heliTakeoff(h, sp(space).route, 'Despegue de emergencia'); return 'now';
}
/* Aterrizaje (gratis): elige el espacio, puede dejar al Héroe en el Hospital; si no, el Héroe recibe 1 Acción gratis. */
async function heliAterrizar(u, forced) {
  const pas = u.pasajero && G.units[u.pasajero] && G.units[u.pasajero].space === 'AIR' ? G.units[u.pasajero] : null;
  let hospital = false;
  if (pas && freeBed()) {
    const w = await UI.choose({ title: 'Aterrizaje', text: '¿Qué haces con ' + pas.name + '?', options: [{ label: 'Aterriza con el helicóptero', value: 'n' }, { label: 'Dejarlo en el Hospital (Cama libre, sin ECG ni Infección)', value: 'h' }] });
    hospital = w === 'h';
  }
  const comp = hospital ? null : pas;
  const ds = heliLandSpaces(u, comp); if (!ds.length) { LOG('No hay espacio libre para aterrizar: sigue en el aire.'); return false; }
  const t = ds.length === 1 ? ds[0] : await UI.pickSpace(ds, 'Aterrizaje: elige el espacio.', !forced); if (t == null) return false;
  putUnit(u, t); u.pasajero = null;
  if (pas) {
    if (hospital) { const bed = freeBed(); if (bed) { putUnit(pas, bed); pas.ecg = false; LOG(pas.name + ' queda ingresado en el Hospital (' + spaceLabel(bed) + ').', 'good'); } else putUnit(pas, t); }
    else { putUnit(pas, t); pas.free = (pas.free || 0) + 1; LOG('Aterrizaje de combate: ' + pas.name + ' recibe 1 Acción gratis.', 'good'); }
  }
  LOG(u.name + ' aterriza en ' + spaceLabel(t) + '.', 'good'); UI.updateStats(); UI.redraw(); UI.focus(t); return true;
}
/* Inicio de turno, tras revelar el Evento: si sigue en el aire, paga 1 Suministro para patrullar una ruta o aterriza gratis. */
async function heliTurnStart() {
  const h = hero('heli'); if (!h || h.space !== 'AIR') return;
  if (G.supplies < 1) { LOG('Sin Suministros: el helicóptero tiene que aterrizar.', 'bad'); await heliAterrizar(h, true); return; }
  const opts = G.routes.map(r => ({ label: 'Patrullar: ' + ROUTES[r].name + ' (1 Suministro)', value: r, color: ROUTES[r].color, focus: routeSpaces(r) })).concat([{ label: 'Aterrizar gratis', value: 'land' }]);
  const v = await UI.choose({ title: 'Helicóptero Medevac', text: 'Sigue en el aire. Paga 1 Suministro y elige la ruta que patrulla este turno, o aterriza gratis.', options: opts });
  if (v === 'land') { await heliAterrizar(h, true); return; }
  G.supplies -= 1; G.turn.patrol = v; UI.updateStats();
  LOG('Patrulla: el helicóptero sobrevuela ' + ROUTES[v].name + ' (−1 Suministro).', 'good'); UI.toast('Patrulla: ' + ROUTES[v].name, '#7fb6ff', 1800);
  const id2 = G.eventDeck[0]; if (id2) await UI.waitAck('Helicóptero: siguiente carta de Evento', 'Desde el aire ves la próxima carta: «' + EV[id2].name + '».', evImg(id2), 'e:' + id2);
}
