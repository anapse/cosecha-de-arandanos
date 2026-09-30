/**
 * mapLayout.js
 * ---------------------------------------------------------------
 * Dimensiones y distribución del campo de juego (480x800).
 *
 * Layout 9:16 vertical perfecto:
 * - 10 columnas de 48px = 480px de ancho exacto.
 * - 16 filas de 48px = 768px de alto (con fondo base hasta 800px).
 *
 * Distribución de columnas:
 * [0: Camino izq] [1: Plantas] [2: Caminería 1] [3: Plantas] [4: Caminería 2]
 * [5: Plantas]    [6: Caminería 3] [7: Plantas] [8: Caminería 4] [9: Camino der]
 */

import { GAME_CONFIG } from '../config/gameConfig.js';

export const VIEW_HEIGHT = GAME_CONFIG.logicalHeight;
export const VIEW_WIDTH = GAME_CONFIG.logicalWidth;

export const PLAY_HEIGHT = GAME_CONFIG.logicalHeight;

/** Filas de paisaje superior (cielo, montañas, fondo). */
export const GRASS_ROWS = 3;

/** Pasillo horizontal superior para cruzar entre caminerías. */
export const TOP_CORRIDOR_ROWS = 1;

/** Filas de cultivo de arándanos (filas 4 a 9 = 6 filas). */
export const CROP_ROWS = 6;

/** Pasillo horizontal inferior de tránsito. */
export const CORRIDOR_ROWS = 1;

/** Zona de entrega y acopio inferior (filas 11 a 15). */
export const DELIVERY_ROWS = 5;

export function FIELD_ROWS_FOR(plantsPerRow) {
  return 6;
}

export function TILE_ROWS_FOR(plantsPerRow) {
  return 16;
}

export function TILE_COLUMNS_FOR_VIEW(rows) {
  return 10; // 10 columnas exactas x 48px = 480px (ancho completo del canvas)
}
