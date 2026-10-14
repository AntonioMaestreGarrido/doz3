/* Flujo de la partida. */
'use strict';

async function revealEvent() {
  const id = G.eventDeck.shift(); const ev = EV[id];
  G.event = ev; G.eventsRevealed++; G.turnNo++; G.turn = newTurn(); EVT('turn', null, { ev: ev.name });
  if (G.turnNo > 1) Voz.say('turno');
  if (G.eventsRevealed >= G.totalEvents - 2) Voz.say('amanece');
  if (G.ammo <= 1) Voz.say('municion');
  G.pool = newPool(ev.acc); G.charUsed = {}; G.firstFreeUsed = {};
  $('evimg').src = 'assets/cartas/e_' + id + '.jpg'; $('evimg').dataset.zoom = 'e:' + id;
  UI.log('— Turno ' + G.turnNo + ': «' + ev.name + '» —', 'turn'); UI.updateStats();
}
const FINISH = () => G.over;

/* Zeds en el penúltimo espacio de alguna ruta o junto al Centro: el tema de peligro suena al empezar el siguiente turno. */
/* Pocas fichas de Caos (3 o menos, solo en niveles con Caos): cuenta como peligro y se avisa al empezar el turno. */
const chaosLow = () => !!(G.lv && G.lv.fourR && G.chaosLeft <= 3);
function chaosWarnText() {
  const n = G.chaosLeft;
  return n === 1 ? 'Queda <b>1</b> ficha de Caos. Si hay que colocar otra, perdéis la partida.' : 'Quedan <b>' + n + '</b> fichas de Caos. Si se acaban y hay que colocar otra, perdéis la partida.';
}
function enPeligro() { return G.routes.some(rt => { const L = lastOf(rt); return [L, L - 1].some(k => k >= 1 && zedsAt(rt + k).length); }); }

/* Descarga en segundo plano las cartas de Evento del mazo para que queden en la caché de la app. */
async function warmEventCards() {
  for (const id of [...new Set((G.eventDeck || []).concat(G.event ? [G.event.id] : []))]) {
    if (G.over) return;
    try { await fetch('assets/cartas/e_' + id + '.jpg'); } catch (e) { /* sin red: se reintenta al mostrarla */ }
    await new Promise(r => setTimeout(r, 150));
  }
}

async function playGame(setup, saved) {
  let resume = null;
  ui.gameMusicOn();
  if (saved) {
    applySave(saved); resume = saved.at;
    ui.setMap(G.lv.board); G.busy = true;
    if (G.event) { $('evimg').src = 'assets/cartas/e_' + G.event.id + '.jpg'; $('evimg').dataset.zoom = 'e:' + G.event.id; }
    UI.updateStats(); UI.updateHand(); UI.redraw(); warmEventCards();
    UI.log('Partida recuperada — ' + G.lv.name + ' (' + G.len.name + '), turno ' + G.turnNo + '.', 'turn');
  } else {
    PENDING_SEED = setup.seed != null ? setup.seed : null; PENDING_PLAYERS = setup.players || null;
    newGame(setup.level, setup.len, setup.hero, setup.exps); G.saveId = newSaveId(); G.seedCode = setup.seedCode || null;
    ui.setMap(G.lv.board); G.busy = true; UI.updateStats(); UI.updateHand(); UI.redraw(); warmEventCards();
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
      await UI.waitAck('Turno ' + G.turnNo + ' — «' + ev.name + '»', '<div class="rulebox"><b>Regla</b><br>' + ev.txt.join('<br>') + '</div>' + Preview.block(Preview.event(ev)), 'assets/cartas/e_' + ev.id + '.jpg', 'e:' + ev.id);
      if (chaosLow()) { LOG('Quedan ' + G.chaosLeft + ' fichas de Caos.', 'bad'); await UI.waitAck('Fichas de Caos', chaosWarnText()); }
      if (ev.guardia) { G.phase = 'zeds'; await withPeek(eventStart); await maintenance(); G.dangerNext = enPeligro(); saveGame('turn'); continue; }
      G.phase = 'fourR'; UI.updateStats(); await phase4R(); if (G.over) break;
      G.phase = 'infection'; UI.updateStats(); await phaseInfection(); if (G.over) break;
      G.phase = 'feeding'; UI.updateStats(); await phaseFeeding(); if (G.over) break;
      if (ev.fin && ev.id !== 'fin_b2') { G.over = 'win'; break; }  /* «Al inicio de esta fase: ¡habéis ganado!» */
      G.phase = 'zeds'; UI.updateStats();
      await withPeek(eventStart); if (G.over) break;
      await pressure('s'); if (G.over) break;
      await phaseZeds(); if (G.over) break;
      await withPeek(eventAfterZeds); UI.release(); if (G.over) break;
      await pressure('e'); if (G.over) break;
      if (ev.fin) { G.over = 'win'; break; }  /* fin_b2: al inicio de la fase de Acciones, si seguís vivos */
    } else ev = G.event;
    const resumed = resume === 'actions'; resume = null;
    if (!ev.cer) {
      if (!resumed) await startOfActions();
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
      await eventEnd();
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
    location.reload();
  });
}
window.addEventListener('load', async () => {
  Net.wrap(ui); bindUI(ui); window.UI = ui;
  await ui.init();
  await ui.intro();
  while (true) {
    const a = await ui.titleScreen();
    if (a === 'online') { const s = await Net.lobbyFlow(); if (s) { ui.musicStop(); ui.hideCover(); runGame(s); return; } continue; }
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
