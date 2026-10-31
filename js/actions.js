/* Acciones del jugador, habilidades de personaje, Investigación, cartas de la mano, mantenimiento y puntuación. */
'use strict';

/* Acciones gratis: free (cualquiera) · freeM (solo Mover) · freeMF (Mover o disparar). type: 'move' | 'fire' | undefined */
function freeTotal(u) { return u ? (u.free || 0) + (u.freeM || 0) + (u.freeMF || 0) : 0; }
function freeFor(u, type) { return u ? (u.free || 0) + (type === 'move' ? (u.freeM || 0) : 0) + (type === 'move' || type === 'fire' ? (u.freeMF || 0) : 0) : 0; }
function freeLabel(u) { const p = []; if (u.free) p.push(u.free); if (u.freeM) p.push(u.freeM + ' solo Mover'); if (u.freeMF) p.push(u.freeMF + ' Mover o disparar'); return p.join(' + '); }
/* El medidor de Acciones de Evento llega como mucho a 4 (solo Jaque Mates puede superarlo). */
function addEventActions(n) { G.pool.event = Math.min(4, G.pool.event + n); }
/* ---------- Jugadores (cooperativo hot seat) ----------
   G.players: [{name, color}] (1 = partida en solitario) · G.act: jugador que está actuando · G.pool.pl[i]: Acción de Jugador de cada uno.
   u.owner: índice del jugador cuyo Héroe Personal es u (null = unidad común). */
const PL_COLORS = ['#4fc3f7', '#ffb74d', '#81c784', '#ce93d8'];
const nPlayers = () => (G.players && G.players.length) || 1;
const multiP = () => nPlayers() > 1;
const plTok = i => (G.pool && G.pool.pl && G.pool.pl[i === undefined ? (G.act || 0) : i]) || 0;
const plTokAll = () => ((G.pool && G.pool.pl) || []).reduce((a, b) => a + (b ? 1 : 0), 0);
function initPlayers(list) {
  G.players = (list && list.length ? list : [{}]).map((p, i) => ({ name: p.name || 'Jugador ' + (i + 1), color: PL_COLORS[i % 4] }));
  G.act = 0;
}
function newPool(eventActs) { return { pl: Array.from({ length: nPlayers() }, () => 1), event: eventActs || 0 }; }
/* El Héroe Personal de otro jugador exige su permiso explícito; las unidades comunes las activa cualquiera.
   Solo en partidas online (G.online): en hot seat todos están en la misma mesa y el permiso se pide hablando, sin modal. */
function needsPermission(u) { return multiP() && G.online && u && u.owner != null && u.owner !== G.act && !(G.turn && G.turn.perm && G.turn.perm[u.id + ':' + G.act]); }
/* Cuando muere el Héroe Personal de un jugador, ese jugador elige otro Héroe o Civil Heroico del tablero que aún no tenga dueño. */
async function reassignHero(dead) {
  const i = dead.owner, p = G.players[i]; dead.owner = null; if (!p) return;
  const c = allUnits(x => (x.type === 'hero' || x.type === 'civh') && x.owner == null && x.space && x.space !== 'CEM' && x.side === 'pl');
  if (!c.length) { LOG(p.name + ' se queda sin Héroe Personal: no hay ningún Héroe libre en el tablero.', 'bad'); return; }
  const prev = G.act; G.act = i; UI.updateStats();
  const t = c.length === 1 ? c[0] : G.units[await UI.pickUnit(c, p.name + ': ha muerto ' + dead.name + '. Elige tu nuevo Héroe Personal.')];
  G.act = prev; t.owner = i; LOG(p.name + ' toma el control de ' + t.name + ' como nuevo Héroe Personal.', 'good'); UI.updateStats(); UI.redraw();
}
function ownerName(u) { return u && u.owner != null && G.players[u.owner] ? G.players[u.owner].name : ''; }
/* En una ventana de acciones gratis (freeWindow) solo cuentan las acciones gratis de la carta: no hay pool ni fichas. */
function actionsAvail(u, type) { return G.freeWin ? freeFor(u, type) : freeFor(u, type) + plTok() + G.pool.event; }
function canPay(u, n, type) { return actionsAvail(u, type) >= n; }
function spendActions(u, n, type) {
  for (let k = 0; k < n; k++) {
    if (u && type === 'move' && u.freeM > 0) u.freeM--;
    else if (u && (type === 'move' || type === 'fire') && u.freeMF > 0) u.freeMF--;
    else if (u && u.free > 0) u.free--;
    else if (plTok() > 0) G.pool.pl[G.act || 0] = 0;
    else if (G.pool.event > 0) G.pool.event--;
  }
}

