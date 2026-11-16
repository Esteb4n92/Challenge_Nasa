export const fmt = v => (v >= 0 ? '+' : '') + Math.round(v);

export const ICONOS = {
  o2: '🫁', agua: '💧', comida: '🥬', bateria: '🔋', dosis: '☢️',
  metal: '🔩', cables: '🔌', chips: '💾', combustible: '⛽', polvo: '🌫️',
};

// Suma deltas numéricos al estado y asigna los valores de `fijar`.
export function aplicarEfectos(s, efectos = {}, fijar = {}) {
  for (const [k, v] of Object.entries(efectos)) if (typeof s[k] === 'number') s[k] += v;
  Object.assign(s, fijar);
}

export const puede = (s, costo = {}) => Object.entries(costo).every(([k, v]) => (s[k] ?? 0) >= v);
export function pagar(s, costo = {}) { for (const [k, v] of Object.entries(costo)) s[k] -= v; }

// Texto corto tipo "(🔩+3 🫁-5)" para que el niño vea el costo de cada opción.
export function resumenEfectos(ef = {}) {
  const p = Object.entries(ef).filter(([k]) => ICONOS[k])
    .map(([k, v]) => `${ICONOS[k]}${fmt(k === 'polvo' ? v * 100 : v)}${k === 'polvo' ? '%' : ''}`);
  return p.length ? `(${p.join(' ')})` : '';
}

export function limitar(s) {
  for (const k of ['o2', 'agua', 'comida', 'bateria', 'dosis']) s[k] = Math.max(0, Math.min(100, s[k]));
  for (const k of ['metal', 'cables', 'chips', 'combustible']) s[k] = Math.max(0, s[k]);
  s.polvo = Math.max(0, Math.min(0.8, s.polvo));
}
