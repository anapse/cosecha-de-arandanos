/**
 * Truck.js
 * ---------------------------------------------------------------
 * Camión que recoge las cajas de cosecha (§16).
 *
 * Secuencia fluida y agradable:
 *   LLEGA desde la derecha (ARRIVING) ->
 *   CARGA CAJAS (LOADING) ->
 *   SE MARCHA hacia la derecha (LEAVING) ->
 *   DESAPARECE (OFFSCREEN)
 */

export const TRUCK_STATES = Object.freeze({
  OFFSCREEN: 'offscreen',
  ARRIVING: 'arriving',
  LOADING: 'loading',
  WAITING: 'waiting',
  LEAVING: 'leaving',
});

export class Truck {
  /**
   * @param {object} options
   * @param {number} options.x
   * @param {number} options.y
   * @param {number} options.entryX
   * @param {number} options.exitX
   */
  constructor({ x = 296, y = 546, entryX = 480, exitX = 480 } = {}) {
    this.targetX = x;
    this.x = x;
    this.y = y;
    this.width = 148;
    this.height = 82;

    this.entryX = entryX;
    this.exitX = exitX;

    this.speed = 130; // px lógicos por segundo
    this.state = TRUCK_STATES.OFFSCREEN;
    this.timer = 0;

    this.loadedBoxes = 3;
    this.animationFrame = 0;
  }

  get rect() {
    return { x: this.x, y: this.y, w: this.width, h: this.height };
  }

  /** Arranca la secuencia de recogida. */
  start() {
    this.state = TRUCK_STATES.ARRIVING;
    this.x = this.entryX;
    this.timer = 0;
    this.loadedBoxes = 0;
    return this;
  }

  /**
   * @param {number} dt
   * @returns {boolean} true cuando la secuencia ha terminado
   */
  update(dt) {
    switch (this.state) {
      case TRUCK_STATES.ARRIVING: {
        const target = this.targetX;
        const remaining = target - this.x;
        const step = Math.sign(remaining) * this.speed * dt;
        this.x += Math.abs(step) > Math.abs(remaining) ? remaining : step;
        this.animationFrame = Math.floor(Date.now() / 120) % 2;
        if (Math.abs(target - this.x) < 2) {
          this.x = target;
          this.state = TRUCK_STATES.LOADING;
          this.timer = 0;
        }
        return false;
      }

      case TRUCK_STATES.LOADING:
        this.timer += dt;
        // 1.2 segundos de carga con rebote
        this.animationFrame = Math.floor(this.timer * 6) % 2;
        if (this.timer >= 1.2) {
          this.state = TRUCK_STATES.LEAVING;
          this.timer = 0;
        }
        return false;

      case TRUCK_STATES.LEAVING: {
        this.x += this.speed * dt;
        this.animationFrame = Math.floor(Date.now() / 120) % 2;
        this.timer += dt;
        if (this.x >= 490 || this.timer >= 2.0) {
          this.state = TRUCK_STATES.OFFSCREEN;
          return true;
        }
        return false;
      }

      default:
        return false;
    }
  }

  /** Indica dónde debe detenerse el camión para cargar. */
  setLoadingSpot(x, y) {
    this.targetX = x;
    this.y = y;
    return this;
  }

  get isVisible() {
    return this.state !== TRUCK_STATES.OFFSCREEN;
  }

  get spriteKey() {
    if (this.state === TRUCK_STATES.LOADING) return 'truck.loading';
    if (this.state === TRUCK_STATES.LEAVING) return 'truck.leaving';
    return 'truck.idle';
  }

  reset() {
    this.state = TRUCK_STATES.OFFSCREEN;
    this.timer = 0;
    this.loadedBoxes = 0;
    return this;
  }
}

export default Truck;
