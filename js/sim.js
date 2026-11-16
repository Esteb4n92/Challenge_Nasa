import { energia } from './systems/energy.js';
import { soporteVital } from './systems/lifesupport.js';
import { alimentos } from './systems/food.js';
import { radiacion, avisosSolares } from './systems/radiation.js';
import { comunicaciones } from './systems/comms.js';
import { limitar, ICONOS } from './util.js';
import { cuerpo, avisosCuerpo } from './systems/cuerpo.js';

// Avanza un sol completo. Muta `s` y devuelve los textos del resumen.
export function avanzarSol(s, d, rng = Math.random) {
  const c = d.config;
  const log = [];
  const r = energia(s, c, log);
  soporteVital(s, c, r, log);
  alimentos(s, d, r, rng, log);
  radiacion(s, c, log);
  s.sol++;
  s.ap = c.accionesPorSol;
  s.traje = c.traje.max; // dormiste en el refugio: el traje amanece lleno
  s.hora = 0; // nuevo amanecer
  // El lago casi siempre está líquido; tras una noche helada (o a veces) amanece congelado.
  s.lagoCongelado = s.nocheFria || rng() < c.lago.probCongelado;
  s.nocheFria = false;
  comunicaciones(s, log);
  emergencias(s, c, log);
  limitar(s);
  // Mucha radiación agota al astronauta: amanece con una acción menos.
  const menos = cuerpo(s, c).apMenos;
  if (menos) { s.ap = Math.max(1, s.ap - menos); log.push('☢️ Tu dosis de radiación es muy alta: hoy estás agotado y tienes 1 acción menos.'); }
  if (s.sol > c.solesVentana && !s.fin) s.fin = 'ventana';
  return log;
}

function emergencias(s, c, log) {
  for (const [k, nombre] of [['o2', 'oxígeno'], ['agua', 'agua'], ['comida', 'comida']]) {
    if (s[k] > 0) continue;
    s[k] = c.emergencia.reponer;
    s.emergencias++;
    s.sol++;
    log.push(`🚨 ¡Te quedaste sin ${nombre}! REGO activó el modo emergencia con las reservas de la nave. Perdiste un sol recuperándote.`);
  }
}

// Consejos de REGO para el sol actual, el más urgente primero.
export function alertas(s, d) {
  const c = d.config;
  const a = [...avisosSolares(s), ...avisosCuerpo(s, c)];
  if (s.o2 < 25) a.push('🫁 ¡Queda poco oxígeno! Dale más energía a MOXIE en el Centro de energía.');
  if (s.agua < 20) a.push('💧 Queda poca agua. Hay hielo en el cráter: ve con el Rover.');
  if (!s.etapa && !s.plantaAgua && s.agua < 60) a.push('🧊 El lago está congelado. Repara la 🚰 Planta de agua junto al cráter para sacar agua de él.');
  if (s.comida < 20) a.push('🥬 Se acaba la comida. Planta o cosecha en el Invernadero.');
  if (s.filtro < c.filtro.umbral + 10) a.push('😮‍💨 El filtro de CO₂ está casi saturado. Cámbialo en el Hábitat.');
  if (s.polvo >= 0.3) a.push(`🌫️ Los paneles tienen ${Math.round(s.polvo * 100)}% de polvo. Límpialos.`);
  return a;
}

// Guía de objetivo para cuando no hay alertas: qué reparar y qué falta.
export function siguientePaso(s, d) {
  if (s.etapa === 'emergencia') {
    const r = s.recogidos || {}, v = k => (r[k] ? '✅' : '⬜');
    if (s.panelArmado) return '🚨 Misión 1: ¡Lleva el panel a la zona de Paneles y colócalo antes de que la batería llegue a 0%!';
    if (r.silicio && r.cobre && r.aluminio) return '🚨 Misión 1: ¡Tienes los 3 materiales! Ve al 🛠️ Taller y arma el panel solar.';
    return `🚨 Misión 1 · Chatarra y Arena Marciana. Recolecta: ${v('silicio')} 🪨 Silicio · ${v('cobre')} 🔌 Cobre · ${v('aluminio')} 🔩 Aluminio. Brillan cerca de la nave.`;
  }
  if (s.etapa === 'ciclo') return '♻️ Misión 3 · El Ciclo de la Vida: enciende el purificador y el generador de oxígeno solo cuando haga falta. Mantén agua y aire sobre el 30%.';
  if (s.etapa === 'antena') {
    const L = s.llamada;
    if (!s.cohete.antena) return '📡 Misión 2 · Despertar la Voz: toca la Antena y conecta sus cables de cobre para repararla.';
    if (L?.respondida) return '📡 ¡La NASA respondió! Ahora apaga la antena para ahorrar energía.';
    return '📡 Llamada en curso: apaga la antena mientras el mensaje viaja y enciéndela a tiempo para escuchar la respuesta.';
  }
  if (!s.sala) {
    const faltan = Object.entries(d.config.sala.costo).filter(([k, v]) => s[k] < v).map(([k, v]) => `${ICONOS[k]}${v - s[k]}`).join(' ');
    return faltan
      ? `💧 Etapa 4 · Saneamiento de Agua y Oxígeno: construye la sala presurizada en el Hábitat. Te faltan ${faltan}: búscalos con el Rover.`
      : '💧 Etapa 4: ¡Ya puedes construir la sala presurizada en el Hábitat!';
  }
  const falta = d.rocket.partes.find(p => !s.cohete[p.id]);
  if (falta) {
    if (falta.requierePlanos && !s.planos) {
      return s.mensajes.some(m => m.tipo === 'planos') ? '🧭 Esperando los planos de la Tierra: llegan mañana.' : '🧭 Pide los planos de navegación en la Antena.';
    }
    const faltan = Object.entries(falta.costo).filter(([k, v]) => s[k] < v).map(([k, v]) => `${ICONOS[k]}${v - s[k]}`).join(' ');
    return faltan
      ? `🔧 Próxima reparación: ${falta.icono} ${falta.nombre}. Te faltan ${faltan}: búscalos con el Rover.`
      : `🔧 ¡Ya puedes reparar ${falta.icono} ${falta.nombre} en la nave!`;
  }
  if (s.combustible < d.config.combustibleMeta) {
    return `⛽ ¡Nave reparada! En MOXIE, manda oxígeno al combustible (${Math.round(s.combustible)}/${d.config.combustibleMeta}).`;
  }
  return '🚀 ¡Todo listo! Ve a la nave y despega.';
}
