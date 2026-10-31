# Novedades

Registro de cambios por publicación (push a `main`). Lo más reciente, arriba. Cada entrada lleva la misma fecha y hora que `BUILD_TIME` de `js/version.js`.

## 2026-10-31 11:50

### Fixes
- **Fichas del SAR y del Club de Caza:** el indicador de Movimiento ahora es una flecha con punta y el cuadro de Fuerza tiene las proporciones y los colores de las fichas originales (número grande en crema y Fuerza de la otra cara pequeña, en gris).

## 2026-10-31 11:30

### Nuevo
- **Nuevo Civiles Heroicos: Club de Caza de Farmingdale** (expansión 4, nivel 2, Fuerza 3/2, Movimiento 3). **Puesto de caza:** disparan a 2 espacios sin penalización. **Trofeo:** si su disparo elimina a una unidad Zed, recuperan 1 Munición. **Presa marcada:** Acción de Personaje (1 Acción, una vez por turno): marcan una unidad Zed a su alcance y los disparos de cualquier unidad contra ella tienen 1 columna a favor ese turno. **A campo abierto:** 1 columna en contra en combates Cuerpo a Cuerpo. Con carta (frente y trasera) y fichas ilustradas; `tools/generar_caza.mjs` las regenera.

## 2026-10-31 10:40

### Nuevo
- **Nuevo Civiles Heroicos: Búsqueda y Rescate (SAR)** (expansión 4, nivel 2, Fuerza 3/2, Movimiento 3). **Despejar:** Acción de Personaje (1 Acción, una vez por turno, aunque haya Caos en su espacio): en el Mantenimiento quita 2 fichas de Caos de ese espacio sin subir la Infección. La restauración normal de ese espacio tampoco sube la Infección. **Escudo humano:** 1 columna a favor en combates Cuerpo a Cuerpo y al disparar mientras haya Refugiados o Aldeanos en su espacio. Con carta (frente y trasera) y fichas ilustradas; `tools/generar_sar.mjs` las regenera.

### Fixes
- **Registro de partida:** los eventos de Infección guardaban el cambio en el campo `n` y pisaban el número de secuencia del evento; ahora va en `d`. Lo mismo con el barajado del Destino (`cartas`).

## 2026-10-30 16:12

### Fixes
- **Obituario de los héroes de la expansión 4:** Bender, Ash, Frank, Doc, Sam Carter y MacGyver ya tienen su ilustración en el obituario (antes salían sin imagen).

## 2026-10-30 14:21

### Fixes
- **«La necesidad agudiza el ingenio» con arte alternativo:** con la opción activada salía la carta original; ahora tiene su carta nueva con la ilustración del taller de munición.

## 2026-10-30 12:52

### Mejoras
- **Nuevo héroe: Frank «El Castigador» Castle** (expansión 4, nivel 3, Militar, Fuerza 4/3, Resistente). Arsenal privado (4 de Munición y 2 Suministros al entrar), Tirador implacable (1 columna a favor al disparar y repite un disparo por turno), Sin piedad (si gana un combate Cuerpo a Cuerpo, la Infección no sube), Lobo solitario (1 columna a favor al defender si está solo) y Trampa explosiva: por 1 Suministro coloca una trampa en una ruta (también en el Túnel, una por ruta); al intentar entrar un Zed, cada unidad Zed sufre 1 Impacto y su movimiento se cancela. Aún sin ficha ni carta ilustradas.
- **Nuevo héroe: Dr. Emmett «Doc» Brown** (expansión 4, nivel 3, Científico, Fuerza 2/1). Puede Investigar en el Laboratorio; Mr. Fusion (+1 Suministro si Buscar no encuentra nada); Salto temporal: por 3 Suministros, una vez por turno y solo desde el Centro, viaja con una unidad opcional (no Pepinillos, Horacio, Lee ni Carter) a un espacio de ruta de superficie sin Zeds; la unidad puede quedarse y Doc vuelve al Centro tras el Mantenimiento. Si está en un espacio con Caos durante el Mantenimiento, restaurar el orden allí no sube la Infección. Aún sin ficha ni carta ilustradas.
- **Nuevo héroe: Dra. Samantha Carter** (expansión 4, nivel 3, Científica, Fuerza 3/2). Investiga en el Laboratorio con +1 y repite una Investigación fallida una vez por partida; 1 columna a favor al disparar; «En el último segundo»: una vez por partida cancela hasta 3 de una subida de Infección de 2 o más (o que llegue a 13). Aún sin ficha ni carta ilustradas.
- **Nuevo héroe: Angus MacGyver** (expansión 4, nivel 2, Ciudadano, Fuerza 3/2). No dispara; convierte 1 Suministro en 2 Munición (1 vez por turno), construye Barricadas por 1 Suministro, puede Investigar en el Laboratorio (si falla por 1, gasta 1 Suministro para sumar +1) y, al ser atacado en una ruta, se retira gratis hacia el Centro con 4-6. Aún sin ficha ni carta ilustradas.

## 2026-10-28 14:45

### Fixes
- **Botón de la pantalla final:** «Nueva partida» pasa a llamarse «Menú principal» y lleva al menú principal, sin volver a la animación de inicio.

## 2026-10-28 14:26

### Mejoras
- **Cartas de Investigación con arte alternativo:** 21 cartas nuevas en webp ligero (unos 40 KB cada una) con ilustración, umbral, suministro, tipo y texto. Se usan con «Usar arte alternativo» activado; las cuatro «Función para la Súper Arma» siguen con la original.

## 2026-10-28 12:00