/* ---------- Investigación ---------- */
async function revealResearch() {
  if (!G.res) return;
  if (!G.res.deck.length) { LOG('No quedan cartas de Investigación.'); return; }
  if (G.res.cur) G.res.disc.push(G.res.cur.id);
  const id = G.res.deck.shift(); G.res.cur = RES[id];
  EVT('carta_inv', null, { id, nombre: RES[id].name, umbral: RES[id].th, quedan: G.res.deck.length });
  LOG('Nueva carta de Investigación: «' + RES[id].name + '».', 'dest');
  await UI.waitAck('Investigación: ' + RES[id].name, RES[id].txt + '<br><i>Siguiente investigación: tirada de ' + RES[id].th + (RES[id].th < 6 ? '+' : '') + (RES[id].sup ? ' y 1 Suministro' : '') + '.</i>', resImg(id), 'r:' + id);
  await applyResearch(RES[id]);
  UI.updateStats();
}
async function applyResearch(c) {
  switch (c.id) {
    case 'uhm': infDown(2); break;
    case 'noticias': { const cs = G.cemetery.filter(isFighter); if (cs.length) { const v = await UI.chooseCards({ title: 'Nos llegaron noticias de tu muerte', text: 'Elige la unidad que regresa del Cementerio.', options: cs.map(u => unitOpt(u)) }); const u = G.units[v]; G.cemetery = G.cemetery.filter(x => x.id !== u.id); putUnit(u, 'C'); u.flipped = true; u.hits = capOf(u) - 1; } break; }
    case 'folletos': {
      const done = [];
      for (let n = 1; n <= 2; n++) {
        const cs = allUnits(x => x.type === 'civ' && curable(x) && !done.includes(x.id)); if (!cs.length) break;
        const v = await UI.pickUnit(cs, 'Distribución de folletos: elige la Civil a la que quitas 1 Impacto (' + n + ' de 2).', true); if (v == null) break;
        const u = G.units[v]; if (healUnit(u)) { done.push(u.id); LOG('Folletos: ' + u.name + ' en ' + spaceLabel(u.space) + ' pierde 1 Impacto.', 'good'); infDown(1); }
      }
      if (!done.length) LOG('Distribución de folletos: no se cura a ninguna Civil.'); break; }
    case 'cecina': G.supplies = Math.min(20, G.supplies + 2); break;
    case 'musica': { const c = allUnits(x => isZedSide(x) && isRouteSp(x.space)).map(x => x.space).filter((v, i, a) => a.indexOf(v) === i); if (c.length) { const t = await UI.pickSpace(c, '¡Bajad la música!: elige un espacio; sus Zeds se retiran.'); await retreatZeds(zedsAt(t), zedOrigin(zedsAt(t)[0])); } break; }
    case 'cientificos': { const cs = Object.values(G.spaces).filter(s => s.chaos).map(s => s.id); if (cs.length) { const id = cs.length === 1 ? cs[0] : await UI.pickSpace(cs, 'Científicos seguros de sí mismos: elige de dónde retiras 1 ficha de Caos.'); sp(id).chaos--; G.chaosLeft++; LOG('Se retira 1 ficha de Caos de ' + spaceLabel(id) + '.', 'good'); UI.redraw(); } break; }
    case 'pruebas': if (G.weapon && G.weapon.parts.length) G.weapon.parts.splice(rnd(G.weapon.parts.length), 1); else pushInitialResearch(1); break;
    case 'hormona': {
      const sup = allUnits(x => x.type === 'super' && x.space && isRouteSp(x.space)); if (!sup.length) break;
      const v = await UI.pickUnit(sup, 'Hormona anticrecimiento: elige el Súper Zed que se reemplaza por un Zed Normal (o cancela).', true); if (v == null) break;
      const z = G.units[v], w = z.space, hits = z.hits; G.supers.push(z.key); removeUnit(z); delete G.units[z.id];
      const nz = await makeZedA(); if (nz) { putUnit(nz, w); nz.hits = Math.min(hits, (nz.hf || 2) - 1); LOG('Hormona anticrecimiento: el Súper Zed se sustituye por un Zed de Fuerza ' + nz.full + '.', 'good'); } UI.redraw(); break; }
    case 'heroe_c': { const ks = Object.keys(HEROES).filter(x => (HEROES[x].sci || /Cient/.test(HEROES[x].cls)) && !hero(x) && !G.cemetery.some(c => c.key === x) && heroAllowed(x)); if (!ks.length) { LOG('No hay ningún Científico disponible en este nivel.'); break; } const k = ks.length === 1 ? ks[0] : await UI.choose({ title: 'Llega un Héroe Científico', text: 'Elige el Héroe Científico que llega al Centro de la Ciudad:', options: ks.map(x => ({ label: HEROES[x].name, value: x })) }); await spawnHero(k, 'C'); break; }
    case 'antidoto': {
      if (!G.finalPlaced) { G.finalPlaced = true; LOG('Componente Final colocado en el Laboratorio.', 'good'); G.res.deck.splice(rnd(G.res.deck.length + 1), 0, 'antidoto'); }
      else { G.antidote = true; LOG('¡Habéis descubierto el Antídoto! La Infección baja 1 cada turno.', 'good'); }
      break; }
    case 'arma1': case 'arma2': case 'arma3': case 'arma4': {
      const have = G.weapon ? G.weapon.parts.length : 0; const agee = alive('agee') && agee_inLab();
      if (have >= 3 && !agee) { LOG('Sin la Profesora Agee en el Laboratorio no recibes el cuarto Componente.'); break; }
      const opts = Object.keys(WEAPON_PARTS).filter(k => !(G.weapon && G.weapon.parts.includes(k)));
      if (!opts.length) break;
      const v = await UI.choose({ title: 'Súper Arma', text: 'Elige un Componente:', options: opts.map(k => ({ label: WEAPON_PARTS[k].name + ' — ' + WEAPON_PARTS[k].txt, value: k })) });
      if (!G.weapon) G.weapon = { parts: [] }; G.weapon.parts.push(v); LOG('Componente de la Súper Arma: ' + WEAPON_PARTS[v].name + '.', 'good'); break; }
    default: break;
  }
}
function agee_inLab() { const a = hero('agee'); return a && a.space === 'LAB'; }
async function doInvestigate(u, free) {
  const c = G.res.cur;
  let usingSup = false;
  if (!free && alreadyHas('escasean') && G.supplies >= 1 + (c.sup ? 1 : 0)) usingSup = !canPay(u, 1) || (await UI.choose({ title: 'Escasean materiales', text: '¿Cómo pagas la Investigación?', options: [{ label: '1 Acción', value: 'a' }, { label: '1 Suministro (tienes ' + G.supplies + ')', value: 's' }] })) === 's';
  if (G.supplies < (usingSup ? 1 : 0) + (c.sup ? 1 : 0)) { LOG('Te faltan Suministros para investigar.', 'bad'); return false; }
  if (usingSup) { G.supplies--; } else if (!free) spendActions(u, 1);
  if (c.sup) G.supplies--;
  const ib = u.key === 'agee' || u.key === 'samcarter' ? 1 : 0, mods = ib ? [{ label: u.key === 'agee' ? 'Profesora Agee' : 'Samantha Carter', v: 1 }] : [];
  let dice = await UI.rollSimple('Investigar (hace falta ' + c.th + '+)', 1, null, { mods });
  let r = Math.min(6, dice[0] + ib);
  if (r < c.th && u.key === 'samcarter' && !G.once.samRepeat) {
    const v = await UI.choose({ title: 'Teoría del campo unificado', text: 'La Investigación ha fallado (' + r + '). ¿Repites la tirada? Solo una vez por partida; la segunda es definitiva.', options: [{ label: 'Repetir', value: 'y' }, { label: 'No', value: 'n' }] });
    if (v === 'y') { G.once.samRepeat = true; dice = await UI.rollSimple('Investigar otra vez (hace falta ' + c.th + '+)', 1, null, { mods }); r = Math.min(6, dice[0] + ib); }
  }
  if (r < c.th && r + 1 >= c.th && u.key === 'macgyver' && G.supplies >= 1 && await UI.choose({ title: 'Ingeniero', text: 'La Investigación ha fallado (' + r + '). ¿Gastas 1 Suministro para sumar +1 y conseguirla?', options: [{ label: 'Gastar 1 Suministro', value: 'y' }, { label: 'No', value: 'n' }] }) === 'y') { G.supplies--; r++; LOG('MacGyver improvisa con 1 Suministro (+1).', 'good'); }
  EVT('investigar', u.id, { carta: c.id, nombre: c.name, umbral: c.th, dado: dice[0], resultado: r, exito: r >= c.th, suministro: !!c.sup, sinAccion: !!usingSup });
  if (r >= c.th) { LOG('Investigación con éxito (' + r + ').', 'good'); G.turn.researched = true; await revealResearch(); }
  else LOG('La Investigación fracasa (' + r + ').', 'bad');
  UI.updateStats(); return true;
}

