/**
 * Player.js
 * ---------------------------------------------------------------
 * Entidad jugador (§14, §8).
 *
 * Preparado para los 11 estados del sprite:
 *   idle, walkUp, walkDown, walkLeft, walkRight,
 *   harvestLeft, harvestRight, error, tired, victory, defeat
 *
 * NO contiene lógica de React. El motor lo instancia, actualiza y
 * dibuja.
 */

import { DIRECTIONS, PLAYER_STATES, HARVEST_SIDES } from '../config/constants.js';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { clamp } from '../../utils/math.js';

export class Player {
  /**
   * @param {object} options
   * @param {number} options.x posición inicial (centro, px lógicos)
   * @param {number} options.y
   */
  constructor({ x = 0, y = 0 } = {}) {
    // Posición = CENTRO del jugador. El rect de colisión se deriva.
    this.x = x;
    this.y = y;

    this.width = GAME_CONFIG.playerWidth;
    this.height = GAME_CONFIG.playerHeight;

    this.speed = GAME_CONFIG.playerSpeed;

    /* ---------- Estado de animación ---------- */
    this.state = PLAYER_STATES.IDLE;
    this.facing = DIRECTIONS.DOWN;
    this.frame = 0;
    this.frameTime = 0;
    this.animationSpeed = 0.14; // segundos por frame

    /* ---------- Movimiento ---------- */
    this.vx = 0;
    this.vy = 0;
    this.isMoving = false;

    /* ---------- Recolección (§6, §7) ---------- */
    this.isHarvesting = false;
    this.harvestTimer = 0;
    this.harvestSide = null;
    this.harvestCooldown = 0;
    this.harvestTargetFruit = null;
    /** Callback opcional que el HarvestSystem conecta. */
    this.onHarvestComplete = null;

    /* ---------- Estados temporales (error, cansado, victoria) ---------- */
    this.temporaryState = null;
    this.temporaryTimer = 0;

    /* ---------- Estadísticas para el HUD */ 
    this.harvestCount = 0;
    this.errorFlash = 0;
  }

