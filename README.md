# 🫐 COSECHA DE ARÁNDANOS

Microjuego web 2D tipo **pixel art 16-bit**, vista superior (top-down),
inspirado en la cosecha de arándanos en un fundo de Ica, Perú.

El jugador controla a un cosechador que recorre las líneas del cultivo,
recoge **solo los arándanos maduros**, evita los **pintones**, llena la
canasta, entrega la cosecha y afronta las revisiones de un supervisor
de calidad.

Ciclo de juego:

```
CAMINAR → BUSCAR → RECOGER → ACUMULAR → REGRESAR → ENTREGAR → SUPERVISIÓN → VOLVER AL CAMPO
```

---

## 📋 Descripción

| | |
|---|---|
| **Nombre** | Cosecha de Arándanos |
| **Género** | Arcade / cosecha, partidas cortas (~2-3 min) |
| **Vista** | Top-down 2D, pixel art 16-bit |
| **Orientación** | **Vertical (portrait) 9:16** — pensado primero para móvil |
| **Plataformas** | PC, laptop, tablet y teléfono |
| **Estado** | Prototipo jugable (Fase 1: estructura + mecánica base) |

---

## 🛠 Tecnologías

| Tecnología | Uso |
|---|---|
| **React 18** | Solo la aplicación exterior: menús, pausa, resultados |
| **Vite 6** | Servidor de desarrollo y build de producción |
| **JavaScript (ES2022+)** | Sin TypeScript, módulos ES nativos |
| **HTML5 Canvas 2D** | **Todo** el renderizado del juego |
| **CSS** | Layout, viewport vertical y UI |
| **Vitest 2** | Pruebas automatizadas |

> **Sin backend.** El juego es 100% estático: no hay servidor, base de
> datos, login ni APIs externas. Puede publicarse en cualquier hosting
> estático (GitHub Pages, Netlify, Vercel, un VPS con nginx...).

### Dependencias

Solo dos dependencias de producción (`react`, `react-dom`). **El motor
del juego no usa ninguna librería**: ni motor gráfico, ni de física, ni
de animación. Todo está implementado a mano para mantenerlo ligero y
funcionar en equipos modestos.

---

## 🚀 Instalación y uso

```bash
# 1. Entrar al proyecto
cd cosecha-de-arandanos

# 2. Instalar dependencias
npm install

# 3. Servidor de desarrollo (recarga en caliente)
npm run dev
#    → http://localhost:5173

# 4. Build de producción (genera dist/)
npm run build

# 5. Previsualizar el build
npm run preview

# 6. Pruebas
npm test          # ejecuta toda la suite
npm run test:watch # modo vigilancia
```

---

## 📱 Jugar desde otro dispositivo (LAN)

El juego es **100% individual**: cada dispositivo abre el juego y juega
**su propia partida**. No hay multijugador, ni salas, ni servidor de
partidas. El servidor de Vite **solo sirve los archivos** (HTML, JS,
sprites, sonidos) a los demás dispositivos de la red.

### Cómo

1. Arranca el servidor en la PC:

   ```bash
   npm run dev
   ```

2. Vite muestra dos direcciones:

   ```
   Local:    http://localhost:5173/
   Network:  http://192.168.1.3:5173/     ← esta se usa desde fuera
   ```

3. Abre la dirección **Network** desde otra PC o desde un teléfono
   conectado a la **misma Wi-Fi**:

   ```
   http://192.168.1.3:5173/
   ```

La IP **no está fija en el código**: la detecta Vite en cada arranque,
así que si el router le cambia la IP a la PC, la dirección que muestra
sigue siendo la correcta. Copia siempre la que aparezca en `Network`.

> `localhost` **no** sirve desde otro dispositivo: en un teléfono,
> `localhost` es el propio teléfono, no tu PC.

### Cortafuegos de Windows

Si otro dispositivo no puede conectarse, probablemente Windows está
bloqueando el puerto. **No desactives el cortafuegos**: basta permitir
el puerto de Vite.

**TCP 5173** — puerto del servidor de desarrollo.

La primera vez que ejecutes `npm run dev`, Windows suele mostrar un
aviso ("Permitir que Node.js se comunique en redes privadas"). Marca
**Redes privadas** y acepta.

