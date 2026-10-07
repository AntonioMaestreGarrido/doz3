/* Expansiones: 1 «Un paso al frente», 2 «El blues del novato», 3 «Rumores y ferrocarriles». */
'use strict';

/* ---------- datos ---------- */
Object.assign(HEROES, {
  may:    { name: 'Sra. May Hauser', type: 'hero', cls: 'Ciudadana', full: 3, red: 1, mp: 4, img: 'may', card: 'h_may', lv: 1, exp: 1,
    txt: ['<b>Intendente ahorradora:</b> si está en un espacio de Ciudad, por cada Munición que pierdas o gastes tiras 1 dado: con 5-6 no la pierdes.', '<b>La voluntaria de hierro:</b> en una Oficina del Hospital, las unidades dadas de alta en la fase de Acciones obtienen 1 Acción gratis.', '<b>Entrenadora de combate:</b> cada unidad de jugador agrupada con ella (incluso en el Centro) recibe +1 de Fuerza en combate Cuerpo a Cuerpo.', '<b>Pistolera de primera:</b> 1 columna a favor al disparar y tira 1 dado extra (eliges los 2 mejores). Su primer disparo del turno no gasta Munición.'] },
  betty:  { name: 'Betty «Saltarina» Bolívar', type: 'hero', cls: 'Ciudadana', full: 3, red: 2, mp: 4, img: 'betty', card: 'h_betty', lv: 1, exp: 2, nofire: 1, special: 'betty',
    txt: ['<b>Miope:</b> no puede disparar.', '<b>Despiadada:</b> lucha siempre en la columna «Humanos ×3» (cara completa) o «Humanos ×2» (cara reducida), atacando o defendiendo, sin otros modificadores. Los modificadores de cartas especiales, Súper Arma y repetir tiradas sí se aplican. Agrupada con Wilson tira 3 dados.', '<b>Temeraria:</b> cuando gana un combate contra Zeds, si en el siguiente espacio hacia el Centro hay Zeds, entra y ataca de nuevo (sube la Infección como siempre). Solo la detiene ser eliminada o no haber más Zeds. Ignora Caos y el Puente.', '<b>Inmortal:</b> en su tirada de Salvación tira 2 dados y elige el mejor.'] },
  carter: { name: 'Carter «Ruedas Grandes»', type: 'hero', cls: 'Montado', full: 8, red: 4, mp: 5, img: 'carter', card: 'h_carter', lv: 1, exp: 1, nofire: 1, hf: 3, hr: 3, special: 'carter',
    txt: ['<b>El rey de la carretera:</b> solo rutas de la superficie; no dispara, arresta ni usa otros vehículos; no sube la Infección al combatir. No tiene que parar al conducir por el Caos (pero no empieza un movimiento desde él).', '<b>Transportista de Cargamento:</b> entra por un Inicial con la ficha en «Cargado». Al llegar al Centro cargado, el movimiento termina: +5 Suministros y +3 Munición, y se da la vuelta a «Vacío». Recarga en un Inicial con 1 Acción.', '<b>Barrer Zeds:</b> al cruzar un espacio con Zeds (si le quedan puntos): 1 dado, 4-6 inflige 1 Impacto a cada Zed y sigue; si falla se detiene y combate.', '<b>Reparar:</b> solo sufre Impactos su camión (6 en total). En el Centro o un Inicial retira 1 Impacto por turno (1 Suministro o 1 Acción).'] },
  lee:    { name: 'General Lee', type: 'hero', cls: 'Equino', full: 2, red: 1, mp: 6, img: 'lee', card: 'h_lee', lv: 1, exp: 1, nofire: 1, special: 'lee',
    txt: ['<b>Ensillar:</b> puede llevar a un Héroe humano o primate no montado como parte de 1 Acción de Mover (viaje gratis para el jinete). Cuentan como una sola unidad para el agrupamiento.', '<b>Carga de caballería:</b> cualquier Héroe agrupado con Lee suma 1 de Fuerza y no sube la Infección al combatir.', '<b>Purasangre:</b> recibe 1 Acción de Mover gratis por fase de Acciones.', '<b>Instinto equino:</b> no puede entrar voluntariamente en un espacio con Caos ni en el Túnel con jinete. Puede llevar a un herido al Hospital («Galope al Hospital»).', '<b>Un caballo es un caballo:</b> no sube la Infección, no dispara, construye, usa vehículos, restaura ni arresta. Puede elegir retirarse antes de ser atacado.'] },
  jaque:  { name: 'Jaque Mates™', type: 'civh', cls: 'Civiles Heroicos', full: 1, red: 1, mp: 3, img: 'jaque', card: 'h_jaque', lv: 1, exp: 1, hf: 2, hr: 2, special: 'jaque',
    txt: ['<b>Estrategas:</b> al comienzo de cada fase de Acciones tira 1 dado: si es mayor que tus Acciones de Evento, obtienes 1 Acción de Evento más (incluso por encima de 4).', '<b>Ruse de jeu:</b> por cada Refugiados en el Campo de Refugiados su Fuerza aumenta +1 (cara completa) y +½ (cara reducida, redondeando abajo).'] }
});
CIVH_POOL.push('jaque');
const EXP_HEROES = { 1: ['carter', 'lee', 'may'], 2: ['betty'] };

