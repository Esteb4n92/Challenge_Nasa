// Convierte eventos reales de DONKI (data/donki.json) en eventos del juego por sol.
// Simplificación: usamos tormentas registradas por la NASA y las "comprimimos" en los soles del juego.
const SIMULADOS = [
  { sol: 5, tipo: 'CME', simulado: true },
  { sol: 9, tipo: 'SEP', simulado: true },
  { sol: 12, tipo: 'CME', simulado: true },
  { sol: 16, tipo: 'SEP', simulado: true },
  { sol: 20, tipo: 'CME', simulado: true },
  { sol: 25, tipo: 'CME', simulado: true },
];

export function planificarEventos(donki, soles) {
  const ev = (donki?.eventos || []).filter(e => e.tipo === 'CME' || e.tipo === 'SEP');
  if (!ev.length || !donki.inicio) return SIMULADOS;
  const t0 = new Date(donki.inicio).getTime();
  const dias = Math.max(1, (new Date(donki.fin).getTime() - t0) / 864e5);
  return ev.map(e => {
    const f = (new Date(e.fecha).getTime() - t0) / 864e5 / dias;
    return { ...e, sol: Math.max(4, Math.min(soles, 1 + Math.round(f * (soles - 1)))) };
  });
}
