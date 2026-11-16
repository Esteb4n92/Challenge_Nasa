import { planificarEventos } from './donki.js';

export function crearEstado(d) {
  const c = d.config;
  return {
    sol: 1,
    ap: c.accionesPorSol,
    ...structuredClone(c.inicial),
    polvo: 0,
    tormentaPolvo: 0,
    filtro: 100,
    repuestosFiltro: 3,
    reciclador: c.reciclador.inicial,
    refugio: false,
    asignacion: { soporte: 100, moxie: 100, invernadero: 100 }, // % de lo que necesita cada sistema
    moxieACombustible: 0, // % del O₂ de MOXIE que va al combustible
    cohete: Object.fromEntries(d.rocket.partes.map(p => [p.id, false])),
    parcelas: [null, null, null], // { id, dias, hongo }
    mensajes: [], // { tipo, llegaSol }
    pronostico: false,
    planos: false,
    eventosSolares: planificarEventos(d.donki, c.solesVentana),
    emergencias: 0,
    traje: c.traje.max, // segundos de aire del traje en la base
    sala: false, // sala presurizada construida
    etapa: 'emergencia', // Etapa 1: sin paneles, batería de emergencia bajando en tiempo real
    recogidos: { silicio: false, cobre: false, aluminio: false }, // Misión 1: materiales del panel
    panelArmado: false, // Panel Solar Artesanal #1 ensamblado en el Taller
    panel: false, // panel solar instalado
    hora: 0, // avance del día: 0 = amanecer (06:00), 1 = anochecer (21:00)
    vistos: {}, // materiales ya descubiertos (desbloquean su casilla del inventario)
    lagoCongelado: false,
    plantaAgua: false, // filtro + transformador de agua instalados (hasta entonces el lago está helado)
    plantaOff: false, // planta apagada para ahorrar batería
    demoVista: false, // ya se mostró la pantalla de fin de la demo
    nocheFria: false,
    fin: null, // 'despegue' | 'ventana'
  };
}
