/**
 * HarvestSystem.js
 * ---------------------------------------------------------------
 * Sistema de recolección (§6, §7, §12).
 *
 * Reglas:
 *   - El jugador recoge hacia IZQUIERDA o hacia DERECHA.
 *   - Solo son recogibles los frutos MADUROS (§10, §16).
 *   - Recoger un PINTÓN genera error, resta calidad y puntos.
 *   - No hay que apuntar a un píxel exacto: basta con estar lo
 *     suficientemente cerca (§7).
 *
 * El sistema NO dibuja ni anima: decide y reporta. El motor aplica
 * las consecuencias (puntos, calidad, efectos, sonidos).
 */

import { FRUIT_TYPES, FRUIT_SIZE, HARVEST_SIDES } from '../config/constants.js';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { distance } from '../../utils/math.js';

/** Resultado posible de un intento de recolección. */
export const HARVEST_RESULT = Object.freeze({
  NONE: 'none',             // no hay nada que recoger
  RIPE: 'ripe',             // recogió un maduro
  UNRIPE: 'unripe',         // recogió un pintón → error
  COOLDOWN: 'cooldown',     // todavía animando
  NOTHING_ON_SIDE: 'nothingOnSide', // hay frutos pero no en ese lado
});

export class HarvestSystem {
  /**
   * @param {object} deps
   * @param {import('../map/Map.js').Map} deps.map
   */
  constructor({ map }) {
    this.map = map;
    this.reach = GAME_CONFIG.harvestReach;
  }

  /** Cambia el mapa al cargar un nivel. */
  setMap(map) {
    this.map = map;
  }

  /**
   * Busca el fruto más cercano que el jugador podría alcanzar hacia
   * un lado (§7: no se apunta a un píxel, basta con estar cerca).
   *
   * @param {import('../entities/Player.js').Player} player
   * @param {'left'|'right'} side
   * @returns {{ plant, fruit, position } | null}
   */
  findTarget(player, side) {
    if (!this.map) return null;

    const plants = this.map.plantsNear(player.feetRect);
    let best = null;
    let bestDistance = Infinity;

    for (let i = 0; i < plants.length; i += 1) {
      const plant = plants[i];
      if (!plant.hasFruits) continue;

      // El lado de la planta debe coincidir con la dirección pedida.
      const candidates = plant.fruitsOnSide(side);
      if (candidates.length === 0) continue;

      // El jugador debe estar a ese lado de la planta (§7).
      const isPlayerOnSide =
        side === HARVEST_SIDES.LEFT
          ? player.x <= plant.centerX + 6
          : player.x >= plant.centerX - 6;
      if (!isPlayerOnSide) continue;

      for (let f = 0; f < candidates.length; f += 1) {
        const fruit = candidates[f];
        const pos = plant.fruitPosition(fruit);
        const d = distance(player.x, player.y, pos.x, pos.y);

        if (d <= this.reach && d < bestDistance) {
          bestDistance = d;
          best = { plant, fruit, position: pos, distance: d };
        }
      }
    }

    return best;
  }

  /**
   * Busca el fruto que hay BAJO un punto del mundo (click/toque directo).
   *
   * Es la vía principal de recolección (§5): en PC se hace click sobre
   * el arándano y en móvil se toca encima. Cada fruto es una unidad
   * individual, así que cada uno requiere su propio toque (§6).
   *
   * A diferencia de `findTarget`, aquí NO se filtra por lado: el
   * jugador señala el fruto concreto que quiere. Sí se exige que esté
   * dentro del alcance, para que no se pueda cosechar a distancia.
   *
   * @param {import('../entities/Player.js').Player} player
   * @param {number} worldX x del punto pulsado, en coordenadas del mundo
   * @param {number} worldY y del punto pulsado
   * @param {number} radius radio de acierto en px (dedo en móvil)
   * @returns {object|null} { plant, fruit, position, distance }
   */
  findFruitAt(player, worldX, worldY, radius = 0) {
    const plants = this.map.plants;
    let best = null;
    let bestDistance = Infinity;

    for (let i = 0; i < plants.length; i += 1) {
      const plant = plants[i];
      if (!plant.hasFruits) continue;

      for (let f = 0; f < plant.fruits.length; f += 1) {
        const fruit = plant.fruits[f];
        if (fruit.collected) continue;

        const pos = plant.fruitPosition(fruit);

        // Distancia del punto pulsado al centro del fruto. El radio
        // perdona la imprecisión del dedo: el fruto mide pocos píxeles
        // y en un teléfono es difícil acertar al píxel.
        const hitDistance = distance(worldX, worldY, pos.x, pos.y);
        const hitRadius = FRUIT_SIZE / 2 + radius;
        if (hitDistance > hitRadius) continue;

        // Debe estar dentro del alcance del jugador (§6): no se puede
        // recolectar desde el otro extremo del campo.
        const reachDistance = distance(player.x, player.y, pos.x, pos.y);
        if (reachDistance > this.reach) continue;

        if (hitDistance < bestDistance) {
          bestDistance = hitDistance;
          best = { plant, fruit, position: pos, distance: reachDistance };
        }
      }
    }

    return best;
  }

