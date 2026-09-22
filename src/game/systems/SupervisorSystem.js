/**
 * SupervisorSystem.js
 * ---------------------------------------------------------------
 * Sistema del supervisor de calidad (§17, §19, §20).
 *
 * Responsabilidades:
 *   - llevar la cuenta atrás de la próxima revisión;
 *   - activar al supervisor y esperar a que llegue a la zona;
 *   - calcular el resultado de la inspección;
 *   - aplicar las consecuencias (avisar, penalizar o aprobar).
 *
 * La IA completa (rutas, más diálogos) llega en una fase posterior.
 * Aquí ya está la estructura completa del ciclo.
 */

import { INSPECTION_RESULTS } from '../config/constants.js';

export class SupervisorSystem {
  /**
   * @param {object} deps
   * @param {import('../entities/Supervisor.js').Supervisor} deps.supervisor
   */
  constructor({ supervisor }) {
    this.supervisor = supervisor;
    this.result = null;
    this.pendingInspection = false;
    this.lastInspectionQuality = null;
  }

  setSupervisor(supervisor) {
    this.supervisor = supervisor;
  }

  /** Prepara el sistema para un nivel nuevo. */
  reset({ interval, minimumQuality }) {
    this.supervisor?.reset(interval);
    this.supervisor?.setMinimumQuality(minimumQuality);
    this.result = null;
    this.pendingInspection = false;
    this.lastInspectionQuality = null;
    return this;
  }

  /**
   * Comprueba si toca revisión y activa al supervisor.
   * @param {number} dt
   * @param {object} stats { ripe, unripe, errors, quality }
   * @returns {boolean} true si el supervisor acaba de entrar
   */
  tick(dt, stats) {
    if (!this.supervisor) return false;
    if (this.supervisor.isActive) return false;

    const due = this.supervisor.tickTimer(dt);
    if (due) {
      // El resultado se calcula al entrar, pero se muestra cuando el
      // supervisor termina de revisar (§20: primero camina, luego revisa).
      this.result = this.supervisor.evaluate(stats);
      this.pendingInspection = true;
      return true;
    }
    return false;
  }

  /**
   * Actualiza al supervisor y devuelve el resultado cuando termina.
   * @param {number} dt
   * @returns {object|null} resultado de la revisión recién terminada
   */
  update(dt) {
    if (!this.supervisor) return null;
    return this.supervisor.update(dt);
  }

  /**
   * Aplica las consecuencias del resultado (§20).
   * @param {object} result
   * @param {object} handlers callbacks que aporta el motor
   * @returns {object} efectos a aplicar
   */
  applyResult(result, { onReject = null } = {}) {
    if (!result) return { action: 'none' };

    const effects = {
      action: result.verdict,
      message: result.message,
      approved: result.verdict === INSPECTION_RESULTS.APPROVED,
      warning: result.verdict === INSPECTION_RESULTS.WARNING,
      rejected: result.verdict === INSPECTION_RESULTS.REJECTED,
    };

    if (effects.rejected && typeof onReject === 'function') {
      onReject(result);
    }

    this.lastInspectionQuality = result.quality;
    this.pendingInspection = false;
    return effects;
  }

  /** ¿Hay una revisión en curso? */
  get isInspecting() {
    return Boolean(this.supervisor?.isActive);
  }

  /** Segundos hasta la próxima revisión. */
  get nextInspectionIn() {
    return this.supervisor?.nextInspectionIn ?? 0;
  }

  /** Último resultado calculado. */
  get lastResult() {
    return this.result;
  }
}

export { INSPECTION_RESULTS };
export default SupervisorSystem;
