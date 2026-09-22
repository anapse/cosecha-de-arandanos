/**
 * ScoreSystem.js
 * ---------------------------------------------------------------
 * Sistema de puntuación (§23).
 *
 *   Arándano maduro:   +10
 *   Entrega:          +100
 *   Entrega completa: +100
 *   Cosecha perfecta: +250
 *   Pintón:            -25
 *   Error:             -50
 *
 * Los valores vienen de GAME_CONFIG (§45): no se escriben números
 * sueltos en la lógica.
 */

import { GAME_CONFIG } from '../config/gameConfig.js';

export const SCORE_REASONS = Object.freeze({
  RIPE: 'Arandano maduro',
  DELIVERY: 'Entrega',
  FULL_DELIVERY: 'Entrega completa',
  PERFECT: 'Cosecha perfecta',
  UNRIPE: 'Pinton',
  ERROR: 'Error de cosecha',
  TIME_BONUS: 'Bono de tiempo',
  QUALITY_BONUS: 'Bono de calidad',
});

export class ScoreSystem {
  /**
   * @param {import('../state/GameState.js').GameState} [state]
   */
  constructor(state = null) {
    this.state = state;
    this.entries = [];
  }

  setState(state) {
    this.state = state;
    return this;
  }

  /** Registra una entrada y devuelve los puntos aplicados. */
  #apply(reason, points) {
    this.entries.push({ reason, points });

    if (this.state) {
      this.state.addScore(points, reason);
    }
    return points;
  }

  /** +10 por arándano maduro. */
  addRipe(count = 1) {
    return this.#apply(SCORE_REASONS.RIPE, GAME_CONFIG.scoreRipe * count);
  }

  /** +100 por entrega. */
  addDelivery() {
    return this.#apply(SCORE_REASONS.DELIVERY, GAME_CONFIG.scoreDelivery);
  }

  /** +100 adicional por entregar la canasta llena. */
  addFullDelivery() {
    return this.#apply(SCORE_REASONS.FULL_DELIVERY, GAME_CONFIG.scoreFullDelivery);
  }

  /** +250 por cosecha perfecta (sin errores ni pintones, §23). */
  addPerfectHarvest() {
    return this.#apply(SCORE_REASONS.PERFECT, GAME_CONFIG.perfectHarvestScore);
  }

  /** -25 por pintón recogido. */
  addUnripe() {
    return this.#apply(SCORE_REASONS.UNRIPE, GAME_CONFIG.scoreUnripe);
  }

  /** -50 por error de cosecha. */
  addError() {
    return this.#apply(SCORE_REASONS.ERROR, GAME_CONFIG.errorScore);
  }

  /**
   * Bonus de fin de nivel proporcional al tiempo restante y a la
   * calidad. No está en la especificación como obligatorio, así que
   * se expone desactivado por defecto.
   */
  addEndBonus({ timeLeft = 0, quality = 0, enabled = false } = {}) {
    if (!enabled) return 0;

    const timeBonus = Math.floor(timeLeft) * 2;
    const qualityBonus = Math.round(quality) >= 95 ? 200 : 0;
    let total = 0;

    if (timeBonus > 0) total += this.#apply(SCORE_REASONS.TIME_BONUS, timeBonus);
    if (qualityBonus > 0) total += this.#apply(SCORE_REASONS.QUALITY_BONUS, qualityBonus);
    return total;
  }

  /** ¿La partida fue perfecta? (§23) */
  static isPerfect({ errors = 0, unripe = 0 }) {
    return errors === 0 && unripe === 0;
  }

  /** Desglose acumulado, para la pantalla de resultados (§25). */
  getBreakdown() {
    const grouped = new Map();
    this.entries.forEach(({ reason, points }) => {
      const current = grouped.get(reason) ?? { reason, points: 0, count: 0 };
      grouped.set(reason, {
        reason,
        points: current.points + points,
        count: current.count + 1,
      });
    });
    return [...grouped.values()];
  }

  reset() {
    this.entries.length = 0;
    return this;
  }
}

export default ScoreSystem;
