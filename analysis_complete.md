COMPLETE ANALYSIS OF cosecha-de-arandanos PROJECT
==================================================

FRAMEWORK Y VERSION
- Framework: React + Vite (single-page canvas game)
- Rendering: HTML5 Canvas 2D, custom pipeline: GameEngine → Renderer → SpriteRenderer
- No React re-render each frame; only updates when HUD changes (§34, §41)

ESTRUCTURA DEL PROYECTO
- src/game/ contiene la lógica del motor (GameEngine.js, 1675 líneas)
- src/game/config/ con gameConfig.js y constants.js
- src/game/map/ con composition.js, MapGenerator.js, Map.js, TileMap.js
- src/game/entities/ con Player.js, Plant.js, Fruit.js, Box.js, Basket.js, Supervisor.js, Truck.js
- src/game/rendering/ con Renderer.js, SpriteRenderer.js, Camera.js, AssetLoader.js, PlaceholderFactory.js, HudRenderer.js
- src/data/ con levels.js, fruits.js, plants.js
- src/styles/ con global.css y responsive.css (escalado PC vs móvil)
- public/index.html es el entry point con un solo <canvas id="game-canvas">

ARCHIVOS QUE CONTROLAN:
- Mapa/campo: composition.js, MapGenerator.js, Map.js
- Jugador: Player.js
- Plantas: Plant.js
- Frutos/arándanos: Fruit.js (dentro de Plant.fruits array), Plant.fruitPosition()
- CSS: global.css, responsive.css (viewport scaling, PC vs móvil)

ESTRUCTURA VISUAL RECONSTRUIDA
================================

RESOLUCIÓN LÓGICA DEL MUNDO
- 480 × 800 px (aspecto 3:5)
- Sin scroll horizontal: 480 / 48 = 10 columnas exactas
- Viewport lógico fijo en todos los niveles (§24)

VIEWPORT Y DISTRIBUCIÓN
- Width: 480 px exactos (10 tiles × 48px)
- Height: 800 px lógicos
- HUD Superior: 144 px (dos filas de interfaz)
- Campo de cultivo: empieza en Y=147, mide 480 px de alto (8 filas × 60px efectivas, pero ROW_HEIGHT=48 con sobresalto)
- Valla: Y=627, mide 12 px
- Zona de cosecha: Y=639 a Y=760, mide 121 px
- Footer: Y=760 a Y=800, mide 40 px

HILERAS (5 hileras de cultivo, impares):
- Fórmula: cropRowY(rowIndex) = FIELD_Y + ROW_HEIGHT + rowIndex × ROW_HEIGHT
- Hilera 1: Y = 147 + 48 = 195
- Hilera 2: Y = 147 + 96 = 243
- Hilera 3: Y = 147 + 144 = 291
- Hilera 4: Y = 147 + 192 = 339
- Hilera 5: Y = 147 + 240 = 387
- Cada hilera mide 48 px de alto (1 tile)

CAMINOS (5 columnas de camino, pares):
- Columnas: 0, 2, 4, 6, 8
- Col 0: margen izquierdo
- Col 2: entre hilera 1 y hilera 2
- Col 4: entre hilera 2 y hilera 3 (también columna de la canasta)
- Col 6: entre hilera 3 y hilera 4
- Col 8: entre hilera 4 y hilera 5, acceso a hilera 5 desde aquí

POSICIONES IMPORTANTES
- Player spawn: columna de camino 4, fila de pasillo inferior
  X = (4 + 0.5) × 48 = 228 px
  Y = (bottomCorridorRow + 0.5) × 48 = 11 × 48 + 24 = 552 px (aproximadamente)
- Basket spot: columna 4, fila pasillo inferior
  X = 228 px, Y = 10 × 48 + 0.02 × 48 ≈ 480 px
- Fence: Y = 627, separa campo de zona de cosecha
- Harvest zone: Y = 639 a 760
- Footer: Y = 760 a 800

TILE / CELDA
- Tamaño: 48 × 48 px lógicos
- Sprites originales: 32 × 32 px
- Escala de dibujo: 48/32 = 1.5× (1.5x), pixel art sin deformar
- Aspect ratio mantenido: los 32×32 se estiran a 48×48 (proporción 1:1 preservada)

SPRITES
================================

PLAYER
- Archivo: Player.js, spriteKey = `player.<state>` (11 estados)
- Dimensiones originales: 32 × 32 px
- Dimensiones en pantalla: 48 × 48 px (1.5x scale)
- Escala: 1.5× exacta (32 × 1.5 = 48), mantiene aspect ratio
- Sin estiramiento/deformación
- rect: x - 10, y - 12, w: 20, h: 24 (lógicos)
- feetRect: w: width×0.8=16, h: height×0.55=13.2, posición derivada

