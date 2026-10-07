/* Flujo de la partida. */
'use strict';

async function revealEvent() {
  const id = G.eventDeck.shift(); const ev = EV[id];
  G.event = ev; G.eventsRevealed++; G.turnNo++; G.turn = newTurn();
  G.pool = { player: 1, event: ev.acc || 0 }; G.charUsed = {}; G.firstFreeUsed = {};
  $('evimg').src = 'assets/cartas/e_' + id + '.jpg'; $('evimg').dataset.zoom = 'e:' + id;
  UI.log('— Turno ' + G.turnNo + ': «' + ev.name + '» —', 'turn'); UI.updateStats();
}
const FINISH = () => G.over;

async function playGame(setup, saved) {
  let resume = null;
  if (saved) {
    applySave(saved); resume = saved.at;
    ui.setMap(G.lv.board); G.busy = true;
    if (G.event) { $('evimg').src = 'assets/cartas/e_' + G.event.id + '.jpg'; $('evimg').dataset.zoom = 'e:' + G.event.id; }
    UI.updateStats(); UI.updateHand(); UI.redraw();
    UI.log('Partida recuperada — ' + G.lv.name + ' (' + G.len.name + '), turno ' + G.turnNo + '.', 'turn');
  } else {
    newGame(setup.level, setup.len, setup.hero, setup.exps);
    ui.setMap(G.lv.board); G.busy = true; UI.updateStats(); UI.updateHand(); UI.redraw();
    UI.log('Partida preparada — ' + G.lv.name + ' (' + G.len.name + '). Héroes: ' + G.heroKeys.map(k => HEROES[k].name).join(', ') + '.', 'turn');
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
      if (ev.fin && ev.id !== 'fin_b2') { G.over = 'win'; break; }
      G.phase = 'zeds'; UI.updateStats();
      await eventStart(); if (G.over) break;
      await phaseZeds(); if (G.over) break;
      await eventAfterZeds(); UI.release(); if (G.over) break;
      if (ev.fin) { G.over = 'win'; break; }
    } else ev = G.event;
    const resumed = resume === 'actions'; resume = null;
    if (!ev.cer) {
      if (!resumed) await startOfActions();
      G.phase = 'actions'; G.busy = false; UI.updateStats(); UI.updateHand(); UI.redraw();
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
  clearSave(); G.busy = true; G.sel = null; UI.redraw(); await ui.endScreen();
}
window.addEventListener('keydown', e => { if (e.key === 'Escape') ui.cancelMode(); });
const UI_ = ui;
window.addEventListener('load', async () => {
  bindUI(ui); window.UI = ui;
  await ui.init();
  while (true) {
    const a = await ui.titleScreen();
    if (a === 'load') { const saved = loadSave(); if (saved) { ui.musicStop(); ui.hideCover(); playGame(null, saved); return; } continue; }
    if (loadSave() && !(await ui.choose({ title: 'Nueva partida', text: 'Ya hay una partida guardada. Si empiezas otra, la guardada se borrará.', options: [{ label: 'Empezar nueva', value: true }, { label: 'Cancelar', value: false }] }))) continue;
    const setup = await ui.setupScreen();
    if (setup) { ui.musicStop(); ui.hideCover(); clearSave(); playGame(setup); return; }
  }
});
