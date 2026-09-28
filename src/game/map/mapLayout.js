/**
 * mapLayout.js
 * ---------------------------------------------------------------
 * Reglas de tamaño del mapa en tiles (§19, §37).
 *
 * Se mantiene aparte para que MapGenerator no mezcle cálculo de
 * dimensiones con construcción del terreno.
 *
 * IMPORTANTE — proporción con el viewport:
 * El juego se ve en un viewport lógico vertical de 360x640 (§7, §11),
 * pero el campo NO ocupa toda la pantalla: arriba va el HUD y abajo el
 * HUD inferior (§2, §7). La franja útil para el campo es:
 *
 *     alto útil = 640 - HUD_SUPERIOR - HUD_INFERIOR
 *
 * El campo se calcula para CUBRIR esa franja. Si fuese más pequeño, la
 * cámara dejaría huecos; si es más grande, la cámara hace scroll y el
 * campo se siente profundo, como en la referencia.
 */

import { TILE_SIZE } from '../config/constants.js';
import { GAME_CONFIG } from '../config/gameConfig.js';

/** Alto del viewport lógico completo (px). */
export const VIEW_HEIGHT = GAME_CONFIG.logicalHeight;

/** Ancho del viewport lógico que hay que cubrir (px). */
export const VIEW_WIDTH = GAME_CONFIG.logicalWidth;

/** Alto de la franja útil donde vive el campo (px). */
export const PLAY_HEIGHT =
  GAME_CONFIG.logicalHeight - GAME_CONFIG.hudHeight - GAME_CONFIG.hudBottomHeight;

/**
 * Número de columnas: [pasillo][PLANTA][CAMINO][PLANTA]...[PLANTA][pasillo]
 * @param {number} rows número de líneas de cultivo
 * @returns {number}
 */
export function TILE_COLUMNS(rows) {
  const safeRows = Math.max(1, Math.floor(rows));
  // 1 pasillo + N plantas + (N-1) caminos + 1 pasillo
  return 1 + safeRows + (safeRows - 1) + 1;
}

/** Filas de la franja de paisaje superior (cielo, montañas nevadas, árboles, cerca). */
export const GRASS_ROWS = 3;

/** Filas del pasillo horizontal superior para cruzar entre hileras. */
export const TOP_CORRIDOR_ROWS = 1;

/** Filas de CULTIVO (hileras más cortas para dar espacio al paisaje y la entrega). */
export const CROP_ROWS = 6;

/** Filas del pasillo horizontal que cierra el campo por abajo. */
export const CORRIDOR_ROWS = 1;

/** Filas de la zona de entrega inferior amplia (camión, cajas, cesta, supervisor). */
export const DELIVERY_ROWS = 5;

/** Filas de cultivo objetivo (6 filas de arbustos bien proporcionadas). */
export const MIN_FIELD_ROWS = 6;
export const MAX_FIELD_ROWS = 6;

/**
 * Número de filas de CULTIVO.
 * @param {number} plantsPerRow
 * @returns {number}
 */
export function FIELD_ROWS_FOR(plantsPerRow) {
  return 6;
}

/**
 * Número total de filas del mapa:
 * paisaje (3) + pasillo superior (1) + cultivo (6) + pasillo inferior (1) + entrega (5) = 16 filas (768px).
 * Proporción exacta 9:16 (432x768).
 * @param {number} plantsPerRow
 * @returns {number}
 */
export function TILE_ROWS_FOR(plantsPerRow) {
  return GRASS_ROWS + TOP_CORRIDOR_ROWS + FIELD_ROWS_FOR(plantsPerRow) + CORRIDOR_ROWS + DELIVERY_ROWS;
}

/**
 * Columnas para el campo de cultivo.
 * Se fija al layout de 4 hileras de cultivo (9 columnas: pasillo,
 * hilera 1, camino, hilera 2, camino, hilera 3, camino, hilera 4, pasillo)
 * idéntico al ancho del juego (432px = 9 * 48px) para que la cámara NO se mueva horizontalmente.
 *
 * @param {number} rows líneas definidas por el nivel
 * @returns {number} columnas finales (9)
 */
export function TILE_COLUMNS_FOR_VIEW(rows) {
  return 9; // 9 columnas exactas = 4 hileras de cultivo y ancho total de 432px
}
