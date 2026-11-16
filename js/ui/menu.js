// Portada, menú de pausa, configuración y guardado (localStorage del navegador).
import { abrir, modalAbierto } from './modal.js';
import { render, rego, reiniciarHUD } from './hud.js';
import { crearEstado } from '../state.js';
import { reproducirIntro } from './intro.js';
import { abortarMision } from '../missions.js';
import { sfx, volumen } from '../audio.js';
import { FALLO_CICLO } from './ciclo.js';
import { idioma, cambiarIdioma } from '../i18n.js';

const IDIOMAS = [['es', '🇪🇸 Español'], ['en', '🇬🇧 English']];

// Cambia de idioma recargando la página. Si hay una partida en curso, la guarda antes.
function elegirIdioma(j, nuevo) {
  if (nuevo === idioma) return;
  if (!document.body.classList.contains('en-portada') && !j.s.fin) guardar(j, true);
  cambiarIdioma(nuevo);
}

const CLAVE_PARTIDA = 'beyond-survival-partida';
const CLAVE_AJUSTES = 'beyond-survival-ajustes';
const $ = id => document.getElementById(id);
const leer = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const escribir = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };

export const DIFICULTADES = {
  facil: { nombre: '🌱 Explorador (fácil)', solesVentana: 40, accionesPorSol: 5 },
  normal: { nombre: '🚀 Astronauta (normal)', solesVentana: 30, accionesPorSol: 4 },
  dificil: { nombre: '🔥 Comandante (difícil)', solesVentana: 24, accionesPorSol: 4 },
};
const AJUSTES_BASE = { dificultad: 'normal', texto: 'normal', velocidad: 1, consejos: true, autoguardado: true, intro: true, sonido: true, volumen: 0.6 };

// El mapa no se mueve mientras haya pausa o portada.
export const juegoDetenido = j => !!j.pausa || document.body.classList.contains('en-portada');

export function cargarAjustes(j) {
  j.ajustes = { ...AJUSTES_BASE, ...(leer(CLAVE_AJUSTES) || {}), idioma };
  aplicarAjustes(j);
}

function aplicarAjustes(j) {
  document.body.classList.toggle('texto-grande', j.ajustes.texto === 'grande');
  document.body.classList.toggle('sin-consejos', !j.ajustes.consejos);
}

function aplicarDificultad(j, dif) {
  const d = DIFICULTADES[dif] || DIFICULTADES.normal;
  Object.assign(j.datos.config, { solesVentana: d.solesVentana, accionesPorSol: d.accionesPorSol });
}

const partidaGuardada = () => leer(CLAVE_PARTIDA);
export const borrarGuardado = () => { try { localStorage.removeItem(CLAVE_PARTIDA); } catch { /* sin almacenamiento */ } };

export function guardar(j, silencioso = false) {
  if (j.s.fin) return false;
  const ok = escribir(CLAVE_PARTIDA, { version: 1, fecha: Date.now(), dificultad: j.dificultad, s: j.s });
  if (!silencioso) rego(ok ? `💾 Partida guardada (sol ${j.s.sol}).` : '⚠️ Este navegador no permite guardar.');
  return ok;
}

// Punto de control para reintentar tras un colapso (al amanecer y al instalar el panel).
const CLAVE_PUNTO = 'beyond-survival-punto';
export function guardarPunto(j) {
  if (!j.s.fin) escribir(CLAVE_PUNTO, { dificultad: j.dificultad, s: j.s });
}

