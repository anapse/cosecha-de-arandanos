/**
 * Supervisor.js
 * ---------------------------------------------------------------
 * Supervisor de calidad (§17, §18, §19, §20).
 *
 * Preparado para los estados:
 *   walk, inspect, write, detectError, approve, talk
 *
 * La INTELIGENCIA completa vendrá en la fase del supervisor.
 * Aquí queda la máquina de estados, el movimiento hacia la zona de
 * revisión y el cálculo del resultado.
 */

import { SUPERVISOR_STATES, INSPECTION_RESULTS, DIRECTIONS, QUALITY_THRESHOLDS } from '../config/constants.js';
import { GAME_CONFIG } from '../config/gameConfig.js';

/* ---------- Duraciones de cada fase de la revisión (segundos) ----------
   Se declaran aquí, en un solo sitio, para poder ajustar el ritmo de la
   inspección sin buscar números sueltos por el código. */
const SUPERVISOR_WRITE_DURATION = 1.2;      // anotando en el portapapeles
const SUPERVISOR_DETECT_DURATION = 1.0;     // revisando/detectando
const SUPERVISOR_APPROVE_DURATION = 1.4;    // dictaminando
const SUPERVISOR_TALK_DURATION = 1.6;       // hablando antes de retirarse

export class Supervisor {
  /**
   * @param {object} options
   * @param {number} options.x
   * @param {number} options.y
   * @param {object} options.homeSpot  posición de descanso (esquina)
   * @param {object} options.inspectionSpot posición de revisión (junto a la canasta)
   */
  constructor({ x = 0, y = 0, homeSpot = null, inspectionSpot = null } = {}) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 36;

    this.homeSpot = homeSpot ?? { x, y };
    this.inspectionSpot = inspectionSpot ?? { x, y };

    this.speed = GAME_CONFIG.supervisorWalkSpeed;

    this.state = SUPERVISOR_STATES.IDLE;
    this.facing = DIRECTIONS.DOWN;
    this.frame = 0;
    this.frameTime = 0;
    this.animationSpeed = 0.16;

    /* ---------- Temporizador de revisión (§19) ---------- */
    this.interval = GAME_CONFIG.supervisorInterval;
    this.timer = this.interval;
    this.isActive = false;         // true mientras está en el campo
    this.inspectionTimer = 0;
    this.onInspectionComplete = null;

