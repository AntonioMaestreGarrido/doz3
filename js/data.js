/* Dawn of the Zeds, 3.ª edición — datos del juego (extraídos del material original). */
'use strict';

/* ========== MAPA ==========
   Cada ruta: índice 0 = espacio Inicial; el último índice es el espacio de Ciudad adyacente al Centro.
   Número de espacio = (último índice) − índice.  kind: init | plain | named | pueblo | city | crypt */
const ROUTE_IDS = ['B', 'M', 'A', 'F', 'T'];
const SURFACE = ['B', 'M', 'A', 'F'];
const ROUTES = {
  B: { name: 'Ruta del Bosque', short: 'Bosque', color: '#5fae3a', spaces: [
    { kind: 'init',   x: 80,   y: 590 },
    { kind: 'plain',  x: 135,  y: 345 },
    { kind: 'plain',  x: 210,  y: 200 },
    { kind: 'pueblo', x: 385,  y: 100, name: 'St. Thomas' },
    { kind: 'named',  x: 645,  y: 105, name: 'Granja' },
    { kind: 'plain',  x: 925,  y: 90 },
    { kind: 'plain',  x: 1030, y: 240 },
    { kind: 'city',   x: 910,  y: 355, name: 'Distrito Comercial' } ] },
  M: { name: 'Ruta de la Montaña', short: 'Montaña', color: '#d9822b', spaces: [
    { kind: 'init',   x: 1905, y: 825 },
    { kind: 'plain',  x: 1870, y: 620 },
    { kind: 'pueblo', x: 1860, y: 380, name: 'El Paso del Zurdo' },
    { kind: 'named',  x: 1860, y: 110, name: 'Mina Lucky Strike' },
    { kind: 'plain',  x: 1600, y: 145 },
    { kind: 'named',  x: 1490, y: 305, name: 'Campamento' },
    { kind: 'plain',  x: 1340, y: 425 },
    { kind: 'city',   x: 1180, y: 485, name: 'Zona Este' } ] },
  A: { name: 'Ruta de la Autovía', short: 'Autovía', color: '#3c7fc4', spaces: [
    { kind: 'init',   x: 1905, y: 1420 },
    { kind: 'plain',  x: 1750, y: 1265 },
    { kind: 'pueblo', x: 1695, y: 1110, name: 'Ingeburg' },
    { kind: 'plain',  x: 1665, y: 975 },
    { kind: 'named',  x: 1560, y: 810, name: 'Central nuclear' },
    { kind: 'plain',  x: 1405, y: 740 },
    { kind: 'plain',  x: 1255, y: 800 },
    { kind: 'city',   x: 1110, y: 670, name: 'Barrios Altos' } ] },
  F: { name: 'Ruta de las Afueras', short: 'Afueras', color: '#d8b82c', spaces: [
    { kind: 'init',   x: 90,  y: 1450 },
    { kind: 'plain',  x: 335, y: 1465 },
    { kind: 'pueblo', x: 150, y: 1325, name: 'Irek Este' },
    { kind: 'named',  x: 545, y: 1290, name: 'Universidad de Farmingdale' },
    { kind: 'pueblo', x: 300, y: 1020, name: 'Beauxville' },
    { kind: 'plain',  x: 610, y: 1050 },
    { kind: 'named',  x: 690, y: 880,  name: 'Puente colgante' },
    { kind: 'city',   x: 755, y: 640,  name: 'Suburbios' } ] },
  T: { name: 'Ruta del Túnel', short: 'Túnel', color: '#c0392b', spaces: [
    { kind: 'init',   x: 936,  y: 1404 },
    { kind: 'named',  x: 943,  y: 1243, name: 'Laboratorio de Chromotechnics' },
    { kind: 'plain',  x: 1421, y: 1314 },
    { kind: 'crypt',  x: 1379, y: 1143 },
    { kind: 'named',  x: 1390, y: 990,  name: 'Oficina del Dr. Marteuse' },
    { kind: 'crypt',  x: 1114, y: 986 },
    { kind: 'named',  x: 871,  y: 1071, name: 'Garita de Seguridad' },
    { kind: 'plain',  x: 914,  y: 871 },
    { kind: 'city',   x: 943,  y: 707,  name: 'Subsuelo del Centro' } ] }
};
const CENTRO = { x: 905, y: 520, name: 'Centro de la Ciudad' };
/* Espacios fuera de ruta (conectados al Centro) */
const EXTRA_SPACES = {
  H1: { kind: 'bed', x: 478, y: 432, name: 'Cama de Hospital 1' },
  H2: { kind: 'bed', x: 495, y: 528, name: 'Cama de Hospital 2' },
  H3: { kind: 'bed', x: 566, y: 598, name: 'Cama de Hospital 3' },
  H4: { kind: 'bed', x: 636, y: 560, name: 'Cama de Hospital 4' },
  O1: { kind: 'office', x: 552, y: 340, name: 'Oficina del Personal 1' },
  O2: { kind: 'office', x: 660, y: 322, name: 'Oficina del Personal 2' },
  LAB: { kind: 'lab', x: 1169, y: 335, name: 'Laboratorio' },
  CAMP: { kind: 'camp', x: 1336, y: 70, name: 'Campo de Refugiados' }
};
const BEDS = ['H1', 'H2', 'H3', 'H4'];