// Batería en 0%: la base se congela. Pantalla de reintento.
export async function colapso(j) {
  if (j.colapsando || j.s.fin) return;
  j.colapsando = true;
  abortarMision(j);
  j.pausa = true;
  sfx('colapso');
  if (j.s.etapa === 'emergencia') {
    await abrir('⚡ ¡Te quedaste sin energía en la cabina!', `<p class="ayuda-grande">🌪️</p>
      <p><b>La tormenta marciana ganó esta vez.</b> Tardaste mucho recolectando o no supiste qué juntar.</p>
      <p class="dato">💡 Recuerda: un panel solar necesita 🪨 silicio (celdas), 🔌 cobre (cables) y 🔩 aluminio (marco). Arma el panel en el 🛠️ Taller y colócalo en la zona de Paneles.</p>
      <p><b>¿Quieres reintentar?</b></p>`, [{ texto: '🔄 Reintentar' }]);
  } else if (j.s.etapa === 'ciclo') {
    await abrir('🥵 ¡Se acabó el agua y el aire!', FALLO_CICLO, [{ texto: '🔄 Reintentar' }]);
  } else if (j.s.etapa === 'antena') {
    await abrir('📡 ¡La antena consumió toda la energía!', `<p class="ayuda-grande">🌑</p>
      <p><b>La base se quedó a oscuras y los sistemas se congelaron.</b> Debes gestionar mejor el consumo.</p>
      <p class="dato">💡 La antena gasta mucha energía. Mientras tu mensaje viaja a la Tierra no la necesitas: apágala y enciéndela justo antes de que llegue la respuesta.</p>
      <p><b>¿Reintentar?</b></p>`, [{ texto: '🔄 Reintentar' }]);
  } else {
    await abrir('❄️ ¡Se acabó la energía!', `<p class="ayuda-grande">🥶</p>
      <p><b>La base se congeló.</b> Sin energía se apagan la calefacción, MOXIE y el soporte vital.</p>
      <p class="dato">💡 En Marte la energía es vida: sin ella no hay calor, ni aire, ni agua. Por eso los ingenieros de la NASA siempre guardan energía de reserva.</p>
      <p><b>Inténtalo de nuevo, Comandante.</b></p>`, [{ texto: '🔄 Reintentar' }]);
  }
  j.pausa = false;
  j.colapsando = false;
  const p = leer(CLAVE_PUNTO);
  if (p?.s) {
    empezar(j, { ...crearEstado(j.datos), ...p.s }, p.dificultad || 'normal');
    j.s.bateria = Math.max(j.s.bateria, 15); // la batería de emergencia te da otra oportunidad
    render(j);
    rego(`🔄 Volviste al inicio del sol ${p.s.sol}. Esta vez cuida la batería: revisa el Centro de energía.`);
  } else await nuevaPartida(j, true);
}

async function confirmar(titulo, texto) {
  return await abrir(titulo, `<p>${texto}</p>`, [{ texto: 'Sí', valor: true }, { texto: 'No', valor: false, clase: 'sec' }]);
}

function empezar(j, s, dificultad) {
  abortarMision(j);
  j.dificultad = dificultad;
  aplicarDificultad(j, dificultad);
  j.s = s;
  j.pausa = false;
  document.body.classList.remove('en-portada');
  $('portada').classList.add('oculto');
  const escena = j.game.scene.getScene('base');
  if (escena?.jugador) escena.reiniciar();
  reiniciarHUD();
  render(j);
}

async function nuevaPartida(j, sinIntro = false) {
  if (j.ajustes.intro && !sinIntro) await reproducirIntro(j);
  try { localStorage.removeItem(CLAVE_PUNTO); } catch { /* sin almacenamiento */ }
  const dif = j.ajustes.dificultad;
  aplicarDificultad(j, dif);
  empezar(j, crearEstado(j.datos), dif);
  j.pausa = true; // la batería no baja mientras lees
  await abrir('🚨 ¡Emergencia!', `<p class="lema">UN ERROR... UNA NUEVA VIDA</p>
    <p>La tormenta destruyó el <b>generador principal</b> y no trajiste paneles solares de repuesto. Solo queda la <b>batería de emergencia: 30%</b>, y baja <b>1% cada 4 segundos</b> (tienes 2 minutos).</p>
    <p>🔧 <b>Misión 1 · Chatarra y Arena Marciana:</b> recoge 🪨 <b>silicio</b> (en la arena), 🔌 <b>cobre</b> (cables rotos de la nave) y 🔩 <b>aluminio</b> (compuerta). Ármalos en el 🛠️ <b>Taller</b> y coloca el panel en la zona de Paneles antes de que la batería llegue a 0%.</p>
    <p>💧 Agua: 1000 litros · 🫁 Oxígeno: 100%. Afuera, el aire de tu traje se gasta.</p>
    <p>🕹️ Muévete con las flechas o WASD, o tocando el mapa. Acércate a un edificio y pulsa <b>E</b> (o tócalo). ❓ Toca cualquier barra para aprender qué es.</p>`,
    [{ texto: '¡Vamos, Comandante!' }]);
  j.pausa = false;
  rego('🚨 ¡Busca los 3 materiales que brillan cerca de la nave: silicio, cobre y aluminio!');
}

