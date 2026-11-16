import { crearTexturas, semilla, W, H, CRATER } from '../sprites.js';
import { abrirEdificio } from '../ui/paneles.js';
import { modalAbierto } from '../ui/modal.js';
import { juegoDetenido, colapso } from '../ui/menu.js';
import { motivoNo } from '../actions.js';
import { avisosSolares } from '../systems/radiation.js';
import { Lago } from './agua.js';
import { render, rego, actualizarTraje, actualizarHora } from '../ui/hud.js';
import { terminarSol } from '../ui/noche.js';
import { tickLlamada } from '../ui/antena.js';
import { tickCiclo } from '../ui/ciclo.js';
import { tormentaSolar } from '../ui/tormentaSolar.js';
import { bloqueo } from '../actions.js';
import { sfx } from '../audio.js';
import { texturasPlanta } from '../ui/plantaAgua.js';
import { cuerpo } from '../systems/cuerpo.js';
import { revisarDemo } from '../ui/demo.js';

// Puntos de progreso de cada edificio: [hechos, total].
function progreso(id, s, d) {
  switch (id) {
    case 'nave': return [Object.values(s.cohete).filter(Boolean).length, d.rocket.partes.length];
    case 'energia': return [s.panel ? 1 + Math.round((1 - s.polvo / 0.8) * 3) : 0, 4];
    case 'habitat': return [(s.sala ? 1 : 0) + Math.round((s.reciclador - d.config.reciclador.inicial) / d.config.reciclador.mejora), 3];
    case 'moxie': return [s.cohete.tanques ? Math.min(5, Math.floor(s.combustible / d.config.combustibleMeta * 5)) : 0, 5];
    case 'invernadero': return [s.parcelas.filter(Boolean).length, 3];
    case 'antena': return [(s.pronostico ? 1 : 0) + (s.planos ? 1 : 0), 2];
    case 'planta': return [s.plantaAgua ? 1 : 0, 1];
    case 'taller': { const r = s.recogidos || {}; return [['silicio', 'cobre', 'aluminio'].filter(k => r[k]).length + (s.panelArmado || s.panel ? 1 : 0), 4]; }
    default: return null;
  }
}

const EDIFICIOS = [
  { id: 'nave', nombre: 'Starship V3', x: 170, y: 245, rot: -0.45 },
  { id: 'antena', nombre: 'Antena', x: 330, y: 140 },
  { id: 'moxie', nombre: 'MOXIE', x: 445, y: 215 },
  { id: 'habitat', nombre: 'Hábitat', x: 545, y: 305 },
  { id: 'energia', nombre: 'Paneles solares', x: 665, y: 195 },
  { id: 'invernadero', nombre: 'Invernadero', x: 700, y: 415 },
  { id: 'rover', nombre: 'Rover · Misiones', x: 430, y: 455 },
  { id: 'taller', nombre: 'Taller', x: 330, y: 360 },
  { id: 'planta', nombre: 'Planta de agua', x: 815, y: 232 }, // junto al lago del cráter
];
// Misión 1: materiales del panel solar esparcidos cerca de la nave.
const MATERIALES = [
  { id: 'silicio', x: 300, y: 432, nombre: 'Silicio', icono: '🪨', dato: '🪨 ¡Silicio! Sale de la arena: el suelo de Marte tiene mucho. Con él se hacen las celdas solares.' },
  { id: 'cobre', x: 244, y: 266, nombre: 'Cobre', icono: '🔌', dato: '🔌 ¡Cobre de los cables rotos de la nave! Conduce muy bien la electricidad.' },
  { id: 'aluminio', x: 128, y: 334, nombre: 'Aluminio', icono: '🔩', dato: '🔩 ¡Aluminio de la compuerta! Es ligero y fuerte: sirve de marco para el panel.' },
];
const INICIO = { x: 545, y: 370 };
const TEXTO = { fontFamily: 'monospace', fontSize: '9px', fontStyle: 'bold', color: '#f2e3c4', stroke: '#1a0f1f', strokeThickness: 3, resolution: 4 };

