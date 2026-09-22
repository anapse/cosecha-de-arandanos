# 🎨 Sprites — Cosecha de Arándanos

**Estado: 95 sprites PNG reales generados por código.**

Ya no hay placeholders. Todos los sprites del juego existen como
archivos **PNG transparentes** en `public/assets/`, con los nombres y
tamaños EXACTOS de las láminas de referencia del proyecto.

---

## Cómo se generan

Los sprites se producen con un generador propio, **sin dependencias
externas** (ni librerías de imagen, ni canvas nativo):

```bash
npm run sprites          # genera los 95 PNG en public/assets/
npm run sprites:sheet    # genera + lámina de contacto para revisar
npm run sprites:preview  # genera una página HTML con todos los sprites
```

| Herramienta | Para qué sirve |
|---|---|
| `tools/png.js` | Codificador PNG a mano (firma + IHDR + IDAT + IEND con zlib de Node) |
| `tools/pixelCanvas.js` | Lienzo de pixel art: píxel, rect, círculo, elipse, polígono, línea, espejo |
| `tools/palette.js` | Paleta de 16 bits del juego |
| `tools/artCharacters.js` | Jugador y supervisor (anatomía fija de 32x32) |
| `tools/artWorld.js` | Plantas, frutos, terreno, canastas, camión, UI, efectos, entorno |
| `tools/generateSprites.js` | Orquestador: escribe los 95 PNG en disco |
| `tools/makeContactSheet.js` | Lámina de contacto (`tools/contact-sheet.png`) para revisar el arte |

### ¿Por qué a mano y no con una librería?

El proyecto tiene la regla de **no añadir librerías innecesarias**. Un
PNG solo necesita firma + IHDR + IDAT + IEND, y Node ya trae `zlib`
para el deflate. Escribir el codificador ocupa ~80 líneas y evita
dependencias en el build.

---

## Inventario (95 archivos)

| Carpeta | Archivos | Contenido |
|---|---|---|
| `player/` | 13 | Idle, 4 direcciones de caminado, recoger izq/der, esperar, lleno, cansado, error, victoria, derrota |
| `supervisor/` | 10 | Idle, 4 direcciones, revisar, anotar, detectar error, aprobar, hablar |
| `plants/` | 8 | Vacía, pocas, media, abundante, madura, pintona, mixta, cosechada |
| `fruits/` | 6 | Maduro, pintón, grupo x2, grupo x3, en mano, cayendo |
| `terrain/` | 15 | Tierra, 4 caminos, césped, borde, 3 cercas, zona/marcador de entrega, detalle, piedra, flor |
| `basket/` | 8 | 4 estados de canasta + 4 de caja |
| `truck/` | 2 | Camión lateral, camión cargado |
| `ui/` | 12 | 3 corazones, iconos (arándano, reloj), barras, 4 botones, marco |
| `effects/` | 9 | 2 partículas animadas, destello, hoja, textos, 2 sombras, selección |
| `environment/` | 12 | Cielo, nubes, montañas, 3 árboles, 2 carteles, arbusto, roca, césped, flores |

**Tamaños:** 16x16 (UI, frutos, efectos) · 32x32 (personajes, plantas,
tiles, canastas) · 64x40 (camión) · 64x64 (árboles, carteles) ·
128x32 (spritesheets de 4 frames) · 128x64 (cielo, nubes, montañas).

**Peso total: ~24 KB** para los 95 archivos.

---

## Formato

- **PNG transparente**, RGBA de 8 bits.
- **Sin suavizado:** el motor dibuja con `imageSmoothingEnabled = false`.
- Los **spritesheets** son tiras HORIZONTALES de N frames. Un archivo de
  128x32 son 4 frames de 32x32.

Ejemplo de declaración en `src/data/assets.js`:

```js
'player.walkDown': { path: 'player/player_walk_down.png', frames: 4, frameSize: 32 }
```

---

## Anatomía de los personajes (32x32)

Ambos personajes comparten una rejilla fija definida en
`tools/artCharacters.js`. Todas las partes se colocan a partir de esas
constantes para que **nunca se solapen ni dejen huecos**:

```
y = 0..1   margen
y = 2..7   sombrero (copa + ala)
y = 8..15  cabeza (ojos, boca, bigote del supervisor)
y = 16..24 torso (camisa, cuello, cinturón)
y = 25..28 piernas (izquierda y derecha, separadas)
y = 29..31 zapatos
sombra     y = 30
```

> Se corrigió un fallo real: antes cada parte usaba un desplazamiento
> absoluto distinto y **el torso tapaba las piernas**, así que los pies
> no se veían y el personaje parecía flotar.

### Rasgos distintivos

- **Jugador:** sombrero **rosa** (el rasgo más reconocible), camisa azul,
  pantalón oscuro, mochila de madera. De espaldas se ve la mochila
  completa.
- **Supervisor:** sombrero claro con banda, camisa azul oscuro formal,
  corbata, **bigote**, portapapeles.

---

## Sustituir el arte por ilustraciones a mano

El arte generado es arte real y jugable, pero si más adelante se quiere
reemplazar por ilustraciones dibujadas a mano:

1. Deja el PNG **con el mismo nombre y el mismo tamaño** en
   `public/assets/<carpeta>/`.
2. Listo. **No hay que tocar el motor ni el manifiesto.**

El motor pide los sprites por **clave lógica** (`player.walkDown`), nunca
por nombre de archivo, así que el arte es totalmente intercambiable.

---

## Verificación automática

Dos suites de pruebas protegen el catálogo:

| Prueba | Qué garantiza |
|---|---|
| `tests/assets.test.js` | Cada clave del manifiesto apunta a un PNG que **existe**, es RGBA de 8 bits, pesa lo razonable, y los spritesheets tienen el ancho correcto |
| `tests/assetLoading.test.js` | El `AssetLoader` carga los PNG reales y **NO queda ningún asset usando placeholder** |

Así es imposible renombrar un sprite en el manifiesto y olvidarse de
generar el archivo: las pruebas fallan.

---

## Carpetas

```
public/assets/
├── player/       Jugador (13)
├── supervisor/   Supervisor de calidad (10)
├── plants/       Plantas de arándanos (8)
├── fruits/       Frutos (6)
├── terrain/      Tiles de terreno (15)
├── basket/       Canastas y cajas (8)
├── truck/        Camión (2)
├── ui/           Interfaz (12)
├── effects/      Efectos y partículas (9)
├── environment/  Entorno y fondo (12)
└── sounds/       Sonidos (opcionales, ver abajo)
```

---

## Sonidos

Los sonidos siguen siendo **opcionales**. Mientras no existan los `.wav`
en `public/assets/sounds/`, el `AudioManager` genera tonos con la
WebAudio API, así que el juego tiene feedback sonoro igualmente.

Nombres esperados: `harvest.wav`, `error.wav`, `deliver.wav`,
`supervisor-alert.wav`, `victory.wav`, `defeat.wav`, `button.wav`,
`truck.wav`.