Si ya lo rechazaste, se puede abrir el puerto a mano desde PowerShell
**como Administrador**:

```powershell
New-NetFirewallRule -DisplayName "Cosecha de Arandanos (Vite dev)" `
  -Direction Inbound -Protocol TCP -LocalPort 5173 `
  -Action Allow -Profile Private
```

Para el build de producción (puerto 4173):

```powershell
New-NetFirewallRule -DisplayName "Cosecha de Arandanos (Vite preview)" `
  -Direction Inbound -Protocol TCP -LocalPort 4173 `
  -Action Allow -Profile Private
```

Para ver el estado de la regla y la IP de la PC:

```powershell
Get-NetFirewallRule -DisplayName "Cosecha de Arandanos*" | Select DisplayName, Enabled
ipconfig            # busca "Dirección IPv4" del adaptador Wi-Fi o Ethernet
```

Para quitar una regla:

```powershell
Remove-NetFirewallRule -DisplayName "Cosecha de Arandanos (Vite dev)"
```

### Servir el build de producción en la red

```bash
npm run build     # genera dist/
npm run preview   # sirve dist/ en http://IP:4173/
```

`npm run preview` también escucha en toda la red (`host: true`), así que
la dirección `Network` que muestra sirve igual desde el móvil.

Si prefieres servir `dist/` con otra herramienta, cualquier servidor
estático vale (`npx serve dist`, `python -m http.server`, etc.). El
build usa rutas **relativas** (`base: './'`), así que funciona tanto en
la raíz del dominio como en una subcarpeta.

### Si no conecta

| Síntoma | Causa probable |
|---|---|
| No carga nada desde el móvil | Cortafuegos bloqueando el 5173 (ver arriba) |
| Carga pero sin imágenes | El móvil no está en la misma Wi-Fi |
| Solo funciona en la PC | Vite arrancó sin `host: true` (revisa `vite.config.js`) |
| La dirección cambió | Normal: la IP es dinámica, copia la que muestre Vite |

---

## 🎮 Controles

### Teclado (PC)

| Tecla | Acción |
|---|---|
| `W` / `↑` | Subir por el camino |
| `S` / `↓` | Bajar |
| `A` / `←` | Izquierda |
| `D` / `→` | Derecha |
| `Q` | **Recoger hacia la izquierda** |
| `E` | **Recoger hacia la derecha** (acción contextual) |
| `ESPACIO` | **Entregar** en la zona de entrega |
| `ESC` / `P` | Pausa |

### Táctil (móvil y tablet)

Los controles aparecen **automáticamente** en dispositivos táctiles:

```
        ▲
   ◀    ▼    ▶          [RECOGER IZQ] [ENTREGAR] [RECOGER DER]
```

Todos los botones cumplen el mínimo táctil cómodo de **48×48 px**.

---

## 📐 Cómo se ve el juego

El juego es **siempre un rectángulo vertical 9:16 centrado**, como una
pequeña máquina arcade. En un monitor grande **no se estira**: sobra
espacio a los lados, y ese espacio es el fondo de la página.

```
        MONITOR GRANDE                    TELÉFONO
┌──────────────────────────────┐   ┌───────────────┐
│                              │   │               │
│      ┌──────────────┐        │   │               │
│      │              │        │   │     JUEGO     │
│      │    JUEGO     │        │   │               │
│      │              │        │   │               │
│      └──────────────┘        │   └───────────────┘
│                              │
└──────────────────────────────┘
```

**Resolución lógica fija: `360 × 640`.** El juego trabaja siempre en
esas coordenadas; el navegador solo escala visualmente el canvas. Por
eso las colisiones, los tamaños de sprite y los controles son idénticos
en móvil y en PC, y el juego **nunca se deforma**.

---

## 🏗 Arquitectura

La regla más importante del proyecto:

> **React NO dibuja el juego. El motor NO conoce React.**

