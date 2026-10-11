/* Preparación, mazos, Destino, Investigación y utilidades de partida. */
'use strict';

const MAX_HERO_LV = [0, 1, 2, 3, 4, 5];  /* nivel de héroe (color de la carta: azul 1, verde 2, amarillo 3, naranja 4) permitido en cada nivel de partida */
const MAX_CIVH_LV = [0, 1, 2, 3, 4, 5];

function heroPoolFor(level) { return Object.keys(HEROES).filter(k => HEROES[k].type === 'hero' || k === 'horacio').filter(k => HEROES[k].lv <= MAX_HERO_LV[level]); }

function makeHero(key, where) {
  const d = HEROES[key];
  const u = newUnit({ side: 'pl', type: d.type, key, name: d.name, full: d.full, red: d.red, mp: d.mp, img: d.img, res: d.res, rapi: d.rapi, dr: d.dr, nofire: d.nofire, bonus: d.bonus,
    hf: d.hf || 1, hr: d.hr || 1, sci: /Cient/.test(d.cls) });
  putUnit(u, where || 'C');
  return u;
}
function makeSpecial(key, where, extra) {
  const d = SPECIALS[key];
  const u = newUnit(Object.assign({ side: ['saqueadores', 'bubba'].includes(key) ? 'raid' : 'pl', type: d.type, key: key === 'saqueadores' || key === 'bubba' ? undefined : undefined, skey: key, name: d.name, full: d.full, red: d.red, mp: d.mp, hf: d.hf || (d.type === 'raider' ? 3 : 1), hr: d.hr || (d.type === 'raider' ? 3 : 1), bonus: d.bonus, bubba: d.bubba, vip: d.vip, dr: d.dr, img: d.img }, extra || {}));
  putUnit(u, where); return u;
}
async function heroEnters(u) {
  EVT('enter', u.id, { name: u.name });
  if (u.key === 'johnson') { G.supplies = Math.min(20, G.supplies + (G.lv.supplies ? 2 : 0)); G.ammo = Math.min(20, G.ammo + 3); LOG('Johnson aporta 3 de Munición' + (G.lv.supplies ? ' y 2 Suministros' : '') + '.', 'good'); }
  if (u.key === 'horacio' && G.lv.supplies) { G.supplies = Math.min(20, G.supplies + 3); LOG('Horacio trae 3 Suministros.', 'good'); }
  if (u.key === 'salvacion' && G.lv.supplies) { G.supplies = Math.min(20, G.supplies + 2); }
  if (u.key === 'clarin') { const k = pickCivh(); if (k) await spawnHero(k, 'C'); }
  UI.updateStats();
}
/* Los Civiles Heroicos de una expansión solo están disponibles si esa expansión está activada. */
const civhAvail = k => !HEROES[k].exp || (G.expSel || []).includes(HEROES[k].exp);
function pickCivh() { const pool = CIVH_POOL.filter(k => civhAvail(k) && !hero(k) && HEROES[k].lv <= MAX_CIVH_LV[G.lv.n] && !G.cemetery.some(u => u.key === k)); return pool.length ? pool[rnd(pool.length)] : null; }
/* Regla de niveles: un Héroe o Civil Heroico solo puede entrar si su color de carta está entre los de la partida (y, si es de expansión, esta está activa). */
function heroAllowed(key) {
  if (!G.lv || G.lv.n === 0) return true;
  return CIVH_POOL.includes(key) ? civhAvail(key) && HEROES[key].lv <= MAX_CIVH_LV[G.lv.n] : heroPoolFor(G.lv.n).includes(key);
}
async function spawnHero(key, where) {
  if (!heroAllowed(key)) { LOG('«' + HEROES[key].name + '» no puede entrar en una partida de este nivel.', 'bad'); return null; }
  const u = makeHero(key, where);
  const isCiv = HEROES[key].type === 'civh' || CIVH_POOL.includes(key);
  await UI.waitAck(isCiv ? '¡Llega un Civil Heroico!' : '¡Llega un Héroe!', '<b>' + HEROES[key].name + '</b> entra en juego en ' + spaceLabel(where) + '.', heroCard(key) || 'assets/cartas/' + (HEROES[key].card || 'h_' + key) + '.jpg', 'h:' + key);
  await heroEnters(u); LOG('Entra en juego: ' + u.name + '.', 'good'); UI.redraw(); return u; }