/* ========== FICHAS ZED ==========
   34 Zeds normales [completa, reducida] y Súper Zeds. Todas las caras de Fuerza completa soportan 3 Impactos
   (2 + el que da la vuelta) y las reducidas otros 3. */
const ZED_TOKENS = [
  [2,1],[3,2],[3,1],[4,1],[4,3],[4,2],[4,2],[4,2],[4,2],[5,2],[5,2],[5,1],
  [5,4],[5,4],[5,3],[5,3],[5,3],[5,3],[5,3],[5,3],[6,1],[6,4],[6,4],[6,4],
  [6,3],[6,3],[6,3],[6,3],[6,3],[7,4],[7,5],[7,5],[8,4],[9,4]
];
const SUPER_ZEDS = {
  lobo:       { name: 'Zeds-Lobo',   full: 5,  red: 3, img: 'sz_lobo',       txt: 'Combatir contra ellos sube la Infección +2 (en vez de +1). Tras mover, intentan un segundo movimiento (solos).' },
  supurador:  { name: 'Supuradores', full: 5,  red: 3, img: 'sz_supurador',  txt: 'Todo combate Cuerpo a Cuerpo contra ellos (o su Horda) sube la Infección +3 en vez de +1.' },
  berserker:  { name: 'Berserkers',  full: 7,  red: 4, img: 'sz_berserker',  txt: 'Si atacan y ganan, avanzan de inmediato otro espacio (se repite), separándose de la Horda.' },
  devastador: { name: 'Devastadores', full: 1, red: 8, img: 'sz_devastador', txt: 'Fuerza 1 intactos… pero al ser heridos pasan a Fuerza 8.' },
  reanimador: { name: 'Reanimadores', full: 4, red: 3, img: 'sz_reanimador', txt: 'Cada vez que se activan retiran 1 Impacto de sí mismos antes de mover.' },
  condenado:  { name: 'Condenados',  full: 7,  red: 5, img: 'sz_condenado',  txt: 'Quien combate contra ellos pierde automáticamente y se retira (los Impactos se aplican igualmente).' },
  ferreo:     { name: 'Férreos',     full: 10, red: 5, img: 'sz_ferreo',     txt: 'Resistentes: cada Impacto se cancela con 1-3 en un dado.' },
  gigante:    { name: 'Gigantes',    full: 12, red: 6, img: 'sz_gigante',    txt: 'Sin habilidades especiales: simplemente enormes.' },
  saltarin:   { name: 'Saltarines',  full: 4,  red: 2, img: 'sz_saltarin',   txt: 'Sus defensores no reciben Modificador por Terreno (ni siquiera Bastión).' }
};
const SPREADERS = {
  alimanas: { name: 'Alimañas Infectadas', full: 2, red: 1, img: 'zed' },
  noelle:   { name: 'Noelle «Hell» Razer', full: 3, red: 2, img: 'noelle' }
};
/* Civiles Normales [completa, reducida] (resisten 4 Impactos) */
const CIV_TOKENS = [[3,1],[3,1],[2,1],[2,1],[2,1],[2,1],[4,2]];

