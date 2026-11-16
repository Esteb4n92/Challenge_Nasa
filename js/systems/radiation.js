// Dosis acumulada: un poco cada sol y mucho más con las tormentas solares.
export function radiacion(s, c, log) {
  const rc = c.radiacion;
  s.dosis += rc.basePorSol;
  for (const e of s.eventosSolares.filter(e => e.sol === s.sol && !e.resuelto)) { // las resueltas en la alerta de día no se repiten
    const base = e.tipo === 'CME' ? rc.impactoCME : rc.impactoSEP;
    const dosis = Math.round(base * (s.refugio ? 1 - rc.refugioReduce : 1));
    s.dosis += dosis;
    const nombre = e.tipo === 'CME' ? 'Llegó la tormenta solar (CME)' : 'Lluvia de partículas solares (SEP), ¡sin aviso!';
    const origen = e.fecha ? ` Basada en un evento real del ${e.fecha.slice(0, 10)}.` : ' (evento simulado)';
    log.push(`☢️ ${nombre}: dosis +${dosis}${s.refugio ? ' (los muros de agua te protegieron)' : ''}.${origen}`);
  }
}

// Las CME se ven venir; las SEP no. Con el pronóstico de la Tierra avisan antes.
export function avisosSolares(s) {
  const antelacion = s.pronostico ? 2 : 1;
  return s.eventosSolares
    .filter(e => e.tipo === 'CME' && e.sol - s.sol >= 0 && e.sol - s.sol <= antelacion)
    .map(e => {
      const cuando = e.sol === s.sol ? 'esta noche' : `en ${e.sol - s.sol} sol(es)`;
      const consejo = s.refugio ? 'Tus muros de agua están listos.' : 'Llena los muros de agua en el Hábitat.';
      return `☢️ ¡Tormenta solar en camino! Llega ${cuando}. ${consejo}${s.pronostico ? '' : ' (Con la antena y el pronóstico de la Tierra te avisarían antes.)'}`;
    });
}
