/* Código de partida: nivel, duración, expansiones, héroes elegidos y semilla de azar en un texto corto que se puede copiar y pegar. Se carga después de expansions2.js. */
'use strict';

const SeedCode = {
  VER: 2,  /* 1 = sin Civil Heroico elegido (los códigos antiguos siguen valiendo); 2 = lleva un byte más con el Civil Heroico (0 = al azar) */
  ABC: '0123456789ABCDEFGHJKMNPQRSTVWXYZ',
  /* Orden fijo de los héroes en el código (el de Object.keys(HEROES) al crearlo): un héroe nuevo en mitad de data.js no debe cambiar los índices
     de los códigos ya compartidos. Los héroes que se añadan después van al final, en el orden en que aparezcan. */
  ORDER: ['piazza', 'hernandez', 'schmidt', 'hunt', 'hauser', 'johnson', 'kingman', 'pepinillos', 'santana', 'darling', 'staub', 'horacio', 'seaver', 'agee', 'jones', 'wright', 'wilson', 'furias', 'bomberos', 'bauer', 'antidist', 'salvacion', 'clarin', 'wzed', 'division12',
    'may', 'betty', 'carter', 'lee', 'jaque', 'porter', 'alia'],
  heroList() { return this.ORDER.concat(Object.keys(HEROES).filter(k => !this.ORDER.includes(k))); },
  sum(b) { let s = 7; for (const x of b) s = (s * 31 + x) & 255; return s; },
  random() { return crypto.getRandomValues(new Uint32Array(1))[0]; },
  /* o = { level, len, exps: [1..4], heroes: [claves de héroe elegidas, 0 a 4], civh: clave de Civil Heroico elegido (opcional), seed } */
  encode(o) {
    const hl = this.heroList(), hs = (o.level === 0 ? [] : o.heroes || []).map(k => hl.indexOf(k));
    let mask = 0; for (const n of o.exps || []) mask |= 1 << (n - 1);
    const cv = o.level === 0 || !o.civh ? 0 : CIVH_POOL.indexOf(o.civh) + 1;
    const b = [cv ? this.VER : 1, o.level, o.len, mask, hs.length].concat(hs, cv ? [cv] : [], [o.seed >>> 24, (o.seed >>> 16) & 255, (o.seed >>> 8) & 255, o.seed & 255]);
    b.push(this.sum(b));
    let bits = '', out = ''; for (const x of b) bits += x.toString(2).padStart(8, '0');
    while (bits.length % 5) bits += '0';
    for (let i = 0; i < bits.length; i += 5) out += this.ABC[parseInt(bits.slice(i, i + 5), 2)];
    return out.match(/.{1,5}/g).join('-');
  },
  /* Devuelve el objeto de encode() o lanza Error con un mensaje para el jugador. */
  decode(txt) {
    const s = String(txt || '').toUpperCase().replace(/[\s-]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
    if (!s) throw new Error('Escribe o pega un código.');
    let bits = ''; for (const c of s) { const i = this.ABC.indexOf(c); if (i < 0) throw new Error('El código tiene caracteres no válidos.'); bits += i.toString(2).padStart(5, '0'); }
    const b = []; for (let i = 0; i + 8 <= bits.length; i += 8) b.push(parseInt(bits.slice(i, i + 8), 2));
    if (b.length < 10 || b[0] < 1 || b[0] > this.VER) throw new Error(b[0] > this.VER ? 'El código es de una versión más nueva del juego.' : 'El código no es válido.');
    const ver = b[0], n = b[4], xb = ver >= 2 ? 1 : 0, len = 5 + n + xb + 4 + 1;
    if (b.length < len || b.length > len + 1) throw new Error('El código está incompleto o mal copiado.');
    if (this.sum(b.slice(0, len - 1)) !== b[len - 1]) throw new Error('El código está mal copiado (no pasa la comprobación).');
    const hl = this.heroList(), level = b[1], lenIdx = b[2], exps = [1, 2, 3, 4].filter(k => b[3] & (1 << (k - 1)));
    const heroes = b.slice(5, 5 + n).map(i => hl[i]);
    const civh = xb && b[5 + n] ? CIVH_POOL[b[5 + n] - 1] : null, q = 5 + n + xb;
    if (xb && b[5 + n] && !civh) throw new Error('El código no es válido.');
    const o = { level, len: lenIdx, exps, heroes, civh, seed: ((b[q] << 24) | (b[q + 1] << 16) | (b[q + 2] << 8) | b[q + 3]) >>> 0 };
    const L = LEVELS[level];
    if (!L || !L.lengths[lenIdx] || n > 4 || heroes.some(k => !k) || new Set(heroes).size !== n) throw new Error('El código no es válido.');
    if (level > 0) {
      const old = G.expSel; G.expSel = exps; const pool = heroPoolFor(level); G.expSel = old;
      if (heroes.some(k => !pool.includes(k))) throw new Error('El código incluye un héroe que no está disponible en ese nivel o expansión.');
    }
    return o;
  }
};
