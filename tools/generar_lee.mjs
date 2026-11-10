/* Regenera el panel de habilidades de la carta del General Lee (arte alternativo, exp. 1) SIN tocar la ilustración, la cabecera ni las fichas.
   Dibuja un panel nuevo encima del antiguo (mismas posiciones) sobre assets/arte_alt/cartas/h_lee.webp. Repetible.
   Uso: node tools/generar_lee.mjs   (necesita playwright y Pillow). */
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SERIF = "'Liberation Serif','DejaVu Serif',Georgia,serif", SANS = "'Liberation Sans','DejaVu Sans',Arial,sans-serif";
/* Rectángulo del panel en la carta de 620×1256 (borde dorado incluido). */
const X = 17, Y = 591, W = 586, H = 647;

const html = `<style>*{box-sizing:border-box;margin:0}body{background:transparent;font-family:${SANS};color:#fff}
.pan{width:${W}px;height:${H}px;border:2px solid #cdb26a;border-radius:20px;background:#100a07;padding:12px 20px;overflow:hidden}
.pan h2{font:700 29px ${SERIF};color:#f0d58f;border-bottom:1px solid #d9c9a0;padding-bottom:4px;margin-bottom:2px;text-shadow:0 1px 2px #000}
.hab{padding:6px 2px;border-bottom:1px solid #d9c9a0}.hab:last-child{border:0}.hab b{display:block;color:#f0d58f;font-size:18px;margin-bottom:2px}.hab p{font-size:17px;line-height:1.32}</style>
<div class="pan"><h2>Habilidades</h2>
<div class="hab"><b>Ensillar</b><p>Puede llevar a un Héroe humano o primate no montado como parte de 1 Acción de Mover (viaje gratis para el jinete). Cuentan como una sola unidad para el agrupamiento.</p></div>
<div class="hab"><b>Carga de caballería</b><p>Cualquier Héroe agrupado con Lee suma 1 de Fuerza y no sube la Infección al combatir.</p></div>
<div class="hab"><b>Purasangre</b><p>Recibe 1 Acción de Mover gratis por fase de Acciones.</p></div>
<div class="hab"><b>Instinto equino</b><p>No puede entrar voluntariamente en un espacio con Caos ni en el Túnel con jinete. Al llegar al Centro con un jinete, este puede bajarse allí o pasar a una cama libre del Hospital.</p></div>
<div class="hab"><b>Un caballo es un caballo</b><p>No sube la Infección, no dispara, construye, usa vehículos, restaura ni arresta. Puede elegir retirarse antes de ser atacado.</p></div></div>`;

const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: W + 20, height: H + 20 }, deviceScaleFactor: 1 });
await page.setContent('<body style="margin:0">' + html + '</body>'); await page.waitForTimeout(300);
const png = ROOT + '/assets/arte_alt/cartas/h_lee.panel.tmp.png';
await page.locator('.pan').screenshot({ path: png, omitBackground: true });
await b.close();
execFileSync('python3', ['-c', `
from PIL import Image
import os
p=Image.open(r"${png}").convert("RGBA")
dest=r"${ROOT}/assets/arte_alt/cartas/h_lee.webp"
base=Image.open(dest).convert("RGBA"); base.alpha_composite(p,(${X},${Y})); base.save(dest,quality=90)
os.remove(r"${png}")
`]);
console.log('ok h_lee (panel)');
