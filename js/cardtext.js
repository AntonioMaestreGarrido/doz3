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
    return { img: evImg(key), title: ev.name, html: '<div class="zk">Carta de Evento · ' + (ev.fin ? 'Fin de la partida' : 'Acto ' + ev.act) + (ev.sp ? ' · Especial' : '') + (ev.fase && ev.fase !== '-' ? ' · ' + FASE_NOMBRE[ev.fase] : '') + '</div>' + li(ev.txt) +
      '<div class="zrow"><b>Fase de los Zeds:</b> ' + rutas + '</div><div class="zrow"><b>Acciones de Evento:</b> ' + (ev.cer || ev.fin ? 'ninguna' : ev.acc) + '</div>' + (G.lv && G.lv.fourR ? '<div class="zrow small">4R (Refugiados): ' + ev.r4 + ' · Infección: ' + (ev.inf ? 'tirada de Brote' : 'no') + ' · Alimentación: ' + ALIM_TXT(ev.al) + '</div>' : '') };
  }
  if (kind === 'd') {
    const d = DEST[key]; if (!d) return null;
    const where = { choice: 'a elección del jugador', more: 'ruta con más Zeds', less: 'ruta con menos Zeds', moreC: 'ruta con más Caos', lessC: 'ruta con menos Caos' }[d.where] || ROUTE_NAMES_ES[d.where];
    return { img: destImg(key), title: d.name, html: '<div class="zk">Carta de Destino · ' + (d.keep ? 'Guardar para más tarde' : 'Se juega al robarla') + '</div><div class="zrow"><b>Ruta destinada:</b> ' + where + '</div>' + li([d.txt]) };
  }
  if (kind === 'r') {
    const r = RES[key]; if (!r) return null;
    return { img: resImg(key), title: r.name, html: '<div class="zk">Carta de Investigación' + (r.perm ? ' · efecto mientras sea la carta en curso' : '') + '</div>' + li([r.txt]) + '<div class="zrow"><b>Para avanzar:</b> tirada de ' + r.th + (r.th < 6 ? '+' : '') + (r.sup ? ' y 1 Suministro' : '') + '</div>' };
  }
  if (kind === 'm') { /* marcadores del tablero: Bastión / Barricada y Campo de Minas (spec «m:<espacio>») */
    const s = G.spaces[key]; if (!s || !(s.bar || s.mine || s.trap)) return null;
    const parts = [], imgs = [];
    if (s.bar === 2) { parts.push('<b>Bastión</b> (Terreno 3, permanente): los defensores de este espacio reciben el Modificador de Terreno 3. Lo levantó Kingman con 1 Acción y 3 Suministros.'); imgs.push('bastion'); }
    else if (s.bar === 1) { parts.push('<b>Barricada</b> (Terreno 2): los defensores de este espacio reciben el Modificador de Terreno 2.'); imgs.push('barricada'); }
    if (s.mine) { parts.push('<b>Campo de Minas</b>: cuando un Zed entra en este espacio, explota con Fuerza ' + (s.mine === 1 ? '7' : '4') + ' (tirada de 2 dados). ' + (s.mine === 1 ? 'Tras la explosión queda con Fuerza 4.' : 'Tras esta explosión desaparece.')); imgs.push(s.mine === 1 ? 'mina_7' : 'mina_4'); }
    if (s.trap) parts.push('<b>Trampa explosiva</b> (Frank): cuando un Zed intenta entrar en este espacio, cada unidad Zed que entraba sufre 1 Impacto y su movimiento se cancela. Después se retira.');
    return { img: imgs.length ? 'assets/tokens/marcadores/' + imgs[0] + '.webp' : null, title: s.name || spaceLabel(key), html: li(parts) };
  }
  if (kind === 'k') { const k = RUMORS[key]; if (!k) return null; return { img: 'assets/tokens/rumores/' + key + '.webp', title: k.name, html: '<div class="zk">Ficha de Rumor · ' + ({ C: 'Colocar', G: 'Guardar', U: 'Unir' }[k.t]) + '</div>' + li([k.txt]) }; }
  if (kind === 'h') {
    const h = HEROES[key]; if (!h) return null;
    return { img: heroImg(key), title: h.name, tok: heroTok(key) ? 1 : 0, civ: h.type === 'civh', html: '<div class="zk">' + h.cls + '</div><div class="zrow">Fuerza <b>' + h.full + '</b> (reducida <b>' + h.red + '</b>) · Movimiento <b>' + h.mp + '</b></div>' + li(h.txt) + '<div class="zrow small">' + LEGEND + '</div>' + HERO_HINT(key) };
  }
  if (kind === 'u') {
    const u = G.units[key]; if (!u) return null;
    const state = ['Fuerza <b>' + strength(u) + '</b> (' + (u.flipped ? 'cara reducida' : 'cara completa') + ' · ' + u.full + '/' + u.red + ')', 'Impactos en esta cara: ' + u.hits + ' / ' + capOf(u), 'Ubicación: ' + spaceLabel(u.space)];
    const tags = []; if (u.ecg) tags.push('En coma (ficha de ECG): no puede actuar'); if (u.resist) tags.push('Resistiendo (inmóvil)'); if (u.armed) tags.push('Bien Armados: 1 columna a favor'); if (u.leader) tags.push('Líder Civil: 1 columna a favor'); if (u.trained) tags.push('Entrenados: +2 Fuerza'); if (u.keepCalm) tags.push('«Keep calm»: 2 columnas este turno'); if (freeTotal(u)) tags.push('Acciones gratis: ' + freeLabel(u));
    for (const b of zedBadges(u)) tags.push(b.txt);
    const cur = '<div class="zrow cur">' + state.join('<br>') + '</div>' + (tags.length ? '<div class="zrow">' + tags.map(t => '<span class="pill">' + t + '</span>').join('') + '</div>' : '');
    if (u.key && HEROES[u.key]) { const h = HEROES[u.key]; return { img: heroImg(u.key, u.flipped), title: h.name, tok: heroTok(u.key) ? 1 : 0, civ: h.type === 'civh', html: '<div class="zk">' + h.cls + ' · Movimiento ' + h.mp + '</div>' + cur + li(h.txt) + '<div class="zrow small">' + LEGEND + '</div>' + HERO_HINT(u.key) }; }
    if (u.type === 'super') { const d = SUPER_ZEDS[u.key]; return { img: superImg(u.key, u.flipped), title: 'Súper Zed: ' + d.name, tok: 1, html: cur + li([d.txt, 'Un Súper Zed eliminado se retira de la partida. Si entra en el Centro, pierdes.']) }; }
    if (u.type === 'spreader') return { img: spreaderAlt(u) ? spreaderImg(u) : 'assets/tokens/zed.webp', title: u.name, tok: 1, html: cur + li(['Propagador de Enfermedad: +1 Infección en cada fase de Infección mientras no esté en un espacio Inicial. No cuenta para el límite de agrupamiento. Al ser eliminado: tirada 1-3 vuelve al Inicial, 4-6 sale de la partida.']) };
    if (u.type === 'zed') return { img: zedTokenImg(u), title: 'Unidad Zed (Fuerza ' + strength(u) + ')', tok: 1, html: cur + li(['Unidad Zed Normal. Con 3 Impactos pasa a su cara reducida; con otros 3 es eliminada.', 'Dos Zeds en el mismo espacio forman una Horda y luchan sumando su Fuerza (máximo 2 por espacio).']) };
    if (u.type === 'civ') return { img: null, title: 'Civiles Normales', html: cur + li(['Resisten 4 Impactos (2 por cara). Si reciben el último: tirada de Salvación (1-3 Cementerio; 4-6 Centro en el Juego Básico u Hospital en los niveles posteriores).', u.resist ? '<b>Resistiendo:</b> atrincheradas en un Pueblo; inmóviles hasta que los Zeds ataquen el Pueblo.' : 'Mueven 2 espacios por Acción.']) };
    const sp0 = Object.values(SPECIALS).find(s => s.type === u.type && s.name === u.name) || SPECIALS[u.skey];
    const sk = u.skey && SPECIALS[u.skey] ? u.skey : null, stk = sk && specialTok(sk, u.flipped), scard = sk && specialCard(sk);
    return { img: stk || scard || null, title: u.name, tok: stk ? 1 : 0, civ: !!stk, html: cur + li(sp0 ? sp0.txt : ['Unidad especial.']) + (scard ? '<div class="zrow small">Selecciona la unidad para ver la carta entera' + (specialBack(sk) ? ' y su trasfondo' : '') + '.</div>' : '') };
  }
  return null;
}

