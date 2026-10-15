/* Catálogo de cartas y unidades: lee los datos del propio juego (js/data.js, events.js, dest.js, expansions.js) y genera
     catalogo/catalogo_cartas.html  (buscador: texto, tipo, fase, nivel, expansión)
     catalogo/catalogo_cartas.md    (lo mismo en texto plano, fácil de buscar con grep o en el editor)
   Uso:  npm run catalogo   (o  node tools/generar_catalogo.mjs)
   La fase de cada Evento sale de la tabla EV_FASE de js/expansions.js (la pestaña de la carta original).
   El campo «Resuelve el código» se obtiene leyendo js/phases.js: en qué función se aplica el efecto de cada carta. */
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const exists = f => fs.existsSync(path.join(ROOT, f));

/* ---------- 1. Cargar los datos del juego en un contexto aislado ---------- */
const ctx = vm.createContext({ console, Math });
const stub = () => { const f = function () { return f; }; return new Proxy(f, { get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : f), apply: () => f }); };
function run(file, src) {
  src = src.replace(/^(const|let) /gm, 'var ');              /* en el contexto, todo a nivel global (permite reintentar) */
  for (let n = 0; n < 80; n++) {
    try { vm.runInContext(src, ctx, { filename: file }); return; }
    catch (e) {
      const m = /^(\w+) is not defined/.exec(e.message || '');
      if (e && e.name === 'ReferenceError' && m) { ctx[m[1]] = stub(); continue; }   /* dependencias del resto del juego que no hacen falta para leer datos */
      throw new Error(file + ': ' + e.message);
    }
  }
  throw new Error(file + ': demasiadas dependencias sin definir');
}
/* Trozos de otros ficheros que sí hacen falta (nombres de rutas, imágenes de Destino). */
const grab = (file, re) => { const m = re.exec(read(file)); if (!m) throw new Error('No encuentro ' + re + ' en ' + file); return m[0]; };
run('data.js', read('js/data.js'));
run('events.js', read('js/events.js'));
run('dest.js', read('js/dest.js'));
run('game.js (DEST_IMG)', grab('js/game.js', /^const DEST_IMG = \{[\s\S]*?\};/m));
run('cardtext.js (rutas)', grab('js/cardtext.js', /^const ROUTE_NAMES_ES = \{.*\};/m));
run('expansions.js', read('js/expansions.js'));
const G_ = n => vm.runInContext('typeof ' + n + " !== 'undefined' ? " + n + ' : null', ctx);
const EV = G_('EV'), DEST = G_('DEST'), RES = G_('RES'), HEROES = G_('HEROES'), SPECIALS = G_('SPECIALS'), SUPER_ZEDS = G_('SUPER_ZEDS'),
  SPREADERS = G_('SPREADERS'), RUMORS = G_('RUMORS'), WEAPON_PARTS = G_('WEAPON_PARTS'), ZED_UPGRADES = G_('ZED_UPGRADES'),
  FASE_NOMBRE = G_('FASE_NOMBRE'), DEST_IMG = G_('DEST_IMG') || {}, ROUTE_NAMES = G_('ROUTE_NAMES_ES') || {};
if (!EV || !FASE_NOMBRE) throw new Error('No se han podido leer los Eventos o las fases (EV / FASE_NOMBRE).');

