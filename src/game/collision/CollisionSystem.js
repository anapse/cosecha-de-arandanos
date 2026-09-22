/**
 * CollisionSystem.js
 * ---------------------------------------------------------------
 * Resolución de movimiento con colisiones (§39).
 *
 * Estrategia: movimiento por ejes separados (primero X, después Y).
 * Es el enfoque estándar en top-down 2D: permite deslizarse sobre
 * una pared en lugar de quedarse pegado al tocarla.
 *
 * Totalmente independiente del renderizado: recibe rects y devuelve
 * posiciones.
 */

import { CollisionMap } from '../map/CollisionMap.js';

export class CollisionSystem {
  /**
   * @param {import('../map/CollisionMap.js').CollisionMap} collisionMap
   * @param {object} bounds límites transitables en px lógicos
   */
  constructor(collisionMap, bounds) {
    this.collisionMap = collisionMap;
    this.bounds = bounds;
  }

  /** Actualiza el mapa de colisión (al cambiar de nivel). */
  setMap(collisionMap, bounds) {
    this.collisionMap = collisionMap;
    this.bounds = bounds;
  }

  /**
   * ¿Puede el rectángulo ocupar esta posición?
   * @param {{x:number,y:number,w:number,h:number}} rect
   */
  canOccupy(rect) {
    if (!this.collisionMap) return false;
    if (!CollisionMap.withinBounds(rect, this.bounds)) return false;
    if (this.collisionMap.rectCollides(rect)) return false;
    return true;
  }

  /**
   * Mueve un rectángulo por (dx,dy) resolviendo colisiones eje a eje.
   * @param {{x:number,y:number,w:number,h:number}} rect rectángulo actual (se clona)
   * @param {number} dx desplazamiento en X
   * @param {number} dy desplazamiento en Y
   * @returns {{ x:number, y:number, hitX:boolean, hitY:boolean }}
   */
  moveRect(rect, dx, dy) {
    const result = { x: rect.x, y: rect.y, hitX: false, hitY: false };

    // ---- Eje X ----
    if (dx !== 0) {
      const testX = { ...rect, x: rect.x + dx };
      if (this.canOccupy(testX)) {
        result.x = testX.x;
      } else {
        // Intento por pasos: evita atravesar un tile a alta velocidad.
        const stepped = this.#stepAxis(rect, dx, 0, 'x');
        result.x = stepped.value;
        result.hitX = stepped.blocked;
      }
    }

    // ---- Eje Y (usando la X ya resuelta) ----
    if (dy !== 0) {
      const currentX = { ...rect, x: result.x };
      const testY = { ...currentX, y: currentX.y + dy };
      if (this.canOccupy(testY)) {
        result.y = testY.y;
      } else {
        const stepped = this.#stepAxis(currentX, 0, dy, 'y');
        result.y = stepped.value;
        result.hitY = stepped.blocked;
      }
    }

    return result;
  }

  /**
   * Avanza en pasos de 1 px hasta el obstáculo. Devuelve la posición
   * máxima alcanzable y si se topó con algo.
   */
  #stepAxis(rect, dx, dy, axis) {
    const step = axis === 'x' ? Math.sign(dx) : Math.sign(dy);
    const total = Math.abs(axis === 'x' ? dx : dy);
    let value = axis === 'x' ? rect.x : rect.y;
    let blocked = false;

    for (let i = 0; i < total; i += 1) {
      const candidate = { ...rect };
      if (axis === 'x') candidate.x = value + step;
      else candidate.y = value + step;

      if (this.canOccupy(candidate)) {
        value += step;
      } else {
        blocked = true;
        break;
      }
    }

    return { value, blocked };
  }

  /**
   * Comprueba si dos rectángulos solapan (para zonas de entrega,
   * detección de frutos, etc.).
   */
  static overlaps(a, b) {
    return (
      a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
    );
  }

  /** Convierte un rect centrado en (x,y) con tamaño (w,h). */
  static rectFromCenter(x, y, w, h) {
    return { x: x - w / 2, y: y - h / 2, w, h };
  }

  /** Comprueba si un punto cae dentro de un rectángulo. */
  static containsPoint(rect, x, y) {
    return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
  }
}

export default CollisionSystem;
