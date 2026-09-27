/**
 * composition.js
 * ---------------------------------------------------------------
 * COMPOSICIÓN VISUAL DEL JUEGO — fuente única de verdad.
 *
 * Aquí viven TODAS las medidas de la composición vertical y
 * horizontal. Ninguna otra parte del código debería inventar un
 * número de layout: se lee de aquí (especificación §24).
 *
 * POR QUÉ EXISTE ESTE ARCHIVO
 * Antes las medidas estaban repartidas entre mapLayout.js (que
 * calculaba columnas y filas con fórmulas dependientes del nivel),
 * gameConfig.js (alturas del HUD) y números sueltos dentro de
 * Renderer/MapGenerator. El resultado era que el campo cambiaba de
 * tamaño en cada nivel (624 px de ancho en el 1, 1200 px en el 12)
 * y cada nivel se veía a una escala distinta.
 *
 * Ahora la composición es FIJA: 5 hileras siempre, campo de ancho
 * exacto al viewport (sin scroll horizontal) y la misma estructura
 * en los 12 niveles.
 *
 * ---------------------------------------------------------------
 * COMPOSICIÓN VERTICAL (800 px)
 * ---------------------------------------------------------------
 *
 *   ┌────────────────────────────────────┐  0
 *   │  HUD SUPERIOR                75 px │
 *   ├────────────────────────────────────┤  75
 *   │  CIELO                              │
 *   │  MONTAÑAS / HORIZONTE               │  CIELO_Y .. FIELD_Y
 *   │  ÁRBOLES                            │
 *   ├────────────────────────────────────┤  FIELD_Y = 75
 *   │  CAMPO                              │
 *   │    camino                           │
 *   │    hilera 1                         │
 *   │    camino                           │  FIELD_HEIGHT
 *   │    hilera 2                         │
 *   │    ...                              │
 *   │    hilera 5                         │
 *   │    camino                           │
 *   ├────────────────────────────────────┤  FENCE_Y
 *   │  VALLA                        12 px │
 *   ├────────────────────────────────────┤  HARVEST_Y
 *   │  ZONA DE COSECHA                    │
 *   │    cajas · canasta · supervisor     │  HARVEST_HEIGHT
 *   │    camión                           │
 *   ├────────────────────────────────────┤  FOOTER_Y
 *   │  FOOTER                       40 px │
 *   └────────────────────────────────────┘  800
 *
 * ---------------------------------------------------------------
 * COMPOSICIÓN HORIZONTAL (480 px) — 5 HILERAS
 * ---------------------------------------------------------------
 *
 *   La rejilla es de tiles de 48 px y 480 / 48 = 10 columnas
 *   EXACTAS, así que el campo mide justo el ancho del viewport y
 *   NUNCA hay scroll horizontal (requisito §2).
 *
 *   col  0        MARGEN/CAMINO   ← se camina por aquí
 *   col  1        HILERA 1
 *   col  2        CAMINO          ← se camina por aquí
 *   col  3        HILERA 2
 *   col  4        CAMINO
 *   col  5        HILERA 3
 *   col  6        CAMINO
 *   col  7        HILERA 4
 *   col  8        CAMINO
 *   col  9        HILERA 5        ← la última hilera toca el borde
 *                                   derecho, pero el jugador puede
 *                                   rodearla por el camino de la
 *                                   columna 8.
 *
 *   Son 5 hileras y 5 columnas de camino (0,2,4,6,8): el jugador
 *   tiene margen a la izquierda, camino entre cada par de hileras,
 *   y acceso a la hilera 5 desde la columna 8.
 *
 *   NOTA sobre el margen derecho: 2·margen + 5·hilera + 4·camino
 *   pedía 11 bandas, y 11 no cabe en 10 columnas exactas sin dejar
 *   un resto que forzaría scroll. Se resuelve fusionando el margen
 *   derecho con la última hilera: la hilera 5 se dibuja igual y se
 *   cosecha desde la columna 8, así que la jugabilidad es idéntica
 *   y el ancho queda exacto.
 */

import { TILE_SIZE } from '../config/constants.js';

/* ============================================================
   VIEWPORT LÓGICO (no cambiar sin cambiar gameConfig)
   ============================================================ */
export const VIEW_WIDTH = 480;
export const VIEW_HEIGHT = 800;

/* ============================================================
   FRANJAS VERTICALES
   ============================================================ */
/** Alto del HUD superior. */
export const HUD_HEIGHT = 144;

/** Y donde empieza la franja de cielo/paisaje. */
export const SKY_Y = HUD_HEIGHT;

/**
 * Alto del paisaje (cielo + montañas + árboles).
 *
 * El cielo es una CAPA CONTINUA al fondo, no un trozo por tile
 * (§4). Su alto se elige para que el horizonte quede visible por
 * encima del campo sin comerse el área de cultivo, y además para que
 * FIELD_Y caiga en un múltiplo del tile: así la rejilla de cultivo
 * cuadra con los caminos y no hay medio tile desalineado.
 *
 *   HUD 144 + SKY 48 = 192 = 4 tiles exactos
 */
export const SKY_HEIGHT = 48;

/** Y donde empieza el campo de cultivo. */
export const FIELD_Y = SKY_Y + SKY_HEIGHT; // 147

/* ---------- Estructura horizontal del campo ---------- */

/** Número de hileras de cultivo. FIJO en todos los niveles (§2). */
export const ROW_COUNT = 5;

