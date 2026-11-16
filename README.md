# 🚀 Beyond Survival

**"Un error... una nueva vida."**

Juego web educativo para el concurso de la NASA, pensado para niños de **7 a 12 años**.
Un astronauta queda varado en Marte después de un accidente. Tiene que sobrevivir y reparar la nave **Starship V3** antes de que se cierre la ventana de lanzamiento (30 soles), aprendiendo en el camino cómo funcionan la energía, el agua, el oxígeno, la comida y la radiación en una base espacial.

Está hecho con **datos abiertos de la NASA** y funciona en **inglés y español**.

📖 **Reglas completas, misiones y consejos:** [GUIA-DEL-JUEGO.md](GUIA-DEL-JUEGO.md)

---

## ▶️ Jugar

| Dónde | Cómo |
|---|---|
| **En línea** | `https://TU-USUARIO.github.io/beyond-survival/` |
| **En Windows** | Doble clic en **`jugar.bat`** (necesita [Python 3](https://www.python.org/downloads/)). Se abre el navegador en `http://127.0.0.1:8000`. |
| **En cualquier sistema** | `python tools/servidor.py` dentro de esta carpeta y abrir `http://127.0.0.1:8000` |
| **Desde un celular** (misma red WiFi) | Usa la dirección `http://IP-DE-TU-PC:8000` que muestra `jugar.bat`. |

> Abrir `index.html` con doble clic no funciona: el navegador bloquea los módulos y los archivos de datos cuando se abren desde el disco. Hace falta un servidor, aunque sea local.

### Controles
| Acción | Teclado | Táctil |
|---|---|---|
| Moverse | Flechas o W A S D | Tocar el mapa o el minimapa |
| Entrar a un edificio | E | Tocar el edificio |
| Subir/bajar del Rover · volver a la base | E · R | Botones 🚙 · 🏠 |
| Pausa / cerrar ventana | Esc | ⏸ / ✕ |
| Aprender qué es algo | — | Tocar cualquier barra o casilla |

---

## 🎮 Qué incluye

- **3 misiones guiadas:**
  - ⚡ *Chatarra y Arena Marciana*: armar un panel solar;
  - 📡 *Despertar la Voz*: reparar la antena y hablar con la Tierra con retraso;
  - ♻️ *El Ciclo de la Vida*: reciclar el agua y el oxígeno.
- **Etapa 4:** construir la sala presurizada y la 🚰 **planta de agua**, que derrite y filtra el hielo del lago.
- **Etapa 5:** ☢️ alertas de **tormentas solares** basadas en eventos reales de **DONKI**.
- **Simulación diaria:**
  - reparto de energía, MOXIE, reciclador de agua, invernadero y radiación acumulada;
  - cartas de decisión: **ninguna opción es gratis**.
- **Misiones con el Rover** en mapas explorables, con aire del traje, carga máxima, remolinos y hielo resbaladizo.
- **El cuerpo del astronauta:** el hambre, la sed y la radiación lo debilitan. No hay "game over": los errores cuestan tiempo.
- **Pistas 👉** bajo las barras en peligro, que dicen cómo recuperar cada recurso.
- **Fin de la demo** con un mensaje personalizado según cómo jugó cada niño.
- **Extras:** pixel art y sonido generados por código (sin archivos de imagen ni audio), guardado en el navegador, 3 dificultades y opciones de accesibilidad.

---

## 🛰️ Datos de la NASA

| Tema | Fuente |
|---|---|
| Tormentas solares (CME y SEP) | [DONKI – Space Weather Database](https://kauai.ccmc.gsfc.nasa.gov/DONKI/) |
| Oxígeno de MOXIE | [Mars 2020 Perseverance](https://science.nasa.gov/mission/mars-2020-perseverance/) |
| Radiación en la superficie (RAD) | [Curiosity](https://science.nasa.gov/mission/msl-curiosity/) |
| Polvo y energía solar | [InSight](https://science.nasa.gov/mission/insight/) |
| Hielo y percloratos | [Phoenix](https://science.nasa.gov/mission/phoenix/) |
| Cultivos en el espacio | [NASA OSDR](https://osdr.nasa.gov/) |
| Comunicaciones y ventanas de lanzamiento | [NASA Mars](https://science.nasa.gov/mars/) |

Para usar tormentas reales en lugar de las simuladas:

```bash
python tools/descargar_donki.py 2024-05-01 2024-05-31
```

Usa la variable de entorno `NASA_API_KEY` (gratis en [api.nasa.gov](https://api.nasa.gov)) o, si no está, `DEMO_KEY`. Llena `data/donki.json`.

---

## 🧩 Para desarrolladores

**Tecnología:** JavaScript con módulos ES y **Phaser 3.80.1** por CDN. **Sin npm ni compilación:** se publica la carpeta tal cual.
Phaser solo dibuja el mapa; toda la interfaz (barras, ventanas, botones) está en HTML y CSS.

```
index.html          Página del juego y capas del HUD
css/ui.css          Estilos
data/               Contenido y balance (JSON). data/en/ = versión en inglés
  config.json       Todos los números del balance
  missions.json     Misiones con el Rover
  cards.json        Cartas del Consejo de Misión
  rocket.json       Partes de la nave
  crops.json        Cultivos
  facts.json        Datos de la NASA con su fuente
  ayuda.json        Explicaciones al tocar cada barra
  donki.json        Tormentas solares reales (opcional)
js/
  main.js           Arranque
  state.js          Estado inicial de la partida (juego.s)
  sim.js            Simulación de un sol (avanzarSol) y avisos
  actions.js        Acciones del jugador y bloqueos de edificios
  systems/          Energía, soporte vital, comida, radiación, comunicaciones, cuerpo
  scenes/           Mapa de la base, misiones y lago (Phaser)
  ui/               HUD, ventanas, menú y cada misión
  i18n.js, i18n-en.js  Traducción español → inglés
  audio.js          Sonido sintetizado (Web Audio)
  sprites*.js       Pixel art generado por código
tools/
  servidor.py       Servidor local sin caché
  descargar_donki.py  Descarga tormentas reales de DONKI
jugar.bat           Lanzador para Windows
```

### Arquitectura
- **Estado:**
  - todo vive en un objeto plano, `juego.s`;
  - los datos estáticos están en `juego.datos`, cargados desde `data/*.json`.
- **Simulación de un sol:** `avanzarSol(s, d)` en `js/sim.js` ejecuta los sistemas en orden (energía → soporte vital → comida → radiación → comunicaciones). Cambia el estado y devuelve los textos del resumen del día.
- **Acciones del jugador:** `ACCIONES[id] = { ap, ok(s, d, ...args), run(s, d, ...args) }` en `js/actions.js`.
  - `ok` devuelve `true` o el motivo por el que no se puede.
  - `bloqueo(id, s)` pone el candado sobre los edificios.
- **Ventanas:**
  - `abrir(titulo, html, botones)` en `js/ui/modal.js` devuelve una promesa con el valor del botón pulsado;
  - si hay un botón «Cerrar», con `valor: 'cerrar'` o con `cierra: true`, aparecen la ✕, Esc y el clic fuera;
  - sin ese botón, la ventana es una decisión obligatoria.
- **Idiomas:**
  - el código se escribe en español;
  - en inglés, `js/i18n.js` traduce todo texto que aparece en la página y en el mapa usando `js/i18n-en.js`;
  - los datos con texto tienen su copia en `data/en/`;
  - el idioma por defecto es el inglés.
- **Guardado:** en `localStorage`, con las claves `beyond-survival-partida`, `-ajustes`, `-punto` y `-demo`.

### Reglas del proyecto
1. **Ninguna decisión es gratis:** cada opción cuesta energía, agua, comida, acciones, materiales o radiación.
2. **Sin "game over":** un recurso en 0 se repone y cuesta un sol. La batería en 0 lleva a reintentar desde el último amanecer.
3. **Contenido y números en `data/*.json`,** no en el código. Los efectos se escriben como `{ recurso: cambio }`.
4. **Textos cortos, para niños.** Cada texto nuevo necesita su entrada en `js/i18n-en.js` y, si es un dato, su versión en `data/en/`.
5. **Cada dato de la NASA** va en `data/facts.json` con su fuente.
6. **Archivos de menos de 300 líneas.** No agregar frameworks ni procesos de compilación.
7. **Si cambias el balance, vuelve a medirlo.** Con partidas simuladas, todos los perfiles llegan al fin de la demo:
   - el jugador hábil, en ~3 soles con dosis ~41–52;
   - el promedio, en ~5 soles con dosis ~68–71.

---

## 🌐 Publicar en GitHub Pages

```bash
git init -b main
git add .
git commit -m "Beyond Survival"
git remote add origin https://github.com/TU-USUARIO/beyond-survival.git
git push -u origin main
```

Luego, en el repositorio: **Settings → Pages → Deploy from a branch → `main` / `(root)` → Save**.
Cada `git push` vuelve a publicar el juego en 1 o 2 minutos.