function continuar(j) {
  const p = partidaGuardada();
  if (!p?.s) return;
  aplicarDificultad(j, p.dificultad || 'normal');
  const s = { ...crearEstado(j.datos), ...p.s }; // campos nuevos con su valor inicial
  if (p.s.panel === undefined) { s.panel = true; s.etapa = null; } // partidas guardadas antes de la etapa de emergencia
  s.antenaOn = false; if (s.ciclo) Object.assign(s.ciclo, { purificador: false, electrolisis: false, antenaCiclo: false });
  if (s.etapa === 'antena' && s.llamada && !s.llamada.respondida) { s.llamada.enviado = false; s.llamada.t = 0; }
  empezar(j, s, p.dificultad || 'normal');
  guardarPunto(j);
  rego(`¡Bienvenido de vuelta! Seguimos en el sol ${p.s.sol}.`);
}

const comoJugar = () => abrir('❓ Cómo jugar', `<ul>
  <li>🎯 <b>Meta:</b> repara las 6 partes de la nave, llena el combustible y despega antes de que se acaben los soles.</li>
  <li>🕹️ <b>Moverte:</b> flechas, WASD o toca el mapa. Toca un edificio para ir hacia él.</li>
  <li>⚙️ <b>Acciones:</b> cada sol tienes unas pocas. Úsalas bien: reparar, plantar, limpiar, salir en misiones...</li>
  <li>🚙 <b>Rover:</b> sal a buscar metal, cables, chips y hielo. Afuera gastas oxígeno y recibes radiación.</li>
  <li>🌙 <b>Terminar sol:</b> de noche decides en el Consejo de Misión. Ninguna opción es gratis.</li>
  <li>⚡ <b>Energía:</b> en los Paneles eliges cuánta energía va a cada sistema.</li>
  <li>💪 <b>Tu cuerpo:</b> el Sol carga la base, pero a ti te cargan la comida y el agua. Con hambre, sed o mucha radiación caminas más lento y el aire del traje dura menos.</li>
  <li>❓ <b>¿Dudas?</b> Toca cualquier barra o casilla y REGO te explica qué es.</li></ul>`, [{ texto: '¡Entendido!', cierra: true }]);