PLANTA (mata de arándano)
- Archivo: Plant.js
- width: TILE_SIZE × HEDGE_WIDTH_TILES = 48 × 1 = 48 px
- height: TILE_SIZE × 2 = 96 px (sobresale 48 px arriba del tile)
- rect: x, y, w: 48, h: TILE_SIZE=48 (se recorta por arriba por foliageY)
- foliageY: y + TILE_SIZE - height = y + 48 - 96 = y - 48 (arraiga hacia arriba)
- spriteKey: "plant.row" (32×64 art sprite, proporción 1:2)
- width dibujado: plant.width (48 px), height dibujado: plant.height would be 96 pero se recorta a TILE_SIZE=48
- visualVariant: 0-3 aleatorio en generación, NO usado para escalar (deformaría pixel art)
- Estados: empty, few, medium, abundant, ripe, unripe, mixed, harvested

FRUTO (arándano)
- Archivo: Fruit.js, creado desde Plant.fruits datos
- size lógico: 12 px (definido en constants.js FRUIT_SIZE)
- PNG original: 16 × 16 px
- Dimensiones en pantalla: Math.round(pos.size) = 12 px (75% scale from 16→12)
- Escala: 75% exacta (16 × 0.75 = 12), mantiene aspect ratio 1:1
- Sin estiramiento/deformación
- Posición: plant.fruitPosition(fruit) retorna {x, y, size: 12}
  - side left → offset 32% del ancho de la hilera; right → 68%
  - slot: 0..1 altura relativa dentro de porción visible
  - jitter: horizontal (rng()-0.5)×14, vertical (rng()-0.5)×10
  - Clamp: minX = x + radius, maxX = x + width - radius
  - y clamp: foliageY + radius min, y + TILE_SIZE - radius max
- rect: x - 6, y - 6, w: 12, h: 12 (hitbox 6×6 px)
- Types: RIPE (azul, collectable, +10pts) / UNRIPE (rosado/verdoso, not collectable, -25pts, countsAsError)
- isCollectable: depends on definition from fruits.js

ÁRBOL (en paisaje)
- Sprites: env.treesTree1/2/3 (64×64 source, dibujados a 60×60 = 94% del sprite)
- Proporción: 60/64 = 93.75%, ligeramente achatado pero intencional
- Posición: franja de césped en paisaje, espaciado 78 px

SUELO
- No es sprite individual; se dibuja procedimentalmente en Renderer.#drawSoilColumn()
- Color base por columna (variación sutil: col%3), surcos verticales, motas de tierra
- No usa sprites del asset loader

CAMINOS
- No sprites únicos; se dibujan procedimentalmente en Renderer.#drawPathTile()
- Banda continua con vetas de rodada, granular determinista
- Diferenciada visualmente de la tierra por color #b98a5c vs #8a5f3a

ELEMENTOS DECORATIVOS
- Rocas, flores, detalles de césped del paisaje (env.decorations*)
- PNGs 32×32 source, dibujados a 22-32 px destination según tipo

COORDENADAS Y ESCALADO
================================

TRANSFORMACIÓN LÓGICA → VISUAL
El juego trabaja en coordenadas lógicas (480×800). La transformación al canvas físico ocurre así:

1. resize() en GameEngine:
   - canvas.width = displayWidth × dpr (dpr = min(window.devicePixelRatio, 2))
   - canvas.height = displayHeight × dpr
   - this.scale = Math.min(canvas.width / logicalWidth, canvas.height / logicalHeight)
   - Tope: escala máxima 2 (por rendimiento)
   - imageSmoothingEnabled = false (pixel art)

2. render() en GameEngine:
   - ctx.setTransform(this.scale, 0, 0, this.scale, offsetX, offsetY)
   - offsetX = (canvas.width - logicalWidth × this.scale) / 2
   - offsetY = (canvas.height - logicalHeight × this.scale) / 2
   - Primera traslación: ctx.translate(0, camera.worldOffsetY) = ctx.translate(0, HUD_HEIGHT)
   - Segunda traslación: ctx.translate(-camera.originX, -camera.originY)

3. Entidades se dibujan en coordenadas lógicas x, y
   - El renderer/spriten se encarga de mapear a píxeles físicos con la transform

4. HarvestAtScreen (click/touch):
   - dpr = canvas.width / rect.width (getBoundingClientRect)
   - scale = this.scale
   - offsetX = (canvas.width - logicalWidth × scale) / 2
   - offsetY = (canvas.height - logicalHeight × scale) / 2
   - logicalX = (cssX × dpr - offsetX) / scale
   - logicalY = (cssY × dpr - offsetY) / scale
   - world = camera.screenToWorldWithHud(logicalX, logicalY, 1)
   - radius = isTouchDevice ? clickToleranceTouch(22) : clickToleranceMouse(8)