/* ---------- construir ---------- */
/* Darling «Zen»: una vez por turno, al jugar una carta de Destino «Guardar para más tarde» recibe 1 Acción de Personaje para su unidad. */
function zenPlayed() { const d = alive('darling'); if (!d || !d.space || G.charUsed.zen) return; G.charUsed.zen = true; d.free = (d.free || 0) + 1; LOG('Zen: Alyssa Darling recibe 1 Acción gratis.', 'good'); }
/* Espacios donde la unidad puede levantar una Barricada (Bauer: el suyo o uno adyacente). */
function barTargets(u) {
  const ids = u.key === 'bauer' ? [u.space].concat(adjacentIds(u.space)) : [u.space];
  return ids.filter(id => id && G.spaces[id] && isRouteSp(id) && !isInit(id) && !sp(id).chaos && canBuildBarAt(id));
}
/* Trampa explosiva (Frank): espacios de ruta no Iniciales, sin Zeds, en su espacio o adyacentes, en rutas que aún no tengan una trampa (el Túnel incluido). */
function trapSpaces(u) {
  const hasTrap = r => { for (let i = 0; i <= lastOf(r); i++) if (sp(r + i).trap) return true; return false; };
  return [u.space].concat(adjacentIds(u.space)).filter((id, k, a) => a.indexOf(id) === k && sp(id) && isRouteSp(id) && !isInit(id) && sp(id).kind !== 'crypt' && !blocked(id) && !zedsAt(id).length && !hasTrap(sp(id).route));
}
/* Salto temporal (Doc Brown): solo desde el Centro, 3 Suministros, a un espacio de ruta de superficie sin Zeds que no sea Inicial. Un acompañante (Héroe o Civiles Heroicos que puedan usar vehículos) puede quedarse allí. */
const DOC_NO_RIDE = ['pepinillos', 'horacio', 'lee', 'carter'];
function docCompanions(u) { return unitsAt('C').filter(x => x !== u && (x.type === 'hero' || x.type === 'civh') && !DOC_NO_RIDE.includes(x.key) && !x.ecg && !x.mount && !x.rider && !x.resist && !isPetra(x)); }
function docJumpSpaces(u, comp) {
  const here = id => unitsAt(id).filter(x => (isFighter(x) || x.side === 'raid') && !x.mount && x.type !== 'train').length;
  return Object.keys(G.spaces).filter(id => isRouteSp(id) && isSurface(id) && !isInit(id) && sp(id).kind !== 'crypt' && !blocked(id) && !zedsAt(id).length && !raidAt(id).length && playerRoom(id, u) && (!comp || (playerRoom(id, comp) && playerCap(id) - here(id) >= 2)));
}
const buildCost = u => u.key === 'bauer' || u.key === 'macgyver' ? 1 : 2;
function canBuildBarAt(id) { const r = sp(id).route; for (let i = 0; i <= lastOf(r); i++) if (sp(r + i).bar) return false; return true; }
async function doBuild(u, bastion, where) {
  const s = sp(where || u.space);
  if (bastion) { if (G.supplies < 3) return; G.supplies -= 3; s.bar = 2; G.once.bast = true; LOG('Kingman levanta un Bastión en ' + spaceLabel(u.space) + '.', 'good'); }
  else { let c = buildCost(u); if (G.supplies < c) return; G.supplies -= c; s.bar = Math.max(s.bar, 1); LOG('Barricada en ' + spaceLabel(s.id) + '.', 'good'); Voz.say('barricada'); }
  UI.updateStats(); UI.redraw();
}
function canBuild(u) {
  if (!G.lv.fourR || !canAct(u) || !isFighter(u) || ['pepinillos', 'horacio', 'lee'].includes(u.key) || !barTargets(u).length) return false;
  return G.supplies >= buildCost(u);
}

/* ---------- curar ---------- */
/* Toda Acción de Curar baja la Infección 1 (2 si Agee está en el Hospital) y solo puede hacerse 1 vez por unidad y turno. */
function cureInf() { const agee = alive('agee'); infDown(agee && agee.space && sp(agee.space).kind === 'office' ? 2 : 1); }
/* El camión de Carter solo se repara con su propia habilidad: ninguna otra Curación puede usarse en él (salvo quitarle el ECG en el Hospital). */
/* Bender (Reparación Alcohólica) y el Helicóptero Medevac: con ECG solo se curan en el Hospital; sin ECG, solo en el Centro (acción propia, 1 Suministro). */
const curable = x => injured(x) && x.curedTurn !== G.turnNo && !(x.key === 'carter' && !(x.space && G.spaces[x.space] && sp(x.space).kind === 'bed')) && !(x.key === 'bender' && !x.ecg && x.space !== 'C') && !(x.key === 'heli' && !x.ecg && x.space !== 'C');
async function doCure(u, free, noInf) {
  if (!free) spendActions(u, 1);
  healUnit(u); u.curedTurn = G.turnNo; if (!noInf) cureInf();
  LOG(u.name + ' recibe una Curación.', 'good');
  if (u.type === 'refugee') { u.hits = 0; u.flipped = false; u.ecg = false; await refugeeArrives(u); }
  UI.redraw(); UI.updateStats();
}

function mayDischargeBonus(u) { const m = alive('may'); if (G.phase === 'actions' && m && m.space && sp(m.space).kind === 'office' && u.side === 'pl') { u.free = (u.free || 0) + 1; LOG('May (Oficina): ' + u.name + ' recibe 1 Acción gratis al recibir el alta.', 'good'); } }

