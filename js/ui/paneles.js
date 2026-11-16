import { abrir } from './modal.js';
import { render, rego } from './hud.js';
import { mostrarFinal } from './noche.js';
import { guardarPunto } from './menu.js';
import { abrirTaller } from './taller.js';
import { abrirPlanta } from './plantaAgua.js';
import { puzzleAntena, alternarAntena } from './antena.js';
import { sfx } from '../audio.js';
import { ACCIONES, motivoNo, hacer, bloqueo } from '../actions.js';
import { jugarMision, puedeSalir } from '../missions.js';
import { produccion } from '../systems/energy.js';
import { resumenEfectos } from '../util.js';

const $ = id => document.getElementById(id);
const pct = v => Math.round(v * 100) + '%';
const fila = (a, b, clase = '') => `<div class="fila"><span>${a}</span><b class="${clase}">${b}</b></div>`;

// Botón de acción: si no se puede, se muestra deshabilitado con el motivo.
function boton(j, acc, texto, ...args) {
  const motivo = motivoNo(j.s, j.datos, acc, args);
  const ap = ACCIONES[acc].ap;
  return { texto: `${texto}${ap ? ` (${ap}⚙️)` : ''}${motivo ? ` — ${motivo}` : ''}`, valor: [acc, ...args].join(':'), deshabilitado: !!motivo };
}

function prevEnergia(j) {
  const s = j.s, c = j.datos.config;
  const prod = produccion(s, c);
  const pide = Object.entries(c.demanda).reduce((t, [k, v]) => t + v * s.asignacion[k] / 100, 0);
  const balance = pide > prod ? `gastarás ${Math.round(Math.min(s.bateria, pide - prod))} de batería` : `guardarás ${Math.round(prod - pide)} en la batería`;
  return `☀️ Producirás ~${prod} · Pides ${Math.round(pide)} → ${balance}${pide > prod + s.bateria ? ' ⚠️ ¡No alcanza!' : ''}`;
}

const slider = (j, k, nombre) => `<label class="slider">${nombre} (usa ${j.datos.config.demanda[k]})
  <input type="range" min="0" max="100" step="25" value="${j.s.asignacion[k]}" data-asig="${k}"><b>${j.s.asignacion[k]}%</b></label>`;