ESCALADO PC vs MÓVIL
- PC: margin 4dvh top/bottom (var --game-pc-margin en responsive.css)
  - Visor ocupa alto disponible menos margen
  - Canvas centrado, proporción 3:5 exacta
  - Click tolerance: 8 px (ratón preciso)
- Móvil (vertical): margin 0px
  - Visor llena todo el alto útil
  - Click tolerance: 22 px (dedo)
  - Controles: touch/drag para mover, tap para recoger

VIEWPORT EN PANTALLA
- El canvas lógico 480×800 se escala al contenedor manteniendo proporción
- Máximo devicePixelRatio: 2 (para alta densidad de píxeles)
- image-rendering: pixelated en el CSS canvas class

FRUTOS - GENERACIÓN Y POSICIONAMIENTO
================================

POSIBLES POSICIONES
- Cada planta puede tener múltiples frutos (max 4 por planta por defecto)
- Los frutos se distribuyen por filas de la hilera (distributeRows)
- Fruits per plant weights definen la cantidad por mata
- Cada fruto tiene side (left/right) y slot (altura relativa)

RELACIÓN CON PLANTAS
- Los frutos están DENTRO del rect de la planta, nunca fuera
- fruitPosition() clampea para que el fruto esté siempre dentro de:
  - La columna de la hilera (x bounds)
  - La porción visible de la mata (y bounds: foliageY + radius a y + TILE_SIZE - radius)
- El fruto aparece "colgando" del lado de la hilera (32% izq, 68% der)

COORDENADAS: MUNDO vs PANTALLA
- Los frutos usan coordenadas lógicas del mundo (x, y en px lógicos)
- Al renderizarse, la transform de cámara/escala las convierte a físicas
- harvestAt() y harvestAtScreen() convierten pantalla → lógica → mundo

2 O 3 JUNTOS
- Cada fruto es una unidad independiente (§6: "un toque recoge UN fruto")
- Nunca aparecen apilados en el centro (§10: "nunca quedan alineados ni apilados en el centro")
- Desplazamientos jitter evitan alineación vertical

DISTANCIA ENTRE FRUTOS
- Dentro de una misma hilera, frutos en filas diferentes tienen jitter aleatorio
- Distancia horizontal mínima: determinado por el jitter ±7 px aproximadamente
- Distancia vertical: slot positioning con separación de bandas

TAMAÑO
- Lógico: 12 px (diámetro)
- Pantalla: 12 × this.scale px (typical ~12 px al 1.5x scale = ~18 px visuales)

HITBOX
- rect: x - 6, y - 6, w: 12, h: 12 (en coordenadas lógicas)
- Para detección de cercanía en harvestAt(worldX, worldY, radius)

POSICIÓN RESPECTO AL SPRITe DE LA PLANTA
- El sprite de la planta (plant.row) se dibuja EN LA BASE de la hilera
- Los frutos se dibujan EN ENCIMA, en posiciones calculadas por fruitPosition()
- Los frutos son entidades independientes sobre la planta (no pintados dentro del sprite)

INCONSISTENCIAS ENCONTRADAS
================================

1. Diagrama visual en composition.js muestra HUD en 75px, pero código tiene HUD_HEIGHT=144 (dos filas)
   - El diagrama es simplificado/antiguo; código es autoritario

2. FIELD_Y: diagrama muestra 147 pero cálculo HUD(144)+SKY(48)=192
   - 147 probablemente incluye algún offset o el diagrama redondea diferente
   - Código: FIELD_Y = SKY_Y + SKY_HEIGHT // 147 y SKY_Y=144, así SKY_HEIGHT would be 3
   - Pero línea 113 exporta SKY_HEIGHT = 48
   - Inconsistencia: 144 + 48 = 192 ≠ 147
   - Posible explicación: el diagrama en composición.js es layout visual, no matemática exacta
   - O fieldStartRow = 3 (Math.round(147/48) = 3), y el cálculo real empieza en fila 3 del tilemap

3. Need to verify actual rendered positions vs declared constants (requiere ejecutar el proyecto)

DIAGRAMA DEL CAMPO
================================

Basado en los datos reales del proyecto:

