// Misión 3 · El Ciclo de la Vida: purificador de agua (ósmosis inversa) y generador de oxígeno (electrólisis)
// en tiempo real. Hay que mantener agua y aire por encima del 30% sin que la batería se agote.
import { abrir, modalAbierto } from './modal.js';
import { render, rego } from './hud.js';
import { guardarPunto, colapso } from './menu.js';
import { sfx } from '../audio.js';

const $ = id => document.getElementById(id);
const SISTEMAS = ['purificador', 'electrolisis', 'antenaCiclo'];

export function initCiclo(j) {
  for (const k of SISTEMAS) $(`ci-${k}`).onclick = () => alternar(j, k);
}

async function presentar(j) {
  await abrir('♻️ Misión 3 · El Ciclo de la Vida', `<p class="ayuda-grande">💧🫧⚡</p>
    <p>La tripulación necesita <b>beber, lavarse y respirar</b>. El tanque heredado del módulo de aterrizaje y los tanques de oxígeno se están vaciando.</p>
    <ul>
      <li>💧 <b>Purificador (ósmosis inversa):</b> empuja el agua sucia a través de una membrana finísima que deja pasar solo el agua limpia.</li>
      <li>🫧 <b>Generador de oxígeno (electrólisis):</b> usa electricidad para romper el agua (H₂O) en hidrógeno y oxígeno. ¡Gasta agua!</li>
    </ul>
    <p class="dato">⚡ Los dos gastan muchísima energía. Enciéndelos <b>solo cuando haga falta</b> y mantén el agua y el aire <b>por encima del 30%</b> durante 1 minuto.</p>`,
    [{ texto: '¡A equilibrar!' }]);
}

function alternar(j, k) {
  const s = j.s;
  if (s.etapa !== 'ciclo' || !s.ciclo || modalAbierto()) return;
  if (!s.ciclo[k] && s.bateria <= 1) { sfx('error'); rego('🔋 No hay batería suficiente para encenderlo. Apaga algo y espera a que el panel solar recargue.'); return; }
  s.ciclo[k] = !s.ciclo[k];
  sfx(s.ciclo[k] ? 'exito' : 'click');
}

// Se llama en cada fotograma desde la escena de la base.
export function tickCiclo(j, dt) {
  const s = j.s, c = j.datos.config.ciclo, seg = dt / 1000;
  document.body.classList.toggle('en-ciclo', s.etapa === 'ciclo');
  if (s.etapa !== 'ciclo') return;
  if (!s.ciclo) { // empieza la misión
    s.ciclo = { purificador: false, electrolisis: false, antenaCiclo: false, seguro: 0, aviso: false };
    s.agua = Math.min(s.agua, c.inicio.agua); s.o2 = Math.min(s.o2, c.inicio.o2); s.bateria = Math.max(s.bateria, c.inicio.bateriaMin);
    presentar(j);
    return;
  }
  const C = s.ciclo;
  // Consumo natural de la tripulación y producción del panel solar.
  s.agua -= c.consumo.agua * seg;
  s.o2 -= c.consumo.o2 * seg;
  let bat = c.panelPorSeg;
  if (C.purificador) { s.agua += c.purificador.agua * seg; bat -= c.purificador.bateria; }
  if (C.electrolisis) { s.o2 += c.electrolisis.o2 * seg; s.agua -= c.electrolisis.agua * seg; bat -= c.electrolisis.bateria; }
  if (C.antenaCiclo) bat -= c.antenaBateria;
  s.bateria = Math.min(100, Math.max(0, s.bateria + bat * seg));
  s.agua = Math.min(100, s.agua); s.o2 = Math.min(100, s.o2);
  // Sin batería, los sistemas se apagan solos.
  if (s.bateria <= 0 && (C.purificador || C.electrolisis || C.antenaCiclo)) {
    C.purificador = C.electrolisis = C.antenaCiclo = false;
    sfx('error');
    rego('🔋 ¡El panel solar no dio abasto y la batería se agotó! Se apagaron el purificador y el generador de oxígeno.');
  }
  // Zona segura: el contador solo avanza con agua y aire por encima del 30%.
  const seguro = s.agua >= c.zonaSegura && s.o2 >= c.zonaSegura;
  if (seguro) C.seguro += seg;
  if (!seguro && !C.aviso) { C.aviso = true; sfx('alarma'); rego('🚨 ¡Zona roja! Sube el agua y el aire por encima del 30% para que el contador siga.'); }
  if (seguro) C.aviso = false;
  dibujar(j, seguro);
  const ahora = performance.now();
  if (ahora > (j.proxRenderCiclo || 0)) { j.proxRenderCiclo = ahora + 1000; render(j); }
  if (s.agua <= 0 || s.o2 <= 0) { s.agua = Math.max(0, s.agua); s.o2 = Math.max(0, s.o2); colapso(j); return; }
  if (C.seguro >= c.segundosMeta) completar(j);
}

