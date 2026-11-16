import { carpetaDatos } from './i18n.js';

const ARCHIVOS = ['config', 'missions', 'rocket', 'cards', 'crops', 'facts', 'donki', 'ayuda'];
// Archivos con textos para el jugador: tienen versión traducida en data/en/. El resto (números) es común.
const TRADUCIBLES = new Set(['missions', 'rocket', 'cards', 'crops', 'facts', 'ayuda']);

async function leerJSON(ruta) {
  const r = await fetch(ruta);
  if (!r.ok) throw new Error(`${r.status} ${ruta}`);
  return r.json();
}

export async function cargarDatos() {
  const d = {};
  await Promise.all(ARCHIVOS.map(async n => {
    const carpeta = TRADUCIBLES.has(n) ? carpetaDatos : 'data/';
    try { d[n] = await leerJSON(`${carpeta}${n}.json`); }
    catch (e) {
      // Si falta la traducción, usa el original en español.
      try { d[n] = await leerJSON(`data/${n}.json`); console.warn(`Sin traducción para ${n}.json`, e); }
      catch (e2) { console.error(`No se pudo cargar data/${n}.json`, e2); d[n] = null; }
    }
  }));
  return d;
}
