/* Fases del turno, Zeds, Brotes y efectos de las cartas de Evento. */
'use strict';

/* ---------- Brotes ---------- */
async function outbreak(wild, noReduce) {
  if (!G.lv.infection) return;
  if (alreadyHas('medio')) { G.inf = 2; LOG('A medio convertir: la Infección baja a 2.'); }
  else if (!noReduce) { const [a, b] = await UI.rollSimple('Tirada de Brote: la Infección baja', 2, d => 'Total <b>' + (d[0] + d[1]) + '</b>: la Infección baja ' + (d[0] + d[1]) + '.'); LOG('Tirada de Brote: ' + (a + b) + '. La Infección baja.', 'good'); infDown(a + b); }
  const dr = await drawDestiny(); if (!dr) return;
  const r = dr.route; let target;
  if (r === 'T' || alreadyHas('vacunas')) target = r + '0';
  else {
    target = null;
    for (let i = lastOf(r) - 1; i >= 1; i--) if (sp(r + i).chaos && G.lv.fourR) { target = r + i; break; }
    if (!target) for (let i = lastOf(r) - 1; i >= 1; i--) if (sp(r + i).kind === 'pueblo') { target = r + i; break; }
    if (!target) target = r + '0';
  }
  const z = wild ? makeSuper() : makeZed();
  const que = z ? ' Aparece ' + (z.type === 'super' ? z.name : 'un Zed de Fuerza ' + z.full) + ' en ' + spaceLabel(target) + '.' : '';
  LOG('¡Brote' + (wild ? ' Descontrolado' : '') + ' en ' + ROUTES[r].name + '!' + que, 'bad'); UI.toast('¡Brote' + (wild ? ' Descontrolado' : '') + ' en ' + ROUTES[r].short + '!' + que, '#ff3b2a', 2600, true);
  if (z) await placeZedAt(target, 'Brote', z);
  await resolveTwist(dr);
}

/* ---------- Caos ---------- */
async function placeChaos(id, n) {
  if (!G.lv.fourR) return; const s = sp(id); n = n || (G.turn.chaos2 ? 2 : 1);
  for (let k = 0; k < n; k++) { if (G.chaosLeft <= 0) { G.over = 'lose'; G.loseWhy = 'caos'; LOG('¡No quedan fichas de Caos! Has perdido.', 'bad'); return; } G.chaosLeft--; s.chaos++; }
  LOG('Caos en ' + spaceLabel(id) + '.', 'bad'); UI.pulseSpace(id, '#ff7a2a'); UI.toast('Caos en ' + spaceLabel(id), '#ff7a2a', 1200); UI.redraw();
}
const chaosOnMap = () => Object.values(G.spaces).reduce((a, s) => a + s.chaos, 0);