function randomAvailableHero() {
  const pool = heroPoolFor(G.lv.n).filter(k => !hero(k) && !G.cemetery.some(u => u.key === k));
  return pool.length ? pool[rnd(pool.length)] : null;
}

/* ---------- mazo de Eventos ---------- */
function buildEventDeck(len) {
  const L = G.lv, cols = L.cols;
  const pool = Object.values(EV).filter(e => cols.includes(e.lvl));
  let deck = [];
  for (let a = 1; a <= 4; a++) {
    const spP = shuffle(pool.filter(e => e.act === a && e.sp && !e.guardia)), noP = shuffle(pool.filter(e => e.act === a && !e.sp && !e.fin));
    deck = deck.concat(shuffle(spP.slice(0, len.sp[a - 1]).concat(noP.slice(0, len.no[a - 1]))));
  }
  const fins = pool.filter(e => e.fin); deck.push(fins[rnd(fins.length)]);
  if (L.n >= 2) deck.splice(deck.length - 9, 0, EV.guardia);
  return deck.map(e => e.id);
}
function buildDestinyDeck() {
  return shuffle(Object.keys(DEST).filter(k => G.lv.cols.includes(DEST[k].lvl) && !(G.lv.n === 0 && k === 'alimanas')));
}
function buildResearch(len) {
  const ini = shuffle(Object.keys(RES).filter(k => RES[k].kind === 'ini')).slice(0, len.inv || 3);
  const adv = shuffle(shuffle(Object.keys(RES).filter(k => RES[k].kind === 'adv')).slice(0, 2).concat(Object.keys(RES).filter(k => RES[k].kind === 'spe')));
  return { cur: RES.dcp, deck: ini.concat(adv), disc: [] };
}

/* ---------- preparación ---------- */
function newGame(levelIdx, lenIdx, personal) {
  UID = 1; rngSeed(crypto.getRandomValues(new Uint32Array(1))[0]);
  const L = LEVELS[levelIdx], len = L.lengths[lenIdx];
  Object.assign(G, {
    lv: L, len, units: {}, cemetery: [], reserve: ZED_TOKENS.map(t => t.slice()), supers: L.infection ? Object.keys(SUPER_ZEDS) : [],
    ammo: 4, supplies: 0, inf: 0, chaosLeft: L.chaos || 0, over: null, turnNo: 0, hand: [], destDiscard: [], event: null, eventsRevealed: 0,
    phase: 'setup', pool: { player: 1, event: 0 }, charUsed: {}, once: {}, sel: null, speechUsed: false, antidote: false, berra: false, finalPlaced: false,
    weapon: null, res: null, turn: newTurn(), stats: { killed: 0, civLost: 0, heroLost: 0 }, evlog: [], ust: {}, evn: 0, inWild: false, spareCiv: null, upgrades: [], dangerNext: false
  });
  buildBoard();
  for (const r of G.routes) { const z = makeZed(); putUnit(z, r + '0'); }
  // Civiles
  const civs = shuffle(CIV_TOKENS.map(t => t.slice()));
  const mkciv = (t, where, resist) => { const u = newUnit({ side: 'pl', type: 'civ', name: 'Civiles', full: t[0], red: t[1], mp: 2, hf: 2, hr: 2, resist }); putUnit(u, where); return u; };
  ['B3', 'M2', 'A2', 'F2', 'F4'].forEach((id, i) => { mkciv(civs[i], id, true); if (L.fourR) makeSpecial('aldeanos', id); });
  mkciv(civs[5], 'C', false); G.spareCiv = civs[6];
  // Héroes
  const keys = L.n === 0 ? ['piazza', 'hernandez', 'schmidt', 'hunt'] : (() => {
    const pool = shuffle(heroPoolFor(L.n)); const sel = [];
    if (personal && pool.includes(personal)) sel.push(personal);
    for (const k of pool) { if (sel.length >= 4) break; if (!sel.includes(k)) sel.push(k); }
    return sel;
  })();
  G.heroKeys = keys;
  const civhKey = L.n === 0 ? 'furias' : (() => { const p = CIVH_POOL.filter(k => civhAvail(k) && HEROES[k].lv <= MAX_CIVH_LV[L.n]); return p[rnd(p.length)]; })();
  // recursos
  if (L.n === 0) { G.ammo = 4; G.supplies = 0; } else { const a = d6(), b = d6(); G.supplies = a + b; G.ammo = 6 - Math.min(a, b); G.setupRoll = [a, b]; }
  for (const k of keys) { const u = makeHero(k, 'C'); if (u.key === 'johnson') { G.supplies = Math.min(20, G.supplies + (L.supplies ? 2 : 0)); G.ammo = Math.min(20, G.ammo + 3); } if (u.key === 'horacio' && L.supplies) G.supplies += 3; }
  const ch = makeHero(civhKey, 'C'); if (civhKey === 'salvacion' && L.supplies) G.supplies += 2;
  if (L.tunnel) { makeSpecial('diamante', 'T8'); makeSpecial('diamante', 'T6'); }
  G.eventDeck = buildEventDeck(len); G.totalEvents = G.eventDeck.length;
  G.destDeck = buildDestinyDeck();
  if (L.res) G.res = buildResearch(len);
  G.heroPoolRest = heroPoolFor(L.n).filter(k => !keys.includes(k));
}
function newTurn() { return { noTerrain: false, block: [], propag: false, cardio: false, noEvade: false, specials: [], mercs: false, flamed: false, chaos2: false, smash: false, assaultUsed: false }; }

