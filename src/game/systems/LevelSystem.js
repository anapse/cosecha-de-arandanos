/**
 * LevelSystem.js
 * ---------------------------------------------------------------
 * Ciclo de vida de un nivel (§24, §25, §26, §27).
 *
 * Decide:
 *   - cuándo se cumple el objetivo → NIVEL COMPLETADO;
 *   - cuándo se pierde → COSECHA RECHAZADA;
 *   - qué motivo exacto provocó el final.
 *
 * Los motivos están alineados con la especificación:
 *   victoria: objetivo + calidad mínima + entregas
 *   derrota:  tiempo agotado, sin vidas, objetivo no alcanzado,
 *             calidad insuficiente, demasiados pintones
 */

export const END_REASONS = Object.freeze({
  VICTORY: 'victory',
  TIME_UP: 'timeUp',
  NO_LIVES: 'noLives',
  QUALITY_LOW: 'qualityLow',
  TOO_MANY_UNRIPE: 'tooManyUnripe',
});

/** Umbral de pintones antes de rechazo directo. */
export const MAX_UNRIPE_BEFORE_REJECT = 40;

export class LevelSystem {
  /**
   * @param {import('../state/GameState.js').GameState} state
   */
  constructor(state) {
    this.state = state;
    this.concluded = false;
  }

  setState(state) {
    this.state = state;
    return this;
  }

  /** Prepara el sistema para un nivel nuevo. */
  reset() {
    this.concluded = false;
    return this;
  }

  /**
   * Evalúa la situación tras cada frame/evento relevante.
   * @returns {{ finished: boolean, outcome?: string, reason?: string, message?: string }}
   */
  evaluate() {
    if (this.concluded || !this.state) return { finished: false };

    const state = this.state;
    const level = state.levelConfig ?? {};
    const minimumQuality = level.minimumQuality ?? 85;

    /* ---------- Derrota inmediata ---------- */

    if (state.lives <= 0) {
      return this.#finish('defeat', END_REASONS.NO_LIVES, 'Sin vidas.');
    }

    if (state.timeLeft <= 0 && !state.victoryConditionsMet) {
      return this.#finish('defeat', END_REASONS.TIME_UP, 'Tiempo agotado.');
    }

    if (state.unripeCollected >= MAX_UNRIPE_BEFORE_REJECT) {
      return this.#finish(
        'defeat',
        END_REASONS.TOO_MANY_UNRIPE,
        'Demasiados pintones.'
      );
    }

    /* ---------- Victoria ---------- */

    if (state.victoryConditionsMet) {
      return this.#finish('victory', END_REASONS.VICTORY, 'Objetivo cumplido.');
    }

    /* ---------- Cierre por tiempo con calidad insuficiente ---------- */
    // Si el tiempo se agotó y no se cumplió el objetivo, ya se cubrió
    // arriba. Si se cumplió el objetivo pero la calidad está por
    // debajo del mínimo, el nivel no se aprueba.

    return { finished: false };
  }

  /**
   * Comprueba específicamente el fallo por calidad al entregar.
   * Se llama cuando el supervisor rechaza la cosecha (§20).
   */
  checkQualityAfterInspection({ rejected = false } = {}) {
    if (this.concluded || !this.state) return { finished: false };

    const minimumQuality = this.state.levelConfig?.minimumQuality ?? 85;
    const criticallyLow = this.state.quality < minimumQuality * 0.6;

    if (rejected && criticallyLow) {
      return this.#finish(
        'defeat',
        END_REASONS.QUALITY_LOW,
        'Calidad insuficiente.'
      );
    }

    return { finished: false };
  }

  #finish(outcome, reason, message) {
    this.concluded = true;
    this.state.finishLevel(outcome, reason, message);
    return { finished: true, outcome, reason, message };
  }

  /**
   * Datos para la pantalla de resultado (§25, §26).
   */
  buildSummary() {
    const state = this.state;
    const level = state.levelConfig ?? {};
    const minimumQuality = level.minimumQuality ?? 85;

    return {
      outcome: state.status === 'LEVEL_COMPLETE' ? 'victory' : 'defeat',
      reason: state.endReason,
      message: state.endMessage,

      levelId: state.levelId,
      levelName: level.name ?? '',

      score: state.score,
      levelScore: state.levelScore,

      harvested: state.harvested,
      target: state.target,

      quality: Math.round(state.quality),
      minimumQuality,

      errors: state.errors,
      unripeCollected: state.unripeCollected,
      deliveries: state.deliveries,

      lives: state.lives,

      timeLeft: state.timeLeft,
      timeUsed: state.elapsed,

      perfectHarvest: state.perfectHarvest,
      breakdown: state.levelScoreBreakdown,
    };
  }
}

export default LevelSystem;
