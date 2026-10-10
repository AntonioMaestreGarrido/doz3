/* Panel OST: reproductor de la banda sonora (assets/sonidos/musica), abierto desde la portada.
   Solo puede sonar un tema a la vez: al abrirlo se para la música del menú y al cerrarlo vuelve. Las pistas con letra la muestran completa (con scroll). */
'use strict';

const Ost = {
  TEMAS: [
    { file: 'musica_menu.mp3', nombre: 'Menú principal', letra: 'musica_menu.txt' },
    { file: 'musica_juego1.mp3', nombre: 'Partida 1' },
    { file: 'musica_juego2.mp3', nombre: 'Partida 2' },
    { file: 'musica_peligro.mp3', nombre: 'Apocalyptic Slide' },
    { file: 'musica_last_stand.mp3', nombre: 'Last Stand' },
    { file: 'musica_victoria.mp3', nombre: 'Victoria', letra: 'musica_victoria.txt' },
    { file: 'musica_derrota.mp3', nombre: 'Derrota', letra: 'musica_derrota.txt' },
    { file: 'musica_himno.mp3', nombre: 'Himno zombie', letra: 'musica_himno.txt' }
  ],
  DIR: 'assets/sonidos/musica/', LETRA_DIR: 'assets/sonidos/letras/',
  a: null, i: 0, rep: false, el: null,
  open() {
    if (this.el) return;
    ui.musicStop();
    const el = this.el = document.createElement('div'); el.id = 'ost';
    el.innerHTML = '<video class="ost-bg" src="assets/band_loop.mp4" muted loop playsinline preload="auto" aria-label="Zombie band"></video>' +
      '<button class="ost-x" id="ostX" title="Cerrar">✕</button>' +
      '<div class="ost-stage"><div class="ost-letra" id="ostLetra"></div></div>' +
      '<div class="ost-bar">' +
      '<select id="ostSel" title="Canción">' + this.TEMAS.map((t, n) => '<option value="' + n + '">' + t.nombre + '</option>').join('') + '</select>' +
      '<div class="ost-btns"><button id="ostPrev" title="Anterior">⏮</button><button id="ostPlay" title="Reproducir">▶</button><button id="ostNext" title="Siguiente">⏭</button><button id="ostRep" title="Repetir">🔁</button></div>' +
      '<div class="ost-prog"><input type="range" id="ostSeek" min="0" max="0" step="0.1" value="0">' +
      '<span class="ost-time"><span id="ostCur">0:00</span> / <span id="ostDur">0:00</span></span></div>' +
      '<label class="ost-vol" title="Volumen">🔈<input type="range" id="ostVol" min="0" max="100" value="70"></label>' +
      '</div>';
    document.body.appendChild(el);
    const $ = id => el.querySelector('#' + id); this.$ = $;
    $('ostX').onclick = () => this.close();
    $('ostPrev').onclick = () => this.paso(-1);
    $('ostNext').onclick = () => this.paso(1);
    $('ostPlay').onclick = () => this.toggle();
    $('ostRep').onclick = () => { this.rep = !this.rep; $('ostRep').classList.toggle('on', this.rep); if (this.a) this.a.loop = this.rep; };
    $('ostSel').onchange = e => this.cargar(+e.target.value, true);
    $('ostSeek').oninput = e => { if (this.a) this.a.currentTime = +e.target.value; };
    $('ostVol').oninput = e => { if (this.a) this.a.volume = e.target.value / 100; };
    this.onKey = e => { if (e.key === 'Escape') this.close(); };
    document.addEventListener('keydown', this.onKey);
    this.cargar(0, true);
  },
  cargar(n, reproducir) {
    const t = this.TEMAS[n]; this.i = n;
    if (this.a) { this.a.pause(); this.a.onended = this.a.ontimeupdate = this.a.onloadedmetadata = null; }
    const a = this.a = new Audio(this.DIR + t.file);
    a.loop = this.rep; a.volume = this.$('ostVol').value / 100;
    a.ontimeupdate = () => { this.$('ostSeek').value = a.currentTime; this.$('ostCur').textContent = fmt(a.currentTime); };
    a.onloadedmetadata = () => { this.$('ostSeek').max = a.duration; this.$('ostDur').textContent = fmt(a.duration); };
    a.onplay = () => { this.$('ostPlay').textContent = '⏸'; this.banda(true); };
    a.onpause = () => { this.$('ostPlay').textContent = '▶'; this.banda(false); };
    a.onended = () => this.paso(1);
    this.$('ostSel').value = n;
    this.$('ostSeek').value = 0; this.$('ostCur').textContent = '0:00'; this.$('ostDur').textContent = '0:00';
    this.pintaLetra(t);
    if (reproducir) this.play();
  },
  play() { if (!this.a) return; const p = this.a.play(); if (p && p.catch) p.catch(() => { }); },
  /* La banda "toca" mientras suena la música: el video se reproduce; parado se queda en su primer fotograma. */
  banda(on) {
    const v = this.el && this.el.querySelector('video'); if (!v) return;
    if (on) { const p = v.play(); if (p && p.catch) p.catch(() => { }); }
    else v.pause();
  },
  toggle() { if (!this.a) return; if (this.a.paused) this.play(); else this.a.pause(); },
  paso(d) { this.cargar((this.i + d + this.TEMAS.length) % this.TEMAS.length, true); },
  pintaLetra(t) {
    const box = this.$('ostLetra');
    if (!t.letra) { box.classList.add('vacia'); box.textContent = 'Esta canción no tiene letra.'; return; }
    box.classList.remove('vacia'); box.textContent = 'Cargando letra…';
    fetch(this.LETRA_DIR + t.letra).then(r => { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(s => { if (this.TEMAS[this.i] === t) box.textContent = s; })
      .catch(() => {
        if (this.TEMAS[this.i] !== t) return;
        box.textContent = location.protocol === 'file:'
          ? 'Para ver la letra abre el juego desde un servidor (p. ej. http://localhost), no con doble clic: el navegador bloquea leer archivos sueltos.'
          : 'No se pudo cargar la letra.';
      });
  },
  close() {
    if (!this.el) return;
    if (this.a) { this.a.pause(); this.a = null; }
    this.banda(false);
    document.removeEventListener('keydown', this.onKey);
    this.el.remove(); this.el = null;
    ui.musicOn();
  }
};

/* m:ss para los tiempos del reproductor. */
function fmt(s) { if (!isFinite(s)) return '0:00'; return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0'); }
