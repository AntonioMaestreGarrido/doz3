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
  },

  /* ---------- Fase 2: sala, conexión (PeerJS, estrella: invitados → anfitrión) y arranque sincronizado ---------- */
  PREFIX: 'doz3-',
  role: null, peer: null, conns: {}, setup: null, owners: [], names: {},
  newCode() { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let c = ''; for (let i = 0; i < 4; i++) c += A[Math.floor(Math.random() * A.length)]; return c; },
  /* Abre un Peer; con id fijo falla si ya está cogido (unavailable-id). */
  _peer(id) {
    return new Promise((res, rej) => {
      if (typeof Peer === 'undefined') { rej(new Error('No se pudo cargar la librería de conexión.')); return; }
      const p = id ? new Peer(id) : new Peer(); let done = false;
      p.on('open', () => { done = true; res(p); });
      p.on('error', e => { if (!done) { done = true; try { p.destroy(); } catch (x) { } rej(e); } else Net._onError(e); });
      setTimeout(() => { if (!done) { done = true; try { p.destroy(); } catch (x) { } rej(new Error('No hay respuesta del servicio de conexión.')); } }, 12000);
    });
  },
  _onError(e) { console.warn('Net', e); },
  close() { try { if (this.peer) this.peer.destroy(); } catch (e) { } this.peer = null; this.conns = {}; this.role = null; this.online = false; this.seats = null; },
  _esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); },
  /* Lista de asientos con su dueño. `me` = id de este dispositivo; con `claim` los asientos libres (del anfitrión) se pueden tomar. */
  _seatsHtml(players, owners, names, me, claim) {
    return '<div class="plrows">' + players.map((p, i) => {
      const o = owners[i], mine = o === me, who = o === 'h' ? (me === 'h' ? 'Tú (anfitrión)' : 'Anfitrión') : (mine ? 'Tú' : (names[o] || 'Invitado'));
      const btn = claim ? (mine ? '<button data-rel="' + i + '">Soltar</button>' : (o === 'h' ? '<button data-claim="' + i + '">Tomar</button>' : '')) : '';
      return '<div class="row"><span style="color:' + PL_COLORS[i % 4] + '">●</span> <b>' + Net._esc(p.name) + '</b> — ' + Net._esc(who) + ' ' + btn + '</div>';
    }).join('') + '</div>';
  },
  /* Punto de entrada desde la portada: devuelve el setup con el que empezar (ya con Net.online/seats fijados) o null si se cancela. */
  async lobbyFlow() {
    const v = await ui.choose({ title: 'Jugar online', text: 'Hasta 4 jugadores, cada uno en su dispositivo (un dispositivo puede llevar varios jugadores).', options: [{ label: 'Crear sala', value: 'host' }, { label: 'Unirse a una sala', value: 'join' }], cancel: true });
    if (v === 'host') return this._host();
    if (v === 'join') return this._join();
    return null;
  },
  async _host() {
    const setup = await ui.setupScreen(true); if (!setup) return null;
    if (!setup.players || setup.players.length < 2) { await ui.waitAck('Jugar online', 'Elige 2 o más jugadores en «Jugadores» para crear una sala.'); return this._host(); }
    setup.seed = crypto.getRandomValues(new Uint32Array(1))[0]; setup.seedCode = null;
    let peer = null, code;
    for (let k = 0; k < 6 && !peer; k++) { code = this.newCode(); try { peer = await this._peer(this.PREFIX + code); } catch (e) { if (e.type !== 'unavailable-id') { await ui.waitAck('Jugar online', 'No se pudo crear la sala: ' + Net._esc(e.message || e.type || e) + '.<br>Comprueba la conexión a Internet.'); return null; } } }
    if (!peer) { await ui.waitAck('Jugar online', 'No se pudo reservar un código de sala. Inténtalo de nuevo.'); return null; }
    this.close(); this.peer = peer; this.role = 'host'; this.setup = setup; this.conns = {}; this.names = {}; this.owners = setup.players.map(() => 'h');
    let order = 0, render = () => { };
    const broadcast = () => { for (const id in this.conns) this._send(this.conns[id], { t: 'lobby', players: setup.players, owners: this.owners, names: this.names, you: id }); render(); };
    peer.on('connection', c => {
      c.on('open', () => {
        if (this.started || Object.keys(this.conns).length >= setup.players.length - 1) { try { c.send({ t: 'full' }); } catch (e) { } setTimeout(() => c.close(), 300); return; }
        this.conns[c.peer] = c; this.names[c.peer] = 'Invitado ' + (++order); broadcast();
      });
      c.on('data', m => {
        if (!m || typeof m !== 'object' || this.started) return;
        if (m.t === 'claim' && this.owners[m.seat] === 'h') this.owners[m.seat] = c.peer;
        else if (m.t === 'release' && this.owners[m.seat] === c.peer) this.owners[m.seat] = 'h';
        broadcast();
      });
      const gone = () => { if (!this.conns[c.peer]) return; delete this.conns[c.peer]; this.owners = this.owners.map(o => o === c.peer ? 'h' : o); if (!this.started) broadcast(); };
      c.on('close', gone); c.on('error', gone);
    });
    peer.on('error', e => this._onError(e));
    return new Promise(res => {
      const link = location.origin + location.pathname + '#sala=' + code;
      render = () => {
        const n = Object.keys(this.conns).length;
        const b = ui._modal('<h2>Sala ' + code + '</h2><p>Dile a los demás que elijan «Jugar online → Unirse a una sala» y escriban <b style="font-size:22px;letter-spacing:3px">' + code + '</b>, o que abran este enlace:<br><small>' + Net._esc(link) + '</small></p>' +
          this._seatsHtml(setup.players, this.owners, this.names, 'h', false) +
          '<p>' + (n ? n + (n === 1 ? ' invitado conectado.' : ' invitados conectados.') : 'Esperando invitados…') + ' Los asientos que nadie tome los juegas tú.</p>' +
          '<div class="opts"><button class="primary" id="nbStart"' + (n ? '' : ' disabled') + '>Empezar la partida</button><button id="nbCopy">Copiar enlace</button><button id="nbCancel">Cancelar</button></div>');
        $('nbCopy').onclick = () => { try { navigator.clipboard.writeText(link); } catch (e) { } };
        $('nbCancel').onclick = () => { ui._close(); Net.close(); res(null); };
        $('nbStart').onclick = () => {
          this.started = true; ui._close();
          for (const id in this.conns) this._send(this.conns[id], { t: 'start', setup, seats: this.owners.map((o, i) => o === id ? i : -1).filter(i => i >= 0) });
          this.seats = this.owners.map((o, i) => o === 'h' ? i : -1).filter(i => i >= 0); this.online = true; res(setup);
        };
      };
      render();
    });
  },
  _join() {
    return new Promise(res => {
      const ask = (msg) => {
        const b = ui._modal('<h2>Unirse a una sala</h2><p>Escribe el código de sala (4 caracteres).</p>' + (msg ? '<p style="color:#ff8a7a">' + Net._esc(msg) + '</p>' : '') + '<input id="njCode" maxlength="4" size="6" style="font-size:22px;letter-spacing:3px;text-transform:uppercase" autocomplete="off"><div class="opts"><button class="primary" id="njGo">Conectar</button><button id="njBack">Volver</button></div>');
        const m = /sala=([A-Za-z0-9]{4})/.exec(location.hash); if (m) $('njCode').value = m[1].toUpperCase();
        $('njBack').onclick = () => { ui._close(); res(null); };
        $('njGo').onclick = () => go($('njCode').value.trim().toUpperCase());
        $('njCode').focus();
      };
      const go = async code => {
        if (code.length !== 4) { ask('El código tiene 4 caracteres.'); return; }
        ui._modal('<h2>Conectando…</h2><p>Sala ' + Net._esc(code) + '</p>');
        this.close(); let peer;
        try { peer = await this._peer(); } catch (e) { ask('No se pudo conectar con el servicio: ' + (e.message || e.type)); return; }
        this.peer = peer; this.role = 'guest'; this.started = false;
        const c = peer.connect(this.PREFIX + code, { reliable: true }); this.conns = { h: c }; let opened = false;
        const fail = msg => { Net.close(); ask(msg); };
        const to = setTimeout(() => { if (!opened) fail('La sala ' + code + ' no responde. Revisa el código.'); }, 12000);
        c.on('open', () => { opened = true; clearTimeout(to); });
        c.on('error', () => { if (!opened) { clearTimeout(to); fail('No se pudo conectar con la sala ' + code + '.'); } });
        peer.on('error', e => { if (!opened && e.type === 'peer-unavailable') { clearTimeout(to); fail('No existe la sala ' + code + '.'); } });
        c.on('close', () => { if (this.started) return; if (this.role === 'guest' && opened) { Net.close(); ui.waitAck('Jugar online', 'Se perdió la conexión con el anfitrión.').then(() => ask('')); } });
        c.on('data', m => {
          if (!m || typeof m !== 'object') return;
          if (m.t === 'full') { clearTimeout(to); fail('La sala ' + code + ' está llena o ya ha empezado.'); return; }
          if (m.t === 'lobby') {
            ui._modal('<h2>Sala ' + code + '</h2><p>Toma tus asientos y espera a que el anfitrión empiece la partida.</p>' + this._seatsHtml(m.players, m.owners, m.names, m.you, true) + '<div class="opts"><button id="njLeave">Salir</button></div>');
            document.querySelectorAll('#modalbox [data-claim]').forEach(x => x.onclick = () => this._send(c, { t: 'claim', seat: +x.dataset.claim }));
            document.querySelectorAll('#modalbox [data-rel]').forEach(x => x.onclick = () => this._send(c, { t: 'release', seat: +x.dataset.rel }));
            $('njLeave').onclick = () => { Net.close(); ui._close(); res(null); };
          } else if (m.t === 'start') {
            this.started = true; this.seats = m.seats; this.online = true; ui._close(); res(m.setup);
          }
        });
      };
      ask('');
    });
  },
  _send(c, m) { try { c.send(m); } catch (e) { console.warn('Net send', e); } }
};
