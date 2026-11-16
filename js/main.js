import { cargarDatos } from './datos.js';
import { crearEstado } from './state.js';
import { BaseScene } from './scenes/base.js';
import { MisionScene } from './scenes/mision.js';
import { initUI, render } from './ui/hud.js';
import { initPaneles } from './ui/paneles.js';
import { cargarAjustes, initMenu, mostrarPortada } from './ui/menu.js';
import { iniciarAudio, ambiente } from './audio.js';
import { initLlamada } from './ui/antena.js';
import { initCiclo } from './ui/ciclo.js';
import { tr, traducirPagina, vigilarPagina } from './i18n.js';

traducirPagina();
vigilarPagina();
// Los textos que dibuja Phaser (nombres de edificios, avisos) también se traducen.
const setTextOriginal = Phaser.GameObjects.Text.prototype.setText;
Phaser.GameObjects.Text.prototype.setText = function (v) { return setTextOriginal.call(this, typeof v === 'string' ? tr(v) : v); };

const datos = await cargarDatos();
const juego = { datos, s: crearEstado(datos), dificultad: 'normal', pausa: false };
window.juego = juego; // para depurar desde la consola

cargarAjustes(juego);
initUI(juego);
initPaneles(juego);
initMenu(juego);
initLlamada(juego);
initCiclo(juego);
render(juego);

juego.game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  pixelArt: true,
  backgroundColor: '#1a0f1f',
  scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
  scene: [new BaseScene(juego), new MisionScene(juego)],
});

mostrarPortada(juego);

// El navegador solo deja sonar audio después de que el jugador toque o pulse algo.
const arrancarAudio = () => { iniciarAudio(); ambiente(0.5); };
document.addEventListener('pointerdown', arrancarAudio, { once: true });
document.addEventListener('keydown', arrancarAudio, { once: true });
