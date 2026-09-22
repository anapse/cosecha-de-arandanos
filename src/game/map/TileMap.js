/**
 * TileMap.js
 * ---------------------------------------------------------------
 * Rejilla lógica del terreno. Guarda tipos de tile y metadatos de
 * transitable/bloqueante. NO dibuja: solo describe.
 *
 * Coordenadas de tile (columna, fila) ⇄ coordenadas lógicas (px).
 */

import { TILE_SIZE, TILE_TYPES } from '../config/constants.js';

/** Tiles que bloquean el paso del jugador (§39). */
const BLOCKING_TILES = new Set([
  TILE_TYPES.PLANT_ROW,
  TILE_TYPES.FENCE,
]);

/** Tiles por los que se puede caminar (§39). */
const WALKABLE_TILES = new Set([
  TILE_TYPES.PATH,
  TILE_TYPES.PATH_H,
  TILE_TYPES.CORNER,
  TILE_TYPES.CROSS,
  TILE_TYPES.DELIVERY,
  TILE_TYPES.SOIL,
  TILE_TYPES.SOIL_LIGHT,
  TILE_TYPES.SOIL_DARK,
  TILE_TYPES.GRASS,
]);

export class TileMap {
  /**
   * @param {number} cols columnas
   * @param {number} rows filas
   * @param {number} tileSize tamaño de tile en px lógicos
   */
  constructor(cols, rows, tileSize = TILE_SIZE) {
    this.cols = cols;
    this.rows = rows;
    this.tileSize = tileSize;

    /** @type {string[]} grid[row][col] */
    this.grid = [];
    for (let r = 0; r < rows; r += 1) {
      this.grid.push(new Array(cols).fill(TILE_TYPES.SOIL));
    }
  }

  /** Ancho total en px lógicos. */
  get pixelWidth() {
    return this.cols * this.tileSize;
  }

  /** Alto total en px lógicos. */
  get pixelHeight() {
    return this.rows * this.tileSize;
  }

  inBounds(col, row) {
    return col >= 0 && row >= 0 && col < this.cols && row < this.rows;
  }

  get(col, row) {
    if (!this.inBounds(col, row)) return null;
    return this.grid[row][col];
  }

  set(col, row, type) {
    if (!this.inBounds(col, row)) return false;
    this.grid[row][col] = type;
    return true;
  }

  /** Rellena un rectángulo de tiles (coordenadas de tile, inclusivas). */
  fill(col0, row0, col1, row1, type) {
    for (let r = row0; r <= row1; r += 1) {
      for (let c = col0; c <= col1; c += 1) {
        this.set(c, r, type);
      }
    }
  }

  /** Rellena una fila completa. */
  fillRow(row, type, fromCol = 0, toCol = null) {
    const end = toCol ?? this.cols - 1;
    for (let c = fromCol; c <= end; c += 1) this.set(c, row, type);
  }

  /** Rellena una columna completa. */
  fillCol(col, type, fromRow = 0, toRow = null) {
    const end = toRow ?? this.rows - 1;
    for (let r = fromRow; r <= end; r += 1) this.set(col, r, type);
  }

  /** ¿El tile de esta posición bloquea el paso? */
  isBlockingAt(col, row) {
    const type = this.get(col, row);
    if (type === null) return true; // fuera del mapa = bloqueado
    return BLOCKING_TILES.has(type);
  }

  isWalkableAt(col, row) {
    const type = this.get(col, row);
    if (type === null) return false;
    return WALKABLE_TILES.has(type) && !BLOCKING_TILES.has(type);
  }

  /* ---------- Conversiones px ⇄ tile ---------- */
  worldToCol(x) {
    return Math.floor(x / this.tileSize);
  }

  worldToRow(y) {
    return Math.floor(y / this.tileSize);
  }

  colToWorldX(col) {
    return col * this.tileSize;
  }

  rowToWorldY(row) {
    return row * this.tileSize;
  }

  /** Centro del tile en px lógicos. */
  tileCenter(col, row) {
    return {
      x: col * this.tileSize + this.tileSize / 2,
      y: row * this.tileSize + this.tileSize / 2,
    };
  }

  /** Exporta la rejilla (para depuración o guardado). */
  toJSON() {
    return { cols: this.cols, rows: this.rows, tileSize: this.tileSize, grid: this.grid };
  }
}

export { BLOCKING_TILES, WALKABLE_TILES };
export default TileMap;
