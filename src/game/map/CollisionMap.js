/**
 * CollisionMap.js
 * ---------------------------------------------------------------
 * Capa de colisión derivada del TileMap. Separada del renderizado
 * (§39): consulta rápida "¿se puede estar aquí?".
 *
 * Optimización: mantiene un Set de tiles bloqueantes para consultas
 * O(1) en lugar de recorrer el grid.
 */

import { TILE_SIZE } from '../config/constants.js';
import { BLOCKING_TILES } from './TileMap.js';

export class CollisionMap {
  /**
   * @param {import('./TileMap.js').TileMap} tileMap
   */
  constructor(tileMap) {
    this.tileMap = tileMap;
    this.tileSize = tileMap.tileSize ?? TILE_SIZE;

    // Cache de tiles bloqueantes en coordenadas "col,row".
    this.blocked = new Set();
    this.#rebuild();
  }

  #rebuild() {
    const { cols, rows, grid } = this.tileMap;
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        if (BLOCKING_TILES.has(grid[r][c])) {
          this.blocked.add(`${c},${r}`);
        }
      }
    }
  }

  /** Reconstruye la cache si el terreno cambia (mapas dinámicos futuros). */
  refresh() {
    this.blocked.clear();
    this.#rebuild();
  }

  /** ¿El tile (col,row) bloquea? */
  isBlocked(col, row) {
    return this.blocked.has(`${col},${row}`);
  }

  /**
   * ¿El rectángulo en px lógicos toca algún tile bloqueante?
   * Comprueba solo los tiles que solapan el rectángulo.
   * @param {{x:number,y:number,w:number,h:number}} rect
   */
  rectCollides(rect) {
    const ts = this.tileSize;
    const c0 = Math.floor(rect.x / ts);
    const c1 = Math.floor((rect.x + rect.w - 0.001) / ts);
    const r0 = Math.floor(rect.y / ts);
    const r1 = Math.floor((rect.y + rect.h - 0.001) / ts);

    for (let r = r0; r <= r1; r += 1) {
      for (let c = c0; c <= c1; c += 1) {
        if (this.isBlocked(c, r)) return true;
      }
    }
    return false;
  }

  /** ¿El punto (x,y) en px lógicos está bloqueado? */
  pointCollides(x, y) {
    return this.isBlocked(
      Math.floor(x / this.tileSize),
      Math.floor(y / this.tileSize)
    );
  }

  /**
   * ¿El rectángulo está dentro de los límites transitables?
   * @param {{x:number,y:number,w:number,h:number}} rect
   * @param {{x:number,y:number,w:number,h:number}} bounds
   */
  static withinBounds(rect, bounds) {
    return (
      rect.x >= bounds.x &&
      rect.y >= bounds.y &&
      rect.x + rect.w <= bounds.x + bounds.w &&
      rect.y + rect.h <= bounds.y + bounds.h
    );
  }
}

export default CollisionMap;
