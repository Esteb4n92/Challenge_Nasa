// Consumo de comida y crecimiento del invernadero.
export function alimentos(s, d, r, rng, log) {
  s.comida -= d.config.consumo.comida;
  const crece = r.invernadero >= 0.5;
  const plantas = s.parcelas.filter(p => p && !p.hongo);
  if (plantas.length && !crece) { log.push('🥀 El invernadero casi no tuvo energía: las plantas no crecieron.'); return; }
  const riego = d.config.cultivo?.aguaPorPlanta ?? 1; // sin agua, las plantas no crecen
  let secas = 0;
  s.parcelas.forEach((p, i) => {
    if (!p || p.hongo) return;
    if (s.agua < riego) { secas++; return; }
    s.agua -= riego;
    s.o2 += 1; // las plantas también producen un poco de oxígeno
    p.dias++;
    if (r.invernadero < 1 && rng() < 0.2) {
      p.hongo = true;
      log.push(`🍄 ¡Hongos en la parcela ${i + 1}! Sin energía suficiente para ventilar, sube la humedad.`);
    }
  });
  if (secas) log.push('🥀 No hubo agua para regar: algunas plantas no crecieron.');
  if (plantas.length > secas) log.push(`🌱 Tus ${plantas.length - secas} planta(s) crecieron (y usaron agua).`);
}
