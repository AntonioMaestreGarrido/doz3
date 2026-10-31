/* Expansiones: 1 «Un paso al frente», 2 «El blues del novato», 3 «Rumores y ferrocarriles», 4 «Fiesta privada» (Fanmade). */
'use strict';
/* ---------- datos ---------- */
Object.assign(HEROES, {
  may:    { name: 'Sra. May Hauser', type: 'hero', cls: 'Ciudadana', full: 3, red: 1, mp: 4, img: 'may', card: 'h_may', lv: 1, exp: 1,
    txt: ['<b>Intendente ahorradora:</b> si está en un espacio de Ciudad, por cada Munición que pierdas o gastes tiras 1 dado: con 5-6 no la pierdes.', '<b>La voluntaria de hierro:</b> en una Oficina del Hospital, las unidades dadas de alta en la fase de Acciones obtienen 1 Acción gratis.', '<b>Entrenadora de combate:</b> cada unidad de jugador agrupada con ella (incluso en el Centro) recibe +1 de Fuerza en combate Cuerpo a Cuerpo.', '<b>Pistolera de primera:</b> 1 columna a favor al disparar y tira 1 dado extra (eliges los 2 mejores). Su primer disparo del turno no gasta Munición.'] },
  betty:  { name: 'Betty «Saltarina» Bolívar', type: 'hero', cls: 'Ciudadana', full: 3, red: 2, mp: 4, img: 'betty', card: 'h_betty', lv: 1, exp: 2, nofire: 1, special: 'betty',
    txt: ['<b>Miope:</b> no puede disparar.', '<b>Despiadada:</b> lucha siempre en la columna «Humanos ×3» (cara completa) o «Humanos ×2» (cara reducida), atacando o defendiendo, sin otros modificadores. Los modificadores de cartas especiales, Súper Arma y repetir tiradas sí se aplican. Agrupada con Wilson tira 3 dados.', '<b>Temeraria:</b> cuando gana un combate contra Zeds, si en el siguiente espacio hacia el Centro hay Zeds, entra y ataca de nuevo (sube la Infección como siempre). Solo la detiene ser eliminada o no haber más Zeds. Ignora Caos y el Puente.', '<b>Inmortal:</b> en su tirada de Salvación tira 2 dados y elige el mejor.'] },
  carter: { name: 'Carter «Ruedas Grandes»', type: 'hero', cls: 'Montado', full: 8, red: 4, mp: 5, img: 'carter', card: 'h_carter', lv: 3, exp: 1, nofire: 1, hf: 3, hr: 3, special: 'carter',
    txt: ['<b>El rey de la carretera:</b> solo rutas de la superficie; no dispara, arresta ni usa otros vehículos; no sube la Infección al combatir. No tiene que parar al conducir por el Caos (pero no empieza un movimiento desde él).', '<b>Transportista de Cargamento:</b> entra por un Inicial con la ficha en «Cargado». Al llegar al Centro cargado, el movimiento termina: +5 Suministros y +3 Munición, y se da la vuelta a «Vacío». Recarga en un Inicial con 1 Acción.', '<b>Barrer Zeds:</b> al cruzar un espacio con Zeds (si le quedan puntos): 1 dado, 4-6 inflige 1 Impacto a cada Zed y sigue; si falla se detiene y combate.', '<b>Reparar:</b> solo sufre Impactos su camión (6 en total). En el Centro o un Inicial retira 1 Impacto por turno (1 Suministro o 1 Acción).'] },
  lee:    { name: 'General Lee', type: 'hero', cls: 'Equino', full: 2, red: 1, mp: 6, img: 'lee', card: 'h_lee', lv: 2, exp: 1, nofire: 1, special: 'lee',
    txt: ['<b>Ensillar:</b> puede llevar a un Héroe humano o primate no montado como parte de 1 Acción de Mover (viaje gratis para el jinete). Cuentan como una sola unidad para el agrupamiento.', '<b>Carga de caballería:</b> cualquier Héroe agrupado con Lee suma 1 de Fuerza y no sube la Infección al combatir.', '<b>Purasangre:</b> recibe 1 Acción de Mover gratis por fase de Acciones.', '<b>Instinto equino:</b> cuando no transporta a un jinete, no puede entrar voluntariamente en un espacio con Caos ni en la ruta del Túnel. Puede llevar a un herido al Hospital («Galope al Hospital»).', '<b>Un caballo es un caballo:</b> no sube la Infección, no dispara, construye, usa vehículos, restaura ni arresta. Puede elegir retirarse antes de ser atacado.'] },
  jaque:  { name: 'Jaque Mates™', type: 'civh', cls: 'Civiles Heroicos', full: 1, red: 1, mp: 3, img: 'jaque', card: 'h_jaque', lv: 2, exp: 1, hf: 2, hr: 2, special: 'jaque',
    txt: ['<b>Estrategas:</b> al comienzo de cada fase de Acciones tira 1 dado: si es mayor que tus Acciones de Evento, obtienes 1 Acción de Evento más (incluso por encima de 4).', '<b>Ruse de jeu:</b> por cada Refugiados en el Campo de Refugiados su Fuerza aumenta +1 (cara completa) y +½ (cara reducida, redondeando abajo).'] },
  porter: { name: 'Antonio «Porter» Maestre', type: 'hero', cls: 'Ciudadano', full: 5, red: 3, mp: 4, img: 'porter', card: 'h_porter', lv: 1, exp: 4, res: 'f',
    txt: ['<b>Artes marciales:</b> +1 columna a favor al defender Cuerpo a Cuerpo. Puede repetir cualquier tirada Cuerpo a Cuerpo (la segunda es definitiva).', '<b>En zapatillas no se puede pasar:</b> si un Zed intenta entrar en su espacio o en uno adyacente, con 4-6 se cancela su movimiento. Máximo 1 por fase de los Zeds; los fallos no cuentan. Antes del combate.', '<b>Jefe de equipo:</b> Acción de Personaje, 1 vez por fase de Acciones: 1 Acción gratis a una unidad de Civiles (normales o heroicos) en su espacio o adyacente.', '<b>Resistente:</b> ignora Impactos con 5-6.'] },
  alia:   { name: 'Alia «Ghost (of Tsushima)»', type: 'hero', cls: 'Ciudadana', full: 4, red: 2, mp: 5, img: 'alia', card: 'h_alia', lv: 2, exp: 4, rapi: 1,
    txt: ['<b>Sigilo:</b> puede atravesar espacios con Zeds sin combatir; cada uno cuesta 2 de Movimiento. Debe acabar en un espacio libre de Zeds e ignora el Caos al moverse.', '<b>Emboscada (katana):</b> +2 columnas al atacar Cuerpo a Cuerpo a Zeds situados más cerca del Centro que ella en la misma ruta (se compara su posición antes del ataque).', '<b>Evasión:</b> al entrar un Zed en su espacio, puedes intentar evadirlo (opcional): tira 1 dado. Con 4-6 se retira gratis 1 espacio hacia el Centro, si está libre de Zeds, antes de combatir.', '<b>Parada perfecta:</b> +1 columna al defender Cuerpo a Cuerpo. Una vez por turno repite una tirada defensiva; vale el segundo resultado.', '<b>Ya no es hora de estar en la calle:</b> Acción de Personaje, 1 vez por fase de Acciones: mueve gratis hasta 2 espacios hacia el Centro a una unidad de Civiles (normales o heroicos) o Refugiados en su espacio o adyacente.', '<b>A que voy yo y lo encuentro:</b> al Buscar, tira 2 dados y elige el mejor resultado (con dobles naturales busca dos veces, como un Rapiñador).'] },
  bender: { name: 'Bender Bending Rodríguez', type: 'hero', cls: 'Robot', full: 4, red: 2, mp: 4, img: 'bender', card: 'h_bender', lv: 1, exp: 4, res: 'b', hf: 2, hr: 2,
    txt: ['<b>Cuerpo de Titanio:</b> recibe 2 Impactos por cara. Resistente: al recibir un Impacto tira 1 dado; con 1-3 el Impacto se cancela. Sus combates Cuerpo a Cuerpo nunca suben la Infección.', '<b>Reparación Alcohólica:</b> las unidades médicas no pueden curarlo de forma habitual. Si sufre su último Impacto y supera la Salvación, va al Hospital con ficha de ECG. La primera Curación en el Hospital le retira el ECG. Después solo puede curarse en el Centro, gastando 1 Suministro y una vez por turno.', '<b>Abstinencia Robótica:</b> si hay Escasez de Suministros en la Alimentación, Bender no sufre Impactos: durante el siguiente turno tiene 1 columna en contra en sus ataques y defensas.'] },
  ash: { name: 'Ash Williams «El Jefe»', type: 'hero', cls: 'Cazador', full: 4, red: 2, mp: 3, img: 'ash', card: 'h_ash', lv: 2, exp: 4,
    txt: ['<b>«¡Traga plomo!» (Disparo Defensivo):</b> cuando una unidad o Horda Zed entra en su espacio, puedes disparar antes del combate Cuerpo a Cuerpo (1 Munición). Si los Zeds sobreviven, el combate procede normalmente.', '<b>«Groovy» (Maestría en Combate 1►):</b> en cualquier combate Cuerpo a Cuerpo en el que participe, atacando o defendiendo, obtiene 1 columna a favor.'] },
  frank: { name: 'Frank «El Castigador» Castle', type: 'hero', cls: 'Militar', full: 4, red: 3, mp: 4, img: 'frank', lv: 3, exp: 4, res: 'r',
    txt: ['<b>Arsenal privado:</b> al entrar en juego obtienes 4 de Munición y 2 Suministros.', '<b>Tirador implacable:</b> 1 columna a favor al disparar. Una vez por turno puede repetir una tirada de disparo (la segunda es definitiva).', '<b>Sin piedad:</b> si gana un combate Cuerpo a Cuerpo, la Infección no sube.', '<b>Lobo solitario:</b> solo en su espacio, 1 columna a favor al defender. Agrupado con otros Héroes pierde esa columna y la de Tirador implacable.', '<b>Trampa explosiva:</b> Acción de Personaje (1 Suministro): coloca una trampa en su espacio o en uno adyacente de una ruta (también en el Túnel), sin Zeds y no Inicial. Solo una por ruta. Cuando un Zed intenta entrar en ese espacio, cada unidad Zed que entraba sufre 1 Impacto y su movimiento se cancela. La trampa se retira.', '<b>Resistente:</b> ignora Impactos con 4-6.'] },
  doc: { name: 'Dr. Emmett «Doc» Brown', type: 'hero', cls: 'Científico', full: 2, red: 1, mp: 4, img: 'doc', lv: 3, exp: 4,
    txt: ['<b>Científico:</b> puede entrar en el Laboratorio, donde puede Investigar.', '<b>Mr. Fusion:</b> si al Buscar no encuentra nada, obtiene 1 Suministro.', '<b>Salto temporal:</b> Acción de Personaje (3 Suministros), una vez por turno, solo desde el Centro. Doc, con una unidad agrupada con él si quiere, viaja a un espacio de ruta de superficie sin Zeds que no sea Inicial. La unidad acompañante puede quedarse allí (no pueden acompañarlo Pepinillos, Horacio, el General Lee ni Carter). Doc vuelve al Centro al final del turno, tras el Mantenimiento, y puede volver solo, con la unidad que llevó o con otra que esté en su espacio.', '<b>Paradoja:</b> si Doc está en un espacio con Caos durante el Mantenimiento, restaurar el orden allí no sube la Infección.'] },
  samcarter: { name: 'Dra. Samantha Carter', type: 'hero', cls: 'Científica', full: 3, red: 2, mp: 4, img: 'samcarter', lv: 3, exp: 4,
    txt: ['<b>Científica:</b> puede entrar en el Laboratorio, donde puede Investigar.', '<b>Teoría del campo unificado:</b> +1 a la tirada de Investigar (máx. 6). Una vez por partida, repite una tirada de Investigación fallida (la segunda es definitiva).', '<b>Oficial de la USAF:</b> 1 columna a favor al disparar.', '<b>En el último segundo:</b> una vez por partida, cuando la Infección vaya a subir 2 o más (o a llegar a 13), cancela hasta 3 de esa subida.'] },
  macgyver: { name: 'Angus MacGyver', type: 'hero', cls: 'Ciudadano', full: 3, red: 2, mp: 4, img: 'macgyver', lv: 2, exp: 4, nofire: 1, sci: 1,
    txt: ['<b>Pacifista:</b> no dispara con armas de fuego.', '<b>Ingeniero:</b> puede entrar en el Laboratorio, donde puede Investigar. Si la tirada falla por 1, puede gastar 1 Suministro para sumarle +1.', '<b>Con lo que hay:</b> Acción de Personaje (1 vez por turno): convierte 1 Suministro en 2 Munición.', '<b>Cinta americana:</b> construye Barricadas por 1 Suministro.', '<b>Siempre hay otra salida:</b> al ser atacado por Zeds en una ruta, tira 1 dado: con 4-6 se retira gratis 1 espacio hacia el Centro antes del combate.'] },
  sar: { name: 'Búsqueda y Rescate (SAR)', type: 'civh', cls: 'Civiles Heroicos', full: 3, red: 2, mp: 3, img: 'sar', card: 'h_sar', lv: 2, exp: 4, hf: 2, hr: 2,
    txt: ['<b>Despejar:</b> Acción de Personaje (1 Acción), una vez por turno, aunque haya Caos en su espacio: en el Mantenimiento quita 2 fichas de Caos de ese espacio sin subir la Infección.', '<b>Escudo humano:</b> 1 columna a favor en combates Cuerpo a Cuerpo y al disparar mientras haya Refugiados o Aldeanos en su espacio.'] },
  heli: { name: 'Helicóptero Medevac', type: 'hero', cls: 'Aeronave', full: 2, red: 1, mp: 3, mpTxt: '*', img: 'heli', card: 'h_heli', lv: 2, exp: 4, hf: 2, hr: 2, nofire: 1,
    txt: ['<b>Combustible de reserva:</b> al entrar en juego obtienes 3 Suministros.', '<b>Vuelo:</b> su Movimiento es *: no usa la Acción de Mover, solo se mueve volando. Acción de Personaje (1 Suministro), una vez por turno: el helicóptero y un Héroe de su espacio despegan y quedan en el aire, y eliges qué ruta patrullan el resto del turno. Aterrizan después, gratis, donde quieran (cualquier espacio de superficie sin Zeds que no sea Inicial), o siguen en el aire. No pueden llevar a Pepinillos, Horacio, el General Lee ni Carter.', '<b>Patrulla:</b> al despegar eliges la ruta que patrulla el resto del turno. Al inicio de cada turno siguiente, tras revelar el Evento, si sigue en el aire paga 1 Suministro y vuelve a elegir ruta, o aterriza gratis. Mira la siguiente carta de Evento. En esa ruta, todo el turno: <b>Maniobra de distracción</b> (reacción, una vez por turno: antes de que una unidad o Horda Zed se mueva, tira 1 dado; con 3-6 no se mueve, y si falla no puede reintentarlo) y los Zeds tienen 1 columna en contra en todos los combates.', '<b>Despegue de emergencia:</b> cuando una unidad Zed entra en su espacio, tira 1 dado antes del combate: 1 combate normal y no despega; 2 combate normal y, si sigue vivo, despega; 3-6 despega sin combate. Al despegar paga 1 Suministro, puede llevarse al Héroe de su espacio y eliges qué ruta patrulla el resto del turno.', '<b>En el aire:</b> ni el helicóptero ni su Héroe pueden ser atacados ni realizar Acciones.', '<b>Aterrizaje:</b> gratis en cualquier momento de la fase de Acciones, en un espacio de superficie sin Zeds que no sea Inicial. Puede dejar al Héroe en una Cama libre del Hospital (sin ECG ni Infección); si aterriza en un espacio, el Héroe recibe 1 Acción gratis.', '<b>Mantenimiento:</b> recibe 2 Impactos por cara. Las unidades médicas no pueden repararlo de forma habitual: si cae al Hospital, una Curación le retira el ECG; después solo se repara en el Centro, pagando 1 Suministro, una vez por turno.', '<b>No dispara.</b>'] },
  caza: { name: 'Club de Caza de Farmingdale', type: 'civh', cls: 'Civiles Heroicos', full: 3, red: 2, mp: 3, img: 'caza', card: 'h_caza', lv: 2, exp: 4, hf: 2, hr: 2,
    txt: ['<b>Puesto de caza:</b> disparan a 2 espacios sin penalización de columna.', '<b>Trofeo:</b> cuando su disparo elimina a una unidad Zed, recuperan 1 Munición.', '<b>Presa marcada:</b> Acción de Personaje (1 Acción), una vez por turno: marcan una unidad Zed a su alcance. Los disparos de cualquier unidad de jugador contra ella tienen 1 columna a favor hasta que sea eliminada o termine el turno.', '<b>A campo abierto:</b> tienen 1 columna en contra en combates Cuerpo a Cuerpo.'] }
});
CIVH_POOL.push('jaque', 'sar', 'caza');
const EXP_HEROES = { 1: ['carter', 'lee', 'may'], 2: ['betty'], 4: ['porter', 'alia', 'bender', 'ash', 'frank', 'doc', 'samcarter', 'macgyver', 'heli'] };
/* Cartas nuevas de Evento y Destino */
function evx(id, name, act, r4, inf, al, z, acc, txt, o) { EV[id] = Object.assign({ id, name, lvl: 'b', act, r4, inf, al, z, acc, txt, sp: 0, exp: 1 }, o || {}); }
evx('fortuna', 'La fortuna favorece a los que se preparan', 1, 1, 'B', 'd', ['A', 'ANY'], 1, ['Al inicio de esta fase: cada Héroe y Civiles Heroicos en un espacio con nombre puede realizar gratis una Acción de Buscar.'], { freeSearch: 1, exp: 2 });
evx('resiste', 'Resiste con más fuerza cuando resistas en soledad', 2, 1, 0, 0, ['A', 'F'], 2, ['(Efecto de Presión Zed: se ignora en solitario.)'], { exp: 2 });
evx('negacion', 'La negación no es un río de Egipto', 1, 0, 'B', 'd', ['B', 'A'], 2, ['Durante esta fase, las unidades de jugador en un espacio adyacente a unidades Zed no pueden realizar Acciones de Mover ni ataques con Arma de Fuego.'], { negation: 1, exp: 2 });
evx('gente', 'Gente, ¡vamos a movernos!', 1, 2, 0, 'd', ['B', 'M'], 4, ['Durante esta fase son gratis todas las Acciones de Mover que se inicien en el Centro de la Ciudad.'], { freeFromC: 1, exp: 2 });
evx('shhh', '¡Shhh! Sé que están ahí fuera…', 2, 1, 0, 'd', ['INIT'], 3, ['Los ataques con Arma de Fuego y Cuerpo a Cuerpo no están permitidos durante esta fase. Las Acciones de Mover no pueden finalizar de manera que una unidad de Jugador acabe en un espacio controlado por Zeds.'], { noFight: 1, exp: 2 });
evx('entusiasma', '¡Esto me entusiasma tanto!', 3, 0, 'B', 1, ['*'], 3, ['Al inicio de esta fase, roba 1 carta de Destino: cada unidad de jugador en la Ruta Destinada (incluyendo el Centro) puede realizar de inmediato una Acción de Mover gratis o un ataque con Arma de Fuego gratis (necesita Munición).'], { order: 1, freeWindow: 1 });
evx('no_hay_tiempo', '¡No hay tiempo para eso!', 2, 0, 'B', 2, ['MIN2'], 3, ['Al inicio de esta fase, gira todas las fichas de Acción de Jugador a su cara de Usada: esas Acciones no están disponibles durante este turno.'], { exp: 2, noPlayerAction: 1 });
evx('panico', 'El pánico es autopreservación', 1, 2, 'B', 1, ['*'], 2, ['Durante esta fase, son gratis todas las Acciones de Mover hacia el Centro de la Ciudad que realicen las unidades que estén adyacentes a alguna unidad Zed.'], { order: 1, panic: 1 });
evx('queda_alguno', '¿Queda alguno?', 5, 0, 'B', 1, ['*'], 0, ['¡Habéis ganado!', '«¿Han cesado? ¿Queda alguno? Espera, ¿quién eres tú?»'], { fin: 1, order: 1 });
function dx(id, name, where, keep, txt, exp) { DEST[id] = { id, name, lvl: 'b', where, keep, txt, exp: exp || 1 }; }
dx('hija', '¡La hija del alcalde ha desaparecido!', 'B', 0, 'Las unidades de jugador en el Centro de la Ciudad no pueden mover durante el resto del turno.');
dx('pensar', 'Pensar fríamente supuso el triunfo', 'F', 1, 'Juega esta carta para cancelar cualquier evento «Juega esta carta» que robes más adelante; O BIEN repite cualquier resultado de 1 dado o de 2 dados en el que haya un 1 (si es doble 1, repite los dos dados).');
dx('discutiendo', '¡Estáis discutiendo por estupideces!', 'A', 0, 'Elige a dos unidades de jugador que estén en el mismo espacio: no pueden realizar (más) Acciones durante este turno.');
dx('urbanistas', '¡Los urbanistas contraatacan!', 'M', 1, 'Juega esta carta para eliminar una unidad Zed cualquiera que esté intentando entrar en un espacio de Ciudad.');
DEST_IMG.excavadora2 = 'excavadora2';
/* Rumores (exp. 3): t = colocar (C) / guardar (G) / unir (U) */
const RUMORS = {
  cementerio: { t: 'C', name: 'Cementerio ancestral', txt: 'Colócalo en cualquier espacio sin nombre (incluidas Criptas): cada unidad Zed que ocupe ese espacio sufre 2 Impactos.' },
  registro:   { t: 'C', name: 'Registro federal de armas', txt: 'Colócalo en el Centro de la Ciudad: los resultados de 1 y 2 en las tiradas de Buscar en espacios de Ciudad o Pueblo te otorgan 1 de Munición.' },
  base:       { t: 'C', name: 'Base aérea secreta', txt: 'Colócala en un espacio n.º 1 de la superficie. Al final de cada fase de Acciones con una unidad tuya allí: 1 Curación gratis, 1 Investigación gratis o 1 Acción de Evento.' },
  tallmart:   { t: 'C', name: 'Centro de distribución de Tall-Mart', txt: 'Colócalo en un espacio sin nombre (no Inicial): pasa a tener nombre. Al final de cada Mantenimiento con una unidad allí: 2 Suministros o 1 Munición.' },
  ferreteria: { t: 'G', name: 'Gran superficie de ferretería', txt: 'Úsala en cualquier momento: +7 Suministros.' },
  ayuda:      { t: 'G', name: '¡Llegó la ayuda!', txt: 'Úsala en la fase de Acciones: coloca un Héroe o Civiles Heroicos disponible en el Centro o en un Inicial.' },
  deposito:   { t: 'G', name: 'Depósito de armas de la policía', txt: 'Úsalo en cualquier momento: +5 Munición.' },
  tesis:      { t: 'G', name: 'Tesis: ¿Qué hemos aprendido?', txt: 'Úsala en cualquier momento: recupera hasta 3 cartas «Guardar para más tarde» del descarte de Destino; pasan a tu mano y puedes volver a usarlas.' },
  muerte:     { t: 'G', name: 'Rumores de nuestra muerte', txt: 'Úsalos en la fase de Acciones: recupera hasta 2 unidades del Cementerio en el Centro con Fuerza reducida.' },
  telefono:   { t: 'G', name: 'El teléfono rojo', txt: 'Úsalo en la fase de Acciones: bombardeo de napalm sobre un espacio de la superficie (no Inicial) y otro adyacente: todo lo que haya se elimina; Caos en cada uno y «No Pasar» en el más lejano del Centro.' },
  plan:       { t: 'G', name: 'Plan de guerra negro', txt: 'Úsalo en la fase de Acciones: +2 Munición y +1 Suministro.' },
  diario:     { t: 'G', name: 'Diario del Dr. Marteuse', txt: 'Úsalo en la fase de Acciones: devuelve 1 Súper Zed en juego a la reserva y revela gratis una carta de Investigación (sin contar como Investigar).' },
  traje:      { t: 'U', name: 'Traje de batalla DARPA', txt: 'La unidad que lo porta inflige 2 Impactos adicionales en sus combates Cuerpo a Cuerpo y es doblemente Resistente.' },
  cristal:    { t: 'U', name: 'Cristal verde radiante', txt: 'La unidad que lo porta recibe 1 Acción gratis cada turno.' },
  medallon:   { t: 'U', name: 'Medallón místico', txt: 'Una vez por turno, cualquier dado (o un dado de una tirada de varios) de esta unidad puede cambiarse a 6.' },
  sirena:     { t: 'U', name: 'Sirena para Zeds', txt: 'La unidad que lo porta puede usar 1 Acción y tirar 2 dados: si el total ≥ Fuerza de un Zed adyacente, retrocede 1 espacio (dobles: desaparece). Se agota tras 2 usos.' }
};
/* ---------- utilidades ---------- */
const expOn = n => G.exp && G.exp.includes(n);
const trainsAt = id => G.spaces[id] ? unitsAt(id).filter(u => u.type === 'train') : [];
/* ---------- preparación ---------- */
const _heroPoolFor = heroPoolFor;
heroPoolFor = function (level) {
  const base = _heroPoolFor(level).filter(k => !HEROES[k].exp);
  const add = []; for (const n of (G && G.expSel || [])) for (const k of (EXP_HEROES[n] || [])) if (HEROES[k].lv <= MAX_HERO_LV[level]) add.push(k);
  return base.concat(add);
};
const _newGame = newGame;
newGame = function (levelIdx, lenIdx, personal, exps) {
  G.expSel = exps || []; G.exp = exps || [];
  _newGame(levelIdx, lenIdx, personal);
  G.rumorPool = []; G.rumorsHeld = [];
  // mazos con las cartas nuevas
  if (expOn(1) || expOn(2)) {
    const extraE = Object.keys(EV).filter(k => EV[k].exp && ((EV[k].exp === 1 && expOn(1)) || (EV[k].exp === 2 && expOn(2))));
    if (G.lv.cols.includes('b')) {
      /* La Guardia Nacional se saca aquí y se vuelve a insertar abajo en su posición fija (si no, quedaría barajada con el Acto III). */
      const deck = G.eventDeck.filter(id => !EV[id].fin && id !== 'guardia'); const fin = G.eventDeck.filter(id => EV[id].fin);
      const pool = shuffle(extraE.filter(k => !EV[k].fin && !deck.includes(k)));
      for (const k of pool.slice(0, Math.max(1, Math.floor(pool.length / 2)))) deck.push(k);
      const byAct = a => deck.filter(id => EV[id].act === a);
      let out = []; for (let a = 1; a <= 4; a++) out = out.concat(shuffle(byAct(a)));
      const finPool = fin.concat(expOn(1) ? ['queda_alguno'] : []);
      out.push(finPool[rnd(finPool.length)]);
      // mantener la carta de Guardia Nacional si existía
      if (G.lv.n >= 2) out.splice(out.length - 9, 0, 'guardia');
      G.eventDeck = out.filter((v, i, a) => a.indexOf(v) === i); G.totalEvents = G.eventDeck.length;
    }
    if (expOn(1)) { for (const k of ['hija', 'pensar', 'discutiendo', 'urbanistas']) G.destDeck.push(k); shuffle(G.destDeck); }
  }
  if (expOn(1) && G.heroKeys.includes('carter')) { /* Carter entra por un Inicial de superficie */
    const c = hero('carter'); if (c) { const r = SURFACE[rnd(4)]; putUnit(c, r + '0'); c.loaded = true; }
  }
  if (expOn(3) && G.lv.fourR) {
    G.rumorPool = shuffle(Object.keys(RUMORS));
    for (const [k, rt] of [['mercancias', ['B', 'A']], ['local', ['F', 'M']]]) { const u = newUnit({ side: 'pl', type: 'train', name: k === 'mercancias' ? 'Tren de Mercancías' : 'Tren Local', routes: rt, tkey: k, mp: 99, full: 0, red: 0, state: 'leaving' }); putUnit(u, 'C'); }
  }
  if (expOn(3)) G.turn.railPerks = {};
};
/* ---------- Fuerza y agrupamiento ---------- */
const _strength = strength;
strength = function (u) {
  if (u.key === 'jaque') { const n = allUnits(x => x.space === 'CAMP' && (x.type === 'refugee')).length; return u.flipped ? 1 + Math.floor(n / 2) : 1 + n; }
  return _strength(u);
};
const _putUnit = putUnit;
putUnit = function (u, id, why) {
  const from = u.space; _putUnit(u, id, why);
  if (u.key === 'lee' && u.rider && G.units[u.rider] && id && id !== 'CEM') { const r = G.units[u.rider]; if (r.space !== id) _putUnit(r, id); }
  if (u.mount && G.units[u.mount] && id !== G.units[u.mount].space && !u._sync) { /* el jinete se mueve solo con el caballo */ const l = G.units[u.mount]; l.rider = null; u.mount = null; }
};
const _terrainOf = terrainOf;
terrainOf = function (id) { let t = _terrainOf(id); if (G.turn.noTerrain) return t; return t + trainsAt(id).length; };
const _meleeInfection = meleeInfection;
meleeInfection = function (zs, h) {
  if (h && (h.key === 'carter' || h.key === 'lee' || h.key === 'horacio')) return 0;
  if (h && h.type === 'hero' && lee_with(h)) return 0;
  return _meleeInfection(zs, h);
};
function lee_with(h) { const l = hero('lee'); return l && l.space && l.space === h.space && l !== h; }
/* ---------- combate: ajustes de las expansiones ---------- */
function meleeStrengthBonus(f, o) {
  let b = 0;
  const may = alive('may'); if (may && f !== may && f.side === 'pl' && f.space === may.space && f.type !== 'train') b += 1;
  if (f.type === 'hero' && lee_with(f)) b += 1;
  return b;
}
/* Betty: columna fija */
function bettyCol(f) { return f.flipped ? 5 : 6; }
/* ---------- guardado de Munición (May) ---------- */
const _payFire = payFire;
payFire = async function (u) {
  const may = alive('may');
  if (u.key === 'may' && !G.firstFreeUsed.may) { G.firstFreeUsed.may = true; return; }
  const before = G.ammo; _payFire(u);
  if (may && may.space && isCity(may.space) && G.ammo < before && !G.turn.mercs) { const r = await rollShown('May ahorra Munición', v => v >= 5 ? '<b>' + v + '</b>: no gastas la Munición' : '<b>' + v + '</b>: se gasta la Munición (necesita 5-6)'); if (r >= 5) { G.ammo = before; LOG('May ahorra la Munición (' + r + ').', 'good'); UI.updateStats(); } }
};
/* ---------- Rumores: llegada de Refugiados ---------- */
const _refugeeArrives = refugeeArrives;
refugeeArrives = async function (u) {
  await _refugeeArrives(u);
  if (!expOn(3) || !G.rumorPool.length) return;
  const dr = await drawDestiny(); if (!dr) return;
  if (Object.values(G.spaces).some(s => s.route === dr.route && s.rumor)) { LOG('Rumor perdido: esa ruta ya tiene un Rumor sin revelar.'); await resolveTwist(dr); return; }
  const zs = routeZeds(dr.route).filter(z => !isInit(z.space) && !sp(z.space).rumor);
  if (!zs.length) { LOG('Rumor perdido: no hay dónde colocarlo.'); await resolveTwist(dr); return; }
  const by = {}; for (const z of zs) by[z.space] = (by[z.space] || 0) + strength(z);
  const best = Object.keys(by).sort((a, b) => by[b] - by[a] || sp(b).i - sp(a).i)[0];
  const k = G.rumorPool.shift(); sp(best).rumor = k;
  LOG('Un Rumor se coloca boca abajo en ' + spaceLabel(best) + '.', 'dest'); UI.redraw();
  await resolveTwist(dr);
};
async function revealRumor(u, free) {
  const s = sp(u.space), k = s.rumor; if (!k) return; const R = RUMORS[k];
  s.rumor = null; if (!free) spendActions(u, 1);
  await UI.waitAck('Rumor: ' + R.name, R.txt);
  if (R.t === 'U') { u.chips = (u.chips || []).concat(k); LOG(u.name + ' obtiene «' + R.name + '».', 'good'); }
  else if (R.t === 'G') { G.rumorsHeld.push(k); LOG('Guardas el Rumor «' + R.name + '».', 'good'); }
  else if (k === 'cementerio') { const c = Object.values(G.spaces).filter(x => x.route && !x.name && x.i > 0); const t = await UI.pickSpace(c.map(x => x.id), 'Cementerio ancestral: elige un espacio sin nombre.'); sp(t).cem = true; for (const z of zedsAt(t)) await applyZedHits([z], 2); }
  else if (k === 'registro') { sp('C').registro = true; }
  else if (k === 'base') { const c = SURFACE.map(r => r + (lastOf(r) - 1)); const t = await UI.pickSpace(c, 'Base aérea secreta: elige un espacio n.º 1.'); sp(t).base = true; }
  else if (k === 'tallmart') { const c = Object.values(G.spaces).filter(x => x.route && !x.name && x.i > 0 && x.kind !== 'crypt'); if (c.length) { const t = await UI.pickSpace(c.map(x => x.id), 'Tall-Mart: elige un espacio sin nombre.'); sp(t).name = 'Tall-Mart'; sp(t).tall = true; } }
  UI.redraw(); UI.updateStats();
}
async function useRumor(k) {
  const R = RUMORS[k]; const rm = () => { G.rumorsHeld.splice(G.rumorsHeld.indexOf(k), 1); };
  switch (k) {
    case 'ferreteria': G.supplies = Math.min(20, G.supplies + 7); rm(); break;
    case 'deposito': G.ammo = Math.min(20, G.ammo + 5); rm(); break;
    case 'plan': G.ammo = Math.min(20, G.ammo + 2); G.supplies = Math.min(20, G.supplies + 1); G.turn.combineFire = true; LOG('Plan de guerra negro: este turno las unidades agrupadas combinan su Fuerza al disparar.', 'good'); rm(); break;
    case 'tesis': { for (let i = 0; i < 3 && G.destDiscard.length; i++) { const opts = G.destDiscard.map((c, j) => ({ label: DEST[c].name, value: j, img: destImg(c), keep: DEST[c] && DEST[c].keep })).filter(o => o.keep); if (!opts.length) break; const v = await UI.chooseCards({ title: 'Tesis', text: 'Recupera una carta del descarte de Destino (' + (i + 1) + '/3):', options: opts, extra: [{ label: 'Terminar', value: -1 }] }); if (v < 0) break; const c = G.destDiscard.splice(v, 1)[0]; G.hand.push(c); LOG('Tesis: recuperas «' + DEST[c].name + '» y pasa a tu mano.', 'good'); } UI.updateHand(); rm(); break; }
    case 'muerte': { for (let i = 0; i < 2; i++) { const cs = G.cemetery.filter(isFighter); if (!cs.length) break; const v = await UI.chooseCards({ title: 'Rumores de nuestra muerte', text: 'Elige una unidad:', options: cs.map(u => unitOpt(u)) }); const u = G.units[v]; G.cemetery = G.cemetery.filter(x => x.id !== u.id); putUnit(u, 'C'); u.flipped = true; u.hits = 0; u.ecg = false; } rm(); break; }
    case 'ayuda': { const pool = heroPoolFor(G.lv.n).concat(CIVH_POOL.filter(x => civhAvail(x) && HEROES[x].lv <= MAX_CIVH_LV[G.lv.n])).filter((x, i, a) => a.indexOf(x) === i && !hero(x) && !G.cemetery.some(c => c.key === x)); const key = !pool.length ? null : pool.length === 1 ? pool[0] : await UI.chooseCards({ title: '¡Llegó la ayuda!', text: 'Elige la unidad que llega.', options: pool.map(heroOpt) }); if (key) { const w = await UI.pickSpace(['C'].concat(G.routes.filter(r => r !== 'T').map(r => r + '0')), '¡Llegó la ayuda!: elige el espacio.'); await spawnHero(key, w); rm(); } break; }
    case 'telefono': { const c = Object.values(G.spaces).filter(s => s.route && s.route !== 'T' && s.i > 0); const a = await UI.pickSpace(c.map(s => s.id), 'Napalm: primer espacio.', true); if (a == null) break; const adj = adjacentIds(a).filter(i => isRouteSp(i) && !isInit(i) && sp(i).route === sp(a).route); const b = adj.length ? await UI.pickSpace(adj, 'Napalm: espacio adyacente (o el mismo).') : a; for (const id of [a, b].filter((v, i, x) => x.indexOf(v) === i)) { for (const u of unitsAt(id).slice()) { if (isZedSide(u)) { if (u.type === 'super') { removeUnit(u); delete G.units[u.id]; } else if (u.type === 'spreader') { removeUnit(u); delete G.units[u.id]; } else discardZed(u); } else if (u.type === 'train' || u.type === 'aldeano') { removeUnit(u); delete G.units[u.id]; } else if (u.side === 'pl' || u.side === 'raid') { LOG(u.name + ' es calcinada: se elimina (con su tirada de Salvación).', 'bad'); await unitDown(u); } } const sx = sp(id); sx.bar = 0; sx.mine = 0; sx.rumor = null; await placeChaos(id, 1); } G.turn.block.push(sp(a).i < sp(b).i ? a : b); rm(); break; }
    case 'diario': { const sup = allUnits(x => x.type === 'super'); if (sup.length) { const v = await UI.pickUnit(sup, 'Elige el Súper Zed que se retira.', true); if (v == null) break; const z = G.units[v]; G.supers.push(z.key); removeUnit(z); delete G.units[z.id]; } if (G.res) await revealResearch(); rm(); break; }
  }
  UI.updateStats(); UI.redraw();
}
/* ---------- Efectos de Rumores en el mapa ---------- */
const _zedsOccupy = zedsOccupy;
zedsOccupy = async function (zs, id) {
  await _zedsOccupy(zs, id);
  if (sp(id).cem) for (const z of zs.filter(x => x.space === id)) await applyZedHits([z], 2);
};
/* ---------- Trenes ---------- */
const TRAIN_STOPS = { F3: ['inf', 'Universidad: −4 Infección'], B4: ['sup', 'Granja: +3 Suministros'], M3: ['ammo', 'Mina: +2 Munición'], A4: ['evt', 'Central nuclear: +2 Acciones de Evento'] };
async function trainDestinations(t) {
  const out = []; const cur = t.space;
  if (t.state === 'leaving') {
    const routes = cur === 'C' ? t.routes : [sp(cur).route];
    for (const r of routes) { let i = cur === 'C' ? 0 : sp(cur).i; for (let k = cur === 'C' ? lastOf(r) : i - 1; k >= 1; k--) { const id = r + k; if (blocked(id)) break; out.push(id); if (zedsAt(id).length) break; } }
  } else {
    const r = sp(cur).route; for (let k = sp(cur).i + 1; k <= lastOf(r); k++) { const id = r + k; if (blocked(id)) break; out.push(id); if (zedsAt(id).length) break; }
    out.push('C');
  }
  return out;
}
async function moveTrain(t, dest) {
  const pass = unitsAt(t.space).filter(x => x.ride === t.id);
  putUnit(t, dest); for (const p of pass) putUnit(p, dest);
  LOG(t.name + ' llega a ' + spaceLabel(dest) + '.', 'good');
  if (dest === 'C') { for (const p of allUnits(x => x.ride === t.id)) p.ride = null; t.state = 'leaving'; }
  else if (t.state === 'leaving' && TRAIN_STOPS[dest]) {
    const [k, txt] = TRAIN_STOPS[dest]; LOG('Parada especial: ' + txt, 'good');
    if (k === 'inf') infDown(4); else if (k === 'sup') G.supplies = Math.min(20, G.supplies + 3); else if (k === 'ammo') G.ammo = Math.min(20, G.ammo + 2); else if (k === 'evt') addEventActions(2);
  }
  for (const p of pass) { if (p.type === 'refugee' && dest === 'C') await refugeeArrives(p); p.ride = null; }
  if (zedsAt(dest).length) { const pl = plAt(dest); if (pl.length) await melee({ zeds: zedsAt(dest), hum: pl, space: dest, attacker: 'h', from: t.space }); }
  UI.redraw(); UI.updateStats();
}
async function doTrainAction(t, id, opts) {
  opts = opts || {}; let withRefugees = false;
  if (id === 'tmove') {
    const dests = await trainDestinations(t); if (!dests.length) { LOG('El tren no puede ir a ningún sitio.'); return; }
    const cands = unitsAt(t.space).filter(x => (isFighter(x) && !x.mount && x.key !== 'lee' && x.key !== 'heli' || x.type === 'refugee') && x.type !== 'train' && x.type !== 'guard');  /* la Guardia Nacional no sube a los trenes */
    let carried = [];
    if (cands.length) { for (let k = 0; k < 2; k++) { const c = cands.filter(x => !carried.includes(x)); if (!c.length) break; const v = await UI.choose({ title: 'Pasajeros', text: 'Sube pasajeros al ' + t.name + ' (máx. 2 unidades o 1 de Refugiados; subir Refugiados cuesta 1 Acción más).', options: c.filter(x => x.type !== 'refugee' || canPay(null, 2)).map(x => ({ label: x.name, value: x.id })).concat([{ label: 'Salir ya', value: '' }]) }); if (!v) break; const x = G.units[v]; if (x.type === 'refugee') { if (carried.length) break; carried.push(x); break; } if (carried.some(y => y.type === 'refugee')) break; carried.push(x); } }
    const d = await UI.pickSpace(dests, 'Elige el destino del tren.', true); if (d == null) return;
    carried.forEach(x => x.ride = t.id);
    withRefugees = carried.some(x => x.type === 'refugee');
    if (!opts.free) { spendActions(null, 1, 'move'); if (withRefugees) spendActions(null, 1); }
    await moveTrain(t, d); return withRefugees;
  } else if (id === 'tflip') { spendActions(null, 1); t.state = t.state === 'leaving' ? 'returning' : 'leaving'; LOG(t.name + ' cambia de sentido.'); }
}
/* ---------- Carter ---------- */
function carterReach(u) { /* BFS permitiendo cruzar Zeds */
  const out = {}, best = { [u.space]: { c: 0, path: [] } }, q = [u.space];
  while (q.length) {
    const cur = q.shift();
    for (const n of neighbors(cur)) { const s = sp(n); if (s.route === 'T' || blocked(n) || !['B', 'M', 'A', 'F'].includes(s.route) && n !== 'C') continue; 
      const c = best[cur].c + moveCost(u, n); if (c > u.mp) continue;
      if (!best[n] || c < best[n].c) { best[n] = { c, path: best[cur].path.concat([n]) }; q.push(n); } }
  }
  for (const id in best) if (id !== u.space) { const s = sp(id); if ((isInit(id) || playerRoom(id, u)) && !blocked(id)) out[id] = best[id]; }
  return out;
}
async function carterMove(u, dest, info) {
  let mp = u.mp, here = u.space;
  for (let i = 0; i < info.path.length; i++) {
    const n = info.path[i]; mp -= moveCost(u, n); const last = n === dest;
    putUnit(u, n); UI.redraw();
    const zs = zedsAt(n);
    if (zs.length) {
      if (!last && mp >= 1) { const r = await rollShown('Barrer Zeds', v => v >= 4 ? '<b>' + v + '</b>: eliminas a los Zeds del espacio' : '<b>' + v + '</b>: no lo consigues (necesita 4-6)'); LOG('Barrer Zeds (' + r + ')', r >= 4 ? 'good' : 'bad'); if (r >= 4) { for (const z of zs.slice()) await hitZed(z); continue; } }
      await melee({ zeds: zedsAt(n), hum: [u], space: n, attacker: 'h', from: here, noInf: true }); return;
    }
    here = n;
    if (n === 'C' && u.loaded) { u.loaded = false; G.supplies = Math.min(20, G.supplies + (G.lv.supplies ? 5 : 0)); G.ammo = Math.min(20, G.ammo + 3); LOG('Carter entrega el cargamento: +' + (G.lv.supplies ? '5 Suministros y ' : '') + '3 Munición.', 'good'); UI.updateStats(); return; }
    if (isInit(n)) return;
  }
}
/* ---------- Lee ---------- */
async function leeMount(lee, h) { lee.rider = h.id; h.mount = lee.id; LOG(h.name + ' monta al General Lee.', 'good'); }
function leeDismount(lee) { const r = lee.rider && G.units[lee.rider]; if (r) { r.mount = null; } lee.rider = null; }
/* ---------- Acciones extra en la ficha de unidad ---------- */
const _unitActions = unitActions;
unitActions = function (u) {
  let A = _unitActions(u);
  if (!u || u.side !== 'pl' || G.phase !== 'actions' || G.busy) return A;
  const act = canAct(u), pay = n => canPay(u, n);
  if (u.type === 'train') return [{ id: 'tmove', label: 'Mover tren', ok: pay(1) && !sp(u.space).chaos && !(G.turn.cLock && u.space === 'C') }, { id: 'tflip', label: u.state === 'leaving' ? 'Dar la vuelta (volver)' : 'Dar la vuelta (salir)', ok: pay(1) && u.space !== 'C' && !controlled(u.space) }];
  if (u.key === 'carter') { A = A.filter(a => a.id !== 'move'); A.unshift({ id: 'cmove', label: 'Conducir', ok: act && canPay(u, 1, 'move') && !(G.turn.cLock && u.space === 'C') });
    if (u.space && (isInit(u.space) || u.space === 'C')) { A.push({ id: 'creload', label: 'Recargar cargamento (1 acc.)', ok: isInit(u.space) && !u.loaded && pay(1) }); }
    A.push({ id: 'crepair', label: 'Reparar camión (1 Sum. o 1 acc.)', ok: (u.space === 'C' || isInit(u.space)) && (u.hits > 0 || u.flipped) && !G.charUsed.crepair && u.curedTurn !== G.turnNo && (G.supplies >= 1 || pay(1)) }); }
  if (u.key === 'lee') {
    const near = unitsAt(u.space).filter(x => x.type === 'hero' && x.key !== 'lee' && !x.mount && x.key !== 'carter' && x.key !== 'heli' && x.key !== 'pepinillos' || (x.key === 'horacio' && x.space === u.space && !x.mount));
    A.push({ id: 'lmount', label: 'Montar a un Héroe', ok: act && !u.rider && near.length > 0 });
    A.push({ id: 'ldis', label: 'Desmontar al jinete', ok: act && !!u.rider });
    A.push({ id: 'lpura', label: 'Purasangre (1 Mover gratis)', ok: act && !G.charUsed.pura });
    if (u.rider) A.push({ id: 'lhosp', label: 'Galope al Hospital con el jinete', ok: G.lv.infection && act && canPay(u, 1, 'move') && !(G.turn.cLock && u.space === 'C') });
  }
  if (u.mount) { A = A.filter(a => a.id !== 'move'); }
  if (sp(u.space) && sp(u.space).rumor && ['hero', 'civh', 'marine', 'petra'].includes(u.type) && act) A.push({ id: 'rumor', label: 'Revelar Rumor (1 acc.)', ok: !sp(u.space).chaos && pay(1) });
  for (const k of (u.chips || [])) { if (k === 'sirena') A.push({ id: 'sirena', label: 'Sirena para Zeds (1 acc.)', ok: pay(1) && (G.sirenaUses || 0) < 2 && adjacentIds(u.space).some(i => zedsAt(i).length && !isInit(i)) }); }
  if ((u.chips || []).length && unitsAt(u.space).some(x => x !== u && isFighter(x))) A.push({ id: 'chipgive', label: 'Pasar ficha de Rumor (gratis)', ok: true });
  return A;
};
const _runAction = runAction;
runAction = async function (u, id) {
  switch (id) {
    case 'cmove': { const info = carterReach(u); const ids = Object.keys(info); if (!ids.length) { LOG('Carter no puede ir a ningún sitio.'); return; } const d = await UI.pickSpace(ids, 'Carter: elige el destino.', true); if (d == null) return; spendActions(u, 1, 'move'); await carterMove(u, d, info[d]); return; }
    case 'creload': spendActions(u, 1); u.loaded = true; LOG('Carter recoge un nuevo cargamento.', 'good'); return;
    case 'crepair': { let how = G.supplies >= 1 ? 's' : 'a'; if (G.supplies >= 1 && canPay(u, 1)) how = await UI.choose({ title: 'Reparar camión', text: '¿Cómo pagas la reparación?', options: [{ label: '1 Suministro (tienes ' + G.supplies + ')', value: 's' }, { label: '1 Acción', value: 'a' }], cancel: true }); if (how == null) return; if (how === 's') G.supplies--; else spendActions(u, 1); G.charUsed.crepair = true; u.curedTurn = G.turnNo; if (u.hits > 0) u.hits--; else if (u.flipped) { u.flipped = false; u.hits = 2; } LOG('Carter repara su camión.', 'good'); UI.updateStats(); return; }
    case 'lmount': { const near = unitsAt(u.space).filter(x => x.type === 'hero' && x.key !== 'lee' && !x.mount && !['carter', 'pepinillos', 'heli'].includes(x.key)); const v = near.length === 1 ? near[0].id : await UI.pickUnit(near, 'Elige al jinete.', true); if (v == null) return; await leeMount(u, G.units[v]); return; }
    case 'ldis': leeDismount(u); return;
    case 'lpura': G.charUsed.pura = true; u.freeM = (u.freeM || 0) + 1; LOG('Purasangre: el General Lee tiene 1 Acción de Mover gratis.', 'good'); return;
    case 'lhosp': { const r = G.units[u.rider]; const reach = reachable(u); const ok = (u.space === 'C') || reach['C'] !== undefined; if (!ok) { LOG('Lee no llega al Centro con sus puntos de Movimiento.'); return; } const bed = freeBed(); if (!bed) { LOG('No hay Camas libres.'); return; } spendActions(u, 1, 'move'); leeDismount(u); putUnit(u, 'C'); putUnit(r, bed); r.ecg = false; LOG(r.name + ' es llevado al Hospital a galope.', 'good'); return; }
    case 'rumor': await revealRumor(u, false); return;
    case 'chipgive': { const k = u.chips.length === 1 ? u.chips[0] : await UI.choose({ title: 'Pasar ficha', text: '¿Qué ficha pasas?', options: u.chips.map(c => ({ label: RUMORS[c].name, value: c })), cancel: true }); if (k == null) return; const mates = unitsAt(u.space).filter(x => x !== u && isFighter(x)); const t = mates.length === 1 ? mates[0] : G.units[await UI.pickUnit(mates, '¿A quién se la pasas?', true)]; if (!t || !t.id) return; u.chips.splice(u.chips.indexOf(k), 1); t.chips = (t.chips || []).concat(k); LOG(u.name + ' pasa «' + RUMORS[k].name + '» a ' + t.name + '.', 'good'); return; }
    case 'sirena': { const c = adjacentIds(u.space).filter(i => zedsAt(i).length && !isInit(i)); const t = await UI.pickSpace(c, 'Sirena: elige el espacio.', true); if (t == null) return; const zs = zedsAt(t); const v = zs.length === 1 ? zs[0].id : await UI.pickUnit(zs, 'Elige el Zed.', true); if (v == null) return; spendActions(u, 1); G.sirenaUses = (G.sirenaUses || 0) + 1; const z = G.units[v]; const a = d6(), b = d6(); LOG('Sirena: ' + (a + b), 'good'); if (a + b >= strength(z)) { if (a === b) { if (z.type === 'zed') discardZed(z); else { removeUnit(z); delete G.units[z.id]; } LOG('El Zed estalla en combustión espontánea.', 'good'); } else await retreatZeds([z], zedOrigin(z)); } return; }
    case 'tmove': case 'tflip': await doTrainAction(u, id); return;
  }
  return _runAction(u, id);
};
/* Mantenimiento de las expansiones */
const _maintenance = maintenance;
maintenance = async function () {
  await _maintenance();
  for (const s of Object.values(G.spaces)) if (s.tall && unitsAt(s.id).some(x => isFighter(x) && x.type !== 'refugee')) { const v = await UI.choose({ title: 'Tall-Mart', text: 'Elige tu recompensa:', options: [{ label: '2 Suministros (tienes ' + G.supplies + ')', value: 's' }, { label: '1 Munición (tienes ' + G.ammo + ')', value: 'a' }] }); if (v === 's') G.supplies = Math.min(20, G.supplies + 2); else G.ammo = Math.min(20, G.ammo + 1); }
  for (const u of Object.values(G.units)) { delete u._chipDie; u.freeChip = false; }
  UI.updateStats();
};
/* ---------- Presión Zed (cooperativo): iconos de cada carta de Evento, transcritos de las imágenes ----------
   's'/'e' = «al inicio» / «al final» de la fase de los Zeds · M = Z (movimiento) · P = Ƶ (colocación, el icono Z enmarcado). Orden = orden en la carta.
   Las cartas que no aparecen no tienen iconos de Presión. */
