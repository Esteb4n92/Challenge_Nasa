// Los mensajes a la Tierra se responden con retraso (llegan al sol siguiente).
export function comunicaciones(s, log) {
  const llegan = s.mensajes.filter(m => m.llegaSol <= s.sol);
  s.mensajes = s.mensajes.filter(m => m.llegaSol > s.sol);
  for (const m of llegan) {
    if (m.tipo === 'planos') {
      s.planos = true;
      log.push('📡 Llegaron los planos de navegación desde la Tierra. ¡Ya puedes reparar la computadora!');
    }
    if (m.tipo === 'pronostico') {
      s.pronostico = true;
      log.push('📡 Control de Misión: "Te avisaremos de las tormentas solares con 2 soles de antelación".');
    }
  }
}
