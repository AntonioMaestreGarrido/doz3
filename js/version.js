/* Fecha y hora de la última build (hora de Madrid). Se actualiza con cada cambio publicado. */
const BUILD_TIME = '2026-11-10 18:40';
/* Muestra la build en la pantalla inicial («Pulsa para empezar»). */
{ const e = document.getElementById('introBuild'); if (e) e.textContent = 'Build ' + BUILD_TIME; }
