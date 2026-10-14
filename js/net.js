/* Multijugador online (lockstep): todos los dispositivos ejecutan el mismo motor con la misma semilla y solo se intercambian decisiones.
   Fase 1: capa de decisiones. Con Net.online = false (partida normal / hot seat) todo pasa tal cual por la interfaz local. */
'use strict';

const Net = {
  online: false,
  /* Asientos (índices de G.players) que controla este dispositivo; null = todos (hot seat). */
  seats: null,
  seq: 0,
  /* ¿Decide este dispositivo por ese asiento? */
  mine(seat) { return !this.online || !this.seats || this.seats.includes(seat); },
  /* Punto de decisión del asiento `seat`: `local` abre la interfaz y devuelve una promesa con el valor elegido.
     Fases siguientes: si el asiento es de otro dispositivo, mostrar «esperando a X» y resolver con el valor recibido;
     si es mío, emitir el valor elegido (con su número de secuencia) al resto. */
  decide(seat, kind, local) {
    if (!this.online || this.mine(seat)) return local();
    return local();
  },
  /* Envuelve los métodos de decisión de la interfaz: el asiento que decide es el jugador activo (G.act). */
  wrap(u) {
    for (const k of ['choose', 'chooseCards', 'askZeds', 'waitAck', 'pickUnit', 'pickSpace']) {
      const f = u[k]; if (typeof f !== 'function' || f.__net) continue;
      u[k] = function (...a) { return Net.decide(G.act || 0, k, () => f.apply(u, a)); };
      u[k].__net = true;
    }
    return u;
  }
};
