// Cinemática de inicio en pixel art (canvas 320x180). Se puede saltar.
// Cuenta la historia: despegue → viaje → falla al entrar → choque → varado → vehículos con piezas → reparar.
import { semilla } from '../sprites.js';
import { tr } from '../i18n.js';

const W = 320, H = 180;
const PI = Math.PI;

function ayudas(g, tex) {
  const rnd = semilla(3);
  const estrellas = Array.from({ length: 90 }, () => ({ x: rnd() * W, y: rnd() * H, b: rnd() }));
  const a = {
    rect: (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); },
    circ: (c, x, y, r) => { g.fillStyle = c; g.beginPath(); g.arc(x, y, Math.max(0, r), 0, PI * 2); g.fill(); },
    cielo: (arriba, abajo) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, arriba); gr.addColorStop(1, abajo); g.fillStyle = gr; g.fillRect(0, 0, W, H); },
    estrellas: (t, vel = 0) => {
      for (const s of estrellas) {
        const x = ((s.x - t * vel * (0.3 + s.b)) % W + W) % W;
        g.fillStyle = `rgba(255,255,255,${0.25 + 0.75 * s.b * Math.abs(Math.sin(t * 2 + s.b * 9))})`;
        g.fillRect(x | 0, s.y | 0, 1, 1);
      }
    },
    sprite: (k, x, y, rot = 0, esc = 1, voltear = false) => {
      const im = tex(k);
      g.save(); g.translate(Math.round(x), Math.round(y)); g.rotate(rot); if (voltear) g.scale(-1, 1);
      g.drawImage(im, -im.width * esc / 2, -im.height * esc / 2, im.width * esc, im.height * esc);
      g.restore();
    },
    temblor: f => g.translate((Math.random() - 0.5) * f, (Math.random() - 0.5) * f),
    texto: (txt, x, y, tam, col, alfa = 1) => {
      g.globalAlpha = alfa; g.font = `${tam}px 'Press Start 2P', monospace`; g.textAlign = 'center';
      g.fillStyle = '#000'; txt = tr(txt); g.fillText(txt, x + 1, y + 1); g.fillStyle = col; g.fillText(txt, x, y); g.globalAlpha = 1;
    },
    planeta: (x, y, r, base, sombra) => {
      g.save(); g.beginPath(); g.arc(x, y, r, 0, PI * 2); g.clip();
      a.circ(base, x, y, r); a.circ(sombra, x + r * 0.55, y + r * 0.35, r);
      a.circ(sombra, x - r * 0.3, y - r * 0.2, r * 0.15); a.circ(sombra, x + r * 0.1, y + r * 0.35, r * 0.1);
      g.restore();
    },
    // Paisaje marciano; `antes` dibuja detrás de las montañas (sol, etc.).
    paisaje: (arriba = '#c97a55', abajo = '#efc29a', antes) => {
      a.cielo(arriba, abajo);
      if (antes) antes();
      for (const [col, base, amp, f] of [['#8e4024', 104, 14, 0.03], ['#b5532a', 116, 7, 0.05]]) {
        g.fillStyle = col; g.beginPath(); g.moveTo(0, H);
        for (let x = 0; x <= W; x += 4) g.lineTo(x, base - amp * Math.abs(Math.sin(x * f)) - amp * 0.4 * Math.sin(x * f * 3.7));
        g.lineTo(W, H); g.fill();
      }
      g.drawImage(tex('suelo'), 200, 360, 320, 60, 0, 124, W, 56);
    },
    humo: (x, y, t, n = 6, col = '150,150,160') => {
      for (let k = 0; k < n; k++) {
        const ph = (t * 0.5 + k / n) % 1;
        a.circ(`rgba(${col},${0.55 * (1 - ph)})`, x + ph * 10, y - ph * 40, 2 + ph * 7);
      }
    },
  };
  return a;
}

const yTierra = x => 440 - Math.sqrt(300 ** 2 - (x - 160) ** 2);

