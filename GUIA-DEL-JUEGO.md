# 🚀 Beyond Survival — Guía del juego

> **"Un error... una nueva vida."**
> Juego web educativo para el concurso de la NASA, pensado para niños de **7 a 12 años**.
> Hecho con datos abiertos de la NASA. Funciona en español e inglés.

---

## Índice
1. [La historia](#1-la-historia)
2. [Cómo abrir el juego](#2-cómo-abrir-el-juego)
3. [Controles](#3-controles)
4. [La pantalla (HUD)](#4-la-pantalla-hud)
5. [Las reglas de oro](#5-las-reglas-de-oro)
6. [Recursos e indicadores](#6-recursos-e-indicadores)
7. [Tu cuerpo: hambre, sed y radiación](#7-tu-cuerpo-hambre-sed-y-radiación)
8. [Un día en Marte (un "sol")](#8-un-día-en-marte-un-sol)
9. [El camino del juego: misiones y etapas](#9-el-camino-del-juego-misiones-y-etapas)
10. [Edificios de la base](#10-edificios-de-la-base)
11. [Misiones con el Rover](#11-misiones-con-el-rover)
12. [Eventos y peligros](#12-eventos-y-peligros)
13. [Cómo ganar](#13-cómo-ganar)
14. [Fin de la demo](#14-fin-de-la-demo)
15. [Consejos para no perder](#15-consejos-para-no-perder)
16. [Menú, configuración y guardado](#16-menú-configuración-y-guardado)
17. [Datos reales de la NASA en el juego](#17-datos-reales-de-la-nasa-en-el-juego)
18. [Tabla de números (balance)](#18-tabla-de-números-balance)
19. [Cómo se construyó: historial de cambios](#19-cómo-se-construyó-historial-de-cambios)
20. [Para desarrolladores](#20-para-desarrolladores)

---

## 1. La historia

La nave **Starship V3** despega de la Tierra con una misión sencilla: llegar a Marte, tomar muestras y volver a casa.
Al entrar a Marte, una **tormenta de polvo** golpea la nave, una pieza se rompe y el motor falla.
La nave se estrella: **el generador principal se destruye y la antena se rompe**. Nadie en la Tierra puede oírte.

Estás varado. Solo queda un **30% de batería de emergencia**... y no trajiste paneles solares de repuesto.
Pero hay vehículos y módulos abandonados por todo el planeta. Con sus piezas, y con lo que aprendas sobre Marte, puedes **sobrevivir, reparar la nave y volver a casa** antes de que se cierre la **ventana de lanzamiento** (30 soles).

Te acompaña **REGO 🤖**, tu robot ayudante: te da consejos y te avisa de los peligros.

---

## 2. Cómo abrir el juego

| Dónde | Cómo |
|---|---|
| **En tu computadora** | Doble clic en **`jugar.bat`**. Se abre el navegador en `http://127.0.0.1:8000`. Deja abierta la ventana negra mientras juegas. |
| **Desde otro equipo o celular** (misma red WiFi) | Usa la dirección que muestra la ventana de `jugar.bat`, por ejemplo `http://192.168.1.8:8000`. |
| **En internet** | Sube la carpeta a GitHub y activa **GitHub Pages** (Settings → Pages → rama `main`, carpeta `/root`). |

> ⚠️ Abrir `index.html` con doble clic **no funciona**: el navegador bloquea los archivos del juego por seguridad. La página te avisa y te manda a `jugar.bat`.

---

## 3. Controles

| Acción | Teclado | Táctil / ratón |
|---|---|---|
| Moverte | Flechas o **W A S D** | Tocar el mapa o el minimapa |
| Entrar a un edificio | **E** cerca de la puerta | Tocar el edificio |
| Subir o bajar del Rover (misiones) | **E** | Botón 🚙 |
| Volver a la base (misiones) | **R** | Botón 🏠 |
| Pausa / cerrar una ventana | **Esc** | Botón ⏸ / **✕** |
| Aprender qué es algo | — | Tocar cualquier barra o casilla |
| Dormir (terminar el sol) | — | Botón 🌙 **Dormir ya** |

---

## 4. La pantalla (HUD)

- **Arriba a la izquierda:**
  - tu retrato y las **barras** de oxígeno, agua, energía, comida y radiación;
  - el **aire del traje**;
  - el **sol y la hora**, y tus **acciones** (●●●○);
  - el recuadro **📋 Tu objetivo**.
- **Pistas 👉:** cuando una barra está en peligro, debajo aparece una pista con la mejor forma de recuperarla **ahora mismo** (solo en las 2 barras más urgentes).
- **Arriba a la derecha:** el **minimapa**. Tócalo para caminar hasta ese punto.
- **Abajo:** el mensaje de **REGO**, el **inventario** (metal, cables, chips, filtros, combustible y partes de la nave) y los botones **Menú**, **NASA** y **Dormir ya**.
- **Sobre los edificios:**
  - **❗** necesita atención;
  - **🔒** bloqueado (REGO te dice cómo abrirlo);
  - **puntitos** de progreso.

---

## 5. Las reglas de oro

1. **Ninguna decisión es gratis.** Cada opción cuesta algo: energía, agua, comida, acciones, materiales o radiación. Es la idea central del concurso: en el espacio todo se planifica.
2. **No hay "game over".** Si un recurso llega a 0, REGO usa las reservas de la nave: lo repone a 20, pero **pierdes un sol**.
3. **La energía es vida.** Si la **batería llega a 0%** la base se congela y vuelves a intentarlo desde el último amanecer.
4. **El tiempo corre.** Tienes **30 soles** (en dificultad normal) antes de que la Tierra y Marte se alejen.
5. **Afuera no se puede respirar.** El aire de Marte es casi todo CO₂: fuera de la base gastas el aire del traje.
6. **El Sol carga la base, pero a ti te cargan la comida y el agua.**

---

## 6. Recursos e indicadores

Todos van de **0 a 100**.

| Barra | Qué es | Sube con | Baja con |
|---|---|---|---|
| 🫁 **Oxígeno** | El aire que respiras | MOXIE (si tiene energía) y un poco las plantas | Respirar (−8 por sol), recargar el traje, mandar oxígeno al combustible, filtro de CO₂ saturado |
| 💧 **Agua** | Para beber, regar, hacer combustible y protegerte | Reciclador (recupera 70%), Planta de agua (+5/sol), misión del hielo, vaciar los muros | Beber (−8 por sol, menos lo reciclado), regar (2 por planta), combustible, llenar los muros (−20) |
| ⚡ **Energía** | La batería de la base | Paneles solares (hasta 34 por sol), sistema eléctrico de la nave (+4) | Soporte vital (8), MOXIE (8), invernadero (4), Planta de agua (3), antena, escudos, polvo |
| 🥬 **Comida** | Tus raciones | Cosechar en el Invernadero | Comer (−6 por sol), noches frías |
| ☢️ **Radiación** | La dosis que acumulas. **Nunca baja.** | Cada sol (+2), caminar afuera (+1 por minuto), misiones (+4 por minuto), tormentas solares | Nunca baja: solo puedes **protegerte** |

**Materiales** (se consiguen con el Rover): 🔩 metal, 🔌 cables, 💾 chips. También 🧰 filtros de repuesto (empiezas con 3) y ⛽ combustible.

> 💡 **Toca cualquier barra** para ver qué es, con qué sube y baja, y la lista **"👉 Ahora puedes"** con todo lo que ya puedes hacer para recuperarla.

---

## 7. Tu cuerpo: hambre, sed y radiación

El astronauta no se carga con los paneles solares. Su estado depende de la comida, el agua y la radiación:

| Situación | Efecto |
|---|---|
| ☢️ Dosis **45 o más** | El aire del traje se gasta **33% más rápido** |
| ☢️ Dosis **75 o más** | Amaneces **agotado**: **1 acción menos** cada sol |
| 🍽️ Comida **menos de 20** o 💧 agua **menos de 20** | Caminas **25% más lento** y el traje dura **25% menos** |

REGO te avisa cuando pasa alguna de estas cosas.

---

## 8. Un día en Marte (un "sol")

1. **Amanecer (06:00).** Despiertas en tu refugio con el traje lleno y **4 acciones**.
2. **De día.** El reloj avanza solo (unos 4 minutos reales). Caminas, usas edificios y sales con el Rover. Cada acción importante (reparar, plantar, limpiar, misiones...) gasta ⚙️ acciones.
3. **Anochecer (21:00) o "Dormir ya".** Se reúne el **Consejo de Misión**: una **carta** con un problema y dos opciones, y las dos cuestan algo.
4. **Aviso de congelación.** Si con tu reparto de energía la batería llegaría a 0%, REGO te ofrece el **modo ahorro**: apaga primero el invernadero, luego parte de MOXIE y al final el soporte vital.
5. **Noche (simulación).** Producen los paneles, se reparte la energía, respiras, comes, crecen las plantas, trabaja la Planta de agua, sube la radiación y llegan las tormentas.
6. **Resumen del sol** con todo lo que pasó, más un **dato real** de la NASA.
7. **Autoguardado** al amanecer. A veces llega una **tormenta de polvo** (ver [Eventos](#12-eventos-y-peligros)).

---

## 9. El camino del juego: misiones y etapas

```
Misión 1 ─► Misión 2 ─► Misión 3 ─► Etapa 4 + Etapa 5 ─► 🏅 FIN DE LA DEMO ─► (seguir) Reparar la nave y despegar
 Energía      Voz        Ciclo       Agua/Sala  Radiación
```

### 🚨 Misión 1 · Chatarra y Arena Marciana
- La batería está al **30%** y **baja 1% cada 4 segundos**: tienes unos 2 minutos.
- Recoge los 3 materiales que brillan cerca de la nave:
  - 🪨 **silicio**, en la arena;
  - 🔌 **cobre**, en los cables rotos;
  - 🔩 **aluminio**, en la compuerta.
- En el 🛠️ **Taller**, arrastra cada material a su lugar en el plano del panel:
  - silicio → celdas;
  - cobre → cables;
  - aluminio → marco.
- Lleva el panel a la zona de **Paneles solares** y colócalo: la batería sube al **50%**.
- ❌ Si la batería llega a 0%, reintentas.

### 📡 Misión 2 · Despertar la Voz
- Toca la **Antena** y conecta los cables por color (tienes 2 minutos).
- Encender la antena gasta **30 de batería**, y mientras está encendida sigue gastando.
- Haces una llamada de prueba a la NASA. El mensaje tarda **20 minutos en ir y 20 en volver** (en el juego, 1 segundo = 1 minuto).
- **Truco:** apaga la antena mientras el mensaje viaja y enciéndela justo antes de que llegue la respuesta.

### ♻️ Misión 3 · El Ciclo de la Vida
- Empiezas con 50 de agua y 45 de oxígeno, que bajan en tiempo real.
- Usa la energía con cuidado:
  - 💧 **Purificador**: +agua, gasta batería;
  - 🫧 **Generador de oxígeno (electrólisis)**: +oxígeno, gasta agua y batería;
  - 📡 **Antena**: no la necesitas, ¡apágala!
- **Meta:** mantener **agua y oxígeno por encima de 30%** durante **60 segundos**.
- ❌ Si el agua o el aire llegan a 0, reintentas.

### 💧 Etapa 4 · Saneamiento de Agua y Oxígeno
- **🏗️ Sala presurizada** (Hábitat). Cuesta 🔩3 🔌2 y 1 acción.
  - Es un refugio con aire: ahí recargas el traje.
  - Desbloquea el **Invernadero**.
- **🚰 Planta de agua** (junto al lago):
  - El lago está **congelado** hasta que la repares.
  - Cuesta 🔩2 🔌1 y 1 acción.
  - Arma la línea de agua en orden: 🔥 **Transformador** (derrite el hielo) → 🧽 **Filtro** (quita polvo y sales tóxicas) → 🛢️ **Tanque** (guarda el agua).
  - Después da **💧+5 por sol** y gasta **🔋3**. Se puede apagar.

### ☢️ Etapa 5 · Protección contra la Radiación
Empieza al terminar la Misión 3, al mismo tiempo que la Etapa 4. Las **tormentas solares** llegan como **alerta roja** a media jornada (ver [Eventos](#12-eventos-y-peligros)).

---

## 10. Edificios de la base

| Edificio | Para qué sirve | Se desbloquea |
|---|---|---|
| 🚀 **Starship V3** | Tu primer refugio (recarga el traje). Reparar las 6 partes y **despegar**. | Siempre |
| 🛠️ **Taller** | Armar el panel solar (Misión 1) | Siempre |
| ☀️ **Paneles solares / Centro de energía** | Instalar el panel, **limpiar el polvo** y repartir la energía (soporte vital, MOXIE, invernadero) | Siempre |
| 📡 **Antena** | Misión 2. Después: pedir **alertas solares** (avisan con 2 soles de anticipación) y **planos de navegación** (llegan al día siguiente) | Con el panel instalado |
| 🏠 **Hábitat** | Sala presurizada, **filtro de CO₂**, mejorar el **reciclador** (🔩2 💾1), llenar o vaciar los **muros de agua** | Tras la Misión 2 |
| ⚙️ **MOXIE** | Fabrica oxígeno con el CO₂ de Marte. Decides qué % va al **combustible**. | Tras la Misión 2 |
| 🚙 **Rover** | Salir a misiones por materiales e hielo | Tras la Misión 2 |
| 🌱 **Invernadero** | Sembrar y cosechar comida | Con la sala presurizada |
| 🚰 **Planta de agua** | Agua del lago cada sol | Tras la Misión 3 |

**Cultivos** (cada siembra cuesta 1 acción y 💧3):

| Cultivo | Tarda | Da |
|---|---|---|
| 🥗 Mizuna | 3 soles | 🥬+8 |
| 🥬 Lechuga roja | 4 soles | 🥬+12 |
| 🌱 Rábano | 5 soles | 🥬+15 |

Las plantas usan 💧2 por sol y dan un poco de oxígeno. Si al invernadero le falta energía, no crecen y pueden salirles **hongos 🍄**.

---

## 11. Misiones con el Rover

Sales a un mapa explorable. Manejas el Rover (gasta batería), te bajas a recoger cosas y vuelves antes de quedarte sin aire.
- Tienes **3 minutos** de misión. Después, la base pierde 1% de batería por segundo.
- El Rover tiene **carga máxima**: elige bien qué llevar.

| Misión | Cuesta | Aire | Carga | Qué hay |
|---|---|---|---|---|
| 🛰️ **Vehículo de carga abandonado** | 2 acciones, 🫁−6 | 150 s | 8 | 🔩 metal (pesa 2), 🔌 cables y 💾 chips (pesan 1). Batería vieja: **+15 de energía o 1 chip**. ⚠️ **Remolinos de polvo**. |
| 🧊 **Hielo del cráter** | 3 acciones, 🫁−7 | 160 s | 10 | Bloques de hielo (💧+8 cada uno, pesan 2). **Taladro**: 💧+25 pero 🔋−20. **Meteorito**: 🔩+2 pero más radiación. ⚠️ El hielo **resbala**. |

Afuera la radiación sube **+4 por minuto**.

---

## 12. Eventos y peligros

### ☢️ Tormentas solares (alerta roja)
- Están basadas en eventos **reales** de la base de datos **DONKI** de la NASA. Sin datos descargados, hay 6 simuladas: soles 5, 9, 12, 16, 20 y 25.
- Tienes **10 segundos** para decidir:

| Opción | Costo | Dosis recibida |
|---|---|---|
| 🛡️ Escudos | 🔋35 | +4 |
| 🪨 Cubrir con regolito | 2 acciones | 25% (y **protege en todas las tormentas siguientes**) |
| ⚠️ Arriesgarse | nada | **CME +40 / SEP +28** (la mitad con los muros de agua llenos) |

- Las **CME** se ven venir y REGO avisa antes; las **SEP** llegan sin aviso.

### 🌪️ Tormenta de polvo (al amanecer, 15% de probabilidad)
El panel produce **50% menos**. Tienes 10 segundos para apagar el **calentador** (hará frío) o el **purificador** (ese día no se recicla agua).

### 🃏 Cartas del Consejo de Misión (cada noche)
| Carta | Opción A | Opción B |
|---|---|---|
| 🌪️ Tormenta de polvo | Cubrir paneles (🔋−8) | Dejarlos (se llenan de polvo) |
| ⚙️ MOXIE hace ruido | Revisarla (🫁−6) | Forzarla (🔋−15) |
| 💧 Fuga de agua | Sellar (🔋−10) | Esperar (💧−12) |
| 🪨 Roca rojiza | Fundirla (🔋−15, 🔩+1) | Guardarla (nada) |
| 🌱 Plantas débiles | Luces extra (🔋−10, 🥬+4) | Ahorrar (🥬−3) |
| 🥶 Noche a −75 °C | Calefacción (🔋−12) | Abrigarse (🥬−4) |

Tras una noche fría, el lago puede amanecer congelado.

### Otros peligros
- **Polvo en los paneles:** +6% cada sol. Con 30% o más, conviene limpiar.
- **Filtro de CO₂:** se gasta 12% por sol. Por debajo de 30%, pierdes oxígeno extra.
- **Sin aire en el traje:** REGO te arrastra al refugio. Pierdes 1 acción y 🫁3.

---

## 13. Cómo ganar

**Juego completo:**
1. Repara las **6 partes** de la nave en la Starship V3:

| Parte | Costo | Qué desbloquea |
|---|---|---|
| 📡 Antena | 🔌2 💾1 | Hablar con la Tierra |
| ⚡ Sistema eléctrico | 🔌3 🔩1 | +4 de energía por sol |
| ⛽ Tanques de combustible | 🔩4 | Guardar combustible de MOXIE |
| 🛡️ Escudo térmico | 🔩3 💾1 | Resistir la entrada a la Tierra |
| 🔥 Motor | 🔩3 🔌2 💾1 | Poder despegar |
| 🧭 Computadora de navegación | 💾2 + **planos** (pídelos en la Antena) | La ruta a casa |

2. Llena **⛽35 de combustible**: en MOXIE manda parte del oxígeno al combustible (también usa agua).
3. Pulsa **🚀 ¡Despegar!** antes de que pasen los 30 soles.

**Estrellas al despegar:** 3 ⭐, menos 1 si tu dosis pasó de 60 y menos 1 si tuviste emergencias.
Si se cierra la ventana de lanzamiento, el rescate llegará en 26 meses... ¡inténtalo de nuevo!

| Dificultad | Soles | Acciones por sol |
|---|---|---|
| 🌱 Explorador (fácil) | 40 | 5 |
| 🚀 Astronauta (normal) | 30 | 4 |
| 🔥 Comandante (difícil) | 24 | 4 |

---

## 14. Fin de la demo

Al completar la **Etapa 4** (sala presurizada **y** Planta de agua) aparece **🎉 ¡Completaste la demo!**, con un **mensaje que cambia según cómo jugaste**:

- **Tu rango:**
  - 🚀 **Comandante marciano**: 4 logros de 4;
  - 🔧 **Ingeniero de supervivencia**: 2 o 3;
  - 🌱 **Explorador novato**: 0 o 1.

  Los logros posibles son: poca radiación (menos de 40), ninguna emergencia, terminar en 14 soles o menos, y buenas reservas de agua y comida.
- **Tus números:** soles, dosis, emergencias y partes reparadas.
- **2 logros** que conseguiste, **un consejo** para la próxima vez y **un dato real de la NASA** al azar.
- Un mensaje final: *"Los científicos de la NASA también se equivocan y lo vuelven a intentar. ¿Te animas a ser astronauta?"*

Puedes **seguir explorando** (reparar la nave y despegar) o **volver al menú**. La portada guarda tu medalla 🏅.

---

## 15. Consejos para no perder

- 👀 **Mira las pistas 👉** bajo las barras: siempre te dicen algo que **ya puedes hacer**.
- ⚡ **Limpia los paneles** cuando tengan 30% de polvo: es la forma más barata de tener energía.
- 🏗️ **Construye la sala pronto:** abre el invernadero, y la comida tarda varios soles en crecer.
- 🚰 **Repara la Planta de agua** apenas puedas: agua gratis cada sol (si tienes batería).
- 🛡️ **Llena los muros de agua** cuando REGO avise de una tormenta, y usa el **regolito** una vez: protege para siempre.
- 🚙 **No abuses del Rover:** cada misión suma mucha radiación. Ve con un plan.
- 😴 Si te quedan acciones sin usar, aprovéchalas antes de dormir.
- 🌙 Antes de dormir, revisa el **Centro de energía**: el invernadero es lo primero que puedes apagar.

---

## 16. Menú, configuración y guardado

- **Portada:** Continuar · Nueva partida · Ver la historia · Cómo jugar · Configuración · Datos de la NASA · 🌐 idioma.
- **Configuración:**
  - 🌐 **Idioma**: inglés por defecto, o español;
  - dificultad, tamaño del texto y velocidad del astronauta;
  - sonido y volumen;
  - ver la historia al empezar, mostrar a REGO y guardado automático;
  - pantalla completa y borrar la partida.
- **Guardado:** en el navegador (`localStorage`). Hay autoguardado cada amanecer y un punto de reintento si la batería llega a 0%. Cambiar de idioma guarda la partida antes de recargar.
- **Sonido:** generado por código: pasos según el suelo (grava, hielo, agua), alarmas, viento marciano y el motor del Rover.

---

## 17. Datos reales de la NASA en el juego

| Tema | Dato | Fuente |
|---|---|---|
| Tormentas solares | Vienen de **DONKI**, la base de datos de clima espacial de la NASA | kauai.ccmc.gsfc.nasa.gov/DONKI |
| MOXIE | El rover **Perseverance** fabricó oxígeno con el CO₂ de Marte | science.nasa.gov |
| Radiación | El instrumento **RAD** de Curiosity mide ~0,7 mSv por día en la superficie | science.nasa.gov |
| Polvo | El polvo apagó **InSight** (2022) y una tormenta global apagó a **Opportunity** (2018) | science.nasa.gov |
| Hielo | **Phoenix** tocó hielo de agua bajo el suelo (2008) | science.nasa.gov |
| Agua a filtrar | Phoenix también encontró **percloratos**, sales tóxicas que habría que quitar del agua | science.nasa.gov |
| Plantas | Lechuga, mizuna y rábanos ya crecieron en la **ISS** (Veggie / APH); datos en OSDR | osdr.nasa.gov |
| Comunicaciones | Un mensaje Marte–Tierra tarda **3 a 22 minutos** | science.nasa.gov |
| Ventana de lanzamiento | La Tierra y Marte se alinean **cada ~26 meses** | science.nasa.gov |

> Antes de entregar al concurso: verificar que los enlaces y las cifras sigan vigentes.

---

## 18. Tabla de números (balance)

Todos los números están en `data/config.json` y `data/missions.json`.

| Parámetro | Valor |
|---|---|
| Soles / acciones (normal) | 30 / 4 |
| Duración del día | 240 s reales (06:00–21:00) |
| Consumo por sol | 🫁8 · 💧8 · 🥬6 |
| Comida inicial | 50 |
| Paneles (máx.) / bono del sistema eléctrico | 34 / +4 |
| Demanda de energía | soporte 8 · MOXIE 8 · invernadero 4 |
| MOXIE | 🫁13 por sol |
| Reciclador | 70% → +15% por mejora → máx. 98% |
| Radiación | +2/sol · +1/min afuera · +4/min en misiones · CME 20 / SEP 14 (×2 en la alerta) |
| Cuerpo | débil ≥45 ☢️ · agotado ≥75 ☢️ · hambre/sed <20 |
| Traje | 60 s · recarga 25 s por segundo |
| Emergencia | repone 20 y cuesta 1 sol |

**Balance medido** (bot simulado, 600 partidas por perfil):

| Jugador | Llega al fin de la demo | Soles | Dosis al terminar |
|---|---|---|---|
| Hábil | 100% | ~3 | ~41–52 |
| Promedio (junta la mitad de piezas) | 100% | ~5 | ~68–71 (casi siempre "débil", rara vez "agotado") |

---

## 19. Cómo se construyó: historial de cambios

**Punto de partida:** juego web en JavaScript puro con Phaser 3, sin compilación; las Misiones 1 a 3 y la Etapa 5 de radiación ya existían. Sobre esa base se hizo lo siguiente:

1. **Traducción completa al inglés.** El diccionario existía pero no estaba conectado.
   - Se conectó el traductor a toda la página y al mapa.
   - Se crearon los datos en `data/en/`.
   - Se agregó un selector de idioma en Configuración y en la portada.
   - El **inglés quedó como idioma por defecto**.
2. **Cómo correrlo.**
   - Se instaló Python y se creó **`jugar.bat`**.
   - El servidor quedó **sin caché**, para ver siempre la última versión.
   - Acepta conexiones por la **IP de la red local**.
   - `index.html` avisa si se abre con doble clic.
3. **Cerrar ventanas.** Ahora hay una **✕**, la tecla **Esc** y clic fuera del cuadro. Las decisiones obligatorias no se pueden saltar.
4. **Sonido de pasos** audible y distinto según el suelo: grava, hielo o agua.
5. **Misión del agua.**
   - El lago queda **congelado** hasta reparar la nueva **🚰 Planta de agua**: transformador → filtro → tanque.
   - Se agregó el dato de los percloratos.
6. **Más dificultad.**
   - Tormentas solares más fuertes y más frecuentes.
   - La radiación sube más rápido y **tiene consecuencias en el cuerpo**.
   - La comida y el agua bajan más rápido y dependen entre sí y de la energía.
   - Se ajustó con partidas simuladas para que todos puedan terminar la demo.
7. **Fin de la demo** después de la Etapa 4, con un **mensaje dinámico** para cada niño y una medalla en la portada.
8. **Pistas de recursos.** Las barras en peligro muestran **cómo conseguir** energía, agua, comida u oxígeno según lo desbloqueado, y la ayuda lista todas las opciones.

**Ideas para después:**
- Una barra de **Vitalidad 💪** propia del astronauta (sube comiendo, bebiendo y durmiendo).
- Mover la primera tormenta solar al sol 3, para que todos la vivan en la demo.
- Dividir `js/scenes/base.js`, que pasa de las 300 líneas que pide la guía técnica.

---

## 20. Para desarrolladores

- **Tecnología:** JavaScript con módulos ES, Phaser 3.80.1 por CDN y la interfaz en HTML/CSS. **Sin npm ni compilación.**
- **Estado:** todo vive en `juego.s`. Los datos estáticos están en `data/*.json`, y su versión en inglés en `data/en/`.
- **Archivos clave:**

| Archivo | Qué hace |
|---|---|
| `js/sim.js` | Simula un sol (`avanzarSol`) |
| `js/systems/` | Energía, soporte vital, comida, radiación, comunicaciones y **cuerpo** |
| `js/actions.js` | Acciones del jugador y bloqueos de edificios |
| `js/scenes/base.js`, `js/scenes/mision.js`, `js/scenes/agua.js` | El mapa de la base, las misiones y el lago |
| `js/ui/` | Ventanas y misiones: taller, antena, ciclo, plantaAgua, tormentaSolar, noche, menu, hud, consejos, demo |
| `js/i18n.js` + `js/i18n-en.js` | El traductor y el diccionario español → inglés |

- **Reglas del proyecto:**
  - el contenido nuevo va en `data/*.json`;
  - cada opción debe costar algo;
  - los archivos deben tener menos de 300 líneas;
  - cada texto nuevo en español necesita su entrada en `i18n-en.js` (y en `data/en/` si es un dato);
  - si cambias números, vuelve a medir el balance.
- **Datos reales de tormentas:** `py tools/descargar_donki.py 2024-05-01 2024-05-31` llena `data/donki.json`.
- Más detalle técnico en **`README.md`**.
