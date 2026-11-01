/* Regenera el frente de la carta de la Dra. Samantha Carter (exp. 4) con la ilustración a todo el ancho de la carta, a partir de assets/arte_alt/obituario/samcarter.webp.
   Uso: node tools/generar_samcarter.mjs   (necesita playwright y Pillow para pasar a webp/jpg) */
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ART = 'data:image/webp;base64,' + readFileSync(ROOT + '/assets/arte_alt/obituario/samcarter.webp').toString('base64');
const SERIF = "'Liberation Serif','DejaVu Serif',Georgia,serif", SANS = "'Liberation Sans','DejaVu Sans',Arial,sans-serif";
const ICONO = '<svg viewBox="0 0 70 80" width="70" height="80"><g fill="#141414"><circle cx="35" cy="22" r="17"/><path d="M6 78c0-22 12-34 29-34s29 12 29 34z"/></g></svg>';

const html = `<style>*{box-sizing:border-box;margin:0}body{background:transparent}
.card{position:relative;width:620px;height:1103px;overflow:hidden;border-radius:26px;border:5px solid #cdb26a;background:#120b07;font-family:${SANS};color:#fff}
.card::after{content:"";position:absolute;inset:6px;border:2px solid rgba(205,178,106,.55);border-radius:20px;pointer-events:none}
.art{position:absolute;inset:0;background:url(${ART}) 18% 0/auto 690px no-repeat,#120b07}
.shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 54%,rgba(14,9,6,.7) 60%,#120b07 66%)}
.head{position:absolute;left:0;right:0;top:0;height:100px;background:rgba(112,101,55,.92);display:flex;align-items:center;justify-content:space-between;padding:0 26px 0 50px;z-index:3}
.head h1{font:700 36px/1.1 ${SERIF};text-shadow:0 2px 3px #000;text-align:right}
.cls{position:absolute;left:56px;top:112px;font-size:21px;background:rgba(20,14,10,.62);padding:7px 14px;border-radius:0 12px 12px 0;z-index:3}
.fz{position:absolute;left:26px;top:168px;width:150px;height:84px;background:rgba(190,40,30,.75);font:700 54px/84px ${SERIF};text-align:center;text-shadow:0 3px 5px #000;z-index:3}
.mv{position:absolute;left:26px;top:272px;width:215px;height:66px;background:rgba(150,100,55,.82);clip-path:polygon(0 0,70% 0,70% -30%,100% 50%,70% 130%,70% 100%,0 100%);font:700 52px/66px ${SERIF};padding-left:92px;text-shadow:0 3px 5px #000;z-index:3}
.pan{position:absolute;left:18px;right:18px;bottom:18px;top:640px;border:2px solid #cdb26a;border-radius:20px;background:rgba(14,9,6,.88);padding:14px 22px;z-index:3}
.pan h2{font:700 31px ${SERIF};color:#f0d58f;border-bottom:1px solid #d9c9a0;padding-bottom:6px;margin-bottom:4px;text-shadow:0 1px 2px #000}
.hab{padding:8px 2px;border-bottom:1px solid #d9c9a0}.hab:last-child{border:0}.hab b{display:block;color:#f0d58f;font-size:19.5px;margin-bottom:3px}.hab p{font-size:19px;line-height:1.38}</style>
<div class="card"><div class="art"></div><div class="shade"></div>
<div class="head"><div>${ICONO}</div><h1>Dra. Samantha Carter</h1></div>
<div class="cls">Científica</div><div class="fz">3/2</div><div class="mv">4</div>
<div class="pan"><h2>Habilidades</h2>
<div class="hab"><b>Científica</b><p>Puede entrar en el Laboratorio, donde puede Investigar.</p></div>
<div class="hab"><b>Teoría del campo unificado</b><p>+1 a la tirada de Investigar (máx. 6). Una vez por partida, repite una tirada de Investigación fallida (la segunda es definitiva).</p></div>
<div class="hab"><b>Oficial de la USAF</b><p>1 columna a favor al disparar.</p></div>
<div class="hab"><b>En el último segundo</b><p>Una vez por partida, cuando la Infección vaya a subir 2 o más (o a llegar a 13), cancela hasta 3 de esa subida.</p></div></div></div>`;

const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 660, height: 1140 }, deviceScaleFactor: 1 });
await page.setContent('<body style="margin:0">' + html + '</body>'); await page.waitForTimeout(300);
const png = ROOT + '/assets/arte_alt/cartas/h_samcarter.tmp.png';
await page.locator('.card').first().screenshot({ path: png, omitBackground: true });
await b.close();
execFileSync('python3', ['-c', `from PIL import Image;import os;im=Image.open(r"${png}");im.save(r"${ROOT}/assets/arte_alt/cartas/h_samcarter.webp",quality=88);im.convert("RGB").save(r"${ROOT}/assets/cartas/h_samcarter.jpg",quality=88);os.remove(r"${png}")`]);
console.log('ok h_samcarter');
