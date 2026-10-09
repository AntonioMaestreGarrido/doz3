/* Flujo de la partida. */
'use strict';

async function revealEvent() {
  const id = G.eventDeck.shift(); const ev = EV[id];
  G.event = ev; G.eventsRevealed++; G.turnNo++; G.turn = newTurn();
  if (G.turnNo > 1) Voz.say('turno');
  if (G.eventsRevealed >= G.totalEvents - 2) Voz.say('amanece');
  if (G.ammo <= 1) Voz.say('municion');
  G.pool = { player: 1, event: ev.acc || 0 }; G.charUsed = {}; G.firstFreeUsed = {};
  $('evimg').src = 'assets/cartas/e_' + id + '.jpg'; $('evimg').dataset.zoom = 'e:' + id;
  UI.log('— Turno ' + G.turnNo + ': «' + ev.name + '» —', 'turn'); UI.updateStats();
}
const FINISH = () => G.over;

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
    newGame(setup.level, setup.len, setup.hero, setup.exps); G.saveId = newSaveId();
    ui.setMap(G.lv.board); G.busy = true; UI.updateStats(); UI.updateHand(); UI.redraw(); warmEventCards();
    if (G.setupRoll) { const [a, b] = G.setupRoll; G.setupRoll = null; await UI.waitAck('Suministros y munición iniciales', 'Tirada de 2 dados: <b>' + a + '</b> y <b>' + b + '</b>.<br>Suministros: <b>' + (a + b) + '</b> · Munición: <b>' + (6 - Math.min(a, b)) + '</b>.'); }
    UI.log('Partida preparada — ' + G.lv.name + ' (' + G.len.name + '). Héroes: ' + G.heroKeys.map(k => HEROES[k].name).join(', ') + '.', 'turn');
    Voz.say('inicio');
    await UI.waitAck(G.lv.name, 'Farmingdale está rodeada por ' + G.routes.length + ' rutas por las que avanzan los Zeds. Si <b>un solo Zed</b> entra en el Centro de la Ciudad, pierdes' + (G.lv.fourR ? ' (y también si te quedas sin fichas de Caos)' : '') + '. Sobrevive a las ' + G.totalEvents + ' cartas de Evento y ganarás.<br><br>Pasa el ratón sobre cualquier ficha o carta para ver su texto.');
    saveGame('turn');
  }
  while (!G.over) {
    G.busy = true;
    let ev;
    if (resume !== 'actions') {
      await revealEvent(); ev = G.event;
      UI.redraw();
      await UI.waitAck('Turno ' + G.turnNo + ' — «' + ev.name + '»', ev.txt.join('<br>'), 'assets/cartas/e_' + ev.id + '.jpg', 'e:' + ev.id);
      if (ev.guardia) { G.phase = 'zeds'; await eventStart(); await maintenance(); saveGame('turn'); continue; }
      G.phase = 'fourR'; UI.updateStats(); await phase4R(); if (G.over) break;
      G.phase = 'infection'; UI.updateStats(); await phaseInfection(); if (G.over) break;
      G.phase = 'feeding'; UI.updateStats(); await phaseFeeding(); if (G.over) break;
      if (ev.fin && ev.id !== 'fin_b2') { G.over = 'win'; break; }  /* «Al inicio de esta fase: ¡habéis ganado!» */
      G.phase = 'zeds'; UI.updateStats();
      await eventStart(); if (G.over) break;
      await phaseZeds(); if (G.over) break;
      await eventAfterZeds(); UI.release(); if (G.over) break;
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
    saveGame('turn');
    G.sel = G.sel && G.units[G.sel] ? G.sel : null; UI.updateStats(); UI.redraw();
  }
  deleteSave(G.saveId); G.busy = true; G.sel = null; UI.redraw(); await ui.endScreen();
}
window.addEventListener('keydown', e => { if (e.key === 'Escape') ui.cancelMode(); });
const UI_ = ui;
window.addEventListener('load', async () => {
  bindUI(ui); window.UI = ui;
  await ui.init();
  await ui.intro();
  while (true) {
    const a = await ui.titleScreen();
    if (a === 'load') { const id = await ui.slotsScreen(); const saved = id && loadSave(id); if (saved) { ui.musicStop(); ui.hideCover(); playGame(null, saved); return; } continue; }
    if (listSaves().length >= MAX_SLOTS) { const id = await ui.slotsScreen('full'); if (!id) continue; }
    const setup = await ui.setupScreen();
    if (setup) { ui.musicStop(); ui.hideCover(); playGame(setup); return; }
  }
});
