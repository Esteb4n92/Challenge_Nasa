// Escena de misión: un escenario explorable fuera de la base.
// El aire del traje se gasta en tiempo real, el Rover tiene carga máxima,
// hay peligros (remolinos de polvo, hielo resbaladizo) y eventos al llegar a cada lugar.
import { semilla } from '../sprites.js';
import { texturaSuelo, texturasObjetos, esHielo } from '../sprites-mision.js';
import { abrir, modalAbierto } from '../ui/modal.js';
import { juegoDetenido, colapso } from '../ui/menu.js';
import { render, rego } from '../ui/hud.js';
import { aplicarEfectos, limitar, resumenEfectos } from '../util.js';
import { sfx, motor } from '../audio.js';
import { cuerpo } from '../systems/cuerpo.js';

const TEXTO = { fontFamily: 'monospace', fontSize: '9px', fontStyle: 'bold', color: '#f2e3c4', stroke: '#1a0f1f', strokeThickness: 3, resolution: 4 };
const OBJ = {
  metal: { tex: 'item-metal', nombre: 'Placa de metal', icono: '🔩' },
  cables: { tex: 'item-cables', nombre: 'Cables', icono: '🔌' },
  chips: { tex: 'item-chips', nombre: 'Chip', icono: '💾' },
  hielo: { tex: 'item-hielo', nombre: 'Hielo', icono: '🧊' },
};
const $ = id => document.getElementById(id);

export class MisionScene extends Phaser.Scene {
  constructor(juego) { super('mision'); this.j = juego; }

  init(data) {
    this.m = this.j.datos.missions.misiones.find(x => x.id === data.id);
    this.alTerminar = data.alTerminar;
  }