/* ========== HÉROES Y CIVILES HEROICOS ==========
   full/red = Fuerza; mp = Movimiento; hf/hr = Impactos que soporta cada cara; res: 'r' Resistente (4-6 ignora),
   'f' Reforzada (5-6 ignora). rapi: Rapinador. dr: Diamante Rojo (sale de Criptas sin tirar). */
const HEROES = {
  piazza:    { name: 'Capitana Piazza',    type: 'hero', cls: 'Militar',    full: 3, red: 2, mp: 5, img: 'piazza',    card: 'h_piazza',    lv: 1,
    txt: ['<b>Francotiradora de élite:</b> disparos de Largo Alcance hasta 3 espacios (no a través del Centro). Fuerza 2 a 1 espacio, 4 a 2 espacios, 3 a 3 espacios.', '<b>Vigilancia:</b> tras disparar puede retroceder 1 espacio (con las unidades que quiera de su espacio).', '<b>Fabricar Munición:</b> gasta 2 Acciones para disparar sin gastar Munición.'] },
  hernandez: { name: 'Alcalde Hernández',  type: 'hero', cls: 'Ciudadano',  full: 2, red: 1, mp: 4, img: 'hernandez', card: 'h_hernandez', lv: 1, dr: 1,
    txt: ['<b>Llaves de la Ciudad:</b> +1 a las tiradas de Buscar de cualquier unidad en espacios de Ciudad y en el Centro.', '<b>Control del tráfico:</b> entrar en el Centro cuesta 0 de Movimiento.', '<b>Ciudadela:</b> Acción de Personaje: una unidad del Centro realiza un disparo gratis (1 Munición) con 1 columna a favor.', '<b>Discurso Motivador:</b> una vez por partida: cada unidad de jugador en la Ciudad o el Centro recibe 1 Acción gratis.'] },
  schmidt:   { name: 'Ayudante Schmidt',   type: 'hero', cls: 'Policía',    full: 4, red: 2, mp: 4, img: 'schmidt',   card: 'h_schmidt',   lv: 1, res: 'r',
    txt: ['<b>Iniciativa:</b> una Acción de Personaje por fase de Acciones, solo para su unidad.', '<b>Boy Scout de rango Águila:</b> 1 columna a favor en combates Cuerpo a Cuerpo.', '<b>Resistente:</b> cada Impacto se ignora con 4-6.', '<b>Artes marciales:</b> en cada combate Cuerpo a Cuerpo puede repetir la tirada (la segunda es definitiva).'] },
  hunt:      { name: 'Sheriff Hunt',       type: 'hero', cls: 'Policía',    full: 5, red: 3, mp: 4, img: 'hunt',      card: 'h_hunt',      lv: 1, res: 'r', dr: 1,
    txt: ['<b>Liderazgo:</b> Acción de Personaje: da 1 Acción gratis a una unidad de Civiles o Refugiados en su espacio o adyacente.', '<b>Largo Alcance:</b> dispara a 2 espacios con 1 columna en contra.', '<b>Resistente:</b> cada Impacto se ignora con 4-6.', '<b>Artes marciales:</b> puede repetir la tirada de combate Cuerpo a Cuerpo.'] },
  hauser:    { name: 'Otto «Sargento» Hauser', type: 'hero', cls: 'Militar', full: 3, red: 2, mp: 4, img: 'hauser', lv: 4, res: 'r',
    txt: ['<b>Entrenar:</b> como una Acción: una unidad de Civiles Normales en su espacio o adyacente recibe +2 de Fuerza (hasta ser eliminada).', '<b>Reclutar:</b> en el Centro, como una Acción y por 1 Munición retira 1 Impacto a unas Civiles Normales del mapa (no del Hospital).', '<b>Buscar:</b> +1 a sus tiradas de Buscar.', '<b>Resistente:</b> ignora Impactos con 4-6.'] },
  johnson:   { name: 'Sr. Johnson',        type: 'hero', cls: 'Rapiñador',  full: 3, red: 2, mp: 4, img: 'johnson',   lv: 1, rapi: 1,
    txt: ['<b>Al entrar en juego:</b> obtienes 2 Suministros y 3 de Munición.', '<b>Rapiñador:</b> tira 2 dados al Buscar y elige el mejor (dobles naturales: resultado doble).', '<b>Armas:</b> sus ataques con Arma de Fuego tienen 2 columnas a favor.', '<b>Trampas:</b> cuando una unidad Zed entra en su espacio tira 1 dado: 1-3 combate normal; 4-6 el Zed sufre 1 Impacto y Johnson retrocede.', '<b>Curar:</b> Acción (1 Suministro) para Curar a una unidad en su espacio o adyacente.'] },
  kingman:   { name: 'Coronel Kingman',    type: 'hero', cls: 'Militar',    full: 3, red: 2, mp: 4, img: 'kingman',   lv: 2,
    txt: ['<b>Bastión:</b> una vez por partida, 1 Acción + 3 Suministros: ficha de Bastión (Terreno 3, permanente).', '<b>Campo de Minas:</b> una vez por partida, 1 Acción + 2 Suministros + 1 Munición.', '<b>Defensor:</b> 1 columna a favor al defender.', '<b>Perímetro Defensivo:</b> cuando un Zed se mueve a su espacio o a uno adyacente: tira 1 dado, con 5-6 el movimiento se cancela.'] },
  pepinillos:{ name: 'Pepinillos (pastor alemán)', type: 'hero', cls: 'Rapiñador', full: 2, red: 1, mp: 6, img: 'pepinillos', lv: 2, rapi: 1, dr: 1, nofire: 1,
    txt: ['<b>Rápido:</b> mueve 6 espacios y no lo detiene el Caos.', '<b>Rapiñador:</b> tira 2 dados al Buscar (solo 1 en espacios controlados por Zeds, donde sí puede buscar).', '<b>Sigilo:</b> al coincidir con Zeds o Saqueadores tira 1 dado: 1 combate Cuerpo a Cuerpo; 2-6 sigiloso, las unidades coexisten sin efecto.', '<b>Ladrido ruidoso:</b> cuando un Zed o Saqueador intenta salir de su espacio: 4-6 cancela el movimiento.', '<b>Perruno:</b> no dispara, construye, usa vehículos, restaura el orden ni arresta; el Caos no lo detiene.'] },
  santana:   { name: 'Miguel «El Toro Loco» Santana', type: 'hero', cls: 'Luchador', full: 6, red: 4, mp: 3, img: 'santana', lv: 2,
    txt: ['<b>Carga del Toro:</b> al atacar Cuerpo a Cuerpo a Zeds normales: 1-3 combate normal; 4-6 el Zed sufre 1 Impacto y se retira sin combate (sin Infección).', 'Fuerza 6/4 en combate pero solo 3/2 al disparar. Mueve 3 espacios.'] },
  darling:   { name: 'Alyssa Darling',     type: 'hero', cls: 'Ciudadana',  full: 3, red: 2, mp: 5, img: 'darling',   lv: 3, res: 'f',
    txt: ['<b>Ataque asesino:</b> al entrar con Zeds (o al entrar ellos) tira 1 dado: 1 combate normal; 2 puedes retroceder 1 espacio o luchar; 3-6 ataque con 2 columnas a favor, sin Infección ni daño para ella.', '<b>Reforzada:</b> ignora Impactos con 5-6. Mueve 5.'] },
  staub:     { name: 'Rusty Staub',        type: 'hero', cls: 'Ciudadano',  full: 4, red: 5, mp: 4, img: 'staub',     lv: 2, res: 'f',
    txt: ['<b>Buscar:</b> obtienes 1 Suministro extra al Buscar con él.', '<b>Primer disparo gratis:</b> su primer disparo del turno no gasta Munición.', '<b>Suertudo:</b> en su tirada de Salvación tira 2 dados y elige el mejor. Reforzado.', '<b>Feroz:</b> herido, su Fuerza Cuerpo a Cuerpo sube a 5 y la de sus disparos baja a 2.'] },
  horacio:   { name: 'Horacio (chimpancé)', type: 'civh', cls: 'Primate',   full: 4, red: 3, mp: 4, img: 'horacio',   lv: 4, dr: 1, res: 'r', nofire: 1, hf: 2, hr: 2, redo: 1,
    txt: ['<b>Los frutos del trabajo:</b> al entrar en juego obtienes 3 Suministros.', '<b>Modificaciones genéticas:</b> nunca sube la Infección al atacar o defender en combate Cuerpo a Cuerpo.', '<b>Resistente:</b> ignora Impactos con 4-6.', '<b>Tácticas de gorila:</b> en cada combate Cuerpo a Cuerpo puede repetir la tirada (la segunda es definitiva).', '<b>El gran simio:</b> no dispara. Resiste 4 Impactos como las Civiles.'] },
  seaver:    { name: 'Doc Seaver',         type: 'hero', cls: 'Científico', full: 3, red: 1, mp: 4, img: 'seaver',    lv: 3, dr: 1,
    txt: ['<b>Científico:</b> puede entrar en las Oficinas del Hospital y en el Laboratorio (donde puede Investigar).', '<b>Médico:</b> una vez por fase de Acciones, en una Oficina, cura (Acción de Personaje) a cualquier unidad del Hospital.', '<b>Primeros Auxilios (1 Suministro):</b> una vez por fase cura a una unidad en su espacio o adyacente (incluso a sí mismo). Estando en una Oficina o en el Centro puede curar a una unidad del Hospital.', '<b>Administración del Hospital:</b> en una Oficina admite un cuarto paciente, que puede quedarse aunque se vaya.'] },
  agee:      { name: 'Profesora Agee',     type: 'hero', cls: 'Científica', full: 2, red: 1, mp: 4, img: 'agee',      lv: 3, dr: 1,
    txt: ['<b>En una Oficina del Hospital:</b> cada Acción de Curar reduce la Infección en 2.', '<b>En el Laboratorio:</b> +1 a tiradas de Investigación (máx. 6).', '<b>Madre de la Ciencia:</b> con la Súper Arma, restaurar el orden reduce la Infección 2.', 'Una vez por turno: +3 Infección a cambio de 1 Acción de Evento extra.'] },
  jones:     { name: 'Alan «Xeno» Jones',  type: 'hero', cls: 'Científico', full: 4, red: 3, mp: 4, img: 'jones',     lv: 4,
    txt: ['<b>Sus Propios Planes:</b> una Acción de Personaje por fase de Acciones, solo para su unidad.', '<b>Pistola experimental:</b> sus disparos cuestan 1 Suministro en vez de Munición.', '<b>En una Oficina del Hospital:</b> con su Acción de Personaje manda 1 unidad del Hospital al Cementerio y revela la siguiente carta de Investigación (no cuenta como Investigar).', 'Puede Investigar en el Laboratorio.'] },
  wright:    { name: 'Agente Especial Wright', type: 'hero', cls: 'Científica', full: 4, red: 2, mp: 4, img: 'wright', lv: 3, dr: 1, res: 'f',
    txt: ['<b>Equipo de apoyo:</b> 1 columna a favor en combates y disparos.', '<b>Información clasificada:</b> 1 Acción: mira la carta superior del mazo de Eventos.', '<b>En las Oficinas del Hospital:</b> +1 a las tiradas de Salvación de las unidades de jugador.', '<b>Reforzada:</b> ignora Impactos con 5-6.'] },
  wilson:    { name: 'Wilson el Ermitaño', type: 'hero', cls: 'Rapiñador',  full: 2, red: 1, mp: 4, img: 'wilson',    lv: 4, rapi: 1, dr: 1,
    txt: ['<b>Rapiñador:</b> tira 2 dados al Buscar.', '<b>Visiones:</b> puedes mirar la carta superior del mazo de Destino en cualquier momento.', '<b>Compañero:</b> la unidad agrupada con él tira 1 dado extra y elige los mejores (no en el Centro).'] },
  furias:    { name: 'Furias de Farmingdale', type: 'civh', cls: 'Civiles Heroicos', full: 6, red: 3, mp: 4, img: 'furias', lv: 1, res: 'r', nofire: 1, hf: 2, hr: 2, card: 'h_furias',
    txt: ['<b>Luchadoras:</b> no pueden disparar con Arma de Fuego.', '<b>Resistentes:</b> ignoran Impactos con 4-6. Mueven 4.'] },
  bomberos:  { name: 'Voluntarios de Bomberos 129', type: 'civh', cls: 'Civiles Heroicos', full: 3, red: 2, mp: 3, img: 'bomberos', lv: 2, hf: 2, hr: 2, bonus: 1,
    txt: ['1 columna a favor en todos los combates Cuerpo a Cuerpo.', '<b>Autoridad Civil:</b> Acción de Personaje: libera Civiles Resistiendo o convierte Aldeanos en Refugiados (en o adyacente a un Pueblo).', '<b>Mangueras:</b> tira 2 dados; si el total ≥ a la Fuerza de un Zed adyacente, se retira.'] },
  bauer:     { name: 'Cuadrilla de Bob Bauer', type: 'civh', cls: 'Civiles Heroicos', full: 3, red: 2, mp: 3, img: 'bauer', lv: 2, hf: 2, hr: 2,
    txt: ['<b>Dispositivos explosivos:</b> Acción de Personaje: convierte 2 Suministros en 1 Munición. Construye Barricadas por 1 Suministro.'] },
  antidist:  { name: 'F.D.P.D. Antidisturbios', type: 'civh', cls: 'Civiles Heroicos', full: 5, red: 3, mp: 3, img: 'antidist', lv: 2, hf: 2, hr: 2, nofire: 1,
    txt: ['Nunca suben la Infección al combatir ni al restaurar el orden. No disparan.'] },
  salvacion: { name: 'Tropas de Salvación',  type: 'civh', cls: 'Civiles Heroicos', full: 2, red: 1, mp: 3, img: 'salvacion', lv: 1, hf: 2, hr: 2,
    txt: ['<b>Al entrar en juego:</b> 2 Suministros.', '<b>Campamento Médico:</b> Acción de Personaje (1 Suministro): cura a una unidad en su espacio o adyacente.', '+1 a la tirada de Alimentación.'] },
  clarin:    { name: 'Mensajero del Clarín', type: 'civh', cls: 'Civiles Heroicos', full: 1, red: 1, mp: 3, img: 'clarin', lv: 3, hf: 2, hr: 2,
    txt: ['Al entrar en juego trae otras Civiles Heroicos. Mientras esté en juego un Zed que llega al Centro no gana automáticamente: tiene que ganar un combate. El segundo Suministro gastado cada fase es gratis.'] },
  wzed:      { name: 'WZED Farmingdale',   type: 'civh', cls: 'Civiles Heroicos', full: 1, red: 1, mp: 3, img: 'wzed', lv: 3, hf: 2, hr: 2,
    txt: ['<b>Transmisión de Emergencia:</b> Acción de Personaje: 1 Acción gratis a una Civil Normal o Refugiados en la superficie.', 'Al defender en la Ciudad o el Centro tiras 1 dado extra y eliges los mejores.'] },
  division12:{ name: '12.ª División de Veteranos', type: 'civh', cls: 'Civiles Heroicos', full: 3, red: 2, mp: 3, img: 'division12', lv: 1, hf: 2, hr: 2,
    txt: ['Su primer disparo del turno no gasta Munición. Gana todo combate Cuerpo a Cuerpo contra Zeds (los Zeds se retiran, sin importar la tirada).'] }
};
const CIVH_POOL = ['furias', 'bomberos', 'bauer', 'antidist', 'salvacion', 'clarin', 'wzed', 'division12'];
const CIV = { name: 'Civiles', type: 'civ', full: 4, red: 2, mp: 2, hf: 2, hr: 2 };
const SPECIALS = {
  aldeanos:  { name: 'Aldeanos', type: 'aldeano', full: 1, red: 1, mp: 1, txt: ['Inmóviles. No cuentan para el límite de agrupamiento. Cuando los Zeds ocupan su Pueblo se convierten en Refugiados y huyen 1 espacio.'] },
  refugiados:{ name: 'Refugiados', type: 'refugee', full: 1, red: 1, mp: 1, txt: ['Solo pueden moverse (1 espacio por Acción de Mover). No luchan ni se retiran. Los Zeds que los alcancen sin defensores los devoran (+2 Infección).'] },
  vip:       { name: 'Supervivientes V.I.P.', type: 'refugee', full: 1, red: 1, mp: 1, vip: 1, txt: ['Se comportan como Refugiados. Al llegar al Centro eliges un beneficio especial.'] },
  saqueadores: { name: 'Saqueadores', type: 'raider', full: 6, red: 3, mp: 1, txt: ['Se mueven 1 espacio por turno hacia el Centro en la fase 4R. Luchan contra todo salvo Refugiados/Aldeanos. Si llegan al Centro pierdes Suministros y Munición igual a su Fuerza.'] },
  bubba:     { name: 'Banda de Bubba', type: 'raider', full: 6, red: 3, mp: 1, bubba: 1, txt: ['Como los Saqueadores, con 1 columna a favor contra Zeds y 1 en contra contra jugadores. Si llegan al Centro infligen 1 Impacto a cada unidad en la Ciudad.'] },
  marines:   { name: 'Marines', type: 'marine', full: 5, red: 3, mp: 3, bonus: 1, txt: ['Civiles Especiales Militares. 1 columna a favor al combatir. Disparos de Largo Alcance (con 1 en contra). Mueven 1 espacio gratis en la fase 4R. Traen 4 de Munición.'] },
  guardia:   { name: 'Guardia Nacional', type: 'guard', full: 10, red: 6, mp: 1, hf: 3, hr: 3, txt: ['Soporta 6 Impactos. Mueve 1 espacio en 4R y 1 por Acción de Mover (solo superficie). Cada disparo cuesta 2 Munición.'] },
  petra:     { name: 'Ángeles de Petra', type: 'civh', full: 4, red: 3, mp: 4, hf: 2, hr: 2, txt: ['Motos: 4 espacios en la superficie. Sus disparos cuestan 1 Suministro en vez de Munición.'] },
  diamante:  { name: 'Guardia de Seguridad Diamante Rojo', type: 'civh', full: 4, red: 3, mp: 3, dr: 1, hf: 2, hr: 2, txt: ['Civiles Especiales Policiales. Salen de las Criptas sin tirar. Mueven 3.'] }
};

