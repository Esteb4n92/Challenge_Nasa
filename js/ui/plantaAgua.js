// Misión del agua: la planta junto al lago está rota y el lago es un bloque de hielo.
// Hay que armar la línea de agua en orden (transformador → filtro → tanque) para derretir, limpiar y guardar el agua.
import { abrir } from './modal.js';
import { render, rego } from './hud.js';
import { prepararMesa } from './taller.js';
import { guardarPunto } from './menu.js';
import { sfx } from '../audio.js';
import { lienzo } from '../sprites.js';
import { puede, pagar, ICONOS } from '../util.js';

const PIEZAS = [
  { id: 'transformador', icono: '🔥', nombre: 'Transformador', ranura: 'derretir', dato: 'El transformador convierte la electricidad en calor: así el hielo se derrite y se vuelve agua líquida.' },
  { id: 'filtro', icono: '🧽', nombre: 'Filtro', ranura: 'limpiar', dato: 'El hielo de Marte trae polvo y sales tóxicas (percloratos). El filtro las atrapa y deja pasar solo el agua limpia.' },
  { id: 'tanque', icono: '🛢️', nombre: 'Tanque', ranura: 'guardar', dato: 'El tanque guarda el agua limpia y la manda a la base por tuberías.' },
];
const PASOS = [
  { id: 'derretir', nombre: '1️⃣ 🧊 Derretir el hielo' },
  { id: 'limpiar', nombre: '2️⃣ 🟤 Limpiar el agua' },
  { id: 'guardar', nombre: '3️⃣ 💧 Guardar el agua' },
];
const costoTxt = costo => Object.entries(costo).map(([k, v]) => `${ICONOS[k]}${v}`).join(' ');
const fila = (a, b, clase = '') => `<div class="fila"><span>${a}</span><b class="${clase}">${b}</b></div>`;

// Sprites de la planta (rota y funcionando), dibujados por código como el resto del mapa.
export function texturasPlanta(sc) {
  const dibujar = rota => (r, domo) => {
    const metal = rota ? ['#8a8790', '#6e6b74', '#4a4552'] : ['#f4f1ea', '#d0cbc2', '#9a958c'];
    // tubería que viene del lago (arriba)
    r(rota ? '#5a5560' : '#9a958c', 6, 0, 3, 14); r(rota ? '#5a5560' : '#9a958c', 6, 12, 10, 3);
    if (rota) { r('#1a0f1f', 6, 5, 3, 2); r('#c9c3bb', 9, 4, 2, 1); }
    // transformador (caja con resistencia)
    r(metal[2], 14, 12, 12, 12); r(metal[1], 15, 13, 10, 10);
    r(rota ? '#3a3540' : '#e8642c', 17, 16, 6, 4); if (!rota) r('#f2c14e', 18, 17, 4, 1);
    // filtro (cilindro)
    r(metal[2], 26, 16, 6, 3); r(metal[1], 27, 14, 4, 14); r(rota ? '#5a3e26' : '#7a5a3a', 28, 18, 2, 6);
    // tanque de agua
    domo(39, 13, 6, 4, metal);
    r(metal[0], 33, 13, 4, 15); r(metal[1], 37, 13, 4, 15); r(metal[2], 41, 13, 4, 15);
    r(rota ? '#3a3540' : '#3b8fe8', 37, 18, 4, 6); if (!rota) r('#9fd3f0', 38, 19, 1, 2);
    // patas y base
    r('#6e6b74', 12, 28, 34, 3); r('#4a4552', 14, 31, 2, 3); r('#4a4552', 42, 31, 2, 3);
    if (rota) { r('#1a0f1f', 20, 13, 1, 9); r('#1a0f1f', 39, 14, 1, 6); }
  };
  lienzo(sc, 'planta', 48, 34, dibujar(false));
  lienzo(sc, 'planta-rota', 48, 34, dibujar(true));
}