// "!" sobre un edificio cuando necesita atención.
function necesitaAtencion(id, s, d) {
  if (s.etapa === 'antena') return id === 'antena' && (!s.cohete.antena || !!s.llamada?.respondida);
  if (s.etapa === 'emergencia') {
    const r = s.recogidos || {};
    return (id === 'taller' && r.silicio && r.cobre && r.aluminio && !s.panelArmado) || (id === 'energia' && s.panelArmado);
  }
  switch (id) {
    case 'habitat': return !motivoNo(s, d, 'construirSala') || s.filtro < 40 || (!s.refugio && avisosSolares(s).length > 0);
    case 'energia': return s.polvo >= 0.3;
    case 'invernadero': return s.parcelas.some((p, i) => p && (p.hongo || !motivoNo(s, d, 'cosechar', [i])));
    case 'nave': return [...d.rocket.partes.map(p => motivoNo(s, d, 'reparar', [p.id])), motivoNo(s, d, 'despegar')].some(m => !m);
    case 'antena': return s.cohete.antena && (!motivoNo(s, d, 'mensaje', ['pronostico']) || !motivoNo(s, d, 'mensaje', ['planos']));
    case 'moxie': return s.cohete.tanques && s.moxieACombustible === 0;
    case 'planta': return !s.plantaAgua;
    default: return false;
  }
}

export class BaseScene extends Phaser.Scene {
  constructor(juego) { super('base'); this.j = juego; }

