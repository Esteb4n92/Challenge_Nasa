// Misión 2 · Despertar la Voz: puzzle de cables, encender la antena y la llamada con retardo de comunicación.
// Tiempo acelerado: 1 segundo real = 1 minuto simulado (20 min ida + 20 min vuelta = 40 s).
import { abrir, modalAbierto } from './modal.js';
import { render, rego } from './hud.js';
import { guardarPunto, colapso } from './menu.js';
import { sfx } from '../audio.js';

const $ = id => document.getElementById(id);
const CABLES = [
  { id: 'rojo', color: '#d23c2c', nombre: 'Rojo' },
  { id: 'azul', color: '#3b7fe0', nombre: 'Azul' },
  { id: 'amarillo', color: '#f2c14e', nombre: 'Amarillo' },
  { id: 'verde', color: '#4e9a34', nombre: 'Verde' },
];

// Puzzle: conectar cada cable de cobre con el borne de su color antes de 2 minutos.
export async function puzzleAntena(j) {
  const s = j.s, c = j.datos.config.antena;
  const derecha = [...CABLES].sort(() => Math.random() - 0.5);
  const html = `<p>Los cables de cobre se soltaron en el choque. Toca un cable de la izquierda y luego el borne del <b>mismo color</b> a la derecha.</p>
    <p class="reloj-puzzle">⏱️ <b id="pz-reloj">2:00</b></p>
    <div class="cables">
      <div>${CABLES.map(k => `<button class="cable" data-izq="${k.id}" style="--c:${k.color}">🔌 ${k.nombre}</button>`).join('')}</div>
      <div>${derecha.map(k => `<button class="borne" data-der="${k.id}" style="--c:${k.color}">⚡ ${k.nombre}</button>`).join('')}</div>
    </div>
    <p id="pz-dato" class="dato">💡 El cobre lleva la electricidad del panel solar a la antena.</p>`;
  let restante = c.puzzleSeg, agotado = false;
  const respuesta = abrir('📡 Antena · Conectar cables', html,
    [{ texto: '📡 Encender antena', valor: 'ok', deshabilitado: true }, { texto: 'Cerrar', valor: 'cerrar', clase: 'sec' }]);

  const cuerpo = $('modal-cuerpo'), hechos = new Set();
  let elegido = null;
  cuerpo.querySelectorAll('.cable').forEach(b => b.onclick = () => {
    if (hechos.has(b.dataset.izq)) return;
    cuerpo.querySelectorAll('.cable').forEach(x => x.classList.remove('elegido'));
    b.classList.add('elegido'); elegido = b.dataset.izq; sfx('click');
  });
  cuerpo.querySelectorAll('.borne').forEach(b => b.onclick = () => {
    if (!elegido || hechos.has(b.dataset.der)) return;
    const izq = cuerpo.querySelector(`.cable[data-izq="${elegido}"]`);
    if (b.dataset.der !== elegido) {
      b.classList.remove('mal'); void b.offsetWidth; b.classList.add('mal'); sfx('error');
      $('pz-dato').textContent = '⚡ ¡Chispazo! Ese borne no es del mismo color. Prueba otra vez.';
    } else {
      hechos.add(elegido); izq.classList.add('hecho'); b.classList.add('hecho'); sfx('recoger');
      $('pz-dato').textContent = `✅ Cable ${izq.textContent.replace('🔌 ', '').toLowerCase()} conectado (${hechos.size}/4).`;
      if (hechos.size === CABLES.length) {
        document.querySelector('#modal-botones button').disabled = false;
        $('pz-dato').textContent = '🎉 ¡Todos los cables conectados! Enciende la antena.';
        sfx('exito');
      }
    }
    izq.classList.remove('elegido'); elegido = null;
  });
  const reloj = setInterval(() => {
    if (modalAbierto() && !document.getElementById('pz-reloj')) return;
    restante--;
    const el = $('pz-reloj');
    if (el) el.textContent = `${Math.floor(restante / 60)}:${String(restante % 60).padStart(2, '0')}`;
    if (restante <= 0) { agotado = true; [...document.querySelectorAll('#modal-botones button')].pop()?.click(); }
  }, 1000);
  const v = await respuesta;
  clearInterval(reloj);

  if (agotado) {
    sfx('error');
    await abrir('⏱️ ¡Se acabó el tiempo!', '<p>La señal se perdió antes de conectar todos los cables. Vuelve a tocar la Antena para intentarlo otra vez.</p>', [{ texto: 'Entendido' }]);
    return;
  }
  if (v !== 'ok') return;

  // Antena reparada y encendida: consume mucha energía.
  s.cohete.antena = true;
  s.antenaOn = true;
  s.bateria = Math.max(5, s.bateria - c.costoEncender);
  s.llamada = { t: 0, enviado: true, respondida: false };
  sfx('desbloqueo');
  render(j);
  await abrir('📡 ¡Antena encendida!', `<p class="ayuda-grande">📡⚡</p>
    <p>La antena funciona, pero <b>consume mucha energía</b>: la batería bajó a <b>${Math.round(s.bateria)}%</b>.</p>
    <p>📞 Ahora haremos una <b>llamada de prueba</b> a la NASA en la Tierra. Mira el temporizador: en Marte no existe el chat instantáneo.</p>
    <p class="dato">💡 Mientras tu mensaje viaja, la antena no hace falta. ¡Apágala para ahorrar energía y enciéndela antes de que llegue la respuesta!</p>`,
    [{ texto: '📞 Llamar a la Tierra' }]);
}

