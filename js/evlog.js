/* Registro de eventos de la partida.
   - G.evlog: lista de eventos estructurados (los últimos EV_MAX). Sirve para depurar: exportLog() devuelve el estado y el registro.
   - G.ust: contadores por unidad (no se recortan). Alimentan la crónica de la pantalla final.
   Ambos van dentro de G, así que se guardan con la partida y con Deshacer. */
'use strict';

/* Cada evento guarda la posición del generador aleatorio (r) y, si lo hay, la causa que lo provoca (c): carta, ruta, Brote...
   Con la semilla de la partida (config.seed) y las decisiones del jugador (k: 'pick') se puede rehacer lo ocurrido. */
const EV_MAX = 6000;
let ACTOR = null; // unidad que causa lo que ocurre ahora (disparo o combate); no se guarda
let CAUSA = null; // causa actual (carta de Destino, ruta activada, Brote...); no se guarda

function UST(id) { G.ust = G.ust || {}; return G.ust[id] || (G.ust[id] = {}); }
function ustAdd(id, key, n) { const s = UST(id || '_otros'); s[key] = (s[key] || 0) + (n === undefined ? 1 : n); }

/* Pone una causa mientras dura fn (aunque sea asíncrona). */
async function conCausa(c, fn) { const prev = CAUSA; CAUSA = c; try { return await fn(); } finally { CAUSA = prev; } }

/* k: tipo de evento · a: id de la unidad protagonista · d: datos extra (cortos). */
function EVT(k, a, d) {
  if (typeof G === 'undefined' || !G || !G.units) return;
  G.evn = (G.evn || 0) + 1;
  const e = Object.assign({ n: G.evn, t: G.turnNo || 0, p: G.phase || '', r: typeof RNG_S === 'number' ? RNG_S : null, k }, CAUSA ? { c: CAUSA } : {}, a ? { a } : {}, d || {});
  const l = G.evlog || (G.evlog = []);
  l.push(e); if (l.length > EV_MAX) l.splice(0, l.length - EV_MAX);
  switch (k) {
    case 'kill': ustAdd(a, 'kills'); if (d && d.ty === 'super') ustAdd(a, 'superKills'); break;
    case 'zhit': ustAdd(a, 'dealt'); break;
    case 'hit': ustAdd(a, 'taken'); break;
    case 'move': ustAdd(a, 'moves'); break;
    case 'shot': ustAdd(a, 'shots'); if (d && d.hits) ustAdd(a, 'shotHits'); break;
    case 'melee': ustAdd(a, 'melees'); if (d && d.win) ustAdd(a, 'meleeWins'); break;
    case 'act': ustAdd(a, 'acts'); if (d && d.id) ustAdd(a, 'act_' + d.id); break;
    case 'down': UST(a).diedT = G.turnNo || 0; break;
    case 'enter': UST(a).enterT = G.turnNo || 0; break;
  }
}

/* Estado resumido de las unidades, para depurar. */
function unitsSnapshot() {
  return Object.values(G.units || {}).filter(u => u.side !== 'zed' || u.type === 'super').map(u => ({
    id: u.id, name: u.name, type: u.type, key: u.key || null, side: u.side, space: u.space, full: u.full, red: u.red,
    hits: u.hits, flipped: !!u.flipped, free: u.free || 0
  }));
}

/* Todo lo necesario para reproducir una situación: estado de la partida + registro. Uso: copy(JSON.stringify(exportLog())) en la consola. */
function exportLog() {
  return {
    build: typeof BUILD_TIME !== 'undefined' ? BUILD_TIME : null,
    config: { seed: G.seedUsed != null ? G.seedUsed : null, seedCode: G.seedCode || null, rngInicio: G.rngStart != null ? G.rngStart : null,
      nivel: G.lv && G.lv.name, duracion: G.len && G.len.name, heroes: G.heroKeys || [], expansiones: G.expSel || [],
      jugadores: G.players ? G.players.map(p => p.name) : null, online: !!G.online },
    nivel: G.lv && G.lv.name, duracion: G.len && G.len.name, turno: G.turnNo, fase: G.phase, resultado: G.over || null,
    evento: G.event ? G.event.name : null, stats: G.stats, municion: G.ammo, suministros: G.supplies, infeccion: G.inf,
    unidades: unitsSnapshot(), contadores: G.ust || {}, registro: G.evlog || [],
    investigacion: G.res ? { carta: G.res.cur && G.res.cur.id, mazo: G.res.deck.slice(), descarte: G.res.disc.slice() } : null,
    componentes: G.weapon ? G.weapon.parts.slice() : [],
    mazoEventos: (G.eventDeck || []).slice(), mazoDestino: (G.destDeck || []).slice(), caos: G.chaosLeft
  };
}
/* Envuelve los métodos de la interfaz que deciden o muestran algo para que queden en el registro. */
function EVT_UI(u) {
  const pv = v => (v && typeof v === 'object') ? JSON.stringify(v).slice(0, 120) : v;
  const titulo = (k, args) => k === 'pickUnit' || k === 'pickSpace' ? args[1] : (args[0] && args[0].title) || '';
  for (const k of ['choose', 'chooseCards', 'askZeds', 'pickUnit', 'pickSpace']) {
    const f = u[k]; if (typeof f !== 'function' || f.__evt) continue;
    const w = function (...args) { const t = titulo(k, args); return Promise.resolve(f.apply(u, args)).then(v => { EVT('pick', null, { ui: k, t, v: pv(v) }); return v; }); };
    w.__evt = true; u[k] = w;
  }
  const waitAck = u.waitAck;
  if (typeof waitAck === 'function' && !waitAck.__evt) { const w = function (...args) { EVT('ack', null, { t: args[0] || '' }); return waitAck.apply(u, args); }; w.__evt = true; u.waitAck = w; }
  const log = u.log;
  if (typeof log === 'function' && !log.__evt) { const w = function (msg, cls) { EVT('msg', null, { m: String(msg).replace(/<[^>]+>/g, ''), c: cls || '' }); return log.apply(u, arguments); }; w.__evt = true; u.log = w; }
}
function downloadLog() {
  const blob = new Blob([JSON.stringify(exportLog(), null, 1)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'partida_t' + (G.turnNo || 0) + '_' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '') + '.json';
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