```
React (menús, HUD de páginas, resultados)
  │
  └── GameShell            ← único punto de contacto
        │
        └── GameCanvas     ← crea el <canvas>, monta y DESTRUYE el motor
              │
              └── GameEngine        (JavaScript puro, sin React)
                    ├── Player
                    ├── Map  →  TileMap · MapGenerator · CollisionMap
                    ├── Plants / Fruits
                    ├── Supervisor
                    ├── Basket / Box / Truck
                    ├── Camera
                    ├── CollisionSystem
                    ├── Input  →  KeyboardInput · TouchInput
                    ├── Systems → Harvest · Delivery · Quality · Score
                    │            Timer · Supervisor · Level
                    ├── Rendering → Renderer · SpriteRenderer · AssetLoader
                    ├── Effects → Particles · FloatingText
                    ├── Audio
                    └── GameState
```

### Principios aplicados

1. **El motor es React-agnóstico.** `GameEngine.js` no importa React y
   podría ejecutarse en un canvas suelto, en un test o en un worker.
2. **React nunca renderiza un frame.** El bucle usa
   `requestAnimationFrame` y dibuja directo en el canvas.
3. **El HUD se publica por instantáneas**, no cada frame: el motor avisa
   a React solo cuando algo cambia.
4. **Configuración centralizada.** Todos los valores ajustables están en
   `config/gameConfig.js`; los 12 niveles, en `data/levels.js`. Nada de
   números mágicos desperdigados.
5. **Los assets se piden por clave lógica** (`player.walkDown`), nunca
   por nombre de archivo. Cambiar el arte no toca el motor.

### Estructura de carpetas

```
cosecha-de-arandanos/
├── public/
│   ├── assets/            ← 114 sprites PNG (ver ASSET_MANIFEST.md)
│   │   ├── player/  supervisor/  plants/  fruits/  terrain/
│   │   ├── basket/  truck/  ui/  effects/  environment/  sounds/
│   └── favicon/
├── tools/                 ← generador de sprites (herramientas de arte)
│   ├── png.js                  codificador PNG sin dependencias
│   ├── pixelCanvas.js          lienzo de pixel art
│   ├── palette.js              paleta del juego
│   ├── artCharacters.js        jugador y supervisor
│   ├── artWorld.js             plantas, terreno, UI, entorno
│   ├── generateSprites.js      genera los 95 PNG
│   ├── makeContactSheet.js     lámina de contacto para revisar
│   └── previewSheet.js         página HTML con todos los sprites
├── src/
│   ├── app/               ← App.jsx (aplicación exterior)
│   ├── components/        ← MainMenu, Tutorial, PauseMenu,
│   │                        LevelComplete, GameOver, ShareResult, GameShell
│   ├── game/              ← EL MOTOR (sin React, salvo GameCanvas.jsx)
│   │   ├── GameEngine.js       núcleo: bucle, update, render
│   │   ├── GameCanvas.jsx      puente React ↔ motor
│   │   ├── config/             gameConfig.js · constants.js
│   │   ├── entities/           Player · Plant · Fruit · Basket · Box ·
│   │   │                       Supervisor · Truck
│   │   ├── systems/            Harvest · Delivery · Quality · Score ·
│   │   │                       Timer · Supervisor · Level
│   │   ├── map/                Map · TileMap · MapGenerator ·
│   │   │                       CollisionMap · mapLayout
│   │   ├── rendering/          Renderer · Camera · SpriteRenderer ·
│   │   │                       AssetLoader · PlaceholderFactory
│   │   ├── input/              KeyboardInput · TouchInput
│   │   ├── collision/          CollisionSystem
│   │   ├── animation/          Animation · AnimationController
│   │   ├── effects/            ParticleSystem · FloatingText · EffectsManager
│   │   ├── audio/              AudioManager
│   │   └── state/              GameState
│   ├── data/              ← levels.js · plants.js · fruits.js · assets.js
│   ├── styles/            ← variables · global · responsive · result-screen
│   ├── utils/             ← math · colors · storage
│   └── main.jsx
├── tests/                 ← 83 pruebas automatizadas
├── index.html
├── vite.config.js
└── package.json
```

---

## 🗺 Niveles

Los **12 niveles** están definidos desde el principio en
`src/data/levels.js`, aunque inicialmente se juega el nivel 1.

**No hay 12 mapas dibujados a mano**: `MapGenerator.generateLevel()`
construye cada parcela a partir de parámetros.

