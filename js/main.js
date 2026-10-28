/* Flujo de la partida. */
'use strict';

async function revealEvent() {
  const id = G.eventDeck.shift(); const ev = EV[id];
  G.event = ev; G.eventsRevealed++; G.turnNo++; G.turn = newTurn(); EVT('turn', null, { ev: ev.name });
  if (G.turnNo > 1) Voz.say('turno');
  if (G.eventsRevealed >= G.totalEvents - 2) Voz.say('amanece');
  if (G.ammo <= 1) Voz.say('municion');
  G.pool = newPool(ev.acc); G.charUsed = {}; G.firstFreeUsed = {};
  $('evimg').src = evImg(id); $('evimg').dataset.zoom = 'e:' + id;
  UI.log('— Turno ' + G.turnNo + ': «' + ev.name + '» —', 'turn'); UI.updateStats();
}
const FINISH = () => G.over;

/* Zeds en el penúltimo espacio de alguna ruta o junto al Centro: el tema de peligro suena al empezar el siguiente turno. */
/* Pocas fichas de Caos (3 o menos, solo en niveles con Caos): cuenta como peligro y se avisa al empezar el turno. */
const chaosLow = () => !!(G.lv && G.lv.fourR && G.chaosLeft <= 3);
/* Solo información visible en el tablero: los espacios con nombre, sin Caos, a los que un Zed podría entrar en su próximo avance. No mira la carta de Destino. */
function chaosThreats() {
  const ids = new Set();
  for (const z of allUnits(isZedSide)) {
    if (!z.space || !isRouteSp(z.space)) continue;
    const d = nextToward(z.space);
    if (d !== 'C' && isNamed(d) && !sp(d).chaos && !isInit(d) && sp(d).kind !== 'crypt') ids.add(d);
  }
  return [...ids];
}
function chaosWarnText() {
  const n = G.chaosLeft, th = chaosThreats();
  const base = n === 1 ? 'Queda <b>1</b> ficha de Caos. Si hay que colocar otra, perdéis la partida.' : 'Quedan <b>' + n + '</b> fichas de Caos. Si se acaban y hay que colocar otra, perdéis la partida.';
  return base + (th.length ? '<br><br>Si no actuáis, los Zeds que están junto a estos espacios podrían entrar en ellos y colocar Caos: <b>' + th.map(spaceLabel).join(', ') + '</b>.' : '');
}
function enPeligro() { return G.routes.some(rt => { const L = lastOf(rt); return [L, L - 1].some(k => k >= 1 && zedsAt(rt + k).length); }); }

/* Descarga en segundo plano las cartas de Evento del mazo para que queden en la caché de la app. */
async function warmEventCards() {
  for (const id of [...new Set((G.eventDeck || []).concat(G.event ? [G.event.id] : []))]) {
    if (G.over) return;
    try { await fetch(evImg(id)); } catch (e) { /* sin red: se reintenta al mostrarla */ }
    await new Promise(r => setTimeout(r, 150));
  }
}