/* ---------- lista de acciones de una unidad ---------- */
function unitActions(u) {
  const A = []; if (!u || u.side !== 'pl' || G.phase !== 'actions' || G.busy) return A;
  const act = canAct(u), pay = n => canPay(u, n);
  A.push({ id: 'move', label: 'Mover', ok: act && (canPay(u, 1, 'move') || canMoveFree(u)) && !u.resist && u.type !== 'aldeano' && sp(u.space).kind !== 'camp' });
  if (!isSoft(u)) {
    const ammoNeed = u.type === 'guard' ? 2 : 1;
    const supCost = u.key === 'jones' || isPetra(u);
    const hasAmmo = G.turn.mercs || (supCost ? G.supplies >= 1 : G.ammo >= ammoNeed) || ((u.key === 'staub' || u.key === 'division12' || (u.key === 'may' && !supCost)) && !(G.firstFreeUsed || {})[u.key]);
    A.push({ id: 'fire', label: 'Disparar', ok: act && canPay(u, 1, 'fire') && hasAmmo && Object.keys(fireTargets(u)).length > 0 });
    A.push({ id: 'search', label: 'Buscar', ok: act && pay(1) && canSearch(u) });
    if (u.key === 'piazza') A.push({ id: 'fab', label: 'Fabricar munición y disparar (2)', ok: act && canPay(u, 2, 'fire') && Object.keys(fireTargets(u)).length > 0 });
  }
  const bedAct = (act || u.ecg) && G.lv.infection && u.space && sp(u.space).kind === 'bed';
  if (bedAct && u.type !== 'aldeano') A.push({ id: 'cure', label: 'Curar', ok: curable(u) && (pay(1) || G.turn.freeHeal > 0 || G.turn.freeHealNoInf > 0) });
  if (bedAct) A.push({ id: 'discharge', label: 'Dar de alta (gratis)', ok: true });
  if (G.lv.fourR && canBuild(u)) A.push({ id: 'build', label: 'Construir Barricada', ok: pay(1) });
  if (G.lv.res && u.sci && u.space === 'LAB' && act && !G.turn.researched) A.push({ id: 'investigate', label: 'Investigar', ok: pay(1) ? (!G.res.cur.sup || G.supplies > 0) : (alreadyHas('escasean') && G.supplies >= 1 + (G.res.cur.sup ? 1 : 0)) });
  if (u.space && sp(u.space).kind === 'camp' && u.type === 'refugee' && !G.turn.equipped && !u.vip) A.push({ id: 'equip', label: 'Equipar Refugiados (gratis)', ok: G.cemetery.some(x => x.type === 'civ') });
  /* Visiones de Wilson: en cualquier momento, sin gastar Acción. */
  if (u.key === 'wilson' && u.space) A.push({ id: 'visions', label: '🔮 Visiones: mirar la carta superior de Destino', ok: true });
  if (u.key === 'bender' && u.space === 'C' && !u.ecg) A.push({ id: 'bcure', label: 'Reparar en el Centro (1 Sum., 1 vez por turno)', ok: curable(u) && G.supplies >= 1 });
  if (u.key === 'heli' && u.space === 'C' && !u.ecg) A.push({ id: 'bcure', label: 'Reparar en el Centro (1 Sum., 1 vez por turno)', ok: curable(u) && G.supplies >= 1 });
  /* Helicóptero Medevac (exp. 4): en el aire solo puede aterrizar; en tierra, volar. */
  if (u.key === 'heli' && u.space === 'AIR') A.push({ id: 'aterrizar', label: 'Aterrizar (gratis)', ok: true });
  /* El SAR es la excepción a «con Caos no se actúa»: su Acción de Personaje es justo para quitarlo. */
  if (u.key === 'sar' && !u.locked && !u.ecg) A.push({ id: 'despejar', label: 'Despejar (−2 Caos en el Mantenimiento)', ok: !G.charUsed.despejar && pay(1) && despejarOk(u) });
  if (act && !isSoft(u)) {
    const cu = k => !G.charUsed[k];
    if (u.key === 'schmidt') A.push({ id: 'ini', label: 'Iniciativa', ok: cu('ini') });
    if (u.key === 'jones') A.push({ id: 'planes', label: 'Sus Propios Planes', ok: cu('planes') });
    if (u.key === 'jones' && G.res && u.space && sp(u.space).kind === 'office') A.push({ id: 'jhosp', label: 'Sus Propios Planes: paciente al Cementerio + Investigación', ok: cu('planes') && G.res.deck.length > 0 && hospitalUnits(u).length > 0 });
    if (u.key === 'hunt') A.push({ id: 'lid', label: 'Liderazgo', ok: cu('lid') });
    if (u.key === 'alia') A.push({ id: 'calle', label: 'Ya no es hora de estar en la calle', ok: cu('calle') && calleTargets(u).length > 0 });
    if (u.key === 'heli') A.push({ id: 'vuelo', label: 'Vuelo (1 Suministro, con un Héroe)', ok: cu('vuelo') && G.supplies >= 1 && heliLandSpaces(u, null).some(id => id !== u.space) });
    if (u.key === 'caza') A.push({ id: 'marcar', label: 'Presa marcada (1 acc.)', ok: cu('marcar') && pay(1) && Object.keys(fireTargets(u)).length > 0 });
    if (u.key === 'porter') A.push({ id: 'jefe', label: 'Jefe de equipo', ok: cu('jefe') && jefeTargets(u).length > 0 });
    if (u.key === 'hernandez') { A.push({ id: 'cit', label: 'Ciudadela', ok: cu('cit') && G.ammo >= 1 }); A.push({ id: 'spe', label: 'Discurso Motivador', ok: !G.speechUsed }); }
    if (u.key === 'hauser') { A.push({ id: 'train', label: 'Entrenar Civiles (1 acc.)', ok: pay(1) && allUnits(x => x.type === 'civ' && !x.trained && x.space && (x.space === u.space || adjacentIds(u.space).includes(x.space))).length > 0 }); A.push({ id: 'recruit', label: 'Reclutar (1 Munición)', ok: u.space === 'C' && G.ammo >= 1 && pay(1) }); }
    if (u.key === 'seaver' && u.space && sp(u.space).kind === 'office') A.push({ id: 'medico', label: 'Médico: curar en el Hospital (gratis)', ok: cu('medico') && BEDS.some(b => G.spaces[b] && unitsAt(b)[0] && curable(unitsAt(b)[0])) });
    if (u.key === 'johnson' || u.key === 'salvacion' || u.key === 'seaver') A.push({ id: 'firstaid', label: u.key === 'johnson' ? 'Curar (1 acc., 1 Suministro)' : 'Primeros auxilios (1 Suministro)', ok: (u.key === 'johnson' ? pay(1) : cu('aid' + u.key)) && G.supplies >= 1 && G.lv.infection && allUnits(x => isFighter(x) && x.space && curable(x) && (x.space === u.space || adjacentIds(u.space).includes(x.space) || (u.key === 'seaver' && (u.space === 'C' || sp(u.space).kind === 'office') && sp(x.space).kind === 'bed'))).length > 0 });
    if (u.key === 'bauer' && u.space && sp(u.space).bridge) A.push({ id: 'puente', label: 'Retirar la ficha del puente (1 acc.)', ok: pay(1) });
    if (sp('F6') && sp('F6').bridge === 'down' && (u.space === 'F6' || adjacentIds(u.space).includes('F6')) && !isSoft(u)) A.push({ id: 'ferry', label: 'Dar la vuelta al Puente (Ferry, 1 acc.)', ok: pay(1) });
    if (u.key === 'bauer') A.push({ id: 'ammo', label: '2 Suministros → 1 Munición', ok: cu('bauer') && G.supplies >= 2 });
    if (u.key === 'wright') A.push({ id: 'peek', label: 'Mirar carta de Evento', ok: pay(1) });
    if (u.key === 'agee') A.push({ id: 'boost', label: '+3 Infección → +1 Acción', ok: cu('boost') && G.pool.event < 4 });
    if (u.key === 'kingman') { A.push({ id: 'bastion', label: 'Bastión (1 acc., 3 Sum.)', ok: !G.once.bast && pay(1) && G.supplies >= 3 && isRouteSp(u.space) && !isInit(u.space) && canBuildBar(u) }); A.push({ id: 'mines', label: 'Campo de Minas (1 acc., 2 Sum., 1 Mun.)', ok: !G.once.mines && !u.flipped && pay(1) && G.supplies >= 2 && G.ammo >= 1 && isRouteSp(u.space) && !isInit(u.space) }); }
    if (u.key === 'macgyver') A.push({ id: 'macgy', label: 'Con lo que hay (1 Suministro → 2 Munición)', ok: cu('macgy') && G.supplies >= 1 && G.ammo < 20 });
    if (u.key === 'frank') A.push({ id: 'trampa', label: 'Trampa explosiva (1 Suministro)', ok: cu('trampa') && G.supplies >= 1 && trapSpaces(u).length > 0 });
    if (u.key === 'doc' && u.space === 'C') A.push({ id: 'salto', label: 'Salto temporal (3 Suministros)', ok: cu('salto') && G.supplies >= 3 && !u.mount && !u.rider && docJumpSpaces(u).length > 0 });
    if (u.key === 'wzed') A.push({ id: 'wzed', label: 'Transmisión de Emergencia', ok: cu('wzed') });
    if (u.key === 'bomberos') { A.push({ id: 'libera', label: 'Liberar Civiles/Aldeanos', ok: cu('libera') && [u.space].concat(adjacentIds(u.space)).some(i => sp(i) && sp(i).kind === 'pueblo' && unitsAt(i).some(x => x.resist || x.type === 'aldeano')) }); A.push({ id: 'manguera', label: 'Mangueras (1 acc.)', ok: pay(1) && adjacentIds(u.space).some(i => zedsAt(i).length && !isInit(i)) }); }
    if (weaponFor(u, 'granada') && u.space) A.push({ id: 'granada', label: 'Granada de Gas (1 acc.)', ok: pay(1) && adjacentIds(u.space).some(i => zedsAt(i).length && !isInit(i)) });
  }
  return A;
}
function canBuildBar(u) { const r = sp(u.space).route; for (let i = 0; i <= lastOf(r); i++) if (sp(r + i).bar) return false; return true; }

