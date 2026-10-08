/* Información ampliada (tooltips) de fichas y cartas, en lenguaje normal. */
'use strict';
const ROUTE_NAMES_ES = { B: 'Bosque', M: 'Montaña', A: 'Autovía', F: 'Afueras', T: 'Túnel', ANY: 'cualquier otra ruta (a tu elección)', MIN2: 'la ruta con menos Zeds, 2 veces', INIT: 'solo los Zeds de espacios Iniciales' };
const ALIM_TXT = a => a === 'd' ? 'tirada (1 dado) contra las unidades en el Hospital' : a;
const LEGEND = '►/◄ = columnas a tu favor / en contra en la tabla de combate.';

function zoomInfo(spec) {
  const i = spec.indexOf(':'), kind = spec.slice(0, i), key = spec.slice(i + 1);
  const li = a => '<ul>' + a.map(x => '<li>' + x + '</li>').join('') + '</ul>';
  if (kind === 'e') {
    const ev = EV[key]; if (!ev) return null;
    const rutas = ev.cer ? 'Todas las rutas (tú eliges el orden)' : ev.z.map(z => z === '*' ? 'Todas las rutas (tú eliges el orden)' : z === 'D2' ? 'La ruta de una carta de Destino, 2 veces' : ROUTE_NAMES_ES[z]).join(' → ') || '—';
    return { img: 'assets/cartas/e_' + key + '.jpg', title: ev.name, html: '<div class="zk">Carta de Evento · ' + (ev.fin ? 'Fin de la partida' : 'Acto ' + ev.act) + (ev.sp ? ' · Especial' : '') + '</div>' + li(ev.txt) +
      '<div class="zrow"><b>Fase de los Zeds:</b> ' + rutas + '</div><div class="zrow"><b>Acciones de Evento:</b> ' + (ev.cer || ev.fin ? 'ninguna' : ev.acc) + '</div>' + (G.lv && G.lv.fourR ? '<div class="zrow small">4R (Refugiados): ' + ev.r4 + ' · Infección: ' + (ev.inf ? 'tirada de Brote' : 'no') + ' · Alimentación: ' + ALIM_TXT(ev.al) + '</div>' : '') };
  }
  if (kind === 'd') {
    const d = DEST[key]; if (!d) return null;
    const where = { choice: 'a elección del jugador', more: 'ruta con más Zeds', less: 'ruta con menos Zeds', moreC: 'ruta con más Caos', lessC: 'ruta con menos Caos' }[d.where] || ROUTE_NAMES_ES[d.where];
    return { img: destImg(key), title: d.name, html: '<div class="zk">Carta de Destino · ' + (d.keep ? 'Guardar para más tarde' : 'Se juega al robarla') + '</div><div class="zrow"><b>Ruta destinada:</b> ' + where + '</div>' + li([d.txt]) };
  }
  if (kind === 'r') {
    const r = RES[key]; if (!r) return null;
    return { img: 'assets/cartas/i_' + key + '.jpg', title: r.name, html: '<div class="zk">Carta de Investigación' + (r.perm ? ' · efecto mientras sea la carta en curso' : '') + '</div>' + li([r.txt]) + '<div class="zrow"><b>Para avanzar:</b> tirada de ' + r.th + (r.th < 6 ? '+' : '') + (r.sup ? ' y 1 Suministro' : '') + '</div>' };
  }
  if (kind === 'k') { const k = RUMORS[key]; if (!k) return null; return { img: 'assets/tokens/rumores/' + key + '.png', title: k.name, html: '<div class="zk">Ficha de Rumor · ' + ({ C: 'Colocar', G: 'Guardar', U: 'Unir' }[k.t]) + '</div>' + li([k.txt]) }; }
  if (kind === 'h') {
    const h = HEROES[key]; if (!h) return null;
    return { img: heroImg(key), title: h.name, tok: heroTok(key) ? 1 : 0, html: '<div class="zk">' + h.cls + '</div><div class="zrow">Fuerza <b>' + h.full + '</b> (reducida <b>' + h.red + '</b>) · Movimiento <b>' + h.mp + '</b></div>' + li(h.txt) + '<div class="zrow small">' + LEGEND + '</div>' + HERO_HINT(key) };
  }
  if (kind === 'u') {
    const u = G.units[key]; if (!u) return null;
    const state = ['Fuerza <b>' + strength(u) + '</b> (' + (u.flipped ? 'cara reducida' : 'cara completa') + ' · ' + u.full + '/' + u.red + ')', 'Impactos en esta cara: ' + u.hits + ' / ' + capOf(u), 'Ubicación: ' + spaceLabel(u.space)];
    const tags = []; if (u.ecg) tags.push('En coma (ficha de ECG): no puede actuar'); if (u.resist) tags.push('Resistiendo (inmóvil)'); if (u.armed) tags.push('Bien Armados: 1 columna a favor'); if (u.leader) tags.push('Líder Civil: 1 columna a favor'); if (u.trained) tags.push('Entrenados: +2 Fuerza'); if (u.keepCalm) tags.push('«Keep calm»: 2 columnas este turno'); if (freeTotal(u)) tags.push('Acciones gratis: ' + freeLabel(u));
    if (u.zresist) tags.push('Resistentes: Impactos anulados con 1-3'); if (u.fast) tags.push('Rápidos: se mueven dos veces'); if (u.toxic) tags.push('Tóxicos: Infección +3'); if (u.smart) tags.push('Inteligentes: 1 columna en contra al atacar'); if (u.leader && isZedSide(u)) tags.push('Líder Zed: 1 columna en contra'); if (u.pest) tags.push('Pestilentes');
    const cur = '<div class="zrow cur">' + state.join('<br>') + '</div>' + (tags.length ? '<div class="zrow">' + tags.map(t => '<span class="pill">' + t + '</span>').join('') + '</div>' : '');
    if (u.key && HEROES[u.key]) { const h = HEROES[u.key]; return { img: heroImg(u.key), title: h.name, tok: heroTok(u.key) ? 1 : 0, html: '<div class="zk">' + h.cls + ' · Movimiento ' + h.mp + '</div>' + cur + li(h.txt) + '<div class="zrow small">' + LEGEND + '</div>' + HERO_HINT(u.key) }; }
    if (u.type === 'super') { const d = SUPER_ZEDS[u.key]; return { img: 'assets/tokens/' + d.img + '.png', title: 'Súper Zed: ' + d.name, tok: 1, html: cur + li([d.txt, 'Un Súper Zed eliminado se retira de la partida. Si entra en el Centro, pierdes.']) }; }
    if (u.type === 'spreader') return { img: 'assets/tokens/zed.png', title: u.name, tok: 1, html: cur + li(['Propagador de Enfermedad: +1 Infección en cada fase de Infección mientras no esté en un espacio Inicial. No cuenta para el límite de agrupamiento. Al ser eliminado: tirada 1-3 vuelve al Inicial, 4-6 sale de la partida.']) };
    if (u.type === 'zed') return { img: zedTokenImg(u), title: 'Unidad Zed (Fuerza ' + strength(u) + ')', tok: 1, html: cur + li(['Unidad Zed Normal. Con 3 Impactos pasa a su cara reducida; con otros 3 es eliminada.', 'Dos Zeds en el mismo espacio forman una Horda y luchan sumando su Fuerza (máximo 2 por espacio).']) };
    if (u.type === 'civ') return { img: null, title: 'Civiles Normales', html: cur + li(['Resisten 4 Impactos (2 por cara). Si reciben el último: tirada de Salvación (1-3 Cementerio; 4-6 Centro en el Juego Básico u Hospital en los niveles posteriores).', u.resist ? '<b>Resistiendo:</b> atrincheradas en un Pueblo; inmóviles hasta que los Zeds ataquen el Pueblo.' : 'Mueven 2 espacios por Acción.']) };
    const sp0 = Object.values(SPECIALS).find(s => s.type === u.type && s.name === u.name) || SPECIALS[u.skey];
    return { img: null, title: u.name, html: cur + li(sp0 ? sp0.txt : ['Unidad especial.']) };
  }
  return null;
}

