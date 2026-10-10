# Novedades

Registro de cambios por publicación (push a `main`). Lo más reciente, arriba. Cada entrada lleva la misma fecha y hora que `BUILD_TIME` de `js/version.js`.

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