/* Civiles (normales o heroicos) en el espacio de Porter o adyacente: a quienes puede dar 1 acción gratis (Jefe de equipo). */
/* SAR: hay Caos en su espacio y no está en coma. */
const despejarOk = u => !!(u.space && G.spaces[u.space] && G.lv.fourR && sp(u.space).chaos > 0 && !u.ecg);
const jefeTargets =u => allUnits(x => (x.type === 'civ' || x.type === 'civh') && x.space && (x.space === u.space || adjacentIds(u.space).includes(x.space)));
/* Alia, «Ya no es hora de estar en la calle»: Civiles (normales o heroicos) o Refugiados en su espacio o adyacente que puedan avanzar hacia el Centro. */
const calleDests = x => {
  if (!x.space || x.ecg || !sp(x.space).route || x.space === 'C') return [];
  const s1 = nextToward(x.space), out = [], soft = isSoft(x);
  const stop = id => canStop(x, id) && !(soft && zedsAt(id).length);
  if (stop(s1)) out.push(s1);
  if (s1 !== 'C' && !blocked(s1) && !zedsAt(s1).length && !raidAt(s1).length && !sp(s1).chaos && sp(s1).bridge !== 'down') { const s2 = nextToward(s1); if (stop(s2)) out.push(s2); }
  return out;
};
const calleTargets = u => allUnits(x => (x.type === 'civ' || x.type === 'civh' || x.type === 'refugee') && x.space && (x.space === u.space || adjacentIds(u.space).includes(x.space)) && calleDests(x).length);
/* Unidades del Hospital (camas y Oficinas del Personal) a las que Jones puede trasladar al Cementerio; no cuenta él mismo. */
const hospitalUnits = self => ['H1', 'H2', 'H3', 'H4', 'O1', 'O2'].filter(k => G.spaces[k]).flatMap(k => unitsAt(k)).filter(x => x.id !== self.id);
async function runAction(u, id) {
  EVT('act', u.id, { id });
  switch (id) {
    case 'search': spendActions(u, 1); await doSearch(u); break;
    case 'cure': { if (G.turn.freeHealNoInf > 0) { G.turn.freeHealNoInf--; await doCure(u, true, true); } else if (G.turn.freeHeal > 0) { G.turn.freeHeal--; await doCure(u, true); } else await doCure(u, false); break; }
    case 'discharge': { if (u.ecg) { if (await UI.confirm('Dar de alta con ECG supone enviarla al Cementerio. ¿Seguro?')) await sendCemetery(u, 'es dada de alta en coma'); } else { putUnit(u, 'C'); LOG(u.name + ' recibe el alta.', 'good'); mayDischargeBonus(u); } UI.redraw(); break; }
    case 'build': { const ts = barTargets(u); if (!ts.length) break; const w = ts.length === 1 ? ts[0] : await UI.pickSpace(ts, 'Barricada: elige el espacio.', true); if (w == null) break; spendActions(u, 1); await doBuild(u, false, w); break; }
    case 'puente': spendActions(u, 1); sp(u.space).bridge = null; LOG('La Cuadrilla de Bob Bauer retira la ficha del Puente colgante.', 'good'); UI.redraw(); break;
    case 'ferry': spendActions(u, 1); sp('F6').bridge = 'ferry'; LOG(u.name + ' da la vuelta al Puente: ahora es un Ferry.', 'good'); UI.redraw(); break;
    case 'investigate': await doInvestigate(u); break;
    case 'equip': { const cs = G.cemetery.filter(x => x.type === 'civ'); const v = await UI.choose({ title: 'Equipar Refugiados', text: 'Elige la unidad de Civiles Normales que regresa.', options: cs.map(c => ({ label: 'Civiles ' + c.full + '/' + c.red, value: c.id })), cancel: true }); if (v == null) break; const c = G.units[v]; G.cemetery = G.cemetery.filter(x => x.id !== c.id); removeUnit(u); delete G.units[u.id]; putUnit(c, 'C'); c.flipped = true; c.hits = 0; G.turn.equipped = true; LOG('Refugiados equipados: Civiles vuelven al Centro.', 'good'); break; }
    case 'ini': G.charUsed.ini = true; u.free++; LOG('Schmidt usa Iniciativa: 1 acción gratis para él.', 'good'); break;
    case 'visions': await UI.willyVisions(); break;
    case 'bcure': G.supplies--; healUnit(u); u.curedTurn = G.turnNo; LOG(u.name + ' se repara en el Centro (−1 Suministro).', 'good'); UI.redraw(); UI.updateStats(); break;
    case 'jhosp': { const c = hospitalUnits(u); if (!c.length) break; const v = await UI.pickUnit(c, 'Jones: elige la unidad del Hospital que va al Cementerio.', true); if (v == null) break; G.charUsed.planes = true; await sendCemetery(G.units[v], 'es trasladada al Cementerio por Jones'); await revealResearch(); break; }
    case 'planes': G.charUsed.planes = true; u.free++; LOG('Jones usa Sus Propios Planes: 1 acción gratis para él.', 'good'); break;
    case 'calle': { const c = calleTargets(u); if (!c.length) { LOG('No hay Civiles que puedan avanzar.'); break; } const v = c.length === 1 ? c[0].id : await UI.pickUnit(c, 'Elige la unidad que avanza hacia el Centro.', true); if (v == null) break; const x = G.units[v], ds = calleDests(x); const d = ds.length === 1 ? ds[0] : await UI.pickSpace(ds, 'Alia: elige el destino de ' + x.name + ' (hasta 2 espacios hacia el Centro).', true); if (d == null) break; G.charUsed.calle = true; if (x.resist) { x.resist = false; LOG(x.name + ' deja de estar Resistiendo.'); } LOG('Alia manda a ' + x.name + ' hacia el Centro.', 'good'); await doMove(x, d, [x.space, d]); break; }
    case 'despejar': {
      if (!despejarOk(u)) { LOG('No se puede Despejar aquí.'); break; }
      spendActions(u, 1); G.charUsed.despejar = true; u.despeja = { t: G.turnNo, sp: u.space };
      LOG('Despejar: ' + u.name + ' prepara el despeje de ' + spaceLabel(u.space) + ' (−2 Caos en el Mantenimiento, sin Infección).', 'good'); UI.pulseSpace(u.space, '#7bd45a'); UI.redraw(); break;
    }
    case 'vuelo': await heliVuelo(u); break;
    case 'aterrizar': await heliAterrizar(u, false); break;
    case 'marcar': {
      const ts = Object.keys(fireTargets(u)); if (!ts.length) { LOG('No hay presas a su alcance.'); break; }
      const w = ts.length === 1 ? ts[0] : await UI.pickSpace(ts, 'Presa marcada: elige el espacio de la unidad Zed.', true); if (w == null) break;
      const zs = zedsAt(w); let z = zs[0];
      if (zs.length > 1) { const v = await UI.askZeds({ title: 'Presa marcada', text: 'Elige la unidad Zed que marcas.', spaces: zs.map(x => x.space), options: zs.map(x => ({ label: zedLabel(x), value: x.id })) }); z = G.units[v]; }
      if (!z) break;
      spendActions(u, 1); G.charUsed.marcar = true; z.marcada = G.turnNo;
      LOG('Presa marcada: ' + zedLabel(z) + ' (+1 columna a los disparos contra ella este turno).', 'good'); UI.pulseSpace(z.space, '#ffb347'); UI.redraw(); break;
    }
    case 'jefe': { const c = jefeTargets(u); if (!c.length) { LOG('No hay Civiles cerca.'); break; } const v = await UI.pickUnit(c, 'Jefe de equipo: elige la unidad de Civiles que recibe 1 acción gratis.', true); if (v == null) break; G.charUsed.jefe = true; G.units[v].free++; LOG('Jefe de equipo: ' + G.units[v].name + ' recibe 1 acción gratis.', 'good'); break; }
    case 'lid': { const c = allUnits(x => (x.type === 'civ' || x.type === 'civh' || x.type === 'marine') && x.key !== 'horacio' && x.space && (x.space === u.space || adjacentIds(u.space).includes(x.space))); if (!c.length) { LOG('No hay Civiles cerca.'); break; } const v = await UI.pickUnit(c, 'Liderazgo: elige la unidad que recibe 1 acción gratis.', true); if (v == null) break; G.charUsed.lid = true; G.units[v].free++; break; }
    case 'cit': { const sh = unitsAt('C').filter(x => isFighter(x) && x.side === 'pl' && x.id !== u.id && Object.keys(fireTargets(x)).length && !x.nofire); if (!sh.length) { LOG('Ciudadela: ningún tirador del Centro tiene objetivos.'); break; } let s = sh[0]; if (sh.length > 1) { const sv = await UI.pickUnit(sh, 'Ciudadela: elige quién dispara.', true); if (sv == null) break; s = G.units[sv]; } UI.mode = { type: 'fire', unit: s, opts: fireTargets(s), free: true }; UI.setBanner('Ciudadela: elige el objetivo'); UI.redraw(); break; }
    case 'spe': { G.speechUsed = true; const wz = alive('wzed'); const us = allUnits(x => x.side === 'pl' && x.id !== u.id && !['aldeano', 'train'].includes(x.type) && x.space && (wz ? isSurface(x.space) : (x.space === 'C' || isCity(x.space)))); us.forEach(x => x.free++); LOG('Discurso Motivador: ' + us.length + ' unidades reciben 1 acción gratis.', 'good'); break; }
    case 'train': { const c = allUnits(x => x.type === 'civ' && !x.trained && x.space && (x.space === u.space || adjacentIds(u.space).includes(x.space))); if (!c.length) { LOG('No hay Civiles Normales cerca.'); break; } const v = await UI.pickUnit(c, 'Entrenar: elige la unidad de Civiles.', true); if (v == null) break; spendActions(u, 1); G.units[v].trained = true; G.units[v].resist = false; LOG('Civiles entrenados (+2 Fuerza).', 'good'); break; }
    case 'recruit': { const c = allUnits(x => x.type === 'civ' && curable(x) && x.space && sp(x.space).kind !== 'bed'); if (!c.length) { LOG('Ninguna Civil herida.'); break; } const v = await UI.pickUnit(c, 'Reclutar: retira 1 Impacto a la unidad.', true); if (v == null) break; spendActions(u, 1); G.ammo--; healUnit(G.units[v]); UI.updateStats(); break; }
    case 'medico': { const c = BEDS.map(b => G.spaces[b] && unitsAt(b)[0]).filter(x => x && curable(x)); const v = await UI.pickUnit(c, 'Médico: elige a quién curas.', true); if (v == null) break; G.charUsed.medico = true; await doCure(G.units[v], true); break; }
    case 'firstaid': { const near = u.key === 'seaver' && (u.space === 'C' || sp(u.space).kind === 'office'); const c = allUnits(x => isFighter(x) && x.space && curable(x) && (x.space === u.space || adjacentIds(u.space).includes(x.space) || (near && sp(x.space).kind === 'bed'))); if (!c.length) { LOG('No hay nadie herido cerca.'); break; } const v = await UI.pickUnit(c, 'Primeros auxilios: elige a quién curas.', true); if (v == null) break; if (u.key === 'johnson') spendActions(u, 1); else G.charUsed['aid' + u.key] = true; G.supplies--; healUnit(G.units[v]); G.units[v].curedTurn = G.turnNo; cureInf(); UI.updateStats(); break; }
    case 'ammo': G.supplies -= 2; G.ammo = Math.min(20, G.ammo + 1); G.charUsed.bauer = true; UI.updateStats(); break;
    case 'peek': { spendActions(u, 1); const id2 = G.eventDeck[0]; if (id2) await UI.waitAck('Próxima carta de Evento', 'La siguiente carta es «' + EV[id2].name + '».', evImg(id2), 'e:' + id2); break; }
    case 'boost': { G.charUsed.boost = true; await infUp(3); addEventActions(1); break; }
    case 'bastion': spendActions(u, 1); await doBuild(u, true); break;
    case 'mines': spendActions(u, 1); G.supplies -= 2; G.ammo--; sp(u.space).mine = 1; G.once.mines = true; LOG('Campo de Minas en ' + spaceLabel(u.space) + '.', 'good'); UI.updateStats(); UI.redraw(); break;
    case 'macgy': G.charUsed.macgy = true; G.supplies--; G.ammo = Math.min(20, G.ammo + 2); LOG('MacGyver convierte 1 Suministro en 2 de Munición.', 'good'); UI.updateStats(); break;
    case 'trampa': { const c = trapSpaces(u); if (!c.length) break; const t = c.length === 1 ? c[0] : await UI.pickSpace(c, 'Trampa explosiva: elige el espacio.', true); if (t == null) break; G.charUsed.trampa = true; G.supplies--; sp(t).trap = 1; LOG('Frank coloca una trampa explosiva en ' + spaceLabel(t) + '.', 'good'); UI.updateStats(); UI.redraw(); break; }
    case 'salto': {
      let comp = null; const cands = docCompanions(u);
      if (cands.length) {
        const w = await UI.choose({ title: 'Salto temporal', text: '¿Doc lleva a una unidad agrupada con él? Se queda en el destino; Doc vuelve al Centro al final del turno.', options: [{ label: 'Viajar solo', value: 'n' }, { label: 'Llevar a una unidad', value: 'y' }] });
        if (w === 'y') { const v = await UI.pickUnit(cands, 'Salto temporal: elige a quién llevas.', true); if (v == null) break; comp = G.units[v]; }
      }
      const ds = docJumpSpaces(u, comp); if (!ds.length) { LOG('No hay espacio libre para el salto.'); break; }
      const t = ds.length === 1 ? ds[0] : await UI.pickSpace(ds, 'Salto temporal: elige el destino.', true); if (t == null) break;
      G.charUsed.salto = true; G.supplies -= 3; u.away = true;
      putUnit(u, t); if (comp) putUnit(comp, t);
      LOG('¡88 millas por hora! Doc Brown' + (comp ? ' y ' + comp.name : '') + ' saltan a ' + spaceLabel(t) + '. Doc volverá al Centro al final del turno.', 'good');
      UI.updateStats(); UI.redraw(); UI.focus(t); break;
    }
    case 'wzed': { const c = allUnits(x => (x.type === 'civ' || x.type === 'refugee') && x.space && isSurface(x.space)); if (!c.length) break; const v = await UI.pickUnit(c, 'Transmisión de Emergencia: 1 acción gratis a…', true); if (v == null) break; G.units[v].free++; G.charUsed.wzed = true; break; }
    case 'libera': { const near = [u.space].concat(adjacentIds(u.space)).filter(i => sp(i) && sp(i).kind === 'pueblo'); const c = allUnits(x => (x.resist || x.type === 'aldeano') && x.space && near.includes(x.space)); if (!c.length) break; const v = await UI.pickUnit(c, 'Liberar a…', true); if (v == null) break; const t = G.units[v]; if (t.type === 'aldeano') { t.type = 'refugee'; t.name = 'Refugiados'; } t.resist = false; UI.redraw(); G.charUsed.libera = true; break; }
    case 'manguera': {
      spendActions(u, 1); const dice = await UI.rollSimple('Mangueras: 2 dados contra la Fuerza de un Zed adyacente', 2); const tot = dice[0] + dice[1];
      const zs = adjacentIds(u.space).filter(i => !isInit(i)).flatMap(i => zedsAt(i)).filter(z => strength(z) <= tot);
      if (!zs.length) { LOG('Mangueras (' + tot + '): ningún Zed adyacente tiene Fuerza ' + tot + ' o menos.', 'bad'); break; }
      const z = zs.length === 1 ? zs[0] : G.units[await UI.pickUnit(zs, 'Mangueras (' + tot + '): elige el Zed que se retira.')];
      LOG('Mangueras (' + tot + '): ' + z.name + ' se retira.', 'good'); await retreatZeds([z], zedOrigin(z)); UI.redraw(); break; }
    case 'granada': { const nb = adjacentIds(u.space).filter(i => zedsAt(i).length && !isInit(i)); if (!nb.length) { spendActions(u, 1); break; } const t = nb.length === 1 ? nb[0] : await UI.pickSpace(nb, 'Granada de Gas: elige el espacio adyacente.', true); if (t == null) break; spendActions(u, 1); for (let n = 1; n <= 4 && zedsAt(t).length; n++) { const zs = zedsAt(t); const cur = zs.length === 1 ? zs[0] : G.units[await UI.pickUnit(zs, 'Granada de Gas: reparte el Impacto ' + n + '/4 entre los Zeds de ' + spaceLabel(t) + '.')]; await hitZed(cur); } await placeChaos(t, 1); break; }
  }
}