  /** Rectángulo de colisión (AABB) derivado del centro. */
  get rect() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      w: this.width,
      h: this.height,
    };
  }

  /** Rectángulo de los pies: se usa para colisiones más naturales. */
  get feetRect() {
    const w = this.width * 0.8;
    const h = this.height * 0.55;
    return {
      x: this.x - w / 2,
      y: this.y + this.height / 2 - h,
      w,
      h,
    };
  }

  /** Posición para el render (el sprite se dibuja con origen arriba-izq). */
  get renderX() {
    return this.x - this.width / 2;
  }

  get renderY() {
    return this.y - this.height / 2;
  }

  /**
   * Aplica una intención de movimiento en ejes (valores -1, 0, 1).
   * El CollisionSystem resolverá el desplazamiento real.
   */
  setMoveIntent(axisX, axisY) {
    // Normaliza la diagonal para que no sea más rápida.
    const len = Math.hypot(axisX, axisY);
    if (len > 0) {
      this.vx = (axisX / len) * this.speed;
      this.vy = (axisY / len) * this.speed;
      this.isMoving = true;
    } else {
      this.vx = 0;
      this.vy = 0;
      this.isMoving = false;
    }
  }

  /** Actualiza la orientación según el movimiento. */
  updateFacing(axisX, axisY) {
    if (axisX === 0 && axisY === 0) return;

    // En vista top-down se prioriza el eje horizontal para que las
    // animaciones laterales se vean al desplazarse en diagonal.
    if (Math.abs(axisX) >= Math.abs(axisY)) {
      this.facing = axisX > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
    } else {
      this.facing = axisY > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP;
    }
  }

  /** Inicia la animación de recolección hacia un lado (§7). */
  startHarvest(side, fruit = null) {
    if (this.isHarvesting || this.harvestCooldown > 0) return false;

    this.isHarvesting = true;
    this.harvestTimer = 0;
    this.harvestSide = side;
    this.harvestTargetFruit = fruit;
    this.state = side === HARVEST_SIDES.LEFT
      ? PLAYER_STATES.HARVEST_LEFT
      : PLAYER_STATES.HARVEST_RIGHT;
    this.facing = side === HARVEST_SIDES.LEFT ? DIRECTIONS.LEFT : DIRECTIONS.RIGHT;
    this.frame = 0;
    this.frameTime = 0;
    return true;
  }

  /** Muestra el estado de error (§12). */
  showError(duration = 0.6) {
    this.temporaryState = PLAYER_STATES.ERROR;
    this.temporaryTimer = duration;
    this.errorFlash = duration;
    this.state = PLAYER_STATES.ERROR;
    this.frame = 0;
  }

  /** El jugador se queda cansado (placeholder para fases futuras). */
  showTired(duration = 1.2) {
    this.temporaryState = PLAYER_STATES.TIRED;
    this.temporaryTimer = duration;
    this.state = PLAYER_STATES.TIRED;
    this.frame = 0;
  }

  showVictory() {
    this.temporaryState = PLAYER_STATES.VICTORY;
    this.temporaryTimer = Infinity;
    this.state = PLAYER_STATES.VICTORY;
    this.frame = 0;
    this.isMoving = false;
    this.vx = 0;
    this.vy = 0;
  }

  showDefeat() {
    this.temporaryState = PLAYER_STATES.DEFEAT;
    this.temporaryTimer = Infinity;
    this.state = PLAYER_STATES.DEFEAT;
    this.frame = 0;
    this.isMoving = false;
    this.vx = 0;
    this.vy = 0;
  }

  /**
   * Actualiza el estado interno del jugador.
   * El movimiento real ya lo aplicó el motor con CollisionSystem.
   * @param {number} dt segundos
   */
  update(dt) {
    // Temporizadores
    if (this.harvestCooldown > 0) this.harvestCooldown -= dt;
    if (this.errorFlash > 0) this.errorFlash -= dt;

    // Estado temporal (error, cansado)
    if (this.temporaryState && this.temporaryTimer !== Infinity) {
      this.temporaryTimer -= dt;
      if (this.temporaryTimer <= 0) {
        this.temporaryState = null;
        this.state = PLAYER_STATES.IDLE;
      }
    }

    // Animación de recolección
    if (this.isHarvesting) {
      this.harvestTimer += dt;
      if (this.harvestTimer >= GAME_CONFIG.harvestDuration) {
        this.isHarvesting = false;
        this.harvestSide = null;
        this.harvestCooldown = GAME_CONFIG.harvestCooldown;
        this.frame = 0;
        this.state = PLAYER_STATES.IDLE;

        if (typeof this.onHarvestComplete === 'function') {
          const fruit = this.harvestTargetFruit;
          this.harvestTargetFruit = null;
          this.onHarvestComplete(fruit, this);
        }
      } else {
        // Progreso 0..1 de la animación de recoger
        this.animationProgress = clamp(
          this.harvestTimer / GAME_CONFIG.harvestDuration,
          0,
          1
        );
      }
      return; // mientras cosecha no se anima el caminado
    }

    // Estado según movimiento
    if (this.temporaryState) {
      this.state = this.temporaryState;
    } else if (this.isMoving) {
      this.state = WALK_STATE_BY_FACING[this.facing] ?? PLAYER_STATES.WALK_DOWN;
    } else {
      this.state = PLAYER_STATES.IDLE;
    }

    // Avance de frames
    this.frameTime += dt;
    if (this.frameTime >= this.animationSpeed) {
      this.frameTime = 0;
      const frameCount = this.getFrameCount();
      this.frame = (this.frame + 1) % Math.max(1, frameCount);
    }
  }

  /** Nº de frames del estado actual (idle usa 4 con respiración sutil). */
  getFrameCount() {
    switch (this.state) {
      case PLAYER_STATES.IDLE:
      case PLAYER_STATES.TIRED:
      case PLAYER_STATES.ERROR:
        return 4;
      case PLAYER_STATES.HARVEST_LEFT:
      case PLAYER_STATES.HARVEST_RIGHT:
      case PLAYER_STATES.VICTORY:
      case PLAYER_STATES.DEFEAT:
        return 6;
      default:
        return 4;
    }
  }

  /** Clave del sprite en el manifiesto de assets. */
  get spriteKey() {
    return `player.${this.state}`;
  }

  /**
   * Progreso de la animación de recogida, para que el render coloque
   * el brazo. 0-1.
   */
  get harvestProgress() {
    if (!this.isHarvesting) return 0;
    return clamp(this.harvestTimer / GAME_CONFIG.harvestDuration, 0, 1);
  }

  /**
   * Coloca al jugador en una posición concreta (al regenerar o
   * reanudar el nivel).
   */
  placeAt(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.isMoving = false;
    this.isHarvesting = false;
    this.harvestTimer = 0;
    this.harvestSide = null;
    this.temporaryState = null;
    this.temporaryTimer = 0;
    this.state = PLAYER_STATES.IDLE;
    this.frame = 0;
  }

  reset(x, y) {
    this.placeAt(x, y);
    this.harvestCount = 0;
    this.harvestCooldown = 0;
    this.errorFlash = 0;
    this.harvestTargetFruit = null;
  }
}

/** Mapa orientación → estado de caminado. */
const WALK_STATE_BY_FACING = {
  [DIRECTIONS.UP]: PLAYER_STATES.WALK_UP,
  [DIRECTIONS.DOWN]: PLAYER_STATES.WALK_DOWN,
  [DIRECTIONS.LEFT]: PLAYER_STATES.WALK_LEFT,
  [DIRECTIONS.RIGHT]: PLAYER_STATES.WALK_RIGHT,
};

export default Player;
