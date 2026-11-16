export function produccion(s, c) {
  if (!s.panel) return 0; // el generador principal se destruyó: sin panel no hay energía
  const tormenta = s.tormentaPolvo > 0 ? 0.5 : 1; // la arena tapa el panel: produce la mitad
  return Math.round(c.energia.panelesMax * (1 - s.polvo) * tormenta) + (s.cohete.electrico ? c.energia.bonoNave : 0);
}

// El purificador de agua es parte del soporte vital; apagarlo ahorra 4 de energía (y ese sol no se recicla agua).
const ahorroPurificador = (s, c) => (s.purificadorOff ? Math.min(4, c.demanda.soporte * s.asignacion.soporte / 100) : 0);
export const energiaPedida = (s, c) => Object.entries(c.demanda).reduce((t, [k, v]) => t + v * s.asignacion[k] / 100, 0) - ahorroPurificador(s, c);
export const peligroCongelarse = (s, c) => produccion(s, c) + s.bateria - energiaPedida(s, c) < 1;

// Modo ahorro: apaga primero lo menos urgente (invernadero), luego parte de MOXIE y al final el soporte vital.
export function modoAhorro(s, c) {
  for (const [k, min] of [['invernadero', 0], ['moxie', 25], ['soporte', 50]]) {
    while (peligroCongelarse(s, c) && s.asignacion[k] > min) s.asignacion[k] -= 25;
  }
  return `⚡ Modo ahorro: soporte vital ${s.asignacion.soporte}%, MOXIE ${s.asignacion.moxie}%, invernadero ${s.asignacion.invernadero}%. Súbelos en el Centro de energía cuando haya más sol.`;
}

// Reparte la energía del sol según s.asignacion. Devuelve cuánto recibió cada sistema (0 a 1).
export function energia(s, c, log) {
  const prod = produccion(s, c);
  const pedido = {};
  let total = 0;
  for (const k in c.demanda) { pedido[k] = c.demanda[k] * s.asignacion[k] / 100; total += pedido[k]; }
  total -= ahorroPurificador(s, c);
  const factor = total > prod + s.bateria ? (prod + s.bateria) / total : 1;
  s.bateria = Math.min(c.energia.bateriaMax, s.bateria + prod - total * factor);
  log.push(`⚡ Los paneles produjeron ${prod}${s.tormentaPolvo > 0 ? ' (tormenta de polvo)' : ''}. Batería: ${Math.round(s.bateria)}.`);
  if (factor < 1) log.push(`🔌 No alcanzó la energía: los sistemas funcionaron al ${Math.round(factor * 100)}%.`);
  s.polvo = Math.min(0.8, s.polvo + c.energia.polvoPorSol);
  if (s.tormentaPolvo > 0) s.tormentaPolvo--;
  const r = {};
  for (const k in c.demanda) r[k] = c.demanda[k] ? pedido[k] * factor / c.demanda[k] : 0;
  return r;
}