### Fixes
- **La partida empezaba sin mapa:** al cargar el mapa solo al elegirlo, el tablero tardaba en aparecer. Ahora se precargan ambos mapas en segundo plano al abrir el juego y la partida espera a que el suyo esté listo antes de empezar.
- **Distribución de folletos no preguntaba:** ahora eliges a cuál de las (hasta dos) Civiles heridas curas, se baja 1 de Infección por cada una y queda anotado en el registro.
- **Selección antinatural Zed no preguntaba:** con esta Investigación en curso se roban dos unidades (Zed o Súper Zed) y ahora eliges cuál se coloca; la otra vuelve a la reserva. Antes elegía sola la más débil.

## 2026-10-25 14:51

### Mejoras
- **Carga mucho más rápida:** las fichas pasan de PNG a webp (de 8,1 MB a 1,2 MB), el mapa solo se descarga al elegirlo, héroes, Súper Zeds y Rumores se cargan en segundo plano y el service worker guarda fichas, mapas e intro para las siguientes visitas.

### Fixes
- **Cartas de Evento con arte alternativo que no cargaban:** la tabla de formatos de las imágenes alternativas apuntaba a `.jpg` donde ya hay `.webp`.

## 2026-10-24 19:35

### Fixes
- **Deshacer en combates provocados por tu movimiento:** si un movimiento te lleva a un combate, la ventana de combate muestra «↶ Deshacer el movimiento» junto a «Tirar dados». Mientras no se tire ningún dado, puedes volver atrás (la unidad vuelve a su espacio y se recupera lo gastado). Una vez tirados los dados, ya no se puede deshacer.

## 2026-10-23 17:18

### Mejoras
- **Cartas de Destino «en cualquier momento» jugables cuando hacen falta:** el juego ahora pregunta si quieres jugarlas en el momento clave, no solo en la fase de Acciones. **Don Barrelotodo**: al avisar de poco Caos (3 o menos) y siempre antes de colocar una ficha que causaría la derrota. **Tiempos desesperados / Hoguera macabra**: al empezar la fase de Infección con Infección 10+ y antes de un Brote Descontrolado. **La señal de rescate**: en Alimentación, si faltan Suministros. **Grupos de exploradores**: antes de activar los Zeds si hay Refugiados junto a ellos. Cada aviso sale una vez por turno, salvo los de derrota o Brote inminentes.

## 2026-10-23 17:02

### Mejoras
- **«Llega un Héroe Científico»:** ahora eliges qué Héroe Científico disponible llega al Centro (antes se cogía el primero de la lista).

## 2026-10-23 16:54

### Mejoras
- **Ventana de combate con el detalle de cada Zed:** cada Zed muestra su ficha, fuerza, Impactos, cara reducida y sus estados (Tóxicos, Inteligentes, Rápidos, Resistentes, Pestilentes, Líder Zed); los Súper Zeds, además, su habilidad. Pasar el ratón por la fila abre el tooltip completo.
- **Modificadores de columna con su origen:** «Inteligentes», «Líder Zed» y «Zeds flambeados» indican qué Zed los causa.

## 2026-10-22 17:34

### Fixes
- **Evasiones con más unidades en el espacio:** si la unidad defensora esquiva el combate (Cardio, Sigilo de Pepinillos, Alyssa Darling con un 2, Evasión de Alia), los Zeds atacan igualmente a las demás unidades del espacio: se elige otra defensora. Antes se quedaban junto a los Zeds sin combatir.

## 2026-10-19 19:53

### Mejoras
- **Guardado más ligero y seguro:** el registro de eventos se guarda aparte de la partida. Si el almacenamiento del navegador se llena, se recorta el registro antes que perder la partida, y si aun así no se puede guardar, el log de la partida lo avisa.
- **Deshacer más rápido:** cada instantánea ya no copia el registro de eventos (pasa de cientos de KB a unos pocos).
- **Mapa más fluido:** el fondo y los marcadores (Caos, Barricadas, Minas, Rumores, puente, «No Pasar») se pintan en una capa aparte que solo se rehace cuando cambian; cada fotograma de animación o de aviso de peligro cuesta menos de la mitad.
- **Tras un error inesperado** la partida se recarga directamente desde su último guardado, en lugar de volver al menú.
- **Códigos de partida:** el orden de los héroes queda fijo, así que añadir héroes nuevos no invalida los códigos ya compartidos.
- **Arte alternativo:** más cartas de Evento y Destino en webp; la carta de los Ángeles de Petra se ve siempre.
- Limpieza de código sin uso.

### Fixes
- **Volver del Cementerio** («Nos llegaron noticias de tu muerte», «Rumores de nuestra muerte», Equipar Refugiados): tras cargar o deshacer, la unidad seguía también en el Cementerio (salía en el Obituario y no podía volver a entrar). Las partidas guardadas con el fallo se corrigen al cargarlas.
- **Cripta:** el Zed que sale de una Cripta respeta el límite de agrupamiento del espacio de destino.
- **Evasiones** (Cardio, General Lee, Darling, trampas de Johnson, Alia): si la retirada acaba en un espacio con Zeds, hay combate, como en cualquier retirada.
- **Campo de Refugiados:** las unidades del Campo ya no pueden volver a «llegar» al Centro (cada llegada repetida sumaba Infección, Rumores y beneficios V.I.P.).
- **Lluvia torrencial:** el Zed que retrocede respeta el límite de agrupamiento.
- **Odio cuando pasa eso:** el Zed nuevo ya no puede ser la misma ficha débil que se retira.
- **Base aérea secreta:** la Acción de Evento extra respeta el máximo de 4.

## 2026-10-19 18:43

### Mejoras
- **Elegir ruta:** al tocar una ruta la cámara va a su zona y queda marcada; hay que pulsar «Aceptar» para confirmar. «Aleatorio» sigue resolviendo al instante.

### Fixes
- **Banda de Bubba que se retira:** al caer en un espacio vacío ya no lucha contra sí misma. Un Zed (o una Banda) que se retira no cuenta como ocupante de su nuevo espacio.

## 2026-10-19 17:27

