/**
 * Supervisor.js
 * ---------------------------------------------------------------
 * Supervisor de calidad (§17, §18, §19, §20).
 *
 * Flujo realista:
 *   1. Está alejado en su puesto de descanso (homeSpot, lateral derecho).
 *   2. Al llegar la hora de revisión, CAMINA hacia el cajón de cosecha (inspectionSpot).
 *   3. Realiza la inspección: observa el bin, anota con el portapapeles y dicta veredicto.
 *   4. Al terminar la revisión, CAMINA DE REGRESO a su puesto de descanso y se retira.
 */

import { SUPERVISOR_STATES, INSPECTION_RESULTS, DIRECTIONS, QUALITY_THRESHOLDS } from '../config/constants.js';
import { GAME_CONFIG } from '../config/gameConfig.js';

const SUPERVISOR_WRITE_DURATION = 1.2;
const SUPERVISOR_DETECT_DURATION = 1.0;
const SUPERVISOR_APPROVE_DURATION = 1.4;
const SUPERVISOR_TALK_DURATION = 1.8;

export class Supervisor {
  /**
   * @param {object} options
   * @param {number} options.x
   * @param {number} options.y
   * @param {object} options.homeSpot  posición de descanso (lejos del cajón)
   * @param {object} options.inspectionSpot posición de revisión (junto al cajón)
   */
  constructor({
    x = 440,
    y = 560,
    homeSpot = { x: 440, y: 560 },
    inspectionSpot = { x: 260, y: 560 },
  } = {}) {
    this.width = 48;
    this.height = 72;

    this.homeSpot = homeSpot;
    this.inspectionSpot = inspectionSpot;
    this.x = homeSpot.x;
    this.y = homeSpot.y;

    this.speed = GAME_CONFIG.supervisorWalkSpeed || 85;

    this.state = SUPERVISOR_STATES.IDLE;
    this.facing = DIRECTIONS.LEFT;
    this.frame = 0;
    this.frameTime = 0;
    this.animationSpeed = 0.16;

    this.interval = GAME_CONFIG.supervisorInterval || 30;
    this.timer = this.interval;
    this.isActive = false;
    this.walkingTarget = 'inspection'; // 'inspection' o 'home'
    this.inspectionTimer = 0;
    this.onInspectionComplete = null;

    this.lastResult = null;
    this.bubbleText = '';
    this.bubbleTimer = 0;
    this.verdictShown = false;
  }