/* Cartas nuevas de Evento y Destino */
function evx(id, name, act, r4, inf, al, z, acc, txt, o) { EV[id] = Object.assign({ id, name, lvl: 'b', act, r4, inf, al, z, acc, txt, sp: 0, exp: 1 }, o || {}); }
evx('fortuna', 'La fortuna favorece a los que se preparan', 1, 1, 'B', 'd', ['A', 'ANY'], 1, ['Al inicio de esta fase: cada Héroe y Civiles Heroicos en un espacio con nombre puede realizar gratis una Acción de Buscar.'], { freeSearch: 1, exp: 2 });
evx('resiste', 'Resiste con más fuerza cuando resistas en soledad', 2, 1, 0, 0, ['A', 'F'], 2, ['(Efecto de Presión Zed: se ignora en solitario.)'], { exp: 2 });
evx('negacion', 'La negación no es un río de Egipto', 1, 0, 'B', 'd', ['B', 'A'], 2, ['Durante esta fase, las unidades de jugador en un espacio adyacente a unidades Zed no pueden realizar Acciones de Mover ni ataques con Arma de Fuego.'], { negation: 1, exp: 2 });
evx('gente', 'Gente, ¡vamos a movernos!', 1, 2, 0, 'd', ['B', 'M'], 4, ['Durante esta fase son gratis todas las Acciones de Mover que se inicien en el Centro de la Ciudad.'], { freeFromC: 1, exp: 2 });
evx('shhh', '¡Shhh! Sé que están ahí fuera…', 2, 1, 0, 'd', ['INIT'], 3, ['Los ataques con Arma de Fuego y Cuerpo a Cuerpo no están permitidos durante esta fase. Las Acciones de Mover no pueden finalizar de manera que una unidad de Jugador acabe en un espacio controlado por Zeds.'], { noFight: 1, exp: 2 });
evx('entusiasma', '¡Esto me entusiasma tanto!', 3, 0, 'B', 1, ['*'], 3, ['Al inicio de esta fase, roba 1 carta de Destino: cada unidad de jugador en la Ruta Destinada (incluyendo el Centro) puede realizar de inmediato una Acción de Mover gratis o un ataque con Arma de Fuego gratis (necesita Munición).'], { order: 1 });
evx('no_hay_tiempo', '¡No hay tiempo para eso!', 2, 0, 'B', 2, ['MIN2'], 3, ['Al inicio de esta fase, gira todas las fichas de Acción de Jugador a su cara de Usada: esas Acciones no están disponibles durante este turno.'], { exp: 2, noPlayerAction: 1 });
evx('panico', 'El pánico es autopreservación', 1, 2, 'B', 1, ['*'], 2, ['Durante esta fase, son gratis todas las Acciones de Mover hacia el Centro de la Ciudad que realicen las unidades que estén adyacentes a alguna unidad Zed.'], { order: 1, panic: 1 });
evx('queda_alguno', '¿Queda alguno?', 5, 0, 'B', 1, ['*'], 0, ['¡Habéis ganado!', '«¿Han cesado? ¿Queda alguno? Espera, ¿quién eres tú?»'], { fin: 1, order: 1 });
function dx(id, name, where, keep, txt, exp) { DEST[id] = { id, name, lvl: 'b', where, keep, txt, exp: exp || 1 }; }
dx('hija', '¡La hija del alcalde ha desaparecido!', 'B', 0, 'Las unidades de jugador en el Centro de la Ciudad no pueden mover durante el resto del turno.');
dx('pensar', 'Pensar fríamente supuso el triunfo', 'F', 1, 'Juega esta carta para cancelar cualquier evento «Juega esta carta» que robes más adelante; O BIEN repite cualquier resultado de 1 dado o de 2 dados en el que haya un 1 (si es doble 1, repite los dos dados).');
dx('discutiendo', '¡Estáis discutiendo por estupideces!', 'A', 0, 'Elige a dos unidades de jugador que estén en el mismo espacio: no pueden realizar (más) Acciones durante este turno.');
dx('urbanistas', '¡Los urbanistas contraatacan!', 'M', 1, 'Juega esta carta para eliminar una unidad Zed cualquiera que esté intentando entrar en un espacio de Ciudad.');
DEST_IMG.excavadora2 = 'excavadora2';