### Mejoras
- **Registro de partida exhaustivo:** guarda la semilla y la posición del generador en cada evento, y cada aparición, movimiento y retirada de Zeds con su causa (carta, ruta, Brote…). También las cartas de Destino, la Infección, los dados, las decisiones del jugador y los mensajes del log. Exportación con bloque `config` (semilla, nivel, héroes, expansiones).
- **Marines:** la carta y la ficha aparecen juntas y la ficha vuela a su espacio, como los Súper Zeds.
- **Orden de rutas:** nuevo botón «Aleatorio (resto)» que activa las rutas restantes en orden aleatorio.
- **Tiradas con +1:** Investigar (Profesora Agee) y Buscar (Hauser, Hernández en Ciudad, carta «Ahora») muestran el modificador antes de tirar; después el dado se anima para sumarlo.
- **Preguntas de Zeds:** la cámara se centra en los espacios de la pregunta (p. ej. «¡Mira! ¡Una distracción!»).

### Fixes
- **Súper Zeds del Brote:** los que salen de un Brote Descontrolado se registran con la causa «Brote», no con la carta de Destino que elige la ruta.
- **Trabajando una jornada doble:** la opción de investigar gratis solo se ofrece si se puede pagar; antes la Infección subía aunque no hubiera Suministros.

## 2026-10-19 04:41

### Mejoras
- **Debug · Mazos:** el botón «Mazos» solo aparece cuando está marcada la casilla de depuración de la pantalla Debug (la misma que cambia los dados tras cada tirada). Desmarcarla lo oculta al momento.

## 2026-10-19 03:18

### Mejoras
- **Debug · Mazos:** nuevo botón «Mazos» en la cabecera (junto a «Registro») que muestra los mazos de Eventos y de Destino en el orden en que van a salir, con miniaturas numeradas (la 1 es la siguiente carta). Las cartas de Eventos marcan la final, y el descarte de Destino aparece debajo. Pasando el ratón sobre una carta se amplía.

## 2026-10-15 16:20

### Mejoras
- **Fase de cada carta de Evento:** cada carta se resuelve en la fase que marca la pestaña de la imagen original (4R, Infección, Zeds o Acciones); el texto da el momento exacto. La tabla `EV_FASE` de `js/expansions.js` recoge las 100 cartas y la ficha de la carta muestra su fase. Las vistas previas de Desesperación, Odio, Tóxicos, Moteros e Inteligentes avisan de que se resuelven en Acciones con el tablero de ese momento.
- **Catálogo de cartas:** `catalogo/catalogo_cartas.html` (buscador por texto, id, tipo, fase y nivel) y `catalogo/catalogo_cartas.md`, generados con `npm run catalogo` a partir de los datos del juego: 246 entradas (Eventos, Destino, Investigación, héroes, unidades, Súper Zeds, Rumores y Súper Arma), con la fase y la función que aplica cada efecto.
- **Arte alternativo:** fichas de los Zeds normales (heridas con una X de arañazo por Impacto), de los Súper Zeds, de Noelle y de las Alimañas, con la ficha en vuelo al llegar.

### Fixes
- **Cartas con la pestaña en otra fase:** 4R (Artefacto, Hace falta, Saqueadores, Turba), Infección (Contaminación, Aquí, doctor) y Acciones (Accidente, Armados, Civiles heroicos, Crisis, Desesperación, Elwood, Fortuna, Helicóptero, Héroe, Keep calm, Marines, Misiles, Moteros, Murciélagos, Odio, Tóxicos; y al final de Acciones Frenesí, Súper enloquecidos e Inteligentes) se aplicaban al inicio de la fase de los Zeds. Ahora cada una va en su fase. Los Saqueadores se mueven el turno en que aparecen.
- **De una vez por todas, buenas noches:** ya no gana antes de la fase de los Zeds; gana al inicio de Acciones, con las rutas activadas, como las demás cartas de victoria.
- **Atajos (Evento):** el botón se puede repetir tantas veces como se quiera.

## 2026-10-15 12:39

### Fixes
- **Llegada de la Banda de Bubba (y Brotes):** las unidades que aparecen en la fase de Infección (Brotes y sus cartas de Destino) ahora también vuelan desde la columna junto a la carta de evento, como el resto de apariciones. Antes aparecían de golpe.
- **Carta «¡Llega la Guardia Nacional!»:** la Destino que roba al entrar y las unidades que aparecen con ella vuelan desde la columna junto a la carta de evento.
- **Cartas de Destino que traen unidades (p. ej. «Banda de Bubba DeNardo»):** las unidades que aparecen al resolver una carta de Destino vuelan desde la columna, sea cual sea la fase en que se roba (también los Rumores).
- **«Llega un Héroe» (Destino):** primero se revela la carta del Héroe que llega y después se elige el espacio donde se coloca (antes era al revés).
- **Wilson «Atajos»:** el atajo lo puede usar cualquier unidad agrupada con él (o que pase por su espacio), no solo él mismo. Si Wilson está en una Cripta, sus unidades salen sin tirar.
- **Wilson «Atajos» con el Túnel:** desde un espacio del Túnel se puede saltar al mismo número de la Autovía o de las Afueras, y viceversa (1 Movimiento).
- **Atajos de Wilson encadenados:** un movimiento solo puede usar un atajo. Antes Wilson podía saltar de Montaña a Bosque y de ahí a Afueras en un mismo movimiento.
- **Retirada tras perder un combate:** una unidad que pierde un combate no puede retroceder por el atajo de Wilson. Si el espacio de vuelta solo se alcanza por atajo, se retira hacia el Centro.
- **Arte alternativo de Eventos y Destino:** con «Usar arte alternativo» activado, las cartas de Evento y de Destino usan las ilustraciones de `assets/arte_alt/eventos` y `destino` (las que existan; el resto usa la original). Se aplica también a la ventana de la carta, al zoom y a la vista previa de cartas.
- **Xeno Jones en la fase 4R:** cada activación de Refugiados puede gastarse en trasladarlo: desde cualquier sitio, al Laboratorio o a una Oficina del Personal; desde el Laboratorio o el Hospital, a cualquier espacio vacío que no sea Inicial. No gasta Acción de Personaje.
- **Fichas de «Lo que va a pasar»:** con el arte alternativo activado, las fichas Zed de la vista previa usan el arte nuevo.
- **Visiones de Wilson:** el botón pasa a la ficha de Wilson, entre sus acciones, en lugar de estar en el panel de estado.
- **Zed que entra en un espacio con Saqueadores o unidades de jugador:** ahora empieza el combate también si el espacio es un Inicial o si hay Saqueadores (antes no combatía).

