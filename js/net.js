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
  pn: 0, curN: 0, waitCount: 0, forceSeat: null, ans: {}, res: {}, subs: {}, subH: {}, q: [], waiters: {}, cn: 0, me: 'h', hostTok: 'h', ses: '', epoch: '', joinSave: null,
  _enc(v) { return v === undefined ? { u: 1 } : v; },
  _dec(v) { return v && typeof v === 'object' && v.u === 1 ? undefined : v; },
  reset() { this.pn = 0; this.curN = 0; this.waitCount = 0; this.forceSeat = null; this.ans = {}; this.res = {}; this.subs = {}; this.subH = {}; this.q = []; this.waiters = {}; this.cn = 0; this.log = []; this.hi = 0; this.lastK = {}; this.lastI = 0; this.gk = 0; this.outbox = []; },
  /* Envía a los demás (el anfitrión retransmite lo que le llega de un invitado). */
  _bcast(m) { if (this.role === 'host') this._hsend(null, m, this.me); else this._gsend(m); },
  /* Anfitrión → invitados, con número de secuencia y guardado en el registro para repetirlo a quien se reconecte.
     to = un invitado concreto (null = todos menos origin). */
  _hsend(to, m, origin) {
    const mm = Object.assign({}, m, { i: ++this.hi }); this.log.push({ i: this.hi, to, origin, m: mm });
    if (to) { const c = this.conns[to]; if (c) this._send(c, mm); }
    else for (const id in this.conns) if (id !== origin) this._send(this.conns[id], mm);
  },
  /* Invitado → anfitrión: numerado y guardado hasta que el anfitrión confirme haberlo recibido (por si la conexión se cae). */
  _gsend(m) { const mm = Object.assign({}, m, { g: ++this.gk }); this.outbox.push(mm); if (this.conns.h && this.conns.h.open) this._send(this.conns.h, mm); },
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
    if (this.role === 'host') { if (m.g !== undefined) { if (m.g <= (this.lastK[from] || 0)) return; this.lastK[from] = m.g; } }
    else if (m.i !== undefined) { if (m.i <= this.lastI) return; this.lastI = m.i; }
    if (m.t === 'ans' || m.t === 'sub') {
      if (this.role === 'host') { const r = Object.assign({}, m); delete r.g; this._hsend(null, r, from); }
      if (m.t === 'ans') { const v = this._dec(m.v); if (this.res[m.n]) { const f = this.res[m.n]; delete this.res[m.n]; f(v); } else this.ans[m.n] = v; }
      else { const h = this.subH[m.n]; if (h) h(m.e, m.k); else (this.subs[m.n] = this.subs[m.n] || []).push([m.e, m.k]); }
    } else if (m.t === 'hash') {
      if (this.role === 'host' && this.cpDone[m.turn]) this._hsend(from, { t: 'verdict', turn: m.turn, ok: 1 });
      else if (this.role === 'host') { const rec = this.cp[m.turn] = this.cp[m.turn] || {}; rec[from] = m.h; if (this._cpFin) this._cpFin(); }
    } else if (m.t === 'verdict') {
      if (this.cpV[m.turn]) this.cpV[m.turn](m);
    } else if (m.t === 'cmd') {
      if (this.role === 'host') this._seqCmd(m.cmd, from); else { this.q.push(m.cmd); this.kick(); }
    }
  },
  /* Orden del jugador: se ejecuta en todos los dispositivos, en el orden que fija el anfitrión. Devuelve una promesa que se cumple al ejecutarse aquí. */
  cmd(c) {
    if (!this.online) return this.exec(c);
    if (c.seat === undefined) c.seat = G.act;
    c.cid = this.me + ':' + this.ses + ':' + (++this.cn);
    const p = new Promise(res => { this.waiters[c.cid] = res; });
    if (this.role === 'host') this._seqCmd(c, this.me); else this._bcast({ t: 'cmd', cmd: c });
    return p;
  },
  _seqCmd(c, from) {
    if (!c || (this.owners && this.owners[c.seat] !== from)) { const w = this.waiters[c && c.cid]; if (w) { delete this.waiters[c.cid]; w(); } return; }
    this._hsend(null, { t: 'cmd', cmd: c }, null);
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
    const w = this.waiters[c.cid]; if (w) { delete this.waiters[c.cid]; w(); }
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
      case 'undo': if (!this.online) await ui.undo(); return;
      case 'tie': if (!G.busy) { await ui._tieBreak(); ui.updateStats(); } return;
      case 'vis': await ui.guard(() => ui._willyVisions()); return;
    }
  },
  /* ---------- Fase 4a: comprobación del estado al final de cada turno ----------
     Cada dispositivo envía un resumen del estado al anfitrión; si el de algún invitado no coincide con el suyo, el anfitrión le manda el estado
     completo y ese dispositivo lo carga. Es una barrera: nadie sigue hasta recibir el veredicto (con tiempo máximo por si alguien se cuelga). */
  cp: {}, cpV: {}, cpDone: {}, away: {},
  stateJson() { const s = snapshotState(); delete s.sel; delete s.busy; delete s.saveId; s.rng = rngState(); s.uid = UID; return JSON.stringify(s); },
  /* Resumen corto (cyrb53). */
  hash(str) {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  },
  async checkpoint() {
    if (!this.online) return;
    const turn = G.turnNo, h = this.hash(this.stateJson());
    if (this.role === 'host') {
      const rec = this.cp[turn] = this.cp[turn] || {};
      rec.me = h;
      await new Promise(res => {
        const ready = () => Object.keys(this.conns).every(id => rec[id] !== undefined);
        let to = null;
        const fin = () => { clearTimeout(to); this._cpFin = null; res(); };
        this._cpFin = () => { if (ready()) fin(); };
        to = setTimeout(fin, 30000);
        this._cpFin();
      });
      const snap = () => ({ G: snapshotState(), uid: UID, rng: rngState() });
      let cache = null;
      for (const id in this.conns) {
        if (rec[id] === undefined) continue;
        if (rec[id] === h) this._hsend(id, { t: 'verdict', turn, ok: 1 });
        else { cache = cache || JSON.parse(JSON.stringify(snap())); try { ui.log('Resincronizando a ' + (this.names[id] || 'un invitado') + ' (el estado no coincidía).', 'bad'); } catch (e) { } this._hsend(id, { t: 'verdict', turn, snap: cache }); }
      }
      delete this.cp[turn]; this.cpDone[turn] = true;
      return;
    }
    const v = await new Promise(res => {
      const to = setTimeout(() => { delete this.cpV[turn]; res(null); }, 45000);
      this.cpV[turn] = m => { clearTimeout(to); res(m); };
      this._bcast({ t: 'hash', turn, h });
    });
    delete this.cpV[turn];
    if (v && v.snap) {
      const busy = G.busy, id = G.saveId;
      applySave({ G: v.snap.G, uid: v.snap.uid, rng: v.snap.rng, dbg: false }); G.busy = busy; G.sel = null; G.saveId = id; G.online = true;
      try { ui.log('El estado de tu partida se ha corregido con el del anfitrión.', 'bad'); ui.updateStats(); ui.updateHand(); ui.redraw(); } catch (e) { }
    }
  },
  /* ---------- Fase 4c: guardado online y reanudación ---------- */
  /* Datos de red que acompañan a cada guardado (null fuera de una partida online). */
  saveInfo() {
    if (!this.online) return null;
    const ans = {}; for (const k in this.ans) ans[k] = this._enc(this.ans[k]);
    return { code: this.code, tok: this.me, hostTok: this.hostTok, role: this.role, owners: this.owners, names: this.names, seats: this.seats, setup: this.setup, epoch: this.epoch,
      pn: this.pn, hi: this.role === 'host' ? this.hi : this.lastI, q: this.q.slice(), ans, subs: this.subs };
  },
  /* Devuelve al estado de red el que tenía al guardar (contadores de decisiones, órdenes y respuestas pendientes). */
  restoreRuntime(n, hi) {
    this.reset(); this.online = true; DEBUG_DICE = false; this.ses = Math.random().toString(36).slice(2, 6); this._inGame = true;
    this.pn = n.pn || 0; this.q = (n.q || []).slice(); this.ans = {}; for (const k in (n.ans || {})) this.ans[k] = this._dec(n.ans[k]); this.subs = n.subs || {};
    this.code = n.code; this.owners = n.owners; this.names = n.names || {}; this.setup = n.setup; this.hostTok = n.hostTok; this.seats = n.seats || []; this.me = n.tok;
    try { sessionStorage.setItem('doz3.tok', n.tok); } catch (e) { }
    if (hi !== undefined) this.lastI = hi;
  },
  /* Reanudar como anfitrión una partida online guardada: se reserva de nuevo el código de sala y los demás vuelven a entrar. */
  async resumeHost(saved) {
    const n = saved.net; if (!n || !n.code) return null;
    ui._modal('<h2>Reanudando sala ' + Net._esc(n.code) + '…</h2><p>Reservando el código de sala. Puede tardar un minuto si la sala anterior aún no ha caducado.</p><div class="opts"><button id="rhCancel">Cancelar</button></div>');
    let cancel = false; $('rhCancel').onclick = () => { cancel = true; };
    let peer = null, err = null;
    for (let k = 0; k < 14 && !peer && !cancel; k++) {
      try { peer = await this._peer(this.PREFIX + n.code); } catch (e) { err = e; if (e.type !== 'unavailable-id') break; await new Promise(r => setTimeout(r, 5000)); }
    }
    ui._close();
    if (!peer) { if (!cancel) await ui.waitAck('Reanudar partida online', err && err.type === 'unavailable-id' ? 'La sala ' + Net._esc(n.code) + ' sigue activa en otro dispositivo. Si es tu anfitrión anterior, únete a ella; si no, espera un minuto e inténtalo de nuevo.' : 'No se pudo reservar la sala: ' + Net._esc((err && (err.message || err.type)) || 'sin conexión') + '.'); return null; }
    this.close(); this.peer = peer; this.role = 'host'; this.started = true; this.epoch = this.newEpoch();
    this.restoreRuntime(n, 0); this.hi = 0; this.log = []; this.lastK = {}; this.away = {}; this.conns = {};
    this.hostTok = this.me; /* el dispositivo que reanuda pasa a ser el anfitrión */
    for (const o of new Set(this.owners)) if (o !== this.me) this.away[o] = Date.now();
    n.hi = 0; n.epoch = this.epoch; n.hostTok = this.me; this.joinSave = JSON.stringify(Object.assign({}, saved, { net: n }));
    this._hostWire(peer, null); peer.on('error', e => this._onError(e)); this._keepPeer(peer);
    this._hostBar(); this.info();
    return saved;
  },
  /* Reanudar desde un guardado con datos de red: como anfitrión o uniéndose a la sala que sigue activa. Devuelve la partida guardada a cargar o null. */
  async resumeFlow(saved) {
    const code = saved.net.code;
    const v = await ui.choose({ title: 'Reanudar partida online', text: 'Sala <b>' + Net._esc(code) + '</b>. ¿La reanudas tú como anfitrión o te unes a la sala si otro dispositivo ya la ha reanudado?', options: [{ label: 'Reanudar como anfitrión', value: 'host' }, { label: 'Unirme a la sala activa', value: 'join' }], cancel: true });
    if (v === 'host') return this.resumeHost(saved);
    if (v === 'join') { try { if (saved.net.tok) sessionStorage.setItem('doz3.tok', saved.net.tok); } catch (e) { } this._joinCode = code; const r = await this._join(); this._joinCode = null; return r && r.resume ? r.resume : null; }
    return null;
  },
  /* Invitado: llega la instantánea de la partida en curso (dispositivo recién abierto o de otra sala). */
  _guestResume(m) {
    if (this._inGame) { try { sessionStorage.setItem('doz3.rejoin', this.code || ''); sessionStorage.setItem('doz3.skipIntro', '1'); } catch (e) { } location.reload(); return; }
    const saved = JSON.parse(m.save), n = saved.net || {};
    ui._close(); /* la ventana «Conectando…» de la unión a la sala */
    this.started = true; this.epoch = m.epoch; this.hostTok = m.hostTok; this.owners = m.owners; this.names = m.names; this.setup = m.setup;
    this.restoreRuntime(Object.assign({}, n, { code: this.code, tok: this.me, hostTok: m.hostTok, owners: m.owners, names: m.names, setup: m.setup, seats: m.seats }), n.hi || 0);
    this.role = 'guest'; this.info();
    if (this._resumeRes) { const r = this._resumeRes; this._resumeRes = null; saved.id = newSaveId(); r({ resume: saved }); }
  },
  /* Indicador de conexión (esquina inferior izquierda). */
  info() {
    let b = document.getElementById('netinfo');
    if (!this.online) { if (b) b.hidden = true; return; }
    if (!b) { b = document.createElement('div'); b.id = 'netinfo'; document.body.appendChild(b); }
    const total = new Set(this.owners).size, conn = this.role === 'host' ? 1 + Object.keys(this.conns).length : (this._retrying ? 0 : 1);
    b.hidden = false; b.textContent = '🌐 Sala ' + this.code + (this.role === 'host' ? ' · ' + conn + '/' + total + ' conectados' : (this._retrying ? ' · reconectando…' : ' · conectado'));
  },
  /* Empieza la partida online en este dispositivo (se llama justo antes de crear la partida). */
  begin() { this.reset(); this.online = true; DEBUG_DICE = false; this.ses = Math.random().toString(36).slice(2, 6); this._inGame = true; this.info(); },
  newEpoch() { return Math.random().toString(36).slice(2, 10); },
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
  close() { try { if (this.peer) this.peer.destroy(); } catch (e) { } this.peer = null; this.conns = {}; this.role = null; this.online = false; this.seats = null; this.started = false; this._inGame = false; this._retrying = false; this.away = {}; this.cpDone = {}; this._bar(''); this.info(); },
  _esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); },
  /* Lista de asientos con su dueño. `me` = id de este dispositivo; con `claim` los asientos libres (del anfitrión) se pueden tomar. */
  _seatsHtml(players, owners, names, me, claim, hostTok, pool) {
    const heroName = k => (HEROES[k] && HEROES[k].name) || k;
    return '<div class="plrows">' + players.map((p, i) => {
      const o = owners[i], mine = o === me, free = o === hostTok && me !== hostTok && i !== 0, taken = !mine && !free;
      /* Estado del asiento: tuyo, libre (lo lleva el anfitrión mientras nadie lo tome) u ocupado por otro invitado. */
      const who = mine ? (me === hostTok ? 'Tú (anfitrión)' : 'Tú') : free ? 'Libre' : (o === hostTok ? 'Anfitrión' : 'Ocupado por ' + (names[o] || 'Invitado'));
      const btn = claim ? (mine ? '<button data-rel="' + i + '">Soltar</button>' : (free ? '<button data-claim="' + i + '">Tomar</button>' : '')) : '';
      let hero = '';
      if (pool && pool.length) {
        if (mine) {
          const used = players.map((x, j) => j !== i ? x.hero : '').filter(Boolean);
          hero = ' <select data-hero="' + i + '"><option value="">Héroe personal: al azar</option>' + pool.map(k => '<option value="' + k + '"' + (p.hero === k ? ' selected' : '') + (used.includes(k) ? ' disabled' : '') + '>' + Net._esc(heroName(k)) + '</option>').join('') + '</select>';
        } else hero = ' <span class="sub">' + (p.hero ? Net._esc(heroName(p.hero)) : 'héroe al azar') + '</span>';
      }
      return '<div class="row seat ' + (mine ? 'mine' : free ? 'free' : 'taken') + '"><span style="color:' + PL_COLORS[i % 4] + '">●</span> <b>' + Net._esc(p.name) + '</b> — <span class="seatst">' + (taken ? '🔒 ' : '') + Net._esc(who) + '</span>' + hero + ' ' + btn + '</div>';
    }).join('') + '</div>';
  },
  /* Anfitrión: cambia el héroe personal de un asiento (lo pide su dueño). Rechaza héroes que no están en la lista o que ya tiene otro asiento. */
  _setHero(seat, hero, tok) {
    const p = this.setup && this.setup.players[seat]; hero = hero || '';
    if (!p || this.owners[seat] !== tok || this.started) return;
    if (hero && (!this.lobbyPool || !this.lobbyPool.includes(hero) || this.setup.players.some((x, j) => j !== seat && x.hero === hero))) { this._lobbyBroadcast(); return; }
    p.hero = hero; this._lobbyBroadcast();
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
    this.close(); this.peer = peer; this.role = 'host'; this.setup = setup; this.conns = {}; this.names = {}; this.away = {}; this.hostTok = this.me = this._tok(); this.epoch = this.newEpoch(); this.owners = setup.players.map(() => this.hostTok);
    let render = () => { };
    G.expSel = setup.exps || []; this.lobbyPool = setup.level > 0 ? heroPoolFor(setup.level) : [];
    const broadcast = () => { for (const id in this.conns) this._send(this.conns[id], { t: 'lobby', players: setup.players, owners: this.owners, names: this.names, you: id, host: this.hostTok, pool: this.lobbyPool }); render(); };
    this.code = code; this._order = 0; this._lobbyRender = () => render(); this._lobbyBroadcast = broadcast;
    this._hostWire(peer, broadcast);
    peer.on('error', e => this._onError(e)); this._keepPeer(peer);
    return new Promise(res => {
      const link = location.origin + location.pathname + '#sala=' + code;
      render = () => {
        const n = Object.keys(this.conns).length;
        const b = ui._modal('<h2>Sala ' + code + '</h2><p>Dile a los demás que elijan «Jugar online → Unirse a una sala» y escriban <b style="font-size:22px;letter-spacing:3px">' + code + '</b>, o que abran este enlace:<br><small>' + Net._esc(link) + '</small></p>' +
          this._seatsHtml(setup.players, this.owners, this.names, this.hostTok, false, this.hostTok, this.lobbyPool) +
          '<p>' + (n ? n + (n === 1 ? ' invitado conectado.' : ' invitados conectados.') : 'Esperando invitados…') + ' Los asientos que nadie tome los juegas tú.</p>' +
          '<div class="opts"><button class="primary" id="nbStart"' + (n ? '' : ' disabled') + '>Empezar la partida</button><button id="nbCopy">Copiar enlace</button><button id="nbCancel">Cancelar</button></div>');
        b.querySelectorAll('[data-hero]').forEach(x => x.onchange = () => this._setHero(+x.dataset.hero, x.value, this.hostTok));
        $('nbCopy').onclick = () => { try { navigator.clipboard.writeText(link); } catch (e) { } };
        $('nbCancel').onclick = () => { ui._close(); Net.close(); res(null); };
        $('nbStart').onclick = () => {
          this.started = true; ui._close();
          this.log = []; this.hi = 0; this.lastK = {};
          for (const id in this.conns) this._send(this.conns[id], { t: 'start', setup, owners: this.owners, names: this.names, host: this.hostTok, epoch: this.epoch, seats: this.owners.map((o, i) => o === id ? i : -1).filter(i => i >= 0) });
          this.seats = this.owners.map((o, i) => o === this.hostTok ? i : -1).filter(i => i >= 0); this.begin(); res(setup);
        };
      };
      render();
    });
  },
  _tok() { try { let k = sessionStorage.getItem('doz3.tok'); if (!k) { k = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); sessionStorage.setItem('doz3.tok', k); } return k; } catch (e) { return this._tk || (this._tk = Math.random().toString(36).slice(2, 12)); } },
  _join(auto) {
    return new Promise(res => {
      this._resumeRes = res;
      const ask = (msg) => {
        const b = ui._modal('<h2>Unirse a una sala</h2><p>Escribe el código de sala (4 caracteres).</p>' + (msg ? '<p style="color:#ff8a7a">' + Net._esc(msg) + '</p>' : '') + '<input id="njCode" maxlength="4" size="6" style="font-size:22px;letter-spacing:3px;text-transform:uppercase" autocomplete="off"><div class="opts"><button class="primary" id="njGo">Conectar</button><button id="njBack">Volver</button></div>');
        const m = /sala=([A-Za-z0-9]{4})/.exec(location.hash); if (m) $('njCode').value = m[1].toUpperCase(); if (this._joinCode) $('njCode').value = this._joinCode;
        $('njBack').onclick = () => { ui._close(); res(null); };
        $('njGo').onclick = () => go($('njCode').value.trim().toUpperCase());
        $('njCode').focus();
      };
      const go = async code => {
        if (code.length !== 4) { ask('El código tiene 4 caracteres.'); return; }
        ui._modal('<h2>Conectando…</h2><p>Sala ' + Net._esc(code) + '</p>');
        this.close(); let peer;
        try { peer = await this._peer(); } catch (e) { ask('No se pudo conectar con el servicio: ' + (e.message || e.type)); return; }
        this.peer = peer; this.role = 'guest'; this.started = false; this.code = code; this.me = this._tok(); this._keepPeer(peer);
        let opened = false;
        const fail = msg => { Net.close(); ask(msg); };
        const to = setTimeout(() => { if (!opened) fail('La sala ' + code + ' no responde. Revisa el código.'); }, 12000);
        peer.on('error', e => { if (!opened && e.type === 'peer-unavailable') { clearTimeout(to); fail('No existe la sala ' + code + '.'); } });
        const data = m => {
          if (!m || typeof m !== 'object') return;
          if (m.t === 'welcome') { this._guestWelcome(m); return; }
          if (m.t === 'resume') { this._guestResume(m); return; }
          if (this.started) { this.recv(m, 'h'); return; }
          if (m.t === 'full') { clearTimeout(to); fail('La sala ' + code + ' está llena o ya ha empezado.'); return; }
          if (m.t === 'lobby') {
            this.me = m.you; this.hostTok = m.host;
            const c = this.conns.h;
            ui._modal('<h2>Sala ' + code + '</h2><p>Toma tus asientos y espera a que el anfitrión empiece la partida.</p>' + this._seatsHtml(m.players, m.owners, m.names, m.you, true, m.host, m.pool) + '<div class="opts"><button id="njLeave">Salir</button></div>');
            document.querySelectorAll('#modalbox [data-hero]').forEach(x => x.onchange = () => this._send(c, { t: 'hero', seat: +x.dataset.hero, hero: x.value }));
            document.querySelectorAll('#modalbox [data-claim]').forEach(x => x.onclick = () => this._send(c, { t: 'claim', seat: +x.dataset.claim }));
            document.querySelectorAll('#modalbox [data-rel]').forEach(x => x.onclick = () => this._send(c, { t: 'release', seat: +x.dataset.rel }));
            $('njLeave').onclick = () => { Net.close(); ui._close(); res(null); };
          } else if (m.t === 'start') {
            this.started = true; this.seats = m.seats; this.owners = m.owners; this.names = m.names; this.hostTok = m.host; this.epoch = m.epoch; this.setup = m.setup; this.begin(); ui._close(); res(m.setup);
          }
        };
        const lost = () => { if (this.started) this._guestLost(); else if (this.role === 'guest' && opened) { Net.close(); ui.waitAck('Jugar online', 'Se perdió la conexión con el anfitrión.').then(() => ask('')); } };
        this._guestData = data; this._guestClosed = lost;
        this._guestConnect(() => { opened = true; clearTimeout(to); }, () => { if (!opened) { clearTimeout(to); fail('No se pudo conectar con la sala ' + code + '.'); } });
      };
      ask('');
      if (auto && this._joinCode) go(this._joinCode);
    });
  },
  /* Abre (o reabre) la conexión con el anfitrión y se presenta con el identificador estable. */
  _guestConnect(onOpen, onFail) {
    const peer = this.peer; if (!peer || peer.destroyed) return;
    const c = peer.connect(this.PREFIX + this.code, { reliable: true }); this.conns = { h: c }; let ok = false;
    c.on('open', () => { ok = true; if (onOpen) onOpen(); this._send(c, { t: 'hi', tok: this.me, lastI: this.lastI, epoch: this.epoch, fresh: !this._inGame }); });
    c.on('data', m => this._guestData(m));
    c.on('close', () => { if (this.conns.h === c && ok) this._guestClosed(); });
    c.on('error', () => { if (!ok && onFail) onFail(); });
  },
  /* Conexión perdida durante la partida: se reintenta sin parar; la partida del invitado se queda esperando donde estaba. */
  _guestLost() {
    if (this._retrying || !this.online) return; this._retrying = true; this.info(); const t0 = Date.now();
    try { ui.log('Se perdió la conexión con el anfitrión. Reconectando…', 'bad'); } catch (e) { }
    const loop = () => {
      if (!this._retrying || !this.online) return;
      const s = Math.round((Date.now() - t0) / 1000);
      this._bar('⚠ Sin conexión con el anfitrión (' + s + ' s). Reconectando…' + (s > 60 ? ' Si el anfitrión cerró la partida, tendrá que reanudarla desde su guardado.' : ''));
      const peer = this.peer;
      if (peer && !peer.destroyed) { if (peer.disconnected) { try { peer.reconnect(); } catch (e) { } } this._guestConnect(null, null); }
      setTimeout(loop, 4000);
    };
    loop();
  },
  _guestWelcome(m) {
    this._retrying = false; this._bar(''); this.info();
    const c = this.conns.h; this.outbox = this.outbox.filter(x => x.g > m.lastK);
    for (const x of this.outbox) this._send(c, x);
    try { ui.log('Conexión recuperada.', 'good'); } catch (e) { }
  },
  _hostWire(peer, broadcast) {
    peer.on('connection', c => {
      c.on('data', m => {
        if (!m || typeof m !== 'object') return;
        if (m.t === 'hi') { this._hostHi(c, m); return; }
        if (!c.tok) return;
        if (this.started) { this.recv(m, c.tok); return; }
        if (m.t === 'hero') { this._setHero(m.seat, m.hero, c.tok); return; }
        if (m.t === 'claim' && m.seat !== 0 && this.owners[m.seat] === this.hostTok) this.owners[m.seat] = c.tok; /* el asiento 1 es siempre del anfitrión */
        else if (m.t === 'release' && m.seat !== 0 && this.owners[m.seat] === c.tok) this.owners[m.seat] = this.hostTok;
        if (broadcast) broadcast();
      });
      c.on('close', () => this._hostGone(c)); c.on('error', () => this._hostGone(c));
    });
  },
  /* El Peer pierde la conexión con el servicio de señalización: se vuelve a conectar (las conexiones ya abiertas siguen vivas). */
  _keepPeer(peer) { peer.on('disconnected', () => { const tryAgain = () => { if (this.peer !== peer || peer.destroyed || !peer.disconnected) return; try { peer.reconnect(); } catch (e) { } setTimeout(tryAgain, 4000); }; setTimeout(tryAgain, 1000); }); },
  /* Anfitrión: un dispositivo se presenta con su identificador estable (tok). Antes de empezar entra al lobby; después, es una reconexión. */
  _hostHi(c, m) {
    const tok = String(m.tok || '').slice(0, 24); if (!tok) return;
    if (this.started) {
      if (!this.owners.includes(tok)) { this._send(c, { t: 'full' }); setTimeout(() => c.close(), 300); return; }
      const old = this.conns[tok]; if (old && old !== c) { old.tok = null; try { old.close(); } catch (e) { } }
      c.tok = tok; this.conns[tok] = c; delete this.away[tok];
      const from = +m.lastI || 0;
      if (m.fresh || m.epoch !== this.epoch) {
        /* Dispositivo sin partida en memoria (recarga, otro navegador) o de una sala anterior: entra desde la última instantánea y recibe lo posterior. */
        const save = this.joinSave; if (!save) { this._send(c, { t: 'full' }); return; }
        const base = (JSON.parse(save).net || {}).hi || 0;
        this._send(c, { t: 'resume', save, epoch: this.epoch, hostTok: this.hostTok, owners: this.owners, names: this.names, setup: this.setup, seats: this.owners.map((o, i) => o === tok ? i : -1).filter(i => i >= 0) });
        for (const e of this.log) if (e.i > base && (e.to === tok || e.to === null)) this._send(c, e.m);
      } else {
        this._send(c, { t: 'welcome', lastK: this.lastK[tok] || 0 });
        for (const e of this.log) if (e.i > from && ((e.to === tok) || (e.to === null && e.origin !== tok))) this._send(c, e.m);
      }
      try { ui.log((this.names[tok] || 'Un invitado') + ' ha vuelto a conectarse.', 'good'); } catch (e) { } this._hostBar(); this.info();
      return;
    }
    if (Object.keys(this.conns).length >= this.setup.players.length - 1 && !this.conns[tok]) { this._send(c, { t: 'full' }); setTimeout(() => c.close(), 300); return; }
    c.tok = tok; this.conns[tok] = c; if (!this.names[tok]) this.names[tok] = 'Invitado ' + (++this._order); this._lobbyBroadcast();
  },
  _hostGone(c) {
    const tok = c.tok; if (!tok || this.conns[tok] !== c) return;
    delete this.conns[tok];
    if (this.started) {
      this.away[tok] = Date.now(); this.info(); try { ui.log('Se perdió la conexión con ' + (this.names[tok] || 'un invitado') + '. La partida espera a que vuelva.', 'bad'); } catch (e) { }
      if (this._cpFin) this._cpFin(); this._hostBar();
    } else { this.owners = this.owners.map(o => o === tok ? this.hostTok : o); this._lobbyBroadcast(); }
  },
  _hostBar() { const a = Object.keys(this.away).map(k => this.names[k] || 'Invitado'); this._bar(a.length ? '⚠ Sin conexión: ' + a.join(', ') + '. La partida espera a que vuelvan.' : ''); },
  _bar(text) {
    let b = document.getElementById('netbar');
    if (!text) { if (b) b.hidden = true; return; }
    if (!b) { b = document.createElement('div'); b.id = 'netbar'; document.body.appendChild(b); }
    b.hidden = false; b.textContent = text;
  },
  _send(c, m) { try { c.send(m); } catch (e) { console.warn('Net send', e); } }
};
