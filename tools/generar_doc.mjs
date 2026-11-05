/* Regenera el panel de habilidades de la carta de Doc Brown (arte alternativo, exp. 4) SIN tocar la ilustración, la cabecera ni las fichas.
   Dibuja un panel nuevo encima del antiguo (mismas posiciones) sobre assets/arte_alt/cartas/h_doc.webp. Repetible.
   Uso: node tools/generar_doc.mjs   (necesita playwright y Pillow). */
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SERIF = "'Liberation Serif','DejaVu Serif',Georgia,serif", SANS = "'Liberation Sans','DejaVu Sans',Arial,sans-serif";
/* Rectángulo del panel en la carta de 620×1219 (borde dorado incluido). */
const X = 17, Y = 591, W = 586, H = 610;

const html = `<style>*{box-sizing:border-box;margin:0}body{background:transparent;font-family:${SANS};color:#fff}
.pan{width:${W}px;height:${H}px;border:2px solid #cdb26a;border-radius:20px;background:#100a07;padding:12px 20px;overflow:hidden}
.pan h2{font:700 29px ${SERIF};color:#f0d58f;border-bottom:1px solid #d9c9a0;padding-bottom:4px;margin-bottom:2px;text-shadow:0 1px 2px #000}
.hab{padding:7px 2px;border-bottom:1px solid #d9c9a0}.hab:last-child{border:0}.hab b{display:block;color:#f0d58f;font-size:19px;margin-bottom:2px}.hab p{font-size:18px;line-height:1.32}</style>
<div class="pan"><h2>Habilidades</h2>
<div class="hab"><b>Científico</b><p>Puede entrar en el Laboratorio, donde puede Investigar. +1 a las tiradas de Investigar (máx. 6).</p></div>
<div class="hab"><b>Mr. Fusion</b><p>Si al Buscar no encuentra nada, obtiene 1 Suministro.</p></div>
<div class="hab"><b>Salto temporal</b><p>Acción de Personaje (3 Suministros), una vez por turno, solo desde el Centro. Doc, con una unidad agrupada con él si quiere, viaja a un espacio de ruta de superficie sin Zeds que no sea Inicial. La unidad acompañante puede quedarse allí (no pueden acompañarlo Pepinillos, Horacio, el General Lee ni Carter). Doc vuelve al Centro al final del turno, tras el Mantenimiento, y puede volver solo, con la unidad que llevó o con otra que esté en su espacio.</p></div>
<div class="hab"><b>Paradoja</b><p>Si Doc está en un espacio con Caos durante el Mantenimiento, restaurar el orden allí no sube la Infección.</p></div></div>`;

const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: W + 20, height: H + 20 }, deviceScaleFactor: 1 });
await page.setContent('<body style="margin:0">' + html + '</body>'); await page.waitForTimeout(300);
const png = ROOT + '/assets/arte_alt/cartas/h_doc.panel.tmp.png';
await page.locator('.pan').screenshot({ path: png, omitBackground: true });
await b.close();
execFileSync('python3', ['-c', `
from PIL import Image
import os
p=Image.open(r"${png}").convert("RGBA")
dest=r"${ROOT}/assets/arte_alt/cartas/h_doc.webp"
base=Image.open(dest).convert("RGBA"); base.alpha_composite(p,(${X},${Y})); base.save(dest,quality=90)
os.remove(r"${png}")
`]);
console.log('ok h_doc (panel)');
