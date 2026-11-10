/* Expansión 5 · Jefe final: la Banda de Bubba (versión de prueba).
   Con la expansión activa:
     1. La carta de Destino normal «Banda de Bubba DeNardo» se retira del mazo.
     2. El mazo de Eventos NO lleva carta de Fin. Se le añaden 5 cartas de compensación (events.js, ids boss_*) que se barajan
        como cartas de Nivel IV, y la Guardia Nacional (si sale) se adelanta 5 cartas.
     3. Cuando quedan BOSS_AT cartas por revelar, el arte de Bubba aparece a pantalla completa y suena su canción
        (assets/sonidos/musica/musica_bubba.mp3; si el archivo no existe, la música normal sigue sonando).
     4. Si se acaba el mazo con el jefe vivo, se siguen sacando cartas de Nivel IV (bossOvertime, llamado desde revealEvent).
     5. Bubba es una unidad de Propagador (como Noelle) con 3 Impactos por cara y Fuerza 6/3: comparte espacio con los Zeds
        sin combatir con ellos y no cuenta para el límite de agrupamiento.
     6. Cada turno, tras la fase 4R, se mueve 1 espacio hacia el Centro y arrastra a los Zeds de su espacio con las reglas
        normales de movimiento (límite de agrupamiento, combate, Barricadas…).
   La partida acaba solo cuando Bubba muere (ganas) o llega al Centro (pierdes, como con cualquier Zed).
   Estado: G.boss = { state: 'wait' | 'active' | 'dead', over: nº de cartas extra sacadas tras acabarse el mazo, pile: mazo de Nivel IV }. */
'use strict';
const BOSS_AT = 10;   /* cartas por revelar cuando aparece Bubba («10 cartas antes del final»); súbelo para probar antes */
const BOSS_ART = 'assets/jefe/bubba_arte.webp';
const BOSS_GUARDIA_AT = 14;   /* la Guardia Nacional queda a estas cartas del final (de serie 9, +5 por las cartas extra) */
const BOSS_CARDS = ['boss_heroe', 'boss_cargamento', 'boss_brigada', 'boss_medico', 'boss_adrenalina'];
const bossUnit = () => allUnits(u => u.boss)[0] || null;

extend('newGame', function (_newGame, levelIdx, lenIdx, personal, exps) {
  _newGame(levelIdx, lenIdx, personal, exps);
  if (!expOn(5)) return;
  G.destDeck = G.destDeck.filter(k => k !== 'bubba');
  G.destDiscard = (G.destDiscard || []).filter(k => k !== 'bubba');
  G.boss = { state: 'wait', over: 0, pile: [] };
  /* Mazo de Eventos: sin carta de Fin; las 5 cartas extra se barajan por Actos como las de Nivel IV; la Guardia Nacional sube 5 cartas. */
  const hadGuardia = G.eventDeck.includes('guardia');
  const all = G.eventDeck.filter(id => !EV[id].fin && id !== 'guardia').concat(BOSS_CARDS);
  let out = []; for (let a = 1; a <= 4; a++) out = out.concat(shuffle(all.filter(id => EV[id].act === a)));
  if (hadGuardia && G.lv.n >= 2) out.splice(Math.max(0, out.length - BOSS_GUARDIA_AT), 0, 'guardia');
  G.eventDeck = out; G.totalEvents = out.length;
});

/* Si el jefe desapareció sin pasar por zedDies (p. ej. «Los Zeds hinchados estallan»), cuenta como derrotado. */
async function bossSync() {
  if (!G.boss || G.boss.state !== 'active' || bossUnit()) return;
  await bossDefeated();
}

/* Al empezar el turno: si toca, aparece el jefe (arte, canción y ficha en el Inicial de la ruta de superficie con menos Zeds). */
async function bossCheck() {
  if (!expOn(5) || !G.boss) return;
  await bossSync(); if (G.over) return;
  if (G.boss.state !== 'wait') return;
  if (G.eventDeck.length > Math.min(BOSS_AT, G.totalEvents - 3)) return;
  G.boss.state = 'active';
  const c = G.routes.filter(r => r !== 'T').map(r => [r, routeZeds(r).length]), m = Math.min(...c.map(x => x[1]));
  const cand = c.filter(x => x[1] === m), r = cand[rnd(cand.length)][0];
  UI.bossMusic(true);
  await UI.bossIntro({ img: BOSS_ART, title: '¡La Banda de Bubba!', text: 'Bubba DeNardo y su banda llegan por ' + ROUTES[r].name + ' arrastrando a los Zeds que encuentran. Comparten espacio con ellos sin luchar. No hay carta de Fin: solo ganas si los eliminas, y pierdes si llegan al Centro.' });
  const u = spawnSpreader('bubba');
  await placeZedInitial(r, u);
  LOG('¡Aparece Bubba DeNardo y su banda en ' + spaceLabel(u.space || r + '0') + '!', 'bad');
}

/* Tras la fase 4R: el jefe avanza y arrastra a los Zeds de su espacio con las reglas normales de movimiento. */
async function bossMove() {
  const u = bossUnit(); if (!u || !u.space || !isRouteSp(u.space) || G.over) return;
  const from = u.space, group = zedsAt(from);   /* incluye al propio jefe */
  UI.focus(from, 1.7); UI.redraw(); await UI.settle();
  const others = group.length - 1;
  LOG('Bubba avanza' + (others ? ', arrastrando a ' + others + ' unidad' + (others > 1 ? 'es' : '') + ' Zed' : '') + '.', 'zed');
  const r = await moveGroup(group, from);
  if (!r.moved && !G.over) LOG('Bubba no puede avanzar esta vez.');
}

/* Antes de revelar una carta: con el jefe vivo y el mazo vacío, se saca una carta de Nivel IV al azar (nunca se acaba). */
async function bossOvertime() {
  if (!expOn(5) || !G.boss || G.boss.state !== 'active' || G.eventDeck.length) return;
  await bossSync(); if (G.over || G.boss.state !== 'active') return;
  if (!G.boss.pile.length) {
    const top = G.lv.cols.includes('o') ? 'o' : G.lv.cols[G.lv.cols.length - 1];   /* nivel IV; en niveles menores, su color más alto */
    G.boss.pile = shuffle(Object.values(EV).filter(e => e.lvl === top && !e.fin && !e.guardia && (!e.exp || e.exp === 5)).map(e => e.id));
  }
  G.eventDeck.push(G.boss.pile.pop()); G.totalEvents++; G.boss.over++;
  if (G.boss.over === 1) {
    LOG('Se acaba el mazo, pero la Banda de Bubba sigue en pie: seguirán saliendo cartas de Nivel IV.', 'bad');
    await UI.waitAck('¡Se acaba el mazo!', 'La Banda de Bubba sigue en pie. Seguirán saliendo cartas de <b>Nivel IV</b> hasta que la elimines (ganas) o llegue al Centro (pierdes).');
  }
}

/* El jefe ha muerto (o desaparecido): fin de su música y victoria, porque en la Exp. 5 no hay carta de Fin. */
async function bossDefeated() {
  if (!G.boss || G.boss.state === 'dead') return;
  G.boss.state = 'dead';
  UI.bossMusic(false);
  UI.redraw();
  await UI.announce('¡LA BANDA DE BUBBA HA CAÍDO!', '#ffd54a', 1500, true);
  LOG('¡La Banda de Bubba ha caído! Habéis ganado.', 'good');
  G.over = 'win';
}
