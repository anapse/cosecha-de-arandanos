/**
 * GameState.js
 * ---------------------------------------------------------------
 * Estado central del juego (§43).
 *
 * Aquí vive TODO lo que cambia durante una partida: puntuación,
 * calidad, vidas, timers, contadores y el estado de la máquina de
 * estados (MENU, PLAYING, PAUSED, INSPECTION, LEVEL_COMPLETE,
 * GAME_OVER).
 *
 * Es un objeto plano, sin React. React recibe una COPIA resumida
 * (HUD snapshot) solo cuando cambia algo relevante, no cada frame.
 */

import { GAME_STATES, INSPECTION_RESULTS, QUALITY_THRESHOLDS } from '../config/constants.js';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { clamp } from '../../utils/math.js';

export class GameState {
  constructor() {
    this.reset();
  }

  /** Deja el estado como recién arrancado. */
  reset() {
    /* ---------- Máquina de estados ---------- */
    this.status = GAME_STATES.MENU;
    this.previousStatus = GAME_STATES.MENU;

    /* ---------- Nivel ---------- */
    this.levelId = 1;
    this.levelConfig = null;

    /* ---------- Puntuación (§23) ---------- */
    this.score = 0;
    this.levelScore = 0;

    /* ---------- Cosecha ---------- */
    this.harvested = 0;        // arándanos maduros entregados (cuenta para el objetivo)
    this.harvestedThisRun = 0; // recogidos sin entregar aún
    this.unripeCollected = 0;
    this.errors = 0;
    this.deliveries = 0;
    this.target = 0;

    /* ---------- Calidad (§13) ---------- */
    this.quality = GAME_CONFIG.initialQuality;

    /* ---------- Vidas (§21) ---------- */
    this.lives = GAME_CONFIG.initialLives;
    this.maxLives = GAME_CONFIG.initialLives;

    /* ---------- Tiempo (§22) ---------- */
    this.timeLeft = 0;
    this.timeLimit = 0;
    this.elapsed = 0;
    this.timeWarning = false;

    /* ---------- Supervisor (§19) ---------- */
    this.supervisorTimer = 0;
    this.supervisorInterval = GAME_CONFIG.supervisorInterval;
    this.supervisorActive = false;
    this.inspectionResult = null;

    /* ---------- Estadísticas del nivel ---------- */
    this.perfectHarvest = true;
    this.fruitCollected = 0;
    this.boxesFilled = 0;

    /* ---------- Resultado ---------- */
    this.endReason = null;
    this.endMessage = '';
    this.levelScoreBreakdown = [];

    /* ---------- Control interno ---------- */
    this.paused = false;
    this.dirty = true; // true = React debe refrescar el HUD
  }

  /* ============================================================
     Máquina de estados
     ============================================================ */

  /** @param {string} status uno de GAME_STATES */
  setStatus(status) {
    if (this.status === status) return false;
    this.previousStatus = this.status;
    this.status = status;
    this.dirty = true;
    return true;
  }

  is(...statuses) {
    return statuses.includes(this.status);
  }

  get isPlaying() {
    return this.status === GAME_STATES.PLAYING || this.status === GAME_STATES.INSPECTION;
  }

  get isFinished() {
    return this.is(GAME_STATES.LEVEL_COMPLETE, GAME_STATES.GAME_OVER);
  }

  /* ============================================================
     Inicio de nivel
     ============================================================ */

  /**
   * Carga la configuración de un nivel.
   * @param {object} levelConfig de src/data/levels.js
   */
  startLevel(levelConfig) {
    this.levelConfig = levelConfig;
    this.levelId = levelConfig.id;

    this.score = this.score ?? 0;
    this.levelScore = 0;

    this.harvested = 0;
    this.harvestedThisRun = 0;
    this.unripeCollected = 0;
    this.errors = 0;
    this.deliveries = 0;
    this.target = levelConfig.targetHarvest ?? 50;

    this.quality = GAME_CONFIG.initialQuality;

    this.lives = GAME_CONFIG.initialLives;
    this.maxLives = GAME_CONFIG.initialLives;

    this.timeLimit = levelConfig.timeLimit ?? 180;
    this.timeLeft = this.timeLimit;
    this.elapsed = 0;
    this.timeWarning = false;

    this.supervisorInterval = levelConfig.supervisorInterval ?? GAME_CONFIG.supervisorInterval;
    this.supervisorTimer = this.supervisorInterval;
    this.supervisorActive = false;
    this.inspectionResult = null;

    this.perfectHarvest = true;
    this.fruitCollected = 0;
    this.boxesFilled = 0;

    this.endReason = null;
    this.endMessage = '';
    this.levelScoreBreakdown = [];

    this.paused = false;
    this.setStatus(GAME_STATES.PLAYING);
    this.dirty = true;
    return this;
  }

