/**
 * Fruit.js
 * ---------------------------------------------------------------
 * Entidad fruto (§16, §10).
 *
 * Tipos iniciales:
 *   RIPE   → azul, recogible, suma puntos
 *   UNRIPE → rosado/verdoso, NO recogible, genera error
 *
 * El fruto conoce sus datos, pero quien decide si es recogible es
 * HarvestSystem usando la definición de src/data/fruits.js.
 *
 * Cuando la planta se genera, los frutos existen como datos ligeros
 * dentro de Plant. Esta clase se instancia cuando el fruto cobra
 * vida propia (animación de recogida, partículas, texto flotante).
 */

import { FRUIT_TYPES } from '../config/constants.js';
import { getFruitDef, UNRIPE_VARIANTS } from '../../data/fruits.js';

export class Fruit {
  /**
   * @param {object} options
   * @param {string} options.id
   * @param {string} options.type FRUIT_TYPES.RIPE | FRUIT_TYPES.UNRIPE
   * @param {number} options.x centro en px lógicos
   * @param {number} options.y
   * @param {string} [options.side] 'left' | 'right'
   */
  constructor({ id, type = FRUIT_TYPES.RIPE, x = 0, y = 0, side = null }) {
    this.id = id;
    this.type = type;
    this.x = x;
    this.y = y;
    this.side = side;

    this.collected = false;
    this.definition = getFruitDef(type);

    // Tamaño lógico del fruto (no cambia nunca, §11)
    this.size = this.definition.size ?? 9;

    // Estado de animación (para el "pop" al recoger)
    this.animation = 'idle'; // 'idle' | 'collecting' | 'gone'
    this.animationTimer = 0;
    this.scale = 1;
    this.floatingOffset = 0;
  }

  get isRipe() {
    return this.type === FRUIT_TYPES.RIPE;
  }

  get isUnripe() {
    return this.type === FRUIT_TYPES.UNRIPE;
  }

  /** ¿Se puede recoger? (§10, §16) */
  get isCollectable() {
    return this.definition.collectable === true;
  }

  /** Puntos que aporta (puede ser negativo para el pintón). */
  get points() {
    return this.definition.points ?? 0;
  }

  /** Efecto sobre la calidad. */
  get qualityDelta() {
    return this.definition.qualityDelta ?? 0;
  }

  /** ¿Genera error si se recoge? */
  get countsAsError() {
    return this.definition.countsAsError === true;
  }

  /** Rectángulo del fruto (para detección de cercanía). */
  get rect() {
    return {
      x: this.x - this.size / 2,
      y: this.y - this.size / 2,
      w: this.size,
      h: this.size,
    };
  }

  /** Colores según el tipo, con variantes de pintón (§11). */
  get colors() {
    if (this.isRipe) {
      return {
        color: this.definition.color,
        light: this.definition.colorLight,
        dark: this.definition.colorDark,
        outline: '#1b2a5c',
      };
    }
    const variant = UNRIPE_VARIANTS[this.variantIndex % UNRIPE_VARIANTS.length];
    return {
      color: variant.color,
      light: variant.colorLight,
      dark: variant.colorDark,
      outline: '#7a4a5a',
    };
  }

  /** Índice de variante visual; se fija al construir desde el mapa. */
  variantIndex = 0;

  /** Inicia la animación de recogida (pop + subida). */
  startCollect() {
    if (this.collected) return false;
    this.collected = true;
    this.animation = 'collecting';
    this.animationTimer = 0;
    return true;
  }

  /**
   * Actualiza la animación.
   * @param {number} dt segundos
   * @returns {boolean} true mientras el fruto sigue visible
   */
  update(dt) {
    if (this.animation === 'idle') return true;

    if (this.animation === 'collecting') {
      this.animationTimer += dt;
      const t = Math.min(1, this.animationTimer / 0.35);

      // Se encoge, sube y se desvanece
      this.scale = 1 + t * 0.5 - t * t * 1.2;
      this.floatingOffset = -t * 14;

      if (t >= 1) {
        this.animation = 'gone';
        return false;
      }
    }

    return this.animation !== 'gone';
  }

  /** Opacidad durante la animación de recogida. */
  get alpha() {
    if (this.animation === 'collecting') {
      return Math.max(0, 1 - this.animationTimer / 0.3);
    }
    return 1;
  }

  /** Clave del sprite en el manifiesto. */
  get spriteKey() {
    return this.isRipe ? 'fruit.ripe' : 'fruit.unripe';
  }

  toJSON() {
    return { id: this.id, type: this.type, x: this.x, y: this.y, collected: this.collected };
  }
}

export { FRUIT_TYPES };
export default Fruit;
