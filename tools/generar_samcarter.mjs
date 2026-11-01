/* Regenera el panel de habilidades de la carta de la Dra. Samantha Carter (exp. 4) SIN tocar la ilustración, la cabecera ni las fichas de Fuerza y Movimiento.
   Dibuja un panel nuevo encima del antiguo (mismas posiciones) sobre assets/arte_alt/cartas/h_samcarter.webp y assets/cartas/h_samcarter.jpg.
   Uso: node tools/generar_samcarter.mjs   (necesita playwright y Pillow). Es repetible: el panel nuevo cubre siempre el mismo rectángulo. */
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SERIF = "'Liberation Serif','DejaVu Serif',Georgia,serif", SANS = "'Liberation Sans','DejaVu Sans',Arial,sans-serif";
/* Rectángulo del panel en la carta de 620×1103 (borde dorado incluido). */
const X = 17, Y = 591, W = 586, H = 489;

const html = `<style>*{box-sizing:border-box;margin:0}body{background:transparent;font-family:${SANS};color:#fff}
.pan{width:${W}px;height:${H}px;border:2px solid #cdb26a;border-radius:20px;background:#100a07;padding:14px 22px;overflow:hidden}
.pan h2{font:700 31px ${SERIF};color:#f0d58f;border-bottom:1px solid #d9c9a0;padding-bottom:6px;margin-bottom:2px;text-shadow:0 1px 2px #000}
.hab{padding:7px 2px;border-bottom:1px solid #d9c9a0}.hab:last-child{border:0}.hab b{display:block;color:#f0d58f;font-size:19.5px;margin-bottom:2px}.hab p{font-size:19px;line-height:1.34}</style>
<div class="pan"><h2>Habilidades</h2>
<div class="hab"><b>Científica</b><p>Puede entrar en el Laboratorio, donde puede Investigar.</p></div>
<div class="hab"><b>Teoría del campo unificado</b><p>+1 a la tirada de Investigar (máx. 6).</p></div>
<div class="hab"><b>Contramedidas</b><p>El primer intento de Investigar de cada turno, con éxito o no, reduce la Infección en 2.</p></div>
<div class="hab"><b>Oficial de la USAF</b><p>1 columna a favor al disparar.</p></div>
<div class="hab"><b>En el último segundo</b><p>Una vez por partida, cuando la Infección vaya a subir 2 o más (o a llegar a 13), cancela hasta 5 de esa subida.</p></div></div>`;

const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: W + 20, height: H + 20 }, deviceScaleFactor: 1 });
await page.setContent('<body style="margin:0">' + html + '</body>'); await page.waitForTimeout(300);
const png = ROOT + '/assets/arte_alt/cartas/h_samcarter.panel.tmp.png';
await page.locator('.pan').screenshot({ path: png, omitBackground: true });
await b.close();
execFileSync('python3', ['-c', `
from PIL import Image
import os
p=Image.open(r"${png}").convert("RGBA")
for dest,rgb in [(r"${ROOT}/assets/arte_alt/cartas/h_samcarter.webp",False),(r"${ROOT}/assets/cartas/h_samcarter.jpg",True)]:
    base=Image.open(dest).convert("RGBA")
    base.alpha_composite(p,(${X},${Y}))
    (base.convert("RGB") if rgb else base).save(dest,quality=90)
os.remove(r"${png}")
`]);
console.log('ok h_samcarter (panel)');