/* Rumores (exp. 3): t = colocar (C) / guardar (G) / unir (U) */
const RUMORS = {
  cementerio: { t: 'C', name: 'Cementerio ancestral', txt: 'Colócalo en cualquier espacio sin nombre (incluidas Criptas): cada unidad Zed que ocupe ese espacio sufre 2 Impactos.' },
  registro:   { t: 'C', name: 'Registro federal de armas', txt: 'Colócalo en el Centro de la Ciudad: los resultados de 1 y 2 en las tiradas de Buscar en espacios de Ciudad o Pueblo te otorgan 1 de Munición.' },
  base:       { t: 'C', name: 'Base aérea secreta', txt: 'Colócala en un espacio n.º 1 de la superficie. Al final de cada fase de Acciones con una unidad tuya allí: 1 Curación gratis, 1 Investigación gratis o 1 Acción de Evento.' },
  tallmart:   { t: 'C', name: 'Centro de distribución de Tall-Mart', txt: 'Colócalo en un espacio sin nombre (no Inicial): pasa a tener nombre. Al final de cada Mantenimiento con una unidad allí: 2 Suministros o 1 Munición.' },
  ferreteria: { t: 'G', name: 'Gran superficie de ferretería', txt: 'Úsala en cualquier momento: +7 Suministros.' },
  ayuda:      { t: 'G', name: '¡Llegó la ayuda!', txt: 'Úsala en la fase de Acciones: coloca un Héroe o Civiles Heroicos disponible en el Centro o en un Inicial.' },
  deposito:   { t: 'G', name: 'Depósito de armas de la policía', txt: 'Úsalo en cualquier momento: +5 Munición.' },
  tesis:      { t: 'G', name: 'Tesis: ¿Qué hemos aprendido?', txt: 'Úsala en cualquier momento: recupera hasta 3 cartas de Destino del descarte («guardar» o no).' },
  muerte:     { t: 'G', name: 'Rumores de nuestra muerte', txt: 'Úsalos en la fase de Acciones: recupera hasta 2 unidades del Cementerio en el Centro con Fuerza reducida.' },
  telefono:   { t: 'G', name: 'El teléfono rojo', txt: 'Úsalo en la fase de Acciones: bombardeo de napalm sobre un espacio de la superficie (no Inicial) y otro adyacente: todo lo que haya se elimina; Caos en cada uno y «No Pasar» en el más lejano del Centro.' },
  plan:       { t: 'G', name: 'Plan de guerra negro', txt: 'Úsalo en la fase de Acciones: +2 Munición y +1 Suministro.' },
  diario:     { t: 'G', name: 'Diario del Dr. Marteuse', txt: 'Úsalo en la fase de Acciones: devuelve 1 Súper Zed en juego a la reserva y revela gratis una carta de Investigación (sin contar como Investigar).' },
  traje:      { t: 'U', name: 'Traje de batalla DARPA', txt: 'La unidad que lo porta inflige 2 Impactos adicionales en sus combates Cuerpo a Cuerpo y es doblemente Resistente.' },
  cristal:    { t: 'U', name: 'Cristal verde radiante', txt: 'La unidad que lo porta recibe 1 Acción gratis cada turno.' },
  medallon:   { t: 'U', name: 'Medallón místico', txt: 'Una vez por turno, cualquier dado (o un dado de una tirada de varios) de esta unidad puede cambiarse a 6.' },
  sirena:     { t: 'U', name: 'Sirena para Zeds', txt: 'La unidad que lo porta puede usar 1 Acción y tirar 2 dados: si el total ≥ Fuerza de un Zed adyacente, retrocede 1 espacio (dobles: desaparece). Se agota tras 2 usos.' }
};

/* ---------- utilidades ---------- */
const expOn = n => G.exp && G.exp.includes(n);
const trainsAt = id => G.spaces[id] ? unitsAt(id).filter(u => u.type === 'train') : [];

/* ---------- preparación ---------- */
const _heroPoolFor = heroPoolFor;
heroPoolFor = function (level) {
  const base = _heroPoolFor(level).filter(k => !HEROES[k].exp);
  const add = []; for (const n of (G && G.expSel || [])) for (const k of (EXP_HEROES[n] || [])) if (HEROES[k].lv <= MAX_HERO_LV[level]) add.push(k);
  return base.concat(add);
};
const _newGame = newGame;
newGame = function (levelIdx, lenIdx, personal, exps) {
  G.expSel = exps || []; G.exp = exps || [];
  _newGame(levelIdx, lenIdx, personal);
  G.rumorPool = []; G.rumorsHeld = [];
  // mazos con las cartas nuevas
  if (expOn(1) || expOn(2)) {
    const add = Object.keys(EV).filter(k => EV[k].exp && (EV[k].exp === 1 && expOn(1) || EV[k].exp === 2 && expOn(2)) && (EV[k].exp !== 2 || true));
    const extraE = Object.keys(EV).filter(k => EV[k].exp && ((EV[k].exp === 1 && expOn(1)) || (EV[k].exp === 2 && expOn(2))));
    if (G.lv.cols.includes('b')) {
      const deck = G.eventDeck.filter(id => !EV[id].fin); const fin = G.eventDeck.filter(id => EV[id].fin);
      const pool = shuffle(extraE.filter(k => !EV[k].fin && !deck.includes(k)));
      for (const k of pool.slice(0, Math.max(1, Math.floor(pool.length / 2)))) deck.push(k);
      const byAct = a => deck.filter(id => EV[id].act === a);
      let out = []; for (let a = 1; a <= 4; a++) out = out.concat(shuffle(byAct(a)));
      const finPool = fin.concat(expOn(1) ? ['queda_alguno'] : []);
      out.push(finPool[rnd(finPool.length)]);
      // mantener la carta de Guardia Nacional si existía
      if (G.lv.n >= 2) out.splice(out.length - 9, 0, 'guardia');
      G.eventDeck = out.filter((v, i, a) => a.indexOf(v) === i); G.totalEvents = G.eventDeck.length;
    }
    if (expOn(1)) { for (const k of ['hija', 'pensar', 'discutiendo', 'urbanistas']) G.destDeck.push(k); shuffle(G.destDeck); }
  }
  if (expOn(1) && G.heroKeys.includes('carter')) { /* Carter entra por un Inicial de superficie */
    const c = hero('carter'); if (c) { const r = SURFACE[rnd(4)]; putUnit(c, r + '0'); c.loaded = true; }
  }
  if (expOn(3) && G.lv.fourR) {
    G.rumorPool = shuffle(Object.keys(RUMORS));
    for (const [k, rt] of [['mercancias', ['B', 'A']], ['local', ['F', 'M']]]) { const u = newUnit({ side: 'pl', type: 'train', name: k === 'mercancias' ? 'Tren de Mercancías' : 'Tren Local', routes: rt, tkey: k, mp: 99, full: 0, red: 0, state: 'leaving' }); putUnit(u, 'C'); }
  }
  if (expOn(3)) G.turn.railPerks = {};
};

