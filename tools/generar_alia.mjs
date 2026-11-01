/* Regenera el panel de habilidades de la carta de Alia (arte alternativo, exp. 4) SIN tocar la ilustración, la cabecera ni las fichas de Fuerza y Movimiento.
   Dibuja un panel nuevo encima del antiguo (mismas posiciones) sobre assets/arte_alt/cartas/h_alia.webp. Repetible: el panel nuevo cubre siempre el mismo rectángulo.
   Uso: node tools/generar_alia.mjs   (necesita playwright y Pillow). La carta del arte por defecto (assets/cartas/h_alia.jpg) es otro diseño y no se toca aquí. */
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SERIF = "'Liberation Serif','DejaVu Serif',Georgia,serif", SANS = "'Liberation Sans','DejaVu Sans',Arial,sans-serif";
/* Rectángulo del panel en la carta de 620×1371 (borde dorado incluido). */
const X = 17, Y = 591, W = 586, H = 757;

const html = `<style>*{box-sizing:border-box;margin:0}body{background:transparent;font-family:${SANS};color:#fff}
.pan{width:${W}px;height:${H}px;border:2px solid #cdb26a;border-radius:20px;background:#100a07;padding:14px 22px;overflow:hidden}
.pan h2{font:700 31px ${SERIF};color:#f0d58f;border-bottom:1px solid #d9c9a0;padding-bottom:6px;margin-bottom:2px;text-shadow:0 1px 2px #000}
.hab{padding:7px 2px;border-bottom:1px solid #d9c9a0}.hab:last-child{border:0}.hab b{display:block;color:#f0d58f;font-size:19.5px;margin-bottom:4px}.hab p{font-size:19px;line-height:1.38}</style>
<div class="pan"><h2>Habilidades</h2>
<div class="hab"><b>Sigilo</b><p>Puede atravesar espacios con Zeds sin combatir, sin coste extra de Movimiento. Debe acabar en un espacio libre de Zeds e ignora el Caos al moverse.</p></div>
<div class="hab"><b>Emboscada (katana)</b><p>+2 columnas al atacar Cuerpo a Cuerpo a Zeds situados más cerca del Centro que ella en la misma ruta (se compara su posición antes del ataque).</p></div>
<div class="hab"><b>Evasión</b><p>Al entrar un Zed en su espacio, puede intentar evadirlo (opcional): tira 1 dado. Con 4-6 se retira gratis 1 espacio hacia el Centro, si está libre de Zeds, antes de combatir.</p></div>
<div class="hab"><b>Parada perfecta</b><p>+1 columna al defender en Cuerpo a Cuerpo. Una vez por turno repite una tirada defensiva; vale el segundo resultado.</p></div>
<div class="hab"><b>Ya no es hora de estar en la calle</b><p>Acción de Personaje, 1 vez por fase de Acciones: mueve gratis hasta 2 espacios hacia el Centro a una unidad de Civiles, Civiles Heroicos o Refugiados en su espacio o adyacente.</p></div>
<div class="hab"><b>A que voy yo y lo encuentro</b><p>Al Buscar, tira 2 dados y elige el mejor resultado.</p></div></div>`;

const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: W + 20, height: H + 20 }, deviceScaleFactor: 1 });
await page.setContent('<body style="margin:0">' + html + '</body>'); await page.waitForTimeout(300);
const png = ROOT + '/assets/arte_alt/cartas/h_alia.panel.tmp.png';
await page.locator('.pan').screenshot({ path: png, omitBackground: true });
await b.close();
execFileSync('python3', ['-c', `
from PIL import Image
import os
p=Image.open(r"${png}").convert("RGBA")
dest=r"${ROOT}/assets/arte_alt/cartas/h_alia.webp"
base=Image.open(dest).convert("RGBA"); base.alpha_composite(p,(${X},${Y})); base.save(dest,quality=90)
os.remove(r"${png}")
`]);
console.log('ok h_alia (panel)');
