/**
 * QualitySystem.js
 * ---------------------------------------------------------------
 * Sistema de calidad (§13).
 *
 * Escala:
 *   90-100%  Excelente
 *   75-89%   Bueno / advertencia
 *   50-74%   Peligro
 *   0-49%    Calidad crítica
 *
 * La calidad baja al recoger pintones y se recupera ligeramente al
 * entregar bien. El objetivo del nivel exige mantenerla por encima
 * de un mínimo (§24).
 */

import { QUALITY_THRESHOLDS } from '../config/constants.js';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { clamp } from '../../utils/math.js';

export const QUALITY_LEVELS = Object.freeze({
  EXCELLENT: 'excellent',
  GOOD: 'good',
  DANGER: 'danger',
  CRITICAL: 'critical',
});

export class QualitySystem {
  constructor() {
    this.value = GAME_CONFIG.initialQuality;
  }

  reset(value = GAME_CONFIG.initialQuality) {
    this.value = clamp(value, 0, 100);
    return this;
  }

  /** Penalización por recoger un pintón (§12). */
  applyUnripePenalty() {
    return this.adjust(-GAME_CONFIG.qualityLossPerUnripe);
  }

  /** Penalización por un error de cosecha (§12). */
  applyErrorPenalty() {
    return this.adjust(-GAME_CONFIG.qualityLossPerError);
  }

  /** Recuperación al entregar correctamente (§15). */
  applyDeliveryBonus() {
    return this.adjust(GAME_CONFIG.qualityGainPerDelivery);
  }

  /** Ajuste libre con límites. */
  adjust(delta) {
    this.value = clamp(this.value + delta, 0, 100);
    return this.value;
  }

  set(value) {
    this.value = clamp(value, 0, 100);
    return this.value;
  }

  /** Etiqueta textual del estado de calidad (§13). */
  get level() {
    if (this.value >= QUALITY_THRESHOLDS.EXCELLENT) return QUALITY_LEVELS.EXCELLENT;
    if (this.value >= QUALITY_THRESHOLDS.GOOD) return QUALITY_LEVELS.GOOD;
    if (this.value >= QUALITY_THRESHOLDS.DANGER) return QUALITY_LEVELS.DANGER;
    return QUALITY_LEVELS.CRITICAL;
  }

  /** Texto mostrado en el HUD y las revisiones. */
  get levelLabel() {
    switch (this.level) {
      case QUALITY_LEVELS.EXCELLENT:
        return 'Excelente';
      case QUALITY_LEVELS.GOOD:
        return 'Bueno';
      case QUALITY_LEVELS.DANGER:
        return 'Peligro';
      default:
        return 'Crítica';
    }
  }

  /** Color del indicador. */
  get color() {
    switch (this.level) {
      case QUALITY_LEVELS.EXCELLENT:
        return '#4fbf5a';
      case QUALITY_LEVELS.GOOD:
        return '#f2c14e';
      case QUALITY_LEVELS.DANGER:
        return '#e8853c';
      default:
        return '#e2453c';
    }
  }

  /** ¿Cumple el mínimo exigido por el nivel? */
  meetsMinimum(minimum) {
    return this.value >= minimum;
  }

  /** Proporción 0-1 para barras de progreso. */
  get ratio() {
    return this.value / 100;
  }

  get rounded() {
    return Math.round(this.value);
  }
}

export default QualitySystem;