async function configuracion(j) {
  const sel = (k, opciones, etiqueta, nota = '') => `<label class="ajuste"><span>${etiqueta}${nota ? `<small>${nota}</small>` : ''}</span>
    <select data-ajuste="${k}">${opciones.map(([v, t]) => `<option value="${v}" ${String(j.ajustes[k]) === String(v) ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`;
  while (true) {
    const v = await abrir('⚙️ Configuración',
      sel('idioma', IDIOMAS, '🌐 Idioma', idioma === 'es' ? 'Language' : '')
      + sel('dificultad', Object.entries(DIFICULTADES).map(([k, d]) => [k, d.nombre]), 'Dificultad', 'Se aplica al empezar una partida nueva')
      + sel('texto', [['normal', 'Normal'], ['grande', 'Grande']], 'Tamaño del texto')
      + sel('velocidad', [['0.7', 'Lenta'], ['1', 'Normal'], ['1.4', 'Rápida']], 'Velocidad del astronauta')
      + sel('sonido', [['true', 'Sí'], ['false', 'No']], 'Sonido')
      + sel('volumen', [['0.3', 'Bajo'], ['0.6', 'Medio'], ['1', 'Alto']], 'Volumen')
      + sel('intro', [['true', 'Sí'], ['false', 'No']], 'Ver la historia al empezar', 'La animación de inicio')
      + sel('consejos', [['true', 'Sí'], ['false', 'No']], 'Mostrar a REGO')
      + sel('autoguardado', [['true', 'Sí'], ['false', 'No']], 'Guardar automáticamente', 'Cada vez que amanece'),
      [{ texto: document.fullscreenElement ? '🗗 Salir de pantalla completa' : '⛶ Pantalla completa', valor: 'full', clase: 'sec' },
        { texto: '🗑️ Borrar partida guardada', valor: 'borrar', clase: 'sec', deshabilitado: !partidaGuardada() },
        { texto: '✔ Listo', valor: 'ok' }]);
    if (v === 'full') {
      try { document.fullscreenElement ? await document.exitFullscreen() : await document.documentElement.requestFullscreen(); } catch { /* no soportado */ }
      continue;
    }
    if (v === 'borrar') { if (await confirmar('🗑️ ¿Borrar la partida guardada?', 'No se puede deshacer.')) borrarGuardado(); continue; }
    break;
  }
}

export function mostrarPortada(j) {
  document.body.classList.add('en-portada');
  $('portada').classList.remove('oculto');
  const p = partidaGuardada();
  const botones = [
    p?.s && { texto: `▶ Continuar · Sol ${p.s.sol}`, nota: new Date(p.fecha).toLocaleString(idioma), fn: () => continuar(j) },
    { texto: '🚀 Nueva partida', fn: async () => {
      if (p?.s && !(await confirmar('🚀 ¿Empezar de nuevo?', 'Tu partida guardada se reemplazará cuando guardes.'))) return;
      nuevaPartida(j);
    } },
    { texto: '🎬 Ver la historia', clase: 'sec', fn: () => reproducirIntro(j) },
    { texto: '❓ Cómo jugar', clase: 'sec', fn: comoJugar },
    { texto: '⚙️ Configuración', clase: 'sec', fn: () => configuracion(j) },
    { texto: '📚 Datos de la NASA', clase: 'sec', fn: () => $('btn-fuentes').click() },
    { texto: idioma === 'en' ? '🌐 Español' : '🌐 English', clase: 'sec idioma', fn: () => elegirIdioma(j, idioma === 'en' ? 'es' : 'en') },
  ].filter(Boolean);
  const cont = $('portada-botones');
  cont.innerHTML = '';
  const demo = leer('beyond-survival-demo');
  if (demo?.rango) cont.insertAdjacentHTML('beforeend', `<p class="medalla">🏅 Demo completada · ${demo.rango}</p>`);
  for (const b of botones) {
    const el = document.createElement('button');
    el.innerHTML = b.texto + (b.nota ? `<small>${b.nota}</small>` : '');
    if (b.clase) el.className = b.clase;
    el.onclick = () => { if (!modalAbierto()) b.fn(); };
    cont.appendChild(el);
  }
}

export async function menuPausa(j) {
  if (modalAbierto() || juegoDetenido(j) || j.s.fin) return;
  j.pausa = true;
  try {
    while (true) {
      const v = await abrir('⏸ Pausa', `<p class="menu-col">Sol ${j.s.sol} de ${j.datos.config.solesVentana} · ${DIFICULTADES[j.dificultad]?.nombre || ''}</p>`, [
        { texto: '▶ Continuar', valor: 'seguir' }, { texto: '💾 Guardar partida', valor: 'guardar' },
        { texto: '⚙️ Configuración', valor: 'config', clase: 'sec' }, { texto: '❓ Cómo jugar', valor: 'ayuda', clase: 'sec' },
        { texto: '🔄 Reiniciar', valor: 'reiniciar', clase: 'sec' }, { texto: '🚪 Salir al menú', valor: 'salir', clase: 'sec' }]);
      if (v === 'seguir') break;
      if (v === 'guardar') {
        const ok = guardar(j);
        await abrir('💾 Guardar', `<p>${ok ? `¡Listo! Tu partida quedó guardada en este navegador (sol ${j.s.sol}).` : 'Este navegador no permite guardar.'}</p>`, [{ texto: 'OK' }]);
      }
      if (v === 'config') await configuracion(j);
      if (v === 'ayuda') await comoJugar();
      if (v === 'reiniciar' && await confirmar('🔄 ¿Reiniciar la misión?', 'Empezarás desde el sol 1. Perderás lo que no hayas guardado.')) {
        j.pausa = false;
        await nuevaPartida(j);
        break;
      }
      if (v === 'salir') {
        const r = await abrir('🚪 Salir al menú', '<p>¿Quieres guardar antes de salir?</p>', [
          { texto: '💾 Guardar y salir', valor: 'g' }, { texto: 'Salir sin guardar', valor: 'n', clase: 'sec' }, { texto: 'Cancelar', valor: 'c', clase: 'sec' }]);
        if (r === 'c') continue;
        if (r === 'g') guardar(j, true);
        abortarMision(j);
        mostrarPortada(j);
        break;
      }
    }
  } finally {
    j.pausa = false;
  }
}

export function initMenu(j) {
  $('btn-menu').onclick = () => menuPausa(j);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') menuPausa(j); });
  $('modal-cuerpo').addEventListener('change', e => {
    const k = e.target.dataset.ajuste;
    if (!k) return;
    const v = e.target.value;
    if (k === 'idioma') { elegirIdioma(j, v); return; }
    j.ajustes[k] = k === 'velocidad' || k === 'volumen' ? +v : (v === 'true' ? true : v === 'false' ? false : v);
    escribir(CLAVE_AJUSTES, j.ajustes);
    aplicarAjustes(j);
    volumen();
  });
}
