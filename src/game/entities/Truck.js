/**
 * Truck.js
 * ---------------------------------------------------------------
 * Camión que recoge las cajas de cosecha (§16).
 *
 * Animación sencilla, sin física:
 *   LLEGA → CARGA CAJAS → ESPERA → SE VA
 *
 * Estructura preparada; la activación dentro del nivel llega en una
 * fase posterior (cada N entregas).
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
   * @param {number} options.entryX  posición fuera de pantalla desde donde entra
   * @param {number} options.exitX   posición a la que se va
   */
  constructor({ x = 0, y = 0, entryX = 0, exitX = 0 } = {}) {
    this.x = x;
    this.y = y;
    this.width = 64;
    this.height = 40;

    this.entryX = entryX;
    this.exitX = exitX;

    this.speed = 70; // px lógicos por segundo
    this.state = TRUCK_STATES.OFFSCREEN;
    this.timer = 0;

    this.loadedBoxes = 0;
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
        const dx = this.targetX ?? this.x - 120;
        const target = this.targetX ?? this.x;
        const remaining = target - this.x;
        const step = Math.sign(remaining) * this.speed * dt;
        this.x += Math.abs(step) > Math.abs(remaining) ? remaining : step;
        if (Math.abs(target - this.x) < 1) {
          this.state = TRUCK_STATES.LOADING;
          this.timer = 0;
        }
        return false;
      }

      case TRUCK_STATES.LOADING:
        this.timer += dt;
        // 3 segundos de carga con vaivén del frame
        this.animationFrame = Math.floor(this.timer * 4) % 2;
        if (this.timer >= 3) {
          this.state = TRUCK_STATES.WAITING;
          this.timer = 0;
        }
        return false;

      case TRUCK_STATES.WAITING:
        this.timer += dt;
        if (this.timer >= 1.5) {
          this.state = TRUCK_STATES.LEAVING;
          this.timer = 0;
        }
        return false;

      case TRUCK_STATES.LEAVING: {
        this.x += this.speed * dt;
        this.animationFrame = Math.floor(this.timer * 5) % 2;
        this.timer += dt;
        if (this.timer >= 1.2) {
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
