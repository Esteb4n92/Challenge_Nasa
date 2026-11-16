// Fin de la demo: al completar la Etapa 4 (sala presurizada + planta de agua).
// Mensaje dinámico para el niño según cómo jugó: rango, logros, un consejo y un dato real de la NASA.
import { abrir, modalAbierto } from './modal.js';
import { rego } from './hud.js';
import { guardar, mostrarPortada } from './menu.js';
import { sfx } from '../audio.js';

export const CLAVE_DEMO = 'beyond-survival-demo';
const fila = (a, b) => `<div class="fila"><span>${a}</span><b>${b}</b></div>`;

export const demoLograda = s => !s.etapa && s.sala && s.plantaAgua;

// Se llama seguido desde el mapa; muestra la pantalla una sola vez por partida.
export function revisarDemo(j) {
  const s = j.s;
  if (s.demoVista || s.fin || !demoLograda(s) || modalAbierto()) return;
  s.demoVista = true;
  mostrarDemo(j);
}

function evaluar(s, d) {
  const partes = Object.values(s.cohete).filter(Boolean).length;
  const bien = { dosis: s.dosis < 40, sinEmergencias: !s.emergencias, rapido: s.sol <= 14, reservas: s.agua >= 40 && s.comida >= 30 };
  const puntos = Object.values(bien).filter(Boolean).length;
  const rango = puntos >= 4 ? '🚀 Comandante marciano' : puntos >= 2 ? '🔧 Ingeniero de supervivencia' : '🌱 Explorador novato';

  const logros = [
    bien.dosis && '☀️ Protegiste muy bien a tu tripulación de la radiación del Sol.',
    bien.sinEmergencias && '🧘 No tuviste ninguna emergencia: ¡planificaste como la NASA!',
    bien.rapido && '⚡ ¡Qué rápido! Terminaste la demo en muy pocos soles.',
    s.regolito && '🪨 Cubrir la base con regolito fue una gran idea: así se protegerían los astronautas de verdad.',
    bien.reservas && '🥬 Mantuviste la comida y el agua en buen nivel.',
    partes >= 2 && '🔧 Ya empezaste a reparar la nave para volver a casa.',
  ].filter(Boolean).slice(0, 2);
  if (!logros.length) logros.push('💪 No te rendiste: ¡sobreviviste en Marte!');

  const consejo = !bien.dosis ? '💡 La próxima vez, llena los muros de agua antes de las tormentas solares y sal menos de la base.'
    : s.emergencias ? '💡 La próxima vez, vigila el agua, el aire y la comida antes de que lleguen a 0.'
    : !bien.rapido ? '💡 Usa todas tus acciones cada sol para avanzar más rápido.'
    : '💡 Reto: ¿puedes lograrlo en menos soles la próxima vez?';

  const fuentes = d.facts?.fuentes || [];
  const dato = fuentes[Math.floor(Math.random() * fuentes.length)];
  return { partes, rango, logros, consejo, dato };
}

async function mostrarDemo(j) {
  const { s, datos: d } = j;
  const e = evaluar(s, d);
  try { localStorage.setItem(CLAVE_DEMO, JSON.stringify({ rango: e.rango, fecha: Date.now() })); } catch { /* sin almacenamiento */ }
  sfx('desbloqueo');
  const v = await abrir('🎉 ¡Completaste la demo de Beyond Survival!', `<p class="lema">DEMO COMPLETADA</p>
    <p class="ayuda-grande">🏅</p>
    <p class="rango">${e.rango}</p>
    <p>¡Construiste la sala presurizada y sacaste agua del hielo de Marte! Superaste las misiones de la energía, la voz, el ciclo de la vida y el agua.</p>
    ${fila('Soles en Marte', s.sol)}${fila('Dosis de radiación', Math.round(s.dosis))}${fila('Emergencias', s.emergencias)}${fila('Partes de la nave reparadas', `${e.partes}/${d.rocket.partes.length}`)}
    <ul>${e.logros.map(t => `<li>${t}</li>`).join('')}</ul>
    <p>${e.consejo}</p>
    ${e.dato ? `<p class="dato">🚀 ${e.dato.titulo}: ${e.dato.texto}</p>` : ''}
    <p>👩‍🚀 Los científicos de la NASA también se equivocan y lo vuelven a intentar. ¿Te animas a ser astronauta?</p>
    <p class="dato">🔜 Próximamente: repara toda la nave y despega rumbo a la Tierra.</p>`,
    [{ texto: '🌍 Seguir explorando', valor: 'seguir', cierra: true }, { texto: '🏠 Volver al menú', valor: 'menu', clase: 'sec' }]);
  if (v === 'menu') { guardar(j, true); mostrarPortada(j); return; }
  rego('🌍 ¡Sigue explorando! Puedes terminar de reparar la nave y despegar antes de que se cierre la ventana.');
}