const PANELES = {
  habitat: j => { const s = j.s; return {
    titulo: '🏠 Hábitat · Soporte vital',
    html: (s.sala ? fila('Sala presurizada', 'Construida ✅', 'ok')
      : `<p class="mal">🏗️ La sala presurizada aún no está construida. Sin ella, el único lugar con aire es la Starship V3.</p>
         <p>Constrúyela para tener un refugio donde estar sin gastar el aire del traje. Cuesta ${resumenEfectos(j.datos.config.sala.costo)}.</p>`)
      + fila('Filtro de CO₂', `${s.filtro}%`, s.filtro < 30 ? 'mal' : 'ok') + fila('Repuestos de filtro', s.repuestosFiltro)
      + fila('Reciclador de agua', pct(s.reciclador)) + fila('Muros de agua (refugio)', s.refugio ? 'Llenos 🛡️' : 'Vacíos', s.refugio ? 'ok' : 'mal')
      + '<p class="dato">💡 El filtro quita el CO₂ que exhalas: sin él, el aire se vuelve tóxico aunque haya oxígeno. El agua es un gran escudo contra la radiación.</p>',
    botones: [...(s.sala ? [] : [boton(j, 'construirSala', `🏗️ Construir sala ${resumenEfectos(j.datos.config.sala.costo)}`)]), boton(j, 'filtro', 'Cambiar filtro'), boton(j, 'reciclador', 'Mejorar reciclador 🔩2 💾1'),
      s.refugio ? boton(j, 'vaciar', 'Vaciar muros 💧+20') : boton(j, 'muros', 'Llenar muros 💧-20')],
  }; },

  energia: j => ({
    titulo: '🔋 Centro de energía',
    html: fila('Polvo en los paneles', pct(j.s.polvo), j.s.polvo >= 0.3 ? 'mal' : 'ok') + fila('Batería', Math.round(j.s.bateria))
      + (j.s.tormentaPolvo ? `<p class="mal">🌪️ Tormenta de polvo: ${j.s.tormentaPolvo} sol(es) más.</p>` : '')
      + '<p>¿Cuánta energía le das a cada sistema esta noche?</p>'
      + slider(j, 'soporte', '🫁 Soporte vital') + slider(j, 'moxie', '⚙️ MOXIE') + slider(j, 'invernadero', '🌱 Invernadero')
      + `<p id="prev" class="dato">${prevEnergia(j)}</p>`,
    botones: [boton(j, 'limpiar', 'Limpiar paneles')],
  }),

  moxie: j => ({
    titulo: '⚙️ MOXIE · Fábrica de oxígeno',
    html: '<p>MOXIE convierte el CO₂ del aire de Marte en oxígeno. Ese oxígeno sirve para <b>respirar</b>... o para <b>el combustible</b> de la nave.</p>'
      + (j.s.cohete.tanques
        ? `<label class="slider">⛽ % al combustible<input type="range" min="0" max="100" step="25" value="${j.s.moxieACombustible}" data-moxie><b>${j.s.moxieACombustible}%</b></label>
           <p class="dato">💡 Cada kilo de oxígeno que respiras es un kilo menos para volver a casa. El combustible también necesita agua.</p>`
        : '<p class="mal">⛽ Repara los tanques de la nave para guardar combustible.</p>'),
    botones: [],
  }),

  invernadero: j => { const s = j.s, d = j.datos; return {
    titulo: '🌱 Invernadero',
    html: s.parcelas.map((p, i) => {
      if (!p) return fila(`Parcela ${i + 1}`, 'Libre');
      const c = d.crops.cultivos.find(x => x.id === p.id);
      return fila(`Parcela ${i + 1}: ${c.icono} ${c.nombre}`, p.hongo ? '🍄 Hongos' : p.dias >= c.dias ? '✅ ¡Lista!' : `${p.dias}/${c.dias} soles`, p.hongo ? 'mal' : 'ok');
    }).join('') + `<p class="dato">💡 ${d.crops.dato}</p>`,
    botones: [
      ...d.crops.cultivos.map(c => boton(j, 'plantar', `Plantar ${c.icono} ${c.nombre} 💧-3`, c.id)),
      ...s.parcelas.flatMap((p, i) => !p ? [] : p.hongo ? [boton(j, 'quitarHongo', `Quitar hongos (parcela ${i + 1})`, i)] : [boton(j, 'cosechar', `Cosechar parcela ${i + 1}`, i)]),
    ],
  }; },

  antena: j => { const s = j.s; return {
    titulo: '📡 Antena',
    html: !s.cohete.antena
      ? '<p class="mal">La antena se rompió en el aterrizaje. Nadie en la Tierra puede oírte. Repárala en la Starship V3.</p>'
      : fila('Alertas de tormentas solares', s.pronostico ? 'Activas' : 'No', s.pronostico ? 'ok' : '') + fila('Planos de navegación', s.planos ? 'Recibidos' : 'No', s.planos ? 'ok' : '')
        + (s.mensajes.length ? `<p>⏳ Esperando respuesta: ${s.mensajes.length} mensaje(s).</p>` : '')
        + '<p class="dato">💡 Entre Marte y la Tierra un mensaje tarda de 3 a 22 minutos. ¡No puedes pedir ayuda en una emergencia: decides tú!</p>',
    botones: s.cohete.antena ? [boton(j, 'mensaje', 'Pedir alertas solares', 'pronostico'), boton(j, 'mensaje', 'Pedir planos de navegación', 'planos')] : [],
  }; },

  nave: j => { const s = j.s, d = j.datos; return {
    titulo: '🚀 Starship V3',
    html: d.rocket.partes.map(p => fila(`${p.icono} ${p.nombre}`, s.cohete[p.id] ? '✅' : resumenEfectos(p.costo), s.cohete[p.id] ? 'ok' : '')).join('')
      + fila('⛽ Combustible', `${Math.round(s.combustible)}/${d.config.combustibleMeta}`),
    botones: [...d.rocket.partes.filter(p => !s.cohete[p.id]).map(p => boton(j, 'reparar', `Reparar ${p.nombre}`, p.id)), boton(j, 'despegar', '🚀 ¡Despegar!')],
  }; },

  rover: j => { const s = j.s; return {
    titulo: '🚙 Rover · Misiones',
    html: j.datos.missions.misiones.map(m => `<p><b>${m.icono} ${m.nombre}</b><br>${m.descripcion}<br>
      Cuesta: ${m.ap}⚙️ y llenar el traje ${resumenEfectos(m.salida)} · Aire: ${m.traje} s · Carga del Rover: ${m.carga} · ⏱️ ${Math.floor(j.datos.config.misionTiempo / 60)} min</p>`).join('')
      + '<p class="dato">🚙 Elige una misión para salir: allá manejas el Rover (gasta batería) y te bajas para recoger piezas. El aire del traje se gasta en tiempo real: vuelve antes de que se acabe.</p>',
    botones: j.datos.missions.misiones.map(m => ({ texto: `Ir: ${m.nombre}${puedeSalir(s, m) ? '' : s.etapa ? ' — primero el panel solar' : ' — sin acciones u oxígeno'}`, valor: `mision:${m.id}`, deshabilitado: !puedeSalir(s, m) })),
  }; },
};