/* ---------- cartas de la mano ---------- */
/* Coordinador de la comunidad: solo si queda una ficha de Civiles Normales (la reserva) o un Civil Heroico disponible */
function coordinadorOpts() { return (G.spareCiv ? 1 : 0) + CIVH_POOL.filter(x => civhAvail(x) && !hero(x) && HEROES[x].lv <= MAX_CIVH_LV[G.lv.n] && !G.cemetery.some(c => c.key === x)).length; }
function handUsable(k) {
  if (G.phase !== 'actions' && !['hoguera', 'desesperados', 'barrelotodo', 'senal', 'exploradores', 'civiles'].includes(k)) return false;
  if (k === 'coordinador' && !coordinadorOpts()) return false;
  return ['adrenalina', 'coordinador', 'veo_alguien', 'heroe_d', 'cama', 'expediente', 'necesidad', 'canon', 'hoguera', 'desesperados', 'barrelotodo', 'senal', 'exploradores', 'civiles', 'vehiculos', 'heli_noticias'].includes(k);
}
/* Cartas «en cualquier momento» que se ofrecen cuando hacen falta (Caos a punto de acabarse, Brote inminente…), aunque no sea la fase de Acciones.
   Cada disparador pregunta una vez por turno y carta, salvo `always` (derrota o Brote inminentes). Devuelve true si se jugó alguna. */
