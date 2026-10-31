/* Genera la carta (frente y trasera) y las dos caras de la ficha del SAR (exp. 4) a partir de tools/sar/sar_arte.jpg.
   Uso: node tools/generar_sar.mjs   (necesita playwright y Pillow para pasar a webp) */
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ART = 'data:image/jpeg;base64,' + readFileSync(ROOT + '/tools/sar/sar_arte.jpg').toString('base64');
const NARANJA = ['#c75a14', '#a8440c'];
const SERIF = "'Liberation Serif','DejaVu Serif',Georgia,serif", SANS = "'Liberation Sans','DejaVu Sans',Arial,sans-serif";
const ICONO = '<svg viewBox="0 0 106 66" width="106" height="66"><g fill="#141414"><circle cx="20" cy="18" r="12"/><path d="M0 62c0-18 8-28 20-28s20 10 20 28z"/><circle cx="86" cy="18" r="12"/><path d="M66 62c0-18 8-28 20-28s20 10 20 28z"/><circle cx="53" cy="22" r="15"/><path d="M28 66c0-22 11-34 25-34s25 12 25 34z"/></g></svg>';

const CSS = `*{box-sizing:border-box;margin:0}body{background:transparent}
.card{position:relative;width:620px;overflow:hidden;border-radius:26px;border:5px solid #cdb26a;background:#120b07;font-family:${SANS};color:#fff}
.card::after{content:"";position:absolute;inset:6px;border:2px solid rgba(205,178,106,.55);border-radius:20px;pointer-events:none}
.head{position:absolute;left:0;right:0;top:0;height:100px;background:linear-gradient(180deg,${NARANJA[0]},${NARANJA[1]} 85%,rgba(168,68,12,.0));display:flex;align-items:center;justify-content:space-between;padding:0 26px 0 50px;z-index:3}
.head h1{font:700 33px/1.1 ${SERIF};text-shadow:0 2px 3px #000;text-align:right;max-width:370px}
.pan{position:absolute;left:18px;right:18px;bottom:18px;border:2px solid #cdb26a;border-radius:20px;background:rgba(14,9,6,.86);padding:18px 22px;z-index:3}
.pan h2{font:700 31px ${SERIF};color:#f0d58f;border-bottom:1px solid #d9c9a0;padding-bottom:6px;margin-bottom:6px;text-shadow:0 1px 2px #000}
.hab{padding:9px 2px;border-bottom:1px solid #d9c9a0}.hab:last-child{border:0}.hab b{display:block;color:#f0d58f;font-size:20px;margin-bottom:4px}.hab p{font-size:19.5px;line-height:1.42}`;

const frente = () => `<style>${CSS}
.card{height:968px}.art{position:absolute;inset:0;background:url(${ART}) 38% 0/auto 760px no-repeat,#120b07}
.shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 40%,rgba(14,9,6,.65) 62%,#120b07 82%)}
.cls{position:absolute;left:56px;top:112px;font-size:21px;background:rgba(20,14,10,.62);padding:7px 14px;border-radius:0 12px 12px 0;z-index:3}
.fz{position:absolute;left:26px;top:196px;width:150px;height:90px;background:rgba(190,40,30,.75);font:700 58px/90px ${SANS};text-align:center;text-shadow:0 3px 5px #000;z-index:3}
.mv{position:absolute;left:26px;top:446px;width:215px;height:72px;background:rgba(150,100,55,.82);clip-path:polygon(0 0,70% 0,70% -30%,100% 50%,70% 130%,70% 100%,0 100%);font:700 56px/72px ${SANS};padding-left:92px;text-shadow:0 3px 5px #000;z-index:3}</style>
<div class="card"><div class="art"></div><div class="shade"></div>
<div class="head"><div>${ICONO}</div><h1>Búsqueda y Rescate (SAR)</h1></div>
<div class="cls">Civiles Heroicos</div><div class="fz">3/2</div><div class="mv">3</div>
<div class="pan" style="top:586px"><h2>Habilidades</h2>
<div class="hab"><b>Despejar</b><p>Acción de Personaje (1 Acción), una vez por turno, aunque haya Caos en su espacio: en el Mantenimiento quita 2 fichas de Caos de ese espacio sin subir la Infección.</p></div>
<div class="hab"><b>Escudo humano</b><p>1 columna a favor en Cuerpo a Cuerpo y al disparar mientras haya Refugiados o Aldeanos en su espacio.</p></div></div></div>`;

