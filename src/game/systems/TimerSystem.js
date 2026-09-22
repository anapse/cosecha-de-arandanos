/**
 * TimerSystem.js
 * ---------------------------------------------------------------
 * Temporizador del nivel (§22) y temporizador del supervisor (§19).
 *
 * Se mantiene separado del GameState para que las reglas de tiempo
 * estén en un solo sitio y se puedan ajustar sin tocar los estados.
 */

import { GAME_CONFIG } from '../config/gameConfig.js';

/** Momento en el que aparece la alerta visual de tiempo (§22). */
export const TIME_WARNING_SECONDS = 20;

export class TimerSystem {
  constructor({ timeLimit = 180, supervisorInterval = GAME_CONFIG.supervisorInterval } = {}) {
    this.timeLimit = timeLimit;
    this.timeLeft = timeLimit;

    this.supervisorInterval = supervisorInterval;
    this.supervisorLeft = supervisorInterval;

    this.running = false;
    this.warningFired = false;
    this.supervisorWarningFired = false;
  }

  /** Prepara el temporizador para un nivel. */
  configure({ timeLimit, supervisorInterval }) {
    if (typeof timeLimit === 'number') {
      this.timeLimit = timeLimit;
      this.timeLeft = timeLimit;
    }
    if (typeof supervisorInterval === 'number') {
      this.supervisorInterval = supervisorInterval;
      this.supervisorLeft = supervisorInterval;
    }
    this.warningFired = false;
    this.supervisorWarningFired = false;
    this.running = false;
    return this;
  }

  start() {
    this.running = true;
    return this;
  }

  pause() {
    this.running = false;
    return this;
  }

  resume() {
    this.running = true;
    return this;
  }

  /**
   * Avanza ambos temporizadores.
   * @param {number} dt
   * @returns {object} eventos ocurridos en este frame
   */
  update(dt) {
    const events = {
      timeWarning: false,
      timeUp: false,
      supervisorDue: false,
      supervisorWarning: false,
    };

    if (!this.running) return events;

    /* ---------- Tiempo del nivel (§22) ---------- */
    this.timeLeft = Math.max(0, this.timeLeft - dt);

    if (!this.warningFired && this.timeLeft <= TIME_WARNING_SECONDS) {
      this.warningFired = true;
      events.timeWarning = true;
    }

    if (this.timeLeft <= 0) {
      events.timeUp = true;
    }

    /* ---------- Temporizador del supervisor (§19) ---------- */
    if (this.supervisorLeft > 0) {
      this.supervisorLeft = Math.max(0, this.supervisorLeft - dt);

      // Aviso 5 segundos antes de la revisión.
      if (!this.supervisorWarningFired && this.supervisorLeft <= 5) {
        this.supervisorWarningFired = true;
        events.supervisorWarning = true;
      }

      if (this.supervisorLeft <= 0) {
        events.supervisorDue = true;
      }
    }

    return events;
  }

  /** Reinicia la cuenta atrás del supervisor tras una revisión. */
  resetSupervisor() {
    this.supervisorLeft = this.supervisorInterval;
    this.supervisorWarningFired = false;
    return this;
  }

  /** Segundos ya transcurridos. */
  get elapsed() {
    return this.timeLimit - this.timeLeft;
  }

  /** Proporción de tiempo restante 0-1. */
  get timeRatio() {
    return this.timeLimit > 0 ? this.timeLeft / this.timeLimit : 0;
  }

  get isTimeUp() {
    return this.timeLeft <= 0;
  }

  get isWarning() {
    return this.timeLeft <= TIME_WARNING_SECONDS;
  }

  get nextInspectionIn() {
    return this.supervisorLeft;
  }
}

export default TimerSystem;
