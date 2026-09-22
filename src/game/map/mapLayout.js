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

/** Filas de la franja de césped superior. */
export const GRASS_ROWS = 2;

/** Filas de la zona de entrega inferior (§4). */
export const DELIVERY_ROWS = 3;

/** Filas del pasillo horizontal que cierra el campo por abajo. */
export const CORRIDOR_ROWS = 1;

/** Filas de cultivo MÍNIMAS: dan la sensación de campo profundo. */
export const MIN_FIELD_ROWS = 14;

/**
 * Número de filas de CULTIVO necesarias para cubrir el área útil.
 *
 * Las plantas se reparten a lo largo de estas filas, así que en
 * niveles con menos plantas por línea el campo es más alto pero cada
 * línea tiene las mismas plantas repartidas. El nivel sigue teniendo
 * exactamente `plantsPerRow` plantas por línea (§20).
 *
 * @param {number} plantsPerRow plantas por línea (define la densidad)
 * @returns {number} filas de cultivo
 */
export function FIELD_ROWS_FOR(plantsPerRow) {
  const p = Math.max(1, Math.floor(plantsPerRow));

  // Filas fijas: césped + pasillo inferior + zona de entrega.
  const fixedRows = GRASS_ROWS + CORRIDOR_ROWS + DELIVERY_ROWS;
  const availablePx = PLAY_HEIGHT - fixedRows * TILE_SIZE;

  // El campo debe cubrir el área útil Y tener al menos MIN_FIELD_ROWS
  // para verse como setos continuos y no como un par de filas.
  const neededPx = Math.max(availablePx, MIN_FIELD_ROWS * TILE_SIZE);

  return Math.max(p, Math.ceil(neededPx / TILE_SIZE));
}

/**
 * Número total de filas del mapa:
 * césped + filas de cultivo + pasillo inferior + zona de entrega
 * @param {number} plantsPerRow
 * @returns {number}
 */
export function TILE_ROWS_FOR(plantsPerRow) {
  return GRASS_ROWS + FIELD_ROWS_FOR(plantsPerRow) + CORRIDOR_ROWS + DELIVERY_ROWS;
}

/**
 * Columnas mínimas para cubrir el ancho de la pantalla.
 * Si las líneas del nivel no llenan los 360 px, se añaden líneas
 * extra de cultivo para que el campo no se vea vacío.
 *
 * @param {number} rows líneas definidas por el nivel
 * @returns {number} columnas finales (siempre >= las necesarias)
 */
export function TILE_COLUMNS_FOR_VIEW(rows) {
  const needed = TILE_COLUMNS(rows);
  const minCols = Math.ceil(VIEW_WIDTH / TILE_SIZE) + 2; // +2 pasillos laterales
  return Math.max(needed, minCols);
}