/* Cartas de personaje: frente (h_*.jpg) y trasera con el trasfondo (hb_*.jpg). */
const CARD_IMGS = ['porter','alia','bender','ash','frank','doc','macgyver','samcarter','piazza','hernandez','schmidt','hunt','furias','seaver','pepinillos','horacio','carter','betty','lee','may','jaque','darling','jones','wright','division12','santana','bauer','kingman','antidist','agee','hauser','clarin','wilson','bomberos','salvacion','johnson','staub','wzed','sar'];
const TOKEN_IMGS = ['porter','alia','bender','ash','frank','doc','macgyver','samcarter','agee','betty','carter','darling','hauser','hernandez','horacio','hunt','jaque','johnson','jones','kingman','lee','may','pepinillos','piazza','santana','schmidt','seaver','staub','wilson','wright','furias','bomberos','bauer','antidist','salvacion','clarin','wzed','division12','sar'];
/* Arte alternativo (opción «Usar arte alternativo» del menú Opciones): cartas y fichas ilustradas en assets/arte_alt con las mismas claves.
   Si la opción está apagada o el personaje no tiene arte alternativo, se usa siempre el original (y si una imagen falla, el reintento de ui.js vuelve al original). */
const ALT_KEYS = ['agee','alia','bender','ash','frank','doc','macgyver','samcarter','antidist','bauer','betty','bomberos','carter','clarin','darling','division12','furias','hauser','hernandez','horacio','hunt','jaque','johnson','jones','kingman','lee','may','pepinillos','piazza','porter','salvacion','santana','schmidt','seaver','staub','wilson','wright','wzed','sar'];
/* Arte alternativo de los Súper Zeds (counters de dos caras en assets/arte_alt/zeds, con las claves de SUPER_ZEDS). */
/* Propagadores con arte alternativo (clave de SPREADERS): mismo formato que los Súper Zeds, sz_<clave>.webp y sz_<clave>_r.webp. */
const ALT_SPREADERS = ['noelle', 'alimanas'];
const spreaderAlt = u => !!(u && u.type === 'spreader' && typeof Opciones !== 'undefined' && Opciones.artAlt && ALT_SPREADERS.includes(u.skey));
const spreaderImg = u => 'assets/arte_alt/zeds/sz_' + u.skey + (u.flipped ? '_r' : '') + '.webp';
const ALT_ZEDS = ['berserker', 'lobo', 'supurador', 'devastador', 'reanimador', 'ferreo', 'gigante', 'saltarin', 'condenado'];
/* Zeds normales con arte alternativo: counters 300x300 en arte_alt/zeds (zed_full_2…9 y zed_red_1…5); el número va incluido en la imagen. */
const zedAltN = u => { if (!u || u.type !== 'zed') return null; const f = !u.flipped, n = f ? u.full : u.red; return (f ? n >= 2 && n <= 9 : n >= 1 && n <= 5) ? 'zed_' + (f ? 'full_' : 'red_') + n : null; };
/* Arte alternativo de unidades especiales (clave de SPECIALS): counter apaisado de dos caras en assets/arte_alt/unidades y carta en arte_alt/cartas (h_/hb_). */
const ALT_UNITS = ['petra', 'diamante', 'saqueadores', 'bubba'];
const unitAlt = k => !!(typeof Opciones !== 'undefined' && Opciones.artAlt && ALT_UNITS.includes(k));
/* Unidades especiales (SPECIALS): counter para el tooltip y carta entera (frente y, con arte alternativo, trasera). */
const specialTok = (k, red) => { const d = SPECIALS[k]; if (!d) return null; if (unitAlt(k)) return 'assets/arte_alt/unidades/' + k + (red ? '_r' : '') + '.webp'; const im = d.img || (k === 'petra' ? 'petra' : null); return im ? 'assets/tokens/' + im + '.webp' : null; };
/* Los Ángeles de Petra solo tienen carta ilustrada en arte_alt/cartas (h_petra, hb_petra): se muestra siempre, con o sin la opción de arte alternativo. */
const CARD_ALWAYS = ['petra'];
const specialCard = k => { const d = SPECIALS[k]; if (!d) return null; if (CARD_ALWAYS.includes(k)) return 'assets/arte_alt/cartas/h_' + k + '.webp'; return unitAlt(k) ? 'assets/arte_alt/cartas/h_' + k + '.webp' : (d.card ? 'assets/cartas/' + d.card + '.jpg' : null); };
const specialBack = k => (unitAlt(k) || CARD_ALWAYS.includes(k)) && SPECIALS[k] ? 'assets/arte_alt/cartas/hb_' + k + '.webp' : null;
const zedAlt = k => !!(typeof Opciones !== 'undefined' && Opciones.artAlt && ALT_ZEDS.includes(k));
/* Arte alternativo de Eventos y Destino (assets/arte_alt/eventos y destino): mismo nombre que la carta original; la tabla da el formato (jpg o webp).
   Si no hay arte alternativo para una carta, se usa siempre la original. */