/* ---------- Fuerza y agrupamiento ---------- */
const _strength = strength;
strength = function (u) {
  if (u.key === 'jaque') { const n = allUnits(x => x.space === 'CAMP' && (x.type === 'refugee')).length; return u.flipped ? 1 + Math.floor(n / 2) : 1 + n; }
  return _strength(u);
};
const _playerRoom = playerRoom;
playerRoom = function (id, u) {
  const s = sp(id); if (s.kind === 'bed') return !unitsAt(id).length;
  const here = unitsAt(id).filter(x => (isFighter(x) || x.side === 'raid') && x !== u && !x.mount && !(u && u.mount === x.id) && !(u && x.mount === u.id) && x.type !== 'train').length;
  if (s.route === 'T' && s.kind !== 'crypt' && s.i !== lastOf('T')) return here === 0 && !zedsAt(id).length;
  return here < playerCap(id);
};
const _putUnit = putUnit;
putUnit = function (u, id) {
  const from = u.space; _putUnit(u, id);
  if (u.key === 'lee' && u.rider && G.units[u.rider] && id && id !== 'CEM') { const r = G.units[u.rider]; if (r.space !== id) _putUnit(r, id); }
  if (u.mount && G.units[u.mount] && id !== G.units[u.mount].space && !u._sync) { /* el jinete se mueve solo con el caballo */ const l = G.units[u.mount]; l.rider = null; u.mount = null; }
};
const _terrainOf = terrainOf;
terrainOf = function (id) { let t = _terrainOf(id); if (G.turn.noTerrain) return t; return t + trainsAt(id).length; };
const _isFighter = isFighter;
const _meleeInfection = meleeInfection;
meleeInfection = function (zs, h) {
  if (h && (h.key === 'carter' || h.key === 'lee' || h.key === 'horacio')) return 0;
  if (h && h.type === 'hero' && lee_with(h)) return 0;
  return _meleeInfection(zs, h);
};
function lee_with(h) { const l = hero('lee'); return l && l.space && l.space === h.space && l !== h; }

/* ---------- combate: ajustes de las expansiones ---------- */
function meleeStrengthBonus(f, o) {
  let b = 0;
  const may = alive('may'); if (may && f.side === 'pl' && f.space === may.space && f.type !== 'train') b += 1;
  if (f.type === 'hero' && lee_with(f)) b += 1;
  return b;
}
/* Betty: columna fija */
function bettyCol(f) { return f.flipped ? 5 : 6; }

/* ---------- guardado de Munición (May) ---------- */
const _payFire = payFire;
payFire = function (u) {
  const may = alive('may');
  if (u.key === 'may' && !G.firstFreeUsed.may) { G.firstFreeUsed.may = true; return; }
  const before = G.ammo; _payFire(u);
  if (may && may.space && isCity(may.space) && G.ammo < before && !G.turn.mercs) { const r = d6(); if (r >= 5) { G.ammo = before; LOG('May ahorra la Munición (' + r + ').', 'good'); UI.updateStats(); } }
};