const ESCENAS = [
  {
    texto: 'La nave Starship V3 despega de la Tierra con una misión sencilla: llegar a Marte, tomar muestras y volver a casa.',
    dur: 6,
    dibujar(g, t, p, a) {
      a.cielo('#0b1030', '#3a6ab8'); a.estrellas(t);
      g.save(); g.beginPath(); g.arc(160, 440, 300, 0, PI * 2); g.clip();
      a.circ('#2f6fd0', 160, 440, 300);
      for (const [x, r] of [[45, 26], [120, 14], [250, 34], [175, 18]]) a.circ('#4e9a34', x, yTierra(x) + r * 0.7, r);
      a.circ('rgba(255,255,255,.35)', 95, yTierra(95) + 6, 9); a.circ('rgba(255,255,255,.3)', 215, yTierra(215) + 5, 12);
      g.restore();
      g.strokeStyle = 'rgba(140,200,255,.45)'; g.lineWidth = 3; g.beginPath(); g.arc(160, 440, 302, PI * 1.1, PI * 1.9); g.stroke();
      a.rect('#6e6b74', 176, 96, 4, 48); for (let y = 100; y < 144; y += 8) a.rect('#8a8790', 168, y, 12, 1);
      const sube = p < 0.18 ? 0 : ((p - 0.18) / 0.82) ** 2 * 240, y = 118 - sube;
      if (p > 0.08) {
        for (let k = 0; k < 10; k++) {
          const ph = (t * 0.8 + k / 10) % 1;
          a.circ(`rgba(235,235,235,${0.6 * (1 - ph)})`, 160 + (k % 2 ? 1 : -1) * ph * 45, 142 - ph * 8, 4 + ph * 14);
        }
        const fl = 7 + Math.random() * 7;
        a.rect('#ffd34d', 157, y + 22, 6, fl); a.rect('#ff7a2c', 158, y + 22 + fl, 4, fl * 0.7);
      }
      a.sprite('nave', 160, y, 0, 0.55);
    },
  },
  {
    texto: 'Viaja durante meses por el espacio. Por fin, Marte aparece frente a la nave.',
    dur: 5.5,
    dibujar(g, t, p, a) {
      a.cielo('#05060f', '#0b1030'); a.estrellas(t, 25);
      a.planeta(45 - p * 70, 140, 18 * (1 - p * 0.5), '#3b8fe8', 'rgba(10,30,80,.45)');
      const r = 12 + p * 50;
      a.planeta(262 + (1 - p) * 30, 88, r, '#c1440e', 'rgba(70,15,5,.45)');
      const y = 95 + Math.sin(t * 2) * 3, fl = 5 + Math.random() * 5;
      a.rect('#ffd34d', 120 - 23 - fl, y - 3, fl, 6); a.rect('#ff7a2c', 120 - 23 - fl * 1.6, y - 2, fl * 0.6, 4);
      a.sprite('nave', 120, y, PI / 2, 0.5);
    },
  },
  {
    texto: 'Al entrar en Marte, una violenta tormenta de polvo golpea la nave... ¡ALERTA! Una pieza se rompe y el motor falla.',
    dur: 6,
    dibujar(g, t, p, a) {
      a.cielo('#3a1020', '#d9663a');
      for (let k = 0; k < 45; k++) { // tormenta de polvo
        const x = ((k * 37 + t * (180 + (k % 5) * 40)) % 360) - 20, y = (k * 53) % H;
        a.rect(`rgba(${k % 2 ? '181,101,58' : '140,70,40'},${0.35 + (k % 3) * 0.15})`, x, y, 10 + (k % 4) * 4, 1);
      }
      g.save(); a.temblor(1 + p * 5);
      const x = 60 + p * 180, y = 20 + p * 110, dx = 0.85, dy = 0.52;
      for (let k = 0; k < 10; k++) {
        const d = k * 6 + (t * 60) % 6, j = (Math.random() - 0.5) * 6;
        a.rect(k % 2 ? '#ffd34d' : '#ff7a2c', x - dx * (14 + d) - dy * j, y - dy * (14 + d) + dx * j, 3, 3);
      }
      a.circ('rgba(255,170,60,.55)', x + dx * 20, y + dy * 20, 11);
      a.circ('rgba(255,250,200,.8)', x + dx * 20, y + dy * 20, 6);
      a.sprite('nave', x, y, 2.12, 0.5);
      if (p > 0.5) {
        const q = (p - 0.5) * 6;
        const px = x - 30 * q, py = y - 18 * q + 14 * q * q;
        a.rect('#9a96a0', px, py, 5, 3);
        for (let k = 0; k < 4; k++) a.rect('#ffd34d', px + (Math.random() - 0.5) * 10, py + (Math.random() - 0.5) * 10, 1, 1);
      }
      g.restore();
      if (p > 0.45 && Math.floor(t * 4) % 2 === 0) {
        g.fillStyle = 'rgba(255,0,0,.25)'; g.fillRect(0, 0, W, H);
        a.texto('¡ALERTA!', W / 2, 30, 12, '#ff5050');
      }
    },
  },
  {
    texto: '¡La Starship V3 se estrella! El generador principal se destruye y la antena se rompe: ya nadie en la Tierra puede oírte.',
    dur: 5,
    dibujar(g, t, p, a) {
      const imp = 0.35;
      g.save(); a.temblor(p > imp && p < imp + 0.25 ? 9 : 0);
      a.paisaje();
      if (p < imp) {
        const q = p / imp, x = 30 + q * 120, y = -20 + q * 148;
        a.humo(x - 14, y - 6, t * 3, 5, '90,80,80');
        a.sprite('nave', x, y, 2.5, 0.5);
      } else {
        const q = (p - imp) / (1 - imp);
        a.sprite('nave', 150, 128, -0.45, 0.5);
        for (let k = 0; k < 16; k++) {
          const ang = (k / 15) * PI, rad = q * 70 * (0.6 + ((k * 37) % 10) / 15);
          a.circ(`rgba(${k % 2 ? '200,120,75' : '150,80,50'},${0.85 * (1 - q)})`, 150 + Math.cos(ang) * rad, 138 - Math.sin(ang) * rad * 0.5, 6 + q * 12);
        }
        for (let k = 0; k < 9; k++) {
          const tq = q * 1.8, px = 150 + (k - 4) * 16 * tq, py = 128 + (-45 - (k % 3) * 15) * tq + 70 * tq * tq;
          if (py < 160) a.rect(k % 3 ? '#c9c3bb' : '#d23c2c', px, py, 3, 2);
        }
        if (q < 0.12) { g.fillStyle = `rgba(255,240,200,${1 - q / 0.12})`; g.fillRect(0, 0, W, H); }
      }
      g.restore();
    },
  },
  {
    texto: 'Estás varado hasta la próxima ventana de rescate. Solo queda un 30% de batería de emergencia... ¡y no trajiste paneles solares de repuesto!',
    dur: 6,
    dibujar(g, t, p, a) {
      a.paisaje('#2c2440', '#b98a78', () => {
        const gr = g.createRadialGradient(250, 98, 1, 250, 98, 45);
        gr.addColorStop(0, 'rgba(220,240,255,.95)'); gr.addColorStop(0.18, 'rgba(120,175,240,.6)'); gr.addColorStop(1, 'rgba(120,175,240,0)');
        g.fillStyle = gr; g.fillRect(190, 40, 120, 120);
        a.circ('#f4f8ff', 250, 98, 3);
      });
      a.humo(126, 118, t);
      a.sprite('nave', 120, 128, -0.45, 0.5);
      const avance = Math.min(1, p * 1.6), anda = avance < 1, ax = 300 - avance * 140;
      a.sprite(anda && Math.floor(t * 7) % 2 ? 'astro1' : 'astro0', ax, 144, 0, 1, true);
      if (!anda) a.texto('?', ax, 126 + Math.sin(t * 4) * 2, 8, '#f2c14e');
    },
  },
  {
    texto: 'Pero hay vehículos y módulos de carga abandonados por todo el planeta. ¡Sus piezas pueden salvarte!',
    dur: 7,
    dibujar(g, t, p, a) {
      a.rect('#1a0f1f', 0, 0, W, H);
      g.globalAlpha = 0.85; g.drawImage(a.tex('suelo'), 0, 0, 960, 640, 25, 0, 270, 180); g.globalAlpha = 1;
      const base = { x: 73, y: 72 };
      const puntos = [{ x: 55, y: 140, k: 'rover' }, { x: 170, y: 150, k: 'modulo' }, { x: 260, y: 110, k: 'rover' }, { x: 180, y: 55, k: 'modulo' }];
      puntos.forEach((pt, i) => {
        const aparece = (p - i * 0.15) / 0.15;
        if (aparece <= 0) return;
        g.save(); g.setLineDash([2, 3]); g.strokeStyle = 'rgba(242,227,196,.85)'; g.lineWidth = 1;
        const f = Math.min(1, aparece);
        g.beginPath(); g.moveTo(base.x, base.y); g.lineTo(base.x + (pt.x - base.x) * f, base.y + (pt.y - base.y) * f); g.stroke(); g.restore();
        if (f < 1) return;
        g.strokeStyle = '#f2c14e'; g.lineWidth = 1; g.beginPath(); g.arc(pt.x, pt.y, 6 + (t * 10 + i * 3) % 7, 0, PI * 2); g.stroke();
        if (pt.k === 'rover') a.sprite('rover', pt.x, pt.y, 0, 0.35);
        else { a.rect('#c9c3bb', pt.x - 6, pt.y - 5, 12, 7); a.rect('#d23c2c', pt.x - 6, pt.y - 5, 12, 2); a.rect('#9a96a0', pt.x - 7, pt.y + 2, 2, 4); a.rect('#9a96a0', pt.x + 5, pt.y + 2, 2, 4); }
        a.texto('🔩', pt.x + 9, pt.y - 7, 6, '#ffffff');
      });
      a.sprite('nave', base.x, base.y, -0.45, 0.25);
      a.texto('TÚ', base.x, base.y - 14, 5, '#7fd3ff');
      const k = Math.min(3, Math.floor(p * 4)), loc = (p * 4) % 1, dest = puntos[k];
      a.sprite('rover', base.x + (dest.x - base.x) * loc, base.y + (dest.y - base.y) * loc, 0, 0.3);
    },
  },
  {
    texto: 'Recoge metal, cables y chips, repara las 6 partes de la nave... ¡y vuelve a casa!',
    dur: 7,
    dibujar(g, t, p, a) {
      a.cielo('#0b0614', '#2a1430'); a.estrellas(t);
      const titulo = Math.max(0, (p - 0.72) / 0.2);
      a.sprite('nave', 160, 84, 0, 0.9);
      ['📡', '⚡', '⛽', '🛡️', '🔥', '🧭'].forEach((ico, i) => {
        const ang = -PI / 2 + i * PI / 3, x = 160 + Math.cos(ang) * 64, y = 84 + Math.sin(ang) * 58;
        const lista = p > 0.12 + i * 0.09;
        g.globalAlpha = (lista ? 1 : 0.35) * (1 - titulo);
        a.circ('#000', x, y, 11); a.circ(lista ? '#4e9a34' : '#3a2530', x, y, 10);
        g.font = '11px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ico, x, y + 1); g.textBaseline = 'alphabetic';
        g.globalAlpha = 1;
      });
      if (titulo > 0) {
        g.fillStyle = `rgba(11,6,20,${Math.min(0.75, titulo)})`; g.fillRect(0, 0, W, H);
        a.texto('BEYOND', 160, 78, 18, '#f2e3c4', Math.min(1, titulo));
        a.texto('SURVIVAL', 160, 102, 13, '#e8642c', Math.min(1, titulo));
        a.texto('UN ERROR... UNA NUEVA VIDA', 160, 124, 6, '#f2c14e', Math.min(1, titulo));
      }
    },
  },
];

