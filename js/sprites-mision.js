// Suelos de los escenarios de misión y sprites de objetos (pixel art por código).
import { lienzo, semilla } from './sprites.js';

const hex = c => { const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };

const TEMAS = {
  llanura: ['#c8703e', '#bd6535', '#d27a44', '#b35e30'],
  hielo: ['#a8482a', '#9c4226', '#b25232', '#953d22'],
};

// Zonas de hielo resbaladizo (misma fórmula para dibujar y para la física).
export function esHielo(x, y) {
  return Math.sin(x * 0.011 + 1.3) + Math.sin(y * 0.017 + x * 0.004) + Math.sin((x - y) * 0.007) > 0.9;
}

export function texturaSuelo(sc, m) {
  const { ancho: W, alto: H, tema, semilla: sem } = m.escenario, key = `suelo-${m.id}`;
  if (sc.textures.exists(key)) return key;
  const t = sc.textures.createCanvas(key, W, H), g = t.getContext(), img = g.createImageData(W, H), d = img.data, rnd = semilla(sem);
  const tonos = (TEMAS[tema] || TEMAS.llanura).map(hex), hielo = ['#dfeef7', '#cfe6f5', '#eef7ff'].map(hex), borde = hex('#9fc7e0');
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
    let c = tonos[(rnd() * 4) | 0], k = 1;
    if (tema === 'llanura') k = 1 + 0.07 * Math.sin(x * 0.06 + Math.sin(y * 0.02) * 3); // dunas
    if (tema === 'hielo' && esHielo(x, y)) c = esHielo(x + 6, y + 6) && esHielo(x - 6, y - 6) ? hielo[(rnd() * 3) | 0] : borde;
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) d.set([c[0] * k, c[1] * k, c[2] * k, 255], ((y + dy) * W + x + dx) * 4);
  }
  g.putImageData(img, 0, 0);
  const r = (c, x, y, w = 2, h = 2) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
  for (let i = 0; i < W * H / 700; i++) {
    const x = rnd() * W, y = rnd() * H;
    if (tema === 'hielo' && esHielo(x, y)) continue;
    r('#7a2e16', x, y + 1); r('#e08a4e', x, y, 1, 1);
  }
  if (tema === 'hielo') for (let i = 0; i < 60; i++) { const x = rnd() * W, y = rnd() * H; if (esHielo(x, y)) r('#9cc8e4', x, y, 5 + rnd() * 10 | 0, 1); }
  for (let x = 0; x < W; x += 2) {
    const a = 26 + 10 * Math.sin(x * 0.03 + sem) + 6 * Math.sin(x * 0.12);
    r('#8e3e1e', x, 0, 2, a - 8); r('#6e2a14', x, a - 8, 2, 8);
    const b = 20 + 8 * Math.sin(x * 0.025 + 2);
    r('#b85a30', x, H - b, 2, 2); r('#8a3a1c', x, H - b + 2, 2, b);
  }
  for (let y = 0; y < H; y += 2) {
    const a = 22 + 9 * Math.sin(y * 0.03 + sem);
    r('#8e3e1e', 0, y, a - 6, 2); r('#6e2a14', a - 6, y, 6, 2);
    r('#6e2a14', W - a, y, 6, 2); r('#8e3e1e', W - a + 6, y, a - 6, 2);
  }
  t.refresh();
  return key;
}

export function texturasObjetos(sc) {
  if (sc.textures.exists('vehiculo')) return;
  lienzo(sc, 'item-metal', 14, 10, r => { r('#a8a5ad', 1, 2, 12, 7); r('#d0cdd4', 1, 2, 12, 2); r('#6e6b74', 1, 8, 12, 1); r('#4a4552', 3, 4, 1, 1); r('#4a4552', 10, 4, 1, 1); });
  lienzo(sc, 'item-cables', 14, 11, (r, domo) => { domo(7, 6, 6, 4, ['#ff9a4a', '#e8642c', '#a8401a']); domo(7, 6, 3, 2, ['#3b3442', '#2a2530', '#1a1520']); r('#3b3442', 11, 7, 3, 1); });
  lienzo(sc, 'item-chips', 12, 12, r => { r('#2e7a3a', 2, 2, 8, 8); r('#4e9a34', 2, 2, 8, 2); r('#2a2340', 4, 4, 4, 4); for (let k = 3; k < 10; k += 2) { r('#f2c14e', k, 0, 1, 2); r('#f2c14e', k, 10, 1, 2); } });
  lienzo(sc, 'item-hielo', 14, 11, (r, domo) => { domo(7, 6, 6, 4.5, ['#ffffff', '#cfe6f5', '#8cc4e6']); r('#ffffff', 4, 3, 2, 1); });
  lienzo(sc, 'bloque-hielo', 24, 20, (r, domo) => {
    domo(12, 11, 11, 8, ['#ffffff', '#cfe6f5', '#8cc4e6']); domo(7, 13, 5, 5, ['#eef7ff', '#bfe0f3', '#8cc4e6']);
    r('#8cc4e6', 12, 6, 1, 6); r('#8cc4e6', 13, 11, 4, 1); r('#ffffff', 8, 5, 3, 1);
  });
  lienzo(sc, 'meteorito', 26, 18, (r, domo) => { domo(13, 10, 11, 7, ['#8a8a96', '#4a4652', '#2a2630']); r('#d8d8e8', 9, 6, 2, 1); r('#d8d8e8', 15, 9, 1, 1); r('#b8b8c8', 11, 12, 2, 1); });
  lienzo(sc, 'taladro', 30, 44, r => {
    for (let y = 4; y < 40; y++) { const k = (y - 4) / 36; r('#8a8790', 14 - k * 11, y, 2, 1); r('#8a8790', 14 + k * 11, y, 2, 1); }
    r('#d9a441', 9, 8, 12, 10); r('#f0c867', 9, 8, 12, 2); r('#3b3442', 12, 12, 6, 2); r('#9a96a0', 14, 18, 2, 22);
    r('#d23c2c', 13, 2, 4, 6); r('#dfeef7', 10, 38, 10, 4); r('#ffffff', 12, 38, 3, 1);
  });
  lienzo(sc, 'vehiculo', 70, 44, (r, domo) => {
    r('#2b3a8f', 6, 4, 26, 6); r('#5a74d8', 12, 4, 1, 6); r('#1a1f3d', 20, 5, 3, 4); r('#2b3a8f', 34, 2, 18, 5);
    r('#cfc9bf', 4, 12, 58, 16); r('#e8e4dc', 4, 12, 58, 3); r('#a9a39a', 4, 24, 58, 4);
    for (const [x, y, w, h] of [[10, 16, 7, 4], [30, 19, 9, 3], [48, 14, 6, 6], [22, 24, 5, 3]]) r('#9a5a32', x, y, w, h);
    r('#7a3a1a', 12, 17, 3, 2); r('#2a2340', 50, 15, 8, 5); r('#9a96a0', 56, 0, 2, 12); r('#9a96a0', 58, 0, 5, 2);
    r('#8a6a4a', 36, 6, 14, 6); r('#6a4a2a', 36, 10, 14, 2);
    for (const x of [12, 30, 54]) { domo(x, 33, 6, 6, ['#6e6b74', '#4a4552', '#2a2530']); r('#9a96a0', x - 1, 32, 2, 2); }
    r('#c97a55', 0, 38, 70, 4); r('#d98a5f', 40, 36, 20, 3);
  });
}