/* ========== TABLAS DE COMBATE (de la Ayuda del jugador) ========== */
const CAC_COLS = ['Zeds ×3', 'Zeds ×2', 'Ventaja Zed', 'Igual', 'Ventaja humana', 'Humanos ×2', 'Humanos ×3'];
const CAC_ROWS = ['2', '3-4', '5-6', '7', '8-9', '10-11', '12'];
const CAC = [
  [[0,5],[0,5],[0,4],[0,4],[0,3],[1,3],[2,2]],
  [[0,5],[0,4],[0,3],[0,3],[1,3],[2,2],[2,1]],
  [[0,4],[0,3],[1,3],[1,2],[2,2],[2,1],[3,1]],
  [[0,3],[0,3],[1,2],[2,2],[2,1],[3,1],[3,0]],
  [[0,2],[1,2],[2,2],[2,1],[3,1],[3,0],[3,0]],
  [[1,2],[2,2],[2,1],[3,1],[3,0],[3,0],[4,0]],
  [[2,2],[2,1],[2,0],[3,0],[4,0],[4,0],[5,0]]
];
const CAC_HUMAN_LOSES = [6, 5, 4, 3, 2, 1, 0];   // columnas (0..) que pierde el bando humano en cada fila
const FIRE = [
  [0,0,0,0,0,1,2],
  [0,0,0,0,1,2,2],
  [0,0,1,1,2,2,3],
  [0,0,1,2,2,3,3],
  [0,1,2,2,3,3,3],
  [1,2,2,3,3,3,4],
  [2,2,2,3,4,4,5]
];
function sumRow(sum) { return sum <= 2 ? 0 : sum <= 4 ? 1 : sum <= 6 ? 2 : sum === 7 ? 3 : sum <= 9 ? 4 : sum <= 11 ? 5 : 6; }