## 2026-10-15 12:26

### Fixes
- **Mensajero del Clarín en la preparación:** si sale como Civil Heroico inicial, ahora trae otra Civil Heroica al empezar la partida, igual que al entrar en juego durante la partida.

## 2026-10-15 04:30

### Fixes
- **Llegada de unidades:** la ficha que vuela hasta el mapa usa ahora el arte alternativo (héroes, civiles heroicos, Súper Zeds y unidades especiales) y conserva su proporción. Además ya no se queda la última ficha pegada en pantalla al terminar el vuelo.
- **Zeds con arte alternativo:** las fichas vuelven a los colores originales de las ilustraciones (se quita el filtro de brillo y saturación).

## 2026-10-14 15:22

### Mejoras
- **Baile de la victoria:** al ganar, las fichas de jugador bailan al ritmo de la pista de victoria. Cada ficha salta al menos 10 veces en cada casilla y avanza por el tablero hasta el Centro; después, parejas de fichas intercambian sitio en cada pulso. Los Zeds se quedan quietos. Antes de la entrada de la batería (14 s) las fichas solo saltan en su casilla. El baile dura lo que suene la pista y se puede saltar con un clic o una tecla; luego las fichas vuelven al tablero.
- **Mapa de beats de la victoria:** `assets/sonidos/musica/musica_victoria.beats.json`, generado con `tools/generar_beats.py` (librosa). Los cortes de batería (huecos de más de 1.2 s) dejan las fichas quietas.
- **Cuando la batería para o se acelera:** las fichas no avanzan dentro de los cortes del mapa.
- **Zeds con arte alternativo:** nueve tipos de Zed normal con su arte (fichas y heridas con una X roja por Impacto). La fuerza reducida aparece en la ficha.
- **Unidades especiales:** carta entera de Marines, Guardia, Petra y otras, con su trasera cuando existe.
- **Registro:** cada tirada de dados y cada Investigación quedan anotadas (para depurar).
- **Apariciones:** las unidades que llegan en las fases de Zeds salen de una columna junto a la carta de evento.
- **Súper Arma:** la Guardia Nacional solo se beneficia de las partes una vez llega al Centro de la Ciudad (y las conserva si luego sale).
- **Música:** los cambios entre temas de fondo, peligro y Last Stand son fundidos cruzados.

### Fixes
- **Victoria «Al inicio de esta fase» (fin_b1):** el juego termina nada más empezar la fase, con su texto de victoria.
- **Marines:** tienen Impactos (2 por cara), como los demás Civiles Especiales.

## 2026-10-14 08:13

### Mejoras
- **Guardia de Seguridad Diamante Rojo:** arte alternativo de su ficha y su carta, y texto completo de la carta (Patrulla del Túnel, Acceso Diamante Rojo…).
- **Santana:** carta alternativa nueva y texto completo: la Carga del Toro no sirve contra Súper Zeds, resiste 4 Impactos como los Civiles y es mal tirador.

### Fixes
- **Súper Zed:** la partida podía quedarse parada con la ficha en grande en el centro de la pantalla. Ahora la ficha se coloca siempre (aunque el navegador pause la animación), se puede continuar con OK, con un clic en cualquier parte o con Intro/Espacio/Esc, y en pantallas bajas la ficha se encoge para que el botón OK no quede fuera.
## 2026-10-13 19:35

### Mejoras
- **Ángeles de Petra:** texto completo de su carta (Motos, Combustible, Aislamiento). Fuera del Centro no se agrupan con Héroes ni Civiles, y al retirarse se saltan los espacios donde estén ellas. Arte alternativo de su ficha y su carta.
- **Mapa en tablets y trackpad:** el zoom con rueda o pellizco ya no se queda congelado hasta soltar, la cámara guiada no mueve el mapa mientras lo arrastras, y el aviso de peligro redibuja menos veces (menos tirones).
- **Móvil:** los avisos son más pequeños y no tapan el mapa.
- **«El misterioso Dr. Marteuse»:** con varias cartas de Destino guardadas eliges cuál descartas. **«Bomberos»:** con varias fichas de Caos en un Pueblo eliges cuántas retiras (+1 Infección por ficha). **«Científicos seguros de sí mismos»:** eliges de qué espacio retiras el Caos.

### Fixes
- **Partida congelada:** si la unidad seleccionada moría fuera de la fase de Acciones (en Infección o en la fase de los Zeds), el juego daba un error y se quedaba parado: se podía mover el mapa pero no hacer nada hasta salir y volver a entrar. Ahora se quita la selección. Además, si el flujo de la partida se para por cualquier otro error, sale un aviso y se recarga desde el último guardado.
- **Pérdidas a elegir:** ya no se ofrece pagar con Suministros o Munición que están a 0, ni con Impactos si no te quedan unidades.
- **«Florecimiento»:** se roba la ficha nueva antes de devolver la vieja (no puede volver a salir la misma); Súper Zeds y Propagadores salen de la partida.
- **Guardia Nacional:** vuelve a su posición fija en el mazo de Eventos en vez de barajarse con el Acto III.
- **«El pánico…»:** el Movimiento gratis solo se ofrece si hay de verdad un destino gratis.
- **Trenes (exp. 3):** no puntúan como unidades al final.
## 2026-10-13 10:01

