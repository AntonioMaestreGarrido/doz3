/* Modo de prueba automática: abre index.html?bot=NIVEL,DURACION */
'use strict';
(function () {
  const q = new URLSearchParams(location.search).get('bot'); if (!q) return;
  window.__errs = [];
  window.addEventListener('error', e => __errs.push(e.message + ' @' + e.filename.split('/').pop() + ':' + e.lineno));
  window.addEventListener('unhandledrejection', e => __errs.push('rej ' + (e.reason && e.reason.stack || e.reason)));
  const oe = console.error; console.error = (...a) => { __errs.push(a.map(x => x && x.stack || x).join(' ').slice(0, 500)); oe(...a); };
  /* ?bot=NIVEL,DURACION,EXPANSIONES,JUGADORES,FLAGS (p. ej. 5,0,1234,2,lm; l = encadenar partidas guardando el resultado en localStorage doz3.botlog, m = barajar el mazo de Eventos, i = invencible: ignora las derrotas) o ?bot=resume. Se salta la intro y entra por la portada. */
  const [lv, len, exs, np, flags] = q.split(','); const LOOP = /l/.test(flags || ''), MIX = /m/.test(flags || ''), INV = /i/.test(flags || '');
  /* INV (invencible): se ignoran las derrotas para que la partida llegue a la última carta; los Zeds que entran en el Centro se retiran del mapa. */
  if (INV) { let over = null; Object.defineProperty(G, 'over', { configurable: true, enumerable: true, get: () => over, set: v => { if (v === 'lose') { window.__lost = (window.__lost || 0) + 1; if (G.spaces && G.spaces.C) for (const z of zedsAt('C')) { if (z.type === 'zed') discardZed(z); else { removeUnit(z); delete G.units[z.id]; } } return; } over = v; } }); } const EXS = (exs || '').split('').filter(Boolean);
  try { sessionStorage.setItem('doz3.skipIntro', '1'); } catch (e) { }
  window.addEventListener('load', () => setTimeout(() => {
    ui.fast = true; ['music', 'sfx', 'voice'].forEach(k => Sound[k].on = false); Sound.apply(); /* sin guardar: no toca los ajustes del jugador */
    const tb = a => document.querySelector('#title [data-a="' + a + '"]');
    if (lv === 'resume') { const c = tb('load'); if (c) c.click(); setTimeout(() => { const l = document.querySelector('#modal [data-load]'); if (l) l.click(); }, 300); }
    else { tb('new').click(); window.confirm = () => true; /* sin diálogos bloqueantes en modo prueba */ const go = () => { const del = document.querySelector('#modal [data-del]'); if (del && !document.getElementById('goBtn')) { del.click(); return setTimeout(go, 100); } if (!document.getElementById('goBtn')) return setTimeout(go, 100); document.querySelector('input[name=lv][value="' + lv + '"]').click(); EXS.forEach(k => { const x = document.getElementById('x' + k); x.checked = true; x.dispatchEvent(new Event('change')); }); document.getElementById('lenSel').value = '' + (len || 0); if (np) { const n = document.getElementById('nPl'); n.value = np; n.dispatchEvent(new Event('change')); } document.getElementById('goBtn').click(); }; go(); }
    window.__auto = setInterval(() => {
      if (!G.lv) return;
      /* MIX: baraja el mazo de Eventos (menos la carta final) para que salgan cartas de todos los actos desde el principio. */
      if (MIX && !window.__mixed && G.eventDeck && G.eventDeck.length > 2) { window.__mixed = true; const fin = G.eventDeck.pop(); G.eventDeck.sort(() => Math.random() - .5); G.eventDeck.push(fin); }
      const sfx = document.getElementById('sfxOk'); if (sfx && !sfx.closest('[hidden]')) { sfx.click(); return; }
      const rv = document.getElementById('revbar'); if (rv) return;
      const m = document.getElementById('modal');
      if (!m.hidden) { const opt = [...m.querySelectorAll('.pickopts button, .cardpick .cpc')]; if (opt.length && !m.querySelector('.pickopts button.on, .cardpick .cpc.on')) { opt[Math.floor(Math.random() * opt.length)].click(); return; } const bs = [...m.querySelectorAll('button')].filter(b => !b.disabled && !b.hidden); if (document.getElementById('nb')) { clearInterval(__auto); window.__done = true; if (LOOP) { try { const l = JSON.parse(localStorage.getItem('doz3.botlog') || '[]'); l.push({ q, t: G.turnNo, over: G.over, lost: window.__lost || 0, why: G.loseWhy || null, evs: G.eventsRevealed, errs: __errs.slice(0, 5) }); localStorage.setItem('doz3.botlog', JSON.stringify(l.slice(-200))); } catch (e) { } location.reload(); } return; } const pr = bs.find(b => b.id === 'rollb' || b.id === 'ackb') || bs.find(b => b.classList.contains('primary')); const b = pr || bs[Math.floor(Math.random() * bs.length)]; if (b) b.click(); }
      else if (ui.mode && ui.mode.type === 'pick') { const r = ui.mode.resolve, id = ui.mode.ids[Math.floor(Math.random() * ui.mode.ids.length)]; ui.mode = null; r(id); }
      else if (G.phase === 'actions' && !G.busy) {
        const pl = Object.values(G.units).filter(u => u.side === 'pl' && u.space && u.space !== 'CEM');
        for (const u of pl.sort(() => Math.random() - .5)) { const mvOk = () => Object.keys(reachable(u)).some(k => canPay(u, 1, 'move') || moveIsFree(u, k)); const A = unitActions(u).filter(a => a.ok && ['fire', 'search', 'cure', 'build', 'investigate', 'move', 'ini'].includes(a.id) && (a.id !== 'move' || mvOk())); if (A.length) { const a = A[Math.floor(Math.random() * A.length)]; if (a.id === 'fire') { const t = fireTargets(u), ids = Object.keys(t); ui.guard(async () => { spendActions(u, 1, 'fire'); await payFire(u); await doFire(u, ids[0], t[ids[0]]); }); } else if (a.id === 'move') { const o = Object.keys(reachable(u)).filter(k => canPay(u, 1, 'move') || moveIsFree(u, k)); if (o.length) ui.guard(async () => { const d = o[Math.floor(Math.random() * o.length)]; if (!moveIsFree(u, d)) spendActions(u, 1, 'move'); await doMove(u, d); }); else { spendActions(u, 1); } } else ui.guard(() => runAction(u, a.id)); return; } }
        const e = document.getElementById('endBtn'); if (e) e.click();
      }
    }, 30);
  }, 1500));
})();
