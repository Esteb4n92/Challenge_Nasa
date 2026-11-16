import { abrir } from './modal.js';
import { render, rego } from './hud.js';
import { avanzarSol, alertas, siguientePaso } from '../sim.js';
import { aplicarEfectos, limitar, resumenEfectos } from '../util.js';
import { guardar, borrarGuardado, guardarPunto, colapso } from './menu.js';
import { peligroCongelarse, modoAhorro } from '../systems/energy.js';
import { sfx } from '../audio.js';

let enCurso = false;
let ultimaCarta = null;

// Noche: carta del Consejo de Misión → simulación del sol → resumen.
export async function terminarSol(j) {
  const { s, datos: d } = j;
  if (enCurso || s.fin) return;
  if (s.etapa === 'emergencia') { rego('🚨 ¡No puedes dormir sin energía! Primero construye el panel solar.'); return; }
  if (s.etapa === 'antena') { rego('📡 Primero completa la Misión 2: repara la antena y habla con la Tierra.'); return; }
  if (s.etapa === 'ciclo') { rego('♻️ Primero completa la Misión 3: mantén el agua y el aire por encima del 30%.'); return; }
  enCurso = true;
  try {
    const opciones = d.cards.cartas.filter(c => c.id !== ultimaCarta);
    const carta = opciones[Math.floor(Math.random() * opciones.length)];
    ultimaCarta = carta.id;
    const cam = j.game?.scene.getScene('base')?.cameras.main;
    cam?.fade(600, 10, 5, 20);
    sfx('noche');
    const sobran = s.ap ? `<p class="mal">Te quedaron ${s.ap} acción(es) sin usar.</p>` : '';
    const i = await abrir(`🌙 Consejo de Misión · Sol ${s.sol}`, `<p>${carta.texto}</p>${sobran}`,
      carta.opciones.map((o, k) => ({ texto: `${o.texto} ${resumenEfectos(o.efectos)}`, valor: k })));
    const op = carta.opciones[i];
    aplicarEfectos(s, op.efectos, op.fijar);
    limitar(s);

    // Aviso antes de dormir: ¿la batería llegará a 0% con este reparto de energía?
    const extra = [];
    if (peligroCongelarse(s, d.config)) {
      const v = await abrir('⚠️ ¡Peligro de congelarse!', `<p>Con este reparto de energía, la batería llegará a <b>0%</b> esta noche y <b>la base se congelará</b>.</p>
        <p class="dato">💡 Los ingenieros apagan primero lo menos urgente: el invernadero, luego parte de MOXIE. El soporte vital es lo último que se apaga.</p>`,
        [{ texto: '⚡ Activar modo ahorro', valor: 'ahorro' }, { texto: 'Arriesgarme así', valor: 'nada', clase: 'sec' }]);
      if (v === 'ahorro') extra.push(modoAhorro(s, d.config));
    }

    const log = [`🗳️ ${op.resultado}`, ...extra, ...avanzarSol(s, d)];
    j.game?.scene.getScene('base')?.alAmanecer();
    render(j);
    cam?.fadeIn(900, 10, 5, 20);
    sfx('amanecer');
    await abrir(`☀️ Amanece · Sol ${Math.min(s.sol, d.config.solesVentana)}`,
      `<ul>${log.map(l => `<li>${l}</li>`).join('')}</ul>${carta.dato ? `<p class="dato">💡 ¿Sabías que? ${carta.dato}</p>` : ''}`,
      [{ texto: 'Continuar' }]);
    if (s.fin) return mostrarFinal(j);
    if (s.bateria <= 0) { enCurso = false; return colapso(j); }
    guardarPunto(j);
    if (j.ajustes?.autoguardado) guardar(j, true);
    if (s.panel && !s.etapa && !s.tormentaPolvo && Math.random() < d.config.tormenta.prob) { enCurso = false; return tormentaRapida(j); }
    rego(alertas(s, d)[0] || siguientePaso(s, d));
  } finally {
    enCurso = false;
  }
}

// Tormenta de polvo al amanecer: el panel produce la mitad y hay 10 segundos para decidir qué apagar.
export async function tormentaRapida(j) {
  const s = j.s, c = j.datos.config;
  s.tormentaPolvo = Math.max(s.tormentaPolvo, 1);
  sfx('alarma'); sfx('viento');
  render(j);
  let quedan = c.tormenta.decisionSeg;
  const respuesta = abrir('🌪️ ¡Tormenta de polvo!', `<p>La arena cubrió el panel solar: <b>hoy producirá un 50% menos</b> de energía.</p>
    <p>¡Decide rápido qué apagar antes de que la batería llegue a 0%!</p>
    <p class="reloj-puzzle">⏱️ <b id="tp-reloj">${quedan}</b> s</p>
    <p class="dato">🔥 <b>Calentador:</b> sin él hace frío y el soporte vital renueva menos aire.<br>💧 <b>Purificador de agua:</b> sin él, hoy no se recicla agua.</p>`,
    [{ texto: '🔥 Apagar el calentador', valor: 'calentador' }, { texto: '💧 Apagar el purificador', valor: 'purificador' }, { texto: 'No apagar nada', valor: 'nada', clase: 'sec' }]);
  const reloj = setInterval(() => {
    quedan--;
    const el = document.getElementById('tp-reloj');
    if (el) el.textContent = quedan;
    if (quedan <= 0) { clearInterval(reloj); [...document.querySelectorAll('#modal-botones button')].pop()?.click(); }
  }, 1000);
  const v = await respuesta;
  clearInterval(reloj);
  if (v === 'calentador') { s.asignacion.soporte = 50; rego('🔥 Apagaste parte del calentador: ahorras energía, pero hará frío. Súbelo en el Centro de energía cuando pase la tormenta.'); }
  else if (v === 'purificador') { s.purificadorOff = true; rego('💧 Apagaste el purificador: ahorras energía, pero hoy no se recicla agua.'); }
  else rego(quedan <= 0 ? '⏱️ No decidiste a tiempo y nada se apagó. ¡Vigila la batería esta noche!' : '⚠️ No apagaste nada: la batería podría no alcanzar esta noche.');
  render(j);
}

export async function mostrarFinal(j) {
  const s = j.s;
  borrarGuardado(); // la misión terminó: no se puede "continuar"
  if (s.fin === 'despegue') {
    const estrellas = Math.max(1, 3 - (s.dosis > 60 ? 1 : 0) - (s.emergencias > 0 ? 1 : 0));
    await abrir('🚀 ¡Despegue!', `<p>La nave Starship V3 deja Marte. ¡Vuelves a casa!</p>
      <p class="estrellas">${'⭐'.repeat(estrellas)}</p>
      <ul><li>Soles en Marte: ${s.sol}</li><li>Dosis de radiación: ${Math.round(s.dosis)} ${s.dosis > 60 ? '(alta: protégete más)' : '(bien)'}</li>
      <li>Emergencias: ${s.emergencias}</li></ul>
      <p class="dato">💡 Así trabajan los planificadores de misiones de la NASA: cada kilo de oxígeno, cada litro de agua y cada vatio cuentan.</p>`,
      [{ texto: 'Jugar otra vez' }]);
  } else {
    await abrir('🛰️ Se cerró la ventana de lanzamiento', `<p>La Tierra y Marte se alejaron. La próxima misión podrá rescatarte en unos <b>26 meses</b>.</p>
      <p class="dato">💡 Consejo: repara primero la antena y los tanques, y usa a MOXIE para hacer combustible cuando tengas oxígeno de sobra.</p>`,
      [{ texto: 'Intentar de nuevo' }]);
  }
  location.reload();
}