/* ---------- 2. Dónde aplica el código cada Evento (lectura de js/phases.js) ---------- */
const PH = read('js/phases.js');
const bodyOf = name => { const i = PH.indexOf('async function ' + name + '('); if (i < 0) return ''; const m = /\r?\n(async )?function /.exec(PH.slice(i + 10)); return PH.slice(i, i + 10 + (m ? m.index : PH.length)); };
const casesOf = name => new Set([...bodyOf(name).matchAll(/case '([a-z0-9_]+)'/g)].map(m => m[1]));
const CASOS = { eventEffect: casesOf('eventEffect'), eventAfterZeds: casesOf('eventAfterZeds'), eventAfterInfection: casesOf('eventAfterInfection'), eventEnd: casesOf('eventEnd') };
const EN_FASE = { z: 'de los Zeds', a: 'de Acciones', '4': '4R', i: 'de Infección', za: 'de los Zeds' };
const BANDERAS = {
  assault: 'al inicio de los Zeds: +1 Infección por cada Zed de la ruta y un Zed nuevo en su Inicial',
  chaos2: 'bandera de turno: 2 fichas de Caos en lugar de 1 (al ocupar Zeds un espacio con nombre)',
  noTerrain: 'bandera de turno: los defensores no reciben Modificador por Terreno', smash: 'bandera de turno: los Zeds destruyen Barricadas al entrar',
  flamed: 'bandera de turno: Zeds flambeados (Caos)', noRetreatOnce: 'bandera de turno: tras el primer ataque Zed nadie se retira',
  outbreakLocal: 'bandera de turno: Civil eliminado = Brote local', negation: 'bandera de turno: sin Mover ni disparar junto a Zeds (fase de Acciones)',
  freeFromC: 'bandera de turno: Mover gratis desde el Centro (fase de Acciones)', noFight: 'bandera de turno: sin ataques (fase de Acciones)',
  panic: 'bandera de turno: Mover gratis hacia el Centro (fase de Acciones)', mercs: 'bandera de turno: +1 columna en los disparos (fase de Acciones)',
  noSurfaceMove: 'bandera de turno: sin Mover por la superficie (fase de Acciones)', noPlayerAction: 'al inicio de Acciones: la Acción de Jugador queda Usada',
  freeSearch: 'al inicio de la fase de Acciones: Buscar gratis', cer: '¡CEREBROS!: turno especial sin fases normales', fin: 'carta de Fin: se gana al terminar la fase de los Zeds (inicio de Acciones)',
  guardia: 'turno especial: coloca la Guardia Nacional y termina el turno', sewer: 'alcantarilla (Túnel)', vents: 'conductos (Túnel)'
};
function dondeSeAplica(e) {
  const out = [];
  const f = e.fase || '-';
  if (CASOS.eventEffect.has(e.id)) out.push('phases.js › eventEffect: al inicio de la fase ' + (EN_FASE[f] || 'de los Zeds'));
  if (CASOS.eventAfterInfection.has(e.id)) out.push('phases.js › eventAfterInfection: al final de la fase de Infección');
  if (CASOS.eventAfterZeds.has(e.id)) out.push('phases.js › eventAfterZeds: al final de la fase de los Zeds');
  if (CASOS.eventEnd.has(e.id)) out.push('phases.js › eventEnd: al final de la fase de Acciones');
  for (const k of Object.keys(BANDERAS)) if (e[k]) out.push(BANDERAS[k]);
  return out;
}

/* ---------- 3. Reunir las entradas ---------- */
const COLOR = { b: 'Azul (Juego Básico y Nivel I)', g: 'Verde (Nivel II)', y: 'Amarillo (Nivel III)', o: 'Naranja (Nivel IV)', r: 'Rojo (Nivel V)' };
const ruta = z => ROUTE_NAMES[z] || { B: 'Bosque', M: 'Montaña', A: 'Autovía', F: 'Afueras', T: 'Túnel' }[z] || z;
const txt = t => (Array.isArray(t) ? t : [t]).filter(Boolean).map(s => String(s).replace(/<[^>]+>/g, '')).join(' ');
const items = [];
const img = f => (exists('assets/cartas/' + f) ? 'assets/cartas/' + f : null);

