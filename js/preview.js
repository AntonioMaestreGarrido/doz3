/* Vista previa de las cartas: además de la regla (el texto de la carta), un bloque aparte «Lo que va a pasar» con el resultado concreto
   según el estado actual de la partida (p. ej. «Aparece un Zeds-Lobo en la Autovía»).
   Las fichas Zed y Súper Zed que van a salir se «asoman» por adelantado (peekZeds / peekSuper) y esa misma ficha es la que luego se coloca
   (ver drawNormalToken y makeSuper en engine.js), de modo que lo anunciado coincide con lo que ocurre. Solo se usan mientras G.turn.peekOn. */
'use strict';

/* Asoma n fichas Zed normales sin sacarlas todavía de la reserva; devuelve las fichas [Fuerza, reducida] (o null si no se pueden anticipar). */
function peekZeds(n) {
  const out = [];
  if (typeof alreadyHas === 'function' && alreadyHas('antinatural')) { for (let i = 0; i < n; i++) out.push(null); return out; }
  const q = G.turn.peekQ = G.turn.peekQ || { zed: [], sup: [] }, copy = G.reserve.slice();
  for (let i = 0; i < n; i++) { if (!copy.length) { out.push(null); continue; } const t = copy.splice(rnd(copy.length), 1)[0]; q.zed.push(t); out.push(t); }
  return out;
}
/* Asoma qué Súper Zed saldrá (clave de SUPER_ZEDS) o null. */
function peekSuper() {
  if (!G.supers.length) return null;
  const q = G.turn.peekQ = G.turn.peekQ || { zed: [], sup: [] }, k = G.supers[rnd(G.supers.length)]; q.sup.push(k); return k;
}
/* Ejecuta fn con los anuncios activados: lo que se asomó se coloca tal cual. */
async function withPeek(fn) {
  const was = G.turn.peekOn; G.turn.peekOn = true;
  try { return await fn(); } finally { if (G.turn) G.turn.peekOn = was; }
}

