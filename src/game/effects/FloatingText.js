/**
 * FloatingText.js
 * ---------------------------------------------------------------
 * Textos flotantes de feedback: "+10", "-25", "ERROR", "RECOGE" (§39).
 * Se muestran durante poco tiempo y suben mientras se desvanecen.
 */

import { PALETTE } from '../../utils/colors.js';

const DURATION = 0.9;
const RISE = 22;

export class FloatingText {
  /**
   * @param {object} options
   * @param {string} options.text
   * @param {number} options.x
   * @param {number} options.y
   * @param {string} [options.color]
   * @param {number} [options.size]
   */
  constructor({ text = '', x = 0, y = 0, color = PALETTE.text, size = 8 }) {
    this.text = text;
    this.x = x;
    this.y = y;
    this.startY = y;
    this.color = color;
    this.size = size;

    this.age = 0;
    this.duration = DURATION;
    this.alive = true;
  }

  update(dt) {
    this.age += dt;
    if (this.age >= this.duration) {
      this.alive = false;
      return false;
    }

    // Sube desacelerando.
    const t = this.age / this.duration;
    this.y = this.startY - RISE * (1 - Math.pow(1 - t, 2));
    return true;
  }

  get alpha() {
    const t = this.age / this.duration;
    // Visible al principio, se desvanece al final.
    if (t < 0.6) return 1;
    return Math.max(0, 1 - (t - 0.6) / 0.4);
  }

  /** Escala con un pequeño rebote inicial. */
  get scale() {
    const t = this.age / this.duration;
    if (t < 0.15) return 1.25 - (t / 0.15) * 0.25;
    return 1;
  }

  /** @param {import('./SpriteRenderer.js').SpriteRenderer} sprites */
  draw(sprites) {
    sprites.ctx.save();
    sprites.ctx.globalAlpha = this.alpha;
    sprites.drawText(this.text, this.x, this.y, {
      size: Math.round(this.size * this.scale),
      color: this.color,
      align: 'center',
      baseline: 'middle',
    });
    sprites.ctx.restore();
  }
}

/* ---------- Fábricas de textos con el estilo correcto ---------- */

export const FloatingTextFactory = {
  /** +10 por arándano maduro (§23). */
  harvest(x, y, points = 10) {
    return new FloatingText({
      text: `+${points}`,
      x,
      y,
      color: PALETTE.accent,
      size: 8,
    });
  },

  /** Fruto verde/inmaduro recogido con aviso suave. */
  unripeError(x, y, points = -10) {
    return new FloatingText({
      text: `¡VERDE! ${points}`,
      x,
      y,
      color: PALETTE.danger,
      size: 7,
    });
  },

  /** ERROR genérico (§12). */
  error(x, y, text = 'ERROR') {
    return new FloatingText({
      text,
      x,
      y,
      color: PALETTE.danger,
      size: 8,
    });
  },

  /** +100 por entrega (§23). */
  delivery(x, y, points = 100) {
    return new FloatingText({
      text: `ENTREGA +${points}`,
      x,
      y,
      color: PALETTE.ok,
      size: 8,
    });
  },

  /** Aviso genérico (amarillo). */
  warn(x, y, text) {
    return new FloatingText({ text, x, y, color: PALETTE.warn, size: 7 });
  },

  /** Aviso positivo (verde). */
  ok(x, y, text) {
    return new FloatingText({ text, x, y, color: PALETTE.ok, size: 7 });
  },
};

export default FloatingText;
