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
    // Tamaño lógico: EXACTAMENTE el del tile y del sprite (32x32).
    // Debe coincidir con el PNG para no deformar el pixel art (§18).
    this.height = TILE_SIZE;

    /** @type {Array<{type:string,collected:boolean}>} */
    this.fruits = def.fruits ?? [];

    this.harvested = def.harvested ?? false;
    this.visualVariant = def.visualVariant ?? 0;

    /**
     * Variación visual. NO se usa para escalar el sprite (eso
     * deformaría el pixel art): sirve para elegir variante de dibujo
     * y para pequeños desplazamientos decorativos.
     */
    this.visualScale = 1;

    this.state = resolvePlantState({
      totalFruits: this.remainingFruits,
      ripeCount: this.ripeCount,
      unripeCount: this.unripeCount,
      harvested: this.harvested,
    });
  }

  /**
   * Actualiza la maduración progresiva de los arándanos verdes/pintones (§10).
   * Los verdes van madurando con el tiempo mientras el jugador cosecha.
   * @param {number} dt
   * @returns {Array<object>} lista de frutos que acaban de madurar a azul
   */
  update(dt) {
    if (this.harvested || !this.hasFruits) return [];
    const newlyRipened = [];

    for (let i = 0; i < this.fruits.length; i += 1) {
      const fruit = this.fruits[i];
      if (fruit.collected) continue;

      if (fruit.type === 'UNRIPE') {
        if (fruit.ripenTimer === undefined) {
          // Temporizador aleatorio de maduración entre 8 y 18 segundos
          fruit.ripenTimer = 8 + (Math.abs(Math.sin((fruit.slot ?? 0.5) * 100)) * 10);
        }

        fruit.ripenTimer -= dt;
        if (fruit.ripenTimer <= 0) {
          fruit.type = 'RIPE';
          fruit.justRipened = true;
          newlyRipened.push(fruit);
        }
      }
    }

    if (newlyRipened.length > 0) {
      this.refreshState();
    }

    return newlyRipened;
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

  /**
   * Posición de un fruto dentro de la planta, en px lógicos.
   *
   * El generador asigna a cada fruto:
   *   - `side` → 'left' | 'right', en qué mitad de la mata cuelga
   *   - `slot` → 0..1, altura relativa dentro de la planta
   *
   * El arte (tools/artPlants.js) pinta los frutos en posiciones que
   * respetan ese mismo reparto: izquierda/derecha y de arriba abajo.
   * Así el fruto lógico cae sobre el fruto pintado.
   */
  fruitPosition(fruit) {
    const def = this.definition;

    // Mitad correspondiente (un poco hacia el centro para que quede
    // dentro del follaje, no en el borde del tile).
    const sideOffset = fruit.side === 'left' ? 0.3 : 0.7;
    const x = this.x + this.width * sideOffset + (fruit.jitter ?? 0);

    // Altura: `slot` va de 0 (arriba) a 1 (abajo). Se deja margen
    // arriba y abajo para que el fruto no se salga de la mata.
    const slot = typeof fruit.slot === 'number' ? fruit.slot : 0.5;
    const y = this.y + 9 + slot * (this.height - 18);

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
