// Mesa de trabajo del Taller: arrastrar silicio, cobre y aluminio al plano para armar el Panel Solar Artesanal #1.
// En pantallas táctiles también funciona tocando el material y luego su lugar.
import { abrir } from './modal.js';
import { rego, render } from './hud.js';
import { sfx } from '../audio.js';

const MATERIALES = [
  { id: 'silicio', icono: '🪨', nombre: 'Silicio', ranura: 'celdas', dato: 'Las celdas solares se fabrican con silicio: convierten la luz del Sol en electricidad.' },
  { id: 'cobre', icono: '🔌', nombre: 'Cobre', ranura: 'cables', dato: 'El cobre conduce muy bien la electricidad: la lleva de las celdas a la batería.' },
  { id: 'aluminio', icono: '🔩', nombre: 'Aluminio', ranura: 'marco', dato: 'El aluminio es ligero y fuerte: es el marco que sostiene las celdas.' },
];
const RANURAS = [
  { id: 'celdas', nombre: '☀️ Celdas solares' },
  { id: 'cables', nombre: '⚡ Cables' },
  { id: 'marco', nombre: '🔲 Marco' },
];

export async function abrirTaller(j) {
  const s = j.s, r = s.recogidos || {};
  if (s.panel || s.etapa !== 'emergencia') {
    return abrir('🛠️ Taller', '<p>Aquí armaste tu primer panel solar. ¡Pronto podrás fabricar más cosas!</p>', [{ texto: 'Cerrar', clase: 'sec' }]);
  }
  if (s.panelArmado) {
    return abrir('🛠️ Taller', '<p>✅ Ya armaste el <b>Panel Solar Artesanal #1</b>. ¡Llévalo a la zona de Paneles y colócalo!</p>', [{ texto: 'Cerrar', clase: 'sec' }]);
  }
  const faltan = MATERIALES.filter(m => !r[m.id]);
  if (faltan.length) {
    return abrir('🛠️ Taller · Panel solar', `<p>Para armar el panel necesitas 3 materiales. Te faltan:</p>
      <ul>${faltan.map(m => `<li>${m.icono} <b>${m.nombre}</b></li>`).join('')}</ul>
      <p class="dato">💡 Brillan cerca de la nave: en la arena, en los cables rotos y en la compuerta.</p>`, [{ texto: 'Cerrar', clase: 'sec' }]);
  }

  const html = `<p>Arrastra cada material a su lugar en el plano (o tócalo y luego toca el lugar).</p>
    <div class="taller">
      <div class="taller-mats">${MATERIALES.map(m => `<div class="mat" draggable="true" data-mat="${m.id}"><span>${m.icono}</span>${m.nombre}</div>`).join('')}</div>
      <div class="plano"><b>📐 Panel Solar Artesanal #1</b>${RANURAS.map(x => `<div class="ranura" data-ranura="${x.id}">${x.nombre}</div>`).join('')}</div>
    </div>
    <p id="taller-dato" class="dato">💡 Cada material tiene una función. ¿Dónde va cada uno?</p>`;
  const respuesta = abrir('🛠️ Taller · Panel solar', html,
    [{ texto: '🔧 Ensamblar panel', valor: 'ok', deshabilitado: true }, { texto: 'Cerrar', valor: 'cerrar', clase: 'sec' }]);
  prepararMesa();
  if (await respuesta !== 'ok') return;
  s.panelArmado = true;
  sfx('desbloqueo');
  render(j);
  await abrir('🛠️ ¡Panel armado!', `<p class="ayuda-grande">☀️</p>
    <p>Armaste el <b>Panel Solar Artesanal #1</b> con silicio, cobre y aluminio.</p>
    <p>🏃 ¡Rápido! Llévalo a la <b>zona de Paneles</b> y colócalo antes de que la batería llegue a 0%.</p>`, [{ texto: '¡Vamos!' }]);
  rego('🛠️ ¡Panel armado! Llévalo a la zona de Paneles (arriba a la derecha) y colócalo.');
}

// Mesa de armado: arrastrar (o tocar) cada pieza hasta su ranura. También la usa la planta de agua.
// Al completar todo, habilita el primer botón de la ventana.
export function prepararMesa(materiales = MATERIALES, listo = '🎉 ¡Todo en su lugar! Pulsa «Ensamblar panel».') {
  const MATERIALES = materiales;
  const cuerpo = document.getElementById('modal-cuerpo'), dato = document.getElementById('taller-dato');
  const puestos = new Set();
  let elegido = null;

  const colocar = (matId, ranura) => {
    const m = MATERIALES.find(x => x.id === matId);
    if (!m || puestos.has(m.id) || ranura.classList.contains('lleno')) return;
    if (m.ranura !== ranura.dataset.ranura) {
      ranura.classList.remove('mal'); void ranura.offsetWidth; ranura.classList.add('mal');
      sfx('error');
      dato.textContent = `🤔 El ${m.nombre.toLowerCase()} no va ahí. Pista: ${m.dato}`;
      return;
    }
    ranura.classList.add('lleno');
    ranura.textContent = `${m.icono} ${m.nombre}`;
    cuerpo.querySelector(`.mat[data-mat="${m.id}"]`).classList.add('usado');
    puestos.add(m.id);
    sfx('recoger');
    dato.textContent = `✅ ${m.dato}`;
    if (puestos.size === MATERIALES.length) {
      document.querySelector('#modal-botones button').disabled = false;
      dato.textContent = listo;
      sfx('exito');
    }
  };

  cuerpo.querySelectorAll('.mat').forEach(el => {
    el.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', el.dataset.mat));
    el.addEventListener('click', () => {
      if (el.classList.contains('usado')) return;
      cuerpo.querySelectorAll('.mat').forEach(x => x.classList.remove('elegido'));
      el.classList.add('elegido');
      elegido = el.dataset.mat;
    });
  });
  cuerpo.querySelectorAll('.ranura').forEach(r => {
    r.addEventListener('dragover', e => { e.preventDefault(); r.classList.add('encima'); });
    r.addEventListener('dragleave', () => r.classList.remove('encima'));
    r.addEventListener('drop', e => { e.preventDefault(); r.classList.remove('encima'); colocar(e.dataTransfer.getData('text/plain'), r); });
    r.addEventListener('click', () => {
      if (!elegido) return;
      colocar(elegido, r);
      elegido = null;
      cuerpo.querySelectorAll('.mat').forEach(x => x.classList.remove('elegido'));
    });
  });
}