/* ---------- movimiento Zed ---------- */
function perimeterBlocks(from, dest) {
  const k = alive('kingman'); if (!k || !k.space) return false;
  const near = [k.space].concat(adjacentIds(k.space));
  return near.includes(dest) || near.includes(from) && false;
}
async function zedsOccupy(zs, id) {
  const here = zs.filter(z => z.space === id); if (!here.length) return;
  if (G.lv.fourR && !isInit(id) && isNamed(id) && id !== 'C' && !sp(id).chaos && sp(id).kind !== 'crypt') await placeChaos(id);
  else if (G.turn.chaos2 && sp(id).chaos && false) { }
  if (G.over) return;
  if (!plAt(id).length && !raidAt(id).length) { await convertAldeanos(id); if (softAt(id).length) await devourSoft(here, id); }
  if (G.turn.flamed && sp(id).chaos) for (const z of here) if (z.space === id) await hitZed(z);
}
async function handleArrival(zs, dest, from) {
  const here = zs.filter(z => z.space === dest);
  if (plAt(dest).length || raidAt(dest).length) return zedAttack(here, dest, from);
  return {};
}
async function mineAttack(dest, movers) {
  const s = sp(dest); if (!s.mine) return; const str = s.mine === 1 ? 7 : 4;
  const col = clamp(str - 1, 0, 6);
  const [a, b] = await UI.rollSimple('¡Campo de Minas! Ataque de Fuerza ' + str, 2, d => { const h = FIRE[sumRow(d[0] + d[1])][col]; return 'Total <b>' + (d[0] + d[1]) + '</b>: <b>' + h + '</b> Impacto(s) contra los Zeds que entran.'; });
  const hits = FIRE[sumRow(a + b)][col];
  LOG('¡Campo de Minas! Ataque de Fuerza ' + str + ' (' + (a + b) + '): ' + hits + ' Impacto(s).', 'good');
  s.mine = s.mine === 1 ? 2 : 0; await applyZedHits(movers.filter(z => z.space === dest), hits);
}
async function moveGroup(movers, from, opts) {
  opts = opts || {};
  movers = movers.filter(z => z.space === from && G.units[z.id]); if (!movers.length) return { moved: false };
  const dest = nextToward(from);
  if (dest === 'C') {
    const cl = alive('clarin');
    if (cl && plAt('C').length) {
      LOG('¡Los Zeds llegan al Centro! El Mensajero del Clarín los obliga a luchar.', 'bad');
      putUnit(movers[0], 'C'); movers.slice(1).forEach(z => putUnit(z, 'C'));
      const r = await melee({ zeds: movers, hum: plAt('C'), space: 'C', attacker: 'z', from });
      if (r.zedWon || !movers.some(z => z.space)) { G.over = 'lose'; G.loseWhy = 'zeds'; }
      return { moved: true, won: r.zedWon };
    }
    movers.forEach(z => putUnit(z, 'C')); LOG('¡Un Zed entra en el Centro de la Ciudad!', 'bad'); UI.focus('C', 1.5); UI.redraw(); await UI.announce('¡UN ZED HA ENTRADO EN EL CENTRO!', '#ff3b2a', 1200, true); G.over = 'lose'; G.loseWhy = 'zeds'; return { moved: true };
  }
  if (blocked(dest)) { LOG('Los Zeds no pueden entrar en ' + spaceLabel(dest) + ' (No Pasar).'); return { moved: false }; }
  /* En zapatillas no se puede pasar (Porter): si un Zed intenta entrar en su espacio o en uno adyacente, con 4-6 se cancela su movimiento. Máximo 1 por fase de los Zeds; los fallos no cuentan. */
  const porter = alive('porter');
  if (porter && porter.space && !G.turn.zapStop && (dest === porter.space || adjacentIds(porter.space).includes(dest))) {
    const r = await rollShown('En zapatillas no se puede pasar: ' + porter.name, v => v >= 4 ? '<b>' + v + '</b>: se cancela el movimiento' : '<b>' + v + '</b>: no cuenta (necesita 4-6)');
    if (r >= 4) { G.turn.zapStop = true; LOG('En zapatillas no se puede pasar: ' + porter.name + ' cancela el movimiento hacia ' + spaceLabel(dest) + '.', 'good'); return { moved: false }; }
  }
  if (sp(dest).bridge === 'down' && false) return { moved: false };
  // capacidad
  const spreaders = movers.filter(z => z.type === 'spreader'), norm = movers.filter(z => z.type !== 'spreader').sort((a, b) => strength(b) - strength(a));
  const room = zedCap(dest) - normalZedsAt(dest).length;
  let go = norm.slice(0, Math.max(0, room)).concat(spreaders);
  if (sp(from).kind === 'crypt') go = norm.slice(0, 1).concat([]);
  if (isRouteSp(dest) && sp(dest).route === 'T' && sp(dest).kind !== 'crypt' && plAt(dest).length && false) go = [];
  if (!go.length) { LOG('Los Zeds en ' + spaceLabel(from) + ' no pueden avanzar (límite de agrupamiento).'); return { moved: false }; }
  // Perímetro de Kingman
  if (perimeterBlocks(from, dest)) { const r = await rollShown('Perímetro Defensivo de Kingman', r => r >= 5 ? '<b>' + r + '</b>: los Zeds se detienen' : '<b>' + r + '</b>: los Zeds avanzan (necesita 5-6)'); if (r >= 5) { LOG('El Perímetro Defensivo de Kingman detiene a los Zeds (' + r + ').', 'good'); return { moved: false }; } }
  // Ladrido de Pepinillos
  const pep = unitsAt(from).find(u => u.key === 'pepinillos'); if (pep && !isInit(from)) { const r = await rollShown('Ladrido de Pepinillos', r => r >= 4 ? '<b>' + r + '</b>: los Zeds se detienen' : '<b>' + r + '</b>: los Zeds avanzan (necesita 4-6)'); if (r >= 4) { LOG('El ladrido de Pepinillos detiene a los Zeds (' + r + ').', 'good'); return { moved: false }; } }
  // Evento de Adiós: Barricada
  if (sp(from).bar === 1) { sp(from).bar = 0; LOG('¡Los Zeds destruyen la Barricada de ' + spaceLabel(from) + '!', 'bad'); }
  const leavingChaos = sp(from).chaos > 0;
  if (sp(dest).bar === 1 && G.turn.smash) { sp(dest).bar = 0; LOG('Los Zeds destruyen la Barricada de ' + spaceLabel(dest) + '.', 'bad'); }
  /* ¡Los urbanistas contraatacan!: se puede jugar al avanzar un Zed hacia un espacio de Ciudad, antes del combate. */
  if (isCity(dest) && G.hand.includes('urbanistas') && go.length) {
    const r = await UI.choose({ title: DEST.urbanistas.name, text: (go.length > 1 ? 'Una Horda Zed' : go[0].name + ' (Fuerza ' + strength(go[0]) + ')') + ' en ' + spaceLabel(from) + ' intenta entrar en ' + spaceLabel(dest) + '. ¿Juegas la carta para eliminar una unidad Zed?', options: [{ label: 'Jugarla', value: 'y' }, { label: 'No', value: 'n' }] });
    if (r === 'y') {
      const t = go.length === 1 ? go[0] : G.units[await UI.pickUnit(go, 'Urbanistas: elige la unidad Zed que se elimina.')];
      G.hand.splice(G.hand.indexOf('urbanistas'), 1); G.destDiscard.push('urbanistas'); zenPlayed(); UI.updateHand();
      LOG('¡Los urbanistas contraatacan! Se elimina ' + t.name + ' (Fuerza ' + strength(t) + ').', 'good'); await zedDies(t);
      go = go.filter(z => z.space && G.units[z.id]); if (!go.length) { UI.redraw(); return { moved: true }; }
    }
  }
  UI.focus(dest); for (const z of go) { putUnit(z, dest); z.moved = true; }
  LOG((go.length > 1 ? 'Horda Zed (' + go.map(strength).join('+') + ')' : go[0].name + ' (' + strength(go[0]) + ')') + ' avanza a ' + spaceLabel(dest) + '.', 'zed');
  UI.redraw(); await UI.settle();
  if (G.turn.flamed) G.turn.flamedUnits = (G.turn.flamedUnits || []).concat(go.filter(z => leavingChaos || sp(dest).chaos).map(z => z.id));
  await mineAttack(dest, go);
  const alive2 = go.filter(z => z.space === dest); if (!alive2.length) return { moved: true };
  // Pestilentes
  const hasFight = plAt(dest).length || raidAt(dest).length;
  let res = {};
  if (hasFight) res = await zedAttack(alive2.filter(z => z.space === dest), dest, from);
  else {
    for (const z of alive2) if (z.pest) { const front = nextToward(dest); const tg = plAt(front).concat(raidAt(front)); if (tg.length && front !== 'C') { const col = clamp(strength(z) - 1, 0, 6), a = d6(), b = d6(), hits = FIRE[sumRow(a + b)][col]; LOG('Ataque pestilente: ' + hits + ' Impacto(s).', 'bad'); if (hits) await hitPlayer(tg[0], hits); } }
  }
  if (G.over) return { moved: true };
  if (G.turn.flamed) for (const z of go) if (z.space && (leavingChaos || sp(z.space).chaos) && !z.flamedHit) { z.flamedHit = true; await hitZed(z); }
  await zedsOccupy(go, dest);
  return { moved: true, won: !!res.zedWon, from, dest, go };
}
async function stepSpace(id, cer, second) {
  if (G.over) return;
  const s = sp(id);
  let group = zedsAt(id).filter(z => !z.moved);
  if (!group.length) return;
  if (s.kind === 'crypt') {
    const sorted = group.slice().sort((a, b) => strength(b) - strength(a));
    for (const z of sorted) { if (G.over) return; if (!z.space || z.moved) continue; await cryptExit(z, cer); }
    return;
  }
  let guard = 0, cur = group;
  while (cur.length && !G.over && guard++ < 8) {
    const from = cur[0].space; const r = await moveGroup(cur, from);
    if (!r.moved) break;
    cur = [];
    const supersWon = (r.go || []).filter(z => z.key === 'berserker' && z.space === r.dest && r.won);
    if (cer && r.won) { cur = (r.go || []).filter(z => z.space === r.dest); cur.forEach(z => z.moved = false); if (cur.length) LOG('¡CEREBROS! Los Zeds ganaron: avanzan otra vez.', 'bad'); }
    else if (supersWon.length) { cur = supersWon; cur.forEach(z => z.moved = false); }
  }
}
async function cryptExit(z, cer) {
  const from = z.space;
  if (!z.dr && !(SUPER_ZEDS[z.key] && false)) {
    const r = await rollShown('Tirada de Cripta', v => v >= 4 && v <= 5 ? '<b>' + v + '</b>: el Zed se queda en la Cripta' : v === 6 ? '<b>6</b>: el Zed se pierde en el Túnel (nueva tirada)' : '<b>' + v + '</b>: el Zed sale de la Cripta'); LOG('Tirada de Cripta: ' + r);
    if (r >= 4 && r <= 5) { z.moved = true; return; }
    if (r === 6) {
      const r2 = await rollShown('Zed perdido: nueva tirada', v => '<b>' + v + '</b>: aparece en el Túnel, espacio n.º ' + v); const idx = lastOf('T') - r2; LOG('¡Perdido! Nueva tirada: ' + r2);
      if (idx === sp(from).i || idx < 1 || idx > lastOf('T')) { LOG('El Zed se pierde para siempre.', 'good'); if (z.type === 'super') { removeUnit(z); delete G.units[z.id]; } else discardZed(z); return; }
      const t = 'T' + idx;
      if (normalZedsAt(t).length >= zedCap(t) && sp(t).kind !== 'crypt') { z.moved = true; return; }
      putUnit(z, t); z.moved = true; if (plAt(t).length) await zedAttack([z], t, from); return;
    }
  }
  await moveGroup([z], from);
}
async function activateRoute(r, cer) {
  if (G.over) return;
  if (G.hand.includes('hipnotizados')) { const occ = []; for (let i = 0; i <= lastOf(r); i++) if (zedsAt(r + i).length) occ.push(r + i); const v = await UI.askZeds({ title: 'Zeds hipnotizados', text: '¿Cancelas la activación de la ' + ROUTES[r].name + '? Se activarían: ' + (occ.map(id => zedGroupName(zedsAt(id), id)).join(' · ') || 'ninguno (entra un Zed nuevo en el Inicial)') + '.', spaces: occ, options: [{ label: 'Cancelar la activación', value: 'y' }, { label: 'No', value: 'n' }] }); if (v === 'y') { G.hand.splice(G.hand.indexOf('hipnotizados'), 1); G.destDiscard.push('hipnotizados'); zenPlayed(); UI.updateHand(); return; } }
  LOG('Se activa la ' + ROUTES[r].name + '.', 'zed'); UI.flashRoute(r); if (!UI.fast) Sfx.ambience(); await UI.announce('Se activa la ' + ROUTES[r].name, ROUTES[r].color, 700);
  const zs = routeZeds(r);
  if (!zs.length) { await placeZedInitial(r); return; }
  zs.forEach(z => { z.moved = false; z.flamedHit = false; });
  for (const z of zs) if (z.key === 'reanimador') { if (z.hits > 0) z.hits--; else if (z.flipped) { z.flipped = false; z.hits = 2; } }
  const L = lastOf(r);
  for (let i = L; i >= 0 && !G.over; i--) {
    if (G.hand.includes('picado') && !cer) {
      const gr = zedsAt(r + i).filter(z => !z.moved);
      if (gr.length) { const v = await UI.askZeds({ title: '«¡Sí! Han picado…»', text: '¿Cancelas la activación de ' + zedGroupName(gr, r + i) + '?', spaces: [r + i], options: [{ label: 'Cancelar', value: 'y' }, { label: 'No', value: 'n' }] }); if (v === 'y') { G.hand.splice(G.hand.indexOf('picado'), 1); zenPlayed(); UI.updateHand(); if (d6() <= 3) G.destDiscard.push('picado'); else G.hand.push('picado'); UI.updateHand(); gr.forEach(z => z.moved = true); { const hz = gr.find(z => z.hits > 0) || gr.find(z => z.flipped); if (hz) { const bf = { flipped: hz.flipped, hits: hz.hits }; if (hz.hits > 0) hz.hits--; else { hz.flipped = false; hz.hits = Math.max(0, (hz.hf || 1) - 1); } LOG(hz.name + ' recupera 1 Impacto.', 'bad'); if (UI.fxHeal) UI.fxHeal(hz, bf); } } continue; } }
    }
    if (alreadyHas('distraccion')) {
      const gr = zedsAt(r + i).filter(z => !z.moved);
      const civs = gr.length ? adjacentIds(r + i).filter(id => G.spaces[id] && isRouteSp(id)).flatMap(id => unitsAt(id).filter(x => x.type === 'civ' && !x.ecg)) : [];
      if (civs.length) { const v = await UI.askZeds({ title: '¡Mira! ¡Una distracción!', text: '¿Unas Civiles Normales adyacentes sufren 1 Impacto y se retiran para que ' + zedGroupName(gr, r + i) + ' no avance?', spaces: [r + i].concat(civs.map(c => c.space)), options: civs.map(c => ({ label: 'Sí: ' + c.name + ' en ' + spaceLabel(c.space), value: c.id })).concat([{ label: 'No', value: '' }]) });
        if (v) { const c = G.units[v]; await hitPlayer(c, 1); if (c.space && isRouteSp(c.space) && c.space !== 'CEM') retreatPlayers([c], nextToward(c.space)); gr.forEach(z => z.moved = true); LOG('Distracción: los Zeds de ' + spaceLabel(r + i) + ' no avanzan.', 'good'); continue; } }
    }
    await stepSpace(r + i, cer, false);
  }
  if (!cer && !G.over) {
    for (let i = L; i >= 0 && !G.over; i--) for (const z of zedsAt(r + i).filter(x => (x.fast || x.key === 'lobo') && x.space === r + i && G.units[x.id])) { await moveGroup([z], z.space); }
  }
}
async function routeOrder(rem) {
  const out = [];
  while (rem.length > 1) {
    const v = await UI.choose({ title: 'Orden de las rutas', text: 'Elige la ' + (out.length + 1) + '.ª ruta a activar:', options: rem.map(r => ({ label: ROUTES[r].name, value: r, color: ROUTES[r].color })) });
    out.push(v); rem = rem.filter(x => x !== v);
  }
  out.push(rem[0]); return out;
}
async function phaseZeds() {
  const ev = G.event;
  if (ev.guardia) { return; }
  let list = [];
  if (ev.cer) { await UI.announce('¡CEREBROS! Los Zeds que ganen avanzan otra vez', '#ff3b2a', 1200, true); await infUp(ev.skulls); LOG('¡CEREBROS!: todas las rutas se activan y los Zeds que ganen avanzan otra vez.', 'bad'); const o = await routeOrder(G.routes.slice()); for (const r of o) { await activateRoute(r, true); if (G.over) return; } return; }
  const anyOther = ev.z.includes('ANY');
  for (const x of ev.z) {
    if (x === 'ANY' || x === 'MIN2') continue;
    if (x === 'INIT') { await activateInitial(); return; }
    if (x === '*') list.push(...(await routeOrder(G.routes.slice())));
    else if (x === 'D2') { const dr = await drawDestiny(); if (dr) { list.push(dr.route, dr.route); await resolveTwist(dr); } }
    else if (G.routes.includes(x)) list.push(x);
  }
  if (ev.z.includes('MIN2')) { const c = G.routes.map(r => [r, routeZeds(r).length]); const m = Math.min(...c.map(x => x[1])); const r = await chooseRoute(c.filter(x => x[1] === m).map(x => x[0]), 'Ruta con menos Zeds: se activa 2 veces.'); list.push(r, r); }
  for (const r of list) { await activateRoute(r, false); if (G.over) return; }
  if (anyOther) { const rest = G.routes.filter(r => !list.includes(r)); if (rest.length) { const r = await chooseRoute(rest, 'Cualquier otra: elige la ruta que se activa.'); await activateRoute(r, false); } }
}