### Mejoras
- **Amuleto de la suerte (Wilson):** la unidad agrupada con él (fuera del Centro) tira un dado extra y elige el mejor en todas sus tiradas: combate, disparo, Salvación, resistir Impactos, Buscar y las tiradas de habilidad (Sigilo de Pepinillos, Ataque asesino de Darling, Evasión de Alia, Trampas de Johnson, Carga del Toro).
- **Expansión 1:** May recibe su +1 columna y su dado extra al disparar (y no se da el +1 de Fuerza a sí misma). El General Lee puede retirarse antes de ser atacado («¡Corre, Flicka, corre!») y su «Instinto equino» impide entrar en Caos y en el Túnel sin jinete. «¡Estáis discutiendo!» deja elegir a las dos unidades.
- **Expansión 3 (trenes y Rumores):** los trenes se pueden mover en la fase 4R con una activación «R», los Zeds los destruyen al avanzar desde su espacio, y no combaten ni se retiran. La Guardia Nacional no sube a los trenes. Solo puede haber un Rumor sin revelar por ruta; la Tesis devuelve las cartas a tu mano; el teléfono rojo hace tirada de Salvación a las unidades y limpia las fichas del espacio.
- **Betty:** su cadena de combates no entra en espacios con «No Pasar» ni sin sitio para ella.

### Fixes
- **Cartas de expansión:** los eventos de las expansiones 1 y 2 y las 4 cartas de Destino de la expansión 1 salían aunque la expansión no estuviera activada. Ahora solo entran con ella.
- **«¿Qué es ese olor?»:** pasa al Acto IV (su carta tiene 4 estrellas). Con eso los mazos de duración Normal del Juego Básico y del Nivel I vuelven a tener todas sus cartas.
- **Carter:** ninguna otra Curación (Primeros Auxilios de Seaver, Curar de Johnson, Base aérea, Técnico médico V.I.P.) repara su camión, y no se puede curar y reparar el mismo turno.
- **Textos de General Lee:** el «Instinto equino» dice ahora lo que dice la carta (cuando NO lleva jinete).

## 2026-10-13 08:10

### Mejoras
- **Modo cooperativo (hot seat):** el juego pasa a «Solitario · Cooperativo». Hay varios jugadores con su propia Acción de Jugador (barra de jugadores en el panel), y los eventos llevan sus iconos de Presión Zed. Las partidas guardadas antiguas se cargan como de un solo jugador.
- **Alia** y **arte alternativo de los Súper Zeds:** se publican con sus cartas, fichas y obituario.
- **Cartas de Destino:** «Zeds hipnotizados» cancela todas las activaciones de la ruta elegida ese turno. «Avería grave» sin Súper Arma permite elegir entre una carta de Investigación Inicial o activar la ruta con menos Zeds. «Contagio mortífero» deja al elegido en el Hospital sin ECG (con «Hospital lleno» si no hay cama). «Cañón histórico» puede apuntar también a los espacios n.º 0 y n.º 1 del Túnel.
- **Eventos:** «No hay escapatoria» da un segundo ataque tras el primero de cada unidad u Horda Zed (sin evasión en el segundo). «Los Zeds hinchados estallan» deja elegir en caso de empate y tira un ataque por cada unidad adyacente. «¡Oh, no! ¡Otra vez no!» solo usa fichas de Mejora Zed realmente retiradas de la partida.

### Fixes
- **Brote local de Zeds:** también aparece el Zed cuando las Civiles mueren (Cementerio), y los Zeds nuevos no se mueven ese turno.
- **Cañón histórico:** el texto de la carta ya no limita el objetivo a la superficie.

## 2026-10-13 07:42

### Mejoras
- **Nuevo evento «¡Aquí está el Doctor!»** (naranja, Acto 2, especial): al final de la fase de los Zeds la Infección sube a 13 y estalla un Brote Descontrolado completo. Con él, el mazo de la duración Épica del nivel IV vuelve a tener sus 45 cartas.
- **Tirada de Cripta para las unidades de jugador:** al salir de una Cripta del Túnel tiran un dado (1-3 sale, 4-5 se queda y el movimiento se cancela, 6 ¡Perdidos!: nueva tirada y reaparece en el espacio del Túnel con ese número, o se pierde para siempre si coincide con su Cripta). Los Guardias Diamante Rojo y los héroes con la marca «Diamante Rojo» salen sin tirar.

### Fixes
- **Tirada de Cripta de los Zeds:** «Zeds de alcantarilla» usa ahora la misma tirada que el movimiento normal (un 6 es ¡Perdidos!, ya no «se queda»), y un Zed perdido que reaparece no vuelve a moverse ese turno.
- **«¿Qué demonios es eso?»:** el Brote Descontrolado incluye ahora la tirada de Brote, que baja la Infección (antes se quedaba en 13).
- **Lluvia torrencial:** ya no falla si un Zed muere al ser arrastrado.
- **Retirada:** una unidad que retrocede hacia un espacio fuera de ruta (cama, Oficina…) se manda al Centro en vez de dar error.

## 2026-10-13 07:16

### Mejoras
- **Hormona anticrecimiento:** ya funciona. Al revelarla eliges un Súper Zed (o cancelas) y se sustituye por un Zed Normal conservando sus Impactos.
- **Granada de Gas:** ahora repartes tú los 4 Impactos entre los Zeds del espacio objetivo.
- **Botón «Volver al menú»:** el botón «Nueva partida» de la barra y el de la revisión final pasan a llamarse «Volver al menú».
- **Alia, arte alternativo de los Súper Zeds y pantalla de introducción:** se publican también los cambios en curso de estas piezas.

