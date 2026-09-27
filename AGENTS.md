# COSECHA DE ARÁNDANOS — Fundo San Jorge — Contexto del proyecto

> Contexto **estable**: arquitectura, reglas y decisiones que NO cambian.
> El estado cambiante está en `HANDOFF.md`.

---

## Propósito

Microjuego web 2D pixel-art top-down: recolectar arándanos maduros,
llevarlos a la canasta y entregarlos antes del supervisor.
12 niveles. Un jugador.

**Ubicación:** `D:\PROYECTOS\cosecha-de-arandanos`
**Perfil de Hermes:** `arandanos`

---

## Arquitectura

```
motor (JS puro, SIN React)  ←→  React solo shell/UI
        GameEngine.js              GameShell = única frontera
        GameCanvas.jsx = puente
```

**Regla de oro:** `GameEngine.js` **nunca** importa React. Es JS puro reutilizable.

```
src/
├── game/
│   ├── GameEngine.js         motor principal (~1520 líneas)
│   ├── GameCanvas.jsx        puente React ↔ motor
│   ├── config/               gameConfig.js (ajustable), constants.js (inmutable)
│   ├── map/                  TileMap, MapGenerator, mapLayout, CollisionMap
│   ├── entities/             Player, Plant, Fruit, Basket, Box, Supervisor, Truck
│   ├── systems/              Harvest, Delivery, Quality, Score, Timer, Supervisor, Level
│   ├── rendering/            Renderer, HudRenderer, Camera, AssetLoader, SpriteRenderer
│   ├── input/                KeyboardInput, TouchInput
│   └── {collision,animation,effects,audio,state}/
├── components/               GameShell, MainMenu, Tutorial, PauseMenu, …
├── data/                     assets.js (catálogo), levels.js, plants.js, fruits.js
├── styles/                   variables, global, responsive, result-screen
└── app/                      App.jsx, App.css
```

**Assets:** 114 PNG, **rutas RELATIVAS** (`assets/…`, no `/assets/…`).
`src/data/assets.js` es la fuente única; `ASSET_MANIFEST.md` se **genera**.

---

## Reglas de trabajo

### ⛔ Prohibiciones absolutas
- **NO multijugador, NO servidor de partidas, NO WebSocket, NO salas.**
  Es **100% single player**. "Jugar desde otra PC/móvil" = solo servir la app.
- **NO deformar sprites.** Escala uniforme (scaleX == scaleY) siempre.
- **NO experimentar con `TILE_SIZE` "a ver qué pasa".** Ya se probó
  32→48→96 y empeoró. Si hay que cambiar escala, **calcular primero**.
- **NO borrar funcionalidad** para conseguir una captura bonita.
- **NO rehacer la arquitectura.** React + Vite se mantiene.

### ✅ Método obligatorio
1. **Auditar antes de tocar** — mirar el código, no suponer.
2. **Analizar → ejecutar → verificar → explicar → continuar.**
3. Medir con datos, no "parece que".
4. Trabajos de limpieza: **solo-lectura primero**, reporte, y autorización
   explícita por fase. **No borrar el origen hasta verificar el destino.**
5. Cambios de arte/escala: **consultar antes** de generar o borrar assets.

---

## Decisiones que NO deben cambiarse

| Decisión | Motivo |
|---|---|
| **React + Vite** | Instrucción directa del usuario (la spec decía "no React") |
| **Viewport vertical 9:16 centrado** | §45 — no estirar, no deformar |
| **`assets.js` como catálogo único** | Evita desincronización con el manifiesto |
| **PNG encoder propio** | Sin dependencias innecesarias |
| **Colisión por pies** (`feetRect`) | Movimiento por ejes separados (X luego Y) |
| **Mapa procedural** | `MapGenerator.generateLevel(levelConfig)` |
| **Rutas de assets relativas** | Para que funcione desde la LAN |
| **Vite `host: true`** | Acceso desde otro dispositivo |

---

## Comandos

```bash
npm run dev          # http://localhost:5173
npm run build        # genera dist/
npm test             # 156 tests esperados
npm run sprites      # regenera los 114 PNG
npm run manifest     # regenera ASSET_MANIFEST.md

# Auditorías con Chrome headless (sin instalar nada)
npm run audit:viewport   # 7/7 esperado
npm run audit:touch      # 9/9
npm run audit:keyboard   # 10/10
npm run audit:network    # 7/7
npm run test:lan         # 13/13
```

---

## Archivos importantes

| Archivo | Qué es |
|---|---|
| `README.md` | Documentación general |
| `HANDOFF.md` | **Estado actual** ← leer al empezar |
| `public/assets/ASSET_MANIFEST.md` | Generado: 114 assets |
| `tools/` | Generadores de arte + auditorías |
| `tests/` | 12 suites |

**Spec original:** `D:\PROYECTO_COSECHA_ARANDANOS_ESPECIFICACIONES.txt`
**Referencia visual:** `C:\Users\Osiris\AppData\Local\hermes\attachments\Cosecha de Arándanos en Fundo San Jorge(4).png`

---

## Estado conocido (al crear este archivo)

- **156 tests** — 151 pasan, **5 fallan** (trabajo a medias de presentación)
- Build OK
- Escala: `TILE_SIZE = 48`
- **Pendiente:** hileras continuas, zona de entrega, HUD simplificado, D-pad móvil
