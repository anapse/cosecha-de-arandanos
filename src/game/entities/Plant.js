/**
 * Plant.js
 * ---------------------------------------------------------------
 * Planta de arándano (§15, §9).
 *
 * Maneja los frutos en sus hileras, maduración dinámica con el tiempo,
 * y rebrote progresivo de frutos verdes a medida que el jugador avanza
 * y acumula puntaje.
 */

import { PLANT_STATES, TILE_SIZE, FRUIT_TYPES } from '../config/constants.js';
import { resolvePlantState, getPlantDef } from '../../data/plants.js';

export class Plant {
  /**
   * @param {object} def definición generada por MapGenerator
   */
  constructor(def) {
    this.id = def.id;
    this.col = def.col;
    this.row = def.row;

    // Posición en px lógicos
    this.x = def.x;
    this.y = def.y;
    this.width = TILE_SIZE;
    this.height = TILE_SIZE;

    /** @type {Array<{id:string, type:string, side:string, slot:number, collected:boolean, ripenTimer?:number, jitter?:number, variant?:number}>} */
    this.fruits = def.fruits ? def.fruits.map((f) => ({ ...f })) : [];

    this.harvested = def.harvested ?? false;
    this.visualVariant = def.visualVariant ?? 0;
    this.visualScale = 1;

    // Temporizador para hacer brotar nuevos frutos de forma natural
    this.sproutTimer = 3 + Math.random() * 5;
    this.maxFruits = Math.max(3, def.fruits?.length ?? 3);

    this.state = resolvePlantState({
      totalFruits: this.remainingFruits,
      ripeCount: this.ripeCount,
      unripeCount: this.unripeCount,
      harvested: this.harvested,
    });
  }

  /**
   * Actualiza la maduración progresiva de los arándanos verdes/pintones
   * y hace brotar nuevos frutos según el puntaje acumulado.
   *
   * Entre más puntaje, más frutos verdes brotan y menos maduros,
   * obligando al jugador a esperar a que maduren al azar.
   *
   * @param {number} dt
   * @param {number} currentScore puntaje actual del jugador
   * @returns {Array<object>} lista de frutos que acaban de madurar a azul
   */
  update(dt, currentScore = 0) {
    const newlyRipened = [];

    // 1. Maduración en tiempo real de frutos verdes existentes
    for (let i = 0; i < this.fruits.length; i += 1) {
      const fruit = this.fruits[i];
      if (fruit.collected) continue;

      if (fruit.type === FRUIT_TYPES.UNRIPE) {
        if (fruit.ripenTimer === undefined || fruit.ripenTimer === null) {
          // Temporizador de maduración dinámico según puntaje
          const baseTime = 6 + Math.min(8, (currentScore / 250) * 3);
          fruit.ripenTimer = baseTime + Math.random() * 5;
        }

        fruit.ripenTimer -= dt;
        if (fruit.ripenTimer <= 0) {
          fruit.type = FRUIT_TYPES.RIPE;
          fruit.justRipened = true;
          fruit.ripenTimer = null;
          newlyRipened.push(fruit);
        }
      }
    }

    // 2. Regeneración progresiva de frutos al azar
    this.sproutTimer -= dt;
    if (this.sproutTimer <= 0) {
      this.sproutTimer = 3.5 + Math.random() * 4.5;

      const activeCount = this.remainingFruits;
      if (activeCount < this.maxFruits) {
        this.#sproutNewFruit(currentScore);
      }
    }

    if (newlyRipened.length > 0) {
      this.refreshState();
    }

    return newlyRipened;
  }

  /**
   * Genera un nuevo fruto en la planta.
   * La probabilidad de que sea verde (UNRIPE) aumenta considerablemente con el puntaje.
   */
  #sproutNewFruit(score) {
    // A mayor puntaje, los maduros se van acabando y salen casi exclusivamente verdes
    // Score 0 -> 70% maduros, 30% verdes
    // Score 200 -> 45% maduros, 55% verdes
    // Score 500 -> 25% maduros, 75% verdes
    // Score 800+ -> 10% maduros, 90% verdes
    const ripeChance = Math.max(0.08, 0.72 - (score / 600) * 0.60);
    const isRipe = Math.random() < ripeChance;
    const type = isRipe ? FRUIT_TYPES.RIPE : FRUIT_TYPES.UNRIPE;

