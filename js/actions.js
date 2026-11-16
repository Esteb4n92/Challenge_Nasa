import { puede, pagar, limitar } from './util.js';

const cultivo = (d, id) => d.crops.cultivos.find(c => c.id === id);
const parte = (d, id) => d.rocket.partes.find(p => p.id === id);
const lista = (s, d, i) => { const p = s.parcelas[i]; return !!p && !p.hongo && p.dias >= cultivo(d, p.id).dias; };

// ok() devuelve true o el motivo por el que no se puede (se muestra al niño).
export const ACCIONES = {
  instalarPanel: {
    ap: 0,
    ok: s => s.panel ? 'Ya está instalado' : s.panelArmado || 'Primero arma el panel en el Taller',
    run(s) {
      s.panel = true; s.etapa = 'antena'; // sigue la Misión 2: Despertar la Voz
      s.bateria = Math.max(s.bateria, 50); // el panel recarga la batería al 50%
      return '☀️ ¡Panel solar colocado! La batería subió al 50% y la emergencia terminó. Dato real: los rovers Spirit y Opportunity funcionaban con paneles solares.';
    },
  },
  construirSala: {
    ap: 1,
    ok: (s, d) => s.sala ? 'Ya está construida' : puede(s, d.config.sala.costo) || 'Te faltan materiales',
    run(s, d) {
      pagar(s, d.config.sala.costo);
      s.sala = true;
      return '🏗️ ¡Construiste la sala presurizada! Dentro puedes estar sin gastar el aire del traje, y se recarga.';
    },
  },
  filtro: {
    ap: 1,
    ok: s => s.filtro >= 100 ? 'El filtro ya está nuevo' : (s.repuestosFiltro > 0 || s.metal > 0) || 'Necesitas 🔩1',
    run(s) { s.repuestosFiltro > 0 ? s.repuestosFiltro-- : s.metal--; s.filtro = 100; return '😮‍💨 Filtro de CO₂ nuevo. ¡El aire está limpio!'; },
  },
  reciclador: {
    ap: 1,
    ok: (s, d) => s.reciclador >= d.config.reciclador.max ? 'Ya está al máximo' : puede(s, { metal: 2, chips: 1 }) || 'Necesitas 🔩2 💾1',
    run(s, d) {
      pagar(s, { metal: 2, chips: 1 });
      s.reciclador = Math.min(d.config.reciclador.max, s.reciclador + d.config.reciclador.mejora);
      return `♻️ Reciclador mejorado: ahora recupera el ${Math.round(s.reciclador * 100)}% del agua.`;
    },
  },
  muros: {
    ap: 1,
    ok: s => s.refugio ? 'Ya están llenos' : s.agua >= 20 || 'Necesitas 💧20',
    run(s) { s.agua -= 20; s.refugio = true; return '🛡️ Llenaste los muros del refugio con agua. Te protegerán de la radiación... pero esa agua no se puede beber.'; },
  },
  vaciar: {
    ap: 1,
    ok: s => s.refugio || 'Los muros están vacíos',
    run(s) { s.agua += 20; s.refugio = false; return '💧 Recuperaste 20 de agua de los muros. Ahora el refugio no te protege.'; },
  },
  limpiar: {
    ap: 1,
    ok: s => s.polvo > 0.01 || 'Los paneles ya están limpios',
    run(s) { s.polvo = 0; return '🧹 Paneles limpios: producirán al máximo.'; },
  },
  plantar: {
    ap: 1,
    ok: s => !s.parcelas.includes(null) ? 'No hay parcelas libres' : s.agua >= 3 || 'Necesitas 💧3',
    run(s, d, id) {
      const c = cultivo(d, id);
      s.parcelas[s.parcelas.indexOf(null)] = { id, dias: 0, hongo: false };
      s.agua -= 3;
      return `🌱 Plantaste ${c.nombre}. Estará lista en ${c.dias} soles si el invernadero tiene energía.`;
    },
  },
  cosechar: {
    ap: 1,
    ok: (s, d, i) => lista(s, d, i) || 'Todavía no está lista',
    run(s, d, i) { const c = cultivo(d, s.parcelas[i].id); s.comida += c.comida; s.parcelas[i] = null; return `${c.icono} Cosechaste ${c.nombre}: comida +${c.comida}.`; },
  },
  quitarHongo: {
    ap: 1,
    ok: (s, d, i) => !!s.parcelas[i]?.hongo || 'No hay hongos',
    run(s, d, i) { s.parcelas[i] = null; return '🍄 Quitaste la planta con hongos. Dale energía al invernadero para que ventile.'; },
  },
  reparar: {
    ap: 1,
    ok(s, d, id) {
      const p = parte(d, id);
      if (s.cohete[id]) return 'Ya está reparada';
      if (p.requierePlanos && !s.planos) return 'Pide los planos a la Tierra (Antena)';
      return puede(s, p.costo) || 'Te faltan materiales';
    },
    run(s, d, id) { const p = parte(d, id); pagar(s, p.costo); s.cohete[id] = true; return `🔧 ¡Reparaste: ${p.nombre}! ${p.desbloquea}.`; },
  },
  mensaje: {
    ap: 1,
    ok(s, d, tipo) {
      if (!s.cohete.antena) return 'La antena está rota';
      const listo = tipo === 'planos' ? s.planos : s.pronostico;
      return (listo || s.mensajes.some(m => m.tipo === tipo)) ? 'Ya lo pediste' : true;
    },
    run(s, d, tipo) {
      s.mensajes.push({ tipo, llegaSol: s.sol + 1 });
      return '📡 Mensaje enviado. La señal tarda de 3 a 22 minutos en cruzar entre Marte y la Tierra, y Control de Misión necesita tiempo para responder: la respuesta llegará mañana.';
    },
  },
  despegar: {
    ap: 0,
    ok: (s, d) => !Object.values(s.cohete).every(Boolean) ? 'Faltan partes por reparar'
      : s.combustible >= d.config.combustibleMeta || `Necesitas ⛽${d.config.combustibleMeta}`,
    run(s) { s.fin = 'despegue'; return '🚀 ¡Despegue!'; },
  },
};

// Edificios bloqueados hasta cumplir un objetivo (devuelve cómo desbloquearlo, o null).
export function bloqueo(id, s) {
  if (['habitat', 'moxie', 'rover', 'antena'].includes(id) && !s.panel) return 'Instala primero el panel solar para tener energía.';
  if (['habitat', 'moxie', 'rover'].includes(id) && s.etapa === 'antena') return 'Completa la Misión 2: repara y enciende la Antena para hablar con la Tierra.';
  if (id === 'planta' && s.etapa) return 'Completa primero las Misiones 1, 2 y 3. Mientras tanto, el lago sigue congelado.';
  if (id === 'invernadero' && !s.sala) return 'Construye la sala presurizada en el Hábitat para desbloquear el invernadero.';
  return null;
}

export function motivoNo(s, d, id, args = []) {
  const a = ACCIONES[id];
  if (s.fin) return 'La misión terminó';
  if (s.ap < a.ap) return 'No te quedan acciones hoy';
  const r = a.ok(s, d, ...args);
  return r === true ? null : (r || 'No disponible');
}

export function hacer(s, d, id, args = []) {
  const motivo = motivoNo(s, d, id, args);
  if (motivo) return motivo;
  s.ap -= ACCIONES[id].ap;
  const msg = ACCIONES[id].run(s, d, ...args);
  limitar(s);
  return msg;
}
