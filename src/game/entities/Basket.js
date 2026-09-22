/**
 * Basket.js
 * ---------------------------------------------------------------
 * Canasta / caja de cosecha (§17, §14).
 *
 * Tiene capacity y current, y 4 estados visuales:
 *   empty, low, medium, full
 *
 * Por defecto la capacidad es 30.
 */

import { BASKET_STATES, TILE_SIZE } from '../config/constants.js';
import { GAME_CONFIG } from '../config/gameConfig.js';

export class Basket {
  /**
   * @param {object} options
   * @param {number} options.x posición (esquina sup-izq, px lógicos)
   * @param {number} options.y
   * @param {number} options.capacity
   */
  constructor({ x = 0, y = 0, capacity = GAME_CONFIG.basketCapacity } = {}) {
    this.x = x;
    this.y = y;
    this.width = TILE_SIZE;
    this.height = TILE_SIZE;

    this.capacity = capacity;
    this.current = 0;

    /** Cuántos frutos maduros ha recibido en total esta canasta. */
    this.totalRipe = 0;
    /** Cuántos pintones entraron por error. */
    this.totalUnripe = 0;

    this.flashTimer = 0;
    this.justFilled = false;
  }

  /** Rectángulo de la canasta (zona de entrega, no bloquea el paso). */
  get rect() {
    return { x: this.x, y: this.y, w: this.width, h: this.height };
  }

  get centerX() {
    return this.x + this.width / 2;
  }

  get centerY() {
    return this.y + this.height / 2;
  }

  /** ¿Está llena? (§14) */
  get isFull() {
    return this.current >= this.capacity;
  }

  get isEmpty() {
    return this.current === 0;
  }

  /** Espacio libre restante. */
  get freeSpace() {
    return Math.max(0, this.capacity - this.current);
  }

  /** Proporción de llenado 0-1, para la barra del HUD y el sprite. */
  get fillRatio() {
    return this.capacity > 0 ? Math.min(1, this.current / this.capacity) : 0;
  }

  /** Estado visual (§14, §17). */
  get state() {
    if (this.current === 0) return BASKET_STATES.EMPTY;
    const ratio = this.fillRatio;
    if (ratio >= 1) return BASKET_STATES.FULL;
    if (ratio >= 0.6) return BASKET_STATES.MEDIUM;
    return BASKET_STATES.LOW;
  }

  get spriteKey() {
    return `basket.${this.state}`;
  }

  /**
   * Añade frutos a la canasta.
   * @param {number} amount nº de frutos
   * @param {object} [meta] { unripe }
   * @returns {number} cuántos entraron realmente
   */
  add(amount = 1, meta = {}) {
    const space = this.freeSpace;
    const accepted = Math.min(space, amount);
    if (accepted <= 0) return 0;

    this.current += accepted;
    this.flashTimer = 0.25;

    if (meta.unripe) this.totalUnripe += accepted;
    else this.totalRipe += accepted;

    if (this.isFull && !this.justFilled) {
      this.justFilled = true; // el motor emitirá el aviso "CANASTA LLENA"
    }

    return accepted;
  }

  /** Vacía la canasta al entregar (§15). */
  empty() {
    const delivered = this.current;
    this.current = 0;
    this.justFilled = false;
    return delivered;
  }

  /** Cambia la capacidad al cargar otro nivel. */
  setCapacity(capacity) {
    this.capacity = capacity;
    if (this.current > capacity) this.current = capacity;
    return this;
  }

  /** Detecta frutos aceptados y devuelve y limpia el aviso de llena. */
  consumeJustFilled() {
    if (!this.justFilled) return false;
    // Se sigue considerando llena: el aviso solo se dispara una vez
    // hasta que la canasta se vacíe.
    return true;
  }

  reset(capacity = this.capacity) {
    this.capacity = capacity;
    this.current = 0;
    this.totalRipe = 0;
    this.totalUnripe = 0;
    this.flashTimer = 0;
    this.justFilled = false;
  }

  update(dt) {
    if (this.flashTimer > 0) this.flashTimer -= dt;
  }

  /** Posición de la canasta para reubicarla al regenerar el mapa. */
  moveTo(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }
}

export { BASKET_STATES };
export default Basket;