  create() {
    const m = this.m, E = m.escenario, rnd = semilla(E.semilla);
    this.W = E.ancho; this.H = E.alto;
    texturasObjetos(this);
    this.add.image(0, 0, texturaSuelo(this, m)).setOrigin(0).setDepth(-1);

    // Lugares importantes (con evento opcional).
    this.puntos = (m.puntos || []).map(p => {
      this.add.image(p.x, p.y, p.sprite).setOrigin(0.5, 1).setDepth(p.y);
      this.add.text(p.x, p.y + 3, p.nombre, TEXTO).setOrigin(0.5, 0).setDepth(3000);
      const marca = this.add.text(p.x, p.y - this.textures.get(p.sprite).source[0].height - 4, '!', { ...TEXTO, fontSize: '16px', color: '#f2c14e' }).setOrigin(0.5, 1).setDepth(3001);
      this.tweens.add({ targets: marca, y: marca.y - 4, duration: 400, yoyo: true, repeat: -1 });
      return { ...p, hecho: p.evento === undefined, marca: p.evento === undefined ? marca.setVisible(false) : marca };
    });
    const libre = (x, y, dist = 50) => Math.hypot(x - m.inicio.x, y - m.inicio.y) > 80 && this.puntos.every(p => Math.hypot(x - p.x, y - p.y) > dist);
    const azar = ([x0, y0, x1, y1]) => { for (let i = 0; i < 50; i++) { const x = x0 + rnd() * (x1 - x0), y = y0 + rnd() * (y1 - y0); if (libre(x, y, 40)) return { x, y }; } return { x: x0, y: y0 }; };

    // Obstáculos para el Rover: rocas grandes y lugares (a pie sí se puede pasar entre ellos).
    this.obstaculos = this.puntos.map(p => ({ x: p.x, y: p.y - 6, r: 18 }));
    for (let i = 0, n = 0; i < 300 && n < (E.rocas || 25); i++) {
      const x = 50 + rnd() * (this.W - 100), y = 60 + rnd() * (this.H - 110);
      if (!libre(x, y, 70) || (E.tema === 'hielo' && esHielo(x, y))) continue;
      const tipo = ['roca1', 'roca2', 'roca3'][(rnd() * 3) | 0];
      this.add.image(x, y, tipo).setOrigin(0.5, 1).setDepth(y);
      if (tipo !== 'roca3') this.obstaculos.push({ x, y: y - 4, r: tipo === 'roca1' ? 12 : 7 });
      n++;
    }
    const img = this.add.image(m.inicio.x, m.inicio.y, 'rover').setOrigin(0.5, 1).setDepth(m.inicio.y).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (this.detenido() || this.conduciendo) return;
        if (this.cercaRover()) this.subir();
        else { this.destino = { x: this.rover.x, y: this.rover.y + 12 }; this.alLlegarSubir = true; }
      });
    this.rover = { x: m.inicio.x, y: m.inicio.y, vx: 0, vy: 0, img };
    this.conduciendo = false;

    this.objetos = [];
    for (const o of m.objetos || []) for (let k = 0; k < o.cantidad; k++) this.ponerObjeto(o, azar(o.zona));
    this.bloques = [];
    if (m.bloques) for (let k = 0; k < m.bloques.cantidad; k++) {
      const { x, y } = azar(m.bloques.zona);
      this.bloques.push({ x, y, avance: 0, img: this.add.image(x, y, 'bloque-hielo').setOrigin(0.5, 1).setDepth(y) });
    }
    this.barra = this.add.graphics().setDepth(3002);
    this.remolinos = (m.peligros || []).filter(p => p.tipo === 'remolino')
      .map(p => ({ x: p.x, y: p.y, ang: rnd() * 6.3, g: this.add.graphics(), espera: 0 }));

    this.pos = { x: m.inicio.x + 30, y: m.inicio.y + 12 };
    this.vel = { x: 0, y: 0 };
    this.sombra = this.add.ellipse(0, 0, 12, 4, 0x2a1410, 0.45);
    this.jugador = this.add.image(this.pos.x, this.pos.y, 'astro0').setOrigin(0.5, 1);
    this.aviso = this.add.text(0, 0, '', { ...TEXTO, color: '#f2c14e' }).setOrigin(0.5, 0).setDepth(3003);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.W, this.H).startFollow(this.jugador, true, 0.12, 0.12).setRoundPixels(true);
    const zoom = () => { const { width, height } = this.scale.gameSize; cam.setZoom(Math.max(1, Math.min(width / 480, height / 300))); };
    zoom(); this.scale.on('resize', zoom);
    this.events.once('shutdown', () => this.scale.off('resize', zoom));
    cam.fadeIn(500, 10, 5, 20);

    this.teclas = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT');
    this.input.keyboard.on('keydown-E', () => this.interactuar());
    this.input.keyboard.on('keydown-R', () => this.volverBase());
    this.input.on('pointerdown', (p, sobre) => { if (!sobre.length && !this.detenido()) { this.destino = { x: p.worldX, y: p.worldY }; this.alLlegarSubir = false; } });
    $('mh-rover').onclick = () => this.interactuar();
    $('mh-volver').onclick = () => this.volverBase();
    const cv = $('minimapa');
    if (cv) cv.onclick = ev => { const b = cv.getBoundingClientRect(); this.destino = { x: (ev.clientX - b.left) / b.width * this.W, y: (ev.clientY - b.top) / b.height * this.H }; };

    this.aire = m.traje; this.carga = []; this.peso = 0; this.terminada = false; this.ocupado = false;
    this.reloj = this.j.datos.config.misionTiempo; // 3 minutos de misión
    this.avisos = {};
    document.body.classList.add('en-mision');
    $('mh-nombre').textContent = `${m.icono} ${m.nombre}`;
    this.time.addEvent({ delay: 200, loop: true, callback: () => { this.hud(); this.minimapa(); } });
    // Llegas manejando: empiezas dentro del Rover.
    this.avisos.subir = true;
    this.subir();
    this.hud();
    rego(`🚙 Vas en el Rover: manéjalo con las flechas o tocando el mapa. Bájate con E (o el botón «Bajar») para recoger piezas. ${m.intro || ''}`);
  }

  ponerObjeto(o, { x, y }) {
    const img = this.add.image(x, y, OBJ[o.tipo].tex).setOrigin(0.5, 1).setDepth(y);
    this.tweens.add({ targets: img, y: y - 2, duration: 600 + Math.random() * 300, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.objetos.push({ ...o, x, y, img, tomado: false });
  }

  detenido() { return this.terminada || this.ocupado || modalAbierto() || juegoDetenido(this.j); }

  // Física del suelo: el hielo resbala (poca fricción) y las dunas frenan un poco.
  fisica(x, y) {
    if (this.m.escenario.tema === 'hielo' && esHielo(x, y)) return { velocidad: 1.05, inercia: 0.35, hielo: true };
    return { velocidad: this.m.escenario.tema === 'llanura' ? 0.92 : 1, inercia: 1e-6, hielo: false };
  }

  update(_, dt) {
    if (this.terminada) return;
    const parado = this.detenido(), s = this.j.s;
    if (!parado) {
      this.aire -= dt / 1000 * cuerpo(s, this.j.datos.config).traje;
      s.dosis = Math.min(100, s.dosis + this.m.dosisPorMinuto * dt / 60000);
      if (this.aire <= this.m.traje * 0.3 && !this.avisos.aire) { this.avisos.aire = true; rego('⚠️ ¡Queda poco aire en el traje! Vuelve al Rover pronto.'); }
      if (this.aire <= 0) { this.aire = 0; this.volver(false); return; }
      // Tiempo de misión: al pasar los 3 minutos, la base gasta su batería de emergencia rápido.
      this.reloj -= dt / 1000;
      if (this.reloj <= 0) {
        if (!this.avisos.reloj) { this.avisos.reloj = true; this.cameras.main.flash(300, 200, 30, 30); rego('⏱️ ¡Se acabó el tiempo de misión! La base está gastando su batería de emergencia: ¡vuelve ya con el Rover (R)!'); }
        s.bateria = Math.max(0, s.bateria - dt / 1000);
      }
      if (s.bateria <= 0) { colapso(this.j); return; }
    }

    let dx = 0, dy = 0;
    if (!parado) {
      const k = this.teclas;
      dx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
      dy = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
      if (dx || dy) { this.destino = null; this.alLlegarSubir = false; }
      else if (this.destino) {
        const ox = this.destino.x - this.pos.x, oy = this.destino.y - this.pos.y, d = Math.hypot(ox, oy);
        if (d < (this.conduciendo ? 14 : 3)) {
          this.destino = null;
          if (this.alLlegarSubir) { this.alLlegarSubir = false; this.subir(); }
        } else { dx = ox / d; dy = oy / d; }
      }
    }
    if (this.conduciendo) {
      if (!parado) { this.conducir(dt, dx, dy); this.eventosYPeligros(dt, false); }
      this.aviso.setText(parado ? '' : '[E] Bajar del Rover · [R] Volver a la base').setPosition(this.rover.x, this.rover.y + 3);
      return;
    }
    const fis = this.fisica(this.pos.x, this.pos.y);
    let ox = 0, oy = 0;
    if (dx || dy) {
      const n = Math.hypot(dx, dy), v = 95 * (this.j.ajustes?.velocidad || 1) * fis.velocidad * cuerpo(this.j.s, this.j.datos.config).velocidad;
      ox = dx / n * v; oy = dy / n * v;
      if (dx) this.jugador.setFlipX(dx < 0);
    }
    const kf = 1 - Math.pow(fis.inercia, dt / 1000);
    this.vel.x += (ox - this.vel.x) * kf; this.vel.y += (oy - this.vel.y) * kf;
    this.pos.x = Phaser.Math.Clamp(this.pos.x + this.vel.x * dt / 1000, 40, this.W - 40);
    this.pos.y = Phaser.Math.Clamp(this.pos.y + this.vel.y * dt / 1000, 50, this.H - 30);
    if (fis.hielo && !this.avisos.hielo && Math.hypot(this.vel.x, this.vel.y) > 30) { this.avisos.hielo = true; rego('🧊 ¡El hielo resbala! Casi no hay fricción: te cuesta frenar y girar.'); }
    const moviendo = Math.hypot(this.vel.x, this.vel.y) > 8;
    if (moviendo && (dx || dy) && this.time.now > (this.proxPaso || 0)) { this.proxPaso = this.time.now + (fis.hielo ? 260 : 300); sfx(fis.hielo ? 'pasoHielo' : 'paso'); }
    this.jugador.setTexture(moviendo && !(fis.hielo && !(dx || dy)) ? `astro${Math.floor(this.time.now / 140) % 2}` : 'astro0');
    this.jugador.setPosition(this.pos.x, this.pos.y).setDepth(this.pos.y + 1);
    this.sombra.setPosition(this.pos.x, this.pos.y - 1).setDepth(this.pos.y);
    if (parado) return;

    this.eventosYPeligros(dt, moviendo);
    this.aviso.setText(this.cercaRover() ? '[E] Subir al Rover · [R] Volver a la base' : '').setPosition(this.pos.x, this.pos.y + 3);
  }

  eventosYPeligros(dt, moviendo) {
    if (!this.conduciendo) {
      for (const o of this.objetos) if (!o.tomado && Math.hypot(o.x - this.pos.x, o.y - this.pos.y) < 13) this.tomar(o);
      this.picar(dt, moviendo);
    } else if (!this.avisos.bajar && this.objetos.some(o => !o.tomado && Math.hypot(o.x - this.pos.x, o.y - this.pos.y) < 24)) {
      this.avisos.bajar = true;
      rego('🧑‍🚀 Para recoger piezas tienes que bajarte del Rover (E).');
    }
    for (const p of this.puntos) if (!p.hecho && Math.hypot(p.x - this.pos.x, p.y - this.pos.y) < 34) this.evento(p);
    this.remolinosMover(dt);
  }

  cercaRover() { return Math.hypot(this.rover.x - this.pos.x, this.rover.y + 10 - this.pos.y) < 36; }

  interactuar() {
    if (this.detenido()) return;
    if (this.conduciendo) this.bajar();
    else if (this.cercaRover()) this.subir();
  }

  subir() {
    if (this.conduciendo || !this.cercaRover()) return;
    this.conduciendo = true; this.destino = null;
    this.jugador.setVisible(false); this.sombra.setVisible(false);
    this.cameras.main.startFollow(this.rover.img, true, 0.1, 0.1);
    if (!this.avisos.subir) {
      this.avisos.subir = true;
      rego('🚙 ¡Al volante! El Rover es rápido, pero gasta batería de la base y no puede pasar sobre rocas grandes. Pulsa R para volver a la base.');
    }
  }

  bajar() {
    const r = this.rover;
    this.conduciendo = false; this.destino = null;
    motor(0);
    r.vx = 0; r.vy = 0;
    this.pos = { x: r.x + (r.img.flipX ? 22 : -22), y: r.y + 10 };
    this.vel = { x: 0, y: 0 };
    this.jugador.setVisible(true).setPosition(this.pos.x, this.pos.y); this.sombra.setVisible(true);
    this.cameras.main.startFollow(this.jugador, true, 0.12, 0.12);
  }

  volverBase() {
    if (this.detenido()) return;
    if (this.conduciendo || this.cercaRover()) this.volver(true);
    else rego('🚙 Para volver a la base tienes que subirte al Rover.');
  }

  // Rover: pesado (tarda en acelerar y frenar), derrapa en el hielo, choca con rocas y gasta batería.
  conducir(dt, dx, dy) {
    const r = this.rover, s = this.j.s, fis = this.fisica(r.x, r.y), ahora = this.time.now;
    const sinBateria = s.bateria <= 0;
    let ox = 0, oy = 0;
    if ((dx || dy) && !sinBateria) {
      const n = Math.hypot(dx, dy), v = 175 * (fis.hielo ? 1.1 : fis.velocidad);
      ox = dx / n * v; oy = dy / n * v;
    }
    const k = 1 - Math.pow(fis.hielo ? 0.55 : 0.08, dt / 1000);
    r.vx += (ox - r.vx) * k; r.vy += (oy - r.vy) * k;
    let nx = Phaser.Math.Clamp(r.x + r.vx * dt / 1000, 50, this.W - 50);
    let ny = Phaser.Math.Clamp(r.y + r.vy * dt / 1000, 70, this.H - 30);
    if (this.obstaculos.some(q => Math.hypot(nx - q.x, ny - q.y) < q.r + 14)) {
      const fuerte = Math.hypot(r.vx, r.vy) > 60;
      r.vx *= -0.3; r.vy *= -0.3; nx = r.x; ny = r.y;
      if (fuerte && ahora > (this.avisos.choque || 0)) {
        this.avisos.choque = ahora + 3000;
        this.cameras.main.shake(160, 0.005);
        sfx('golpe');
        rego('💥 ¡Choque! El Rover no puede pasar por encima de las rocas grandes. Rodéalas.');
      }
    }
    r.x = nx; r.y = ny;
    const rapidez = Math.hypot(r.vx, r.vy);
    if (rapidez > 5) s.bateria = Math.max(0, s.bateria - 0.35 * (rapidez / 175) * dt / 1000);
    if (s.bateria < 15 && !this.avisos.bateria) { this.avisos.bateria = true; rego('🔋 ¡La batería de la base está muy baja! Si llega a 0%, la base se congela. Bájate del Rover o vuelve ya.'); }
    if (fis.hielo && rapidez > 60 && !this.avisos.derrape) { this.avisos.derrape = true; rego('🧊 ¡El Rover derrapa en el hielo! Sin fricción, las ruedas casi no frenan.'); }
    if (Math.abs(r.vx) > 5) r.img.setFlipX(r.vx < 0);
    const incl = Phaser.Math.Clamp(r.vy / 175, -1, 1) * 0.12 * (r.img.flipX ? -1 : 1);
    r.img.setPosition(r.x, r.y).setDepth(r.y).setRotation(incl);
    if (rapidez > 40 && ahora > (this.proxPolvo || 0)) {
      this.proxPolvo = ahora + 70;
      const p = this.add.rectangle(r.x - Math.sign(r.vx || 1) * 22, r.y - 2, 3, 3, fis.hielo ? 0xeef7ff : 0xc97a55, 0.8).setDepth(r.y - 1);
      this.tweens.add({ targets: p, y: p.y - 8, alpha: 0, scale: 2.5, duration: 600, onComplete: () => p.destroy() });
    }
    this.pos.x = r.x; this.pos.y = r.y + 4;
    motor(rapidez);
  }

  tomar(o) {
    if (this.peso + o.peso > this.m.carga) {
      if (this.time.now > (this.avisos.lleno || 0)) { this.avisos.lleno = this.time.now + 4000; rego(`🚙 El Rover ya va lleno (${this.peso}/${this.m.carga}). Elige bien qué llevar o vuelve a la base.`); }
      return;
    }
    o.tomado = true; this.peso += o.peso; this.carga.push(o);
    sfx('recoger');
    this.tweens.killTweensOf(o.img);
    this.tweens.add({ targets: o.img, y: o.y - 14, alpha: 0, duration: 350, onComplete: () => o.img.destroy() });
    const t = this.add.text(o.x, o.y - 12, `+ ${OBJ[o.tipo].icono}`, { ...TEXTO, fontSize: '11px' }).setOrigin(0.5).setDepth(3004);
    this.tweens.add({ targets: t, y: t.y - 16, alpha: 0, duration: 900, onComplete: () => t.destroy() });
    this.hud();
  }

  // Picar hielo: quedarse junto a un bloque lo rompe poco a poco (gasta aire del traje).
  picar(dt, moviendo) {
    this.barra.clear();
    const b = this.bloques.find(b => !b.roto && Math.hypot(b.x - this.pos.x, b.y - this.pos.y) < 22);
    if (!b) return;
    if (!moviendo) {
      b.avance += dt / 1600;
      if (this.time.now > (this.proxPico || 0)) { this.proxPico = this.time.now + 280; sfx('picar'); }
    }
    this.barra.fillStyle(0x000000, 0.7).fillRect(b.x - 12, b.y - 26, 24, 4).fillStyle(0x9fd3f0, 1).fillRect(b.x - 11, b.y - 25, 22 * Math.min(1, b.avance), 2);
    if (!this.avisos.picar) { this.avisos.picar = true; rego('⛏️ Quédate quieto junto al bloque para picarlo. ¡Picar también gasta aire!'); }
    if (b.avance >= 1) {
      b.roto = true;
      this.tweens.add({ targets: b.img, alpha: 0, scale: 0.6, duration: 250, onComplete: () => b.img.destroy() });
      this.ponerObjeto({ tipo: 'hielo', peso: this.m.bloques.peso, da: this.m.bloques.da }, { x: b.x, y: b.y });
    }
  }

  // Remolinos de polvo: se mueven solos y empujan al astronauta.
  remolinosMover(dt) {
    const t = this.time.now / 1000;
    for (const r of this.remolinos) {
      r.ang += (Math.random() - 0.5) * dt * 0.003;
      r.x += Math.cos(r.ang) * 28 * dt / 1000; r.y += Math.sin(r.ang) * 28 * dt / 1000;
      if (r.x < 80 || r.x > this.W - 80) r.ang = Math.PI - r.ang;
      if (r.y < 90 || r.y > this.H - 70) r.ang = -r.ang;
      r.g.clear().setDepth(r.y);
      for (let k = 0; k < 6; k++) {
        r.g.fillStyle(k % 2 ? 0xd98a5f : 0xb5653a, 0.55 - k * 0.06);
        r.g.fillEllipse(r.x + Math.sin(t * 7 + k) * k * 1.5, r.y - k * 6, 10 + k * 4, 5 + k);
      }
      const d = Math.hypot(r.x - this.pos.x, r.y - this.pos.y);
      if (d < 18 && this.time.now > r.espera) {
        r.espera = this.time.now + 1500;
        const ex = (this.pos.x - r.x) / (d || 1), ey = (this.pos.y - r.y) / (d || 1);
        if (this.conduciendo) { this.rover.vx = ex * 110; this.rover.vy = ey * 110; this.aire = Math.max(0, this.aire - 2); }
        else { this.vel.x = ex * 220; this.vel.y = ey * 220; this.aire = Math.max(0, this.aire - 6); }
        this.cameras.main.shake(250, 0.006);
        sfx('viento');
        rego(this.conduciendo ? '🌪️ Un remolino sacudió el Rover. Como es pesado, te empujó menos que a pie.'
          : this.avisos.remolino ? '🌪️ ¡Otro remolino! Perdiste aire del traje.'
          : '🌪️ ¡Un remolino de polvo te empujó y perdiste aire! Dato real: los rovers de la NASA han fotografiado remolinos de polvo en Marte.');
        this.avisos.remolino = true;
      }
    }
  }

  async evento(p) {
    p.hecho = true; p.marca.setVisible(false); this.ocupado = true;
    const paso = this.m.pasos[p.evento];
    const i = await abrir(`${this.m.icono} ${p.nombre}`, `<p>${paso.texto}</p>`,
      paso.opciones.map((o, k) => ({ texto: `${o.texto} ${resumenEfectos(o.efectos)}`, valor: k })));
    const o = paso.opciones[i];
    aplicarEfectos(this.j.s, o.efectos); limitar(this.j.s); render(this.j);
    rego(o.resultado);
    this.ocupado = false;
  }

  volver(conAire) {
    if (this.terminada) return;
    this.terminada = true;
    let carga = this.carga, perdidos = [];
    if (!conAire) { const mitad = Math.ceil(carga.length / 2); perdidos = carga.slice(mitad); carga = carga.slice(0, mitad); }
    const recompensas = {};
    for (const o of carga) for (const [k, v] of Object.entries(o.da)) recompensas[k] = (recompensas[k] || 0) + v;
    this.cameras.main.fadeOut(400, 10, 5, 20);
    this.time.delayedCall(420, () => this.alTerminar({ conAire, carga, perdidos, recompensas, aire: this.aire }));
  }

  hud() {
    const pct = Math.max(0, this.aire / this.m.traje * 100);
    $('mh-aire').style.width = `${pct}%`;
    $('mh-aire').style.background = pct < 30 ? '#d23c2c' : '#7fd3ff';
    $('mh-aire-txt').textContent = `${Math.ceil(this.aire)} s`;
    const r = Math.max(0, Math.ceil(this.reloj));
    $('mh-reloj').textContent = r > 0 ? `⏱️ Tiempo de misión: ${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}` : '⏱️ ¡Tiempo agotado! La base pierde batería';
    $('mh-reloj').classList.toggle('mal', r <= 30);
    $('mh-carga').textContent = `🚙 Carga: ${this.peso}/${this.m.carga} · 🔋 Batería: ${Math.round(this.j.s.bateria)}`;
    const cerca = this.conduciendo || this.cercaRover();
    $('mh-rover').textContent = this.conduciendo ? '🧑‍🚀 Bajar (E)' : '🚙 Subir (E)';
    $('mh-rover').disabled = !cerca;
    $('mh-volver').disabled = !cerca;
    const cuenta = {};
    for (const o of this.carga) cuenta[o.tipo] = (cuenta[o.tipo] || 0) + 1;
    $('mh-lista').textContent = Object.entries(cuenta).map(([k, n]) => `${OBJ[k].icono}×${n}`).join('  ') || 'Aún no recoges nada';
    render(this.j);
  }

  minimapa() {
    const cv = $('minimapa');
    if (!cv || getComputedStyle(cv).display === 'none') return;
    const g = cv.getContext('2d'), sx = cv.width / this.W, sy = cv.height / this.H;
    g.imageSmoothingEnabled = false;
    g.drawImage(this.textures.get(`suelo-${this.m.id}`).getSourceImage(), 0, 0, cv.width, cv.height);
    g.fillStyle = '#ffffff'; g.fillRect(this.rover.x * sx - 4, this.rover.y * sy - 3, 8, 6);
    for (const p of this.puntos) { g.fillStyle = p.hecho ? '#f2e3c4' : '#f2c14e'; g.fillRect(p.x * sx - 3, p.y * sy - 3, 6, 6); }
    g.fillStyle = '#9fe08a';
    for (const o of this.objetos) if (!o.tomado) g.fillRect(o.x * sx - 1, o.y * sy - 1, 2, 2);
    g.fillStyle = '#e8642c';
    for (const r of this.remolinos) g.fillRect(r.x * sx - 2, r.y * sy - 2, 4, 4);
    g.fillStyle = '#7fd3ff'; g.beginPath(); g.arc(this.pos.x * sx, this.pos.y * sy, 3.5, 0, 7); g.fill();
  }
}
