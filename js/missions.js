// Salir de misión: transición, escenario explorable (escena "mision") y regreso con la carga.
import { abrir } from './ui/modal.js';
import { render, rego } from './ui/hud.js';
import { aplicarEfectos, limitar, resumenEfectos } from './util.js';
import { sfx, ambiente, motor } from './audio.js';

export const puedeSalir = (s, m) => !s.fin && !s.etapa && s.ap >= m.ap && s.o2 > -(m.salida.o2 || 0) + 5;

// Pantalla de viaje en Rover entre la base y el escenario.
function viaje(texto) {
  return new Promise(resolver => {
    const div = document.createElement('div');
    div.id = 'viaje';
    div.innerHTML = `<p>${texto}</p><div class="ruta"><span class="rover-viaje">🚙</span></div>`;
    document.body.appendChild(div);
    sfx('rover');
    setTimeout(() => { div.remove(); resolver(); }, 1800);
  });
}

export async function jugarMision(j, id) {
  const { s, datos: d } = j;
  const m = d.missions.misiones.find(x => x.id === id);
  if (!puedeSalir(s, m)) return;
  s.ap -= m.ap;
  aplicarEfectos(s, m.salida);
  limitar(s);
  render(j);

  await viaje(`🚙 Saliendo hacia: ${m.nombre}`);
  ambiente(0.85); // afuera el viento suena más fuerte
  j.game.scene.sleep('base');
  const res = await new Promise(alTerminar => j.game.scene.start('mision', { id, alTerminar }));
  motor(0); ambiente(0.5);
  if (res.abortada) return;
  await viaje(res.conAire ? '🚙 Volviendo a la base...' : '🚨 REGO te lleva de vuelta a la base...');
  j.game.scene.stop('mision');
  j.game.scene.wake('base');
  j.game.scene.getScene('base').prepararMinimapa();
  document.body.classList.remove('en-mision');

  aplicarEfectos(s, res.recompensas);
  limitar(s);
  // Vuelves con el aire que le quedaba al traje (o lleno, si REGO te rescató en el refugio).
  s.traje = res.conAire ? Math.min(d.config.traje.max, Math.max(5, res.aire)) : d.config.traje.max;
  render(j);
  const lista = Object.keys(res.recompensas).length ? resumenEfectos(res.recompensas).slice(1, -1) : 'nada';
  await abrir(`${m.icono} ¡De vuelta en la base!`, `
    ${res.conAire ? '' : `<p class="mal">🚨 ¡Se acabó el aire del traje! REGO te rescató, pero tuviste que dejar ${res.perdidos.length} objeto(s).</p>`}
    <p>Trajiste en el Rover: <b>${lista}</b></p>
    <p class="dato">💡 ¿Sabías que? ${m.dato}</p>`, [{ texto: 'Continuar' }]);
  rego(res.conAire ? '¡Bien hecho! Revisa la Starship V3: quizá ya puedes reparar algo.' : 'Para la próxima, vuelve al Rover cuando el aire baje del 30%.');
}

// Si se sale al menú o se reinicia en plena misión, se cierra sin recompensas.
export function abortarMision(j) {
  const sc = j.game.scene.getScene('mision');
  if (!j.game.scene.isActive('mision') || !sc) return;
  sc.terminada = true;
  motor(0); ambiente(0.5);
  const fin = sc.alTerminar;
  j.game.scene.stop('mision');
  j.game.scene.wake('base');
  j.game.scene.getScene('base').prepararMinimapa();
  document.body.classList.remove('en-mision');
  fin?.({ abortada: true });
}