for (const id of Object.keys(EV)) {
  const e = EV[id];
  items.push({
    tipo: 'Evento', id, nombre: e.name, color: COLOR[e.lvl] || e.lvl, acto: e.fin ? 'Fin' : e.act, especial: !!e.sp, expansion: e.exp || 0,
    fase: e.fase || '-', faseNombre: FASE_NOMBRE[e.fase || '-'],
    columnas: { '4R': e.r4, 'Infección': e.inf === 'B' ? 'tirada de Brote' : (e.inf || 'No'), 'Alimentación': e.al === 'd' ? '1 dado' : e.al, 'Zeds': (e.z || []).map(ruta).join(' → ') || '—', 'Acciones': e.acc },
    texto: txt(e.txt), codigo: dondeSeAplica(e), img: img('e_' + id + '.jpg')
  });
}
for (const id of Object.keys(DEST)) {
  const d = DEST[id];
  items.push({ tipo: 'Destino', id, nombre: d.name, color: COLOR[d.lvl] || d.lvl, ruta: d.where, guardar: !!d.keep, texto: txt(d.txt), img: img('d_' + (DEST_IMG[id] || id) + '.jpg') });
}
for (const id of Object.keys(RES)) {
  const r = RES[id];
  items.push({ tipo: 'Investigación', id, nombre: r.name, clase: { start: 'Inicial', ini: 'Inicial', spe: 'Especial' }[r.kind] || r.kind, umbral: r.th, suministro: !!r.sup, permanente: !!r.perm, texto: txt(r.txt), img: img('i_' + id + '.jpg') });
}
for (const k of Object.keys(HEROES)) {
  const h = HEROES[k];
  items.push({
    tipo: h.type === 'civh' ? 'Civiles Heroicos' : 'Héroe', id: k, nombre: h.name, clase: h.cls, fuerza: h.full + ' / ' + h.red, movimiento: h.mp, nivel: h.lv, expansion: h.exp || 0,
    texto: txt(h.txt), img: img('h_' + k + '.jpg') || (exists('assets/cartas/' + (h.card || 'h_' + k) + '.jpg') ? 'assets/cartas/' + (h.card || 'h_' + k) + '.jpg' : null)
  });
}
for (const k of Object.keys(SPECIALS)) { const s = SPECIALS[k]; items.push({ tipo: 'Unidad especial', id: k, nombre: s.name, fuerza: s.full + ' / ' + s.red, movimiento: s.mp, texto: txt(s.txt), img: s.card ? img(s.card + '.jpg') : null }); }
for (const k of Object.keys(SUPER_ZEDS)) { const s = SUPER_ZEDS[k]; items.push({ tipo: 'Súper Zed', id: k, nombre: s.name, fuerza: s.full + ' / ' + s.red, texto: txt(s.txt), img: exists('assets/tokens/' + s.img + '.png') ? 'assets/tokens/' + s.img + '.png' : null }); }
for (const k of Object.keys(SPREADERS || {})) { const s = SPREADERS[k]; items.push({ tipo: 'Propagador', id: k, nombre: s.name, fuerza: s.full + ' / ' + s.red, texto: '+1 Infección en cada fase de Infección mientras esté en juego fuera de un espacio Inicial.', img: null }); }
for (const k of Object.keys(RUMORS || {})) { const r = RUMORS[k]; items.push({ tipo: 'Rumor', id: k, nombre: r.name, clase: { C: 'Se coloca', G: 'Se guarda', U: 'Se une' }[r.t] || r.t, texto: txt(r.txt), img: exists('assets/tokens/rumores/' + k + '.png') ? 'assets/tokens/rumores/' + k + '.png' : null }); }
for (const k of Object.keys(WEAPON_PARTS || {})) { const w = WEAPON_PARTS[k]; items.push({ tipo: 'Súper Arma', id: k, nombre: w.name, texto: txt(w.txt), img: null }); }

const ORDEN = ['Evento', 'Destino', 'Investigación', 'Héroe', 'Civiles Heroicos', 'Unidad especial', 'Súper Zed', 'Propagador', 'Rumor', 'Súper Arma'];
items.sort((a, b) => ORDEN.indexOf(a.tipo) - ORDEN.indexOf(b.tipo) || String(a.id).localeCompare(String(b.id)));