const ALT_EVENTS = { 'accidente':'webp', 'agua':'webp', 'alcantarilla':'webp', 'aqui_doctor':'webp', 'armados':'webp', 'artefacto':'webp', 'asalto_a':'webp', 'asalto_b':'webp', 'asalto_f':'webp', 'asalto_m':'webp', 'atajos':'webp', 'bajo_pies':'webp', 'bomberos':'webp', 'brote_local':'webp', 'cabana':'webp', 'campanas':'webp', 'caos_abs':'webp', 'caos_control':'webp', 'cardio':'webp', 'catastrofe':'webp', 'cerebros_b1':'webp', 'cerebros_b2':'webp', 'cerebros_g':'webp', 'cerebros_y1':'webp', 'cerebros_y2':'webp', 'civ_heroicos':'webp', 'conductos':'webp', 'contaminacion':'webp', 'crisis':'webp', 'descubrimiento':'webp', 'desde_lab':'webp', 'desesperacion':'webp', 'despensa':'webp', 'doc_problema':'webp', 'donde_todos':'webp', 'duros':'webp', 'eficiencia':'webp', 'elwood':'webp', 'entusiasma':'webp', 'errantes':'webp', 'experimentos':'webp', 'feria':'webp', 'fin_b1':'webp', 'fin_b2':'webp', 'fin_g':'webp', 'fin_o':'webp', 'fin_r':'webp', 'fin_y':'webp', 'flambeados':'webp', 'fortuna':'webp', 'frenesi':'webp', 'gente':'webp', 'granero':'webp', 'guardia':'webp', 'hace_falta':'webp', 'helicoptero':'webp', 'heroe_b':'webp', 'heroe_g':'webp', 'hinchados':'webp', 'inteligentes':'webp', 'irrupcion':'webp', 'jornada':'webp', 'keepcalm':'webp', 'marines':'webp', 'materiales':'webp', 'mina':'webp', 'misiles':'webp', 'misterioso':'webp', 'monstruo':'webp', 'moteros':'webp', 'murcielagos':'webp', 'negacion':'webp', 'no_comer':'webp', 'no_detendran':'webp', 'no_escapatoria':'webp', 'no_hay_tiempo':'webp', 'noche':'webp', 'noelle':'webp', 'odio':'webp', 'oh_malo':'webp', 'oh_no':'webp', 'panico':'webp', 'pelo':'webp', 'propagacion':'webp', 'que_demonios':'webp', 'que_diablos':'webp', 'que_olor':'webp', 'queda_alguno':'webp', 'rapidos':'webp', 'renqueantes':'webp', 'resiste':'webp', 'resistentes':'webp', 'rumores':'webp', 'saqueadores':'webp', 'shhh':'webp', 'soldados':'webp', 'super_enloq':'webp', 'toxicos':'webp', 'tsunami':'webp', 'turba':'webp' };
const ALT_DEST = { 'necesidad':'webp', 'adrenalina':'webp', 'alimanas':'webp', 'averia':'webp', 'barrelotodo':'webp', 'bubba':'webp', 'cama_hospital':'webp', 'candado':'webp', 'canon':'webp', 'civiles':'webp', 'contagio':'webp', 'coordinador':'webp', 'desesperados':'webp', 'discutiendo':'webp', 'excavadora2':'jpg', 'excavadora':'webp', 'expediente':'webp', 'exploradores':'webp', 'ferrea':'webp', 'florecimiento':'webp', 'hedor':'webp', 'helicoptero_noticias':'webp', 'hija':'webp', 'hipnotizados':'webp', 'hoguera':'webp', 'hombre':'webp', 'inventarios':'webp', 'lago':'webp', 'llamamiento':'webp', 'llega_heroe':'webp', 'lluvia':'webp', 'muertos':'webp', 'municion':'webp', 'olvidado':'webp', 'otra_manera':'webp', 'pensar':'webp', 'picado':'webp', 'planes_marteuse':'webp', 'protestas':'webp', 'puente':'webp', 'punto_partida':'webp', 'senal_rescate':'webp', 'techo_tunel':'webp', 'tiradles_algo':'webp', 'trago':'webp', 'urbanistas':'webp', 'vehiculos':'webp', 'veo_alguien':'webp', 'zed_alfa':'webp' };
const artAltOn = () => typeof Opciones !== 'undefined' && Opciones.artAlt;
const evImg = id => artAltOn() && ALT_EVENTS[id] ? 'assets/arte_alt/eventos/e_' + id + '.' + ALT_EVENTS[id] : 'assets/cartas/e_' + id + '.jpg';
/* base: nombre de la imagen sin «d_» (ver DEST_IMG en game.js). */
const destImgBase = base => artAltOn() && ALT_DEST[base] ? 'assets/arte_alt/destino/d_' + base + '.' + ALT_DEST[base] : 'assets/cartas/d_' + base + '.jpg';
/* Cartas de Investigación con arte alternativo (assets/arte_alt/investigacion/i_<id>.webp); las cuatro «Función para la Súper Arma» siguen con la original. */
const ALT_RES = ['cecina', 'cientificos', 'dcp', 'distraccion', 'escasean', 'esperanza', 'folletos', 'intoxicados', 'medio', 'musica', 'noticias', 'pruebas', 'sasha', 'uhm', 'ahora', 'antinatural', 'atascada', 'heroe_c', 'hormona', 'vacunas', 'antidoto'];
const resImg = id => artAltOn() && ALT_RES.includes(id) ? 'assets/arte_alt/investigacion/i_' + id + '.webp' : 'assets/cartas/i_' + id + '.jpg';
const superImg = (k, red) => zedAlt(k) ? 'assets/arte_alt/zeds/' + SUPER_ZEDS[k].img + (red ? '_r' : '') + '.webp' : 'assets/tokens/' + SUPER_ZEDS[k].img + '.webp';
const heroAlt = k => !!(typeof Opciones !== 'undefined' && Opciones.artAlt && ALT_KEYS.includes(k));
const heroCard = k => CARD_IMGS.includes(k) ? (heroAlt(k) ? 'assets/arte_alt/cartas/h_' + k + '.webp' : 'assets/cartas/h_' + k + '.jpg') : null;
/* Sin trasera (trasfondo) pendiente: Bender no tiene el texto todavía. */
const NO_BACK = ['bender', 'ash', 'frank', 'doc', 'macgyver', 'samcarter'];
const heroBack = k => CARD_IMGS.includes(k) && !NO_BACK.includes(k) ? (heroAlt(k) ? 'assets/arte_alt/cartas/hb_' + k + '.webp' : 'assets/cartas/hb_' + k + '.jpg') : null;
const heroTok = (k, red) => heroAlt(k) ? 'assets/arte_alt/tokens/' + k + (red ? '_r' : '') + '.webp' : (TOKEN_IMGS.includes(k) ? 'assets/tokens/' + k + (red && RED_TOKENS.includes(k) ? '_r' : '') + '.webp' : null);
/* Fichas por defecto que tienen también cara reducida (ver assets/tokens/<clave>_r.webp). */
const RED_TOKENS = ['porter', 'sar'];
/* Imagen del tooltip: la ficha del personaje; si no tiene ficha propia, el frente de su carta. */
const heroOpt = k => ({ value: k, label: HEROES[k].name, img: heroCard(k) || heroTok(k), sub: HEROES[k].cls + ' · ' + HEROES[k].full + '/' + HEROES[k].red });
const unitOpt = (u, extra) => ({ value: u.id, label: u.name + (extra || ''), img: u.key && HEROES[u.key] ? (heroCard(u.key) || heroTok(u.key)) : null, sub: u.space === 'CEM' ? 'Cementerio' : u.space && G.spaces[u.space] ? spaceLabel(u.space) : '' });
function heroImg(k, red) { return heroTok(k, red) || heroCard(k); }
const HERO_HINT = k => heroCard(k) ? '<div class="zrow small">Selecciona la unidad (o abre «Cartas de Héroe») para ver la carta entera y su trasfondo.</div>' : '';

