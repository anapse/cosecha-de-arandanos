# 🎨 Assets — Cosecha de Arándanos

**Estado actual: 100% placeholders generados por código.**

No hay ningún archivo de imagen en el proyecto todavía. El juego es
completamente legible y jugable porque `PlaceholderFactory.js` dibuja por
código el pixel art temporal de cada sprite.

## Cómo funciona

1. El motor pide un sprite por su **clave lógica** (por ejemplo
   `player.walkDown`), nunca por nombre de archivo.
2. `AssetLoader` busca ese asset en las rutas declaradas en
   `src/data/assets.js`.
3. **Si el archivo no existe, se usa el placeholder generado por código.**
   El juego nunca se rompe por un sprite ausente.

## Cómo sustituir un placeholder por arte definitivo

1. Deja el PNG en la carpeta correspondiente con el nombre indicado en
   `src/data/assets.js`.
2. **Listo.** No hay que modificar ni una línea del motor.

Ejemplo: para reemplazar el jugador caminando hacia abajo, guarda el
archivo como `player/walk-down.png` dentro de `public/assets/`.

## Estilo visual requerido

- **Pixel art 16-bit**, colores vivos, contornos claros.
- Personajes pequeños y reconocibles.
- Arándanos **azules** (maduros) y **rosados/verdosos** (pintones).
- Caminos marrones claramente visibles, plantas verdes.
- **Rojo** para errores, **amarillo** para alertas, **verde** para
  aprobación.
- Fondo transparente (PNG con canal alfa).
- **Sin suavizado**: el motor dibuja con `imageSmoothingEnabled = false`.

## Tamaños soportados

| Tipo | Tamaño | Formato |
|---|---|---|
| Jugador / Supervisor | 32×32, 48×48 o 64×64 | PNG o spritesheet horizontal |
| Plantas | 32×32 | PNG |
| Frutos | 8×8 (o 10×10) | PNG |
| Terreno | 32×32 | PNG (tiles que encajen entre sí) |
| Canasta / Cajas | 32×32 | PNG |
| Camión | 64×40 | PNG |
| UI | 16×16 | PNG |
| Efectos | 16×16 | Spritesheet con N frames |
| Entorno | 16–128 px | PNG |

## Spritesheets

Un spritesheet es **una sola imagen con los frames en fila horizontal**.
El motor corta cada frame usando el tamaño declarado en
`src/data/assets.js`:

```js
'player.walkDown': { path: 'player/walk-down.png', frames: 4, frameSize: 32 }
```

Esto significa: una imagen de **128×32** (4 frames de 32×32).

## Frames necesarios

### Jugador (30-40 frames)

| Estado | Frames |
|---|---|
| Quieto (`idle`) | 2-4 |
| Caminar arriba / abajo / izquierda / derecha | 4 cada uno |
| Recoger izquierda / derecha | 4-6 cada uno |
| Error | 2-4 |
| Cansado | 2-4 |
| Victoria | 4-6 |
| Derrota | 4-6 |

### Supervisor (25-30 frames)

| Estado | Frames |
|---|---|
| Caminar (4 direcciones) | 4 cada uno |
| Revisar (`inspect`) | 4 |
| Anotar (`write`) | 3-4 |
| Detectar error | 2-4 |
| Aprobar | 2-4 |

### Plantas (8 variantes reutilizables)

No se crea una imagen por arbusto: se combinan estas 8 variantes:

`empty` · `few` · `medium` · `abundant` · `ripe` · `unripe` · `mixed` ·
`harvested`

### Frutos

`ripe` (azul) · `unripe` (rosado/verdoso)

Tipos futuros ya reservados: `small`, `damaged`, `special`, `bonus`.

### Terreno (10-16 tiles 32×32)

`soil` · `soilLight` · `soilDark` · `path` · `pathH` · `corner` ·
`cross` · `border` · `grass` · `fence` · `delivery`

Los tiles deben **encajar entre sí** para poder construir muchos mapas
combinándolos.

### Sonidos (opcionales)

`harvest.wav` · `error.wav` · `deliver.wav` · `supervisor-alert.wav` ·
`victory.wav` · `defeat.wav` · `button.wav` · `truck.wav`

> Mientras no existan, el `AudioManager` genera tonos con la WebAudio API.

## Carpetas

```
public/assets/
├── player/       Jugador
├── supervisor/   Supervisor de calidad
├── plants/       Variantes de planta
├── fruits/       Arándanos
├── terrain/      Tiles de terreno
├── basket/       Canastas y cajas
├── truck/        Camión
├── ui/           Iconos y elementos de interfaz
├── effects/      Partículas y efectos
├── environment/  Árboles, montañas, nubes, cercas
└── sounds/       Efectos de sonido
```

## Recomendaciones

- Mantén los archivos **pequeños**: son pixel art de 8 a 64 px.
- Optimiza los PNG antes de subirlos (por ejemplo con `pngquant`).
- Nombra los archivos **en minúsculas y con guiones**.
- No cambies las rutas sin actualizar `src/data/assets.js`.
- Estima unos **100-150 assets/frames** en total, pero recuerda que no
  son 100 ilustraciones distintas: la mayoría son frames y variantes
  reutilizables.