    /* ---------- Resultado de la última revisión (§20) ---------- */
    this.lastResult = null;
    /** Texto de burbuja que muestra el render. */
    this.bubbleText = '';
    this.bubbleTimer = 0;
    /** true cuando ya se mostró el veredicto (evita repetir la animación). */
    this.verdictShown = false;
  }

  get rect() {
    return { x: this.x - this.width / 2, y: this.y - this.height / 2, w: this.width, h: this.height };
  }

  get renderX() {
    return this.x - this.width / 2;
  }

  get renderY() {
    return this.y - this.height / 2;
  }

  /** Reinicia para un nivel nuevo. */
  reset(interval = this.interval) {
    this.interval = interval;
    this.timer = interval;
    this.x = this.homeSpot.x;
    this.y = this.homeSpot.y;
    this.state = SUPERVISOR_STATES.IDLE;
    this.isActive = false;
    this.inspectionTimer = 0;
    this.lastResult = null;
    this.bubbleText = '';
    this.bubbleTimer = 0;
    this.frame = 0;
    return this;
  }

  /** Cambia los puntos de interés al regenerar el mapa. */
  setSpots(homeSpot, inspectionSpot) {
    this.homeSpot = homeSpot;
    this.inspectionSpot = inspectionSpot;
    this.x = homeSpot.x;
    this.y = homeSpot.y;
    return this;
  }

  /** Avanza el temporizador y devuelve true cuando toca revisar (§19). */
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

  /** El supervisor entra al campo y camina a la zona de revisión. */
  startInspection() {
    this.isActive = true;
    this.state = SUPERVISOR_STATES.WALK;
    this.inspectionTimer = 0;
    this.bubbleText = 'REVISIÓN DE CALIDAD';
    this.bubbleTimer = 2;
  }

  /** El supervisor abandona el campo. */
  leave() {
    this.isActive = false;
    this.state = SUPERVISOR_STATES.IDLE;
    this.bubbleText = '';
    this.bubbleTimer = 0;
    this.x = this.homeSpot.x;
    this.y = this.homeSpot.y;
  }

  /**
   * Evalúa la cosecha y produce el resultado (§20).
   * @param {object} stats { ripe, unripe, errors, quality }
   * @returns {object} resultado de la revisión
   */
  evaluate({ ripe = 0, unripe = 0, errors = 0, quality = 100 }) {
    const minimumQuality = this.minimumQuality ?? 85;
    let verdict = INSPECTION_RESULTS.APPROVED;
    let message = '✅ CALIDAD APROBADA.';

    if (quality < minimumQuality && quality >= QUALITY_THRESHOLDS.DANGER) {
      verdict = INSPECTION_RESULTS.WARNING;
      message = '⚠️ Cuidado con los pintones.';
    } else if (quality < QUALITY_THRESHOLDS.DANGER) {
      verdict = INSPECTION_RESULTS.REJECTED;
      message = '❌ CALIDAD RECHAZADA.';
    } else if (unripe > ripe * 0.2) {
      verdict = INSPECTION_RESULTS.WARNING;
      message = '⚠️ Cuidado con los pintones.';
    }

    this.lastResult = { ripe, unripe, errors, quality, verdict, message };
    return this.lastResult;
  }

  /** Define la calidad mínima exigida por el nivel. */
  setMinimumQuality(value) {
    this.minimumQuality = value;
    return this;
  }

  /** Muestra una burbuja de diálogo (§54). */
  say(text, duration = 2.5) {
    this.bubbleText = text;
    this.bubbleTimer = duration;
    this.state = SUPERVISOR_STATES.TALK;
    return this;
  }

  /**
   * Actualiza la máquina de estados.
   * @param {number} dt
   * @returns {object|null} resultado cuando termina una revisión
   */
  update(dt) {
    if (this.bubbleTimer > 0) this.bubbleTimer -= dt;

    // Animación de frames
    this.frameTime += dt;
    if (this.frameTime >= this.animationSpeed) {
      this.frameTime = 0;
      this.frame = (this.frame + 1) % 4;
    }

    if (!this.isActive) return null;

    // ---- Caminar hacia la zona de revisión ----
    if (this.state === SUPERVISOR_STATES.WALK) {
      const dx = this.inspectionSpot.x - this.x;
      const dy = this.inspectionSpot.y - this.y;
      const dist = Math.hypot(dx, dy);

      // Prioriza el eje horizontal, igual que el jugador (top-down).
      if (Math.abs(dx) > Math.abs(dy)) {
        this.facing = dx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
      } else {
        this.facing = dy > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP;
      }

      if (dist < 3) {
        this.x = this.inspectionSpot.x;
        this.y = this.inspectionSpot.y;
        this.state = SUPERVISOR_STATES.INSPECT;
        this.inspectionTimer = 0;
      } else {
        const step = (this.speed * dt) / dist;
        this.x += dx * step;
        this.y += dy * step;
      }
      return null;
    }

    // ---- Revisar → anotar → veredicto → salir ----
    if (this.state === SUPERVISOR_STATES.INSPECT) {
      this.inspectionTimer += dt;
      if (this.inspectionTimer >= GAME_CONFIG.supervisorInspectionDuration) {
        this.state = SUPERVISOR_STATES.WRITE;
        this.inspectionTimer = 0;
      }
      return null;
    }

    // ---- Anotar (WRITE) ----
    if (this.state === SUPERVISOR_STATES.WRITE) {
      this.inspectionTimer += dt;
      if (this.inspectionTimer >= SUPERVISOR_WRITE_DURATION) {
        this.inspectionTimer = 0;
        this.state = SUPERVISOR_STATES.DETECT_ERROR;
      }
      return null;
    }

    // ---- Detectar error (DETECT_ERROR) ----
    // Antes este estado NO tenía rama: la máquina se quedaba atascada
    // aquí para siempre y la revisión nunca terminaba.
    if (this.state === SUPERVISOR_STATES.DETECT_ERROR) {
      this.inspectionTimer += dt;
      if (this.inspectionTimer >= SUPERVISOR_DETECT_DURATION) {
        this.inspectionTimer = 0;
        // El veredicto decide qué animación mostrar.
        const verdict = this.lastResult?.verdict;
        this.state =
          verdict === INSPECTION_RESULTS.REJECTED
            ? SUPERVISOR_STATES.DETECT_ERROR
            : SUPERVISOR_STATES.APPROVE;
        this.verdictShown = true;
        // Si es rechazo, se queda un momento más en la animación de
        // error y luego pasa a aprobar/salir.
        if (this.state === SUPERVISOR_STATES.DETECT_ERROR) {
          this.inspectionTimer = -SUPERVISOR_APPROVE_DURATION;
        }
      }
      return null;
    }

    // ---- Aprobar / dictaminar (APPROVE) ----
    if (this.state === SUPERVISOR_STATES.APPROVE) {
      this.inspectionTimer += dt;
      if (this.inspectionTimer >= SUPERVISOR_APPROVE_DURATION) {
        const result = this.lastResult;
        if (typeof this.onInspectionComplete === 'function') {
          this.onInspectionComplete(result);
        }
        this.state = SUPERVISOR_STATES.TALK;
        this.inspectionTimer = 0;
        return result;
      }
      return null;
    }

    // ---- Hablar y retirarse (TALK) ----
    if (this.state === SUPERVISOR_STATES.TALK) {
      this.inspectionTimer += dt;
      if (this.inspectionTimer >= SUPERVISOR_TALK_DURATION) {
        this.leave();
      }
      return null;
    }

    return null;
  }

  /** Clave del sprite según el estado actual (§18). */
  get spriteKey() {
    const facingKey = {
      up: 'Up',
      down: 'Down',
      left: 'Left',
      right: 'Right',
    }[this.facing] ?? 'Down';

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

  /** Segundos que faltan para la siguiente revisión (§19). */
  get nextInspectionIn() {
    return Math.max(0, this.timer);
  }
}

export { SUPERVISOR_STATES, INSPECTION_RESULTS };
export default Supervisor;