export function reproducirIntro(j) {
  return new Promise(resolver => {
    const cont = document.createElement('div');
    cont.id = 'cinematica';
    cont.innerHTML = `<button class="sec saltar">Saltar ▶▶</button><canvas width="${W}" height="${H}"></canvas>
      <p class="subtitulo" aria-live="polite"></p><span class="pista">Toca o pulsa Espacio para continuar</span>`;
    document.body.appendChild(cont);
    const g = cont.querySelector('canvas').getContext('2d');
    const sub = cont.querySelector('.subtitulo');
    const tex = k => j.game.textures.get(k).getSourceImage();
    const a = ayudas(g, tex);
    a.tex = tex;
    let i = 0, t0 = performance.now(), letras = 0, fin = false, raf = 0;

    const terminar = () => {
      if (fin) return;
      fin = true; cancelAnimationFrame(raf);
      document.removeEventListener('keydown', tecla, true);
      cont.remove(); resolver();
    };
    const siguiente = () => { if (++i >= ESCENAS.length) return terminar(); t0 = performance.now(); letras = 0; };
    const avanzar = () => { if (fin) return; if (letras < ESCENAS[i].texto.length) letras = ESCENAS[i].texto.length; else siguiente(); };
    function tecla(ev) {
      if (ev.key === 'Escape') { ev.stopPropagation(); terminar(); }
      else if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); avanzar(); }
    }
    cont.querySelector('.saltar').onclick = ev => { ev.stopPropagation(); terminar(); };
    cont.onclick = avanzar;
    document.addEventListener('keydown', tecla, true);

    const cuadro = ahora => {
      if (fin) return;
      const e = ESCENAS[i], t = (ahora - t0) / 1000, dur = Math.max(e.dur, e.texto.length / 15 + 1.5);
      letras = Math.min(e.texto.length, Math.max(letras, Math.floor(t * 38)));
      sub.textContent = tr(e.texto).slice(0, letras);
      g.imageSmoothingEnabled = false;
      g.save(); e.dibujar(g, t, Math.min(1, t / dur), a); g.restore();
      const fundido = Math.max(0, 1 - t / 0.4);
      if (fundido) { g.fillStyle = `rgba(0,0,0,${fundido})`; g.fillRect(0, 0, W, H); }
      if (t >= dur) siguiente();
      raf = requestAnimationFrame(cuadro);
    };
    raf = requestAnimationFrame(cuadro);
  });
}
