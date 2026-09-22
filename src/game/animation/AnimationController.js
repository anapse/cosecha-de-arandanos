/**
 * AnimationController.js
 * ---------------------------------------------------------------
 * Gestiona un conjunto de animaciones por clave y elige la correcta
 * según el estado de la entidad.
 *
 * Uso típico:
 *   const controller = new AnimationController();
 *   controller.register('walkDown', { frameCount: 4 });
 *   controller.play('walkDown');
 *   controller.update(dt);
 *   const frame = controller.currentFrame;
 */

import { Animation } from './Animation.js';

export class AnimationController {
  constructor() {
    /** @type {Map<string, Animation>} */
    this.animations = new Map();
    this.currentKey = null;
    this.current = null;
    /** Se dispara al terminar una animación no loop. */
    this.onComplete = null;
  }

  /**
   * Registra una animación.
   * @param {string} key
   * @param {object} config { frameCount, frameDuration, loop, pingPong }
   */
  register(key, config = {}) {
    this.animations.set(key, new Animation({ name: key, ...config }));
    return this;
  }

  /** Registra varias animaciones de golpe. */
  registerMany(map) {
    Object.entries(map).forEach(([key, config]) => this.register(key, config));
    return this;
  }

  /**
   * Cambia la animación activa. Si es la misma, no se reinicia
   * (importante para que el caminado no parpadee).
   */
  play(key, { restart = false } = {}) {
    if (this.currentKey === key && !restart) return this.current;

    const animation = this.animations.get(key);
    if (!animation) return this.current;

    this.currentKey = key;
    this.current = animation;
    animation.reset();
    return animation;
  }

  update(dt) {
    if (!this.current) return;
    const wasFinished = this.current.finished;
    this.current.update(dt);

    if (!wasFinished && this.current.finished && typeof this.onComplete === 'function') {
      this.onComplete(this.currentKey);
    }
  }

  get frame() {
    return this.current?.frame ?? 0;
  }

  get finished() {
    return this.current?.finished ?? true;
  }

  get progress() {
    return this.current?.progress ?? 0;
  }

  /** ¿Está en la animación indicada? */
  isPlaying(key) {
    return this.currentKey === key;
  }

  reset() {
    this.animations.forEach((a) => a.reset());
    this.currentKey = null;
    this.current = null;
    return this;
  }
}

export default AnimationController;
