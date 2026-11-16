// Cómo conseguir cada recurso AHORA, según lo que el jugador ya desbloqueó.
// Devuelve una lista ordenada (la primera es la más útil): el HUD muestra la primera y la ayuda, todas.
import { bloqueo, motivoNo } from '../actions.js';

const libre = (id, s) => !bloqueo(id, s);

export function comoConseguir(k, s, d) {
  const c = d.config, t = [];
  const listas = s.parcelas.some((p, i) => p && !motivoNo(s, d, 'cosechar', [i]));
  switch (k) {
    case 'bateria':
      if (s.etapa === 'emergencia') return ['🛠️ Junta silicio, cobre y aluminio y arma el panel solar en el Taller.'];
      if (s.polvo >= 0.3) t.push('🧹 Limpia los paneles solares: con polvo producen menos.');
      if (s.plantaAgua && !s.plantaOff) t.push('🔌 Apaga la Planta de agua para ahorrar batería.');
      if (!s.etapa) t.push('⚙️ En el Centro de energía, baja la energía del invernadero o de MOXIE.');
      if (s.etapa === 'antena' || s.etapa === 'ciclo') t.push('📡 Apaga la antena cuando no la necesites.');
      if (s.cohete.antena && !s.cohete.electrico && !s.etapa) t.push('🔧 Repara el sistema eléctrico de la nave: da +4 de energía cada sol.');
      t.push('😴 Duerme: los paneles cargan la batería cada sol.');
      break;
    case 'agua':
      if (s.etapa === 'ciclo') return ['💧 Enciende el purificador (usa batería).'];
      if (s.plantaAgua && s.plantaOff) t.push('⚡ Enciende la Planta de agua junto al lago.');
      if (!s.plantaAgua && libre('planta', s)) t.push('🚰 Repara la Planta de agua junto al lago: da agua cada sol.');
      if (s.refugio) t.push('💧 Vacía los muros de agua del Hábitat (+20).');
      if (libre('rover', s)) t.push('🚙 Sal con el Rover a la misión «Hielo del cráter».');
      if (libre('habitat', s) && s.reciclador < c.reciclador.max) t.push('♻️ Mejora el reciclador de agua en el Hábitat.');
      if (!t.length) t.push('🔓 Completa las primeras misiones para desbloquear formas de conseguir agua.');
      break;
    case 'comida':
      if (listas) t.push('🌾 ¡Hay plantas listas! Cosecha en el Invernadero.');
      if (!s.sala && !s.etapa) t.push('🏗️ Construye la sala presurizada en el Hábitat: así se abre el Invernadero.');
      if (s.sala && s.parcelas.includes(null)) t.push('🌱 Siembra en el Invernadero (el rábano da más comida).');
      if (s.sala && s.parcelas.some(p => p && !p.hongo)) t.push('⏳ Tus plantas crecen: dale energía al invernadero en el Centro de energía.');
      if (s.parcelas.some(p => p?.hongo)) t.push('🍄 Quita las plantas con hongos y vuelve a sembrar.');
      if (!t.length) t.push('🔓 Completa las primeras misiones: luego podrás cultivar en el Invernadero.');
      break;
    case 'o2':
      if (s.filtro < c.filtro.umbral + 10 && libre('habitat', s)) t.push('😮‍💨 Cambia el filtro de CO₂ en el Hábitat.');
      if (s.etapa === 'ciclo') t.push('🫧 Enciende el generador de oxígeno (usa agua y batería).');
      if (s.moxieACombustible > 0) t.push('⛽ En MOXIE, manda menos oxígeno al combustible.');
      if (!s.etapa) t.push('⚙️ Dale más energía a MOXIE en el Centro de energía.');
      if (s.sala) t.push('🌱 Las plantas del invernadero también producen un poco de oxígeno.');
      t.push('🏠 Recarga el traje solo cuando haga falta: usa oxígeno de la base.');
      break;
    case 'dosis':
      if (!s.refugio && libre('habitat', s)) t.push('🛡️ Llena los muros de agua del Hábitat antes de las tormentas solares.');
      if (!s.regolito && !s.etapa) t.push('🪨 En la próxima alerta solar, cubre la base con regolito.');
      t.push('🏠 Sal solo cuando haga falta: afuera la radiación sube.');
      break;
  }
  return t;
}

// ¿La barra está en zona de riesgo? (los recursos bajos; la radiación alta)
export const enRiesgo = (k, v) => (k === 'dosis' ? v >= 30 : v < 35);