┌──────────────────────────────────────────────────────────────┐
│  HUD SUPERIOR (144 px)                                       │
│  Nivel/Tiempo/Pausa | Cosechados/Errores/Calidad/Vidas         │
├──────────────────────────────────────────────────────────────┤
│  CIELO (48 px)                                               │
│  ☁ nubes │ 🌄 montañas │ 🌃 árboles                         │
├──────────────────────────────────────────────────────────────┤
│  Y=147  ▲                                                    │
│         │  🌱🌱🌱🌱🌱🌱🌱  Hilera 1 (col 1)                   │
│         │  ───────── CAMINO ────────── (col 2)                │
│         │  🌱🌱🫐🌱🌱🫐🌱  Hilera 2 (col 3)                   │
│         │  ───────── CAMINO ────────── (col 4)                │
│         │  🌱🌱🌱🌱🌱🌱🌱  Hilera 3 (col 5)                   │
│         │  ───────── CAMINO ────────── (col 6)                │
│         │  🌱🌱🫐🌱🌱🫐🌱  Hilera 4 (col 7)                   │
│         │  ───────── CAMINO ────────── (col 8)                │
│         │  🌱🌱🌱🌱🌱🌱🌱  Hilera 5 (col 9)                   │
│         │                                                    │
│  Y=627  ▼  ┌────────────────────────────────────────────────┐│
│          │  VALLA (12 px)                                                       │
│  Y=639  ▼  │  ZONA DE COSECHA: cajas, canática, supervisor    │
│          └────────────────────────────────────────────────┘│
│  Y=760  ▼  │  FOOTER: "TRABAJO DE HOY, MEJOR FUTURO" (40 px)│
└──────────────────────────────────────────────────────────────┘

CAPTURA VISUAL
==============

No fue posible ejecutar el proyecto para capturar pantalla, pero basado en el análisis del código:

- El juego se muestra en un canvas vertical 480×800 lógicos
- El HUD superior ocupa los primeros 144 px
- El campo de cultivo comienza en Y=147 y tiene 5 hileras con caminos entre ellas
- Los arándanos aparecen como sprites azules pequeños (12px lógicos) sobre las matas
- El jugador es un personaje verde pequeño (20×24 lógicos) que camina por los caminos
- La canasta está en la columna de camino 4, en la parte inferior
- El supervisor camina por la derecha del campo
- La zona de cosecha (con cajas y camión) está en la parte inferior derecha
- Valla de madera separa el campo de la zona de cosecha a Y=627

Si se ejecuta el proyecto, la captura mostraría:
- Canvas centrado en la página con proporción 3:5
- HUD superior con nivel, tiempo, cosechados, calidad, vidas
- Campo con 5 filas de matas de arándano y caminos entre ellas
- Frutos azules (maduros) y rosados (pintones) colgando de las matas
- Jugador posicionado en el pasillo inferior
- Canasta llena o vacía dependiendo del progreso del nivel

ARCHIVOS RELEVANTES
==================

1. src/game/config/gameConfig.js - configuración global (velocidades, dimensiones,umbrales)
2. src/game/map/composition.js - composición visual fija (hileras, columnas, Y-positions)
3. src/game/map/MapGenerator.js - generación procedural de niveles
4. src/game/entities/Player.js - lógica y sprite del jugador
5. src/game/entities/Plant.js - definición de planta, posición de frutos, spriteKey
6. src/game/entities/Fruit.js - definición de fruto, tamaño, posición, side/slot
7. src/game/rendering/Renderer.js - orden de dibujo, capas, drawPlants/drawFruits
8. src/game/rendering/SpriteRenderer.js - dibujo de sprites, escalado, frameSize
9. src/game/rendering/Camera.js - cámara con seguimiento, deadZone, worldOffsetY
10. src/game/map/Map.js - TileMap, collisionMap, bounds
11. src/data/levels.js - configuración por nivel (tiempo límite, frutas objetivo)
12. src/data/plants.js - definiciones de estado de planta, variantes visuales
13. src/data/fruits.js - definiciones de fruto maduro/pintón, puntos, qualityDelta
14. src/styles/responsive.css - escalado PC vs móvil, márgenes, aspect ratio 3:5
15. src/styles/global.css - reset, fondo, utilidades

INCONSISTENCIAS (SIN CORREGIR)
==============================

1. Diagrama visual muestra HUD en 75px vs código HUD_HEIGHT=144 (dos filas) - diagrama simplificado
2. Cálculo FIELD_Y: diagrama dice 147, constante dice 147 pero matemática HUD(144)+SKY(48)=192
   - La constante FIELD_Y=147 es la posición real de inicio del campo en el mundo lógico
   - El diagrama es representación visual, no necesariamente matemáticamente exacta en cada píxel
3. Necesaría ejecutar el proyecto para verificar posiciones renderizadas vs declaradas

================================================================================
ANÁLISIS TERMINADO — SIN CAMBIOS REALIZADOS
================================================================================