const PRESSURE = {
  sM: ['cardio', 'asalto_m', 'asalto_f', 'pelo', 'odio', 'heroe_b', 'resistentes', 'errantes', 'caos_abs', 'caos_control', 'oh_malo', 'que_demonios', 'donde_todos', 'super_enloq', 'desesperacion', 'moteros', 'que_diablos', 'campanas', 'frenesi', 'no_comer', 'gente'],
  sP: ['cerebros_b1', 'cerebros_b2', 'cerebros_g', 'cerebros_y1', 'cerebros_y2', 'rapidos', 'helicoptero', 'monstruo', 'elwood', 'rumores', 'hace_falta', 'murcielagos', 'brote_local', 'feria', 'atajos', 'conductos', 'fortuna', 'panico'],
  eM: ['que_olor', 'flambeados', 'materiales', 'entusiasma'],
  eP: ['descubrimiento']
};
const PRESSURE_SEQ = { bajo_pies: ['sP', 'sM'], contaminacion: ['sP', 'sM'], doc_problema: ['sP', 'sM'], artefacto: ['sP', 'sM'], oh_no: ['sP', 'sM'], resiste: ['sP', 'sM'], duros: ['eP', 'eM'], no_detendran: ['eP', 'eM'], aqui_doctor: ['eM', 'eP'] };
for (const k in PRESSURE) for (const id of PRESSURE[k]) if (EV[id]) EV[id].pr = [k];
for (const id in PRESSURE_SEQ) if (EV[id]) EV[id].pr = PRESSURE_SEQ[id];