/* ========== NIVELES ==========
   cols: colores de cartas (b azul, g verde, y amarilla, o naranja, r roja). La tabla de mazo da, por Acto (I-IV):
   [Eventos Especiales, Eventos Normales]. Se elige una longitud de partida (solitario). */
const LEVELS = [
  { n: 0, name: 'Juego Básico', sub: 'Reglas básicas: Mover, Combatir, Buscar.', board: 'A', cols: ['b'], nb: 1, infection: 0, supplies: 0, res: 0, doz: 0,
    lengths: [{ name: 'Corta', sp: [0,1,1,1], no: [2,5,3,2] }, { name: 'Normal', sp: [0,1,1,1], no: [3,6,4,3] }] },
  { n: 1, name: 'Nivel I: ¡Epidemia!', sub: 'Infección, Brotes, Curación, Suministros.', board: 'A', cols: ['b'], infection: 1, supplies: 1, res: 0,
    lengths: [{ name: 'Corta', sp: [0,1,1,1], no: [2,5,4,2] }, { name: 'Normal', sp: [0,1,1,1], no: [3,6,4,3] }] },
  { n: 2, name: 'Nivel II: ¡Apocalipsis!', sub: 'Fase 4R, Caos, Barricadas, Refugiados.', board: 'A', cols: ['b', 'g'], infection: 1, supplies: 1, res: 0, chaos: 10, fourR: 1,
    lengths: [{ name: 'Corta', sp: [0,1,2,2], no: [2,6,4,2] }, { name: 'Normal', sp: [0,1,2,2], no: [3,8,6,3] }, { name: 'Media', sp: [0,2,2,2], no: [4,9,8,4] }] },
  { n: 3, name: 'Nivel III: ¡Cerebros!', sub: 'Investigación, Antídoto y Súper Arma.', board: 'A', cols: ['b', 'g', 'y'], infection: 1, supplies: 1, res: 1, chaos: 10, fourR: 1,
    lengths: [{ name: 'Corta', sp: [0,2,2,2], no: [2,5,4,2], inv: 3 }, { name: 'Normal', sp: [0,2,2,2], no: [3,7,6,3], inv: 4 }, { name: 'Media', sp: [0,2,2,3], no: [4,9,8,3], inv: 5 }, { name: 'Larga', sp: [0,2,3,3], no: [5,11,9,4], inv: 6 }, { name: 'Épica', sp: [0,3,3,3], no: [6,12,11,5], inv: 7 }] },
  { n: 4, name: 'Nivel IV: ¡Los Zeds Vivientes!', sub: 'La ruta del Túnel, Criptas y Súper Zeds.', board: 'B', cols: ['b', 'g', 'y', 'o'], infection: 1, supplies: 1, res: 1, chaos: 12, fourR: 1, tunnel: 1,
    lengths: [{ name: 'Corta', sp: [0,3,2,2], no: [2,4,4,2], inv: 3 }, { name: 'Normal', sp: [0,3,2,2], no: [3,6,6,3], inv: 4 }, { name: 'Media', sp: [0,3,2,3], no: [4,8,8,3], inv: 5 }, { name: 'Larga', sp: [0,3,3,3], no: [5,10,9,4], inv: 6 }, { name: 'Épica', sp: [0,4,3,3], no: [6,11,11,5], inv: 7 }] },
  { n: 5, name: 'Nivel V: ¡Montaje del Director!', sub: 'Todas las cartas. Pocas probabilidades de ganar.', board: 'B', cols: ['b', 'g', 'y', 'o', 'r'], infection: 1, supplies: 1, res: 1, chaos: 12, fourR: 1, tunnel: 1,
    lengths: [{ name: 'Corta', sp: [0,3,3,2], no: [2,4,4,2], inv: 3 }, { name: 'Normal', sp: [0,3,3,2], no: [3,6,6,3], inv: 4 }, { name: 'Media', sp: [0,3,3,3], no: [4,8,8,3], inv: 5 }, { name: 'Larga', sp: [0,3,4,3], no: [5,10,9,4], inv: 6 }, { name: 'Épica', sp: [0,4,4,3], no: [6,11,11,5], inv: 7 }] }
];