/* ---------- 4R ---------- */
async function phase4R() {
  if (!G.lv.fourR) return;
  const ev = G.event;
  for (const u of allUnits(x => x.side === 'raid')) {
    if (!u.space || !isRouteSp(u.space)) continue;
    const nx = nextToward(u.space);
    if (nx === 'C') {
      LOG(u.name + ' llega al Centro: pierdes recursos.', 'bad'); await lossChoice(strength(u), ['s', 'a']);
      if (u.bubba) for (const t of allUnits(x => isFighter(x) && x.space && (isCity(x.space)))) await hitPlayer(t, 1);
      removeUnit(u); delete G.units[u.id]; continue;
    }
    putUnit(u, nx); LOG(u.name + ' avanza a ' + spaceLabel(nx) + '.', 'zed'); UI.focus(nx); UI.redraw(); await UI.settle();
    if (zedsAt(nx).length) await melee({ zeds: zedsAt(nx), hum: [u], space: nx, attacker: 'h', from: prevToward(nx) });
    else if (plAt(nx).length) await melee({ zeds: [u], hum: plAt(nx), space: nx, attacker: 'z', from: prevToward(nx) });
    if (G.over) return;
  }
  for (const u of allUnits(x => x.type === 'marine' && x.space && isRouteSp(x.space))) {
    UI.focus(u.space, 1.7); UI.redraw(); await UI.settle();
    const v = await UI.choose({ title: 'Marines', text: 'Los Marines pueden mover 1 espacio sin coste.', options: [{ label: 'Hacia el Centro', value: 'f' }, { label: 'Hacia atrás', value: 'b' }, { label: 'Quedarse', value: 'n' }] });
    const dest = v === 'f' ? nextToward(u.space) : v === 'b' ? prevToward(u.space) : null;
    if (dest && !isInit(dest) && playerRoom(dest, u)) { await doMove(u, dest); }
  }
  let n = ev.r4 || 0;
  if (n > 0) {
    const rs = allUnits(x => x.type === 'refugee' && x.space && isRouteSp(x.space));
    for (let k = 0; k < Math.min(n, rs.length); k++) {
      const cands = rs.filter(x => x.space && isRouteSp(x.space) && !zedsAt(nextToward(x.space)).length && !x.movedR);
      if (!cands.length) break;
      const w = cands.length === 1 ? cands[0].id : await UI.pickUnit(cands, 'Refugiados 4R: elige la unidad que huye ' + (k + 1) + '/' + n + '.');
      const u = G.units[w]; u.movedR = true; const nx = nextToward(u.space);
      if (nx === 'C') await refugeeArrives(u); else putUnit(u, nx);
      UI.redraw();
    }
    allUnits(x => x.movedR).forEach(x => x.movedR = false);
  }
  for (const u of allUnits(x => x.type === 'guard' && x.space && isRouteSp(x.space))) {
    UI.focus(u.space, 1.7); UI.redraw(); await UI.settle();
    const v = await UI.choose({ title: 'Guardia Nacional', text: 'La Guardia puede mover 1 espacio sin coste.', options: [{ label: 'Hacia el Centro', value: 'f' }, { label: 'Hacia atrás', value: 'b' }, { label: 'Quedarse', value: 'n' }] });
    const dest = v === 'f' ? nextToward(u.space) : v === 'b' ? prevToward(u.space) : null;
    if (dest && !isInit(dest) && dest !== 'C' && playerRoom(dest, u)) await doMove(u, dest);
  }
}