async function playGame(setup, saved) {
  let resume = null;
  ui.gameMusicOn();
  if (saved) {
    applySave(saved); resume = saved.at;
    await ui.setMap(G.lv.board); G.busy = true;
    if (G.event) { $('evimg').src = evImg(G.event.id); $('evimg').dataset.zoom = 'e:' + G.event.id; }
    UI.updateStats(); UI.updateHand(); UI.redraw(); warmEventCards();
    UI.log('Partida recuperada — ' + G.lv.name + ' (' + G.len.name + '), turno ' + G.turnNo + '.', 'turn');
  } else {
    PENDING_SEED = setup.seed != null ? setup.seed : null; PENDING_PLAYERS = setup.players || null;
    newGame(setup.level, setup.len, setup.hero, setup.exps); G.saveId = newSaveId(); G.seedCode = setup.seedCode || null;
    await ui.setMap(G.lv.board); G.busy = true; UI.updateStats(); UI.updateHand(); UI.redraw(); warmEventCards();
    if (G.setupRoll) { const [a, b] = G.setupRoll; G.setupRoll = null; await UI.waitAck('Suministros y munición iniciales', 'Tirada de 2 dados: <b>' + a + '</b> y <b>' + b + '</b>.<br>Suministros: <b>' + (a + b) + '</b> · Munición: <b>' + (6 - Math.min(a, b)) + '</b>.'); }
    if (G.seedCode) UI.log('Semilla de la partida: ' + G.seedCode, 'turn');
    UI.log('Partida preparada — ' + G.lv.name + ' (' + G.len.name + '). Héroes: ' + G.heroKeys.map(k => HEROES[k].name).join(', ') + '.', 'turn');
    Voz.say('inicio');
    await UI.waitAck(G.lv.name, 'Farmingdale está rodeada por ' + G.routes.length + ' rutas por las que avanzan los Zeds. Si <b>un solo Zed</b> entra en el Centro de la Ciudad, pierdes' + (G.lv.fourR ? ' (y también si te quedas sin fichas de Caos)' : '') + '. Sobrevive a las ' + G.totalEvents + ' cartas de Evento y ganarás.<br><br>Pasa el ratón sobre cualquier ficha o carta para ver su texto.');
    saveGame('turn');
  }
  while (!G.over) {
    G.busy = true;
    ui.turnMusic();
    let ev;
    if (resume !== 'actions') {
      await revealEvent(); ev = G.event;
      UI.redraw();
      await UI.waitAck('Turno ' + G.turnNo + ' — «' + ev.name + '»', '<div class="rulebox"><b>Regla</b><br>' + ev.txt.join('<br>') + '</div>' + Preview.block(Preview.event(ev)), evImg(ev.id), 'e:' + ev.id);
      if (!G.reserve.length) { LOG('No quedan fichas Zed en la reserva.', 'bad'); await UI.waitAck('Sin fichas Zed', 'No quedan fichas Zed en la reserva. Cada nuevo Zed que haya que colocar será un Súper Zed al azar, mientras queden.'); }
      if (chaosLow()) { LOG('Quedan ' + G.chaosLeft + ' fichas de Caos.', 'bad'); await UI.waitAck('Fichas de Caos', chaosWarnText()); await offerHandCards('chaos', chaosWarnText()); }
      if (ev.guardia) { G.phase = 'zeds'; await UI.spawnBatch(() => withPeek(eventStart)); await maintenance(); G.dangerNext = enPeligro(); saveGame('turn'); continue; }
      G.phase = 'fourR'; UI.updateStats(); await UI.spawnBatch(() => withPeek(() => eventAtPhase('4'))); if (G.over) break; await phase4R(); if (G.over) break;
      await UI.spawnBatch(() => pressure('e', '4')); if (G.over) break;
      /* La fase de Infección puede estallar un Brote (y su carta de Destino): las unidades nuevas también vuelan desde la columna. */
      G.phase = 'infection'; UI.updateStats(); await UI.spawnBatch(async () => { await withPeek(() => eventAtPhase('i')); if (G.over) return; await phaseInfection(); if (G.over) return; await withPeek(eventAfterInfection); if (G.over) return; await pressure('e', 'i'); }); if (G.over) break;
      G.phase = 'feeding'; UI.updateStats(); await phaseFeeding(); if (G.over) break;
      G.phase = 'zeds'; UI.updateStats();
      /* Las unidades que aparecen en estas fases salen de una columna y vuelan a su espacio (anim.js spawnBatch). */
      await UI.spawnBatch(() => withPeek(eventStart)); if (G.over) break;
      await freeWindow(); if (G.over) break;
      await UI.spawnBatch(() => pressure('s', 'z')); if (G.over) break;
      await offerHandCards('zeds', 'Hay Refugiados junto a unidades Zed y las rutas están a punto de activarse.'); if (G.over) break;
      await UI.spawnBatch(() => phaseZeds()); if (G.over) break;
      await UI.spawnBatch(() => withPeek(eventAfterZeds)); UI.release(); if (G.over) break;
      await UI.spawnBatch(() => pressure('e', 'z')); if (G.over) break;
      if (ev.fin) { G.over = 'win'; break; }  /* Cartas fin (pestaña en Acciones): se gana al inicio de la fase de Acciones, es decir, tras la fase de Zeds con sus rutas activadas */
    } else ev = G.event;
    const resumed = resume === 'actions'; resume = null;
    if (!ev.cer) {
      if (!resumed) { await UI.spawnBatch(() => withPeek(() => eventAtPhase('a'))); if (G.over) break; await startOfActions(); }
      UI.undoClear(); G.phase = 'actions'; G.busy = false; UI.updateStats(); UI.updateHand(); UI.redraw();
      if (!resumed && alreadyHas('intoxicados')) {
        const cands = []; for (const u of allUnits(x => ['civ', 'civh', 'hero'].includes(x.type) && x.space && isRouteSp(x.space))) for (const i of [u.space].concat(adjacentIds(u.space))) { const zs = zedsAt(i); if (zs.length) cands.push(...zs); }
        if (cands.length) { const z = cands.sort((a, b) => strength(a) - strength(b))[0]; UI.log('Zeds «intoxicados»: 1 Impacto al Zed más débil.', 'good'); await hitZed(z); }
      }
      UI.log(resumed ? 'Fase de Acciones: continúa tu turno.' : 'Fase de Acciones: elige una unidad y actúa.', 'turn');
      saveGame('actions');
      while (true) {
        await new Promise(r => { ui._endRes = r; });
        G.busy = true; ui.mode = null; ui.setBanner(null);
        if (G.over || !(await baseAereaEnd())) break;
        G.busy = false; UI.updateStats(); UI.updateHand(); UI.redraw(); UI.log('Base aérea: tienes 1 Acción de Evento adicional; termina la fase cuando quieras.', 'good');
      }
      if (G.over) break;
      await UI.spawnBatch(() => withPeek(eventEnd)); if (G.over) break;
      await UI.spawnBatch(() => pressure('e', 'a'));
    } else UI.log('¡CEREBROS!: no hay fase de Acciones.', 'bad');
    if (G.over) break;
    G.phase = 'maint'; await maintenance();
    G.dangerNext = enPeligro();
    saveGame('turn');
    G.sel = G.sel && G.units[G.sel] && G.spaces[G.units[G.sel].space] ? G.sel : null; UI.updateStats(); UI.redraw();
  }
  deleteSave(G.saveId); G.busy = true; G.sel = null; UI.redraw(); await ui.endScreen();
}
window.addEventListener('keydown', e => { if (e.key === 'Escape') ui.cancelMode(); });
const UI_ = ui;
/* Un error dentro del flujo dejaría la partida congelada sin aviso (G.busy sigue a true): se informa y se ofrece recargar desde el último guardado. */
function runGame(setup, saved) {
  playGame(setup, saved).catch(async e => {
    console.error(e); ui.log('Error: ' + e.message, 'bad');
    try { await ui.waitAck('Error inesperado', 'La partida se ha detenido por un error (<i>' + e.message + '</i>).<br>Pulsa Continuar para recargarla desde el último guardado.'); } catch (e2) { }
    /* Al recargar se salta la intro y se carga directamente la ranura de esta partida (ver el arranque, abajo). */
    /* Si esta partida ya venía de una recuperación automática y vuelve a fallar, se va al menú (sin bucle de recargas). */
    try { if (G.saveId && sessionStorage.getItem('doz3.resumed') !== G.saveId) sessionStorage.setItem('doz3.resume', G.saveId); sessionStorage.setItem('doz3.skipIntro', '1'); } catch (e3) { }
    location.reload();
  });
}
window.addEventListener('load', async () => {
  EVT_UI(ui); bindUI(ui); window.UI = ui;
  await ui.init();
  await ui.intro();
  /* Vuelta tras un error inesperado: se recupera el último guardado de la partida que falló. */
  let resumeId = null; try { resumeId = sessionStorage.getItem('doz3.resume'); sessionStorage.removeItem('doz3.resume'); sessionStorage.removeItem('doz3.resumed'); } catch (e) { }
  const resumed = resumeId && loadSave(resumeId);
  if (resumed) { try { sessionStorage.setItem('doz3.resumed', resumeId); } catch (e) { } ui.musicStop(); ui.hideCover(); runGame(null, resumed); return; }
  while (true) {
    const a = await ui.titleScreen();
    if (a === 'load') { const id = await ui.slotsScreen(); const saved = id && loadSave(id); if (saved) { ui.musicStop(); ui.hideCover(); runGame(null, saved); return; } continue; }
    if (listSaves().length >= MAX_SLOTS) { const id = await ui.slotsScreen('full'); if (!id) continue; }
    const setup = await ui.setupScreen();
    if (setup) { ui.musicStop(); ui.hideCover(); runGame(setup); return; }
  }
});

/* App instalada (Android): el manifiesto pide pantalla completa, pero una instalación antigua puede conservar el modo «standalone».
   Con el primer toque se entra en pantalla completa real; si se sale (gesto del sistema), se vuelve a entrar al tocar. */
(function () {
  const installed = () => ['standalone', 'minimal-ui', 'fullscreen'].some(m => matchMedia('(display-mode: ' + m + ')').matches) || navigator.standalone === true;
  const el = document.documentElement;
  const enter = () => {
    if (!installed() || document.fullscreenElement || !el.requestFullscreen) return;
    try { const p = el.requestFullscreen({ navigationUI: 'hide' }); if (p && p.catch) p.catch(() => { }); } catch (e) { }
  };
  ['pointerup', 'touchend'].forEach(ev => document.addEventListener(ev, enter, { capture: true, passive: true }));
})();
