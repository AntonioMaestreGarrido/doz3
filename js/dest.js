/* Cartas de Destino e Investigación (transcritas de las cartas originales). Imágenes: assets/cartas/d_<id>.jpg · assets/cartas/i_<id>.jpg */
'use strict';
/* where: choice (a elección) · more/less (más/menos unidades Zed) · moreC/lessC (más/menos Caos) · B M A F T (ruta).  keep: «Guardar para más tarde». */
const DEST = {};
function dest(id, name, lvl, where, keep, txt) { DEST[id] = { id, name, lvl, where, keep, txt }; }
/* Azules (Juego Básico / Nivel I) */
dest('excavadora', 'Excavadora asesina', 'b', 'choice', 1, 'Juega esta carta cuando una unidad de jugador comience un ataque Cuerpo a Cuerpo para que obtenga 2 columnas a favor en ese combate.');
dest('lago', 'Zeds surgidos del lago', 'b', 'more', 0, 'Coloca una nueva unidad Zed en el espacio del Campamento. Si es necesario, aplica el límite de agrupamiento.');
dest('civiles', 'Algunos civiles se organizan', 'b', 'less', 1, 'Juega esta carta al principio de cualquier fase o antes de cualquier combate para colocar la ficha de Líder Civil en una unidad de Civiles Normales. Hasta que acabe en el Cementerio, esa unidad recibe 1 columna a favor en todos los combates Cuerpo a Cuerpo y ataques con Arma de Fuego.');
dest('alimanas', 'Alimañas Infectadas', 'b', 'A', 0, 'Coloca la unidad en peana de Alimañas Infectadas (Propagadoras de Enfermedad) en el espacio Inicial de la ruta con más unidades Zed. +1 de Infección al inicio de cada fase de Infección mientras estén en juego fuera de un espacio Inicial, hasta que sea eliminada.');
dest('adrenalina', 'Suministro de adrenalina', 'b', 'F', 1, 'Juega esta carta durante la fase de Acciones para obtener 2 Acciones de Evento adicionales.');
dest('coordinador', 'Coordinador de la comunidad', 'b', 'M', 1, 'Juega esta carta durante la fase de Acciones para colocar una nueva unidad de Civiles Normales o Heroicos disponible a tu elección en el Centro de la Ciudad.');
dest('muertos', '¡Los muertos vivientes!', 'b', 'M', 0, '¡El histórico cementerio de St. Thomas está rebosante de no muertos! Coloca 2 nuevas unidades Zed Normales formando una Horda Zed en el espacio de Pueblo de St. Thomas. Aplica el límite de agrupamiento si es necesario.');
dest('ferrea', 'Férrea determinación en la última batalla', 'b', 'A', 1, 'Juega esta carta después de que una unidad Zed ataque y gane. Cambia el resultado del combate a: los Zeds atacantes sufren 1 Impacto y se retiran.');
dest('municion', 'Munición defectuosa y suministros caducados', 'b', 'B', 0, 'Sufres una pérdida de 2 Suministros y 1 de Munición de inmediato. Si no tienes suficiente, no hay ninguna penalización adicional.');
/* Verdes (Nivel II) */
dest('inventarios', 'Inventarios amañados', 'g', 'choice', 0, 'El interventor Jon Stengel ha descubierto que faltan recursos. Tira 1 dado para Suministros y después otro para Munición: 1-2 → −2 Suministros/Munición; 3-5 → −1; 6 → sin efecto. Sin penalización si no tienes tanto.');
dest('sin_nombre', 'El Hombre sin nombre', 'g', 'moreC', 1, 'Juega esta carta al inicio de cualquier combate Cuerpo a Cuerpo para obtener 3 columnas a favor, de un solo uso.');
dest('veo_alguien', 'Creo que veo a alguien', 'g', 'A', 1, 'Juega esta carta durante la fase de Acciones para colocar una nueva unidad de Héroe disponible a tu elección en cualquier espacio Inicial de la superficie.');
dest('llamamiento', 'Llamamiento zombi', 'g', 'F', 0, 'Por cada espacio con Caos, coge una nueva unidad Zed de la reserva. Si su Fuerza completa es menor que el n.º de ese espacio, colócala allí; si no, devuélvela a la reserva. Sigue con el siguiente espacio con Caos.');
dest('puente', 'El puente se derrumba', 'g', 'F', 0, 'Coloca la ficha de Puente Derrumbado en el espacio del Puente colgante. Las unidades de jugador y Saqueadores no pueden entrar en él. Puedes gastar 1 Acción para darle la vuelta a la cara de Ferry: se puede entrar pero el movimiento termina allí.');
dest('lluvia', 'Lluvia torrencial', 'g', 'lessC', 0, 'No se permite más movimiento en la ruta de la Montaña durante el resto de este turno. Tira 1 dado por cada unidad Zed en esa ruta: 1-2 = arrastrada 1 espacio hacia el Centro; 3-5 = nada; 6 = empujada 1 espacio lejos del Centro. Resuelve ataques y retiradas normalmente.');
dest('olvidado', '¿Qué te has olvidado?', 'g', 'M', 0, 'Todas las unidades de Refugiados (incluyendo Supervivientes V.I.P.) deben alejarse 1 espacio del Centro de la Ciudad. Si entran en un espacio con Zeds, ¡son devorados!');
dest('picado', '¡Sí! Han picado… Esta vez', 'g', 'B', 1, 'Juega esta carta durante la fase de los Zeds para cancelar toda la activación de una unidad u Horda Zed antes de que se mueva. Recupera 1 Impacto si estaba herida. Después tira 1 dado: 1-3 = descarta esta carta; 4-6 = guárdala para un futuro uso.');
dest('vehiculos', 'Vehículos robustos «requisados»', 'g', 'A', 1, 'Juega esta carta durante la Acción de Mover de un Héroe para obtener 3 puntos de Movimiento adicionales (solo entre espacios de la superficie). No puede usarse con Pepinillos ni Horacio.');
/* Naranjas (Nivel IV) */
dest('techo', 'El techo del Túnel se derrumba', 'o', 'T', 0, 'Tira 1 dado para determinar qué espacio del Túnel queda sepultado. Nadie puede entrar en ese espacio durante este turno («No Pasar»). Cualquier unidad en ese espacio sufre 1 Impacto y escapa: del n.º 6 a la Central Nuclear; del n.º 5 a la Universidad; del n.º 4 a la Mina; del n.º 3 a la Granja; de los n.º 1 y 2 se retiran 1 espacio.');
dest('heroe_d', 'Llega un Héroe', 'o', 'more', 1, 'Juega esta carta durante la fase de Acciones para colocar una nueva unidad de Héroe disponible, cogida al azar, en el Centro de la Ciudad o en cualquier espacio Inicial.');
dest('planes', 'Los diabólicos planes del Dr. Marteuse', 'o', 'T', 0, 'Roba otra carta de Destino para determinar la ruta. Después, tira 1 dado por cada espacio con Caos en esa ruta: 1-3 = coloca ahí una nueva unidad Zed; 4-6 = sin efecto. Después coloca una nueva unidad Zed en el espacio Inicial de cada ruta.');
dest('protestas', '¡Protestas ProZeds!', 'o', 'choice', 0, 'Tira 1 dado y aplica el resultado como pérdidas en cualquier combinación de: a) Suministros, b) Munición, c) Incrementos de Infección, d) Impactos a unidades de jugador.');
dest('candado', 'Un candado oxidado', 'o', 'M', 0, 'Retira 1 Componente de la Súper Arma si has descubierto alguno; si no, pon una carta de Investigación Inicial al azar encima del mazo. Coloca una nueva unidad Zed en el Inicial de la ruta con menos Zeds.');
dest('cama', 'De la cama del hospital al fragor de la batalla', 'o', 'T', 1, 'Durante la fase de Acciones, juega esta carta para Curar sin coste a cualquier unidad de Civiles en el Hospital (a su máximo de salud, pero solo reduces 1 de Infección). Después, coloca esa unidad en un espacio de la superficie con nombre que no esté controlado por Zeds.');
dest('expediente', 'Expediente del Proyecto Farmingdale', 'o', 'T', 1, 'Juega esta carta durante la fase de Acciones cuando tengas una unidad de jugador en la Oficina del Dr. Marteuse: revela sin coste la siguiente carta del mazo de Investigación.');
dest('desesperados', 'Tiempos desesperados, medidas desesperadas', 'o', 'less', 1, 'Juega esta carta en cualquier momento. Gasta 1 de Munición para reducir la Infección en 5 inmediatamente.');
dest('barrelotodo', 'Don Barrelotodo', 'o', 'less', 1, 'Juega esta carta en cualquier momento para retirar 2 fichas de Caos (sin aumento de Infección).');
/* Amarillas (Nivel III) */
dest('exploradores', 'Grupos de exploradores desplegados', 'y', 'lessC', 1, 'Juega esta carta en cualquier momento para mover cada unidad de Refugiados (incluyendo Supervivientes V.I.P.) que esté en un espacio adyacente a una unidad Zed 1 espacio más cerca del Centro de la Ciudad.');
dest('hedor', 'Zeds que segregan un hedor nocivo', 'y', 'B', 0, 'Coloca la ficha de Pestilentes en la unidad Zed más alejada del Centro de la Ciudad (la más fuerte si hay empate). Si esta unidad se mueve sin iniciar un combate y hay unidades que no sean Zeds en el espacio delante, la unidad Zed realiza un ataque con Arma de Fuego contra ellas, sin Terreno.');
dest('hoguera', 'Hoguera macabra', 'y', 'less', 1, 'Usas unas reservas de queroseno para quemar cuerpos infectados. Juégala en cualquier momento para reducir la Infección en 2.');
dest('otra_manera', 'Lo haremos de otra manera', 'y', 'more', 0, 'Por cada unidad de Refugiados en el Campamento de Refugiados (si hay), tira 1 dado: 1 = retira la unidad de Refugiados de la partida; 2-5 = sin efecto; 6 = los Refugiados se quedan y puedes Curar 1 Impacto a cualquier unidad de Civiles (reduce la Infección con normalidad).');
dest('trago', 'Un trago para coger fuerzas', 'y', 'F', 1, 'Juega esta carta al inicio de cualquier combate Cuerpo a Cuerpo para obtener 2 columnas a favor de un solo uso. Sin embargo, al final de esa lucha la unidad de jugador sufre 1 Impacto.');
dest('bubba', 'Banda de Bubba DeNardo', 'y', 'choice', 0, 'Coloca la unidad de Saqueadores Banda de Bubba en el espacio Inicial de la ruta con menos unidades Zed. Mueve 1 espacio por turno durante la fase 4R hacia el Centro. Si llega, pierdes Suministros y Munición igual a su Fuerza y las unidades en un espacio de Ciudad o el Centro sufren 1 Impacto. 1 columna a favor en todos sus combates.');
dest('punto_partida', 'De vuelta al punto de partida', 'y', 'A', 0, 'Tira 1 dado: 1-2 = coge 2 cartas de Investigación Inicial al azar y ponlas encima del mazo de Investigación; 3-5 = coge 1; 6 = sin efecto.');
dest('zed_alfa', 'Emerge un Zed alfa', 'r', 'F', 0, 'Coloca la ficha de Líder en la unidad Zed Normal más fuerte (la más próxima al Centro en caso de empate). Después, activa su ruta (moviendo todas las unidades Zed situadas en ella con normalidad). La unidad Zed Líder obtiene 1 columna en contra en combate Cuerpo a Cuerpo hasta que sea eliminada.');
dest('tiradles', '¡Tiradles algo!', 'o', 'A', 1, 'Juega esta carta cuando una de tus unidades sea atacada en combate Cuerpo a Cuerpo. Antes de resolverlo, realiza un ataque con Arma de Fuego de Fuerza 2 (sin coste de Munición) contra los atacantes. Después continúa con el combate.');
/* Rojas (Nivel V) */
dest('contagio', 'Contagio mortífero', 'r', 'choice', 0, 'Resuelve de inmediato un Brote Descontrolado (¡pero no reduzcas la Infección!). Además, coloca una unidad que esté en el Centro de la Ciudad (si hay alguna) en el Hospital con solo 1 Impacto restante.');
dest('heli_noticias', 'Encuentras el helicóptero de las Noticias-12', 'r', 'moreC', 1, 'Juega esta carta cuando un Héroe realice una Acción de Mover para recogerlo de cualquier espacio en la superficie y colocarlo en cualquier otro espacio de la superficie. El Hospital y el Laboratorio se consideran espacios en la superficie.');
dest('senal', 'La señal de rescate trae un envío de suministros', 'r', 'B', 1, 'Juega esta carta en cualquier momento para obtener 2 Suministros y 2 de Munición.');
dest('hipnotizados', 'Zeds hipnotizados', 'r', 'T', 1, 'Juega esta carta durante la fase de Zeds para cancelar todas las activaciones Zed en una ruta cualquiera.');
dest('necesidad', 'La necesidad agudiza el ingenio', 'r', 'F', 1, 'Juega esta carta durante la fase de Acciones para convertir 2 Suministros en 1 de Munición. Puedes hacer esto tantas veces como quieras este turno.');
dest('florecimiento', 'El florecimiento', 'r', 'lessC', 0, 'Reemplaza la unidad Zed más débil (incluso si es Propagador o Súper Zed) por una nueva unidad Zed Normal. Si hay empate, reemplaza todas las unidades más débiles por nuevas unidades Zed Normales. Retira todas las fichas de Impacto de las unidades Zed.');
dest('averia', 'Avería grave', 'r', 'B', 0, 'Retira 1 Componente de la Súper Arma si has descubierto la Súper Arma. De lo contrario: a) coge al azar una carta de Investigación Inicial y ponla encima del mazo, o bien b) activa la ruta (moviendo las unidades Zed con normalidad) con menos Zeds (elige en caso de empate).');
dest('canon', 'Cañón histórico de Farmingdale', 'r', 'T', 1, 'Juega esta carta durante la fase de Acciones para realizar un ataque gratuito con Arma de Fuego de Fuerza 5 contra cualquier espacio n.º 0 ó n.º 1 en la superficie (sin consumir Munición). Después tira 1 dado: 1-5 = descarta la carta; 6 = guárdala.');

