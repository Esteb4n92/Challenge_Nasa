import { sfx } from '../audio.js';

const $ = id => document.getElementById(id);

export const modalAbierto = () => !$('modal').classList.contains('oculto');

// Acción de cerrar de la ventana abierta (null si es una decisión obligatoria).
let cerrarActual = null;

// Botón ✕ en la esquina, Esc y clic fuera del cuadro. Se crean una sola vez.
function prepararCierre() {
  if ($('modal-x')) return;
  const x = document.createElement('button');
  x.id = 'modal-x';
  x.className = 'sec';
  x.type = 'button';
  x.title = 'Cerrar (Esc)';
  x.setAttribute('aria-label', 'Cerrar');
  x.textContent = '✕';
  x.onclick = () => cerrarActual?.();
  $('modal-caja').prepend(x);
  $('modal').addEventListener('click', e => { if (e.target.id === 'modal') cerrarActual?.(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modalAbierto() && cerrarActual) { e.stopImmediatePropagation(); cerrarActual(); }
  }, true);
}

// Un botón cierra la ventana si es «Cerrar», tiene valor 'cerrar' o está marcado con `cierra: true`.
const esCierre = b => b.cierra || b.valor === 'cerrar' || b.texto === 'Cerrar';

// Muestra una ventana y resuelve con el `valor` del botón pulsado (o su texto).
// botones: [{ texto, valor?, clase?, deshabilitado?, cierra? }]
export function abrir(titulo, html, botones = [{ texto: 'OK' }]) {
  prepararCierre();
  $('modal-titulo').textContent = titulo;
  $('modal-cuerpo').innerHTML = html;
  const cont = $('modal-botones');
  cont.innerHTML = '';
  $('modal-caja').scrollTop = 0;
  return new Promise(resolver => {
    const elegir = b => { cerrarActual = null; $('modal').classList.add('oculto'); resolver(b.valor ?? b.texto); };
    for (const b of botones) {
      const el = document.createElement('button');
      el.textContent = b.texto;
      if (b.clase) el.className = b.clase;
      el.disabled = !!b.deshabilitado;
      el.onclick = () => { sfx('click'); elegir(b); };
      cont.appendChild(el);
    }
    const cierre = botones.find(esCierre);
    cerrarActual = cierre ? () => { sfx('click'); elegir(cierre); } : null;
    $('modal-x').hidden = !cierre;
    $('modal').classList.remove('oculto');
    sfx('abrir');
  });
}