// Etapa 1 (emergencia): la Nave da piezas y en la zona de Paneles se instala el panel solar.
const EMERGENCIA = {
  nave: j => ({
    titulo: '🚀 Starship V3 · ¡Emergencia!',
    html: `<p class="mal">🚨 El generador principal se destruyó y no trajiste paneles solares de repuesto.</p>
      <p>Arma un panel solar con chatarra y arena marciana: busca 🪨 <b>silicio</b> en la arena, 🔌 <b>cobre</b> en los cables rotos y 🔩 <b>aluminio</b> en la compuerta. Luego ensámblalo en el 🛠️ <b>Taller</b>.</p>
      <p class="dato">⚡ La batería de emergencia baja 1% cada 4 segundos. ¡No pierdas tiempo!</p>`,
    botones: [],
  }),
  energia: j => ({
    titulo: '☀️ Zona de paneles solares',
    html: j.s.panelArmado
      ? '<p>¡Tienes el Panel Solar Artesanal #1! Colócalo aquí para que la luz del Sol recargue la batería.</p>'
      : '<p class="mal">Aquí no hay paneles: el accidente los destruyó. Primero arma uno en el 🛠️ Taller.</p>',
    botones: [boton(j, 'instalarPanel', '☀️ Colocar el panel solar')],
  }),
};

let ocupado = false;

export async function abrirEdificio(j, id) {
  if (ocupado || j.s.fin) return;
  if (id === 'taller') { ocupado = true; try { await abrirTaller(j); } finally { ocupado = false; } return; }
  if (!PANELES[id] && id !== 'planta') return;
  const cerrado = bloqueo(id, j.s);
  if (cerrado) { rego(`🔒 ${cerrado}`); sfx('error'); return; }
  if (id === 'planta') { ocupado = true; try { await abrirPlanta(j); } finally { ocupado = false; } return; }
  if (id === 'antena' && j.s.etapa === 'antena') {
    if (!j.s.cohete.antena) { ocupado = true; try { await puzzleAntena(j); } finally { ocupado = false; } }
    else alternarAntena(j);
    return;
  }
  ocupado = true;
  try {
    while (true) {
      const p = ((j.s.etapa === 'emergencia' && EMERGENCIA[id]) || PANELES[id])(j);
      const v = await abrir(p.titulo, p.html, [...p.botones, { texto: 'Cerrar', valor: 'cerrar', clase: 'sec' }]);
      if (v === 'cerrar') break;
      if (v.startsWith('mision:')) { await jugarMision(j, v.slice(7)); break; }
      const [acc, ...args] = v.split(':');
      rego(hacer(j.s, j.datos, acc, args));
      sfx(['instalarPanel', 'construirSala', 'reparar'].includes(acc) ? 'desbloqueo' : 'exito');
      render(j);
      if (acc === 'instalarPanel' && j.s.panel) {
        guardarPunto(j); // los reintentos ya no repiten la emergencia
        await abrir('✅ ¡Misión 1 completada!', `<p class="lema">CHATARRA Y ARENA MARCIANA</p>
          <p class="ayuda-grande">☀️🔋</p>
          <p>Colocaste el panel solar: la batería dejó de bajar y <b>subió al 50%</b>.</p>
          <p>Aprendiste que un panel necesita <b>silicio</b> (celdas), <b>cobre</b> (cables) y <b>aluminio</b> (marco).</p>
          <p>🔓 <b>Siguiente: Misión 2 · Despertar la Voz.</b> La base sigue incomunicada: toca la 📡 Antena para repararla.</p>`, [{ texto: '¡Siguiente misión!' }]);
        break;
      }
      if (j.s.fin) { await mostrarFinal(j); break; }
    }
  } finally {
    ocupado = false;
  }
}

// Sliders de energía y de MOXIE: cambian el estado al moverlos.
export function initPaneles(j) {
  $('modal-cuerpo').addEventListener('input', e => {
    const t = e.target;
    if (t.dataset.asig) j.s.asignacion[t.dataset.asig] = +t.value;
    else if (t.dataset.moxie !== undefined) j.s.moxieACombustible = +t.value;
    else return;
    t.parentElement.querySelector('b').textContent = `${t.value}%`;
    if ($('prev')) $('prev').textContent = prevEnergia(j);
  });
}
