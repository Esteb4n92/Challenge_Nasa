// Etapa 5 · Protección contra la Radiación: alerta roja de tormenta solar en tiempo real (eventos de DONKI).
// Pocos segundos para activar escudos (mucha energía), cubrir la base con regolito (acciones) o arriesgarse.
import { abrir } from './modal.js';
import { render, rego } from './hud.js';
import { sfx } from '../audio.js';

export async function tormentaSolar(j, ev) {
  const s = j.s, c = j.datos.config, t = c.tormentaSolar, rc = c.radiacion;
  const base = (ev.tipo === 'CME' ? rc.impactoCME : rc.impactoSEP) * (rc.alertaMultiplicador || 1.5);
  const proteccion = (s.refugio ? 0.5 : 1) * (s.regolito ? 0.5 : 1);
  const sinHacer = Math.round(base * proteccion);
  const origen = ev.fecha ? `Basada en un evento real registrado por la NASA el ${ev.fecha.slice(0, 10)} (DONKI).` : 'Evento simulado (carga datos reales de DONKI con tools/descargar_donki.py).';
  document.body.classList.add('alerta-solar');
  sfx('alarma'); setTimeout(() => sfx('alarma'), 400);
  let quedan = t.decisionSeg;
  const puedeEscudo = s.bateria >= t.costoEscudos, puedeRegolito = s.ap >= t.costoRegolito && !s.regolito;
  const respuesta = abrir('☢️ ¡ALERTA ROJA! Tormenta solar', `<p class="ayuda-grande">☀️💥</p>
    <p>El sistema de alerta espacial detectó una <b>${ev.tipo === 'CME' ? 'eyección de masa coronal' : 'lluvia de partículas solares'}</b>: una erupción del Sol que llena la superficie de Marte de radiación.</p>
    <p class="reloj-puzzle">⏱️ <b id="ts-reloj">${quedan}</b> s para proteger a la tripulación</p>
    <p class="dato">🛡️ <b>Escudos:</b> casi no recibes radiación, pero gastan ${t.costoEscudos} de batería.<br>
      🪨 <b>Regolito:</b> cubrir la base con suelo marciano cuesta ${t.costoRegolito} acciones, pero protege también en futuras tormentas.<br>
      ⚠️ <b>Sin protección:</b> la dosis de radiación sube +${sinHacer}.</p>
    <p><small>📡 ${origen}</small></p>`,
    [{ texto: `🛡️ Activar escudos (⚡-${t.costoEscudos})`, valor: 'escudo', deshabilitado: !puedeEscudo },
      { texto: s.regolito ? '🪨 Regolito ya colocado' : `🪨 Cubrir con regolito (⚙️${t.costoRegolito})`, valor: 'regolito', deshabilitado: !puedeRegolito },
      { texto: 'Arriesgarse', valor: 'nada', clase: 'sec' }]);
  const reloj = setInterval(() => {
    quedan--;
    const el = document.getElementById('ts-reloj');
    if (el) el.textContent = quedan;
    if (quedan <= 0) { clearInterval(reloj); [...document.querySelectorAll('#modal-botones button')].pop()?.click(); }
  }, 1000);
  const v = await respuesta;
  clearInterval(reloj);
  document.body.classList.remove('alerta-solar');

  let dosis, texto;
  if (v === 'escudo') {
    s.bateria -= t.costoEscudos; dosis = Math.round((t.dosisEscudos ?? 2) * proteccion);
    texto = `🛡️ Los escudos protegieron a la tripulación: dosis +${dosis}. Gastaron ${t.costoEscudos} de batería.`;
  } else if (v === 'regolito') {
    s.ap -= t.costoRegolito; s.regolito = true; dosis = Math.round(base * 0.25);
    texto = `🪨 Cubriste la base con regolito: dosis +${dosis}. ¡Y protegerá también en las próximas tormentas!`;
  } else {
    dosis = sinHacer;
    texto = quedan <= 0 ? `⏱️ No decidiste a tiempo: la radiación golpeó la base (dosis +${dosis}).` : `⚠️ Te arriesgaste: dosis de radiación +${dosis}.`;
  }
  s.dosis = Math.min(100, s.dosis + dosis);
  sfx(dosis > 5 ? 'error' : 'exito');
  render(j);
  rego(`${texto} Dato real: Marte no tiene un campo magnético global que lo proteja, y la NASA vigila el Sol con satélites.`);
}