  create() {
    crearTexturas(this);
    texturasPlanta(this);
    this.add.image(0, 0, 'suelo').setOrigin(0).setDepth(-1);
    this.decorar();
    this.lago = new Lago(this);
    this.pos = { ...INICIO }; // posición real de los pies (el sprite puede verse hundido en el agua)
    this.vel = { x: 0, y: 0 };

    this.edificios = EDIFICIOS.map(e => {
      const img = this.add.image(e.x, e.y, e.id).setRotation(e.rot || 0).setInteractive({ useHandCursor: true }).setDepth(e.y + 20);
      const base = e.y + img.height / 2;
      this.add.text(e.x, base + 2, e.nombre, TEXTO).setOrigin(0.5, 0).setDepth(3000);
      const alerta = this.add.text(e.x, e.y - img.height / 2 - 2, '!', { ...TEXTO, fontSize: '16px', color: '#f2c14e' }).setOrigin(0.5, 1).setDepth(3001).setVisible(false);
      this.tweens.add({ targets: alerta, y: alerta.y - 4, duration: 400, yoyo: true, repeat: -1 });
      img.on('pointerdown', () => this.irA(e));
      const candado = this.add.image(e.x, e.y - 2, 'candado').setDepth(3001).setVisible(false);
      const puntos = this.add.graphics().setDepth(3000);
      return { ...e, img, alerta, candado, puntos, base, puerta: { x: e.x, y: base + 34 } };
    });
    this.panel = this.edificios.find(e => e.id === 'energia').img;
    const ant = this.edificios.find(e => e.id === 'antena');
    this.luz = this.add.rectangle(ant.x - 0, ant.y - 33, 2, 2, 0xff3030).setDepth(3000);

    // Materiales de la Misión 1: brillan y se recogen al pasar encima.
    this.materiales = MATERIALES.map(m => {
      const img = this.add.image(m.x, m.y, `item-${m.id}`).setOrigin(0.5, 1).setDepth(m.y).setVisible(false);
      this.tweens.add({ targets: img, y: m.y - 3, duration: 650, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      const brillo = this.add.star(m.x + 5, m.y - 12, 4, 1, 3, 0xffffff).setDepth(m.y + 1).setVisible(false);
      this.tweens.add({ targets: brillo, alpha: 0.1, scale: 0.4, duration: 500, yoyo: true, repeat: -1 });
      const nombre = this.add.text(m.x, m.y + 2, m.nombre, { ...TEXTO, fontSize: '8px', color: '#f2c14e' }).setOrigin(0.5, 0).setDepth(3000).setVisible(false);
      return { ...m, img, brillo, nombre };
    });

    // Cultivos visibles dentro del invernadero.
    const inv = this.edificios.find(e => e.id === 'invernadero');
    this.plantas = [-24, 0, 24].map(dx => this.add.image(inv.x + dx, inv.y + 12, 'brote').setOrigin(0.5, 1).setDepth(inv.y + 21).setVisible(false));

    this.sombra = this.add.ellipse(0, 0, 12, 4, 0x2a1410, 0.45);
    this.jugador = this.add.image(INICIO.x, INICIO.y, 'astro0').setOrigin(0.5, 1);
    this.aviso = this.add.text(0, 0, '', { ...TEXTO, color: '#f2c14e' }).setOrigin(0.5, 0).setDepth(3002);
    this.bruma = this.add.rectangle(0, 0, 10000, 10000, 0xd2691e, 0).setScrollFactor(0).setDepth(4000);
    this.capaNoche = this.add.rectangle(0, 0, 10000, 10000, 0x14204a, 0).setScrollFactor(0).setDepth(3990); // luz del día

    const cam = this.cameras.main;
    cam.setBounds(0, 0, W, H).startFollow(this.jugador, true, 0.12, 0.12).setRoundPixels(true);
    this.ajustarZoom();
    this.scale.on('resize', () => this.ajustarZoom());

    this.teclas = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT');
    this.input.keyboard.on('keydown-E', () => this.interactuar());
    this.input.on('pointerdown', (p, sobre) => {
      if (sobre.length || modalAbierto() || juegoDetenido(this.j)) return;
      this.destino = { x: p.worldX, y: p.worldY };
      this.pendiente = null;
    });

    this.time.addEvent({ delay: 300, loop: true, callback: () => this.refrescar() });
    const nave = EDIFICIOS[0];
    this.time.addEvent({ delay: 380, loop: true, callback: () => {
      if (this.j.s.cohete.motor) return;
      const humo = this.add.rectangle(nave.x + 10 + Math.random() * 6, nave.y + 22, 3, 3, 0x9a96a0, 0.8).setDepth(nave.y + 30);
      this.tweens.add({ targets: humo, y: humo.y - 34, x: humo.x + (Math.random() * 14 - 7), alpha: 0, scale: 3, duration: 2000, onComplete: () => humo.destroy() });
    } });
    this.prepararMinimapa();
    this.dibujarRetrato();
    this.refrescar();
  }

  // Rocas y cristales repartidos sin tapar edificios ni el cráter.
  decorar() {
    const rnd = semilla(5), libres = [...EDIFICIOS, ...MATERIALES, INICIO, { x: 600, y: 300 }];
    const lejos = (x, y) => libres.every(e => Math.hypot(e.x - x, e.y - y) > 75)
      && ((x - CRATER.x) / (CRATER.rx + 30)) ** 2 + ((y - CRATER.y) / (CRATER.ry + 25)) ** 2 > 1;
    const poner = (n, claves) => {
      for (let i = 0, puestos = 0; i < 400 && puestos < n; i++) {
        const x = 50 + rnd() * (W - 100), y = 60 + rnd() * (H - 110);
        if (!lejos(x, y)) continue;
        this.add.image(x, y, claves[(rnd() * claves.length) | 0]).setOrigin(0.5, 1).setDepth(y);
        puestos++;
      }
    };
    poner(26, ['roca1', 'roca2', 'roca2', 'roca3', 'roca3']);
    poner(8, ['rocaGrupo']);
    poner(6, ['cristalA', 'cristalB']);
    this.add.image(608, 300, 'tanque').setOrigin(0.5, 1).setDepth(300);
    // Cajas de suministros que sobrevivieron al choque.
    for (const [x, y] of [[222, 282], [236, 290], [214, 296], [118, 300]]) this.add.image(x, y, 'caja').setOrigin(0.5, 1).setDepth(y);
  }

  // Nueva partida o partida cargada: el astronauta vuelve a la base.
  reiniciar() {
    this.jugador.setCrop();
    this.alRefugio(); // empiezas en la puerta de tu refugio (la Nave, o la sala si ya existe)
    this.refrescar();
  }

  // Refugios con aire: la Nave siempre; el Hábitat solo cuando la sala está construida.
  refugioCercano() {
    return this.edificios.find(e => (e.id === 'nave' || (e.id === 'habitat' && this.j.s.sala))
      && Math.hypot(this.pos.x - e.puerta.x, this.pos.y - e.puerta.y) < 32);
  }

  // Aire del traje: afuera baja cada segundo; en un refugio se recarga usando oxígeno de la base.
  respirar(dt) {
    const s = this.j.s, c = this.j.datos.config.traje, refugio = this.refugioCercano();
    if (refugio) {
      const sube = Math.min(c.max - s.traje, c.recarga * dt / 1000);
      if (sube > 0 && s.o2 > 0) { s.traje += sube; s.o2 = Math.max(0, s.o2 - sube * c.o2PorSegundo); this.recargando = true; }
    } else {
      s.traje -= dt / 1000 * cuerpo(s, this.j.datos.config).traje;
      // Afuera, sin el techo de la base, la radiación sube poco a poco (desde la Etapa 5).
      if (!s.etapa) s.dosis = Math.min(100, s.dosis + this.j.datos.config.radiacion.afueraPorMinuto * dt / 60000);
      if (s.traje <= c.max * 0.3 && !this.avisoAire) { this.avisoAire = true; rego('⚠️ ¡Queda poco aire en el traje! Ve a la puerta de la Nave para recargarlo.'); }
      if (s.traje <= 0) this.sinAire();
    }
    if (s.traje > c.max * 0.3) this.avisoAire = false;
    this.enRefugio = refugio;
    if (this.time.now > (this.proxTraje || 0)) {
      this.proxTraje = this.time.now + 200;
      actualizarTraje(this.j, !!refugio);
      actualizarHora(this.j);
      if (this.recargando) { this.recargando = false; render(this.j); }
    }
  }

  // Etapa 1: la batería de emergencia baja 1% cada 4 segundos (config.arranque) hasta que instales el panel solar.
  emergencia(dt) {
    const s = this.j.s;
    if (s.etapa !== 'emergencia') return;
    s.bateria = Math.max(0, s.bateria - this.j.datos.config.arranque.bateriaPorSegundo * dt / 1000);
    if (this.time.now > (this.proxSirena || 0)) { this.proxSirena = this.time.now + 1300; sfx('alarma'); }
    const el = document.getElementById('alarma-bat');
    if (el) el.textContent = `${Math.ceil(s.bateria)}%`;
    if (this.time.now > (this.proxRender || 0)) { this.proxRender = this.time.now + 1000; render(this.j); }
    if (s.bateria <= 0) colapso(this.j);
  }

  // Misión 1: recoger silicio, cobre y aluminio al pasar encima.
  recogerMateriales() {
    const s = this.j.s;
    if (s.etapa !== 'emergencia') return;
    s.recogidos = s.recogidos || {};
    for (const m of this.materiales) {
      if (s.recogidos[m.id] || Math.hypot(m.x - this.pos.x, m.y - this.pos.y) > 14) continue;
      s.recogidos[m.id] = true;
      m.img.setVisible(false); m.brillo.setVisible(false); m.nombre.setVisible(false);
      sfx('recoger');
      const t = this.add.text(m.x, m.y - 14, `+ ${m.icono} ${m.nombre}`, { ...TEXTO, fontSize: '10px' }).setOrigin(0.5).setDepth(3005);
      this.tweens.add({ targets: t, y: t.y - 18, alpha: 0, duration: 1200, onComplete: () => t.destroy() });
      const listos = ['silicio', 'cobre', 'aluminio'].every(k => s.recogidos[k]);
      rego(listos ? `${m.dato} ¡Ya tienes los 3! Ve al 🛠️ Taller a armar el panel.` : m.dato);
      render(this.j);
    }
  }

  // Etapa 5: alerta de tormenta solar en tiempo real el día de un evento DONKI (a media jornada).
  vigilarSol() {
    const s = this.j.s;
    if (s.etapa || s.fin || (s.hora || 0) < this.j.datos.config.tormentaSolar.horaAlerta) return;
    const ev = s.eventosSolares.find(e => e.sol === s.sol && !e.resuelto);
    if (ev) { ev.resuelto = true; tormentaSolar(this.j, ev); }
  }

  // El día avanza solo: al llegar las 21:00 empieza la noche (Consejo de Misión).
  avanzarReloj(dt) {
    const s = this.j.s;
    if (s.etapa || s.fin) return;
    s.hora = Math.min(1, (s.hora || 0) + dt / 1000 / this.j.datos.config.dia.duracionSeg);
    if (s.hora >= 0.85 && !this.avisoNoche) {
      this.avisoNoche = true;
      rego('🌇 Está anocheciendo. A las 21:00 la base pasa la noche y se reúne el Consejo de Misión. ¡Vuelve al refugio!');
    }
    if (s.hora >= 1 && !this.durmiendo) {
      this.durmiendo = true;
      Promise.resolve(terminarSol(this.j)).finally(() => { this.durmiendo = false; this.avisoNoche = false; });
    }
  }

  // Sin aire: REGO te arrastra al refugio. Cuesta una acción y un poco de oxígeno.
  sinAire() {
    const s = this.j.s, c = this.j.datos.config;
    s.traje = c.traje.max;
    s.ap = Math.max(0, s.ap - 1);
    s.o2 = Math.max(0, s.o2 - 3);
    this.alRefugio();
    render(this.j);
    rego('🚨 ¡Te quedaste sin aire en el traje! REGO te arrastró al refugio y perdiste 1 acción. En Marte no se puede respirar: el aire es casi todo CO₂.');
  }

  alRefugio() {
    const ref = this.edificios.find(e => e.id === (this.j.s.sala ? 'habitat' : 'nave'));
    this.pos = { ...ref.puerta };
    this.vel = { x: 0, y: 0 };
    this.destino = null; this.pendiente = null;
    this.cameras.main.centerOn(this.pos.x, this.pos.y);
  }

  // Al amanecer despiertas dentro del refugio.
  alAmanecer() { if (this.jugador) { this.alRefugio(); this.refrescar(); } }

  ajustarZoom() {
    const { width, height } = this.scale.gameSize;
    this.cameras.main.setZoom(Math.max(1, Math.min(width / 480, height / 300)));
  }

  irA(e) {
    if (modalAbierto() || juegoDetenido(this.j)) return;
    const ed = this.edificios.find(x => x.id === e.id);
    this.destino = { ...ed.puerta };
    this.pendiente = ed;
  }

  cercano() {
    let mejor = null, dmin = 30;
    for (const e of this.edificios) {
      const d = Phaser.Math.Distance.Between(this.pos.x, this.pos.y, e.puerta.x, e.puerta.y);
      if (d < dmin) { dmin = d; mejor = e; }
    }
    return mejor;
  }

  interactuar() {
    const e = this.cercano();
    if (e && !modalAbierto() && !juegoDetenido(this.j)) abrirEdificio(this.j, e.id);
  }

  refrescar() {
    const { s, datos: d } = this.j;
    for (const e of this.edificios) {
      const cerrado = bloqueo(e.id, s);
      e.alerta.setVisible(!cerrado && !s.fin && necesitaAtencion(e.id, s, d));
      e.candado.setVisible(!!cerrado);
      if (e.id !== 'energia') e.img.setTint(cerrado ? 0x6a5656 : 0xffffff);
      // Desbloqueo: sonido y aviso flotante.
      if (e.cerrado && !cerrado && this.listo) {
        sfx('desbloqueo');
        const t = this.add.text(e.x, e.y - 10, '🔓 ¡Desbloqueado!', { ...TEXTO, fontSize: '10px', color: '#9fe08a' }).setOrigin(0.5).setDepth(3005);
        this.tweens.add({ targets: t, y: t.y - 24, alpha: 0, duration: 2200, onComplete: () => t.destroy() });
      }
      e.cerrado = !!cerrado;
      // Barra de progreso con puntos debajo del nombre.
      const pr = progreso(e.id, s, d), g = e.puntos.clear();
      if (pr) {
        const [hechos, total] = pr, w = total * 6 + 8, x0 = e.x - w / 2, y0 = e.base + 14;
        g.fillStyle(0x2a1416, 0.9).fillRoundedRect(x0, y0, w, 8, 3).lineStyle(1, cerrado ? 0x5a3a3a : 0x8a3a2a).strokeRoundedRect(x0, y0, w, 8, 3);
        for (let i = 0; i < total; i++) g.fillStyle(i < hechos ? 0xf2e3c4 : 0x5a3a3a, 1).fillCircle(x0 + 7 + i * 6, y0 + 4, 2);
      }
    }
    this.listo = true;
    revisarDemo(this.j);
    for (const m of this.materiales) {
      const ver = s.etapa === 'emergencia' && !s.recogidos?.[m.id];
      m.img.setVisible(ver); m.brillo.setVisible(ver); m.nombre.setVisible(ver);
    }
    this.edificios.find(e => e.id === 'habitat').img.setTexture(s.sala ? 'habitat' : 'habitat-obra');
    this.panel.setTexture(s.panel ? 'energia' : 'energia-obra');
    this.edificios.find(e => e.id === 'planta').img.setTexture(s.plantaAgua ? 'planta' : 'planta-rota');
    document.body.classList.toggle('emergencia', s.etapa === 'emergencia' && !s.fin && !document.body.classList.contains('en-portada'));
    s.parcelas.forEach((p, i) => {
      const img = this.plantas[i];
      if (!p) return img.setVisible(false);
      const c = d.crops.cultivos.find(x => x.id === p.id);
      img.setVisible(true).setTexture(p.hongo ? 'hongo' : p.dias < c.dias / 2 ? 'brote' : p.id).setScale(p.dias >= c.dias || p.hongo ? 1 : 0.75);
    });
    this.dibujarMinimapa();
  }

  prepararMinimapa() {
    const cv = document.getElementById('minimapa');
    if (!cv) return;
    cv.onclick = ev => {
      const b = cv.getBoundingClientRect();
      this.destino = { x: (ev.clientX - b.left) / b.width * W, y: (ev.clientY - b.top) / b.height * H };
      this.pendiente = null;
    };
  }

  dibujarMinimapa() {
    const cv = document.getElementById('minimapa');
    if (!cv || getComputedStyle(cv).display === 'none') return;
    const g = cv.getContext('2d'), sx = cv.width / W, sy = cv.height / H;
    g.imageSmoothingEnabled = false;
    g.drawImage(this.textures.get('suelo').getSourceImage(), 0, 0, cv.width, cv.height);
    for (const e of this.edificios) {
      g.fillStyle = e.alerta.visible ? '#f2c14e' : '#f2e3c4';
      g.fillRect(e.x * sx - 3, e.y * sy - 3, 6, 6);
    }
    const v = this.cameras.main.worldView;
    g.strokeStyle = 'rgba(255,255,255,.5)';
    g.strokeRect(v.x * sx, v.y * sy, v.width * sx, v.height * sy);
    g.fillStyle = '#7fd3ff';
    g.beginPath(); g.arc(this.pos.x * sx, this.pos.y * sy, 3.5, 0, 7); g.fill();
  }

  dibujarRetrato() {
    const cv = document.getElementById('retrato');
    if (!cv) return;
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(this.textures.get('astro0').getSourceImage(), 1, 0, 14, 14, 4, 2, cv.width - 8, cv.height - 8);
  }

  update(_, dt) {
    const s = this.j.s;
    this.bruma.setAlpha(s.tormentaPolvo > 0 ? 0.28 : 0);
    this.panel.setTint(Phaser.Display.Color.GetColor(255, 255 - (s.polvo * 120 | 0), 255 - (s.polvo * 220 | 0)));
    this.luz.setVisible(s.cohete.antena && (s.etapa !== 'antena' || s.antenaOn) && this.time.now % 1000 < 500);

    let dx = 0, dy = 0;
    const quieto = modalAbierto() || juegoDetenido(this.j);
    if (!quieto) {
      const k = this.teclas;
      dx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
      dy = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
      if (dx || dy) { this.destino = null; this.pendiente = null; }
      else if (this.destino) {
        const ox = this.destino.x - this.pos.x, oy = this.destino.y - this.pos.y, dist = Math.hypot(ox, oy);
        if (dist < 3) {
          this.destino = null;
          if (this.pendiente) { const e = this.pendiente; this.pendiente = null; abrirEdificio(this.j, e.id); }
        } else { dx = ox / dist; dy = oy / dist; }
      }
    }

    // Velocidad con inercia: en tierra responde al instante; en el agua acelera y frena despacio.
    const fis = this.lago.fisica(this.pos.x, this.pos.y);
    let ox = 0, oy = 0;
    if (dx || dy) {
      const n = Math.hypot(dx, dy), vmax = 95 * (this.j.ajustes?.velocidad || 1) * fis.velocidad * cuerpo(s, this.j.datos.config).velocidad;
      ox = dx / n * vmax; oy = dy / n * vmax;
      if (dx) this.jugador.setFlipX(dx < 0);
    }
    const k = 1 - Math.pow(fis.inercia, dt / 1000);
    this.vel.x += (ox - this.vel.x) * k;
    this.vel.y += (oy - this.vel.y) * k;
    this.pos.x = Phaser.Math.Clamp(this.pos.x + this.vel.x * dt / 1000, 40, W - 40);
    this.pos.y = Phaser.Math.Clamp(this.pos.y + this.vel.y * dt / 1000, 50, H - 30);
    const moviendo = Math.hypot(this.vel.x, this.vel.y) > 8;
    this.jugador.setTexture(moviendo ? `astro${Math.floor(this.time.now / (fis.dentro ? 230 : 140)) % 2}` : 'astro0');
    this.lago.visual(this.pos, this.vel, dt, this.jugador, fis);
    this.jugador.setDepth(this.pos.y + 1);
    this.sombra.setVisible(!fis.dentro).setPosition(this.pos.x, this.pos.y - 1).setDepth(this.pos.y);

    if (!quieto) { this.respirar(dt); this.emergencia(dt); this.avanzarReloj(dt); this.recogerMateriales(); tickLlamada(this.j, dt); tickCiclo(this.j, dt); this.vigilarSol(); }
    // Luz del día: amanecer y atardecer más oscuros (en Marte el atardecer se ve azulado).
    const h = s.hora || 0;
    this.capaNoche.setAlpha(h < 0.1 ? (0.1 - h) / 0.1 * 0.3 : h > 0.72 ? (h - 0.72) / 0.28 * 0.5 : 0);
    // Pasos según el suelo.
    if (!quieto && (dx || dy) && this.time.now > (this.proxPaso || 0)) {
      this.proxPaso = this.time.now + (fis.dentro ? 380 : fis.hielo ? 260 : 300);
      sfx(fis.dentro ? 'pasoAgua' : fis.hielo ? 'pasoHielo' : 'paso');
    }
    const c = quieto ? null : this.cercano();
    const ref = this.enRefugio ? (this.j.s.traje >= this.j.datos.config.traje.max - 0.5 ? ' · 🏠 aire lleno' : ' · 🏠 recargando aire') : '';
    this.aviso.setText(c ? `[E] o toca: ${c.nombre}${ref}` : '').setPosition(this.pos.x, this.pos.y + 3);
  }
}
