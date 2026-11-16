// Idiomas: español (original) e inglés. Los textos del código se escriben en español y se traducen al mostrarse
// con tr() usando el diccionario de i18n-en.js (frases exactas, la más larga primero). Los datos (cartas, misiones,
// ayudas, fuentes...) tienen su propia versión en data/en/.
import EN from './i18n-en.js';

export const idioma = (() => {
  try {
    const a = JSON.parse(localStorage.getItem('beyond-survival-ajustes'));
    if (a?.idioma) return a.idioma;
  } catch { /* sin almacenamiento */ }
  return 'en'; // idioma por defecto: inglés (se puede cambiar en Configuración o con el botón 🌐)
})();

let regex = null;
function compilar() {
  const escapar = k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const borde = /[\p{L}\p{N}]/u;
  const partes = Object.keys(EN).sort((a, b) => b.length - a.length).map(k =>
    `${borde.test(k[0]) ? '(?<![\\p{L}\\p{N}])' : ''}${escapar(k)}${borde.test(k[k.length - 1]) ? '(?![\\p{L}\\p{N}])' : ''}`);
  regex = new RegExp(partes.join('|'), 'gu');
}

// Traduce un texto (o HTML) al idioma elegido. En español lo devuelve igual.
// En HTML solo se traduce el texto entre etiquetas (y los title=""), nunca los atributos que el código usa.
export function tr(texto) {
  if (idioma !== 'en' || texto == null || texto === '') return texto;
  if (!regex) compilar();
  const t = String(texto), cambiar = s => s.replace(regex, m => EN[m] ?? m);
  if (!t.includes('<')) return cambiar(t);
  return t.split(/(<[^>]*>)/).map(p => (p.startsWith('<') ? p.replace(/title="([^"]*)"/g, (_, v) => `title="${cambiar(v)}"`) : cambiar(p))).join('');
}

// Traduce el HTML fijo de la página (textos y títulos) al cargar.
export function traducirPagina() {
  document.documentElement.lang = idioma;
  if (idioma !== 'en') return;
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) if (n.nodeValue.trim()) n.nodeValue = tr(n.nodeValue);
  document.querySelectorAll('[title]').forEach(e => { e.title = tr(e.title); });
}

// Traduce sola cualquier parte de la página que el código cambie después (HUD, REGO, ventanas...).
// Solo cambia el texto mostrado; el código sigue trabajando con los textos en español.
export function vigilarPagina() {
  if (idioma !== 'en') return;
  const nodo = n => {
    if (n.nodeType === Node.TEXT_NODE) {
      if (n.nodeValue.trim()) { const t = tr(n.nodeValue); if (t !== n.nodeValue) n.nodeValue = t; }
      return;
    }
    if (n.nodeType !== Node.ELEMENT_NODE || n.tagName === 'SCRIPT' || n.tagName === 'STYLE') return;
    if (n.title) { const t = tr(n.title); if (t !== n.title) n.title = t; }
    const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT);
    for (let x = w.nextNode(); x; x = w.nextNode()) nodo(x);
    n.querySelectorAll('[title]').forEach(e => { const t = tr(e.title); if (t !== e.title) e.title = t; });
  };
  new MutationObserver(cambios => {
    for (const c of cambios) {
      if (c.type === 'characterData') nodo(c.target);
      else if (c.type === 'attributes') nodo(c.target);
      else c.addedNodes.forEach(nodo);
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['title'] });
}

// Guarda el idioma elegido y recarga la página para aplicarlo.
export function cambiarIdioma(nuevo) {
  try {
    const a = JSON.parse(localStorage.getItem('beyond-survival-ajustes')) || {};
    localStorage.setItem('beyond-survival-ajustes', JSON.stringify({ ...a, idioma: nuevo }));
  } catch { /* sin almacenamiento: no se puede recordar */ }
  location.reload();
}

// Carpeta de datos traducidos.
export const carpetaDatos = idioma === 'en' ? 'data/en/' : 'data/';
