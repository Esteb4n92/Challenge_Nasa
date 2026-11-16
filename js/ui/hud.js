import { abrir } from './modal.js';
import { terminarSol } from './noche.js';
import { siguientePaso } from '../sim.js';
import { comoConseguir, enRiesgo } from './consejos.js';

const $ = id => document.getElementById(id);
const BARRAS = [
  ['o2', '🫁', 'Oxígeno', '#5fc3f5'], ['agua', '💧', 'Agua', '#3b8fe8'], ['bateria', '⚡', 'Energía', '#f2c14e'],
  ['comida', '🥬', 'Comida', '#6cc04a'], ['dosis', '☢️', 'Radiación', '#e8642c'],
];
const nivel = (k, v) => k === 'dosis' ? (v > 60 ? 'rojo' : v > 30 ? 'amarillo' : '') : (v < 15 ? 'rojo' : v < 35 ? 'amarillo' : '');
let previo = null;

// Al tocar cualquier recurso u objeto con data-ayuda se explica qué es (modo didáctico).
function ayuda(j, clave) {
  const a = j.datos.ayuda[clave];
  if (!a) return;
  const ahora = BARRAS.some(([k]) => k === clave) ? comoConseguir(clave, j.s, j.datos) : [];
  abrir(a.titulo, `<p class="ayuda-grande">${a.icono}</p><p>${a.texto}</p>
    ${ahora.length ? `<div class="ahora"><b>${clave === 'dosis' ? '👉 Para protegerte ahora puedes:' : '👉 Para conseguir más ahora puedes:'}</b><ul>${ahora.map(t => `<li>${t}</li>`).join('')}</ul></div>` : ''}
    ${a.sube ? `<p>✅ <b>Sube con:</b> ${a.sube}</p>` : ''}${a.baja ? `<p>⚠️ <b>Baja con:</b> ${a.baja}</p>` : ''}
    ${a.real ? `<p class="dato">🚀 En la vida real: ${a.real}</p>` : ''}`, [{ texto: '¡Entendido!', cierra: true }]);
}

export function initUI(j) {
  $('btn-dormir').onclick = () => terminarSol(j);
  $('btn-fuentes').onclick = () => abrir('📚 Datos reales de la NASA',
    j.datos.facts.fuentes.map(f => `<p><b>${f.titulo}:</b> ${f.texto}<br><a href="${f.url}" target="_blank" rel="noopener">${f.url}</a></p>`).join(''),
    [{ texto: 'Cerrar', clase: 'sec' }]);
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-ayuda]');
    if (el && !el.closest('#modal')) ayuda(j, el.dataset.ayuda);
  });
}

function delta(k, v) {
  const dv = previo ? Math.round(v - previo[k]) : 0;
  if (!dv) return '';
  const bueno = k === 'dosis' ? dv < 0 : dv > 0;
  return `<em class="delta ${bueno ? 'pos' : 'neg'}">${dv > 0 ? '+' : ''}${dv}</em>`;
}

// Pista bajo una barra en riesgo: la forma más útil de recuperarla ahora mismo.
// Solo las 2 barras más urgentes muestran pista, para no tapar el resto del HUD.
const urgencia = (k, v) => (k === 'dosis' ? (v - 30) / 70 * 0.8 : (35 - v) / 35);
let conPista = new Set();
function pista(k, s, d) {
  if (!conPista.has(k)) return '';
  const t = comoConseguir(k, s, d)[0];
  return t ? `<small class="pista ${nivel(k, s[k])}">👉 ${t}</small>` : '';
}

export function render(j) {
  const s = j.s, d = j.datos, c = d.config;
  conPista = new Set(BARRAS.map(([k]) => k).filter(k => enRiesgo(k, s[k])).sort((a, b) => urgencia(b, s[b]) - urgencia(a, s[a])).slice(0, 2));
  $('bars').innerHTML = BARRAS.map(([k, ico, nombre, col]) => `<div class="fila-barra" data-ayuda="${k}" title="Toca para aprender">
    <span>${ico}</span><div class="barra ${nivel(k, s[k])}"><i style="width:${s[k]}%;background:${col}"></i>
    <span>${nombre}</span><b>${Math.round(s[k])}/100</b>${delta(k, s[k])}</div>${pista(k, s, d)}</div>`).join('');
  actualizarHora(j);
  $('ap').textContent = `Acciones: ${'●'.repeat(s.ap)}${'○'.repeat(Math.max(0, c.accionesPorSol - s.ap))}`;
  $('objetivo').innerHTML = `<b>📋 TU OBJETIVO</b>${siguientePaso(s, d)}`;

  const partes = Object.values(s.cohete).filter(Boolean).length;
  const slots = [
    ['metal', '🔩', s.metal, 'Metal'], ['cables', '🔌', s.cables, 'Cables'], ['chips', '💾', s.chips, 'Chips'],
    ['repuestos', '🧰', s.repuestosFiltro, 'Filtros'], ['combustible', '⛽', `${Math.round(s.combustible)}/${c.combustibleMeta}`, 'Combustible'],
    ['partes', '🚀', `${partes}/${Object.keys(s.cohete).length}`, 'Nave'],
  ];
  // Materiales aún no descubiertos aparecen con candado.
  s.vistos = s.vistos || {};
  for (const k of ['metal', 'cables', 'chips']) if (s[k] > 0) s.vistos[k] = true;
  const abierto = k => (['metal', 'cables', 'chips'].includes(k) ? s.vistos[k] : k === 'combustible' ? s.cohete.tanques : true);
  const cambio = k => { const c = k === 'repuestos' ? 'repuestosFiltro' : k; return previo && Math.round(s[c] ?? 0) !== Math.round(previo[c] ?? 0); };
  $('inv').innerHTML = slots.map(([k, ico, n, nombre]) => abierto(k)
    ? `<button class="slot ${cambio(k) ? 'brillo' : ''}" data-ayuda="${k}" title="${nombre}"><span>${ico}</span><b>${n}</b><small>${nombre}</small></button>`
    : `<button class="slot bloqueado" data-ayuda="${k}" title="Aún no descubierto"><span>🔒</span><b>?</b><small>${nombre}</small></button>`).join('');
  previo = { ...s };
  actualizarTraje(j);
}

export function reiniciarHUD() { previo = null; }

// Reloj del sol: de 06:00 a 21:00 en tiempo real (el día avanza solo).
export function actualizarHora(j) {
  const s = j.s, c = j.datos.config, h = c.dia.inicio + (s.hora || 0) * (c.dia.fin - c.dia.inicio);
  const hh = String(Math.floor(h)).padStart(2, '0'), mm = String(Math.floor((h % 1) * 6) * 10).padStart(2, '0');
  $('sol').textContent = `${s.hora > 0.8 ? '🌇' : '☀️'} SOL ${Math.min(s.sol, c.solesVentana)}/${c.solesVentana} · ${hh}:${mm}`;
}

// Barra del aire del traje (se actualiza seguido desde la escena de la base).
export function actualizarTraje(j, dentro) {
  const max = j.datos.config.traje.max, v = Math.max(0, j.s.traje ?? max), pct = v / max * 100;
  $('traje-barra').style.width = `${pct}%`;
  $('traje-barra').style.background = pct < 30 ? '#d23c2c' : '#7fd3ff';
  $('traje-txt').textContent = dentro ? `🏠 ${Math.ceil(v)} s` : `${Math.ceil(v)} s`;
  $('traje-caja').classList.toggle('refugio', !!dentro);
}

export function rego(texto) { $('rego-txt').textContent = texto; }
