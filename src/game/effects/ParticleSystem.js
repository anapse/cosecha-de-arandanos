/**
 * ParticleSystem.js
 * ---------------------------------------------------------------
 * Partículas ligeras para el feedback visual (§39).
 *
 * Rendimiento (§41): pool de partículas reutilizadas, sin
 * asignaciones por frame y con un máximo duro de partículas vivas.
 */

import { withAlpha } from '../../utils/colors.js';

const MAX_PARTICLES = 120;

export class ParticleSystem {
  constructor() {
    /** @type {Array<object>} pool */
    this.pool = [];
    for (let i = 0; i < MAX_PARTICLES; i += 1) {
      this.pool.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1,
        size: 2,
        color: '#ffffff',
        gravity: 0,
        shape: 'square',
      });
    }
    this.cursor = 0;
  }

  /** Toma una partícula libre del pool (reutiliza la más antigua). */
  #acquire() {
    for (let i = 0; i < MAX_PARTICLES; i += 1) {
      const index = (this.cursor + i) % MAX_PARTICLES;
      if (!this.pool[index].active) {
        this.cursor = (index + 1) % MAX_PARTICLES;
        return this.pool[index];
      }
    }
    // Pool lleno: se recicla la siguiente.
    const p = this.pool[this.cursor];
    this.cursor = (this.cursor + 1) % MAX_PARTICLES;
    return p;
  }

  /**
   * Emite partículas.
   * @param {number} x
   * @param {number} y
   * @param {object} options
   */
  emit(x, y, {
    count = 4,
    color = '#ffffff',
    speed = 40,
    spread = Math.PI * 2,
    angle = -Math.PI / 2,
    life = 0.5,
    size = 2,
    gravity = 60,
    shape = 'square',
  } = {}) {
    for (let i = 0; i < count; i += 1) {
      const p = this.#acquire();
      const a = angle + (Math.random() - 0.5) * spread;
      const s = speed * (0.5 + Math.random() * 0.7);

      p.active = true;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(a) * s;
      p.vy = Math.sin(a) * s;
      p.life = life * (0.7 + Math.random() * 0.6);
      p.maxLife = p.life;
      p.size = size;
      p.color = color;
      p.gravity = gravity;
      p.shape = shape;
    }
  }

  /** Explosión de chispas al recoger un arándano maduro. */
  emitHarvest(x, y) {
    this.emit(x, y, {
      count: 5,
      color: '#6f8ff0',
      speed: 46,
      life: 0.42,
      size: 2,
      gravity: 70,
    });
  }

  /** Nube de polvo al recoger un pintón (error). */
  emitError(x, y) {
    this.emit(x, y, {
      count: 6,
      color: '#e2453c',
      speed: 52,
      life: 0.5,
      size: 2,
      gravity: 90,
    });
  }

  /** Confeti al entregar (§39). */
  emitDelivery(x, y) {
    this.emit(x, y, {
      count: 12,
      color: '#f2c14e',
      speed: 70,
      spread: Math.PI * 1.4,
      angle: -Math.PI / 2,
      life: 0.8,
      size: 3,
      gravity: 120,
    });
  }

  /** Hojas al pasar por el follaje. */
  emitLeaves(x, y) {
    this.emit(x, y, {
      count: 3,
      color: '#57a04f',
      speed: 24,
      life: 0.7,
      size: 2,
      gravity: 30,
    });
  }

  /**
   * @param {number} dt
   */
  update(dt) {
    for (let i = 0; i < MAX_PARTICLES; i += 1) {
      const p = this.pool[i];
      if (!p.active) continue;

      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }

      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  /** @param {import('./SpriteRenderer.js').SpriteRenderer} sprites */
  draw(sprites) {
    for (let i = 0; i < MAX_PARTICLES; i += 1) {
      const p = this.pool[i];
      if (!p.active) continue;

      const alpha = Math.max(0, p.life / p.maxLife);
      if (p.shape === 'circle') {
        sprites.drawCircle(p.x, p.y, p.size / 2, withAlpha(p.color, alpha));
      } else {
        sprites.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size, withAlpha(p.color, alpha));
      }
    }
  }

  /** Número de partículas activas (panel de depuración). */
  get activeCount() {
    return this.pool.filter((p) => p.active).length;
  }

  clear() {
    this.pool.forEach((p) => {
      p.active = false;
    });
  }
}

export default ParticleSystem;