    // Elegir lado y altura libre
    const existingSlots = this.fruits.filter((f) => !f.collected).map((f) => f.slot);
    let bestSlot = Math.random() * 0.8 + 0.1;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const candidate = Math.random() * 0.8 + 0.1;
      const tooClose = existingSlots.some((s) => Math.abs(s - candidate) < 0.22);
      if (!tooClose) {
        bestSlot = candidate;
        break;
      }
    }

    const side = Math.random() < 0.5 ? 'left' : 'right';
    const baseRipen = 6.5 + Math.min(10, (score / 200) * 3.5);
    const ripenTimer = isRipe ? null : baseRipen + Math.random() * 6;

    const newFruit = {
      id: `${this.id}-sprout-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      side,
      slot: bestSlot,
      jitter: (Math.random() - 0.5) * 6,
      variant: Math.floor(Math.random() * 2),
      ripenTimer,
      collected: false,
    };

    // Reutilizar hueco recogido o añadir nuevo
    const collectedIndex = this.fruits.findIndex((f) => f.collected);
    if (collectedIndex >= 0) {
      this.fruits[collectedIndex] = newFruit;
    } else {
      this.fruits.push(newFruit);
    }

    this.harvested = false;
    this.refreshState();
  }

  /** Rectángulo de la planta (bloquea el paso) */
  get rect() {
    return { x: this.x, y: this.y + TILE_SIZE * 0.15, w: this.width, h: this.height * 0.85 };
  }

  /** Centro de la planta en px lógicos */
  get centerX() {
    return this.x + this.width / 2;
  }

  get centerY() {
    return this.y + this.height / 2;
  }

  /* ---------- Consultas de frutos ---------- */

  get remainingFruits() {
    return this.fruits.filter((f) => !f.collected).length;
  }

  get ripeFruits() {
    return this.fruits.filter((f) => !f.collected && f.type === FRUIT_TYPES.RIPE);
  }

  get unripeFruits() {
    return this.fruits.filter((f) => !f.collected && f.type === FRUIT_TYPES.UNRIPE);
  }

  get ripeCount() {
    return this.ripeFruits.length;
  }

  get unripeCount() {
    return this.unripeFruits.length;
  }

  /** ¿Queda algo por recoger? */
  get hasFruits() {
    return this.remainingFruits > 0;
  }

  /** ¿Solo tiene pintones/inmaduros? */
  get isOnlyUnripe() {
    return this.ripeCount === 0 && this.unripeCount > 0;
  }

  /**
   * Frutos accesibles desde un lado concreto ('left' | 'right').
   */
  fruitsOnSide(side) {
    return this.fruits.filter((f) => !f.collected && f.side === side);
  }

  /**
   * Marca un fruto como recogido y recalcula el estado visual.
   */
  collectFruit(fruitId) {
    const fruit = this.fruits.find((f) => f.id === fruitId && !f.collected);
    if (!fruit) return null;

    fruit.collected = true;

    if (this.remainingFruits === 0) {
      this.harvested = true;
    }

    this.refreshState();
    return fruit;
  }

  /** Recalcula la variante visual según los frutos que quedan. */
  refreshState() {
    this.state = resolvePlantState({
      totalFruits: this.remainingFruits,
      ripeCount: this.ripeCount,
      unripeCount: this.unripeCount,
      harvested: this.harvested,
    });
    return this.state;
  }

  /** Definición de la variante visual actual. */
  get definition() {
    return getPlantDef(this.state);
  }

  /** Clave del sprite para el manifiesto de assets. */
  get spriteKey() {
    return `plant.${this.state}`;
  }

  /** ¿La planta está completamente vacía? */
  get isEmpty() {
    return this.remainingFruits === 0 && !this.harvested;
  }

  /**
   * Posición de un fruto dentro de la planta, en px lógicos.
   */
  fruitPosition(fruit) {
    const def = this.definition;

    // Distribuir a los lados del arbusto más ancho
    const sideOffset = fruit.side === 'left' ? 0.22 : 0.78;
    const x = this.x + this.width * sideOffset + (fruit.jitter ?? 0);

    // Altura dentro de la planta
    const slot = typeof fruit.slot === 'number' ? fruit.slot : 0.5;
    const y = this.y + 7 + slot * (this.height - 14);

    return { x, y, size: 10, density: def.foliage };
  }

  /** Resumen para depuración. */
  toJSON() {
    return {
      id: this.id,
      col: this.col,
      row: this.row,
      state: this.state,
      ripe: this.ripeCount,
      unripe: this.unripeCount,
      harvested: this.harvested,
    };
  }
}

export { PLANT_STATES };
export default Plant;