/* Cartas de personaje: frente (h_*.jpg) y trasera con el trasfondo (hb_*.jpg). */
const CARD_IMGS = ['piazza','hernandez','schmidt','hunt','furias','seaver','pepinillos','horacio','carter','betty','lee','may','jaque','darling','jones','wright','division12','santana','bauer','kingman','antidist','agee','hauser','clarin','wilson','bomberos','salvacion','johnson','staub','wzed'];
const TOKEN_IMGS = ['agee','betty','carter','darling','hauser','hernandez','horacio','hunt','jaque','johnson','jones','kingman','lee','may','pepinillos','piazza','santana','schmidt','seaver','staub','wilson','wright','furias','bomberos','bauer','antidist','salvacion','clarin','wzed','division12'];
const heroCard = k => CARD_IMGS.includes(k) ? 'assets/cartas/h_' + k + '.jpg' : null;
const heroBack = k => CARD_IMGS.includes(k) ? 'assets/cartas/hb_' + k + '.jpg' : null;
const heroTok = k => TOKEN_IMGS.includes(k) ? 'assets/tokens/' + k + '.png' : null;
/* Imagen del tooltip: la ficha del personaje; si no tiene ficha propia, el frente de su carta. */
const heroOpt = k => ({ value: k, label: HEROES[k].name, img: heroCard(k) || heroTok(k), sub: HEROES[k].cls + ' · ' + HEROES[k].full + '/' + HEROES[k].red });
const unitOpt = (u, extra) => ({ value: u.id, label: u.name + (extra || ''), img: u.key && HEROES[u.key] ? (heroCard(u.key) || heroTok(u.key)) : null, sub: u.space ? spaceLabel(u.space) : '' });
function heroImg(k) { return heroTok(k) || heroCard(k); }
const HERO_HINT = k => heroCard(k) ? '<div class="zrow small">Selecciona la unidad (o abre «Cartas de Héroe») para ver la carta entera y su trasfondo.</div>' : '';

/* Ficha Zed real (cara completa 2-9, reducida 1-5); si no existe, la ilustración genérica. */
function zedTokenImg(u) { const n = u.flipped ? u.red : u.full; return (u.flipped ? n >= 1 && n <= 5 : n >= 2 && n <= 9) ? 'assets/tokens/zeds/' + (u.flipped ? 'red_' : 'full_') + n + '.png' : 'assets/tokens/zed.png'; }