/* ---------- 4. Markdown ---------- */
const OUT = path.join(ROOT, 'catalogo'); fs.mkdirSync(OUT, { recursive: true });
const fecha = (read('js/version.js').match(/'([^']+)'/) || [, ''])[1];
const md = [];
md.push('# Catálogo de cartas y unidades', '',
  'Generado por `tools/generar_catalogo.mjs` (`npm run catalogo`) a partir de los datos del juego (build ' + fecha + '). **No se edita a mano.**', '',
  'Cómo buscar: Ctrl+F por nombre, por `id` (el nombre interno que usa el código) o por una palabra del texto. El buscador visual está en `catalogo_cartas.html`.', '',
  'La **fase** de cada Evento es la columna cuya pestaña se extiende hasta el texto en la carta original; el texto da el momento exacto dentro de la fase. Se define en la tabla `EV_FASE` de `js/expansions.js`.', '');
const cuenta = ORDEN.map(t => t + ': ' + items.filter(i => i.tipo === t).length).join(' · ');
md.push('**' + items.length + ' entradas** — ' + cuenta, '');
md.push('## Eventos por fase', '');
for (const f of ['4', 'i', 'z', 'a', 'za', '-']) {
  const l = items.filter(i => i.tipo === 'Evento' && i.fase === f);
  md.push('- **' + FASE_NOMBRE[f] + ' (' + l.length + '):** ' + l.map(i => '`' + i.id + '`').join(', '));
}
md.push('');
let tipoActual = '';
for (const i of items) {
  if (i.tipo !== tipoActual) { tipoActual = i.tipo; md.push('', '## ' + tipoActual + (tipoActual === 'Evento' ? 'es' : tipoActual.endsWith('s') ? '' : 's'), ''); }
  md.push('### ' + i.id + ' — ' + i.nombre);
  const datos = [];
  if (i.tipo === 'Evento') { datos.push(i.color, 'Acto ' + i.acto + (i.especial ? ' · especial' : ''), '**' + i.faseNombre + '**'); if (i.expansion) datos.push('Expansión ' + i.expansion); datos.push(Object.entries(i.columnas).map(([k, v]) => k + ': ' + v).join(' · ')); }
  else if (i.tipo === 'Destino') { datos.push(i.color, 'Ruta/efecto: ' + i.ruta + (i.guardar ? ' · «Guardar para más tarde»' : '')); }
  else if (i.tipo === 'Investigación') { datos.push(i.clase, 'Umbral ' + i.umbral + '+' + (i.suministro ? ' y 1 Suministro' : '') + (i.permanente ? ' · efecto mientras sea la carta en curso' : '')); }
  else { if (i.clase) datos.push(i.clase); if (i.fuerza) datos.push('Fuerza ' + i.fuerza); if (i.movimiento != null) datos.push('Mov. ' + i.movimiento); if (i.nivel) datos.push('Nivel ' + i.nivel); if (i.expansion) datos.push('Expansión ' + i.expansion); }
  md.push(datos.filter(Boolean).join(' · '));
  md.push('', '> ' + i.texto);
  if (i.codigo && i.codigo.length) md.push('', 'Resuelve el código: ' + i.codigo.join('; '));
  if (i.img) md.push('', '![' + i.id + '](../' + i.img + ')');
  md.push('');
}
fs.writeFileSync(path.join(OUT, 'catalogo_cartas.md'), md.join('\n') + '\n');

