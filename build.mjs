/* Build de producción: junta los <script> de index.html (en su orden) en un único js minificado,
   minifica el css y copia el resto a dist/. Los scripts son globales (sin módulos), así que se
   concatenan y se transforman SIN renombrar nombres de primer nivel. */
import { transform } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const OUT = 'dist';
const html = readFileSync('index.html', 'utf8');
const srcs = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
if (!srcs.length) throw new Error('No se encontraron scripts en index.html');

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const code = srcs.map(s => `/* ${s} */\n` + readFileSync(s, 'utf8')).join('\n;\n');
const js = await transform(code, { minify: true, target: 'es2020', legalComments: 'none' });
const css = await transform(readFileSync('style.css', 'utf8'), { loader: 'css', minify: true });

const hash = (s) => createHash('sha1').update(s).digest('hex').slice(0, 8);
const jsName = `app.${hash(js.code)}.js`, cssName = `style.${hash(css.code)}.css`;
writeFileSync(`${OUT}/${jsName}`, js.code);
writeFileSync(`${OUT}/${cssName}`, css.code);

let out = html.replace('href="style.css"', `href="${cssName}"`);
let first = true;
out = out.replace(/<script src="[^"]+"><\/script>\n?/g, () => { if (!first) return ''; first = false; return `<script src="${jsName}"></script>\n`; });
writeFileSync(`${OUT}/index.html`, out);

/* Recursos estáticos (sin fuentes de trabajo ni textos de apoyo). */
for (const d of ['assets', 'icons']) if (existsSync(d)) cpSync(d, `${OUT}/${d}`, { recursive: true });
cpSync('manifest.webmanifest', `${OUT}/manifest.webmanifest`);

/* Service worker con la lista de precarga de los ficheros ya empaquetados. */
let sw = readFileSync('sw.js', 'utf8');
const shell = ['./', 'index.html', cssName, jsName, 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'assets/portada.jpg', 'assets/fondo_nueva.webp', 'assets/fondo_ranking.webp'];
sw = sw.replace(/const CACHE = '[^']*';/, `const CACHE = 'doz3-${hash(js.code + css.code)}';`)
       .replace(/const SHELL = \[[\s\S]*?\];/, `const SHELL = ${JSON.stringify(shell)};`);
writeFileSync(`${OUT}/sw.js`, sw);

const kb = n => (n / 1024).toFixed(0) + ' KB';
console.log(`JS  ${kb(Buffer.byteLength(code))} -> ${kb(Buffer.byteLength(js.code))}\nCSS ${kb(readFileSync('style.css').length)} -> ${kb(Buffer.byteLength(css.code))}\n${jsName}  ${cssName}`);
