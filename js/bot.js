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

  /* ---------- Política «s» (inteligente): puntúa cada acción posible con las tablas de disparo y de combate ---------- */
  const SMART = /s/.test(flags || '');
  const P2 = [0, 0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1].map(x => x / 36); /* P(suma de 2d6) */
  const W_D = [0, 100, 40, 14, 6, 2.5, 1, 1, 1, 1];
  const dist = id => { const s = G.spaces[id]; if (id === 'C') return 0; if (!s || !s.route) return 9; return Math.min(9, lastOf(s.route) + 1 - s.i); };
  const threat = id => { const d = dist(id), zs = zedsAt(id); if (!d || !zs.length) return 0; const st = zs.reduce((a, z) => a + strength(z), 0); return W_D[d] * (1 + st / 12); };
  function expFire(u, d) {
    let str = fireStrength(u, d), sh = 0;
    if (u.armed) sh++; if (u.leader) sh++; if (u.key === 'wright' || u.key === 'may' || u.key === 'samcarter') sh++; if (u.key === 'johnson') sh += 2;
    if (u.type === 'marine' && d > 1) sh--; if (u.key === 'hunt' && d === 2) sh--; if (typeof weaponFor === 'function' && weaponFor(u, 'rifle')) sh++; if (G.turn && G.turn.mercs) sh++;
    const col = clamp(clamp(str, 1, 7) - 1 + sh, 0, 6); let e = 0; for (let t = 2; t <= 12; t++) e += P2[t] * FIRE[sumRow(t)][col]; return e;
  }
  function meleeEval(u, id) {
    const zs = zedsAt(id); if (!zs.length || zs.some(z => z.type !== 'zed')) return null;
    const zStr = zs.reduce((a, z) => a + strength(z), 0), pStr = strength(u) + (typeof meleeStrengthBonus === 'function' ? meleeStrengthBonus(u, { attacking: true }) : 0);
    const col = clamp(ratioCol(zStr, pStr) + humanShifts(u, { attacking: true, vsPlayers: false }).reduce((a, x) => a + x.v, 0), 0, 6);
    let win = 0, zh = 0, ph = 0; for (let t = 2; t <= 12; t++) { const r = sumRow(t), c = CAC[r][col]; if (col >= CAC_HUMAN_LOSES[r]) win += P2[t]; zh += P2[t] * c[0]; ph += P2[t] * c[1]; }
    return { win, zh, ph, zStr, pStr };
  }
  const hurt = u => (u.hits || 0) + (u.flipped ? 2 : 0);
  function unitValue(u) { return 6 + strength(u) * 2 + (u.type === 'hero' ? 6 : 0); }
  /* Zeds más cercanos de una ruta: grupo con el que chocará un defensor del último espacio de la ruta */
  function routeFront(r) { const L = lastOf(r); for (let i = L; i >= 1; i--) { const z = zedsAt(r + i); if (z.length) return { i, d: L + 1 - i, from: r + i, zs: z }; } return null; }
  function routeWeight(r) { const f = routeFront(r); if (!f) return 0; const st = f.zs.reduce((a, z) => a + strength(z), 0); return (f.d <= 4 ? [0, 100, 70, 35, 12][f.d] : 3) * (1 + st / 14); }
  const qDef = (u, id) => { const r = G.spaces[id].route, f = r && routeFront(r); if (!f) return 0.8; const from = f.d === 1 ? f.from : r + (lastOf(r)); return 1 - meleeEvalDef(u, id, f.d === 1 ? f.from : r + (lastOf(r) - 0)); };
  /* Valor de estar en un espacio: puntería sobre los Zeds en alcance (con la Munición disponible) + defensa del último espacio de cada ruta. */
  function stationValue(u, id) {
    let v = 0; const s = G.spaces[id]; if (!s) return 0;
    const saved = u.space; u.space = id; let t; try { t = fireTargets(u); } finally { u.space = saved; }
    for (const k in t) v += threat(k) * expFire(u, t[k]) * (G.ammo >= 2 ? 0.25 : 0.06);
    v += id === 'C' ? 0.5 : s.kind === 'city' ? 2 : s.kind === 'pueblo' || s.kind === 'named' ? 1.2 : 0.3;
    if (s.bar) v += 2; if (s.chaos) v -= 6;
    if (s.route && id !== 'C' && s.i === lastOf(s.route)) { /* último espacio de la ruta: lo que lo defiende evita la derrota */
      const w = routeWeight(s.route), others = plAt(id).filter(x => x !== u).map(x => qDef(x, id)), best = others.length ? Math.max(...others) : 0;
      v += w * Math.max(0, qDef(u, id) - best) * 0.5;
    }
    return v;
  }
  function meleeEvalDef(u, id, from) { /* prob. aproximada de perder si los Zeds de `from` atacan a u en id */
    const zs = zedsAt(from); if (!zs.length) return 0; const zStr = zs.reduce((a, z) => a + strength(z), 0), pStr = strength(u);
    let col = ratioCol(zStr, pStr) + terrainOf(id) + (u.key === 'schmidt' ? 1 : 0); col = clamp(col, 0, 6); let lose = 0; for (let t = 2; t <= 12; t++) { if (col < CAC_HUMAN_LOSES[sumRow(t)]) lose += P2[t]; } return lose;
  }
  function snap() { if (window.__lastSnap === G.turnNo) return; window.__lastSnap = G.turnNo; const rs = G.routes.map(r => { const o = []; for (let i = 0; i <= lastOf(r); i++) { const z = zedsAt(r + i), p = plAt(r + i); if (z.length || p.length) o.push(i + ':' + (z.length ? 'Z' + z.map(strength).join('+') : '') + (p.length ? 'P' + p.map(x => x.name.split(' ')[0] + strength(x)).join(',') : '') + (sp(r + i).bar ? 'B' : '') + (sp(r + i).chaos ? 'X' : '')); } return r + '[' + o.join(' ') + ']'; }); (window.__tr = window.__tr || []).push('== T' + G.turnNo + ' ammo=' + G.ammo + ' C:' + plAt('C').map(x => x.name.split(' ')[0] + strength(x)).join(',') + ' | ' + rs.join(' ')); }
  function smartPick() {
    snap();
    const pl = Object.values(G.units).filter(u => u.side === 'pl' && u.space && u.space !== 'CEM' && isFighter(u)), cands = [];
    for (const u of pl) {
      const A = unitActions(u).filter(a => a.ok);
      for (const a of A) {
        if (a.id === 'fire') {
          const t = fireTargets(u); for (const k in t) { const far = dist(k) >= 4 && G.ammo < 7; const sc = threat(k) * expFire(u, t[k]) - (far ? 9 : G.ammo <= 2 ? 3 : 1); cands.push({ sc, u, a: 'fire', k, d: t[k] }); }
        } else if (a.id === 'move') {
          for (const k of Object.keys(reachable(u))) {
            if (!(canPay(u, 1, 'move') || moveIsFree(u, k))) continue;
            if (zedsAt(k).length) { const m = meleeEval(u, k); if (!m) continue; const tv = threat(k); const sc = tv * (m.zh * 1.1 + m.win * 2.0) - m.ph * unitValue(u) * 0.35 * (1 - m.win * 0.4) - 2; cands.push({ sc, u, a: 'move', k }); }
            else { const sc = (stationValue(u, k) - stationValue(u, u.space)) * 0.6 - 0.4 - (sp(k).kind === 'bed' ? 2 : 0); cands.push({ sc, u, a: 'move', k }); }
          }
        } else if (a.id === 'fab') {
          const t = fireTargets(u); for (const k in t) { const far = dist(k) >= 4; cands.push({ sc: threat(k) * expFire(u, t[k]) - (far ? 9 : 0.8), u, a: 'fab', k, d: t[k] }); }
        } else if (a.id === 'search') {
          const need = Math.max(0, 5 - G.ammo) * 2.2 + (G.lv.supplies ? Math.max(0, 4 - G.supplies) * 1.2 : 0); const calm = Object.keys(fireTargets(u)).length ? 0.35 : 1;
          cands.push({ sc: need * calm * (u.rapi ? 0.9 : 0.5) - 0.5, u, a: 'run', id: 'search' });
        } else if (a.id === 'cure') cands.push({ sc: 12 + hurt(u) * 2, u, a: 'run', id: 'cure' });
        else if (a.id === 'build') { const ts = barTargets(u); const tv = Math.max(0, ...ts.map(id => { let b = 0; for (let n = 1; n <= 3; n++) { const r = sp(id).route, j = sp(id).i - n; if (j >= 1 && zedsAt(r + j).length) b = Math.max(b, W_D[Math.min(9, dist(r + j))] || 1); } return b; })); cands.push({ sc: Math.min(12, tv * 0.25) + (G.supplies > 3 ? 1 : -2), u, a: 'run', id: 'build' }); }
        else if (a.id === 'investigate') cands.push({ sc: 9, u, a: 'run', id: 'investigate' });
        else if (a.id === 'ini') cands.push({ sc: 20, u, a: 'run', id: 'ini' });
        else if (a.id === 'spe') { const inC = pl.filter(x => x.space === 'C' || (G.spaces[x.space] && sp(x.space).kind === 'city')).length; const hot = G.routes.some(r => routeWeight(r) >= 35); cands.push({ sc: inC >= 2 && hot ? 14 : -1, u, a: 'run', id: 'spe' }); }
        else if (a.id === 'lid') cands.push({ sc: 6, u, a: 'run', id: 'lid' });
        else if (a.id === 'cit') { const tg = G.routes.map(r => routeFront(r)).filter(f => f && f.d === 1); cands.push({ sc: tg.length ? 40 : -1, u, a: 'run', id: 'cit' }); }
      }
    }
    const tk = (window.__tried = window.__tried || {}); const kk = c => G.turnNo + ':' + c.u.id + ':' + (c.id || c.a);
    for (const c of cands) if (c.a === 'run' && c.id !== 'search' && (tk[kk(c)] || 0) >= 2) c.sc = -9;
    cands.sort((x, y) => y.sc - x.sc); const b = cands[0]; if (!b || b.sc <= 0.6) return false;
    const u = b.u; if (b.a === 'run') tk[kk(b)] = (tk[kk(b)] || 0) + 1; (window.__tr = window.__tr || []).push('T' + G.turnNo + ' ' + u.name + ' ' + b.a + (b.k || b.id || '') + ' sc=' + b.sc.toFixed(1) + ' ammo=' + G.ammo + ' sup=' + G.supplies + ' pool=' + (G.pool.pl || []).join('') + '/' + G.pool.event);
    if (b.a === 'fire') ui.guard(async () => { spendActions(u, 1, 'fire'); await payFire(u); await doFire(u, b.k, b.d); });
    else if (b.a === 'fab') ui.guard(async () => { spendActions(u, 2, 'fire'); await doFire(u, b.k, b.d); });
    else if (b.a === 'move') ui.guard(async () => { if (!moveIsFree(u, b.k)) spendActions(u, 1, 'move'); await doMove(u, b.k); });
    else ui.guard(() => runAction(u, b.id));
    return true;
  }
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
        if (/n/.test(flags || '')) { const e = document.getElementById('endBtn'); if (e) e.click(); return; }
        if (SMART) { if (smartPick()) return; const e = document.getElementById('endBtn'); if (e) e.click(); return; }
        const pl = Object.values(G.units).filter(u => u.side === 'pl' && u.space && u.space !== 'CEM');
        for (const u of pl.sort(() => Math.random() - .5)) { const mvOk = () => Object.keys(reachable(u)).some(k => canPay(u, 1, 'move') || moveIsFree(u, k)); const A = unitActions(u).filter(a => a.ok && ['fire', 'search', 'cure', 'build', 'investigate', 'move', 'ini'].includes(a.id) && (a.id !== 'move' || mvOk())); if (A.length) { const a = A[Math.floor(Math.random() * A.length)]; if (a.id === 'fire') { const t = fireTargets(u), ids = Object.keys(t); ui.guard(async () => { spendActions(u, 1, 'fire'); await payFire(u); await doFire(u, ids[0], t[ids[0]]); }); } else if (a.id === 'move') { const o = Object.keys(reachable(u)).filter(k => canPay(u, 1, 'move') || moveIsFree(u, k)); if (o.length) ui.guard(async () => { const d = o[Math.floor(Math.random() * o.length)]; if (!moveIsFree(u, d)) spendActions(u, 1, 'move'); await doMove(u, d); }); else { spendActions(u, 1); } } else ui.guard(() => runAction(u, a.id)); return; } }
        const e = document.getElementById('endBtn'); if (e) e.click();
      }
    }, 30);
  }, 1500));
})();