/* ---------- Rumores: llegada de Refugiados ---------- */
const _refugeeArrives = refugeeArrives;
refugeeArrives = async function (u) {
  await _refugeeArrives(u);
  if (!expOn(3) || !G.rumorPool.length) return;
  const dr = await drawDestiny(); if (!dr) return;
  const zs = routeZeds(dr.route).filter(z => !isInit(z.space) && !sp(z.space).rumor);
  if (!zs.length) { LOG('Rumor perdido: no hay dónde colocarlo.'); await resolveTwist(dr); return; }
  const by = {}; for (const z of zs) by[z.space] = (by[z.space] || 0) + strength(z);
  const best = Object.keys(by).sort((a, b) => by[b] - by[a] || sp(b).i - sp(a).i)[0];
  const k = G.rumorPool.shift(); sp(best).rumor = k;
  LOG('Un Rumor se coloca boca abajo en ' + spaceLabel(best) + '.', 'dest'); UI.redraw();
  await resolveTwist(dr);
};
async function revealRumor(u, free) {
  const s = sp(u.space), k = s.rumor; if (!k) return; const R = RUMORS[k];
  s.rumor = null; if (!free) spendActions(u, 1);
  await UI.waitAck('Rumor: ' + R.name, R.txt);
  if (R.t === 'U') { u.chips = (u.chips || []).concat(k); LOG(u.name + ' obtiene «' + R.name + '».', 'good'); }
  else if (R.t === 'G') { G.rumorsHeld.push(k); LOG('Guardas el Rumor «' + R.name + '».', 'good'); }
  else if (k === 'cementerio') { const c = Object.values(G.spaces).filter(x => x.route && !x.name && x.i > 0); const t = await UI.pickSpace(c.map(x => x.id), 'Cementerio ancestral: elige un espacio sin nombre.'); sp(t).cem = true; await applyZedHits(zedsAt(t).flatMap(z => [z, z]).filter((z, i) => i < 99), 0); for (const z of zedsAt(t)) await applyZedHits([z], 2); }
  else if (k === 'registro') { sp('C').registro = true; }
  else if (k === 'base') { const c = SURFACE.map(r => r + (lastOf(r) - 1)); const t = await UI.pickSpace(c, 'Base aérea secreta: elige un espacio n.º 1.'); sp(t).base = true; }
  else if (k === 'tallmart') { const c = Object.values(G.spaces).filter(x => x.route && !x.name && x.i > 0 && x.kind !== 'crypt'); if (c.length) { const t = await UI.pickSpace(c.map(x => x.id), 'Tall-Mart: elige un espacio sin nombre.'); sp(t).name = 'Tall-Mart'; sp(t).tall = true; } }
  UI.redraw(); UI.updateStats();
}
function carriedChips(u) { return (u.chips || []); }
async function useRumor(k) {
  const R = RUMORS[k]; const rm = () => { G.rumorsHeld.splice(G.rumorsHeld.indexOf(k), 1); };
  switch (k) {
    case 'ferreteria': G.supplies = Math.min(20, G.supplies + 7); rm(); break;
    case 'deposito': G.ammo = Math.min(20, G.ammo + 5); rm(); break;
    case 'plan': G.ammo = Math.min(20, G.ammo + 2); G.supplies = Math.min(20, G.supplies + 1); G.turn.combineFire = true; LOG('Plan de guerra negro: este turno las unidades agrupadas combinan su Fuerza al disparar.', 'good'); rm(); break;
    case 'tesis': { for (let i = 0; i < 3 && G.destDiscard.length; i++) { const v = await UI.choose({ title: 'Tesis', text: 'Recupera una carta del descarte de Destino:', options: G.destDiscard.map((c, j) => ({ label: DEST[c].name, value: j, keep: DEST[c] && DEST[c].keep })).filter(o => o.keep).map(o => ({ label: o.label, value: o.value })).concat([{ label: 'Terminar', value: -1 }]) }); if (v < 0) break; const c = G.destDiscard.splice(v, 1)[0]; G.destDeck.push(c); shuffle(G.destDeck); } rm(); break; }
    case 'muerte': { for (let i = 0; i < 2; i++) { const cs = G.cemetery.filter(isFighter); if (!cs.length) break; const v = await UI.choose({ title: 'Rumores de nuestra muerte', text: 'Elige una unidad:', options: cs.map(u => ({ label: u.name, value: u.id })) }); const u = G.units[v]; G.cemetery = G.cemetery.filter(x => x !== u); putUnit(u, 'C'); u.flipped = true; u.hits = 0; u.ecg = false; } rm(); break; }
    case 'ayuda': { const pool = heroPoolFor(G.lv.n).concat(CIVH_POOL.filter(x => HEROES[x].lv <= MAX_CIVH_LV[G.lv.n])).filter((x, i, a) => a.indexOf(x) === i && !hero(x) && !G.cemetery.some(c => c.key === x)); const key = !pool.length ? null : pool.length === 1 ? pool[0] : await UI.choose({ title: '¡Llegó la ayuda!', text: 'Elige la unidad que llega.', options: pool.map(x => ({ label: HEROES[x].name, value: x })) }); if (key) { const w = await UI.pickSpace(['C'].concat(G.routes.filter(r => r !== 'T').map(r => r + '0')), '¡Llegó la ayuda!: elige el espacio.'); await spawnHero(key, w); rm(); } break; }
    case 'telefono': { const c = Object.values(G.spaces).filter(s => s.route && s.route !== 'T' && s.i > 0); const a = await UI.pickSpace(c.map(s => s.id), 'Napalm: primer espacio.'); const adj = adjacentIds(a).filter(i => isRouteSp(i) && !isInit(i) && sp(i).route === sp(a).route); const b = adj.length ? await UI.pickSpace(adj, 'Napalm: espacio adyacente (o el mismo).') : a; for (const id of [a, b].filter((v, i, x) => x.indexOf(v) === i)) { for (const u of unitsAt(id).slice()) { if (isZedSide(u)) { if (u.type === 'super') { removeUnit(u); delete G.units[u.id]; } else if (u.type === 'spreader') { removeUnit(u); delete G.units[u.id]; } else discardZed(u); } else if (u.side === 'pl' || u.side === 'raid') { await sendCemetery(u, 'es calcinada'); } } await placeChaos(id, 1); } G.turn.block.push(sp(a).i < sp(b).i ? a : b); rm(); break; }
    case 'diario': { const sup = allUnits(x => x.type === 'super'); if (sup.length) { const v = await UI.pickUnit(sup, 'Elige el Súper Zed que se retira.'); const z = G.units[v]; G.supers.push(z.key); removeUnit(z); delete G.units[z.id]; } if (G.res) await revealResearch(); rm(); break; }
  }
  UI.updateStats(); UI.redraw();
}

