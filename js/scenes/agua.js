// Lago del cráter: agua animada y física del astronauta dentro del agua
// (se hunde según la profundidad, flota, el agua lo frena y tiene inercia, deja ondas y salpica).
import { CRATER } from '../sprites.js';
import { rego } from '../ui/hud.js';
import { modalAbierto } from '../ui/modal.js';
import { sfx } from '../audio.js';

const ALTO_ASTRO = 22, ANCHO_ASTRO = 16;
// Sin la planta de agua (filtro + transformador) el lago es un bloque de hielo; con ella, solo se congela tras noches muy frías.
const helado = s => !s.plantaAgua || !!s.lagoCongelado;

export class Lago {
  constructor(sc) {
    this.sc = sc;
    this.cx = CRATER.x; this.cy = CRATER.y;
    this.rx = CRATER.rx * 0.82; this.ry = CRATER.ry * 0.82;
    const w = (Math.ceil(this.rx * 2) + 3) & ~1, h = (Math.ceil(this.ry * 2) + 3) & ~1;
    this.tex = sc.textures.createCanvas('agua', w, h);
    this.ctx = this.tex.getContext();
    this.img = this.ctx.createImageData(w, h);
    sc.add.image(this.cx, this.cy, 'agua').setDepth(-0.5);
    sc.time.addEvent({ delay: 90, loop: true, callback: () => this.dibujar() });
    this.dibujar();

    this.linea = sc.add.ellipse(0, 0, 15, 5, 0x9fd3f0, 0.35).setStrokeStyle(1, 0xe8f6ff, 0.9).setVisible(false);
    this.hundir = 0; this.dentro = false; this.avisado = false;
    this.proxOnda = 0; this.mojado = 0; this.proxHuella = 0; this.lado = 1;
    // Hielo: 0 = líquido, 1 = todo congelado. Se congela desde la orilla hacia el centro.
    this.congelado = helado(sc.j.s);
    this.hielo = this.congelado ? 1 : 0;
  }

  // Avanza el congelamiento o deshielo hacia lo que diga el estado del juego (planta de agua y s.lagoCongelado).
  actualizarHielo(dt) {
    const s = this.sc.j.s, quiere = helado(s);
    if (modalAbierto()) return;
    if (quiere !== this.congelado) {
      this.congelado = quiere;
      if (!s.plantaAgua) { /* nueva partida: el lago vuelve a estar helado, sin aviso */ }
      else if (!quiere && !this.deshieloVisto) {
        this.deshieloVisto = true;
        rego('🔥 ¡El transformador calienta el hielo y el filtro limpia el agua! El lago se está derritiendo.');
      } else rego(quiere
        ? '🥶 La noche fue tan fría que el lago amaneció congelado. Puedes caminar encima sin hundirte... pero resbala. Dato real: en Marte casi toda el agua está congelada.'
        : '☀️ El sol calentó el lago y el hielo se está derritiendo. ¡Vuelve a ser agua!');
    }
    const objetivo = this.congelado ? 1 : 0;
    if (this.hielo !== objetivo) this.hielo = Math.max(0, Math.min(1, this.hielo + Math.sign(objetivo - this.hielo) * dt / 3500));
  }

  // 0 = fuera del agua, 1 = centro del lago (lo más hondo).
  profundidad(x, y) {
    const nx = (x - this.cx) / this.rx, ny = (y - this.cy) / this.ry;
    return Math.max(0, 1 - (nx * nx + ny * ny));
  }

  // Cuánto frena el agua y cuánta inercia tiene el movimiento.
  fisica(x, y) {
    const prof = this.profundidad(x, y);
    if (prof > 0 && 1 - prof >= 1 - this.hielo - 1e-6) return { prof: 0, dentro: false, hielo: true, velocidad: 1.05, inercia: 0.35 };
    const dentro = prof > 0;
    return { prof, dentro, velocidad: dentro ? 0.72 - prof * 0.4 : 1, inercia: dentro ? 0.03 : 1e-6 };
  }