/* ---------- Infección y Alimentación ---------- */
async function phaseInfection() {
  if (!G.lv.infection) return;
  const sps = allUnits(x => x.type === 'spreader' && x.space && isRouteSp(x.space) && !isInit(x.space));
  if (sps.length) { LOG(sps.length + ' Propagador(es) de Enfermedad: +' + sps.length + ' Infección.', 'bad'); await infUp(sps.length); }
  if (G.event.inf === 'B') {
    const bd = await zenReroll([d6(), d6()], 'Tirada de Brote'); const a = bd[0], b = bd[1]; LOG('Tirada de Brote: ' + (a + b) + ' (Infección ' + G.inf + ').');
    if (a + b <= G.inf) { LOG('¡Estalla un Brote!', 'bad'); await announceOutbreak(); }
  }
}
/* Al fallar la tirada de Brote se explica qué va a pasar y luego se resuelve. El Zed que aparece se asoma (peekZeds)
   y es el mismo que coloca outbreak(), igual que en la vista previa de las cartas. */
async function announceOutbreak() {
  G.turn.peekQ = { zed: [], sup: [] };
  const t = peekZeds(1)[0];
  await UI.waitAck('¡Estalla un Brote!', outbreakText(t));
  await withPeek(() => outbreak(false));
}
function outbreakText(t) {
  return 'Aparece ' + (t ? 'un ' : '') + Preview.zt(t) + ' en la ruta que indique la carta de Destino: en el Caos o Pueblo más cercano al Centro si lo hay (con 4R), o en su Inicial; en el Túnel y con Vacunas, siempre en el Inicial.';
}