/* ---------- Efectos de Rumores en el mapa ---------- */
const _zedsOccupy = zedsOccupy;
zedsOccupy = async function (zs, id) {
  await _zedsOccupy(zs, id);
  if (sp(id).cem) for (const z of zs.filter(x => x.space === id)) await applyZedHits([z], 2);
};

/* ---------- Trenes ---------- */
const TRAIN_STOPS = { F3: ['inf', 'Universidad: −4 Infección'], B4: ['sup', 'Granja: +3 Suministros'], M3: ['ammo', 'Mina: +2 Munición'], A4: ['evt', 'Central nuclear: +2 Acciones de Evento'] };
async function trainDestinations(t) {
  const out = []; const cur = t.space;
  if (t.state === 'leaving') {
    const routes = cur === 'C' ? t.routes : [sp(cur).route];
    for (const r of routes) { let i = cur === 'C' ? 0 : sp(cur).i; const start = cur === 'C' ? lastOf(r) : i; for (let k = cur === 'C' ? lastOf(r) : i - 1; k >= 1; k--) { const id = r + k; if (blocked(id)) break; if (sp(id).chaos && false) break; out.push(id); if (zedsAt(id).length) break; } }
  } else {
    const r = sp(cur).route; for (let k = sp(cur).i + 1; k <= lastOf(r); k++) { const id = r + k; if (blocked(id)) break; out.push(id); if (zedsAt(id).length) break; }
    out.push('C');
  }
  return out.filter(id => !(isInit(id)) || true);
}
async function moveTrain(t, dest) {
  const pass = unitsAt(t.space).filter(x => x.ride === t.id);
  putUnit(t, dest); for (const p of pass) putUnit(p, dest);
  LOG(t.name + ' llega a ' + spaceLabel(dest) + '.', 'good');
  if (dest === 'C') { for (const p of allUnits(x => x.ride === t.id)) p.ride = null; t.state = 'leaving'; if (unitsAt('C').some(x => x.type === 'refugee' && x.ride === t.id)) { /* refugiados al campo */ } }
  else if (t.state === 'leaving' && TRAIN_STOPS[dest]) {
    const [k, txt] = TRAIN_STOPS[dest]; LOG('Parada especial: ' + txt, 'good');
    if (k === 'inf') infDown(4); else if (k === 'sup') G.supplies = Math.min(20, G.supplies + 3); else if (k === 'ammo') G.ammo = Math.min(20, G.ammo + 2); else if (k === 'evt') addEventActions(2);
  }
  for (const p of pass) { if (p.type === 'refugee' && dest === 'C') await refugeeArrives(p); p.ride = null; }
  if (zedsAt(dest).length) { const pl = plAt(dest); if (pl.length) await melee({ zeds: zedsAt(dest), hum: pl, space: dest, attacker: 'h', from: t.space }); }
  UI.redraw(); UI.updateStats();
}
async function doTrainAction(t, id) {
  if (id === 'tmove') {
    const dests = await trainDestinations(t); if (!dests.length) { LOG('El tren no puede ir a ningún sitio.'); return; }
    const cands = unitsAt(t.space).filter(x => (isFighter(x) && !x.mount && x.key !== 'lee' || x.type === 'refugee') && x.type !== 'train');
    let carried = [];
    if (cands.length) { for (let k = 0; k < 2; k++) { const c = cands.filter(x => !carried.includes(x)); if (!c.length) break; const v = await UI.choose({ title: 'Pasajeros', text: 'Sube pasajeros al ' + t.name + ' (máx. 2 unidades o 1 de Refugiados; subir Refugiados cuesta 1 Acción más).', options: c.filter(x => x.type !== 'refugee' || canPay(null, 2)).map(x => ({ label: x.name, value: x.id })).concat([{ label: 'Salir ya', value: '' }]) }); if (!v) break; const x = G.units[v]; if (x.type === 'refugee') { if (carried.length) break; carried.push(x); break; } if (carried.some(y => y.type === 'refugee')) break; carried.push(x); } }
    carried.forEach(x => x.ride = t.id);
    const d = await UI.pickSpace(dests, 'Elige el destino del tren.');
    spendActions(null, 1, 'move'); if (carried.some(x => x.type === 'refugee')) spendActions(null, 1);
    await moveTrain(t, d);
  } else if (id === 'tflip') { spendActions(null, 1); t.state = t.state === 'leaving' ? 'returning' : 'leaving'; LOG(t.name + ' cambia de sentido.'); }
}