const HAND_OFFERS = {
  chaos: [['barrelotodo', () => chaosOnMap() > 0, 'retira 2 fichas de Caos']],
  inf: [['desesperados', () => G.ammo >= 1, '−5 Infección, gasta 1 Munición'], ['hoguera', () => true, '−2 Infección']],
  feed: [['senal', () => true, '+2 Suministros y +2 Munición']],
  zeds: [['exploradores', () => allUnits(x => x.type === 'refugee' && x.space && isRouteSp(x.space) && adjacentIds(x.space).some(i => zedsAt(i).length)).length > 0, 'los Refugiados junto a Zeds avanzan 1 espacio']]
};
async function offerHandCards(trigger, text, always) {
  if (G.over || !G.hand || !G.turn) return false;
  const asked = G.turn.asked || (G.turn.asked = {}); let played = false;
  for (const [k, ok, eff] of HAND_OFFERS[trigger]) {
    if (!G.hand.includes(k) || !ok() || (!always && asked[trigger + k])) continue;
    asked[trigger + k] = 1;
    const r = await UI.choose({ title: DEST[k].name, text: text + '<br>¿Juegas la carta? (' + eff + ')', options: [{ label: 'Jugar «' + DEST[k].name + '»', value: 'y' }, { label: 'No', value: 'n' }] });
    if (r === 'y') { await useHandCard(k); if (!G.hand.includes(k)) return true; }
  }
  return played;
}
async function useHandCard(k) {
  const rm = () => { G.hand.splice(G.hand.indexOf(k), 1); G.destDiscard.push(k); zenPlayed(); };
  switch (k) {
    case 'adrenalina': rm(); addEventActions(2); break;
    case 'civiles': { const cs = allUnits(x => x.type === 'civ' && x.space); if (!cs.length) return; const v = await UI.pickUnit(cs, 'Líder Civil: elige las Civiles.', true); if (v == null) return; G.units[v].leader = true; rm(); break; }
    case 'coordinador': { const ch = CIVH_POOL.filter(x => civhAvail(x) && !hero(x) && HEROES[x].lv <= MAX_CIVH_LV[G.lv.n] && !G.cemetery.some(c => c.key === x)); const opts = (G.spareCiv ? [{ label: 'Civiles Normales ' + G.spareCiv[0] + '/' + G.spareCiv[1], value: '_civ' }] : []).concat(ch.map(x => ({ label: HEROES[x].name, value: x }))); if (!opts.length) { LOG('No quedan Civiles disponibles.'); return; } const v = opts.length === 1 ? opts[0].value : await UI.chooseCards({ title: 'Coordinador de la comunidad', text: 'Elige la unidad que llega al Centro.', options: (G.spareCiv ? [{ value: '_civ', label: 'Civiles Normales', sub: G.spareCiv[0] + '/' + G.spareCiv[1] }] : []).concat(ch.map(heroOpt)), extra: [{ label: 'Cancelar', value: null }] }); if (v == null) return; rm(); if (v === '_civ') { const t = G.spareCiv; G.spareCiv = null; const u = newUnit({ side: 'pl', type: 'civ', name: 'Civiles', full: t[0], red: t[1], mp: 2, hf: 2, hr: 2 }); putUnit(u, 'C'); } else await spawnHero(v, 'C'); break; }
    case 'veo_alguien': case 'heroe_d': { let key = randomAvailableHero(); if (!key) { LOG('No quedan Héroes disponibles.'); return; } if (k === 'veo_alguien') { const pool = heroPoolFor(G.lv.n).filter(x => !hero(x) && !G.cemetery.some(c => c.key === x)); key = pool.length === 1 ? pool[0] : await UI.chooseCards({ title: 'Creo que veo a alguien', text: 'Elige el Héroe.', options: pool.map(heroOpt), extra: [{ label: 'Cancelar', value: null }] }); if (key == null) return; } const inits = (k === 'veo_alguien' ? SURFACE.map(r => r + '0') : ['C'].concat(G.routes.map(r => r + '0'))); const w = await UI.pickSpace(inits, 'Elige dónde aparece el Héroe.', true); if (w == null) return; rm(); await spawnHero(key, w); break; }
    case 'cama': { const cs = BEDS.map(b => unitsAt(b)[0]).filter(x => x && x.type === 'civ' && x.curedTurn !== G.turnNo); if (!cs.length) { LOG('No hay Civiles en el Hospital que puedan curarse este turno.'); return; } const v = await UI.pickUnit(cs, 'Elige la unidad que sale del Hospital totalmente curada.', true); if (v == null) return; const u = G.units[v]; const c = Object.values(G.spaces).filter(s => s.route && s.route !== 'T' && s.name && !controlled(s.id)); const w = await UI.pickSpace(c.map(s => s.id), 'Elige el espacio con nombre donde aparece.', true); if (w == null) return; u.hits = 0; u.flipped = false; u.ecg = false; u.curedTurn = G.turnNo; infDown(1); putUnit(u, w); rm(); break; }
    case 'expediente': { if (!unitsAt('T4').some(isFighter)) { LOG('Necesitas una unidad en la Oficina del Dr. Marteuse.'); return; } rm(); await revealResearch(); break; }
    case 'necesidad': { if (G.supplies < 2) { LOG('Necesitas 2 Suministros.'); return; } rm(); await mkSpecial('necesidad').fn(); break; }
    case 'canon': { const c = allUnits(x => isZedSide(x) && x.space && isRouteSp(x.space) && spaceNum(x.space) <= 1).map(x => x.space).filter((v, i, a) => a.indexOf(v) === i); if (!c.length) { LOG('No hay objetivos en espacios 0 ó 1.'); return; } const t = await UI.pickSpace(c, 'Cañón: elige el objetivo.', true); if (t == null) return; const a = d6(), b = d6(), hits = FIRE[sumRow(a + b)][4]; LOG('Cañón: ' + hits + ' Impactos.', 'good'); await applyZedHits(zedsAt(t), hits); if (d6() <= 5) rm(); break; }
    case 'hoguera': rm(); infDown(2); break;
    case 'desesperados': if (G.ammo >= 1) { G.ammo--; rm(); infDown(5); UI.updateStats(); } break;
    case 'barrelotodo': { let n = 2; for (const s of Object.values(G.spaces)) while (n > 0 && s.chaos) { s.chaos--; G.chaosLeft++; n--; } rm(); UI.redraw(); break; }
    case 'senal': rm(); G.supplies = Math.min(20, G.supplies + 2); G.ammo = Math.min(20, G.ammo + 2); UI.updateStats(); break;
    case 'exploradores': { for (const u of allUnits(x => x.type === 'refugee' && x.space && isRouteSp(x.space) && adjacentIds(x.space).some(i => zedsAt(i).length))) { const n = nextToward(u.space); if (n === 'C') await refugeeArrives(u); else if (!zedsAt(n).length) putUnit(u, n); } rm(); UI.redraw(); break; }
    case 'vehiculos': G.turn.vehicle = 3; rm(); LOG('Vehículos «requisados»: tu próxima Acción de Mover de un Héroe tiene +3 de Movimiento.', 'good'); break;
    case 'heli_noticias': G.turn.heli = true; rm(); LOG('Helicóptero: tu próxima Acción de Mover con un Héroe puede ir a cualquier espacio de la superficie.', 'good'); break;
  }
  UI.updateHand(); UI.updateStats(); UI.redraw();
}

