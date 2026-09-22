/**
 * mapLayout.js
 * ---------------------------------------------------------------
 * Reglas de tamaño del mapa en tiles (§19, §37).
 *
 * Se mantiene aparte para que MapGenerator no mezcle cálculo de
 * dimensiones con construcción del terreno.
 *
 * IMPORTANTE — proporción con el viewport:
 * El juego se ve en un viewport lógico vertical de 360x640 (§7, §11).
 * Si el campo fuese más pequeño que la pantalla, el motor tendría que
 * estirarlo o dejar franjas vacías. Por eso el alto del campo se
 * calcula para CUBRIR el viewport: el mapa siempre es igual o más
 * grande que la cámara, y la cámara hace su trabajo (§38).
 */

import { TILE_SIZE } from '../config/constants.js';

/** Alto del viewport lógico que hay que cubrir (px). */
export const VIEW_HEIGHT = 640;

/** Ancho del viewport lógico que hay que cubrir (px). */
export const VIEW_WIDTH = 360;

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

/**
 * Número de filas de CULTIVO necesarias para cubrir la pantalla.
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
  const availablePx = VIEW_HEIGHT - fixedRows * TILE_SIZE;

  // Con más plantas por línea, la misma parcela puede mostrar más
  // filas de cultivo; con menos, hay que repartirlas para llenar.
  // La densidad objetivo mantiene el campo legible.
  const targetFieldPx = Math.max(availablePx, p * TILE_SIZE);
  return Math.max(p, Math.ceil(targetFieldPx / TILE_SIZE));
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
