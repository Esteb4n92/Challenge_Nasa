// Pixel art generado por código (no hay archivos de imagen).
// Todos los sprites reciben un contorno oscuro automático para que se vean nítidos.

export const W = 960, H = 640; // tamaño del mundo
export const CRATER = { x: 815, y: 135, rx: 105, ry: 58 };

export function semilla(n) { return () => ((n = (n * 16807) % 2147483647) / 2147483647); }
const hex = c => { const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };

function contornear(g, w, h) {
  const img = g.getImageData(0, 0, w, h), d = img.data, lleno = i => d[i * 4 + 3] > 40, marcar = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (!lleno(i) && ((x > 0 && lleno(i - 1)) || (x < w - 1 && lleno(i + 1)) || (y > 0 && lleno(i - w)) || (y < h - 1 && lleno(i + w)))) marcar.push(i);
  }
  for (const i of marcar) d.set([42, 20, 16, 255], i * 4);
  g.putImageData(img, 0, 0);
}

// r(color, x, y, w, h) pinta un rectángulo; domo(...) una elipse sombreada (luz arriba a la izquierda).
export function lienzo(sc, key, w, h, dibujar, contorno = true) {
  const t = sc.textures.createCanvas(key, w, h), g = t.getContext();
  const r = (c, x, y, ww = 1, hh = 1) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), ww, hh); };
  const domo = (cx, cy, rx, ry, cols, soloArriba = false) => {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
      if (nx * nx + ny * ny > 1 || (soloArriba && y > cy)) continue;
      const l = -nx * 0.55 - ny * 0.75;
      r(cols[l > 0.35 ? 0 : l > -0.3 ? 1 : 2], x, y);
    }
  };
  dibujar(r, domo);
  if (contorno) contornear(g, w, h);
  t.refresh();
}

function suelo(sc) {
  const t = sc.textures.createCanvas('suelo', W, H), g = t.getContext(), img = g.createImageData(W, H), d = img.data, rnd = semilla(11);
  const tonos = ['#b84a20', '#ad431c', '#c25428', '#a23e1a'].map(hex);
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
    const ondas = Math.sin(x * 0.013) + Math.sin(y * 0.017 + x * 0.006) + Math.sin((x + y) * 0.009);
    const k = ondas > 1.2 ? 0.88 : ondas < -1.4 ? 1.07 : 1, c = tonos[(rnd() * 4) | 0];
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) d.set([c[0] * k, c[1] * k, c[2] * k, 255], ((y + dy) * W + x + dx) * 4);
  }
  g.putImageData(img, 0, 0);
  const r = (c, x, y, ww = 2, hh = 2) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), ww, hh); };

  for (let i = 0; i < 900; i++) { const x = rnd() * W, y = rnd() * H; r('#7a2e16', x, y + 1); r('#d0683a', x, y, 1, 1); }
  // Huellas del rover hacia el cráter.
  for (let k = 0; k < 1; k += 0.008) { const x = 430 + (CRATER.x - 120 - 430) * k, y = 470 + (CRATER.y + 40 - 470) * k; r('#8e3616', x, y); r('#8e3616', x + 7, y + 3); }
  // Cráter del choque bajo la nave.
  for (let y = -16; y <= 16; y += 2) for (let x = -40; x <= 40; x += 2) {
    const q = (x * x) / 1600 + (y * y) / 256;
    if (q < 1) r(q > 0.8 ? '#cf6232' : q > 0.5 ? '#7a2e16' : '#5a2010', 170 + x, 262 + y);
  }
  // Cráter con hielo.
  const { x: cx, y: cy, rx, ry } = CRATER;
  for (let y = -ry - 8; y <= ry + 8; y += 2) for (let x = -rx - 10; x <= rx + 10; x += 2) {
    const q = (x * x) / ((rx + 10) ** 2) + (y * y) / ((ry + 8) ** 2), qi = (x * x) / (rx * rx) + (y * y) / (ry * ry);
    if (q > 1) continue;
    let c = qi > 1 ? '#d26a38' : qi > 0.82 ? (y < 0 ? '#5e2412' : '#8e3a1c') : '#dfeef7';
    if (qi <= 0.82) { const v = Math.sin(x * 0.09 + y * 0.05) + Math.sin(y * 0.2); c = v > 1.3 ? '#bfe3fb' : v < -1.1 ? '#2f6fb5' : '#4f95d8'; }
    r(c, cx + x, cy + y);
  }
  for (let i = 0; i < 14; i++) { const x = cx - 70 + rnd() * 140, y = cy - 25 + rnd() * 50; r('#8cc4e6', x, y, 6 + rnd() * 10 | 0, 1); }
  // Cuadrícula de construcción alrededor de la base (se desvanece hacia afuera).
  for (let x = 224; x <= 816; x += 16) for (let y = 96; y <= 528; y += 2) {
    const dd = Math.hypot((x - 520) / 300, (y - 312) / 220);
    if (dd < 1) { g.globalAlpha = 0.28 * (1 - dd); r('#5e2412', x, y, 1, 2); }
  }
  for (let y = 96; y <= 528; y += 16) for (let x = 224; x <= 816; x += 2) {
    const dd = Math.hypot((x - 520) / 300, (y - 312) / 220);
    if (dd < 1) { g.globalAlpha = 0.28 * (1 - dd); r('#5e2412', x, y, 2, 1); }
  }
  g.globalAlpha = 1;
  // Acantilados en los bordes del mapa.
  for (let x = 0; x < W; x += 2) {
    const h = 30 + 12 * Math.sin(x * 0.03) + 7 * Math.sin(x * 0.11);
    r('#9a4422', x, 0, 2, h - 10); r('#6e2a14', x, h - 10, 2, 10); if (rnd() < 0.3) r('#55200f', x, h - 9 + rnd() * 6, 2, 3); r('#b85a30', x, h - 12, 2, 2);
    const hb = 22 + 10 * Math.sin(x * 0.025 + 2) + 6 * Math.sin(x * 0.13);
    r('#b85a30', x, H - hb, 2, 2); r('#8a3a1c', x, H - hb + 2, 2, hb);
  }
  for (let y = 0; y < H; y += 2) for (const lado of [0, 1]) {
    const w = 26 + 12 * Math.sin(y * 0.028 + lado * 3) + 6 * Math.sin(y * 0.12);
    if (lado === 0) { r('#9a4422', 0, y, w - 6, 2); r('#6e2a14', w - 6, y, 6, 2); }
    else { r('#6e2a14', W - w, y, 6, 2); r('#9a4422', W - w + 6, y, w - 6, 2); }
  }
  t.refresh();
}