// Cada fotograma (desde la escena de la base): consumo de la antena y avance de la llamada.
export function tickLlamada(j, dt) {
  const s = j.s, L = s.llamada, c = j.datos.config.antena;
  document.body.classList.toggle('en-llamada', s.etapa === 'antena' && !!L);
  if (s.etapa !== 'antena' || !L) return;
  if (s.antenaOn) s.bateria = Math.max(0, s.bateria - c.consumoPorSegundo * dt / 1000);
  if (!L.enviado && s.antenaOn) { L.enviado = true; L.t = 0; sfx('click'); }
  if (L.enviado && !L.respondida) {
    L.t += dt / 1000;
    if (L.t >= c.retardoMin * 2) {
      if (s.antenaOn) { L.respondida = true; respuestaNASA(j); }
      else {
        L.enviado = false; L.t = 0; sfx('error');
        rego('📭 La respuesta llegó con la antena apagada y nadie la escuchó. ¡Enciéndela para volver a llamar!');
      }
    }
  }
  dibujar(j);
  if (s.bateria <= 0) colapso(j);
}

function dibujar(j) {
  const s = j.s, L = s.llamada, R = j.datos.config.antena.retardoMin, t = L.t;
  const ida = L.enviado && t < R, vuelta = L.enviado && t >= R && !L.respondida;
  const min = Math.max(0, Math.ceil(ida ? R - t : vuelta ? R * 2 - t : 0));
  $('ll-fase').textContent = L.respondida ? '✅ ¡Respuesta recibida!' : !L.enviado ? '📡 Enciende la antena para enviar el mensaje'
    : ida ? '📤 Tu mensaje viaja a la Tierra' : '📥 La respuesta viaja a Marte';
  $('ll-reloj').textContent = L.respondida || !L.enviado ? '' : `⏳ ${min} min`;
  $('ll-punto').style.left = `${L.enviado ? Math.min(100, (ida ? t / R : 2 - t / R) * 100) : 0}%`;
  $('ll-punto').textContent = ida ? '✉️' : '📨';
  $('ll-bateria').textContent = `🔋 Batería: ${Math.ceil(s.bateria)}%`;
  $('ll-bateria').classList.toggle('mal', s.bateria < 10);
  const btn = $('ll-boton');
  btn.textContent = s.antenaOn ? '🔌 Apagar antena' : '⚡ Encender antena';
  btn.classList.toggle('sec', !s.antenaOn);
  $('ll-consejo').textContent = L.respondida ? '✅ Ya tienes la respuesta: ¡apaga la antena para ahorrar energía!'
    : s.antenaOn && L.enviado && t < R * 2 - 8 ? '💡 Mientras el mensaje viaja no necesitas la antena: ¡apágala para ahorrar!'
    : !s.antenaOn && L.enviado && t >= R * 2 - 10 ? '⚠️ ¡La respuesta llega pronto! Enciende la antena para escucharla.'
    : '⏱️ Tiempo acelerado: 1 segundo = 1 minuto.';
}

export function initLlamada(j) { $('ll-boton').onclick = () => alternarAntena(j); }

export function alternarAntena(j) {
  const s = j.s;
  if (s.etapa !== 'antena' || !s.llamada || modalAbierto()) return;
  s.antenaOn = !s.antenaOn;
  sfx(s.antenaOn ? 'exito' : 'click');
  if (!s.antenaOn && s.llamada.respondida) completarMision(j);
}

async function respuestaNASA(j) {
  sfx('desbloqueo');
  await abrir('📥 Control de Misión (NASA)', `<p class="ayuda-grande">🌍📡</p>
    <p><i>"¡Te escuchamos, Starship V3! Nos alegra saber que estás bien. Te enviaremos alertas de tormentas solares."</i></p>
    <p class="dato">💡 Tu mensaje tardó <b>20 minutos</b> en llegar a la Tierra y la respuesta otros <b>20 minutos</b> en volver. Si hay una emergencia en la base, estás solo más de media hora: <b>debes tomar decisiones por tu cuenta</b>.</p>
    <p>Ahora <b>apaga la antena</b> para no gastar la batería.</p>`, [{ texto: 'Entendido' }]);
}

async function completarMision(j) {
  const s = j.s;
  s.etapa = 'ciclo'; s.antenaOn = false; s.llamada = null; // sigue la Misión 3: El Ciclo de la Vida
  s.pronostico = true; // la Tierra avisará de tormentas solares
  document.body.classList.remove('en-llamada');
  guardarPunto(j);
  render(j);
  await abrir('✅ ¡Misión 2 completada!', `<p class="lema">DESPERTAR LA VOZ</p>
    <p class="ayuda-grande">📡✨</p>
    <p>Reparaste la antena, hablaste con la Tierra y la apagaste a tiempo para cuidar la energía.</p>
    <p>Aprendiste que entre Marte y la Tierra un mensaje puede tardar <b>hasta unos 20 minutos</b> en cada sentido.</p>
    <p>🔓 <b>Siguiente: Etapa 4 · El Ciclo de la Vida (Agua y Oxígeno).</b> Hábitat, MOXIE y el Rover están desbloqueados.</p>`, [{ texto: '¡Siguiente etapa!' }]);
}