async function phaseFeeding() {
  if (!G.lv.supplies) return;
  let n = G.event.al; let cost = 0;
  if (n === 'd') {
    const inHosp = BEDS.filter(b => G.spaces[b] && unitsAt(b).length).length + allUnits(x => x.space === 'CAMP').length;
    const r = (await zen1(d6(), 'Tirada de Alimentación')) + (alive('salvacion') ? 1 : 0); LOG('Tirada de Alimentación: ' + r + ' (unidades necesitadas: ' + inHosp + ').');
    cost = r <= inHosp ? 1 : 0;
  } else cost = n;
  if (cost >= 2 && alive('clarin')) { cost--; LOG('El Mensajero del Clarín: el segundo Suministro es gratis.'); }
  if (!cost) return;
  const pay = Math.min(G.supplies, cost); G.supplies -= pay; LOG('Alimentación: −' + pay + ' Suministro(s).', 'bad');
  const miss = cost - pay;
  if (miss > 0) { LOG('¡Faltan ' + miss + ' Suministros! Impactos a tus unidades.', 'bad'); for (let k = 0; k < miss; k++) { const us = allUnits(x => isFighter(x) && x.space && x.space !== 'CEM'); if (!us.length) break; const w = await UI.pickUnit(us, 'Escasez de Suministros: elige la unidad que sufre 1 Impacto.'); await hitPlayer(G.units[w], 1); } }
  UI.updateStats();
}