| Campo | Significado |
|---|---|
| `rows` | Número de líneas de cultivo |
| `plantsPerRow` | Plantas por línea |
| `ripeChance` / `unripeChance` | Proporción de maduros y pintones |
| `fruitChance` | Probabilidad de que una planta tenga fruto |
| `targetHarvest` | Arándanos maduros objetivo |
| `minimumQuality` | Calidad mínima para aprobar (%) |
| `deliveries` | Entregas necesarias |
| `timeLimit` | Segundos de partida |
| `supervisorInterval` | Segundos entre revisiones |
| `basketCapacity` | Capacidad de la canasta |
| `difficulty` | Etiqueta de dificultad (1-12) |

La dificultad crece con **más líneas, más frutos, más pintones, menos
tiempo, supervisión más frecuente y mayor exigencia de calidad** — nunca
haciendo que el personaje corra más rápido.

| Nivel | Nombre | Dificultad |
|---|---|---|
| 1 | Primera jornada | Pocas plantas, mucho fruto maduro, supervisor lento, tiempo amplio |
| 2 | Más plantas | Más plantas y más frutos |
| 3 | Ojo con los pintones | Suben los pintones |
| 4 | Tiempo justo | Menos tiempo |
| 5 | Supervisión frecuente | El supervisor aparece antes |
| 6 | Campo grande | Más líneas |
| 7 | Cosecha larga | Mayor distancia y objetivo |
| 8 | Frutos mezclados | Frutos muy mezclados |
| 9 | Contrarreloj | Menos tiempo aún |
| 10 | Sin margen de error | Menor tolerancia y calidad mínima 90% |
| 11 | Alta dificultad | Todo sube |
| 12 | Gran cosecha | El desafío final |

---

## 🎨 Assets

**114 sprites PNG reales**, organizados en la estructura oficial de
carpetas con los nombres y tamaños de las láminas de referencia del
proyecto. No hay placeholders en uso.

El arte se produce con un generador propio **sin dependencias
externas** (codificador PNG a mano sobre `zlib` de Node):

```bash
npm run sprites          # genera los 114 PNG en public/assets/
npm run manifest         # regenera ASSET_MANIFEST.md
npm run sprites:sheet    # + lámina de contacto para revisar
npm run sprites:preview  # página HTML con todos los sprites
```

### Estructura

```
public/assets/
├── player/       idle/ walk/ harvest/ states/            13
├── supervisor/   walk/ inspection/ states/               10
├── plants/       las 8 variantes + base y fila            10
├── fruits/       maduro, pintón, grupos, en mano          8
├── terrain/      tierra, caminos, cercas, entrega         15
├── basket/       4 canastas + 4 cajas + camión            10
├── ui/           hud/ icons/ buttons/ bars/ panels/ prompts  26
├── effects/      harvest/ error/ inspection/ particles/
│                 shadows/ floating-text/                  9
└── environment/  sky/ clouds/ mountains/ trees/ signs/
                  decorations/                             13
```

**Peso total: ~30 KB** para los 114 archivos.

### Tamaños

16x16 (UI, frutos, efectos) · 32x32 (personajes, plantas, tiles,
canastas) · 32x64 (hilera alta) · 64x40 (camión) · 64x64 (árboles,
carteles) · 128x32 (spritesheets de 4 frames) · 128x64 (cielo,
montañas).

### Arquitectura planta + frutos (§7)

El juego **no depende de 8 imágenes fijas** para las plantas. Se
compone:

```
PLANTA BASE (follaje)  +  FRUTOS INDIVIDUALES
```

`plant_base.png` es el follaje y los frutos (`fruit_ripe.png`,
`fruit_unripe.png`) se colocan encima. Así la posición y la cantidad de
frutos se puede variar por código. Las 8 variantes completas también
existen, para usarlas directamente cuando convenga.

### Cómo sustituir el arte

1. Deja tu PNG **con el mismo nombre y tamaño** en la carpeta que le
   corresponde dentro de `public/assets/`.
2. Actualiza la entrada en `src/data/assets.js` si cambian las
   dimensiones.
3. `npm test` verifica que todo cuadra.

**No hay que tocar el motor.** Pide sprites por **clave lógica**
(`player.walkDown`), nunca por nombre de archivo.

