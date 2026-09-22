/**
 * Box.js
 * ---------------------------------------------------------------
 * Cajas de cosecha que aparecen en la zona de entrega (§16, §37).
 *
 * No tienen física compleja: son objetos decorativos/contables que
 * se llenan al entregar y luego el camión recoge.
 */

import { TILE_SIZE } from '../config/constants.js';
import { PALETTE } from '../../utils/colors.js';

export const BOX_STATES = Object.freeze({
  EMPTY: 'empty',
  FULL: 'full',
  LOADED: 'loaded', // ya subida al camión
});

export class Box {
  /**
   * @param {object} options
   * @param {number} options.x
   * @param {number} options.y
   * @param {number} [options.stackSize] cajas apiladas visualmente
   */
  constructor({ x = 0, y = 0, stackSize = 1 } = {}) {
    this.x = x;
    this.y = y;
    this.width = TILE_SIZE * 0.8;
    this.height = TILE_SIZE * 0.8;
    this.stackSize = stackSize;

    this.state = BOX_STATES.EMPTY;
    /** Cuántos frutos contiene la caja. */
    this.contents = 0;

    this.animationTimer = 0;
    this.offsetY = 0;
  }

  get rect() {
    return { x: this.x, y: this.y, w: this.width, h: this.height };
  }

  /** Llena la caja con la cosecha entregada. */
  fill(amount) {
    this.contents += amount;
    this.state = BOX_STATES.FULL;
    this.animationTimer = 0.3;
    return this;
  }

  /** El camión se lleva la caja (§16). */
  load() {
    this.state = BOX_STATES.LOADED;
    return this;
  }

  setStackSize(size) {
    this.stackSize = Math.max(1, size);
    return this;
  }

  get spriteKey() {
    if (this.state === BOX_STATES.EMPTY && this.stackSize > 1) return 'basket.boxStack';
    if (this.state === BOX_STATES.FULL) return 'basket.boxFull';
    return 'basket.box';
  }

  update(dt) {
    if (this.animationTimer > 0) {
      this.animationTimer -= dt;
      // Pequeño rebote al llenarse
      this.offsetY = Math.sin((1 - this.animationTimer / 0.3) * Math.PI) * -3;
    } else {
      this.offsetY = 0;
    }
  }

  reset() {
    this.state = BOX_STATES.EMPTY;
    this.contents = 0;
    this.animationTimer = 0;
    this.offsetY = 0;
  }
}

/** Color de la caja (útil mientras no haya sprite definitivo). */
export const BOX_COLORS = {
  body: PALETTE.crate,
  dark: PALETTE.crateDark,
  top: PALETTE.woodLight,
};

export default Box;