### Fixes
- **«Nos llegaron noticias de tu muerte» y «Rumores de nuestra muerte»:** ya no se cuelgan cuando hay un héroe en el Cementerio.
- **Zeds flambeados:** un Zed que cruza un espacio con Caos recibe 1 Impacto (antes 2), y ninguno si el Caos se coloca al entrar.
- **Selección antinatural Zed:** roba dos fichas y se queda con la más débil, y también se aplica a los Súper Zeds.
- **Combate:** si la Infección llega a 13 en mitad de un combate y la unidad cae, el combate ya no se cuelga.
- **Súper Arma:** el cuarto componente sigue exigiendo a la Profesora Agee en el Laboratorio.

## 2026-10-12 11:04

### Mejoras
- **Opciones:** el menú «Sonido» de la portada pasa a llamarse «Opciones». Mantiene los canales de sonido y añade el interruptor «Usar arte alternativo» para cartas, fichas y obituario.
- **Súper Zed:** al aparecer, la ficha se muestra en grande en el centro con su nombre y su efecto (botón OK). Al pulsar OK vuela hasta su espacio con un recorrido por fotogramas de 1,6 s, y solo entonces se coloca.
- **Rutas:** seis botones debajo del mapa (Bosque, Montaña, Autovía, Afueras, Túnel y Centro) acercan el mapa a esa ruta. Centro incluye el Centro, los espacios n.º 1 y las camas del Hospital.

### Fixes
- **Súper Zed:** las 18 fichas se recortan y quedan transparentes, sin el borde blanco.
- **«¡Sí! Han picado…»:** la carta solo se ofrece si el grupo de Zeds iba a avanzar. Se pregunta después de las habilidades gratuitas (zapatillas de Porter, Perímetro de Kingman, Ladrido de Pepinillos y No Pasar).
- **Lluvia torrencial:** la cámara enseña cada Zed antes de tirar el dado.
- **Cámara:** al abrir una elección de unidad, la cámara se centra en la primera unidad.

## 2026-10-11 19:36

### Fixes
- **Semillas:** «Crear semilla» ahora activa la semilla al momento (la configuración queda fijada, igual que con «Usar semilla»). Antes solo escribía el código y «Empezar la partida» ignoraba la semilla, así que la partida salía al azar y el primer turno variaba.

## 2026-10-11 16:11

### Mejoras
- **Obituario:** el arte se ajusta al alto de la pantalla y ya no se recorta por arriba ni por abajo. En pantalla ancha queda centrado con barras laterales; en móvil vertical se desplaza para dejar al personaje a la vista. Se reajusta al girar o cambiar el tamaño de la ventana.

## 2026-10-11 15:49

### Mejoras
- **Debug · obituario:** la lista de héroes es ahora de multiselección (casillas, «Marcar todos» y «Ninguno»); las estadísticas se inventan al lanzar.
- **Obituario:** al empezar corta toda la música (menú, partida, peligro, Last Stand y tema de fin) para que solo suene la suya; al salir de la simulación vuelve la del menú.

## 2026-10-11 14:11

### Mejoras
- **Menú Debug:** nuevo botón en el menú principal (entre OST y Créditos). Reúne las herramientas de prueba: el interruptor de debug de dados (solo para la sesión; se apaga al recargar y ya no está en Nueva partida) y la simulación del obituario con héroes y estadísticas inventados, que antes estaba dentro de Nueva partida.

## 2026-10-11 13:00

### Mejoras
- **Debug: simular obituario:** en Nueva partida, bloque desplegable «🐞 Debug: simular obituario». Permite añadir héroes (uno a uno o todos), con unas estadísticas inventadas editables (Zeds eliminados y turno de caída), y lanza el obituario. Al salir vuelve a la pantalla de Nueva partida.

## 2026-10-11 12:18

### Mejoras
- **App instalada (Android):** al tocar la pantalla entra en pantalla completa real, aunque la instalación conserve el modo anterior; si se sale, vuelve a entrar al tocar.

## 2026-10-11 12:10

### Mejoras
- **Código de partida:** botones «Copiar» y «Pegar» (lee el portapapeles y carga la semilla directamente).

## 2026-10-11 12:07

### Mejoras
- **Código de partida (semilla):** en Nueva partida, «Crear semilla» genera un código con nivel, duración, expansiones, héroes elegidos y semilla de azar; «Usar semilla» lo carga y fija la configuración. Con el mismo código, el montaje de la partida (héroes, mazos, civiles y tirada inicial) sale igual. Se puede elegir el héroe personal o los 4 héroes a mano.
- **Mapa:** el zoom y el arrastre ya no se quedan atascados tras soltar fuera del mapa o cambiar de pestaña.

## 2026-10-11 06:44

### Mejoras
- **Obituario:** Antonio «Porter» Maestre tiene ilustración propia y aparece entre las bajas (con su foco de luz).

## 2026-10-11 06:40

### Mejoras
- **Exp. 4 · Fiesta privada (Fanmade):** nueva opción en el menú de nueva partida. Añade a Antonio «Porter» Maestre (Ciudadano, 5/3, Movimiento 4) en niveles I–V, no en el Juego Básico.
  - **Artes marciales:** +1 columna a favor al defender Cuerpo a Cuerpo y puede repetir cualquier tirada Cuerpo a Cuerpo.
  - **En zapatillas no se puede pasar:** con 4-6 cancela el movimiento de un Zed que entra en su espacio o en uno adyacente (una vez por fase de los Zeds).
  - **Jefe de equipo:** acción de personaje, una vez por fase de Acciones: 1 acción gratis a un Civil en su espacio o adyacente.
  - Carta, trasera, ficha y ficha reducida con el arte alternativo.
