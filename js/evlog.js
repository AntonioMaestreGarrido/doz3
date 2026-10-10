/* Registro de eventos de la partida.
   - G.evlog: lista de eventos estructurados (los últimos EV_MAX). Sirve para depurar: exportLog() devuelve el estado y el registro.
   - G.ust: contadores por unidad (no se recortan). Alimentan la crónica de la pantalla final.
   Ambos van dentro de G, así que se guardan con la partida y con Deshacer. */
'use strict';

const EV_MAX = 1200;
let ACTOR = null; // unidad que causa lo que ocurre ahora (disparo o combate); no se guarda

function UST(id) { G.ust = G.ust || {}; return G.ust[id] || (G.ust[id] = {}); }
function ustAdd(id, key, n) { const s = UST(id || '_otros'); s[key] = (s[key] || 0) + (n === undefined ? 1 : n); }

/* k: tipo de evento · a: id de la unidad protagonista · d: datos extra (cortos). */
function EVT(k, a, d) {
  if (typeof G === 'undefined' || !G || !G.units) return;
  G.evn = (G.evn || 0) + 1;
  const e = Object.assign({ n: G.evn, t: G.turnNo || 0, p: G.phase || '', k }, a ? { a } : {}, d || {});
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
    nivel: G.lv && G.lv.name, duracion: G.len && G.len.name, turno: G.turnNo, fase: G.phase, resultado: G.over || null,
    evento: G.event ? G.event.name : null, stats: G.stats, municion: G.ammo, suministros: G.supplies, infeccion: G.inf,
    unidades: unitsSnapshot(), contadores: G.ust || {}, registro: G.evlog || []
  };
}
function downloadLog() {
  const blob = new Blob([JSON.stringify(exportLog(), null, 1)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'partida_t' + (G.turnNo || 0) + '_' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '') + '.json';
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