const trasera = () => `<style>${CSS}
.card{height:939px}.card .head{position:relative;height:100px}.card{background:#241a12}
.pan{top:118px;bottom:18px}.pan p{font-size:24px;line-height:1.55;margin-bottom:20px}.pan h2{font-size:34px}.pan p.cita{font-style:italic;color:#f0d58f}</style>
<div class="card"><div class="head" style="justify-content:center;padding:0"><h1 style="text-align:center;max-width:none;font-size:34px">Búsqueda y Rescate (SAR)</h1></div>
<div class="pan"><h2>Trasfondo</h2>
<p>Cuando se cortaron las carreteras y la ciudad se llenó de ruido, el Equipo de Búsqueda y Rescate del Condado fue el primero en salir. Sin sirenas ni órdenes: solo mochilas, cuerdas, camillas y una lista de nombres que nadie les había pedido que buscaran.</p>
<p>Sus voluntarios llevan años recorriendo cada sendero, cada túnel y cada tejado de Farmingdale. Saben abrir paso donde parece imposible y no se detienen hasta que el último de los suyos está a salvo.</p>
<p>Ahora la ciudad es el monte más peligroso que han visto. Despejan las calles, escoltan a los Refugiados hasta el Centro y combaten con más rabia cuando hay alguien detrás a quien proteger.</p>
<p class="cita">«No dejamos a nadie atrás. Ni siquiera cuando es lo más sensato.»</p></div></div>`;

const ficha = red => `<style>*{box-sizing:border-box;margin:0}body{background:transparent;font-family:${SANS}}
.t{position:relative;width:400px;height:230px;border-radius:22px;overflow:hidden;border:5px solid ${red ? '#b3261e' : '#d9b94f'};background:url(${ART}) 36% 0/auto 230px no-repeat,#120b07}
.tag{position:absolute;left:12px;top:10px;padding:5px 16px;border-radius:14px;font:700 21px ${SANS};color:#fff;background:${red ? 'rgba(179,38,30,.92)' : 'rgba(130,100,20,.92)'};border:3px solid ${red ? '#e8e0d0' : '#f2e3a8'}}
.mv{position:absolute;left:8px;bottom:12px;width:136px;height:50px;background:linear-gradient(90deg,rgba(38,86,168,.7),rgba(38,86,168,.5));clip-path:polygon(0 0,calc(100% - 28px) 0,100% 50%,calc(100% - 28px) 100%,0 100%);font:700 34px/50px ${SANS};color:#fff;padding-left:38px;text-shadow:0 2px 3px #000}
.fz{position:absolute;right:12px;bottom:12px;width:74px;height:62px;border-radius:14px;background:rgba(20,12,8,.92);border:4px solid ${red ? '#b3261e' : '#d9b94f'};color:#f4ecdc;font:700 50px/54px ${SANS};padding-left:12px}
.fz small{font-size:18px;color:#b9b2a4;position:absolute;right:8px;bottom:5px;line-height:1}</style>
<div class="t"><div class="tag">${red ? 'REDUCIDO' : 'COMPLETO'}</div><div class="mv">3</div><div class="fz">${red ? '2' : '3'}<small>/${red ? '3' : '2'}</small></div></div>`;

const salida = async (browser, html, w, h, destino, omitir = true) => {
  const page = await browser.newPage({ viewport: { width: w + 20, height: h + 20 }, deviceScaleFactor: 1 });
  await page.setContent('<body style="margin:0;padding:0">' + html + '</body>');
  await page.waitForTimeout(300);
  const el = await page.locator('.card, .t').first();
  const png = destino.replace(/\.\w+$/, '') + '.tmp.png';
  await el.screenshot({ path: png, omitBackground: omitir });
  await page.close(); return png;
};

const b = await chromium.launch();
mkdirSync(ROOT + '/assets/arte_alt/cartas', { recursive: true });
const tareas = [
  [frente(), 620, 968, 'assets/arte_alt/cartas/h_sar.webp'], [trasera(), 620, 939, 'assets/arte_alt/cartas/hb_sar.webp'],
  [ficha(false), 400, 230, 'assets/arte_alt/tokens/sar.webp'], [ficha(true), 400, 230, 'assets/arte_alt/tokens/sar_r.webp'],
];
for (const [html, w, h, dest] of tareas) {
  const png = await salida(b, html, w, h, ROOT + '/' + dest);
  execFileSync('python3', ['-c', `from PIL import Image;Image.open(r"${png}").save(r"${ROOT}/${dest}",quality=88);import os;os.remove(r"${png}")`]);
  console.log('ok', dest);
  /* Copias para el arte por defecto (opción «Usar arte alternativo» apagada). */
  const copia = { 'h_sar.webp': 'assets/cartas/h_sar.jpg', 'hb_sar.webp': 'assets/cartas/hb_sar.jpg', 'sar.webp': 'assets/tokens/sar.webp', 'sar_r.webp': 'assets/tokens/sar_r.webp' }[dest.split('/').pop()];
  execFileSync('python3', ['-c', `from PIL import Image;Image.open(r"${ROOT}/${dest}").convert("RGB").save(r"${ROOT}/${copia}",quality=88)`]);
}
await b.close();