- **Guardia Nacional y Marines:** nuevas fichas y cartas.
- **Arte alternativo:** nuevas ilustraciones de Betty, Carter, Lee y May (carta, trasera, ficha y obituario).

### Fixes
- **Obituario:** en derrota se muestran también los héroes que seguían en pie.

## 2026-10-11 02:02

### Mejoras
- **Caos:** al empezar el turno, si quedan 3 o menos fichas de Caos sale un aviso con el número. Con 3 o menos, el tema de peligro suena; con 1 ficha al empezar el turno, suena «Last Stand».
- **Visiones de Wilson el Ermitaño:** botón en el panel de estado (con Wilson en juego) que muestra la carta superior del mazo de Destino sin robarla. Si el mazo está vacío pero queda descarte, lo baraja y muestra la primera carta.
- **Brote:** la ventana «¡Estalla un Brote!» solo indica dónde aparece el Zed (la ruta la decide la carta de Destino).
- **Debug:** la partida guarda si tenía el modo debug activo y lo recupera al cargarla.
- **Debug de combate:** el resultado de la tirada se marca en la tabla antes de elegir Continuar o Debug.

### Fixes
- **¡Tiradles algo!:** se puede jugar desde la ventana de combate cuando una unidad defiende. Cancela el combate, hace un ataque de Fuerza 2 contra los atacantes y, si quedan Zeds y la unidad sigue en el espacio, empieza un combate Cuerpo a Cuerpo.
- **De vuelta al punto de partida:** ahora tiene efecto (1 dado: 1–2 dos cartas de Investigación Inicial, 3–5 una, 6 nada).

## 2026-10-11 01:10

### Mejoras
- **Horacio:** ficha vertical como las de los héroes (en el arte alternativo), y su tooltip con el texto al lado.
- **Civiles Heroicos:** en el tooltip, cuando la ficha es apaisada, el texto va debajo de la imagen.
- **Brote:** al fallar la tirada de Brote de la fase de Infección, aparece antes una ventana que explica qué va a pasar (cuánto baja la Infección, en qué ruta estalla y qué Zed aparece y dónde). El Zed anunciado es el que se coloca.
- **Tiradas de Salvación con Debug:** con el modo debug activo, la salvación se muestra como las demás tiradas y se pueden cambiar los dados. Sin debug, sigue igual.
- **Obituario:** los 5 s fijos muestran la imagen sin efectos; después aparecen el foco y el nombre. En derrota, tras los caídos aparecen los héroes que seguían en pie.
- **Música:** nuevo tema «Last Stand» (con letra en el panel OST). Suena cuando un turno termina en peligro y el siguiente empieza también en peligro.
- **Créditos:** muestran la fecha de la build.
- **Liderazgo:** los beneficiarios siguen la tabla de reglas (Civiles y Refugiados, también en unidades en coma).
- **Tablet:** el cajón de estado queda fijo y la unidad seleccionada va antes que las acciones.
- **Preguntas sobre Zeds:** grupo nombrado y marcado en el mapa.

### Fixes
- **Xeno Jones, Sus Propios Planes en oficina:** la acción de trasladar una unidad al Cementerio ahora considera las unidades de las camas y de las Oficinas del Personal (antes solo la primera de cada cama).

## 2026-10-10 19:39

### Mejoras
- **Obituario:** durante los 5 segundos fijos, la ilustración se ve tal cual, sin foco de luz ni texto. Pasado ese tiempo aparecen el foco y el nombre, y después el blanco y negro, el negro y el siguiente.
- **Música de peligro:** nuevo tema «Last Stand» (con letra en el panel OST). Suena cuando un turno termina en peligro y el siguiente empieza también en peligro; el tema de peligro «Apocalyptic Slide» sigue sonando como antes en los demás casos.
- **Créditos:** muestran la fecha de la build.

## 2026-10-10 18:28

### Mejoras
- **Obituario:** cada imagen se queda fija unos 5 segundos (sin zoom) entre las transiciones, y el ciclo de bajas se repite en bucle hasta que acaba la canción (o se pulsa «Salir»). Con la Música apagada, el bucle dura lo mismo que el tema. Cada baja dura unos 12 s en total.

## 2026-10-10 18:23

### Mejoras
- **Obituario:** nuevo botón en la pantalla final (aparece si hay bajas de héroes o civiles heroicos). Pasa a pantalla completa cada baja con su ilustración, un foco de luz sobre el personaje, su nombre, su clase, el turno en que cayó y su epitafio. La imagen pasa a blanco y negro, luego a negro y todo se funde para dar paso a la siguiente. Suena el tema «Obituario» y el ciclo se repite hasta que acaba la canción o se pulsa «Salir» (o Esc). Con la Música apagada se hace un solo ciclo. Respeta «reducir movimiento».

## 2026-10-10 18:00

### Mejoras
- **Cartas de Evento y de Destino:** además de la regla, un bloque aparte «Lo que va a pasar» con el resultado concreto según el estado de la partida (por ejemplo, qué Zed o Súper Zed aparece y en qué espacio). La ficha anunciada es la que de verdad se coloca. Cubre unos 20 eventos y 13 cartas de Destino; el resto sigue mostrando solo la regla. Los Brotes anuncian qué aparece y dónde.
- **Cartas en el combate:** «El Hombre sin nombre», «Un trago para coger fuerzas», «Excavadora asesina» y «Algunos civiles se organizan» ya no preguntan cada vez: salen como botones en la ventana de resolución, antes de tirar los dados.
- **Revisar el tablero:** nuevo botón en la pantalla final que oculta el resumen y deja el mapa libre, con una barra para volver.
- **Tablet:** el contador de Acciones, Munición, Suministros e Infección queda fijo al hacer scroll y el panel de acciones de la unidad pasa a ir primero.
- **Fase 4R:** Marines y Guardia Nacional centran la cámara antes de preguntar por su movimiento.
- **Elecciones de recursos:** Buscar, Escasean materiales, Reparar camión y Tall-Mart muestran cuántos Suministros y Munición tienes.
- **Restaurar el orden:** al quitar Caos en Mantenimiento sale un aviso verde en el mapa y el registro indica el efecto en la Infección.
- **Acción Ferry:** con el Puente colgante derrumbado, una unidad en él o adyacente puede darle la vuelta (1 acción). En Ferry entran las unidades que no son Zed, pero su Mover termina ahí. La Cuadrilla de Bob Bauer retira la ficha desde el propio espacio.
- **OST:** las letras van incrustadas en un script, de modo que también se ven al abrir el juego sin servidor.