Ver [`public/assets/ASSET_MANIFEST.md`](public/assets/ASSET_MANIFEST.md)
— documento **generado** con la tabla completa de ID, ruta, tipo,
tamaño, frames, estado y uso.

---

## 🔊 Sonido

Los sonidos son **opcionales**. Si no hay archivos `.wav`, el
`AudioManager` genera tonos con la WebAudio API, así que el juego tiene
feedback sonoro desde el primer día sin necesitar ningún archivo.

Para usar audio real, coloca los `.wav` en `public/assets/sounds/` con
los nombres declarados en `SOUND_ASSETS` (`src/data/assets.js`).

---

## 🧪 Pruebas

El proyecto usa **Vitest** (integrado con Vite, sin configuración extra).

```bash
npm test
```

**123 pruebas en 10 suites:**

| Suite | Qué comprueba |
|---|---|
| `levels.test.js` | Los 12 niveles están bien formados y la dificultad escala |
| `mapGenerator.test.js` | El mapa generado respeta la estructura del campo |
| `harvest.test.js` | Recolección, pintones y canasta |
| `rendering.test.js` | **El mundo se dibuja de verdad** (verifica píxeles) |
| `gameplay.test.js` | Ciclo de juego: movimiento, colisiones, victoria y derrota |
| `fullCycle.test.js` | El ciclo completo caminando: recoger, regresar y entregar |
| `lifecycle.test.js` | Montaje/desmontaje del motor (StrictMode) |
| `assets.test.js` | Cada sprite del catálogo existe en disco, es RGBA y tiene el tamaño correcto |
| `assetLoading.test.js` | El cargador usa los **PNG reales**, sin caer a placeholders |
| `integration.test.js` | Escala 1:1 del pixel art (§18) y frutos anclados a su planta |

### Sobre Karma

La especificación del proyecto mencionaba **Karma** como sistema de
pruebas. **Se optó por Vitest** y se documenta el motivo, tal como pedía
la propia especificación ante incompatibilidades:

- **Karma está en desuso** (deprecado por sus mantenedores) y está
  pensado para lanzar navegadores reales.
- **Karma no sustituye a Vite**: obligaría a mantener dos cadenas de
  build paralelas y a duplicar la configuración.
- **Vitest reutiliza la configuración de Vite**, entiende JSX y módulos
  ES sin transpilar nada extra, y corre en milisegundos.

**La aplicación sigue siendo React + Vite**; Vitest se usa únicamente
para las pruebas, sin afectar al build ni al desarrollo.

---

## ⚡ Rendimiento

Objetivo: **60 FPS** cuando el dispositivo lo permita.

Medidas aplicadas:

- **Cero render de React por frame.** El bucle dibuja directo en canvas.
- **Culling por cámara:** solo se dibujan los tiles y entidades visibles.
- **Delta time acotado** (`maxDeltaTime`): evita saltos al volver de una
  pestaña en segundo plano.
- **Partículas con pool** reutilizado y tope duro (120), sin asignaciones
  por frame.
- **`imageSmoothingEnabled = false`** en todo el pipeline de sprites.
- **DPR limitado a 2** para no reventar móviles con pantallas 3x.
- **Sin WebGL, sin 3D, sin librerías innecesarias.**

---

## 💾 Guardado local

Sin base de datos. Se usa `localStorage` (opcional) para: récord, nivel
máximo desbloqueado, puntuación por nivel, estadísticas y ajustes.

Si el usuario borra los datos del navegador, el récord se pierde. Todo
el acceso pasa por `src/utils/storage.js`, que **nunca rompe** si
`localStorage` no está disponible (modo privado).

---

## 🗓 Fases de desarrollo

El proyecto está organizado por fases, y cada commit corresponde a una
de ellas:

| Commit | Fase | Estado |
|---|---|---|
| 1 | Estructura inicial | ✅ Hecho |
| 2 | Canvas y viewport | ✅ Hecho |
| 3 | Motor del juego (bucle) | ✅ Hecho |
| 4 | Jugador y movimiento | ✅ Hecho |
| 5 | Mapa y colisiones | ✅ Hecho |
| 6 | Plantas y frutos | ✅ Hecho |
| 7 | Cosecha | ✅ Hecho |
| 8 | Canasta y entrega | ✅ Hecho |
| 9 | Supervisor | ✅ Hecho (básico) |
| 10 | Niveles | ✅ Definidos (1 jugable) |
| 11 | Móvil | ✅ Hecho |
| 12 | UI y presentación | ✅ Hecho |

