/**
 * Animation.js
 * ---------------------------------------------------------------
 * Animación basada en frames de una tira de sprites.
 *
 * Independiente del render: describe QUÉ frame toca mostrar.
 * Los frames se definen en src/data/assets.js (frames + frameSize).
 */

export class Animation {
  /**
   * @param {object} options
   * @param {string} options.name
   * @param {number} options.frameCount nº de frames de la tira
   * @param {number} [options.frameDuration] segundos por frame
   * @param {boolean} [options.loop]
   * @param {boolean} [options.pingPong] va y vuelve (útil para "respirar")
   */
  constructor({
    name = 'default',
    frameCount = 1,
    frameDuration = 0.14,
    loop = true,
    pingPong = false,
  } = {}) {
    this.name = name;
    this.frameCount = Math.max(1, frameCount);
    this.frameDuration = frameDuration;
    this.loop = loop;
    this.pingPong = pingPong;

    this.frame = 0;
    this.timer = 0;
    this.finished = false;
    this.direction = 1; // para pingPong
  }

  /** Avanza la animación. */
  update(dt) {
    if (this.finished && !this.loop) return;

    this.timer += dt;
    if (this.timer < this.frameDuration) return;

    const steps = Math.floor(this.timer / this.frameDuration);
    this.timer -= steps * this.frameDuration;

    for (let i = 0; i < steps; i += 1) {
      this.#advance();
      if (this.finished && !this.loop) break;
    }
  }

  #advance() {
    if (this.pingPong) {
      this.frame += this.direction;
      if (this.frame >= this.frameCount - 1) {
        this.frame = this.frameCount - 1;
        this.direction = -1;
      } else if (this.frame <= 0) {
        this.frame = 0;
        this.direction = 1;
        if (!this.loop) this.finished = true;
      }
      return;
    }

    this.frame += 1;
    if (this.frame >= this.frameCount) {
      if (this.loop) {
        this.frame = 0;
      } else {
        this.frame = this.frameCount - 1;
        this.finished = true;
      }
    }
  }

  reset() {
    this.frame = 0;
    this.timer = 0;
    this.finished = false;
    this.direction = 1;
    return this;
  }

  /** Progreso 0-1 de la animación. */
  get progress() {
    if (this.frameCount <= 1) return this.finished ? 1 : 0;
    return this.frame / (this.frameCount - 1);
  }
}

export default Animation;