export async function abrirPlanta(j) {
  const s = j.s, c = j.datos.config.plantaAgua;
  if (s.plantaAgua) return ventanaPlanta(j);

  const intro = `<p class="mal">🧊 El lago del cráter es un bloque de hielo y la planta de agua está rota.</p>
    <p>Para tener agua del lago hay que derretir el hielo, limpiarlo y guardarlo. Repara la planta con un 🔥 transformador, un 🧽 filtro y un 🛢️ tanque.</p>`;
  const faltan = Object.entries(c.costo).filter(([k, v]) => s[k] < v).map(([k, v]) => `${ICONOS[k]}${v - s[k]}`).join(' ');
  if (faltan || s.ap < c.ap) {
    return abrir('🚰 Planta de agua', `${intro}${fila('Cuesta:', `${costoTxt(c.costo)} · ${c.ap}⚙️`)}
      <p class="dato">${faltan ? `🔩 Te faltan ${faltan}: búscalos con el Rover.` : '⚙️ No te quedan acciones hoy. Vuelve mañana.'}</p>`, [{ texto: 'Cerrar', clase: 'sec' }]);
  }

  const html = `${intro}
    <p>Arrastra cada pieza a su paso de la línea de agua (o tócala y luego toca el paso).</p>
    <div class="taller">
      <div class="taller-mats">${PIEZAS.map(m => `<div class="mat" draggable="true" data-mat="${m.id}"><span>${m.icono}</span>${m.nombre}</div>`).join('')}</div>
      <div class="plano"><b>🚰 Línea de agua del lago</b>${PASOS.map(x => `<div class="ranura" data-ranura="${x.id}">${x.nombre}</div>`).join('')}</div>
    </div>
    <p id="taller-dato" class="dato">💡 ¿Qué va primero: limpiar el agua o derretir el hielo?</p>`;
  const respuesta = abrir('🚰 Planta de agua · Reparación', html,
    [{ texto: `🔧 Instalar la planta · ${costoTxt(c.costo)} · ${c.ap}⚙️`, valor: 'ok', deshabilitado: true }, { texto: 'Cerrar', valor: 'cerrar', clase: 'sec' }]);
  prepararMesa(PIEZAS, '🎉 ¡La línea de agua está completa! Pulsa «Instalar la planta».');
  if (await respuesta !== 'ok') return;

  if (!puede(s, c.costo) || s.ap < c.ap) return;
  pagar(s, c.costo);
  s.ap -= c.ap;
  Object.assign(s, { plantaAgua: true, plantaOff: false, lagoCongelado: false });
  sfx('desbloqueo');
  render(j);
  guardarPunto(j);
  await abrir('✅ ¡Misión del agua completada!', `<p class="lema">AGUA DEL HIELO</p>
    <p class="ayuda-grande">🧊🔥🧽💧</p>
    <p>La planta de agua funciona: el transformador derrite el hielo, el filtro lo limpia y el tanque lo guarda.</p>
    <p>Cada sol la planta te dará 💧${c.aguaPorSol}, pero gastará 🔋${c.bateriaPorSol} de batería. Puedes apagarla si necesitas energía.</p>
    <p class="dato">🚀 En la vida real: la sonda Phoenix de la NASA encontró hielo de agua en Marte, y también percloratos, unas sales que habría que filtrar antes de beber esa agua.</p>`,
    [{ texto: '¡A ver el lago!' }]);
  rego('🔥 ¡El hielo del lago se está derritiendo! Ahora puedes meterte al agua... y la base recibe agua cada sol.');
}

// Planta ya instalada: estado y botón para encenderla o apagarla.
async function ventanaPlanta(j) {
  const s = j.s, c = j.datos.config.plantaAgua;
  while (true) {
    const v = await abrir('🚰 Planta de agua', fila('Estado', s.plantaOff ? 'Apagada' : 'Funcionando ✅', s.plantaOff ? 'mal' : 'ok')
      + fila('Agua cada sol', s.plantaOff ? '—' : `💧+${c.aguaPorSol}`) + fila('Batería cada sol', s.plantaOff ? '—' : `🔋-${c.bateriaPorSol}`)
      + fila('Lago', s.lagoCongelado ? 'Congelado 🧊 (noche fría)' : 'Líquido 💧')
      + '<p class="dato">💡 El transformador usa electricidad para derretir el hielo. Si te falta energía, apaga la planta: ahorras batería, pero no sacas agua del lago.</p>',
      [{ texto: s.plantaOff ? '⚡ Encender la planta' : '🔌 Apagar la planta', valor: 'alternar' }, { texto: 'Cerrar', valor: 'cerrar', clase: 'sec' }]);
    if (v !== 'alternar') return;
    s.plantaOff = !s.plantaOff;
    sfx('click');
    rego(s.plantaOff ? '🔌 Apagaste la planta de agua: ahorras batería, pero hoy no saca agua.' : '⚡ La planta de agua vuelve a funcionar.');
  }
}