/* Ficha Zed real (cara completa 2-9, reducida 1-5); si no existe, la ilustración genérica. */
/* Fichas y estados de una unidad Zed (Tóxicos, Inteligentes…): las usan el tooltip y la ventana de combate. */
function zedBadges(u) {
  const b = [];
  if (u.zresist) b.push({ ico: '🛡', txt: 'Resistentes: Impactos anulados con 1-3' }); if (u.fast) b.push({ ico: '⚡', txt: 'Rápidos: se mueven dos veces' }); if (u.toxic) b.push({ ico: '☣', txt: 'Tóxicos: Infección +3' }); if (u.smart) b.push({ ico: '🧠', txt: 'Inteligentes: 1 columna en contra al atacar' }); if (u.leader && isZedSide(u)) b.push({ ico: '👑', txt: 'Líder Zed: 1 columna en contra' }); if (u.pest) b.push({ ico: '☠', txt: 'Pestilentes' });
  return b;
}
const zedImgOf = u => u.type === 'super' && u.key && SUPER_ZEDS[u.key] ? superImg(u.key, u.flipped) : u.type === 'zed' ? zedTokenImg(u) : null;
function zedTokenImg(u) { const an = Opciones.artAlt && zedAltN(u); if (an) return 'assets/arte_alt/zeds/' + an + '.webp'; const n = u.flipped ? u.red : u.full; return (u.flipped ? n >= 1 && n <= 5 : n >= 2 && n <= 9) ? 'assets/tokens/zeds/' + (u.flipped ? 'red_' : 'full_') + n + '.webp' : 'assets/tokens/zed.webp'; }