  /**
   * Comprueba si hay ALGO recogible al lado indicado (para el
   * indicador visual de "RECOGE", §54).
   * @param {import('../entities/Player.js').Player} player
   * @param {'left'|'right'} side
   */
  hasTarget(player, side) {
    return this.findTarget(player, side) !== null;
  }

  /**
   * ¿Hay un pintón peligroso cerca de ese lado? Se usa para el aviso
   * "NO RECOGER PINTÓN" (§54).
   */
  hasUnripeThreat(player, side) {
    const target = this.findTarget(player, side);
    return target !== null && target.fruit.type === FRUIT_TYPES.UNRIPE;
  }

  /**
   * Ejecuta la recolección.
   *
   * @param {import('../entities/Player.js').Player} player
   * @param {'left'|'right'} side
   * @param {object} [explicitTarget] objetivo ya resuelto (click/toque
   *   directo sobre un fruto). Si se pasa, no se busca por lado.
   * @returns {object} { result, plant, fruit, position, def }
   */
  harvest(player, side, explicitTarget = null) {
    if (!player) return { result: HARVEST_RESULT.NONE };

    // ¿Está el jugador ocupado?
    if (player.isHarvesting || player.harvestCooldown > 0) {
      return { result: HARVEST_RESULT.COOLDOWN };
    }

    const target = explicitTarget ?? this.findTarget(player, side);
    if (!target) {
      // Hay frutos cerca pero no en ese lado: se avisa sin penalizar.
      return { result: HARVEST_RESULT.NONE, side };
    }

    const { plant, fruit, position } = target;

    // Con click directo el lado se deduce del fruto señalado, para que
    // la animación se reproduzca hacia donde está la mata.
    const harvestSide =
      explicitTarget && !side
        ? (player.x <= plant.centerX ? HARVEST_SIDES.LEFT : HARVEST_SIDES.RIGHT)
        : side;

    // El jugador siempre inicia la animación, aunque sea un error:
    // el gesto de "recoger un pintón" debe verse (§6).
    player.startHarvest(harvestSide, fruit);

    const isRipe = fruit.type === FRUIT_TYPES.RIPE;

    if (!isRipe) {
      // PINTÓN: se marca como recogido pero cuenta como error (§12).
      plant.collectFruit(fruit.id);
      return {
        result: HARVEST_RESULT.UNRIPE,
        plant,
        fruit,
        position,
        side: harvestSide,
      };
    }

    // MADURO: se retira de la planta (§6).
    plant.collectFruit(fruit.id);

    return {
      result: HARVEST_RESULT.RIPE,
      plant,
      fruit,
      position,
      side: harvestSide,
    };
  }

  /**
   * Detecta automáticamente el mejor lado para recoger cuando el
   * jugador pulsa la acción contextual (§25: E).
   * Prefiere el lado donde hay un fruto MADURO alcanzable.
   */
  findBestSide(player) {
    const left = this.findTarget(player, HARVEST_SIDES.LEFT);
    const right = this.findTarget(player, HARVEST_SIDES.RIGHT);

    const leftRipe = left && left.fruit.type === FRUIT_TYPES.RIPE ? left : null;
    const rightRipe = right && right.fruit.type === FRUIT_TYPES.RIPE ? right : null;

    if (leftRipe && rightRipe) {
      // El más cercano de los dos.
      return leftRipe.distance <= rightRipe.distance
        ? HARVEST_SIDES.LEFT
        : HARVEST_SIDES.RIGHT;
    }
    if (leftRipe) return HARVEST_SIDES.LEFT;
    if (rightRipe) return HARVEST_SIDES.RIGHT;

    // Solo hay pintones: se devuelve el lado con algo, para que el
    // jugador reciba feedback de que ahí no debe recoger.
    if (left && !right) return HARVEST_SIDES.LEFT;
    if (right && !left) return HARVEST_SIDES.RIGHT;

    // Nada: se usa la orientación actual del jugador.
    return player.facing === 'left' ? HARVEST_SIDES.LEFT : HARVEST_SIDES.RIGHT;
  }

  /** Estadísticas del campo, para el resumen y el supervisor. */
  getFieldStats() {
    if (!this.map) return { plants: 0, ripe: 0, unripe: 0, total: 0 };

    let ripe = 0;
    let unripe = 0;

    this.map.allPlants().forEach((plant) => {
      ripe += plant.ripeCount;
      unripe += plant.unripeCount;
    });

    return {
      plants: this.map.allPlants().length,
      ripe,
      unripe,
      total: ripe + unripe,
    };
  }
}

export default HarvestSystem;
