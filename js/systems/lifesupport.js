import { fmt } from '../util.js';

// Oxígeno (MOXIE, filtro de CO₂, calefacción), agua (reciclador) y combustible.
export function soporteVital(s, c, r, log) {
  s.filtro = Math.max(0, s.filtro - c.filtro.desgastePorSol);
  let o2 = -c.consumo.o2;
  if (r.soporte < 1) {
    o2 -= Math.round((1 - r.soporte) * 6);
    log.push('🥶 Faltó energía al soporte vital: hizo frío y el aire se renovó menos.');
  }
  if (s.filtro < c.filtro.umbral) {
    o2 -= 4;
    log.push('😮‍💨 El filtro de CO₂ está saturado: cámbialo en el Hábitat.');
  }

  const moxie = c.moxie.o2PorSol * r.moxie;
  let aComb = s.cohete.tanques ? moxie * s.moxieACombustible / 100 : 0;
  const aguaComb = aComb * c.moxie.aguaPorCombustible;
  if (aComb > 0 && s.agua < aguaComb) {
    log.push('⛽ No había agua suficiente para fabricar combustible: todo el O₂ fue para respirar.');
    aComb = 0;
  } else if (aComb > 0) {
    s.agua -= aguaComb;
    s.combustible += aComb;
  }
  o2 += moxie - aComb;
  s.o2 += o2;

  // El reciclador funciona con energía del soporte vital: con menos energía recupera menos agua.
  const recicla = s.purificadorOff ? 0 : s.reciclador * Math.min(1, r.soporte);
  if (!s.purificadorOff && r.soporte < 1) log.push('💧 Faltó energía al soporte vital: el reciclador recuperó menos agua.');
  const agua = c.consumo.agua * (1 - recicla);
  s.agua -= agua;
  log.push(`🫁 Oxígeno ${fmt(o2)} · MOXIE produjo ${Math.round(moxie)}${aComb ? ` (${Math.round(aComb)} al combustible)` : ''}.`);
  log.push(s.purificadorOff
    ? `💧 Agua ${fmt(-agua - aguaComb)} · el purificador estuvo apagado: hoy no se recicló agua.`
    : `💧 Agua ${fmt(-agua - aguaComb)} · el reciclador recuperó el ${Math.round(recicla * 100)}%.`);
  s.purificadorOff = false;
  plantaAgua(s, c, log);
}

// Planta de agua del lago: el transformador derrite hielo y el filtro lo limpia. Da agua, pero gasta batería.
function plantaAgua(s, c, log) {
  const p = c.plantaAgua;
  if (!p || !s.plantaAgua || s.plantaOff) return;
  if (s.bateria < p.bateriaPorSol) { log.push('🧊 La planta de agua no tuvo batería suficiente: hoy no sacó agua del lago.'); return; }
  s.bateria -= p.bateriaPorSol;
  s.agua += p.aguaPorSol;
  log.push(`🚰 La planta de agua sacó 💧${p.aguaPorSol} del lago y gastó 🔋${p.bateriaPorSol}.`);
}