/* ---------- Destino ---------- */
function chaosCount(r) { return routeUnits(r, () => false).length + (() => { let n = 0; for (let i = 0; i <= lastOf(r); i++) n += sp(r + i).chaos; return n; })(); }
function destRoutes(where) {
  const R = G.routes;
  if (where === 'more' || where === 'less') { const c = R.map(r => [r, routeZeds(r).length]), t = where === 'more' ? Math.max(...c.map(x => x[1])) : Math.min(...c.map(x => x[1])); return c.filter(x => x[1] === t).map(x => x[0]); }
  if (where === 'moreC' || where === 'lessC') { const c = R.map(r => [r, chaosCount(r)]), t = where === 'moreC' ? Math.max(...c.map(x => x[1])) : Math.min(...c.map(x => x[1])); return c.filter(x => x[1] === t).map(x => x[0]); }
  if (where === 'choice') return R.slice();
  if (where === 'T' && !G.routes.includes('T')) return R.filter(r => r !== 'T');
  return [where];
}
async function chooseRoute(c, text) {
  if (c.length === 1) return c[0];
  return UI.choose({ title: 'Elige una ruta', text, options: c.map(r => ({ label: ROUTES[r].name, value: r, color: ROUTES[r].color })) });
}
async function drawDestiny() {
  if (!G.destDeck.length) G.destDeck = shuffle(G.destDiscard.splice(0));
  if (!G.destDeck.length) { LOG('No quedan cartas de Destino.'); return null; }
  const id = G.destDeck.shift(), d = DEST[id];
  const route = await chooseRoute(destRoutes(d.where), 'Carta de Destino «' + d.name + '»: ' + ({ choice: 'a elección del jugador', more: 'empate de rutas con más Zeds', less: 'empate de rutas con menos Zeds', moreC: 'empate de rutas con más Caos', lessC: 'empate de rutas con menos Caos' }[d.where] || 'ruta destinada') + '.');
  LOG('Carta de Destino: «' + d.name + '» → ' + ROUTES[route].name + '.', 'dest');
  return { id, route };
}
const DEST_IMG = { sin_nombre: 'hombre', heroe_d: 'llega_heroe', techo: 'techo_tunel', planes: 'planes_marteuse', cama: 'cama_hospital', heli_noticias: 'helicoptero_noticias', senal: 'senal_rescate', tiradles: 'tiradles_algo', llamamiento: 'llamamiento' };
const destImg = id => 'assets/cartas/d_' + (DEST_IMG[id] || id) + '.jpg';
async function resolveTwist(dr) {
  if (!dr) return; const d = DEST[dr.id];
  if (d.keep) {
    G.hand.push(dr.id); UI.updateHand();
    await UI.waitAck('Destino: ' + d.name, 'Guardar para más tarde — se añade a tu mano.<br>' + d.txt, destImg(dr.id), 'd:' + dr.id);
    return;
  }
  const saved = { q: G.turn.peekQ, on: G.turn.peekOn }; G.turn.peekQ = { zed: [], sup: [] };
  await UI.waitAck('Destino: ' + d.name, '<div class="rulebox"><b>Regla</b><br>' + d.txt + '</div>' + Preview.block(Preview.destiny(dr.id, dr.route)), destImg(dr.id), 'd:' + dr.id);
  G.turn.peekOn = true;
  try { await DEST_FX(dr.id, dr.route); } finally { G.turn.peekQ = saved.q; G.turn.peekOn = saved.on; }
  G.destDiscard.push(dr.id);
}
async function lossChoice(n, opts) { // pierdes n en combinación de opciones: s (Suministros), a (Munición), i (Infección), p (Impactos)
  for (let k = 0; k < n; k++) {
    const options = [];
    if (opts.includes('s') && G.lv.supplies) options.push({ label: '−1 Suministro (' + G.supplies + ')', value: 's' });
    if (opts.includes('a')) options.push({ label: '−1 Munición (' + G.ammo + ')', value: 'a' });
    if (opts.includes('i') && G.lv.infection) options.push({ label: '+1 Infección', value: 'i' });
    if (opts.includes('p')) options.push({ label: '1 Impacto a una unidad', value: 'p' });
    if (!options.length) return;
    const v = await UI.choose({ title: 'Pérdidas (' + (k + 1) + '/' + n + ')', text: 'Elige cómo pagas esta pérdida.', options });
    if (v === 's') G.supplies = Math.max(0, G.supplies - 1); else if (v === 'a') G.ammo = Math.max(0, G.ammo - 1);
    else if (v === 'i') await infUp(1);
    else { const us = allUnits(u => isFighter(u) && u.side === 'pl' && !['CEM'].includes(u.space)); if (us.length) { const w = await UI.pickUnit(us, 'Elige la unidad que sufre 1 Impacto.'); await hitPlayer(G.units[w], 1); } }
    UI.updateStats();
  }
}