  /* ============================================================
     Puntuación y calidad
     ============================================================ */

  /** Suma puntos y los registra con su motivo. */
  addScore(points, reason = '') {
    this.score += points;
    this.levelScore += points;
    if (reason) this.levelScoreBreakdown.push({ reason, points });
    this.dirty = true;
    return this.score;
  }

  /**
   * Ajusta la calidad con límites.
   * @param {number} delta positivo o negativo
   */
  adjustQuality(delta) {
    this.quality = clamp(this.quality + delta, 0, 100);
    this.dirty = true;
    return this.quality;
  }

  /**
   * Registra un error de cosecha (§12).
   *
   * Solo cuenta y ajusta calidad. Los PUNTOS los aplica ScoreSystem,
   * para que haya una única fuente de verdad de la puntuación.
   */
  registerError({ qualityLoss = GAME_CONFIG.qualityLossPerError } = {}) {
    this.errors += 1;
    this.perfectHarvest = false;
    this.adjustQuality(-qualityLoss);
    this.dirty = true;
    return this.errors;
  }

  /** Registra un pintón recogido (§12). */
  registerUnripe() {
    this.unripeCollected += 1;
    this.perfectHarvest = false;
    this.dirty = true;
    return this.unripeCollected;
  }

  /** Pierde vida (por defecto medio corazón = 0.5, o 1 vida). Devuelve las vidas restantes. */
  loseLife(amount = 0.5) {
    this.lives = Math.max(0, Math.round((this.lives - amount) * 10) / 10);
    this.dirty = true;
    return this.lives;
  }

  /* ============================================================
     Cosecha y entrega
     ============================================================ */

  /**
   * Suma un arándano maduro recogido (aún sin entregar).
   *
   * OJO — responsabilidad de puntuación:
   * Este método NO suma puntos. Quien puntúa es ScoreSystem, que es la
   * única fuente de verdad de la puntuación. Aquí solo se llevan los
   * contadores. (Antes ambos sumaban y el maduro valía +20 en vez de
   * +10: doble conteo detectado con las pruebas.)
   */
  registerHarvest() {
    this.fruitCollected += 1;
    this.harvestedThisRun += 1;
    this.dirty = true;
    return this.fruitCollected;
  }

  /**
   * Vacía la canasta y acredita la entrega (§15).
   * Igual que registerHarvest: los PUNTOS los aplica ScoreSystem.
   */
  registerDelivery({ delivered = 0, full = false } = {}) {
    this.deliveries += 1;
    this.harvested += delivered;
    this.harvestedThisRun = 0;

    if (full) this.boxesFilled += 1;

    // Entregar bien recupera un poco de calidad (recompensa por
    // trabajar limpio).
    this.adjustQuality(GAME_CONFIG.qualityGainPerDelivery);

    this.dirty = true;
    return this.harvested;
  }

  /* ============================================================
     Tiempo
     ============================================================ */

  /**
   * Avanza el temporizador del nivel (§22).
   * @param {number} dt
   * @returns {boolean} true si se agotó el tiempo en este frame
   */
  tickTime(dt) {
    if (!this.isPlaying && this.status !== GAME_STATES.INSPECTION) return false;

    this.timeLeft = Math.max(0, this.timeLeft - dt);
    this.elapsed += dt;

    if (this.timeLeft <= 20 && !this.timeWarning) {
      this.timeWarning = true;
      this.dirty = true;
    }

    if (this.timeLeft <= 0) return true;
    return false;
  }