### Fixes
- **Héroe que llega a la partida:** la pantalla de llegada respeta el arte alternativo.
- **«Un trago para coger fuerzas»:** el Impacto posterior al combate no se aplicaba nunca; ahora sí.
- Service worker: sube la versión de la caché.

## 2026-10-10 11:27

### Mejoras
- **Arte alternativo:** nuevas cartas y fichas ilustradas para 26 personajes (héroes y civiles heroicos). Cada ficha tiene dos caras (completa y reducida) y se muestra en el mapa, en el zoom, en la lista de héroes y en «Carta entera». Se activa en Opciones → «Usar arte alternativo». Sin arte alternativo (May, Betty, Carter y Lee) o si una imagen falla, se usa siempre la original.
- **Menú Opciones:** el botón «Sonido» de la portada pasa a ser «Opciones», con el sonido (música, efectos y voz) y la casilla del arte alternativo.
- **Crónica de la partida:** nueva pantalla tras el final con premios y una ficha por unidad (Zeds eliminados, disparos, combates, Impactos, movimientos y si sobrevivió).
- **Registro de la partida:** botón «Registro» (cabecera y pantalla final) que descarga un JSON con el estado y los eventos de la partida, para depurar.

### Fixes
- Service worker: sube la versión de la caché para que los navegadores descarguen los ficheros nuevos.

## 2026-10-10 10:06

### Mejoras
- **Banda sonora:** nuevo tema «Obituario» en el panel OST (audio `assets/sonidos/musica/musica_obituario.m4a`, con su letra en `assets/sonidos/letras/musica_obituario.txt`).

## 2026-10-10 04:03

### Documentación
- **Registro de novedades:** se añade el historial anterior reconstruido desde Git (primer push, integración en GitHub Pages y hitos principales).

## 2026-10-10 03:58

### Fixes
- **Mapa:** los círculos de las casillas de todas las rutas se recolocan ajustando sus arcos reales a un radio fijo de 69 px (6 círculos por ruta de superficie y 7 en el Túnel). Corrige casillas mal situadas, sobre todo F2, F3, F4, F6, St. Thomas (B3) y las del Túnel T3 y T5.
- **Hospital:** la Cama 4 (H4) pasa a la segunda «e» de «General» en el rótulo del Hospital.

### Mejoras
- **Selección de unidad:** al pulsar una unidad en la fase de acciones se entra directamente en Mover (si está disponible), sin pulsar el botón. El botón Mover aparece resaltado.

---

## Historial anterior
Reconstruido a partir del historial de Git (51 commits hasta el 2026-10-10). Solo los hitos principales; entre paréntesis, el commit.

### 2026-10-09 – 2026-10-10
- Fichas de Súper Zed recortadas con la cuadrícula de la hoja, delanteras y traseras (`86f9675`).
- Listados de héroes y civiles heroicos, letras de música y banda (`e4b0493`).
- Botón Deshacer: vuelve atrás acción a acción hasta la última tirada o robo de carta (`f79e6b0`).
- Héroes y Civiles Heroicos por color de carta: cada nivel admite los colores de sus cartas (`975863b`).
- Fondos de portada para el ranking (podio) y la nueva partida (mesa), con paneles translúcidos (`f968e75`).
- OST: banda sonora, sonidos organizados y vídeo de banda (`8e10ced`).

### 2026-10-08
- Música de partida, voz del líder (21 frases), panel de Sonido con volumen independiente e intro con vídeo (`826a411`).
- Imágenes del set inglés: marcadores, rumores, Súper Arma, civiles y tokens de Civiles Heroicos (`40e0707`).
- Tiradas de habilidades visibles y confirmadas con clic (`341cc30`).
- Modo debug de dados: elegir el valor de cada dado (`efedd94`).
- Hasta 10 partidas guardadas, con pantalla de carga y fecha de la build (`8e687de`).
- Cartas de Evento: reintento de imágenes fallidas y service worker más robusto (`4540cfd`).

### 2026-10-07
- **Primer push:** primera versión del juego, solitario web de Dawn of the Zeds con todas las cartas, incluidas las de personaje con frente y trasfondo (`b396eb8`).
- **Integración en GitHub Pages:** commit vacío que fuerza el redespliegue y deja la web publicada en https://antoniomaestregarrido.github.io/doz3/ (`e46fbcb`).
- Soporte táctil: ampliar por toque o pulsación larga (`7ba6fa6`).
- Guardado de partida con semilla: continuar tras recargar (`bf20619`).
- Portada con menú: nueva partida, cargar partida, top supervivientes y créditos (`4d41098`).
- Música de fondo en la portada y la selección de partida, con botón de silencio (`5ac3a84`).
- Diseño responsivo en pantallas estrechas (`13ff7a3`).
- Instalable como app (PWA): manifiesto, iconos y service worker con caché sin conexión (`997813b`).
- Zoom propio del mapa: botones, rueda, pellizco y arrastre (`13aa085`).
- «Pensar fríamente»: repetir tiradas con un 1 (`7320231`).
- Sonido de disparos con interruptor (`bc46624`).
