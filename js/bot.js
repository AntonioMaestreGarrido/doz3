/* Modo de prueba automática: abre index.html?bot=NIVEL,DURACION */
'use strict';
(function () {
  const q = new URLSearchParams(location.search).get('bot'); if (!q) return;
  window.__errs = [];
  window.addEventListener('error', e => __errs.push(e.message + ' @' + e.filename.split('/').pop() + ':' + e.lineno));
  window.addEventListener('unhandledrejection', e => __errs.push('rej ' + (e.reason && e.reason.stack || e.reason)));
  const oe = console.error; console.error = (...a) => { __errs.push(a.map(x => x && x.stack || x).join(' ').slice(0, 500)); oe(...a); };
  const [lv, len, exs] = q.split(','); const EXS = (exs || '').split('').filter(Boolean);
  window.addEventListener('load', () => setTimeout(() => {
    ui.fast = true; if (lv === 'resume') { const c = [...document.querySelectorAll('#modal button')].find(b => /Continuar partida/.test(b.textContent)); if (c) c.click(); } else { document.querySelector('input[name=lv][value="' + lv + '"]').click(); document.getElementById('lenSel').value = '' + (len || 0); EXS.forEach(k => document.getElementById('x' + k).checked = true); document.getElementById('lenSel').dispatchEvent(new Event('change')); document.getElementById('goBtn').click(); }
    window.__auto = setInterval(() => {
      const m = document.getElementById('modal');
      if (!m.hidden) { const bs = [...m.querySelectorAll('button')]; if (document.getElementById('nb')) { clearInterval(__auto); window.__done = true; return; } const pr = bs.find(b => b.id === 'rollb' || b.id === 'ackb') || bs.find(b => b.classList.contains('primary')); const b = pr || bs[Math.floor(Math.random() * bs.length)]; if (b) b.click(); }
      else if (ui.mode && ui.mode.type === 'pick') { const r = ui.mode.resolve, id = ui.mode.ids[Math.floor(Math.random() * ui.mode.ids.length)]; ui.mode = null; r(id); }
      else if (G.phase === 'actions' && !G.busy) {
        const pl = Object.values(G.units).filter(u => u.side === 'pl' && u.space && u.space !== 'CEM');
        for (const u of pl.sort(() => Math.random() - .5)) { const A = unitActions(u).filter(a => a.ok && ['fire', 'search', 'cure', 'build', 'investigate', 'move', 'ini'].includes(a.id)); if (A.length) { const a = A[Math.floor(Math.random() * A.length)]; if (a.id === 'fire') { const t = fireTargets(u), ids = Object.keys(t); ui.guard(async () => { spendActions(u, 1, 'fire'); payFire(u); await doFire(u, ids[0], t[ids[0]]); }); } else if (a.id === 'move') { const o = Object.keys(reachable(u)).filter(k => canPay(u, 1, 'move') || moveIsFree(u, k)); if (o.length) ui.guard(async () => { const d = o[Math.floor(Math.random() * o.length)]; if (!moveIsFree(u, d)) spendActions(u, 1, 'move'); await doMove(u, d); }); else { spendActions(u, 1); } } else ui.guard(() => runAction(u, a.id)); return; } }
        const e = document.getElementById('endBtn'); if (e) e.click();
      }
    }, 30);
  }, 1500));
})();