  /* ============================================================
     Objetivos y fin de nivel
     ============================================================ */

  /** ¿Se cumplió el objetivo de cosecha? (§24) */
  get targetReached() {
    return this.harvested >= this.target;
  }

  /** ¿Se cumplieron todas las condiciones de victoria? (§25) */
  get victoryConditionsMet() {
    const minimumQuality = this.levelConfig?.minimumQuality ?? 85;
    const requiredDeliveries = this.levelConfig?.deliveries ?? 1;
    return (
      this.harvested >= this.target &&
      this.quality >= minimumQuality &&
      this.deliveries >= requiredDeliveries
    );
  }

  /** ¿La calidad está por debajo del mínimo? (§26) */
  get qualityFailed() {
    const minimumQuality = this.levelConfig?.minimumQuality ?? 85;
    return this.quality < minimumQuality;
  }

  get qualityLevel() {
    if (this.quality >= QUALITY_THRESHOLDS.EXCELLENT) return 'excellent';
    if (this.quality >= QUALITY_THRESHOLDS.GOOD) return 'good';
    if (this.quality >= QUALITY_THRESHOLDS.DANGER) return 'danger';
    return 'critical';
  }

  /**
   * Cierra el nivel.
   * @param {'victory'|'defeat'} outcome
   * @param {string} reason motivo corto
   * @param {string} message mensaje mostrado al jugador
   */
  finishLevel(outcome, reason, message = '') {
    this.endReason = reason;
    this.endMessage = message;

    if (outcome === 'victory') {
      // Bonus por cosecha perfecta (§23).
      // La puntuación se aplica aquí porque es una regla del estado del
      // nivel; ScoreSystem expone el mismo bonus para quien prefiera
      // usarlo desde fuera, pero NO se llama en ambos sitios.
      if (this.perfectHarvest && this.errors === 0 && this.unripeCollected === 0) {
        this.addScore(GAME_CONFIG.perfectHarvestScore, 'Cosecha perfecta');
      }
      this.setStatus(GAME_STATES.LEVEL_COMPLETE);
    } else {
      this.setStatus(GAME_STATES.GAME_OVER);
    }

    this.dirty = true;
    return this;
  }

  /** Resultado de la última inspección (§20). */
  setInspectionResult(result) {
    this.inspectionResult = result;
    this.dirty = true;
    return this;
  }

  /* ============================================================
     Instantánea para React
     ============================================================ */

  /**
   * Devuelve el resumen que consume la UI externa.
   * Se llama solo cuando `dirty` es true, nunca cada frame.
   * @param {object} extra datos que añade el engine (canasta, etc.)
   */
  toHudSnapshot(extra = {}) {
    const minimumQuality = this.levelConfig?.minimumQuality ?? 85;

    return {
      status: this.status,
      level: this.levelId,
      levelName: this.levelConfig?.name ?? '',
      totalLevels: 12,

      score: this.score,
      levelScore: this.levelScore,

      harvested: this.harvested,
      target: this.target,
      harvestedThisRun: this.harvestedThisRun,

      errors: this.errors,
      unripeCollected: this.unripeCollected,
      deliveries: this.deliveries,

      quality: Math.round(this.quality),
      minimumQuality,

      lives: this.lives,
      maxLives: this.maxLives,

      timeLeft: this.timeLeft,
      timeLimit: this.timeLimit,
      timeWarning: this.timeWarning,

      supervisorTimer: this.supervisorTimer,
      supervisorInterval: this.supervisorInterval,
      supervisorActive: this.supervisorActive,
      inspectionResult: this.inspectionResult,

      basketCurrent: extra.basketCurrent ?? 0,
      basketCapacity: extra.basketCapacity ?? GAME_CONFIG.basketCapacity,
      basketFull: extra.basketFull ?? false,

      endReason: this.endReason,
      endMessage: this.endMessage,
      perfectHarvest: this.perfectHarvest,
      breakdown: this.levelScoreBreakdown,
    };
  }
}

export { GAME_STATES, INSPECTION_RESULTS };
export default GameState;
