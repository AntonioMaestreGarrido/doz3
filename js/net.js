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
  /* ---------- Fase 3: decisiones y órdenes sincronizadas ----------
     · Ventanas de decisión (elegir, confirmar, tirar...): se numeran en el mismo orden en todos los dispositivos (n). Decide quien lleva el asiento
       que manda en ese momento; los demás ven la misma ventana en solo lectura («esperando a X») y la cierran con la respuesta recibida.
     · Órdenes en la fase de Acciones (mover, disparar, usar carta, terminar…): las numera el anfitrión y todos las ejecutan en el mismo orden. */
  pn: 0, curN: 0, waitCount: 0, forceSeat: null, ans: {}, res: {}, subs: {}, subH: {}, q: [], waiters: {}, cn: 0, me: 'h',
  _enc(v) { return v === undefined ? { u: 1 } : v; },
  _dec(v) { return v && typeof v === 'object' && v.u === 1 ? undefined : v; },
  reset() { this.pn = 0; this.curN = 0; this.waitCount = 0; this.forceSeat = null; this.ans = {}; this.res = {}; this.subs = {}; this.subH = {}; this.q = []; this.waiters = {}; this.cn = 0; },
  /* Envía a los demás (el anfitrión retransmite lo que le llega de un invitado). */
  _bcast(m) {
    if (this.role === 'host') for (const id in this.conns) this._send(this.conns[id], m);
    else if (this.conns.h) this._send(this.conns.h, m);
  },
  /* Punto de decisión del asiento `seat`. `local` abre la ventana y devuelve una promesa con el valor elegido. */
  decide(seat, kind, local, args) {
    if (!this.online) return local();
    if (this.forceSeat != null) { seat = this.forceSeat; this.forceSeat = null; }
    const n = ++this.pn; this.curN = n;
    if (this.mine(seat)) return local().then(v => { this._bcast({ t: 'ans', n, v: this._enc(v) }); return v; });
    this.waitCount++;
    const lp = local(); if (lp && lp.catch) lp.catch(() => { });
    this._readOnly(seat);
    return new Promise(res => {
      const done = v => { this.waitCount--; delete this.subH[n]; delete this.subs[n]; this._clean(kind, args, lp, () => res(v), v); };
      if (n in this.ans) { const v = this.ans[n]; delete this.ans[n]; setTimeout(() => done(v), 0); } else this.res[n] = done;
    });
  },
  /* La ventana de otro jugador se ve pero no se puede tocar. */
  _readOnly(seat) {
    const who = (G.players[seat] && G.players[seat].name) || 'otro jugador', note = '⏳ Esperando a ' + who + '…';
    if (!$('modal').hidden) { const b = $('modalbox'); b.classList.add('ro'); const d = document.createElement('div'); d.className = 'waitnote'; d.textContent = note; b.appendChild(d); }
    else ui.setBanner(note);
    const sf = document.querySelector('.superfx button'); if (sf) sf.disabled = true;
  },
  _clean(kind, args, lp, fin, v) {
    const b = $('modalbox'); b.classList.remove('ro'); b.querySelectorAll('.waitnote').forEach(x => x.remove());
    switch (kind) {
      case 'choose': case 'chooseCards': case 'waitAck': ui._close(); break;
      case 'askZeds': ui._close(); ui.marks = null; ui.redraw(); break;
      case 'pickUnit': ui._pick = null; ui.hl = null; ui.release(); ui._close(); ui.redraw(); break;
      case 'pickSpace': ui.mode = null; ui.setBanner(null); ui.redraw(); break;
      case '_btn': case '_ask': { const a = $(args[0]); if (a) a.innerHTML = ''; break; }
      case '_rollWait': ui._rollGo = null; break;
      case 'superIntro': { const ok = $('sfxOk'); if (ok) { ok.disabled = false; ok.onclick(); lp.then(fin); return; } break; }
    }
    fin();
  },
  regSub(n, h) { if (!this.online) return; this.subH[n] = h; const q = this.subs[n]; if (q) { delete this.subs[n]; q.forEach(([e, k]) => h(e, k)); } },
  /* Gesto dentro de una ventana (p. ej. jugar una carta antes de tirar): solo lo envía quien decide. */
  sub(n, e, k) { if (!this.online || this.waitCount) return; this._bcast({ t: 'sub', n, e, k }); },
  /* Mensajes de partida (anfitrión e invitados). */
  recv(m, from) {
    if (!m || typeof m !== 'object') return;
    if (m.t === 'ans' || m.t === 'sub') {
      if (this.role === 'host') for (const id in this.conns) if (id !== from) this._send(this.conns[id], m);
      if (m.t === 'ans') { const v = this._dec(m.v); if (this.res[m.n]) { const f = this.res[m.n]; delete this.res[m.n]; f(v); } else this.ans[m.n] = v; }
      else { const h = this.subH[m.n]; if (h) h(m.e, m.k); else (this.subs[m.n] = this.subs[m.n] || []).push([m.e, m.k]); }
    } else if (m.t === 'cmd') {
      if (this.role === 'host') this._seqCmd(m.cmd, from); else { this.q.push(m.cmd); this.kick(); }
    }
  },
  /* Orden del jugador: se ejecuta en todos los dispositivos, en el orden que fija el anfitrión. Devuelve una promesa que se cumple al ejecutarse aquí. */
  cmd(c) {
    if (!this.online) return this.exec(c);
    if (c.seat === undefined) c.seat = G.act;
    c.id = this.me + ':' + (++this.cn);
    const p = new Promise(res => { this.waiters[c.id] = res; });
    if (this.role === 'host') this._seqCmd(c, 'h'); else this._bcast({ t: 'cmd', cmd: c });
    return p;
  },
  _seqCmd(c, from) {
    if (!c || (this.owners && this.owners[c.seat] !== from)) { const w = this.waiters[c && c.id]; if (w) { delete this.waiters[c.id]; w(); } return; }
    for (const id in this.conns) this._send(this.conns[id], { t: 'cmd', cmd: c });
    this.q.push(c); this.kick();
  },
  kick() { if (this._kick) return; this._kick = setTimeout(() => { this._kick = 0; this.pump(); }, 0); },
  async pump() {
    if (this._pumping) return; this._pumping = true;
    try { while (this.q.length && G.phase === 'actions' && !G.busy && !G.over) await this.exec(this.q.shift()); }
    finally { this._pumping = false; }
  },
  async exec(c) {
    try { await this._run(c); } catch (e) { console.error(e); }
    const w = this.waiters[c.id]; if (w) { delete this.waiters[c.id]; w(); }
  },
  async _run(c) {
    if (c.c !== 'act_pl' && this.online && c.seat !== G.act) return;
    const u = c.uid && G.units[c.uid];
    switch (c.c) {
      case 'act_pl': if (!G.busy && c.i >= 0 && c.i < nPlayers()) { G.act = c.i; ui.updateStats(); } return;
      case 'act': if (u) await ui.guard(() => runAction(u, c.id)); return;
      case 'move': if (u) await ui.execMove(u, c.dest); return;
      case 'fire': if (u) await ui.execFire(u, c.dest, c); return;
      case 'hand': await ui.guard(() => useHandCard(c.k)); return;
      case 'rumor': await ui.guard(() => useRumor(c.k)); return;
      case 'sp': { const s = G.turn.specials[c.i]; if (!s) return; G.turn.specials.splice(c.i, 1); await ui.guard(() => s.fn()); return; }
      case 'perm': if (u) await ui.guard(() => ui.askPermission(u)); return;
      case 'end': if (ui._endRes) { const r = ui._endRes; ui._endRes = null; ui.mode = null; ui.setBanner(null); r(); } return;
      case 'undo': await ui.undo(); return;
      case 'tie': if (!G.busy) { await ui._tieBreak(); ui.updateStats(); } return;
      case 'vis': await ui.guard(() => ui._willyVisions()); return;
    }
  },
  /* Empieza la partida online en este dispositivo (se llama justo antes de crear la partida). */
  begin() { this.reset(); this.online = true; DEBUG_DICE = false; },
  /* Envuelve los métodos de decisión de la interfaz: el asiento que decide es el jugador activo (G.act). */
  wrap(u) {
    for (const k of ['choose', 'chooseCards', 'askZeds', 'waitAck', 'pickUnit', 'pickSpace', 'superIntro', '_btn', '_ask', '_rollWait']) {
      const f = u[k]; if (typeof f !== 'function' || f.__net) continue;
      u['_raw_' + k] = f;
      u[k] = function (...a) { return Net.decide(G.act || 0, k, () => f.apply(u, a), a); };
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
        if (!m || typeof m !== 'object') return;
        if (this.started) { this.recv(m, c.peer); return; }
        if (m.t === 'claim' && this.owners[m.seat] === 'h') this.owners[m.seat] = c.peer;
        else if (m.t === 'release' && this.owners[m.seat] === c.peer) this.owners[m.seat] = 'h';
        broadcast();
      });
      const gone = () => { if (this.started && this.online) { try { ui.log('Se perdió la conexión con ' + (this.names[c.peer] || 'un invitado') + '.', 'bad'); } catch (e) { } } if (!this.conns[c.peer]) return; delete this.conns[c.peer]; this.owners = this.owners.map(o => o === c.peer ? 'h' : o); if (!this.started) broadcast(); };
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
          this.seats = this.owners.map((o, i) => o === 'h' ? i : -1).filter(i => i >= 0); this.me = 'h'; this.begin(); res(setup);
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
        c.on('close', () => { if (this.started) { try { ui.log('Se perdió la conexión con el anfitrión.', 'bad'); } catch (e) { } return; } if (this.role === 'guest' && opened) { Net.close(); ui.waitAck('Jugar online', 'Se perdió la conexión con el anfitrión.').then(() => ask('')); } });
        c.on('data', m => {
          if (!m || typeof m !== 'object') return;
          if (this.started) { this.recv(m, 'h'); return; }
          if (m.t === 'full') { clearTimeout(to); fail('La sala ' + code + ' está llena o ya ha empezado.'); return; }
          if (m.t === 'lobby') {
            this.me = m.you;
            ui._modal('<h2>Sala ' + code + '</h2><p>Toma tus asientos y espera a que el anfitrión empiece la partida.</p>' + this._seatsHtml(m.players, m.owners, m.names, m.you, true) + '<div class="opts"><button id="njLeave">Salir</button></div>');
            document.querySelectorAll('#modalbox [data-claim]').forEach(x => x.onclick = () => this._send(c, { t: 'claim', seat: +x.dataset.claim }));
            document.querySelectorAll('#modalbox [data-rel]').forEach(x => x.onclick = () => this._send(c, { t: 'release', seat: +x.dataset.rel }));
            $('njLeave').onclick = () => { Net.close(); ui._close(); res(null); };
          } else if (m.t === 'start') {
            this.started = true; this.seats = m.seats; this.begin(); ui._close(); res(m.setup);
          }
        });
      };
      ask('');
    });
  },
  _send(c, m) { try { c.send(m); } catch (e) { console.warn('Net send', e); } }
};
