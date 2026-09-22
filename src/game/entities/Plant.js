/**
 * Plant.js
 * ---------------------------------------------------------------
 * Planta de arándano (§15, §9).
 *
 * Soporta los 8 estados de la especificación:
 *   empty, few, medium, abundant, ripe, unripe, mixed, harvested
 *
 * La planta es reutilizable: contiene sus frutos y sabe en qué
 * variante visual está, pero no se dibuja a sí misma (eso es del
 * SpriteRenderer).
 */

import { PLANT_STATES, TILE_SIZE } from '../config/constants.js';
import { resolvePlantState, getPlantDef } from '../../data/plants.js';

export class Plant {
  /**
   * @param {object} def definición generada por MapGenerator
   */
  constructor(def) {
    this.id = def.id;
    this.col = def.col;
    this.row = def.row;

    // Posición en px lógicos (esquina superior izquierda del tile)
    this.x = def.x;
    this.y = def.y;
    this.width = TILE_SIZE;
    this.height = Math.round(TILE_SIZE * 1.1);

    /** @type {Array<{type:string,collected:boolean}>} */
    this.fruits = def.fruits ?? [];

    this.harvested = def.harvested ?? false;
    this.visualVariant = def.visualVariant ?? 0;

    // Pequeña variación de escala para dar naturalidad, sin afectar
    // al tamaño lógico ni a las colisiones.
    this.visualScale = 0.94 + (this.visualVariant % 3) * 0.03;

    this.state = resolvePlantState({
      totalFruits: this.remainingFruits,
      ripeCount: this.ripeCount,
      unripeCount: this.unripeCount,
      harvested: this.harvested,
    });
  }

  /** Rectángulo de la planta (bloquea el paso, §39). */
  get rect() {
    return { x: this.x, y: this.y + TILE_SIZE * 0.2, w: this.width, h: this.height * 0.8 };
  }

  /** Centro de la planta en px lógicos (para ordenar por profundidad). */
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
    return this.fruits.filter((f) => !f.collected && f.type === 'RIPE');
  }

  get unripeFruits() {
    return this.fruits.filter((f) => !f.collected && f.type === 'UNRIPE');
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

  /** ¿Solo tiene pintones? (feedback de "NO RECOGER") */
  get isOnlyUnripe() {
    return this.ripeCount === 0 && this.unripeCount > 0;
  }

  /**
   * Frutos accesibles desde un lado concreto ('left' | 'right').
   * El jugador recoge desde el camino contiguo (§7).
   */
  fruitsOnSide(side) {
    return this.fruits.filter((f) => !f.collected && f.side === side);
  }

  /**
   * Marca un fruto como recogido y recalcula el estado visual.
   * @param {string} fruitId
   * @returns {object|null} el fruto recogido, o null si no existía
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

  /** Recalcula la variante visual según los frutos que quedan (§9). */
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

  /** Posición de un fruto dentro de la planta, en px lógicos. */
  fruitPosition(fruit) {
    const def = this.definition;
    const sideOffset = fruit.side === 'left' ? 0.22 : 0.78;
    const x = this.x + this.width * sideOffset + (fruit.jitter ?? 0);
    // slot 0 = arriba de la planta, 1 = abajo
    const y = this.y + 8 + (fruit.slot ?? 0.5) * (this.height - 16);
    return { x, y, size: 9, density: def.foliage };
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