const Preview = {
  zt(t) { return t ? 'Zed de Fuerza ' + t[0] + ' (reducida ' + t[1] + ')' : 'un nuevo Zed'; },
  st(k) { const d = k && SUPER_ZEDS[k]; return d ? d.name + ' (Fuerza ' + d.full + '/' + d.red + ')' : 'un Súper Zed'; },
  rn(r) { return ROUTES[r] ? ROUTES[r].name : r; },
  lista(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' y ' + a[a.length - 1]; },
  pl(n, uno, varios) { return n === 1 ? '1 ' + uno : n + ' ' + varios; },
  initFor(r) { const t = r + '0'; if (normalZedsAt(t).length >= zedCap(t)) { const f = firstOpenInitial(); return f || t; } return t; },
  chaosOf(r) { let n = 0; for (let i = 0; i <= lastOf(r); i++) n += sp(r + i).chaos || 0; return n; },
  block(lines) {
    return lines && lines.length ? '<div class="willhappen"><b>Lo que va a pasar</b><ul>' + lines.map(l => '<li>' + l + '</li>').join('') + '</ul></div>' : '';
  },
  event(ev) { try { return this._event(ev) || []; } catch (e) { return []; } },
  destiny(id, route) { try { return this._destiny(id, route) || []; } catch (e) { return []; } },

  _event(ev) {
    const L = [], id = ev.id, inf = G.lv.infection;
    if (ev.assault) {
      const r = ev.assault; if (!G.routes.includes(r)) return L;
      const n = routeZeds(r).length, z = peekZeds(1)[0];
      if (inf) L.push('+' + n + ' de Infección: hay ' + this.pl(n, 'unidad Zed', 'unidades Zed') + ' en ' + this.rn(r) + ' (la Infección está ahora en ' + G.inf + ').');
      L.push('Aparece un ' + this.zt(z) + ' en ' + spaceLabel(this.initFor(r)) + '.');
      L.push('Los defensores no tienen Modificador por Terreno este turno.');
      return L;
    }
    switch (id) {
      case 'cardio': {
        const z = peekZeds(1)[0], empty = G.routes.map(r => r + '0').filter(i => !zedsAt(i).length);
        if (empty.length) L.push('Aparece un ' + this.zt(z) + ' en un espacio Inicial vacío que eliges: ' + empty.map(spaceLabel).join(', ') + '.');
        else { let best = null; for (const r of G.routes) { const zs = zedsAt(r + '0'); const m = zs.length ? Math.min(...zs.map(strength)) : -1; if (!best || m < best.m) best = { id: r + '0', m }; } L.push('No hay Iniciales vacíos: aparece un ' + this.zt(z) + ' en ' + spaceLabel(best.id) + ' (el Inicial con el Zed más débil).'); }
        break;
      }
      case 'pelo': case 'tsunami': {
        const zs = peekZeds(G.routes.length);
        G.routes.forEach((r, i) => L.push(this.rn(r) + ': aparece un ' + this.zt(zs[i]) + ' en ' + spaceLabel(this.initFor(r)) + '.'));
        if (id === 'pelo') L.push('Se retiran todas las fichas de Impacto de los Zeds.');
        break;
      }
      case 'odio': {
        const n = allUnits(x => x.type === 'zed' && strength(x) <= 3 && isRouteSp(x.space)).length;
        L.push(n ? (n === 1 ? 'Se sustituye 1 unidad Zed de Fuerza 3 o menos' : 'Se sustituyen ' + n + ' unidades Zed de Fuerza 3 o menos') + ' por Zeds nuevos de Fuerza completa.' : 'No hay Zeds de Fuerza 3 o menos: no cambia nada.');
        break;
      }
      case 'resistentes': case 'toxicos': case 'rapidos': case 'inteligentes': {
        const r = { resistentes: 'M', toxicos: 'A', rapidos: 'B', inteligentes: 'F' }[id], nom = { resistentes: 'Resistentes', toxicos: 'Tóxicos', rapidos: 'Rápidos', inteligentes: 'Inteligentes' }[id];
        if (!G.routes.includes(r)) break;
        const t = peekZeds(1)[0], cur = allUnits(x => x.type === 'zed' && x.space && isRouteSp(x.space)).map(strength), m = Math.max(0, ...cur);
        L.push('Aparece un ' + this.zt(t) + ' en ' + spaceLabel(r + '0') + '.');
        const fin = t && t[0] > m ? t[0] : m;
        L.push('La ficha de ' + nom + ' pasa al Zed Normal más fuerte' + (fin ? ' (Fuerza ' + fin + (t && t[0] > m ? ': el que acaba de aparecer' : '') + ')' : '') + '.');
        break;
      }
      case 'saqueadores': {
        const rs = SURFACE.filter(r => G.routes.includes(r)).map(r => [r, this.chaosOf(r)]), m = Math.max(...rs.map(x => x[1])), top = rs.filter(x => x[1] === m).map(x => x[0]);
        if (top.length === 1) L.push('Aparecen los Saqueadores en ' + this.rn(top[0]) + ' (' + spaceLabel(top[0] + '0') + '): es la ruta con más Caos (' + m + ' ficha' + (m === 1 ? '' : 's') + ').');
        else L.push('Empate de Caos (' + m + ') entre ' + this.lista(top.map(r => this.rn(r))) + ': eliges la ruta donde aparecen los Saqueadores.');
        break;
      }
      case 'turba': {
        L.push('Se roba una carta de Destino para fijar la ruta.');
        if (G.inf >= 8) L.push('La Infección está ahora en ' + G.inf + ' (8 o más): aparecerá un Súper Zed — ' + this.st(peekSuper()) + '.');
        else L.push('La Infección está ahora en ' + G.inf + ' (7 o menos): no hay Súper Zed, aparecen los Supervivientes V.I.P. en el Inicial de esa ruta.');
        break;
      }
      case 'que_demonios': {
        L.push('La Infección sube de ' + G.inf + ' a 13 y estalla un Brote Descontrolado: aparecerá un Súper Zed — ' + this.st(peekSuper()) + ' — en la ruta que decida la carta de Destino.');
        L.push('Se retiran todas las fichas de Impacto de los Zeds.');
        break;
      }
      case 'donde_todos': {
        const ps = []; for (const r of G.routes) for (let i = 1; i <= lastOf(r); i++) if (sp(r + i).kind === 'pueblo' && controlled(r + i)) ps.push(r + i);
        if (!ps.length) L.push('No hay Pueblos controlados por Zeds: no aparece ningún Zed nuevo.');
        else { const zs = peekZeds(ps.length); L.push('Aparece un Zed nuevo en cada Pueblo controlado por Zeds: ' + ps.map((p, i) => spaceLabel(p) + ': ' + this.zt(zs[i])).join('; ') + '.'); }
        L.push('Se retiran todas las fichas de Impacto de los Zeds.');
        break;
      }
      case 'desesperacion': {
        let n = 0; for (const r of G.routes) for (const k of [0, 1, 2]) n += zedsAt(r + (lastOf(r) - k)).length;
        L.push('Hay ' + this.pl(n, 'unidad Zed', 'unidades Zed') + ' en los espacios n.º 2, 1 y 0: pierdes ' + n + ' en cualquier combinación de Suministros, Munición o Impactos (tienes ' + G.supplies + ' Suministros y ' + G.ammo + ' de Munición).');
        break;
      }
      case 'catastrofe': {
        const us = plAt('A4'); L.push(us.length ? 'En A4 hay ' + us.map(u => u.name).join(', ') + ': sufre 2 Impactos y se retira.' : 'No hay nadie en A4: nadie sufre Impactos.');
        L.push('Se coloca una ficha de Caos en A4 y ese espacio queda bloqueado este turno.');
        break;
      }
      case 'moteros': {
        L.push('Los Ángeles de Petra llegan al Centro de la Ciudad.'); L.push('−1 Suministro (tienes ' + G.supplies + '; quedarán ' + Math.max(0, G.supplies - 1) + ').');
        break;
      }
      case 'misterioso': {
        const k = G.hand.find(x => DEST[x]); L.push(k ? 'Descartas la carta de Destino guardada «' + DEST[k].name + '».' : 'No tienes cartas de Destino guardadas: no descartas ninguna.');
        L.push('La Infección aumenta en 1 dado (1-6).');
        const zs = peekZeds(G.routes.length); L.push('Aparece un Zed en cada ruta: ' + G.routes.map((r, i) => this.rn(r) + ': ' + this.zt(zs[i])).join('; ') + '.');
        break;
      }
      case 'propagacion': case 'oh_malo': {
        const z = peekZeds(1)[0];
        L.push('Se roba una carta de Destino para fijar la ruta. ' + (id === 'oh_malo' ? 'En el espacio n.º 1 de esa ruta aparece un ' : 'En el Inicial de esa ruta aparece un ') + this.zt(z) + '.');
        if (id === 'oh_malo') L.push('Se retiran todas las fichas de Impacto de los Zeds.');
        break;
      }
    }
    return L;
  },

  _destiny(id, R) {
    const L = [], rn = this.rn(R);
    switch (id) {
      case 'lago': L.push('Aparece un ' + this.zt(peekZeds(1)[0]) + ' en ' + spaceLabel('M5') + '.'); break;
      case 'muertos': { const zs = peekZeds(2); L.push('Aparecen dos Zeds en ' + spaceLabel('B3') + ': ' + this.zt(zs[0]) + ' y ' + this.zt(zs[1]) + '.'); break; }
      case 'municion': L.push('−1 Munición (tienes ' + G.ammo + ')' + (G.lv.supplies ? ' y −2 Suministros (tienes ' + G.supplies + ')' : '') + '.'); break;
      case 'puente': L.push('El puente queda derrumbado en ' + spaceLabel('F6') + ': solo los Zeds pueden entrar o cruzar ese espacio.'); break;
      case 'alimanas': {
        const c = G.routes.map(r => [r, routeZeds(r).length]), m = Math.max(...c.map(x => x[1])), top = c.filter(x => x[1] === m).map(x => x[0]);
        L.push(top.length === 1 ? 'Aparece un Propagador de Enfermedad en el Inicial de ' + this.rn(top[0]) + ' (la ruta con más Zeds: ' + m + ').' : 'Empate de Zeds (' + m + ') entre ' + this.lista(top.map(r => this.rn(r))) + ': eliges dónde aparece el Propagador.');
        break;
      }
      case 'bubba': {
        const c = G.routes.filter(r => r !== 'T').map(r => [r, routeZeds(r).length]), m = Math.min(...c.map(x => x[1])), r = c.filter(x => x[1] === m)[0][0];
        L.push('La Banda de Bubba aparece en ' + spaceLabel(r + '0') + ' (' + this.rn(r) + ', la ruta con menos Zeds: ' + m + ').'); break;
      }
      case 'candado': {
        L.push(G.weapon && G.weapon.parts.length ? 'Pierdes un Componente al azar de la Súper Arma (tienes ' + G.weapon.parts.length + ').' : (G.res ? 'Una carta de Investigación Inicial al azar pasa a la parte superior del mazo.' : 'No tienes Súper Arma ni Investigación: sin efecto.'));
        const c = G.routes.map(r => [r, routeZeds(r).length]), m = Math.min(...c.map(x => x[1])), top = c.filter(x => x[1] === m).map(x => x[0]);
        L.push(top.length === 1 ? 'Aparece un Zed nuevo en el Inicial de ' + this.rn(top[0]) + ' (la ruta con menos Zeds: ' + m + ').' : 'Empate (' + m + ' Zeds) entre ' + this.lista(top.map(r => this.rn(r))) + ': eliges dónde aparece el Zed nuevo.');
        break;
      }
      case 'zed_alfa': {
        const zs = routeZeds(R).filter(z => z.type === 'zed');
        L.push(zs.length ? 'El Zed más fuerte de ' + rn + ' (Fuerza ' + Math.max(...zs.map(strength)) + ') pasa a ser Zed Líder y se activa la ruta.' : 'No hay Zeds normales en ' + rn + ': solo se activa la ruta.'); break;
      }
      case 'hedor': L.push(routeZeds(R).some(z => z.type === 'zed') ? 'Una ficha de Pestilentes se pone sobre un Zed de ' + rn + '.' : 'No hay Zeds normales en ' + rn + ': sin efecto.'); break;
      case 'florecimiento': {
        const zs = allUnits(isZedSide); if (!zs.length) { L.push('No hay Zeds en juego: sin efecto.'); break; }
        const m = Math.min(...zs.map(strength)), n = zs.filter(z => strength(z) === m).length;
        L.push('Se reemplazan ' + n + ' unidad' + (n === 1 ? '' : 'es') + ' Zed de Fuerza ' + m + ' (las más débiles) por Zeds Normales nuevos, y se retiran todos los Impactos.'); break;
      }
      case 'llamamiento': {
        let n = 0; for (const r of G.routes) for (let i = 1; i <= lastOf(r); i++) if (sp(r + i).chaos) n++;
        L.push(n ? 'Hay Caos en ' + n + ' espacio' + (n === 1 ? '' : 's') + ': en cada uno aparece un Zed nuevo si su Fuerza completa es menor que el n.º del espacio.' : 'No hay Caos en el mapa: sin efecto.'); break;
      }
      case 'contagio': L.push('Estalla un Brote Descontrolado: aparecerá un Súper Zed — ' + this.st(peekSuper()) + '.'); break;
      case 'olvidado': { const n = allUnits(x => x.type === 'refugee' && isRouteSp(x.space)).length; L.push(n ? n + ' unidad' + (n === 1 ? '' : 'es') + ' de Refugiados se alejan 1 espacio del Centro (las que entren en espacio con Zeds son devoradas).' : 'No hay Refugiados en las rutas: sin efecto.'); break; }
    }
    return L;
  }
};