/* ---------- mantenimiento ---------- */
async function maintenance() {
  for (const u of Object.values(G.units)) if (u.side === 'pl') { u.free = 0; u.freeM = 0; u.freeMF = 0; delete u.keepCalm; u.curedTurn = 0; }
  G.charUsed = {}; G.firstFreeUsed = {};
  if (G.lv.fourR) {
    for (const s of Object.values(G.spaces)) {
      /* SAR: lo que preparó con Despejar este turno (2 fichas, sin Infección); después sigue la restauración normal del espacio, también sin Infección. */
      const sar = unitsAt(s.id).some(x => x.key === 'sar' && !x.ecg && x.despeja && x.despeja.t === G.turnNo && x.despeja.sp === s.id);
      if (sar && s.chaos) { const n = Math.min(2, s.chaos); s.chaos -= n; G.chaosLeft += n; LOG('Despejar: el SAR quita ' + n + ' de Caos en ' + spaceLabel(s.id) + ' (sin Infección).', 'good'); UI.pulseSpace(s.id, '#7bd45a'); UI.toast('Despejado: −' + n + ' Caos en ' + spaceLabel(s.id), '#7bd45a', 1600); }
      if (!s.chaos) continue;
      const rs = unitsAt(s.id).filter(u => (isFighter(u) || u.side === 'raid' || u.type === 'train') && !['pepinillos', 'horacio'].includes(u.key) && !u.ecg && u.type !== 'refugee');
      const sinInf = sar || rs.some(u => u.key === 'antidist' || u.key === 'doc');
      if (rs.length) { s.chaos--; G.chaosLeft++; LOG('Se restaura el orden en ' + spaceLabel(s.id) + ' (−1 Caos' + (sinInf ? ', sin Infección' : ', +1 Infección') + ').', 'good'); UI.pulseSpace(s.id, '#7bd45a'); UI.toast('Orden restaurado en ' + spaceLabel(s.id) + ': −1 Caos', '#7bd45a', 1600); if (!sinInf) { if (G.weapon && alive('agee')) infDown(2); else await infUp(1); } }
    }
  }
  if (G.antidote) { infDown(1); LOG('El Antídoto reduce la Infección en 1.', 'good'); }
  if (G.berra) { infDown(1); LOG('Elwood Berra reduce la Infección en 1.', 'good'); }
  /* Salto temporal (Doc): vuelve al Centro tras el Mantenimiento, cuando ya ha restaurado el orden donde estuviera. */
  for (const d of allUnits(x => x.key === 'doc' && x.away)) {
    d.away = false;
    if (d.space && isRouteSp(d.space) && !d.ecg) {
      /* Puede volver solo, con la unidad que llevó o con otra de su espacio. */
      const cands = unitsAt(d.space).filter(x => x !== d && (x.type === 'hero' || x.type === 'civh') && !DOC_NO_RIDE.includes(x.key) && !x.ecg && !x.mount && !x.rider && !x.resist && !isPetra(x));
      let pas = null; if (cands.length) { const v = await UI.pickUnit(cands, 'Salto temporal: ¿qué unidad trae Doc de vuelta al Centro? (cancelar = vuelve solo)', true); if (v != null) pas = G.units[v]; }
      putUnit(d, 'C'); if (pas) putUnit(pas, 'C');
      LOG('Doc Brown vuelve al Centro de la Ciudad' + (pas ? ' con ' + pas.name : '') + '.', 'good');
    }
  }
}

/* ---------- puntuación ---------- */
function scoreGame() {
  const units = Object.values(G.units).filter(u => u.side === 'pl' && u.space && u.space !== 'CEM' && !isSoft(u) && u.type !== 'raider' && u.type !== 'train').length;  /* los Trenes (exp. 3) no son unidades: no puntúan */
  const soft = Object.values(G.units).filter(u => u.side === 'pl' && isSoft(u) && u.space && u.space !== 'CEM').length;
  let good = units + (G.supplies >= 2 && G.lv.supplies ? 1 : 0) + (G.ammo >= 2 ? 1 : 0) + (G.antidote ? 1 : 0) + (G.weapon ? G.weapon.parts.length : 0) + (G.lv.infection && G.inf <= 6 ? 1 : 0) + 3 * soft;
  const bad = chaosOnMap() + (G.over === 'win' ? 0 : G.eventDeck.length);
  return { units, soft, good, bad, total: good - bad };
}