/* ---------- efectos de las cartas de Destino «Juega esta carta» ---------- */
async function DEST_FX(id, route) {
  const R = route;
  switch (id) {
    case 'lago': await placeZedAt('M5', 'Zeds surgidos del lago'); break;
    case 'alimanas': { const c = G.routes.map(r => [r, routeZeds(r).length]); const t = Math.max(...c.map(x => x[1])); const r = await chooseRoute(c.filter(x => x[1] === t).map(x => x[0]), 'Alimañas: ruta con más Zeds.'); await placeZedInitial(r, spawnSpreader('alimanas')); break; }
    case 'muertos': await placeZedAt('B3', '¡Los muertos vivientes!'); await placeZedAt('B3', '¡Los muertos vivientes!'); break;
    case 'municion': G.ammo = Math.max(0, G.ammo - 1); G.supplies = Math.max(0, G.supplies - (G.lv.supplies ? 2 : 0)); UI.updateStats(); break;
    case 'inventarios': { const f = r => r <= 2 ? 2 : r <= 5 ? 1 : 0; const [a, b] = await UI.rollSimple('Inventarios amañados', 2, d => 'Suministros −' + f(d[0]) + ' · Munición −' + f(d[1])); G.supplies = Math.max(0, G.supplies - f(a)); G.ammo = Math.max(0, G.ammo - f(b)); LOG('Inventarios amañados: Suministros ' + f(a) + ' / Munición ' + f(b) + '.', 'bad'); UI.updateStats(); break; }
    case 'llamamiento': { for (const r of G.routes) for (let i = 1; i <= lastOf(r); i++) { const s = sp(r + i); if (s.chaos) { const z = makeZed(); if (!z) break; if (z.full < spaceNum(r + i)) await placeZedAt(r + i, 'Llamamiento zombi', z); else returnZed(z); } } break; }
    case 'puente': { const id2 = 'F6'; if (G.spaces[id2]) { sp(id2).bridge = 'down'; LOG('El puente colgante se derrumba.', 'bad'); } break; }
    case 'lluvia': { G.turn.rain = true; for (const z of routeZeds('M')) { const r = await rollShown('Lluvia: Zed en ' + spaceLabel(z.space), v => v <= 2 ? '<b>' + v + '</b>: avanza un espacio' : v === 6 ? '<b>6</b>: retrocede un espacio' : '<b>' + v + '</b>: se queda'); if (r <= 2) { const n = nextToward(z.space); if (n !== 'C' && zedsAt(n).length < 2) { putUnit(z, n); await handleArrival([z], n, z.space); } } else if (r === 6) { const p = prevToward(z.space); if (p) putUnit(z, p); } } break; }
    case 'olvidado': { for (const u of allUnits(x => x.type === 'refugee' && isRouteSp(x.space))) { const p = prevToward(u.space); if (p) { putUnit(u, p); if (zedsAt(p).length) await devourSoft(zedsAt(p), p); } } break; }
    case 'techo': { const n = await rollShown('El techo del Túnel: ¿qué espacio se sepulta?', v => 'Queda sepultado el espacio n.º ' + v + ' del Túnel'); const idx = G.routes.includes('T') ? lastOf('T') - n : null; if (idx === null || idx < 1) break; const id2 = 'T' + idx; G.turn.block.push(id2); for (const u of unitsAt(id2).filter(x => isFighter(x))) { await hitPlayer(u, 1); const tgt = { 6: 'A4', 5: 'F3', 4: 'M3', 3: 'B4' }[n]; if (u.space === id2) { if (tgt && playerRoom(tgt, u)) putUnit(u, tgt); else putUnit(u, nextToward(id2)); } } LOG('El techo del Túnel se derrumba en el espacio n.º ' + n + '.', 'bad'); break; }
    case 'planes': { const dr = await drawDestiny(); if (dr) { for (let i = 1; i <= lastOf(dr.route); i++) if (sp(dr.route + i).chaos && (await rollShown('Planes maníacos: ' + spaceLabel(dr.route + i), v => v <= 3 ? '<b>' + v + '</b>: se coloca un Zed' : '<b>' + v + '</b>: no pasa nada')) <= 3) await placeZedAt(dr.route + i, 'Planes maníacos'); await resolveTwistInner(dr); } for (const r of G.routes) await placeZedInitial(r); break; }
    case 'protestas': await lossChoice(await rollShown('Protestas: pérdidas', v => '<b>' + v + '</b>: pierdes ' + v + ' en cualquier combinación.'), ['s', 'a', 'i', 'p']); break;
    case 'punto_partida': { const v = await rollShown('De vuelta al punto de partida', v => v <= 2 ? '<b>' + v + '</b>: 2 cartas de Investigación Inicial encima del mazo' : v <= 5 ? '<b>' + v + '</b>: 1 carta de Investigación Inicial encima del mazo' : '<b>' + v + '</b>: sin efecto'); const n = v <= 2 ? 2 : v <= 5 ? 1 : 0; if (n) { pushInitialResearch(n); LOG('De vuelta al punto de partida: ' + n + ' carta(s) de Investigación Inicial encima del mazo.', 'good'); } break; }
    case 'candado': { if (G.weapon && G.weapon.parts.length) { const k = G.weapon.parts.splice(rnd(G.weapon.parts.length), 1)[0]; LOG('Pierdes el componente ' + WEAPON_PARTS[k].name + '.', 'bad'); } else if (G.res) pushInitialResearch(1); const c = G.routes.map(r => [r, routeZeds(r).length]); const m = Math.min(...c.map(x => x[1])); const r = await chooseRoute(c.filter(x => x[1] === m).map(x => x[0]), 'Candado oxidado: ruta con menos Zeds.'); await placeZedInitial(r); break; }
    case 'hedor': { const zs = routeZeds(R).filter(z => z.type === 'zed'); if (zs.length) { zs.sort((a, b) => a.space.localeCompare(b.space) || strength(b) - strength(a)); const t = zs.sort((a, b) => sp(a.space).i - sp(b.space).i || strength(b) - strength(a))[0]; t.pest = true; LOG('Pestilentes sobre un Zed en ' + spaceLabel(t.space) + '.', 'bad'); } break; }
    case 'otra_manera': { for (const u of allUnits(x => x.space === 'CAMP')) { const r = await rollShown('Otra manera: ' + u.name, v => v === 1 ? '<b>1</b>: el grupo abandona la partida' : v === 6 ? '<b>6</b>: se cura un Civil' : '<b>' + v + '</b>: sin efecto'); if (r === 1) { removeUnit(u); delete G.units[u.id]; LOG('Un grupo de Refugiados abandona la partida.', 'bad'); } else if (r === 6) { const t = allUnits(x => x.type === 'civ' && (x.hits || x.flipped))[0]; if (t) healUnit(t); } } break; }
    case 'bubba': { const c = G.routes.filter(r => r !== 'T').map(r => [r, routeZeds(r).length]); const m = Math.min(...c.map(x => x[1])); const r = c.filter(x => x[1] === m)[0][0]; makeSpecial('bubba', r + '0'); LOG('La Banda de Bubba aparece en ' + spaceLabel(r + '0') + '.', 'bad'); break; }
    case 'zed_alfa': { const zs = routeZeds(R).filter(z => z.type === 'zed'); if (zs.length) { const t = zs.sort((a, b) => strength(b) - strength(a) || sp(b.space).i - sp(a.space).i)[0]; t.leader = true; LOG('Zed Líder en ' + spaceLabel(t.space) + '.', 'bad'); } await activateRoute(R, false); break; }
    case 'contagio': { await outbreak(true, true); const u = unitsAt('C').filter(isFighter)[0]; if (u && G.lv.infection) { const bed = freeBed(); if (bed) { putUnit(u, bed); u.flipped = true; u.hits = capOf(u) - 1; u.ecg = true; } } break; }
    case 'florecimiento': { const zs = allUnits(isZedSide); if (zs.length) { const m = Math.min(...zs.map(strength)); for (const z of zs.filter(x => strength(x) === m)) { const w = z.space, r = routeOfZ(z); removeUnit(z); delete G.units[z.id]; const nz = makeZed(); if (nz) putUnit(nz, w); } } for (const z of allUnits(isZedSide)) z.hits = 0; break; }
    case 'averia': { if (G.weapon && G.weapon.parts.length) { G.weapon.parts.splice(rnd(G.weapon.parts.length), 1); LOG('Pierdes un componente de la Súper Arma.', 'bad'); } else { const c = G.routes.map(r => [r, routeZeds(r).length]); const m = Math.min(...c.map(x => x[1])); const r = await chooseRoute(c.filter(x => x[1] === m).map(x => x[0]), 'Avería grave: ruta con menos Zeds.'); await activateRoute(r, false); } break; }
  }
}
async function resolveTwistInner(dr) { return resolveTwist(dr); }
function spawnSpreader(k) { const d = SPREADERS[k]; return newUnit({ side: 'zed', type: 'spreader', skey: k, name: d.name, full: d.full, red: d.red, hf: 2, hr: 2, img: d.img }); }
function pushInitialResearch(n) {
  if (!G.res) return; const pool = Object.keys(RES).filter(k => RES[k].kind === 'ini' && !G.res.deck.includes(k) && !G.res.disc.includes(k));
  for (let i = 0; i < n && pool.length; i++) G.res.deck.unshift(pool.splice(rnd(pool.length), 1)[0]);
}

/* ---------- curación ---------- */
function healUnit(u) {
  const before = { flipped: u.flipped, hits: u.hits, ecg: u.ecg };
  let ok = false;
  if (u.ecg) { u.ecg = false; if (u.flipped) u.hits = Math.max(0, capOf(u) - 1); ok = true; }
  else if (u.hits > 0) { u.hits--; ok = true; }
  else if (u.flipped) { u.flipped = false; u.hits = (u.hf || 1) - 1; ok = true; }
  if (ok) u.curedTurn = G.turnNo;
  if (ok && typeof UI !== 'undefined' && UI.fxHeal) UI.fxHeal(u, before);
  return ok;
}
function injured(u) { return u.ecg || u.hits > 0 || u.flipped; }