/* ---------- 5. HTML con buscador ---------- */
const datos = JSON.stringify(items).replace(/</g, '\\u003c');
const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Catálogo de cartas</title>
<style>
:root{--bg:#14110d;--card:#1f1a13;--bd:#4a3b22;--tx:#efe7d3;--mut:#a99a78;--ac:#e0b240;--ac2:#c53428}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--tx);font:15px/1.45 system-ui,Segoe UI,Arial,sans-serif}
header{position:sticky;top:0;z-index:5;background:#0e0c09;border-bottom:1px solid var(--bd);padding:10px 16px}
h1{margin:0 0 8px;font-size:19px;color:var(--ac)}
#q{width:100%;max-width:560px;padding:9px 12px;border-radius:8px;border:1px solid var(--bd);background:var(--card);color:var(--tx);font-size:16px}
.row{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;align-items:center}.row b{color:var(--mut);font-size:12px;text-transform:uppercase;letter-spacing:.06em;margin-right:4px}
.chip{border:1px solid var(--bd);background:var(--card);color:var(--tx);padding:3px 10px;border-radius:14px;cursor:pointer;font-size:13px}.chip.on{background:var(--ac);color:#1a1205;border-color:var(--ac)}
#n{color:var(--mut);font-size:13px;margin:10px 16px 0}
main{display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:12px;padding:12px 16px 40px}
.c{background:var(--card);border:1px solid var(--bd);border-radius:12px;padding:12px;display:flex;gap:12px}
.c img{width:112px;height:auto;align-self:flex-start;border-radius:6px;background:#000;flex:none;cursor:zoom-in}
.c h2{margin:0;font-size:16px}.c .id{color:var(--mut);font-size:12px;font-family:ui-monospace,Consolas,monospace}
.tag{display:inline-block;border:1px solid var(--bd);border-radius:10px;padding:0 8px;margin:4px 4px 0 0;font-size:12px;color:var(--mut)}.tag.f{color:#1a1205;background:var(--ac);border-color:var(--ac);font-weight:600}
.cols{margin:6px 0;font-size:12.5px;color:var(--mut)}.cols span{margin-right:10px;white-space:nowrap}
.t{margin:6px 0 0}.code{margin-top:6px;font-size:12px;color:#9fc27a;font-family:ui-monospace,Consolas,monospace}
mark{background:#7a5d10;color:#fff;border-radius:3px}
#zoom{position:fixed;inset:0;background:#000d;display:none;align-items:center;justify-content:center;z-index:9;cursor:zoom-out}#zoom img{max-height:94vh;max-width:94vw}
@media(max-width:560px){main{grid-template-columns:1fr}.c img{width:84px}}
</style></head><body>
<header><h1>Catálogo de cartas y unidades <span style="color:var(--mut);font-weight:400;font-size:13px">· build ${fecha}</span></h1>
<input id="q" type="search" placeholder="Buscar por nombre, id o texto del efecto…  (p. ej. «gratis», toxicos, Caos, Elwood)" autofocus>
<div class="row"><b>Tipo</b><span id="ftipo"></span></div>
<div class="row" id="rfase"><b>Fase</b><span id="ffase"></span></div>
<div class="row" id="rcol"><b>Nivel</b><span id="fcol"></span></div>
</header>
<div id="n"></div><main id="m"></main><div id="zoom"><img alt=""></div>
<script>
const D=${datos};
const TIPOS=[...new Set(D.map(x=>x.tipo))];
const FASES=[['4','Fase 4R'],['i','Infección'],['z','Zeds'],['a','Acciones'],['za','Zeds y Acciones'],['-','Sin fase']];
const COLS=[...new Set(D.filter(x=>x.tipo==='Evento'||x.tipo==='Destino').map(x=>x.color))].sort((p,q)=>['Azul','Verde','Amarillo','Naranja','Rojo'].indexOf(p.split(' ')[0])-['Azul','Verde','Amarillo','Naranja','Rojo'].indexOf(q.split(' ')[0]));
const S={tipo:null,fase:null,col:null,q:''};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'');
function chips(el,list,key,all){el.innerHTML=[['',all]].concat(list).map(([v,l])=>'<button class="chip'+((S[key]||'')===v?' on':'')+'" data-v="'+esc(v)+'">'+esc(l)+'</button>').join('');el.onclick=e=>{const b=e.target.closest('.chip');if(!b)return;S[key]=b.dataset.v||null;draw();};}
function hl(t,q){if(!q)return esc(t);const n=norm(t),i=n.indexOf(q);if(i<0)return esc(t);return esc(t.slice(0,i))+'<mark>'+esc(t.slice(i,i+q.length))+'</mark>'+esc(t.slice(i+q.length));}
function card(x,q){
  const tags=[];if(x.faseNombre&&x.fase!=='-')tags.push('<span class="tag f">'+esc(x.faseNombre)+'</span>');
  for(const k of['color','clase','fuerza','movimiento','nivel'])if(x[k]!=null&&x[k]!=='')tags.push('<span class="tag">'+(k==='fuerza'?'Fuerza ':k==='movimiento'?'Mov. ':k==='nivel'?'Nivel ':'')+esc(x[k])+'</span>');
  if(x.acto!=null)tags.push('<span class="tag">Acto '+esc(x.acto)+(x.especial?' · especial':'')+'</span>');
  if(x.expansion)tags.push('<span class="tag">Expansión '+x.expansion+'</span>');
  if(x.guardar)tags.push('<span class="tag">Guardar para más tarde</span>');
  if(x.umbral!=null)tags.push('<span class="tag">Umbral '+x.umbral+'+'+(x.suministro?' y 1 Suministro':'')+'</span>');
  const cols=x.columnas?'<div class="cols">'+Object.entries(x.columnas).map(([k,v])=>'<span><b>'+esc(k)+':</b> '+esc(v)+'</span>').join('')+'</div>':'';
  const code=(x.codigo&&x.codigo.length)?'<div class="code">'+x.codigo.map(esc).join('<br>')+'</div>':'';
  return '<article class="c">'+(x.img?'<img loading="lazy" src="../'+esc(x.img)+'" data-big="../'+esc(x.img)+'" alt="">':'')+'<div><h2>'+hl(x.nombre,q)+'</h2><div class="id">'+esc(x.tipo)+' · '+hl(String(x.id),q)+'</div>'+tags.join('')+cols+'<p class="t">'+hl(x.texto,q)+'</p>'+code+'</div></article>';
}
function draw(){
  const q=norm(S.q.trim());
  const L=D.filter(x=>(!S.tipo||x.tipo===S.tipo)&&(!S.fase||x.fase===S.fase)&&(!S.col||x.color===S.col)&&(!q||norm([x.nombre,x.id,x.texto,x.clase,x.color,x.faseNombre,(x.codigo||[]).join(' ')].join(' ')).includes(q)));
  document.getElementById('n').textContent=L.length+' de '+D.length+' entradas';
  document.getElementById('m').innerHTML=L.map(x=>card(x,q)).join('');
  chips(document.getElementById('ftipo'),TIPOS.map(t=>[t,t]),'tipo','Todos');
  chips(document.getElementById('ffase'),FASES,'fase','Todas');
  chips(document.getElementById('fcol'),COLS.map(c=>[c,c.split(' (')[0]]),'col','Todos');
  document.getElementById('rfase').style.display=(!S.tipo||S.tipo==='Evento')?'':'none';
  document.getElementById('rcol').style.display=(!S.tipo||S.tipo==='Evento'||S.tipo==='Destino')?'':'none';
}
document.getElementById('q').oninput=e=>{S.q=e.target.value;draw();};
document.getElementById('m').onclick=e=>{const i=e.target.closest('img[data-big]');if(!i)return;const z=document.getElementById('zoom');z.querySelector('img').src=i.dataset.big;z.style.display='flex';};
document.getElementById('zoom').onclick=e=>{e.currentTarget.style.display='none';};
draw();
</script></body></html>
`;
fs.writeFileSync(path.join(OUT, 'catalogo_cartas.html'), html);
console.log('Catálogo: ' + items.length + ' entradas → catalogo/catalogo_cartas.html y catalogo/catalogo_cartas.md');