/* ---- Investigación ---- th: tirada mínima (1 dado), sup: coste en Suministros. kind: ini (inicial) | adv (avanzada normal) | spe (avanzada especial «!») */
const RES = {};
function res(id, name, kind, th, sup, perm, txt) { RES[id] = { id, name, kind, th, sup, perm, txt }; }
res('dcp', 'Encargo del D.C.P.', 'start', 3, 0, 0, 'Esta carta se coloca en la pila de descarte del mazo de Investigación. Puedes empezar a investigar la cura para el Z.E.D.');
res('uhm', 'Uhm, interesante…', 'ini', 5, 0, 0, 'Reduce la Infección en 2.');
res('intoxicados', 'Zeds «intoxicados»', 'ini', 4, 0, 1, 'Mientras esta sea la carta de Investigación en Curso, al principio de cada fase de Acciones puedes infligir 1 Impacto a la unidad Zed más débil adyacente a cualquier unidad de Civiles o de Héroe.');
res('noticias', 'Nos llegaron noticias de tu muerte', 'ini', 5, 0, 0, 'Puedes coger de inmediato una unidad del Cementerio y colocarla en el Centro de la Ciudad con solo 1 Impacto restante.');
res('distraccion', '¡Mira! ¡Una distracción!', 'ini', 4, 0, 1, 'Mientras esta sea la carta en curso, puedes hacer que tus unidades de Civiles Normales sufran 1 Impacto y después se retiren (si sobreviven) para impedir que las unidades Zed adyacentes avancen. No impide la colocación de nuevas unidades Zed.');
res('sasha', 'Sasha Brooks ofrece su ayuda', 'ini', 3, 0, 0, 'Sin Evento Especial.');
res('folletos', 'Distribución de folletos', 'ini', 5, 0, 0, 'Cura hasta dos unidades Civiles 1 Impacto a cada una con las correspondientes reducciones de Infección.');
res('esperanza', 'Rumores de esperanza', 'ini', 4, 0, 1, 'Mientras esta sea la carta en curso, añade +1 a todas tus tiradas de Salvación.');
res('cecina', 'Cecina Zed', 'ini', 5, 0, 0, 'Obtienes 2 Suministros.');
res('musica', '¡Bajad la música!', 'ini', 5, 0, 0, 'Las unidades Zed en un espacio cualquiera se retiran de inmediato.');
res('cientificos', 'Científicos seguros de sí mismos', 'ini', 5, 0, 0, 'Retira 1 ficha de Caos de forma gratuita sin aumentar la Infección.');
res('medio', 'A medio convertir', 'ini', 4, 0, 1, 'Mientras esta sea la carta en curso, todos los Brotes Zed hacen descender automáticamente el nivel de Infección a 2.');
res('escasean', 'Escasean materiales para la Investigación', 'ini', 5, 0, 1, 'Mientras esta sea la carta en curso, puedes gastar 1 Suministro en lugar de 1 Acción para Investigar.');
res('pruebas', 'Necesita más pruebas', 'ini', 4, 0, 0, 'Pierdes un Componente al azar de la Súper Arma si has descubierto algún Componente. De lo contrario, coge al azar una carta de Investigación Inicial y ponla en la parte superior del mazo.');
res('hormona', 'Hormona anticrecimiento', 'adv', 5, 1, 0, 'Puedes reemplazar una unidad de Súper Zeds por una unidad al azar de Zeds Normales, conservando la cantidad de Impactos que hubieran recibido.');
res('ahora', 'Campaña del «Ahora o nunca»', 'adv', 5, 1, 1, 'Mientras esta sea la carta en curso, incrementa en 1 el resultado de tus tiradas de Buscar.');
res('antinatural', 'Selección antinatural Zed', 'adv', 5, 1, 1, 'Mientras esta sea la carta en curso, al colocar cualquier nueva unidad Zed o de Súper Zeds, roba dos unidades de ese tipo y elige cuál de ellas colocar.');
res('vacunas', 'Las vacunas ayudan', 'adv', 5, 1, 1, 'Mientras esta sea la carta en curso, todos los Brotes colocan las nuevas unidades Zed y de Súper Zeds en los espacios Iniciales.');
res('heroe_c', 'Llega un Héroe Científico', 'adv', 5, 1, 0, 'Coge una nueva unidad de Héroe Científico al azar y colócala en el Centro de la Ciudad.');
res('atascada', 'Investigación atascada', 'adv', 4, 1, 0, 'Sin Evento Especial.');
res('antidoto', 'Avances en el Antídoto', 'spe', 6, 1, 0, 'Si el Componente Final no está en el Laboratorio, colócalo y baraja esta carta de nuevo en el mazo de Investigación. Si ya estaba, dale la vuelta (Antídoto): reduce la Infección en 1 al final de cada fase de Mantenimiento.');
for (let k = 1; k <= 4; k++) res('arma' + k, 'Función para la Súper Arma', 'spe', 5, 1, 0, 'Elige un Componente de la Súper Arma y ponlo en juego. Si solo te falta el cuarto Componente, lo recibes únicamente si la Profesora Agee está en el Laboratorio.');
const WEAPON_EXT = { granada: '.jpg', rifle: '.jpg' };
const WEAPON_PARTS = {
  nudillos: { name: 'Nudillos Zeds', txt: '1 columna a favor en tus ataques Cuerpo a Cuerpo (no al defender).' },
  rifle:    { name: 'Rifle Hipno-Z', txt: '1 columna a favor en todos tus ataques con Arma de Fuego.' },
  balas:    { name: 'Balas de Doble Fósforo', txt: 'Si un ataque con Arma de Fuego causa 2 o más Impactos, todas las unidades Zed del espacio objetivo se retiran.' },
  granada:  { name: 'Granada de Gas', txt: 'Gasta 1 Acción: 4 Impactos repartidos entre las unidades Zed de un espacio adyacente, y añade una ficha de Caos a ese espacio.' },
  cebo:     { name: 'Cebo para Zeds', txt: 'Cada vez que una unidad de jugador defienda contra un ataque Cuerpo a Cuerpo de Zeds, causa 1 Impacto extra tras el combate.' }
};