### Lo que funciona hoy

- Menú, tutorial de 8 pasos, pausa, victoria, derrota y compartir.
- Nivel 1 completamente jugable de principio a fin.
- Movimiento por caminos con colisiones reales.
- Recolección izquierda/derecha, maduros y pintones.
- Canasta con estados (vacía/pocos/media/llena) y entrega.
- Puntuación, calidad, vidas, tiempo y HUD.
- Supervisor con revisión, veredicto y consecuencias.
- Viewport vertical centrado y controles táctiles.
- **114 sprites PNG reales** organizados en la estructura oficial de
  carpetas (jugador, supervisor, plantas, frutos, terreno, canastas,
  camión, UI, efectos y entorno).

### Lo que falta (siguientes fases)

- **Sonidos reales** (hoy son tonos sintetizados con WebAudio).
- **Activación del camión** por número de entregas (§16). La clase
  `Truck` está implementada y se dibuja, pero su secuencia aún no se
  dispara por regla de juego.
- **Inteligencia completa del supervisor** (rutas, más diálogos).
- **Integrar los sprites de entorno** (árboles, montañas, carteles) en el
  fondo del mapa. Ya existen y se cargan; falta colocarlos en el nivel.
- **Selector de dificultad y récords por nivel** en la UI.
- **Publicación** de la página tipo ficha del juego.

---

## 🤝 Git

```bash
git init
git add .
git commit -m "estructura inicial y prototipo jugable"
```

### Qué se ignora

`.gitignore` excluye `node_modules/`, `dist/`, `.env`, `*.log`,
`.DS_Store`, `.vscode/` y `coverage/`.

### Qué SÍ se versiona

`src/`, `public/assets/`, `README.md`, `package.json` y
`package-lock.json`.

---

## ⚠️ Decisiones técnicas y desviaciones

Se documentan aquí de forma explícita las decisiones que se apartan de
la especificación original, tal como exige la propia especificación.

### 1. React + Vite en lugar de JavaScript puro

La especificación (§42 y §57) recomendaba **no usar React en el MVP**.
El encargo explícito del proyecto, en cambio, pedía **React + Vite** con
una arquitectura modular.

**Se siguió el encargo explícito.** El riesgo de que React arruinara el
rendimiento se neutralizó aislándolo por completo:

- El motor (`src/game/`) **no importa React**.
- React solo monta y destruye el motor, y dibuja los menús.
- El HUD se actualiza por instantáneas, no por frame.

El resultado conserva el rendimiento del canvas puro y gana la
organización de la UI que pedía el encargo.

### 2. Vitest en lugar de Karma

Explicado en la sección de pruebas. Vitest se integra con Vite; Karma
obligaría a mantener dos cadenas de build.

### 3. El mundo siempre cubre la pantalla

El campo se dimensiona para **cubrir** el viewport lógico de 360×640. Si
el mapa fuera más pequeño, la cámara dejaría franjas vacías y el juego
no llenaría la pantalla del móvil. Por eso el alto del campo se calcula
a partir de las plantas por línea, y el número total de plantas de cada
nivel se mantiene intacto (se reparten, no se duplican).

### 4. La canasta siempre cae en una columna de camino

En el layout las columnas impares son líneas de cultivo (bloqueantes) y
las pares son caminos. Si la canasta cayera en una columna de cultivo,
**el jugador aparecería dentro de las plantas y quedaría atascado**. Por
eso `MapGenerator` busca la columna de camino más cercana al centro.

---

## 📄 Licencia

Proyecto privado. Todos los derechos reservados.

---

## 🙏 Créditos

Inspirado en la cosecha de arándanos de **Ica, Perú** — una actividad
que la comunidad ha hecho suya a base de esfuerzo, y que a partir de
esta idea convive con una pequeña versión digital.

Fundo San Jorge · Ica — Perú