  dibujar() {
    const t = this.sc.time.now / 1000, { width: w, height: h, data: d } = this.img;
    for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {
      const nx = (x + 1 - w / 2) / this.rx, ny = (y + 1 - h / 2) / this.ry, q = nx * nx + ny * ny;
      let c = null;
      if (q <= 1 && this.hielo > 0 && q >= 1 - this.hielo) {
        // hielo con grietas y destellos
        const grieta = Math.abs(Math.sin(x * 0.21 + y * 0.07) * Math.cos(y * 0.17 - x * 0.05)) < 0.04;
        c = grieta ? [140, 196, 230] : ((x * 7 + y * 13) >> 1) % 5 === 0 ? [205, 230, 245] : [228, 242, 251];
        if (Math.sin(t * 2 + x * 0.7 + y * 1.3) > 0.985) c = [255, 255, 255];
        if (this.hielo < 1 && q < 1 - this.hielo + 0.05) c = [245, 250, 255]; // borde que avanza
      } else if (q <= 1 && q > 0.86) {
        // orilla con escarcha y espuma que va y viene
        c = Math.sin(t * 2.5 + Math.atan2(ny, nx) * 9) > 0.15 ? [236, 246, 255] : [180, 220, 244];
      } else if (q <= 0.86) {
        const prof = 1 - q;
        const ola = Math.sin(x * 0.14 + t * 1.8) + Math.sin(y * 0.32 - t * 1.3 + x * 0.05) + 0.6 * Math.sin((x + y) * 0.08 + t * 2.6);
        c = [95 - prof * 60, 172 - prof * 75, 228 - prof * 35];
        if (ola > 2.0) c = [215, 238, 255];
        else if (ola > 1.4) c = c.map(v => v + 35);
      }
      for (const [ax, ay] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
        const i = ((y + ay) * w + x + ax) * 4;
        if (c) d.set([c[0], c[1], c[2], 255], i); else d[i + 3] = 0;
      }
    }
    this.ctx.putImageData(this.img, 0, 0);
    this.tex.refresh();
  }

  // Efectos visuales del astronauta según dónde está.
  visual(pos, vel, dt, jugador, fis) {
    const ahora = this.sc.time.now, rapidez = Math.hypot(vel.x, vel.y);
    this.actualizarHielo(dt);
    if (fis.hielo && rapidez > 30 && !this.avisoHielo) {
      this.avisoHielo = true;
      rego('🧊 ¡El lago congelado resbala! Sobre el hielo casi no hay fricción: cuesta frenar.');
    }
    if (fis.dentro !== this.dentro) {
      if (rapidez > 15) this.salpicar(pos.x, pos.y);
      if (!fis.dentro) this.mojado = 2500;
      else if (!this.avisado) {
        this.avisado = true;
        rego('💧 ¡Al agua! Te hundes un poco y avanzas más lento porque el agua te frena. Dato real: en Marte el agua líquida casi no dura en la superficie; con tan poca presión se congela o se evapora.');
      }
      this.dentro = fis.dentro;
    }

    // Se hunde poco a poco según la profundidad y flota (sube y baja suave).
    const objetivo = fis.dentro ? Math.min(0.42, 0.12 + fis.prof * 0.5) : 0;
    this.hundir += (objetivo - this.hundir) * (1 - Math.pow(0.003, dt / 1000));
    if (this.hundir < 0.01) this.hundir = 0;
    const flota = this.hundir ? Math.sin(ahora / 280) * 0.8 : 0;
    const px = Math.max(0, Math.round(ALTO_ASTRO * this.hundir + flota));
    jugador.setPosition(pos.x, pos.y + px);
    if (px > 0) jugador.setCrop(0, 0, ANCHO_ASTRO, ALTO_ASTRO - px); else jugador.setCrop();
    this.linea.setVisible(fis.dentro && px > 1).setPosition(pos.x, pos.y).setDepth(pos.y + 2).setScale(1 + Math.sin(ahora / 200) * 0.06);

    if (fis.dentro && ahora > this.proxOnda) {
      this.onda(pos.x, pos.y);
      this.proxOnda = ahora + (rapidez > 10 ? 170 : 900);
    }
    if (!fis.dentro && this.mojado > 0) {
      this.mojado -= dt;
      if (rapidez > 10 && ahora > this.proxHuella) {
        this.huella(pos.x + this.lado * 2, pos.y);
        this.lado *= -1;
        this.proxHuella = ahora + 150;
      }
    }
  }

  onda(x, y) {
    const o = this.sc.add.ellipse(x, y, 8, 3).setStrokeStyle(1, 0xe8f6ff, 0.8).setDepth(y - 1);
    this.sc.tweens.add({ targets: o, scaleX: 4.5, scaleY: 4.5, alpha: 0, duration: 1100, ease: 'Sine.Out', onComplete: () => o.destroy() });
  }

  salpicar(x, y) {
    sfx('chapoteo');
    for (let k = 0; k < 10; k++) {
      const gota = this.sc.add.rectangle(x, y - 2, 2, 2, k % 3 ? 0x9fd3f0 : 0xffffff).setDepth(y + 3);
      const alto = 8 + Math.random() * 12;
      this.sc.tweens.add({ targets: gota, x: x + (Math.random() - 0.5) * 44, duration: 520, onComplete: () => gota.destroy() });
      this.sc.tweens.add({ targets: gota, y: y - 2 - alto, duration: 260, ease: 'Quad.Out', yoyo: true });
    }
    this.onda(x, y);
  }

  // Huellas mojadas al salir del agua (se secan en 3 segundos).
  huella(x, y) {
    const h = this.sc.add.rectangle(x, y, 3, 2, 0x5a2010, 0.6).setDepth(y - 2);
    this.sc.tweens.add({ targets: h, alpha: 0, duration: 3000, onComplete: () => h.destroy() });
  }
}