/**
 * Columnas de la rejilla. 480 / 48 = 10 exactas → sin scroll.
 * @type {number}
 */
export const COL_COUNT = VIEW_WIDTH / TILE_SIZE; // 10

/**
 * Columnas de CAMINO (donde el jugador puede caminar en vertical).
 * Son las pares: 0, 2, 4, 6, 8. La columna 0 es el margen
 * izquierdo y las demás separan las hileras.
 * @type {number[]}
 */
export const PATH_COLS = Object.freeze(
  Array.from({ length: ROW_COUNT }, (_, i) => i * 2),
);

/**
 * Columnas de HILERA de cultivo. Son las impares: 1, 3, 5, 7, 9.
 * @type {number[]}
 */
export const ROW_COLS = Object.freeze(
  Array.from({ length: ROW_COUNT }, (_, i) => i * 2 + 1),
);

/** Alto de UNA fila de cultivo, en px (= 1 tile). */
export const ROW_HEIGHT = TILE_SIZE;

/**
 * Número de filas de cultivo a lo alto del campo.
 *
 * El campo visible tiene FIELD_HEIGHT; la primera y la última fila
 * se reservan para los pasillos horizontales superior e inferior,
 * que permiten cambiar de línea y llegar a la valla.
 */
export const FIELD_ROWS_COUNT = 8;

/** Alto del área de cultivo propiamente dicha. */
export const CROP_HEIGHT = FIELD_ROWS_COUNT * ROW_HEIGHT; // 384

/** Alto del campo completo (pasillos + cultivo). */
export const FIELD_HEIGHT = CROP_HEIGHT + 2 * ROW_HEIGHT; // 480

/** Y donde termina el campo / empieza la valla. */
export const FENCE_Y = FIELD_Y + FIELD_HEIGHT; // 627

/** Alto de la valla que separa campo de zona de cosecha. */
export const FENCE_HEIGHT = 12;

/** Y donde empieza la zona de cosecha. */
export const HARVEST_Y = FENCE_Y + FENCE_HEIGHT; // 639

/** Alto del footer. */
export const FOOTER_HEIGHT = 40;

/** Y donde empieza el footer. */
export const FOOTER_Y = VIEW_HEIGHT - FOOTER_HEIGHT; // 760

/** Alto de la zona de cosecha (lo que queda entre valla y footer). */
export const HARVEST_HEIGHT = FOOTER_Y - HARVEST_Y; // 121

/* ============================================================
   COMPROBACIONES
   ------------------------------------------------------------
   Si alguien ajusta una constante y descuadra la composición,
   esto lo delata al importar el módulo. Es barato y evita el tipo
   de bug silencioso que dejaba el campo desalineado.
   ============================================================ */
const totalVertical = HUD_HEIGHT + SKY_HEIGHT + FIELD_HEIGHT
  + FENCE_HEIGHT + HARVEST_HEIGHT + FOOTER_HEIGHT;

if (totalVertical !== VIEW_HEIGHT) {
  // eslint-disable-next-line no-console
  console.warn(
    `[composition] La composición vertical suma ${totalVertical} px y el `
    + `viewport mide ${VIEW_HEIGHT}. Revisa SKY_HEIGHT / FIELD_HEIGHT / `
    + `HARVEST_HEIGHT / FOOTER_HEIGHT.`,
  );
}

if (ROW_COUNT !== 5) {
  // eslint-disable-next-line no-console
  console.warn(`[composition] ROW_COUNT debería ser 5 (es ${ROW_COUNT}).`);
}

if (VIEW_WIDTH % TILE_SIZE !== 0) {
  // eslint-disable-next-line no-console
  console.warn(
    `[composition] VIEW_WIDTH (${VIEW_WIDTH}) no es múltiplo de TILE_SIZE `
    + `(${TILE_SIZE}): el campo tendría scroll horizontal.`,
  );
}

/* ============================================================
   HELPERS
   ============================================================ */

/** ¿Esta columna es caminable (camino)? */
export function isPathCol(col) {
  return PATH_COLS.includes(col);
}

/** ¿Esta columna lleva cultivo? */
export function isRowCol(col) {
  return ROW_COLS.includes(col);
}

/**
 * Y lógica dentro del campo para una fila de cultivo.
 * @param {number} rowIndex 0-based, dentro de CROP_ROWS
 */
export function cropRowY(rowIndex) {
  return FIELD_Y + ROW_HEIGHT + rowIndex * ROW_HEIGHT;
}

/** Fila vertical (índice global del TileMap) donde empieza el campo. */
export const FIELD_START_ROW = Math.round(FIELD_Y / TILE_SIZE);

/** Fila vertical donde termina el campo. */
export const FIELD_END_ROW = Math.round(FENCE_Y / TILE_SIZE) - 1;

export default {
  VIEW_WIDTH,
  VIEW_HEIGHT,
  HUD_HEIGHT,
  SKY_Y,
  SKY_HEIGHT,
  FIELD_Y,
  FIELD_HEIGHT,
  FIELD_ROWS_COUNT,
  CROP_HEIGHT,
  ROW_COUNT,
  COL_COUNT,
  PATH_COLS,
  ROW_COLS,
  ROW_HEIGHT,
  FENCE_Y,
  FENCE_HEIGHT,
  HARVEST_Y,
  HARVEST_HEIGHT,
  FOOTER_Y,
  FOOTER_HEIGHT,
};