/* ---------- Eventos: efecto al inicio de la fase de los Zeds ---------- */
function strongestNormalZed() { const zs = allUnits(x => x.type === 'zed' && isRouteSp(x.space)); if (!zs.length) return null; const m = Math.max(...zs.map(strength)); return zs.filter(z => strength(z) === m)[0]; }
async function groundAttack(u) {
  const t = G.turn.noTerrain ? 0 : terrainOf(u.space); const col = clamp(3 + t, 0, 6);
  const h = UI.fireOpen({ ground: true, shooter: u, str: strength(u), shifts: t ? [{ label: 'Terreno', v: t }] : [], col });
  let dice = await h.roll(0); dice = await zenReroll(dice, 'ataque sorpresa', h); const row = sumRow(dice[0] + dice[1]); const ph = CAC[row][col][1]; h.setResult(row, col, ph, null, true); await h.done();
  if (u.resist) u.resist = false;
  await hitPlayer(u, ph);
}
async function sneakAttack(label) {
  const dr = await drawDestiny(); if (!dr) return;
  const c = []; for (let i = 1; i <= lastOf(dr.route); i++) c.push(...plAt(dr.route + i));
  if (!c.length) LOG('No hay unidades de jugador en la ruta destinada.');
  else { const v = await UI.pickUnit(c, label + ': elige la unidad que sufre el ataque.'); await groundAttack(G.units[v]); }
  await resolveTwist(dr);
}
function newTurnFlags() { G.turn = newTurn(); }
async function eventStart() {
  const ev = G.event, id = ev.id;
  if (ev.noTerrain) G.turn.noTerrain = true; if (ev.smash) G.turn.smash = true; if (ev.chaos2) G.turn.chaos2 = true;
  if (ev.noSurfaceMove) G.turn.noSurfaceMove = true; if (ev.mercs) G.turn.mercs = true; if (ev.flamed) G.turn.flamed = true;
  if (ev.noRetreatOnce) G.turn.noRetreatOnce = true; if (ev.outbreakLocal) G.turn.outbreakLocal = true;
  if (ev.assault) { G.turn.noTerrain = true; await infUp(routeZeds(ev.assault).length); if (G.routes.includes(ev.assault)) await placeZedInitial(ev.assault); return; }
  const lowestInitial = () => { let best = null; for (const r of G.routes) { const zs = zedsAt(r + '0'); const m = zs.length ? Math.min(...zs.map(strength)) : -1; if (!best || m < best.m) best = { id: r + '0', m }; } return best.id; };
  if (ev.negation) G.turn.negation = true; if (ev.freeFromC) G.turn.freeFromC = true; if (ev.noFight) G.turn.noFight = true; if (ev.panic) G.turn.panic = true;
  if (ev.freeSearch) { for (const u of allUnits(x => ['hero', 'civh'].includes(x.type) && x.space && canSearch(x))) { const v = await UI.choose({ title: 'Búsqueda gratis', text: u.name + ' puede Buscar gratis en ' + spaceLabel(u.space) + '.', options: [{ label: 'Buscar', value: 'y' }, { label: 'No', value: 'n' }] }); if (v === 'y') await doSearch(u); } }
  switch (id) {
    case 'entusiasma': { const dr = await drawDestiny(); if (dr) { const us = []; for (let i = 0; i <= lastOf(dr.route); i++) us.push(...plAt(dr.route + i)); us.push(...plAt('C')); us.forEach(u => u.freeMF = (u.freeMF || 0) + 1); LOG(us.length + ' unidades reciben 1 Acción gratis (Mover o disparar).', 'good'); await resolveTwist(dr); } break; }
    case 'cardio': { G.turn.cardio = true; const empty = G.routes.map(r => r + '0').filter(i => !zedsAt(i).length); const t = empty.length ? await UI.pickSpace(empty, 'Cardio: elige un espacio Inicial vacío para el nuevo Zed.') : lowestInitial(); await placeZedAt(t, 'Cardio'); break; }
    case 'armados': { const cs = allUnits(x => x.type === 'civ' && x.space !== 'CEM'); if (cs.length) { const v = cs.length === 1 ? cs[0].id : await UI.pickUnit(cs, 'Civiles Bien Armados: elige la unidad.'); G.units[v].armed = true; LOG('Civiles Bien Armados en ' + spaceLabel(G.units[v].space) + '.', 'good'); } break; }
    case 'bajo_pies': case 'errantes': case 'renqueantes': await sneakAttack(ev.name); break;
    case 'propagacion': { const dr = await drawDestiny(); if (dr) { G.turn.propag = true; await placeZedInitial(dr.route); await resolveTwist(dr); } break; }
    case 'pelo': for (const r of G.routes) await placeZedInitial(r); for (const z of allUnits(isZedSide)) z.hits = 0; break;
    case 'odio': { const zs = allUnits(x => x.type === 'zed' && strength(x) <= 3 && isRouteSp(x.space)).sort((a, b) => sp(b.space).i - sp(a.space).i); let n = 0; for (const z of zs) { const w = z.space; discardZed(z); const nz = makeZed(); if (nz) { putUnit(nz, w); n++; } } LOG(n + ' Zeds débiles sustituidos por Zeds de Fuerza completa.', 'bad'); break; }
    case 'heroe_b': case 'heroe_g': { const k = randomAvailableHero(); if (k) { const inits = ['C'].concat(G.routes.map(r => r + '0')); const w = await UI.pickSpace(inits, 'Llega un Héroe: elige el espacio (Centro o un Inicial).'); await spawnHero(k, w); } else LOG('No quedan Héroes disponibles.'); break; }
    case 'keepcalm': { const hs = allUnits(x => x.type === 'hero' && x.space); if (hs.length) { const v = await UI.pickUnit(hs, '«Keep calm»: elige un Héroe (2 columnas a favor al atacar).'); G.units[v].keepCalm = true; } break; }
    case 'mina': { const mid = 'M3'; G.turn.block.push(mid); for (const u of plAt(mid)) { await hitPlayer(u, 1); if (u.space === mid) retreatPlayers([u], 'C'); }
      for (const z of zedsAt(mid).slice()) { if (!G.units[z.id] || z.space !== mid) continue; await hitZed(z); if (G.units[z.id] && z.space === mid) await retreatZeds([z], zedOrigin(z)); } break; }
    case 'resistentes': { await placeZedAt('M0', 'Zeds Resistentes'); const t = strongestNormalZed(); if (t) { t.zresist = true; LOG('Resistentes en un Zed de Fuerza ' + strength(t) + '.', 'bad'); } break; }
    case 'cerebros_b1': case 'cerebros_b2': break;
    case 'agua': await lossChoice(await rollShown('Agua contaminada: pérdidas', v => '<b>' + v + '</b>: pierdes ' + v + ' (Suministros o Impactos).'), ['s', 'p']); break;
    case 'marines': { const dr = await drawDestiny(); if (dr) { const m = makeSpecial('marines', dr.route + '0'); G.ammo = Math.min(20, G.ammo + 4); LOG('Llegan los Marines (+4 Munición).', 'good'); await resolveTwist(dr); } break; }
    case 'toxicos': { await placeZedAt('A0', 'Zeds Tóxicos'); const t = strongestNormalZed(); if (t) t.toxic = true; break; }
    case 'rapidos': { await placeZedAt('B0', 'Zeds Rápidos'); const t = strongestNormalZed(); if (t) t.fast = true; break; }
    case 'turba': { const dr = await drawDestiny(); if (dr) { if (G.inf >= 8) await placeZedInitial(dr.route, makeSuper()); else { makeSpecial('vip', dr.route + '0', { name: 'Supervivientes V.I.P.', type: 'refugee' }); LOG('Aparecen los Supervivientes V.I.P.', 'good'); } await resolveTwist(dr); } break; }
    case 'saqueadores': { const rs = SURFACE.map(r => [r, Array.from({ length: lastOf(r) + 1 }, (_, i) => sp(r + i).chaos).reduce((a, b) => a + b, 0)]); const m = Math.max(...rs.map(x => x[1])); const r = await chooseRoute(rs.filter(x => x[1] === m).map(x => x[0]), 'Saqueadores: ruta con más Caos.'); makeSpecial('saqueadores', r + '0'); LOG('¡Aparecen Saqueadores en ' + ROUTES[r].name + '!', 'bad'); break; }
    case 'helicoptero': { const c = allUnits(x => isZedSide(x) && x.space && isRouteSp(x.space) && !isInit(x.space) && sp(x.space).route !== 'T').map(x => x.space).filter((v, i, a) => a.indexOf(v) === i); if (c.length) { const t = await UI.pickSpace(c, 'Helicóptero: elige un espacio con Zeds.'); const r = d6() + d6(); const n = r <= 5 ? 1 : r <= 9 ? 2 : 3; LOG('Helicóptero: ' + r + ' → ' + n + ' Impacto(s).', 'good'); await applyZedHits(zedsAt(t), n); } break; }
    case 'eficiencia': case 'jornada': case 'monstruo': G.turn.specials.push(mkSpecial(id)); break;
    case 'oh_malo': { const dr = await drawDestiny(); if (dr) { await placeZedAt(dr.route + '1', 'Oh, esto es malo'); await resolveTwist(dr); } for (const z of allUnits(isZedSide)) z.hits = 0; break; }
    case 'que_demonios': { G.inf = 13; await outbreak(true, true); for (const z of allUnits(isZedSide)) z.hits = 0; break; }
    case 'donde_todos': { for (const r of G.routes) for (let i = 1; i <= lastOf(r); i++) if (sp(r + i).kind === 'pueblo' && controlled(r + i)) await placeZedAt(r + i, '¿De dónde salen todos?'); for (const z of allUnits(isZedSide)) z.hits = 0; break; }
    case 'guardia': { const dr = await drawDestiny(); if (dr) { let r = dr.route; if (r === 'T') r = await chooseRoute(SURFACE, 'La Guardia Nacional solo puede ir a la superficie: elige ruta.'); const g = makeSpecial('guardia', r + '0'); g.name = 'Guardia Nacional'; await resolveTwist(dr); } break; }
    case 'noelle': { const dr = await drawDestiny(); if (dr) { await placeZedInitial(dr.route, spawnSpreader('noelle')); await resolveTwist(dr); } break; }
    case 'tsunami': for (const r of G.routes) await placeZedInitial(r); break;
    case 'catastrofe': { const id2 = 'A4'; for (const u of plAt(id2)) { await hitPlayer(u, 2); if (u.space === id2) retreatPlayers([u], 'C'); } await placeChaos(id2, 1); G.turn.block.push(id2); break; }
    case 'desesperacion': { let n = 0; for (const r of G.routes) for (const k of [0, 1, 2]) n += zedsAt(r + (lastOf(r) - k)).length; LOG('Aumenta la desesperación: pierdes ' + n + '.', 'bad'); await lossChoice(n, ['s', 'a', 'p']); break; }
    case 'moteros': { makeSpecial('petra', 'C'); G.supplies = Math.max(0, G.supplies - 1); LOG('Llegan Los Ángeles de Petra.', 'good'); break; }
    case 'que_diablos': { for (const z of allUnits(x => isZedSide(x) && x.space && isRouteSp(x.space) && isNamed(x.space))) { z.flipped = false; } for (const z of allUnits(isZedSide)) z.hits = 0; break; }
    case 'crisis': { const hs = allUnits(x => x.type === 'hero' && x.space && (x.space === 'C' || neighbors('C').includes(x.space)) && sp(x.space).kind !== 'bed'); if (hs.length) { const v = await UI.pickUnit(hs, 'Crisis nerviosa: elige un Héroe.'); const r = d6(); await hitPlayer(G.units[v], r === 1 ? 2 : r <= 5 ? 1 : 0); } break; }
    case 'campanas': { for (const z of allUnits(x => isZedSide(x) && x.space && isRouteSp(x.space))) { const nb = adjacentIds(z.space).concat([z.space]); if (nb.some(i => (sp(i).kind === 'city' || sp(i).kind === 'pueblo') && !plAt(i).length)) { if (z.hits > 0) z.hits--; else if (z.flipped) { z.flipped = false; z.hits = 2; } } } break; }
    case 'frenesi': case 'super_enloq': break;
    case 'misiles': { const c = allUnits(x => isZedSide(x) && x.space && isRouteSp(x.space) && sp(x.space).route !== 'T').map(x => x.space).filter((v, i, a) => a.indexOf(v) === i); if (c.length) { const t = await UI.pickSpace(c, 'Misiles: elige un espacio con Zeds.'); const r = d6(); const n = r <= 2 ? 1 : r <= 4 ? 2 : 3; await applyZedHits(zedsAt(t), n); } break; }
    case 'contaminacion': case 'doc_problema': { let n = 0; for (const b of BEDS) if (G.spaces[b]) n += unitsAt(b).length; for (const o of ['O1', 'O2']) if (G.spaces[o]) n += unitsAt(o).length; await infUp(n); if (G.berra) { G.berra = false; LOG('Se retira a Elwood Berra.', 'bad'); } break; }
    case 'accidente': case 'experimentos': { const r = await rollShown(id === 'experimentos' ? 'Experimentos: investigación' : 'Accidente: investigación', v => v <= 5 ? '<b>' + v + '</b>: se aplica el efecto de investigación' : '<b>' + v + '</b>: sin efecto'); if (r <= 5) pushInitialResearch(1); if (id === 'experimentos') await infUp(await rollShown('Experimentos: Infección', v => '<b>' + v + '</b>: +' + v + ' de Infección')); break; }
    case 'elwood': G.berra = true; LOG('Elwood Berra reduce la Infección 1 cada turno.', 'good'); break;
    case 'hace_falta': { const c = allUnits(x => (x.type === 'refugee' || x.type === 'aldeano' || x.type === 'civ') && x.space && isRouteSp(x.space) && sp(x.space).route !== 'T'); if (c.length) { const v = await UI.pickUnit(c, 'Hace falta un Pueblo: elige la unidad que será sustituida por un Zed.'); const u = G.units[v], w = u.space; putUnit(u, 'C'); const z = makeZed(); if (z) putUnit(z, w); const bed = freeBed(); if (bed && u.type !== 'aldeano') { putUnit(u, bed); u.flipped = true; u.ecg = true; } else if (u.type === 'aldeano') { removeUnit(u); delete G.units[u.id]; } else putUnit(u, 'C'); } break; }
    case 'no_comer': { for (const z of allUnits(x => x.type === 'zed' && x.space && isRouteSp(x.space))) { const nb = adjacentIds(z.space).concat([z.space]); if (nb.some(i => (sp(i).kind === 'city' || sp(i).kind === 'pueblo') && !plAt(i).length)) { if (z.hits > 0) z.hits--; else if (z.flipped) { z.flipped = false; z.hits = 2; } } } break; }
    case 'misterioso': { const i = G.hand.findIndex(k => DEST[k]); if (i >= 0) { LOG('Descartas ' + DEST[G.hand[i]].name + '.', 'bad'); G.destDiscard.push(G.hand.splice(i, 1)[0]); UI.updateHand(); } await infUp(d6()); for (const r of G.routes) await placeZedInitial(r); break; }
    case 'civ_heroicos': { const k = pickCivh(); if (k) await spawnHero(k, 'C'); break; }
    case 'murcielagos': { const us = allUnits(x => isFighter(x) && x.space && isRouteSp(x.space) && sp(x.space).route === 'T').sort((a, b) => sp(a.space).i - sp(b.space).i); if (us.length) { const u = us[0]; await infUp(1); await hitPlayer(u, 1); if (u.space && isRouteSp(u.space)) retreatPlayers([u], 'C'); } break; }
    case 'brote_local': break;
    case 'artefacto': { const dr = await drawDestiny(); if (dr) { const n = await rollShown('Artefacto: ¿dónde aparece?', v => 'Aparece el Súper Zed en el espacio n.º ' + v + ' de la ruta'); const t = dr.route + clamp(lastOf(dr.route) - n, 1, lastOf(dr.route) - 1); await placeZedAt(t, 'Artefacto', makeSuper()); await revealResearch(); await resolveTwist(dr); } break; }
    case 'oh_no': { const t = strongestNormalZed(); if (t) { const up = ['smart', 'fast', 'toxic', 'leader', 'zresist'][rnd(5)]; t[up] = true; LOG('Una mejora Zed (' + up + ') se coloca sobre un Zed de Fuerza ' + strength(t) + '.', 'bad'); } break; }
    case 'desde_lab': { const t = 'T4'; if (G.routes.includes('T')) { const sup = allUnits(x => x.type === 'super').length; await placeZedAt(t, 'Desde el laboratorio', sup ? makeZed() : makeSuper()); } break; }
    case 'hinchados': { const dr = await drawDestiny(); if (dr) { const zs = routeZeds(dr.route).sort((a, b) => sp(b.space).i - sp(a.space).i); if (zs.length) { const sid = zs[0].space; const z = zs[0]; if (z.type === 'super') { removeUnit(z); delete G.units[z.id]; } else if (z.type === 'spreader') { removeUnit(z); delete G.units[z.id]; } else discardZed(z); for (const nb of adjacentIds(sid)) { if (isInit(nb)) continue; const col = 3; const [a, b] = await UI.rollSimple('Zed hinchado: explosión en ' + spaceLabel(nb), 2, d => 'Total <b>' + (d[0] + d[1]) + '</b>: <b>' + FIRE[sumRow(d[0] + d[1])][col] + '</b> Impacto(s).'); const hits = FIRE[sumRow(a + b)][col]; const tg = unitsAt(nb); for (const t of tg) { if (isZedSide(t)) await applyZedHits([t], hits); else if (t.side === 'pl' || t.side === 'raid') await hitPlayer(t, hits); } } } await resolveTwist(dr); } break; }
    case 'atajos': G.turn.specials.push(mkSpecial('atajos')); break;
    case 'feria': break;
    case 'conductos': case 'alcantarilla': case 'irrupcion': break;
    default: break;
  }
}
/* efectos que ocurren al final de la fase de los Zeds (antes de las Acciones) */
async function eventAfterZeds() {
  const ev = G.event, id = ev.id;
  if (G.over) return;
  switch (id) {
    case 'que_olor': { const c = allUnits(x => isFighter(x) && x.space && x.space !== 'C' && sp(x.space).kind !== 'bed' && !sp(x.space).kind.match(/office|lab|camp/) && !isInit(x.space) && x.side === 'pl'); if (c.length) { const v = await UI.pickUnit(c, '¿Qué es ese olor?: elige la unidad que será atacada.'); const u = G.units[v]; const z = makeZed(); if (z) { z.flipped = true; putUnit(z, u.space); const r = await melee({ zeds: [z], hum: [u], space: u.space, attacker: 'z', from: prevToward(u.space) }); if (z.space && r.zedWon) { z.flipped = false; z.hits = Math.min(z.hits, 2); } } } break; }
    case 'frenesi': case 'super_enloq': { G.turn.frenzy = true; const sups = allUnits(x => x.type === 'super' && x.space && isRouteSp(x.space)).sort((a, b) => (lastOf(sp(a.space).route) - sp(a.space).i) - (lastOf(sp(b.space).route) - sp(b.space).i)); sups.forEach(z => z.moved = false); for (const z of sups) { if (z.space && G.units[z.id]) await moveGroup([z], z.space); if (G.over) return; } G.turn.frenzy = false; break; }
    case 'inteligentes': { await placeZedAt('F0', 'Zeds Inteligentes'); const t = strongestNormalZed(); if (t) t.smart = true; break; }
    case 'feria': { for (const r of ['T']) for (const i of [3, 5]) { const id2 = 'T' + i; if (!G.spaces[id2]) continue; const n = await rollShown('La feria de las tinieblas (' + spaceLabel(id2) + ')', v => '<b>' + v + '</b>: ' + (v === 1 ? '2 Zeds' : v <= 5 ? '1 Zed' : 'ningún Zed')); const k = n === 1 ? 2 : n <= 5 ? 1 : 0; for (let j = 0; j < k; j++) await placeZedAt(id2, 'La feria de las tinieblas'); } break; }
    case 'conductos': for (const i of [3, 5]) { const id2 = 'T' + i; if (!G.spaces[id2]) continue; for (const z of zedsAt(id2).slice()) { const n = await rollShown('Conductos del vapor', v => v <= 2 ? '<b>' + v + '</b>: el Zed intenta entrar en la Central Nuclear' : v <= 5 ? '<b>' + v + '</b>: el Zed intenta entrar en la Granja' : '<b>' + v + '</b>: no pasa nada'); if (n <= 2) await sewerMove(z, 'A4'); else if (n <= 5) await sewerMove(z, 'B4'); } } break;
    case 'alcantarilla': case 'irrupcion': { const map = { 1: 'F3', 2: 'A4', 4: 'M3', 3: 'B4', 5: 'B4' }; const tm = { 7: 'F3', 6: 'A4', 4: 'M3', 3: 'B4', 5: 'B4' }; for (const n of [7, 6, 5, 4, 3]) { const id2 = 'T' + (lastOf('T') - n); if (!G.spaces[id2]) continue; for (const z of zedsAt(id2).slice()) await sewerMove(z, tm[n]); } break; }
  }
}
async function sewerMove(z, tgt) {
  if (!z.space || !G.units[z.id]) return;
  if (sp(z.space).kind === 'crypt') { const r = await rollShown('Zed en la Cripta', v => v >= 4 ? '<b>' + v + '</b>: se queda en la Cripta' : '<b>' + v + '</b>: sale de la Cripta'); if (r >= 4) return; }
  if (normalZedsAt(tgt).length >= zedCap(tgt)) return;
  putUnit(z, tgt); LOG('Un Zed emerge del Túnel en ' + spaceLabel(tgt) + '.', 'bad'); z.moved = true;
  if (plAt(tgt).length) await zedAttack([z], tgt, prevToward(tgt)); else await zedsOccupy([z], tgt);
}
/* efectos al final de la fase de Acciones */
async function eventEnd() {
  const ev = G.event, id = ev.id;
  const pl = id2 => plAt(id2).length > 0;
  switch (id) {
    case 'cabana': if (pl('M5')) { G.ammo = Math.min(20, G.ammo + 2); LOG('Botín de la cabaña: +2 Munición.', 'good'); } break;
    case 'despensa': if (pl('B7')) { G.supplies = Math.min(20, G.supplies + 4); LOG('Botín de la despensa: +4 Suministros.', 'good'); } break;
    case 'granero': if (pl('B4')) { const n = await rollShown('Granero: Suministros', v => '<b>' + v + '</b>: +' + v + ' Suministros'); G.supplies = Math.min(20, G.supplies + n); LOG('Granero: +' + n + ' Suministros.', 'good'); } break;
    case 'descubrimiento': if (pl('F3')) await revealResearch(); break;
    case 'materiales': if (pl('A4')) await revealResearch(); break;
    case 'soldados': { await lossChoice(await rollShown('Soldados de fortuna: pérdidas', v => '<b>' + v + '</b>: pierdes ' + v + ' (Suministros o Impactos).'), ['s', 'p']); break; }
    case 'bomberos': { let n = 0; for (const s of Object.values(G.spaces)) if (s.kind === 'pueblo' && s.chaos) { const v = await UI.choose({ title: 'Bomberos', text: '¿Retiras el Caos de ' + spaceLabel(s.id) + ' (+1 Infección)?', options: [{ label: 'Retirar', value: 'y' }, { label: 'No', value: 'n' }] }); if (v === 'y') { s.chaos = 0; G.chaosLeft++; await infUp(1); n++; } } break; }
  }
}

async function activateInitial() {
  const zs = allUnits(x => isZedSide(x) && x.space && isInit(x.space)); if (!zs.length) { LOG('No hay Zeds en espacios Iniciales: nadie se mueve.'); return; }
  LOG('Solo se activan los Zeds de los espacios Iniciales.', 'zed'); zs.forEach(z => z.moved = false);
  for (const z of zs) { if (z.space && G.units[z.id] && !z.moved) await moveGroup(zedsAt(z.space).filter(q => !q.moved), z.space); if (G.over) return; }
}
