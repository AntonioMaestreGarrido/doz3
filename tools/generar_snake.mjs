/* Genera la carta (frente) y las dos caras de la ficha de Solid Snake (exp. 4) a partir de tools/snake/snake_arte.jpg.
   El obituario es la propia ilustración (assets/arte_alt/obituario/snake.webp, 1516×853) y se crea con el paso final.
   Uso: node tools/generar_snake.mjs   (necesita playwright y Pillow para pasar a webp) */
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { readFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ART = 'data:image/jpeg;base64,' + readFileSync(ROOT + '/tools/snake/snake_arte.jpg').toString('base64');
const SERIF = "'Liberation Serif','DejaVu Serif',Georgia,serif", SANS = "'Liberation Sans','DejaVu Sans',Arial,sans-serif";
const ICONO = '<svg viewBox="0 0 66 66" width="66" height="66"><g fill="#141414"><circle cx="33" cy="17" r="13"/><path d="M9 62c0-17 9-26 24-26s24 9 24 26z"/></g></svg>';

const CSS = `*{box-sizing:border-box;margin:0}body{background:transparent}
.card{position:relative;width:620px;overflow:hidden;border-radius:26px;border:5px solid #cdb26a;background:#120b07;font-family:${SANS};color:#fff}
.card::after{content:"";position:absolute;inset:6px;border:2px solid rgba(205,178,106,.55);border-radius:20px;pointer-events:none}
.head{position:absolute;left:0;right:0;top:0;height:100px;background:rgba(62,98,140,.9);display:flex;align-items:center;justify-content:space-between;padding:0 26px 0 50px;z-index:3}
.head h1{font:700 36px/1.1 ${SERIF};text-shadow:0 2px 3px #000;text-align:right;max-width:370px}
.pan{position:absolute;left:18px;right:18px;bottom:18px;border:2px solid #cdb26a;border-radius:20px;background:rgba(14,9,6,.86);padding:18px 22px;z-index:3}
.hab{padding:9px 2px;border-bottom:1px solid #d9c9a0}.hab:last-child{border:0}.hab b{display:block;color:#f0d58f;font-size:20px;margin-bottom:4px}.hab p{font-size:19.5px;line-height:1.42}
.pan h2{font:700 31px ${SERIF};color:#f0d58f;border-bottom:1px solid #d9c9a0;padding-bottom:6px;margin-bottom:6px;text-shadow:0 1px 2px #000}`;

const frente = () => `<style>${CSS}
.card{height:1020px}.art{position:absolute;inset:0;background:url(${ART}) 0% 66px/auto 530px no-repeat,#120b07}
.shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 50%,rgba(14,9,6,.7) 62%,#120b07 70%)}
.cls{position:absolute;left:56px;top:112px;font-size:21px;background:rgba(20,14,10,.62);padding:7px 14px;border-radius:0 12px 12px 0;z-index:3}
.fz{position:absolute;left:26px;top:168px;width:150px;height:84px;background:rgba(190,40,30,.75);font:700 54px/84px ${SANS};text-align:center;text-shadow:0 3px 5px #000;z-index:3}
.mv{position:absolute;left:26px;top:272px;width:215px;height:66px;background:rgba(150,100,55,.82);clip-path:polygon(0 0,70% 0,70% -30%,100% 50%,70% 130%,70% 100%,0 100%);font:700 52px/66px ${SANS};padding-left:92px;text-shadow:0 3px 5px #000;z-index:3}
.pan.front{padding:12px 20px}.pan.front h2{font-size:26px;margin-bottom:2px;padding-bottom:3px}.pan.front .hab{padding:6px 2px}.pan.front .hab b{font-size:18.5px;margin-bottom:2px}.pan.front .hab p{font-size:16.8px;line-height:1.32}</style>
<div class="card"><div class="art"></div><div class="shade"></div>
<div class="head"><div>${ICONO}</div><h1>Solid Snake</h1></div>
<div class="cls">Militar · Infiltración</div><div class="fz">3/2</div><div class="mv">5</div>
<div class="pan front"><h2>Habilidades</h2>
<div class="hab"><b>Infiltración</b><p>Atraviesa espacios con Zeds sin combatir ni tirar, sin coste extra de Movimiento. Al coincidir con Zeds o Saqueadores (acaba su movimiento en el espacio o entran ellos en el suyo) tira 1 dado: 1-2 combate; 3-6 pasa desapercibido y convive con ellos.</p></div>
<div class="hab"><b>Disparo silenciado</b><p>Alcance 0: solo dispara a los Zeds de su espacio con los que coexiste, con 2 columnas a favor. Con 0 Impactos lo detectan: combate Cuerpo a Cuerpo. Si elimina al objetivo, 1 Acción gratis de Mover.</p></div>
<div class="hab"><b>Despedida silenciosa</b><p>Cuando un grupo de Zeds sale del espacio que comparte con él, puede dispararles sin gastar Acción (1 Munición), sin riesgo de ser detectado. Si elimina al objetivo, recupera la Munición y tiene 1 Acción gratis de Mover en su próxima fase de Acciones.</p></div>
</div></div>`;

const ficha = red => `<style>*{box-sizing:border-box;margin:0}body{background:transparent;font-family:${SANS}}
.t{position:relative;width:220px;height:400px;border-radius:22px;overflow:hidden;border:5px solid ${red ? '#b3261e' : '#d9b94f'};background:#120b07}
.bg{position:absolute;inset:-20px;background:url(${ART}) 15% 50%/auto 440px;filter:blur(9px) brightness(.5)}
.im{position:absolute;left:0;right:0;top:46px;height:300px;background:url(${ART}) 17% 0/auto 300px no-repeat;-webkit-mask-image:linear-gradient(180deg,transparent 0,#000 14%,#000 86%,transparent 100%)}
.tag{position:absolute;left:12px;top:12px;padding:5px 14px;border-radius:12px;font:700 19px ${SANS};color:#fff;background:${red ? 'rgba(179,38,30,.92)' : 'rgba(130,100,20,.92)'};border:3px solid ${red ? '#e8e0d0' : '#f2e3a8'}}
.mv{position:absolute;left:8px;bottom:14px;width:112px;height:46px;background:linear-gradient(90deg,rgba(38,86,168,.7),rgba(38,86,168,.5));clip-path:polygon(0 0,calc(100% - 22px) 0,100% 50%,calc(100% - 22px) 100%,0 100%);font:700 32px/46px ${SANS};color:#fff;padding-left:30px;text-shadow:0 2px 3px #000}
.fz{position:absolute;right:10px;bottom:12px;width:74px;height:62px;border-radius:14px;background:rgba(20,12,8,.92);border:4px solid ${red ? '#b3261e' : '#d9b94f'};color:#f4ecdc;font:700 50px/54px ${SANS};padding-left:12px}
.fz small{font-size:18px;color:#b9b2a4;position:absolute;right:8px;bottom:5px;line-height:1}</style>
<div class="t"><div class="bg"></div><div class="im"></div><div class="tag">${red ? 'REDUCIDO' : 'COMPLETO'}</div><div class="mv">5</div><div class="fz">${red ? '2' : '3'}<small>/${red ? '3' : '2'}</small></div></div>`;

const salida = async (browser, html, w, h, destino) => {
  const page = await browser.newPage({ viewport: { width: w + 20, height: h + 20 }, deviceScaleFactor: 1 });
  await page.setContent('<body style="margin:0;padding:0">' + html + '</body>');
  await page.waitForTimeout(300);
  const png = destino.replace(/\.\w+$/, '') + '.tmp.png';
  await page.locator('.card, .t').first().screenshot({ path: png, omitBackground: true });
  await page.close(); return png;
};

const b = await chromium.launch();
mkdirSync(ROOT + '/assets/arte_alt/cartas', { recursive: true });
const tareas = [
  [frente(), 620, 1020, 'assets/arte_alt/cartas/h_snake.webp', 'assets/cartas/h_snake.jpg'],
  [ficha(false), 220, 400, 'assets/arte_alt/tokens/snake.webp', 'assets/tokens/snake.webp'],
  [ficha(true), 220, 400, 'assets/arte_alt/tokens/snake_r.webp', 'assets/tokens/snake_r.webp'],
];
for (const [html, w, h, dest, copia] of tareas) {
  const png = await salida(b, html, w, h, ROOT + '/' + dest);
  execFileSync('python3', ['-c', `from PIL import Image;Image.open(r"${png}").save(r"${ROOT}/${dest}",quality=88);import os;os.remove(r"${png}")`]);
  /* Copia para el arte por defecto (opción «Usar arte alternativo» apagada). */
  execFileSync('python3', ['-c', `from PIL import Image;im=Image.open(r"${ROOT}/${dest}");im=im.convert("RGB") if r"${copia}".endswith(".jpg") else im;im.save(r"${ROOT}/${copia}",quality=88)`]);
  console.log('ok', dest, copia);
}
await b.close();
/* Obituario: la propia ilustración a 1516×853 (como la de Ash). */
execFileSync('python3', ['-c', `from PIL import Image;im=Image.open(r"${ROOT}/tools/snake/snake_arte.jpg").convert("RGB").resize((1516,853),Image.LANCZOS);im.save(r"${ROOT}/assets/arte_alt/obituario/snake.webp",quality=86)`]);
console.log('ok assets/arte_alt/obituario/snake.webp');