export function crearTexturas(sc) {
  suelo(sc);
  const ROCA = ['#c0643e', '#8e3e22', '#5e2614'];

  lienzo(sc, 'roca1', 30, 20, (r, domo) => { domo(15, 11, 13, 8, ROCA); domo(9, 14, 6, 4, ROCA); r('#5e2614', 14, 9, 1, 4); });
  lienzo(sc, 'roca2', 16, 11, (r, domo) => domo(8, 6, 7, 4, ROCA));
  lienzo(sc, 'roca3', 9, 7, (r, domo) => domo(4.5, 3.5, 3.5, 2.5, ROCA));
  const cristal = (key, claro, medio, oscuro) => lienzo(sc, key, 22, 20, r => {
    for (const [x, h] of [[3, 9], [7, 15], [12, 12], [16, 8]]) {
      const y = 18 - h;
      r(claro, x, y + 2, 2, h); r(medio, x + 2, y + 2, 2, h); r(claro, x + 1, y, 2, 2); r('#ffffff', x, y + 3, 1, 3);
    }
    r(oscuro, 2, 18, 18, 2);
  });
  cristal('cristalA', '#9fd8ff', '#3b7fe0', '#1f3f8a');
  cristal('cristalB', '#ffe08a', '#e0a020', '#8a5a10');

  lienzo(sc, 'habitat', 70, 50, (r, domo) => {
    r('#8a8790', 6, 34, 58, 9); r('#a8a5ad', 6, 34, 58, 2); r('#6e6b74', 6, 41, 58, 2);
    domo(35, 35, 28, 27, ['#f6f3ec', '#d9d4cb', '#a9a39a'], true);
    r('#e8642c', 8, 30, 54, 3);
    for (const x of [15, 49]) { r('#2a2340', x, 19, 7, 6); r('#7fd3ff', x + 1, 20, 2, 2); }
    r('#5a5560', 29, 25, 12, 15); r('#3b3442', 31, 27, 8, 13); r('#f2c14e', 38, 33, 1, 2);
    r('#9a96a0', 34, 3, 2, 7); r('#d23c2c', 34, 2, 2, 2);
  });

  // Misión 1: materiales del panel solar y la mesa del Taller.
  lienzo(sc, 'item-silicio', 14, 11, r => {
    r('#c99a72', 1, 7, 12, 3); r('#8a8a96', 3, 3, 3, 5); r('#b8b8c8', 6, 1, 3, 7); r('#6e6b74', 9, 4, 3, 4); r('#ffffff', 7, 2, 1, 2);
  });
  lienzo(sc, 'item-cobre', 15, 11, (r, domo) => {
    domo(7, 6, 6, 4, ['#f0a060', '#c8682c', '#8a3e14']); domo(7, 6, 2.5, 1.6, ['#5a2a10', '#3a1a08', '#2a1004']); r('#c8682c', 12, 7, 3, 1); r('#ffd0a0', 4, 3, 2, 1);
  });
  lienzo(sc, 'item-aluminio', 15, 10, r => {
    r('#c9c8d4', 1, 2, 13, 7); r('#eeeef6', 1, 2, 13, 2); r('#8a8a96', 1, 8, 13, 1); r('#ffffff', 3, 4, 4, 1); r('#6e6b74', 11, 4, 1, 1); r('#6e6b74', 3, 6, 1, 1);
  });
  lienzo(sc, 'taller', 48, 36, r => {
    r('#5a3e26', 4, 18, 3, 16); r('#5a3e26', 41, 18, 3, 16); r('#4a3220', 6, 30, 36, 2);
    r('#9a7a52', 2, 14, 44, 5); r('#b8946a', 2, 14, 44, 2); r('#6a4a2e', 2, 18, 44, 1);
    r('#2b4a8f', 14, 9, 16, 6); r('#5a74d8', 14, 9, 16, 1); for (let x = 16; x < 30; x += 4) r('#9fb6ff', x, 11, 2, 1);
    r('#8a8790', 36, 6, 4, 9); r('#6e6b74', 34, 6, 8, 2); r('#d23c2c', 6, 10, 6, 4); r('#9a96a0', 8, 8, 2, 2);
    r('#3b3442', 20, 24, 8, 6); r('#f2c14e', 22, 26, 4, 2);
  });

  // Candado para lo que aún está bloqueado.
  lienzo(sc, 'candado', 16, 18, r => {
    r('#8a8790', 4, 1, 8, 2); r('#8a8790', 3, 2, 2, 7); r('#8a8790', 11, 2, 2, 7); r('#c9c3bb', 5, 1, 3, 1);
    r('#a8322a', 1, 8, 14, 9); r('#d2483c', 1, 8, 14, 2); r('#7a1e1a', 1, 15, 14, 2);
    r('#2a1410', 7, 10, 2, 2); r('#2a1410', 7, 12, 2, 3);
  });
  // Caja de suministros y grupo de rocas oscuras.
  lienzo(sc, 'caja', 16, 14, r => {
    r('#7a5a3a', 1, 3, 14, 10); r('#9a7a52', 1, 3, 14, 2); r('#5a3e26', 1, 11, 14, 2);
    r('#4a4552', 1, 6, 14, 1); r('#4a4552', 7, 3, 2, 10); r('#c9c3bb', 3, 8, 2, 1);
  });
  lienzo(sc, 'rocaGrupo', 36, 22, (r, domo) => {
    const C = ['#9a7462', '#6a4a3c', '#3e2a22'];
    domo(10, 14, 9, 7, C); domo(24, 12, 10, 9, C); domo(17, 17, 6, 4, C); domo(31, 17, 4, 3, C);
    r('#b8907a', 21, 6, 3, 1); r('#b8907a', 7, 9, 2, 1);
  });

  // Hábitat en obra: base y andamios, antes de construir la sala presurizada.
  lienzo(sc, 'habitat-obra', 70, 50, (r) => {
    r('#8a8790', 6, 34, 58, 9); r('#a8a5ad', 6, 34, 58, 2); r('#6e6b74', 6, 41, 58, 2);
    for (let a = 0; a <= Math.PI; a += 0.05) {
      r('#c9c3bb', 35 + Math.cos(a) * 27, 35 - Math.sin(a) * 26);
      if (a > 0.6 && a < 2.5) r('#9a96a0', 35 + Math.cos(a) * 18, 35 - Math.sin(a) * 18);
    }
    for (const x of [14, 35, 56]) r('#9a96a0', x, 10, 2, 25);
    r('#9a96a0', 12, 20, 48, 1);
    r('#e8642c', 8, 30, 10, 4); r('#d9a441', 50, 28, 12, 6); r('#b88a33', 50, 32, 12, 2);
    r('#f2c14e', 20, 26, 6, 1); r('#2a2340', 20, 27, 6, 1);
  });

  lienzo(sc, 'tanque', 26, 38, (r, domo) => {
    domo(13, 9, 10, 6, ['#f4f1ea', '#d0cbc2', '#9a958c']);
    r('#e8e4dc', 3, 9, 6, 22); r('#cfc9bf', 9, 9, 8, 22); r('#a9a39a', 17, 9, 6, 22);
    r('#3b8fe8', 10, 16, 6, 7); r('#9fd3f0', 11, 17, 2, 2);
    r('#6e6b74', 4, 31, 3, 6); r('#6e6b74', 19, 31, 3, 6);
  });

  lienzo(sc, 'invernadero', 80, 46, r => {
    r('#8a8790', 2, 33, 76, 9); r('#a8a5ad', 2, 33, 76, 2); r('#6e6b74', 2, 40, 76, 2);
    for (const x of [6, 30, 54]) { r('#5a2a1a', x, 27, 20, 7); r('#7a3a22', x, 27, 20, 2); }
    for (let y = 2; y <= 34; y++) for (let x = 2; x < 78; x++) {
      const nx = (x - 40) / 38, ny = (y - 34) / 32;
      if (nx * nx + ny * ny > 1) continue;
      const brillo = nx < -0.3 && nx > -0.55 && ny < -0.3;
      r(brillo ? 'rgba(255,255,255,0.55)' : 'rgba(230,120,215,0.28)', x, y);
    }
    for (const x of [8, 22, 40, 58, 72]) for (let y = 2; y <= 34; y++) {
      const nx = (x - 40) / 38, ny = (y - 34) / 32;
      if (nx * nx + ny * ny <= 1) r('#c9c3bb', x, y);
    }
  });

  lienzo(sc, 'energia', 70, 46, r => {
    for (const [ox, oy] of [[2, 2], [36, 2], [2, 22], [36, 22]]) {
      r('#5a5560', ox + 14, oy + 14, 2, 8);
      for (let y = 0; y < 15; y++) {
        const off = (14 - y) / 3 | 0;
        r(y < 5 ? '#3a52b8' : '#24348a', ox + off, oy + y, 28, 1);
      }
      for (let k = 7; k < 28; k += 7) r('#5a74d8', ox + k, oy, 1, 15);
      r('#5a74d8', ox, oy + 7, 30, 1); r('#b9c8ff', ox + 6, oy + 2, 3, 1); r('#b9c8ff', ox + 5, oy + 3, 2, 1);
    }
  });

  // Zona de paneles vacía (el accidente destruyó los paneles): solo soportes y restos.
  lienzo(sc, 'energia-obra', 70, 46, r => {
    for (const [ox, oy] of [[2, 2], [36, 2], [2, 22], [36, 22]]) { r('#5a5560', ox + 14, oy + 14, 2, 8); r('#6e6b74', ox + 8, oy + 13, 14, 2); }
    r('#24348a', 10, 30, 6, 3); r('#5a74d8', 11, 30, 2, 1); r('#24348a', 46, 12, 4, 2); r('#9a96a0', 30, 36, 8, 2);
  });

  lienzo(sc, 'moxie', 36, 32, (r) => {
    r('#a87a2a', 4, 26, 28, 4); r('#d9a441', 4, 9, 28, 18); r('#f0c867', 4, 9, 28, 3); r('#b88a33', 26, 12, 6, 15);
    for (let k = 0; k < 4; k++) r('#3b3442', 8, 14 + k * 3, 13, 1);
    r('#e8e4dc', 23, 14, 6, 6); r('#d23c2c', 26, 15, 1, 3);
    r('#9a96a0', 28, 1, 3, 9); r('#9a96a0', 28, 1, 7, 3);
  });

  lienzo(sc, 'antena', 46, 70, (r, domo) => {
    for (let y = 26; y < 66; y++) {
      const k = (66 - y) / 40;
      r('#8a8790', 10 + k * 8, y, 2, 1); r('#8a8790', 34 - k * 8, y, 2, 1);
      if (y % 8 === 2) r('#a8a5ad', 11 + k * 8, y, 23 - k * 16, 1);
      if (y % 8 < 4) { r('#6e6b74', 12 + k * 8 + (y % 8) * 3, y, 1, 1); r('#6e6b74', 32 - k * 8 - (y % 8) * 3, y, 1, 1); }
    }
    r('#6e6b74', 6, 64, 34, 4); r('#c9c3bb', 34, 54, 10, 10); r('#7fd3ff', 36, 56, 3, 2);
    r('#8a8790', 22, 18, 2, 10);
    domo(23, 14, 20, 10, ['#f6f3ec', '#d0cbc2', '#9a958c']);
    domo(23, 14, 12, 5, ['#d0cbc2', '#b8b3aa', '#9a958c']);
    r('#9a96a0', 22, 4, 2, 10); r('#ff3b3b', 22, 2, 2, 2);
  });

  lienzo(sc, 'nave', 46, 84, (r, domo) => {
    for (let y = 0; y < 18; y++) { const w = 4 + y * 1.2 | 0; r('#d23c2c', 23 - w / 2, y, w, 1); r('#a82a20', 23 + w / 2 - 3, y, 3, 1); }
    r('#f4f1ea', 12, 18, 10, 46); r('#dcd6cc', 22, 18, 7, 46); r('#b0aaa0', 29, 18, 5, 46);
    for (const y of [34, 50]) r('#9a958c', 12, y, 22, 1);
    r('#9a96a0', 16, 26, 14, 14); domo(23, 33, 6, 6, ['#9fd3f0', '#3b4a8a', '#1a1f3d']); r('#ffffff', 20, 30, 2, 1);
    r('#d23c2c', 12, 52, 22, 4);
    for (let y = 54; y < 80; y++) { const k = (y - 54) / 2 | 0; r('#d23c2c', 12 - k, y, k + 2, 1); r('#a82a20', 32, y, k + 2, 1); }
    r('#5a5560', 16, 64, 14, 9); r('#3b3442', 18, 73, 10, 5);
    r('#4a3a34', 25, 42, 4, 3); r('#4a3a34', 14, 58, 3, 2); r('#2a2340', 27, 21, 1, 9); r('#2a2340', 28, 29, 2, 1);
  });

  lienzo(sc, 'rover', 52, 34, (r, domo) => {
    r('#2b3a8f', 4, 6, 44, 6); for (let x = 11; x < 48; x += 8) r('#5a74d8', x, 6, 1, 6); r('#b9c8ff', 6, 7, 4, 1);
    r('#f4f1ea', 6, 13, 40, 10); r('#cfc9bf', 6, 19, 40, 4); r('#2a2340', 36, 15, 7, 4);
    r('#9a96a0', 40, 0, 2, 6); r('#3b3442', 37, 0, 7, 3); r('#7fd3ff', 42, 1, 1, 1);
    for (const x of [11, 26, 41]) { domo(x, 27, 5.5, 5.5, ['#6e6b74', '#4a4552', '#2a2530']); r('#9a96a0', x - 1, 26, 2, 2); }
  });

  // Cultivos (se muestran dentro del invernadero según su estado).
  lienzo(sc, 'brote', 10, 10, r => { r('#4e9a34', 4, 4, 2, 6); r('#6cc04a', 1, 3, 3, 2); r('#8fdc5a', 6, 2, 3, 2); });
  lienzo(sc, 'lechuga', 14, 12, (r, domo) => { domo(7, 7, 6, 5, ['#ff7a8a', '#c8324a', '#7a1e34']); r('#8fdc5a', 6, 5, 2, 3); });
  lienzo(sc, 'rabano', 12, 14, (r, domo) => { r('#6cc04a', 3, 0, 2, 6); r('#8fdc5a', 7, 0, 2, 6); domo(6, 9.5, 4.5, 4, ['#ff6a7a', '#d23c4c', '#8a1e2c']); });
  lienzo(sc, 'mizuna', 14, 12, r => { for (const [x, h] of [[2, 6], [5, 9], [8, 10], [11, 7]]) { r('#4e9a34', x, 12 - h, 1, h); r('#8fdc5a', x - 1, 12 - h, 3, 2); } });
  lienzo(sc, 'hongo', 14, 10, (r, domo) => { domo(5, 6, 4, 3, ['#ffffff', '#d8d4dc', '#a09aa8']); domo(10, 6, 3.5, 3, ['#ffffff', '#d8d4dc', '#a09aa8']); });

  // Astronauta: 2 cuadros para caminar.
  for (const f of [0, 1]) lienzo(sc, `astro${f}`, 16, 22, (r, domo) => {
    r('#9a96a0', 2, 11, 3, 7); r('#7a7680', 2, 15, 3, 3);
    r('#e8e4dc', 4, 11, 9, 7); r('#c9c3bb', 10, 11, 3, 7); r('#d23c2c', 6, 13, 2, 2); r('#7fd3ff', 9, 13, 1, 1);
    r('#e8e4dc', 13, 12, 2, 5); r('#e8e4dc', 1, 12, 2, 5);
    const [a, b] = f ? [1, -1] : [0, 0];
    r('#e8e4dc', 5, 18 + a, 3, 2); r('#e8e4dc', 9, 18 + b, 3, 2); r('#5a5560', 5, 20 + a, 3, 1); r('#5a5560', 9, 20 + b, 3, 1);
    domo(8, 6, 6, 6, ['#ffffff', '#e8e4dc', '#b8b2aa']);
    r('#2a2340', 4, 4, 8, 5); r('#e8642c', 5, 5, 3, 1); r('#7fd3ff', 10, 5, 1, 1);
  });
}
