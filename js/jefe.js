/* Expansión 5 · Jefe final: la Banda de Bubba (versión de prueba).
   Con la expansión activa:
     1. La carta de Destino normal «Banda de Bubba DeNardo» se retira del mazo.
     2. Cuando quedan BOSS_AT cartas de Evento por revelar, el arte de Bubba aparece a pantalla completa y suena su canción
        (assets/sonidos/musica/musica_bubba.mp3; si el archivo no existe, la música normal sigue sonando).
     3. Bubba es una unidad de Propagador (como Noelle) con 3 Impactos por cara y Fuerza 6/3: comparte espacio con los Zeds
        sin combatir con ellos y no cuenta para el límite de agrupamiento.
     4. Cada turno, tras la fase 4R, se mueve 1 espacio hacia el Centro y arrastra a los Zeds de su espacio con las reglas
        normales de movimiento (límite de agrupamiento, combate, Barricadas…). Si llega al Centro, pierdes.
   Estado de la partida: G.boss = { state: 'wait' | 'active' | 'dead' }. */
'use strict';
const BOSS_AT = 9;   /* cartas de Evento que quedan al aparecer (como la Guardia Nacional); súbelo para probar antes */
const BOSS_ART = 'assets/jefe/bubba_arte.webp';   /* recorte de la carta (cabecera e ilustración, sin el texto de habilidades) */
const bossUnit = () => allUnits(u => u.boss)[0] || null;

const _newGameBoss = newGame;
newGame = function (levelIdx, lenIdx, personal, exps) {
  _newGameBoss(levelIdx, lenIdx, personal, exps);
  if (!expOn(5)) return;
  G.destDeck = G.destDeck.filter(k => k !== 'bubba');
  G.destDiscard = (G.destDiscard || []).filter(k => k !== 'bubba');
  G.boss = { state: 'wait' };
};

/* Al empezar el turno: si toca, aparece el jefe (arte, canción y ficha en el Inicial de la ruta de superficie con menos Zeds). */
async function bossCheck() {
  if (!expOn(5) || !G.boss || G.boss.state !== 'wait') return;
  if (G.eventDeck.length > Math.min(BOSS_AT, G.totalEvents - 3)) return;
  G.boss.state = 'active';
  const c = G.routes.filter(r => r !== 'T').map(r => [r, routeZeds(r).length]), m = Math.min(...c.map(x => x[1]));
  const cand = c.filter(x => x[1] === m), r = cand[rnd(cand.length)][0];
  UI.bossMusic(true);
  await UI.bossIntro({ img: BOSS_ART, title: '¡La Banda de Bubba!', text: 'Bubba DeNardo y su banda llegan por ' + ROUTES[r].name + ' arrastrando a los Zeds que encuentran. Comparten espacio con ellos sin luchar. Si llegan al Centro, pierdes.' });
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

async function bossDefeated() {
  if (G.boss) G.boss.state = 'dead';
  UI.bossMusic(false);
  UI.redraw();
  await UI.announce('¡LA BANDA DE BUBBA HA CAÍDO!', '#ffd54a', 1500, true);
}