  get rect() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      w: this.width,
      h: this.height,
    };
  }

  get renderX() {
    return this.x - this.width / 2;
  }

  get renderY() {
    return this.y - this.height / 2;
  }

  reset(interval = this.interval) {
    this.interval = interval;
    this.timer = interval;
    this.x = this.homeSpot.x;
    this.y = this.homeSpot.y;
    this.state = SUPERVISOR_STATES.IDLE;
    this.facing = DIRECTIONS.LEFT;
    this.isActive = false;
    this.walkingTarget = 'inspection';
    this.inspectionTimer = 0;
    this.lastResult = null;
    this.bubbleText = '';
    this.bubbleTimer = 0;
    this.frame = 0;
    return this;
  }

  setSpots(homeSpot, inspectionSpot) {
    this.homeSpot = homeSpot ?? { x: 440, y: 560 };
    this.inspectionSpot = inspectionSpot ?? { x: 260, y: 560 };
    this.x = this.homeSpot.x;
    this.y = this.homeSpot.y;
    return this;
  }

  tickTimer(dt) {
    if (this.isActive) return false;

    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = this.interval;
      this.startInspection();
      return true;
    }
    return false;
  }

  /** El supervisor sale de su puesto y camina hacia el cajón de cosecha */
  startInspection() {
    this.isActive = true;
    this.walkingTarget = 'inspection';
    this.state = SUPERVISOR_STATES.WALK;
    this.inspectionTimer = 0;
    this.bubbleText = 'REVISIÓN DE CALIDAD';
    this.bubbleTimer = 2.0;
  }

  /** El supervisor regresa caminando a su puesto */
  leave() {
    this.walkingTarget = 'home';
    this.state = SUPERVISOR_STATES.WALK;
    this.inspectionTimer = 0;
  }

  evaluate({ ripe = 0, unripe = 0, errors = 0, quality = 100 }) {
    const minimumQuality = this.minimumQuality ?? 85;
    let verdict = INSPECTION_RESULTS.APPROVED;
    let message = '✅ CALIDAD APROBADA';

    if (quality < minimumQuality && quality >= QUALITY_THRESHOLDS.DANGER) {
      verdict = INSPECTION_RESULTS.WARNING;
      message = '⚠️ Cuidado con los frutos verdes';
    } else if (quality < QUALITY_THRESHOLDS.DANGER) {
      verdict = INSPECTION_RESULTS.REJECTED;
      message = '❌ CALIDAD RECHAZADA';
    } else if (unripe > ripe * 0.2) {
      verdict = INSPECTION_RESULTS.WARNING;
      message = '⚠️ Cuidado con los frutos verdes';
    }

    this.lastResult = { ripe, unripe, errors, quality, verdict, message };
    return this.lastResult;
  }

  setInterval(val) {
    this.interval = val;
    this.timer = val;
    return this;
  }

  setMinimumQuality(value) {
    this.minimumQuality = value;
    return this;
  }

  say(text, duration = 2.5) {
    this.bubbleText = text;
    this.bubbleTimer = duration;
    return this;
  }

  update(dt) {
    if (this.bubbleTimer > 0) this.bubbleTimer -= dt;
    else this.bubbleText = '';

    // Avance de frames
    this.frameTime += dt;
    if (this.frameTime >= this.animationSpeed) {
      this.frameTime = 0;
      this.frame = (this.frame + 1) % 4;
    }

    if (!this.isActive) return null;

    // ---- 1. CAMINANDO ----
    if (this.state === SUPERVISOR_STATES.WALK) {
      const target = this.walkingTarget === 'inspection' ? this.inspectionSpot : this.homeSpot;
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.hypot(dx, dy);

      if (Math.abs(dx) > Math.abs(dy)) {
        this.facing = dx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
      } else {
        this.facing = dy > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP;
      }

      if (dist < 4) {
        this.x = target.x;
        this.y = target.y;

        if (this.walkingTarget === 'inspection') {
          // Llegó al cajón: comienza la revisión
          this.state = SUPERVISOR_STATES.INSPECT;
          this.inspectionTimer = 0;
        } else {
          // Llegó de vuelta a su puesto: se queda en descanso
          this.state = SUPERVISOR_STATES.IDLE;
          this.isActive = false;
          this.facing = DIRECTIONS.LEFT;
        }
      } else {
        const step = (this.speed * dt) / dist;
        this.x += dx * step;
        this.y += dy * step;
      }
      return null;
    }

    // ---- 2. INSPECCIONANDO EL CAJÓN ----
    if (this.state === SUPERVISOR_STATES.INSPECT) {
      this.inspectionTimer += dt;
      if (this.inspectionTimer >= GAME_CONFIG.supervisorInspectionDuration) {
        this.state = SUPERVISOR_STATES.WRITE;
        this.inspectionTimer = 0;
      }
      return null;
    }

    // ---- 3. ANOTANDO EN EL PORTAPAPELES ----
    if (this.state === SUPERVISOR_STATES.WRITE) {
      this.inspectionTimer += dt;
      if (this.inspectionTimer >= SUPERVISOR_WRITE_DURATION) {
        this.inspectionTimer = 0;
        this.state = SUPERVISOR_STATES.APPROVE;
      }
      return null;
    }

    // ---- 4. DICTAMEN / VEREDICTO ----
    if (this.state === SUPERVISOR_STATES.APPROVE) {
      this.inspectionTimer += dt;
      if (this.inspectionTimer >= SUPERVISOR_APPROVE_DURATION) {
        const result = this.lastResult;
        if (typeof this.onInspectionComplete === 'function') {
          this.onInspectionComplete(result);
        }
        if (result?.message) {
          this.say(result.message, 2.5);
        }
        this.state = SUPERVISOR_STATES.TALK;
        this.inspectionTimer = 0;
        return result;
      }
      return null;
    }

    // ---- 5. HABLAR Y RETIRARSE ----
    if (this.state === SUPERVISOR_STATES.TALK) {
      this.inspectionTimer += dt;
      if (this.inspectionTimer >= SUPERVISOR_TALK_DURATION) {
        this.leave(); // Inicia caminata de regreso a homeSpot
      }
      return null;
    }

    return null;
  }

  get spriteKey() {
    const facingKey = {
      up: 'Up',
      down: 'Down',
      left: 'Left',
      right: 'Right',
    }[this.facing] ?? 'Left';

    switch (this.state) {
      case SUPERVISOR_STATES.INSPECT:
        return 'supervisor.inspect';
      case SUPERVISOR_STATES.WRITE:
        return 'supervisor.write';
      case SUPERVISOR_STATES.DETECT_ERROR:
        return 'supervisor.detectError';
      case SUPERVISOR_STATES.APPROVE:
        return 'supervisor.approve';
      case SUPERVISOR_STATES.WALK:
      default:
        return `supervisor.walk${facingKey}`;
    }
  }

  get nextInspectionIn() {
    return Math.max(0, this.timer);
  }
}

export { SUPERVISOR_STATES, INSPECTION_RESULTS };
export default Supervisor;