/* ---------- Carter ---------- */
function carterReach(u) { /* BFS permitiendo cruzar Zeds */
  const out = {}, best = { [u.space]: { c: 0, path: [] } }, q = [u.space];
  while (q.length) {
    const cur = q.shift();
    for (const n of neighbors(cur)) { const s = sp(n); if (s.route === 'T' || isInit(n) && false || blocked(n) || !['B', 'M', 'A', 'F'].includes(s.route) && n !== 'C') continue; 
      const c = best[cur].c + moveCost(u, n); if (c > u.mp) continue;
      if (!best[n] || c < best[n].c) { best[n] = { c, path: best[cur].path.concat([n]) }; if (!(zedsAt(cur).length && cur !== u.space)) q.push(n); else q.push(n); } }
  }
  for (const id in best) if (id !== u.space) { const s = sp(id); if ((isInit(id) || playerRoom(id, u)) && !blocked(id)) out[id] = best[id]; }
  return out;
}
async function carterMove(u, dest, info) {
  let mp = u.mp, here = u.space;
  for (let i = 0; i < info.path.length; i++) {
    const n = info.path[i]; mp -= moveCost(u, n); const last = n === dest;
    putUnit(u, n); UI.redraw();
    const zs = zedsAt(n);
    if (zs.length) {
      const nextCost = !last ? 1 : 99;
      if (!last && mp >= 1) { const r = d6(); LOG('Barrer Zeds (' + r + ')', r >= 4 ? 'good' : 'bad'); if (r >= 4) { for (const z of zs.slice()) await hitZed(z); continue; } }
      await melee({ zeds: zedsAt(n), hum: [u], space: n, attacker: 'h', from: here, noInf: true }); return;
    }
    here = n;
    if (n === 'C' && u.loaded) { u.loaded = false; G.supplies = Math.min(20, G.supplies + (G.lv.supplies ? 5 : 0)); G.ammo = Math.min(20, G.ammo + 3); LOG('Carter entrega el cargamento: +' + (G.lv.supplies ? '5 Suministros y ' : '') + '3 Munición.', 'good'); UI.updateStats(); return; }
    if (isInit(n)) return;
  }
}

/* ---------- Lee ---------- */
async function leeMount(lee, h) { lee.rider = h.id; h.mount = lee.id; LOG(h.name + ' monta al General Lee.', 'good'); }
function leeDismount(lee) { const r = lee.rider && G.units[lee.rider]; if (r) { r.mount = null; } lee.rider = null; }