function dibujar(j, seguro) {
  const s = j.s, C = s.ciclo, c = j.datos.config.ciclo;
  const barra = (id, v, txt) => { $(`ci-${id}`).style.width = `${Math.max(0, v)}%`; $(`ci-${id}-txt`).textContent = txt; $(`ci-${id}`).parentElement.classList.toggle('rojo', v < c.zonaSegura); };
  barra('agua', s.agua, `${Math.round(s.agua * 10)} L`);
  barra('o2', s.o2, `${Math.round(s.o2)}%`);
  barra('bat', s.bateria, `${Math.round(s.bateria)}%`);
  for (const k of SISTEMAS) {
    const b = $(`ci-${k}`);
    b.classList.toggle('encendido', !!C[k]);
    b.querySelector('b').textContent = C[k] ? 'ENCENDIDO' : 'APAGADO';
  }
  const quedan = Math.max(0, Math.ceil(c.segundosMeta - C.seguro));
  $('ci-reloj').textContent = seguro ? `⏱️ Zona segura: ${Math.floor(quedan / 60)}:${String(quedan % 60).padStart(2, '0')}` : '⏸️ Zona roja: el contador está en pausa';
  $('ci-reloj').classList.toggle('mal', !seguro);
  const consumo = (C.purificador ? c.purificador.bateria : 0) + (C.electrolisis ? c.electrolisis.bateria : 0) + (C.antenaCiclo ? c.antenaBateria : 0);
  $('ci-consejo').textContent = C.antenaCiclo ? '📡 La antena no hace falta ahora: ¡apágala para ahorrar energía!'
    : consumo > c.panelPorSeg ? '⚠️ Gastas más energía de la que da el panel: la batería está bajando.'
    : s.o2 < 40 && !C.electrolisis ? '🫧 El aire baja: enciende el generador de oxígeno.'
    : s.agua < 40 && !C.purificador ? '💧 El agua baja: enciende el purificador.'
    : '💡 Enciende cada sistema solo cuando lo necesites.';
}

async function completar(j) {
  const s = j.s;
  s.etapa = null; s.ciclo = null;
  document.body.classList.remove('en-ciclo');
  guardarPunto(j);
  render(j);
  sfx('desbloqueo');
  await abrir('✅ ¡Misión 3 completada!', `<p class="lema">EL CICLO DE LA VIDA</p>
    <p class="ayuda-grande">♻️💧🫧</p>
    <p>Mantuviste el agua y el aire estables usando la energía con cuidado.</p>
    <p>Aprendiste que en una base espacial el agua y el aire se <b>reciclan</b>: la ISS recupera cerca del 98% del agua, y el oxígeno se fabrica rompiendo agua con electricidad.</p>
    <p>🔓 <b>Siguiente: Etapa 5 · Protección contra la Radiación.</b> El sistema de alerta espacial (DONKI) ya está activo: cuando suene la alarma roja, ¡protege la base!</p>`,
    [{ texto: '¡Siguiente etapa!' }]);
  rego('☢️ Etapa 5: vigila las alertas solares. Mientras, sal con el Rover por materiales y construye la sala presurizada.');
}

// Fallo propio de esta misión (lo muestra colapso() en menu.js).
export const FALLO_CICLO = `<p class="ayuda-grande">🥵</p>
  <p><b>¡Se acabó el agua potable y el aire en la base!</b> Los astronautas están deshidratados.</p>
  <p class="dato">💡 Enciende el purificador cuando el agua baje y el generador de oxígeno cuando baje el aire. Apaga lo que no uses (¡como la antena!) para que el panel solar alcance.</p>
  <p><b>Debes aprender a reciclar mejor los recursos. ¿Reintentar?</b></p>`;