/* ---------- Fase de cada Evento ----------
   Es la columna cuya pestaña se extiende hasta el texto en la carta original (carpeta con pestañas); el texto de la carta da el momento exacto dentro de la fase.
   z = fase de los Zeds · a = fase de Acciones · 4 = fase 4R · i = fase de Infección · za = Zeds y Acciones (fin_b2) · - = sin pestaña (turnos especiales).
   La usa phases.js (eventAtPhase) para resolver el efecto en su fase, cardtext.js para la ficha de la carta y tools/generar_catalogo.mjs para el catálogo. */
const EV_FASE = {
  accidente: 'a',        // Accidente en el Laboratorio
  agua: 'z',             // El suministro de agua se ha contaminado
  alcantarilla: 'z',     // Zeds de alcantarilla
  aqui_doctor: 'i',      // ¡Aquí está el Doctor!
  armados: 'a',          // Civiles Bien Armados
  artefacto: '4',        // Encuentras un artefacto alienígena
  asalto_a: 'z',         // Asalto nocturno en la Autovía
  asalto_b: 'z',         // Asalto nocturno en el Bosque
  asalto_f: 'z',         // Asalto nocturno en las Afueras
  asalto_m: 'z',         // Asalto nocturno en la Montaña
  atajos: 'a',           // «Atajos» experimentales
  bajo_pies: 'z',        // Justo bajo nuestros pies
  bomberos: 'a',         // Los Aldeanos organizan unidades de bomberos
  brote_local: 'z',      // Brote local de Zeds
  cabana: 'a',           // Encuentras una cabaña de caza
  campanas: 'z',         // Campanas en la cafetería del infierno
  caos_abs: 'z',         // Caos absoluto
  caos_control: 'z',     // El caos se extiende sin control
  cardio: 'z',           // Regla n.º 7: Cardio
  catastrofe: 'z',       // Catástrofe nuclear
  cerebros_b1: '-',      // ¡CEREBROS!
  cerebros_b2: '-',      // ¡CEREBROS!
  cerebros_g: '-',       // ¡CEREBROS!
  cerebros_y1: '-',      // ¡CEREBROS!
  cerebros_y2: '-',      // ¡CEREBROS!
  civ_heroicos: 'a',     // Llegan Civiles Heroicos
  conductos: 'z',        // Conexión por los conductos del vapor
  contaminacion: 'i',    // Contaminación en el Hospital
  crisis: 'a',           // Crisis nerviosa
  descubrimiento: 'a',   // Descubrimiento en la Investigación
  desde_lab: 'z',        // Desde el laboratorio del Dr. Marteuse
  desesperacion: 'a',    // Aumenta la desesperación
  despensa: 'a',         // Encuentras una despensa
  doc_problema: 'z',     // Doc… Tenemos un gran problema
  donde_todos: 'z',      // ¿De dónde salen todos?
  duros: 'z',            // ¡Zeds duros de mollera!
  eficiencia: 'a',       // Eficiencia en el Hospital
  elwood: 'a',           // Elwood Berra llega al Hospital
  entusiasma: 'z',       // ¡Esto me entusiasma tanto!
  errantes: 'z',         // Zeds errantes
  experimentos: 'z',     // Experimentos explosivos
  feria: 'z',            // La feria de las tinieblas
  fin_b1: 'a',           // De una vez por todas, buenas noches
  fin_b2: 'za',          // Para bien o para mal, yo soy el que tiene el arma
  fin_g: 'a',            // ¿Quieres un trozo de mí?
  fin_o: 'a',            // ¡Fin de la partida, tío!
  fin_r: 'a',            // Por fin ha terminado la larga pesadilla
  fin_y: 'a',            // Es hora de actuar o callar
  flambeados: 'z',       // Zeds flambeados
  fortuna: 'a',          // La fortuna favorece a los que se preparan
  frenesi: 'a',          // Frenesí Súper Zed
  gente: 'a',            // Gente, ¡vamos a movernos!
  granero: 'a',          // Encuentras un granero lleno
  guardia: '-',          // ¡Llega la Guardia Nacional!
  hace_falta: '4',       // Hace falta un Pueblo…
  helicoptero: 'a',      // Ataque del helicóptero de la Guardia Nacional
  heroe_b: 'a',          // Llega un Héroe
  heroe_g: 'a',          // Llega un Héroe
  hinchados: 'z',        // Los Zeds hinchados estallan
  inteligentes: 'a',     // Zeds Inteligentes
  irrupcion: 'z',        // Una irrupción desde las profundidades
  jornada: 'a',          // Trabajando una jornada doble
  keepcalm: 'a',         // «Keep calm» y mata Zeds
  marines: 'a',          // El equipo de Marines despliega sus tropas
  materiales: 'a',       // Materiales de Investigación
  mina: 'z',             // ¡Explosión en la Mina!
  misiles: 'a',          // Misiles del dron del Ejército
  misterioso: 'z',       // El misterioso Dr. Marteuse
  monstruo: 'a',         // ¿Quién es el verdadero monstruo, Doc?
  moteros: 'a',          // Banda de moteros Los Ángeles de Petra
  murcielagos: 'a',      // Enjambre de murciélagos del Túnel
  negacion: 'a',         // La negación no es un río de Egipto
  no_comer: 'z',         // No den de comer a los Zeds
  no_detendran: 'z',     // ¡No se detendrán ante nada!
  no_escapatoria: 'z',   // No hay escapatoria
  no_hay_tiempo: 'a',    // ¡No hay tiempo para eso!
  noche: 'z',            // Al caer la noche
  noelle: 'z',           // Noelle «Hell» Razer
  odio: 'a',             // Odio cuando pasa eso
  oh_malo: 'z',          // Oh, esto es malo…
  oh_no: 'z',            // ¡Oh, no! ¡Otra vez no!
  panico: 'a',           // El pánico es autopreservación
  pelo: 'z',             // ¿Me tomas el pelo?
  propagacion: 'z',      // La «propagación» de la enfermedad Zed
  que_demonios: 'z',     // ¿Qué demonios es eso?
  que_diablos: 'z',      // ¿Qué diablos? ¿Hay más?
  que_olor: 'z',         // ¿Qué es ese olor?
  queda_alguno: 'a',     // ¿Queda alguno?
  rapidos: 'z',          // Zeds Rápidos
  renqueantes: 'z',      // Zeds renqueantes
  resiste: 'z',          // Resiste con más fuerza cuando resistas en soledad
  resistentes: 'z',      // Zeds Resistentes
  rumores: 'a',          // Rumores de contagio por el aire
  saqueadores: '4',      // ¡Aparecen Saqueadores!
  shhh: 'a',             // ¡Shhh! Sé que están ahí fuera…
  soldados: 'a',         // Soldados de fortuna
  super_enloq: 'a',      // Los Súper Zeds enloquecen
  toxicos: 'a',          // Zeds Tóxicos
  tsunami: 'z',          // Tsunami zombi
  turba: '4',            // Aparece una turba no identificada
};
for (const k in EV_FASE) if (EV[k]) EV[k].fase = EV_FASE[k];
const FASE_NOMBRE = { z: 'Fase de los Zeds', a: 'Fase de Acciones', '4': 'Fase 4R', i: 'Fase de Infección', za: 'Fases de los Zeds y de Acciones', '-': 'Sin fase (turno especial)' };