/* ---------- Acciones extra en la ficha de unidad ---------- */
const _unitActions = unitActions;
unitActions = function (u) {
  let A = _unitActions(u);
  if (!u || u.side !== 'pl' || G.phase !== 'actions' || G.busy) return A;
  const act = canAct(u), pay = n => canPay(u, n);
  if (u.type === 'train') return [{ id: 'tmove', label: 'Mover tren', ok: pay(1) && !sp(u.space).chaos && !(G.turn.cLock && u.space === 'C') }, { id: 'tflip', label: u.state === 'leaving' ? 'Dar la vuelta (volver)' : 'Dar la vuelta (salir)', ok: pay(1) && u.space !== 'C' && !controlled(u.space) }];
  if (u.key === 'carter') { A = A.filter(a => a.id !== 'move'); A.unshift({ id: 'cmove', label: 'Conducir', ok: act && canPay(u, 1, 'move') && !(G.turn.cLock && u.space === 'C') });
    if (u.space && (isInit(u.space) || u.space === 'C')) { A.push({ id: 'creload', label: 'Recargar cargamento (1 acc.)', ok: isInit(u.space) && !u.loaded && pay(1) }); }
    A.push({ id: 'crepair', label: 'Reparar camión (1 Sum. o 1 acc.)', ok: (u.space === 'C' || isInit(u.space)) && (u.hits > 0 || u.flipped) && !G.charUsed.crepair && (G.supplies >= 1 || pay(1)) }); }
  if (u.key === 'lee') {
    const near = unitsAt(u.space).filter(x => x.type === 'hero' && x.key !== 'lee' && !x.mount && x.key !== 'carter' && x.key !== 'pepinillos' || (x.key === 'horacio' && x.space === u.space && !x.mount));
    A.push({ id: 'lmount', label: 'Montar a un Héroe', ok: !u.rider && near.length > 0 });
    A.push({ id: 'ldis', label: 'Desmontar al jinete', ok: !!u.rider });
    A.push({ id: 'lpura', label: 'Purasangre (1 Mover gratis)', ok: !G.charUsed.pura });
    if (u.rider) A.push({ id: 'lhosp', label: 'Galope al Hospital con el jinete', ok: G.lv.infection && act && canPay(u, 1, 'move') && !(G.turn.cLock && u.space === 'C') });
  }
  if (u.mount) { A = A.filter(a => a.id !== 'move'); }
  if (G.lv.fourR && expOn(3) && trainsAt(u.space).length && isFighter(u) && false) {}
  if (sp(u.space) && sp(u.space).rumor && ['hero', 'civh', 'marine', 'petra'].includes(u.type) && act) A.push({ id: 'rumor', label: 'Revelar Rumor (1 acc.)', ok: !sp(u.space).chaos && pay(1) });
  for (const k of (u.chips || [])) { if (k === 'sirena') A.push({ id: 'sirena', label: 'Sirena para Zeds (1 acc.)', ok: pay(1) && (G.sirenaUses || 0) < 2 && adjacentIds(u.space).some(i => zedsAt(i).length && !isInit(i)) }); }
  if ((u.chips || []).length && unitsAt(u.space).some(x => x !== u && isFighter(x))) A.push({ id: 'chipgive', label: 'Pasar ficha de Rumor (gratis)', ok: true });
  return A;
};
const _runAction = runAction;
runAction = async function (u, id) {
  switch (id) {
    case 'cmove': { const info = carterReach(u); const ids = Object.keys(info); if (!ids.length) { LOG('Carter no puede ir a ningún sitio.'); return; } const d = await UI.pickSpace(ids, 'Carter: elige el destino.'); spendActions(u, 1, 'move'); await carterMove(u, d, info[d]); return; }
    case 'creload': spendActions(u, 1); u.loaded = true; LOG('Carter recoge un nuevo cargamento.', 'good'); return;
    case 'crepair': { let how = G.supplies >= 1 ? 's' : 'a'; if (G.supplies >= 1 && canPay(u, 1)) how = await UI.choose({ title: 'Reparar camión', text: '¿Cómo pagas la reparación?', options: [{ label: '1 Suministro', value: 's' }, { label: '1 Acción', value: 'a' }] }); if (how === 's') G.supplies--; else spendActions(u, 1); G.charUsed.crepair = true; if (u.hits > 0) u.hits--; else if (u.flipped) { u.flipped = false; u.hits = 2; } LOG('Carter repara su camión.', 'good'); UI.updateStats(); return; }
    case 'lmount': { const near = unitsAt(u.space).filter(x => x.type === 'hero' && x.key !== 'lee' && !x.mount && !['carter', 'pepinillos'].includes(x.key)); const v = near.length === 1 ? near[0].id : await UI.pickUnit(near, 'Elige al jinete.'); await leeMount(u, G.units[v]); return; }
    case 'ldis': leeDismount(u); return;
    case 'lpura': G.charUsed.pura = true; u.freeM = (u.freeM || 0) + 1; LOG('Purasangre: el General Lee tiene 1 Acción de Mover gratis.', 'good'); return;
    case 'lhosp': { const r = G.units[u.rider]; const reach = reachable(u); const ok = (u.space === 'C') || reach['C'] !== undefined; if (!ok) { LOG('Lee no llega al Centro con sus puntos de Movimiento.'); return; } const bed = freeBed(); if (!bed) { LOG('No hay Camas libres.'); return; } spendActions(u, 1, 'move'); leeDismount(u); putUnit(u, 'C'); putUnit(r, bed); r.ecg = false; LOG(r.name + ' es llevado al Hospital a galope.', 'good'); return; }
    case 'rumor': await revealRumor(u, false); return;
    case 'chipgive': { const k = u.chips.length === 1 ? u.chips[0] : await UI.choose({ title: 'Pasar ficha', text: '¿Qué ficha pasas?', options: u.chips.map(c => ({ label: RUMORS[c].name, value: c })) }); const mates = unitsAt(u.space).filter(x => x !== u && isFighter(x)); const t = mates.length === 1 ? mates[0] : G.units[await UI.pickUnit(mates, '¿A quién se la pasas?')]; u.chips.splice(u.chips.indexOf(k), 1); t.chips = (t.chips || []).concat(k); LOG(u.name + ' pasa «' + RUMORS[k].name + '» a ' + t.name + '.', 'good'); return; }
    case 'sirena': { spendActions(u, 1); G.sirenaUses = (G.sirenaUses || 0) + 1; const c = adjacentIds(u.space).filter(i => zedsAt(i).length && !isInit(i)); const t = await UI.pickSpace(c, 'Sirena: elige el espacio.'); const zs = zedsAt(t); const v = zs.length === 1 ? zs[0].id : await UI.pickUnit(zs, 'Elige el Zed.'); const z = G.units[v]; const a = d6(), b = d6(); LOG('Sirena: ' + (a + b), 'good'); if (a + b >= strength(z)) { if (a === b) { if (z.type === 'zed') discardZed(z); else { removeUnit(z); delete G.units[z.id]; } LOG('El Zed estalla en combustión espontánea.', 'good'); } else await retreatZeds([z], zedOrigin(z)); } return; }
    case 'tmove': case 'tflip': await doTrainAction(u, id); return;
  }
  return _runAction(u, id);
};
/* Mantenimiento de las expansiones */
const _maintenance = maintenance;
maintenance = async function () {
  await _maintenance();
  for (const s of Object.values(G.spaces)) if (s.tall && unitsAt(s.id).some(x => isFighter(x) && x.type !== 'refugee')) { const v = await UI.choose({ title: 'Tall-Mart', text: 'Elige tu recompensa:', options: [{ label: '2 Suministros', value: 's' }, { label: '1 Munición', value: 'a' }] }); if (v === 's') G.supplies = Math.min(20, G.supplies + 2); else G.ammo = Math.min(20, G.ammo + 1); }
  for (const u of Object.values(G.units)) { delete u._chipDie; u.freeChip = false; }
  UI.updateStats();
};
