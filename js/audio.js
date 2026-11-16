// Audio sintetizado con Web Audio: no usa archivos. Empieza tras el primer toque o tecla (regla de los navegadores).
let ctx = null, maestro = null, blanco = null, viento = null, motorOsc = null, motorGan = null;
const aj = () => window.juego?.ajustes || {};

export function iniciarAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  maestro = ctx.createGain();
  maestro.connect(ctx.destination);
  blanco = crearRuido(1, false);
  volumen();
}

export function volumen() {
  if (maestro) maestro.gain.value = aj().sonido === false ? 0 : (aj().volumen ?? 0.6);
}

// Ruido blanco o café (más grave, como viento).
function crearRuido(seg, cafe) {
  const b = ctx.createBuffer(1, ctx.sampleRate * seg, ctx.sampleRate), d = b.getChannelData(0);
  let ult = 0;
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1;
    if (cafe) { ult = (ult + 0.02 * w) / 1.02; d[i] = ult * 3.5; } else d[i] = w;
  }
  return b;
}

function tono(frec, dur, tipo = 'sine', vol = 0.2, hasta = null, retraso = 0) {
  const t = ctx.currentTime + retraso, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = tipo;
  o.frequency.setValueAtTime(frec, t);
  if (hasta) o.frequency.exponentialRampToValueAtTime(hasta, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(maestro);
  o.start(t); o.stop(t + dur + 0.05);
}

function soplo(dur, frec, vol = 0.3, filtro = 'lowpass', q = 1) {
  const t = ctx.currentTime, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = blanco;
  f.type = filtro; f.frequency.value = frec; f.Q.value = q;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(maestro);
  s.start(t); s.stop(t + dur);
}

// Sonido de agua: ruido que entra suave (sin golpe), con filtro que baja de agudo a grave, y burbujas.
function agua(dur, vol, burbujas) {
  const t = ctx.currentTime, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = blanco;
  f.type = 'lowpass'; f.Q.value = 0.7;
  f.frequency.setValueAtTime(2600, t);
  f.frequency.exponentialRampToValueAtTime(350, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + dur * 0.25);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(maestro);
  s.start(t); s.stop(t + dur);
  for (let i = 0; i < burbujas; i++) {
    const f0 = 350 + Math.random() * 450;
    tono(f0, 0.07 + Math.random() * 0.05, 'sine', vol * 0.35, f0 * 2.2, dur * 0.2 + Math.random() * dur * 0.6);
  }
}

// Pisada sobre la grava marciana: golpe grave de la bota + crujido de arena. Cada paso suena un poco distinto.
let pie = 1;
function pisada() {
  pie = -pie;
  const v = 1 + pie * 0.08 + (Math.random() - 0.5) * 0.1;
  tono(110 * v, 0.09, 'sine', 0.22, 55);
  soplo(0.11, 1300 * v, 0.32, 'bandpass', 1.4);
  soplo(0.05, 4200, 0.06, 'highpass');
}

const SFX = {
  abrir: () => tono(520, 0.08, 'square', 0.05, 780),
  click: () => tono(880, 0.05, 'square', 0.04),
  exito: () => { tono(660, 0.12, 'triangle', 0.15); tono(990, 0.2, 'triangle', 0.15, null, 0.1); },
  error: () => tono(170, 0.25, 'sawtooth', 0.07, 110),
  recoger: () => [523, 659, 784].forEach((f, i) => tono(f, 0.1, 'square', 0.06, null, i * 0.06)),
  paso: () => pisada(),
  pasoHielo: () => { soplo(0.06, 3400, 0.22, 'highpass'); tono(2200 + Math.random() * 600, 0.03, 'square', 0.025); tono(150, 0.05, 'sine', 0.12, 90); },
  pasoAgua: () => agua(0.32, 0.09, 1),
  chapoteo: () => agua(0.7, 0.22, 4),
  alarma: () => { tono(880, 0.15, 'square', 0.06); tono(660, 0.15, 'square', 0.06, null, 0.18); },
  colapso: () => tono(320, 1.5, 'sawtooth', 0.12, 40),
  noche: () => [392, 330, 262].forEach((f, i) => tono(f, 0.6, 'sine', 0.12, null, i * 0.25)),
  amanecer: () => [262, 330, 392, 523].forEach((f, i) => tono(f, 0.45, 'sine', 0.1, null, i * 0.18)),
  golpe: () => { soplo(0.25, 300, 0.4); tono(90, 0.2, 'sine', 0.2, 50); },
  viento: () => soplo(1.2, 600, 0.25, 'bandpass', 0.6),
  picar: () => { soplo(0.06, 4000, 0.1, 'highpass'); tono(1400, 0.04, 'square', 0.03); },
  rover: () => tono(70, 1.4, 'sawtooth', 0.07, 160),
  desbloqueo: () => [523, 784, 1047].forEach((f, i) => tono(f, 0.25, 'triangle', 0.12, null, i * 0.1)),
};

export function sfx(nombre) {
  if (!ctx || aj().sonido === false) return;
  if (ctx.state === 'suspended') ctx.resume();
  SFX[nombre]?.();
}

// Ambiente: viento marciano (ruido café que sube y baja) y un zumbido grave muy suave.
export function ambiente(intensidad = 0.5) {
  if (!ctx) return;
  if (!viento) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), lfo = ctx.createOscillator(), lg = ctx.createGain();
    s.buffer = crearRuido(4, true); s.loop = true;
    f.type = 'lowpass'; f.frequency.value = 500;
    lfo.frequency.value = 0.07; lg.gain.value = 260;
    lfo.connect(lg).connect(f.frequency);
    viento = ctx.createGain(); viento.gain.value = 0;
    s.connect(f).connect(viento).connect(maestro);
    const zumbido = ctx.createOscillator(), zg = ctx.createGain();
    zumbido.frequency.value = 55; zg.gain.value = 0.03;
    zumbido.connect(zg).connect(viento);
    s.start(); lfo.start(); zumbido.start();
  }
  viento.gain.setTargetAtTime(intensidad * 0.35, ctx.currentTime, 1.5);
}

// Motor del Rover: más agudo cuanto más rápido va.
export function motor(rapidez) {
  if (!ctx) return;
  if (!motorOsc) {
    motorOsc = ctx.createOscillator(); motorOsc.type = 'sawtooth';
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 420;
    motorGan = ctx.createGain(); motorGan.gain.value = 0;
    motorOsc.connect(f).connect(motorGan).connect(maestro);
    motorOsc.start();
  }
  motorOsc.frequency.setTargetAtTime(45 + rapidez * 0.6, ctx.currentTime, 0.1);
  motorGan.gain.setTargetAtTime(rapidez > 0 ? 0.04 + Math.min(0.06, rapidez / 2500) : 0, ctx.currentTime, 0.15);
}
