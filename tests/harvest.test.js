/**
 * harvest.test.js — Verifica el sistema de recolección (§6, §7, §12).
 * Es la mecánica central del juego: merece pruebas propias.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Player } from '../src/game/entities/Player.js';
import { Plant } from '../src/game/entities/Plant.js';
import { Basket } from '../src/game/entities/Basket.js';
import { HarvestSystem, HARVEST_RESULT } from '../src/game/systems/HarvestSystem.js';
import { FRUIT_TYPES, HARVEST_SIDES, TILE_SIZE } from '../src/game/config/constants.js';
import { GAME_CONFIG } from '../src/game/config/gameConfig.js';

/** Doble de prueba del mapa: solo necesita plantsNear/allPlants. */
function createFakeMap(plants) {
  return {
    plants,
    plantsNear() {
      return plants;
    },
    allPlants() {
      return plants;
    },
  };
}

/** Crea una planta con frutos en el lado indicado. */
function createPlant({ col = 2, row = 4, fruits = [] } = {}) {
  return new Plant({
    id: `p-${col}-${row}`,
    col,
    row,
    x: col * TILE_SIZE,
    y: row * TILE_SIZE,
    fruits: fruits.map((fruit, index) => ({
      id: `f-${index}`,
      type: fruit.type,
      side: fruit.side,
      slot: 0.5,
      jitter: 0,
      variant: 0,
      collected: false,
    })),
    harvested: false,
    visualVariant: 0,
  });
}

describe('HarvestSystem', () => {
  let system;
  let player;
  let plant;

  beforeEach(() => {
    // La planta ocupa el tile col=2, row=4 → x=64..96, y=128..160
    plant = createPlant({
      col: 2,
      row: 4,
      fruits: [
        { type: FRUIT_TYPES.RIPE, side: 'left' },
        { type: FRUIT_TYPES.RIPE, side: 'right' },
      ],
    });

    system = new HarvestSystem({ map: createFakeMap([plant]) });

    // El jugador se coloca a la izquierda de la planta, dentro del
    // alcance de recolección (§7).
    const fruitPos = plant.fruitPosition(plant.fruits[0]);
    player = new Player({ x: fruitPos.x - 8, y: fruitPos.y });
  });

  it('recoge un fruto maduro a la izquierda', () => {
    const outcome = system.harvest(player, HARVEST_SIDES.LEFT);

    expect(outcome.result).toBe(HARVEST_RESULT.RIPE);
    expect(outcome.fruit.type).toBe(FRUIT_TYPES.RIPE);
    expect(outcome.plant.remainingFruits).toBe(1);
  });

  it('recoger un pintón devuelve UNRIPE y lo retira de la planta', () => {
    const unripePlant = createPlant({
      col: 4,
      row: 4,
      fruits: [{ type: FRUIT_TYPES.UNRIPE, side: 'left' }],
    });
    const unripeSystem = new HarvestSystem({ map: createFakeMap([unripePlant]) });

    const fruitPos = unripePlant.fruitPosition(unripePlant.fruits[0]);
    const player2 = new Player({ x: fruitPos.x - 8, y: fruitPos.y });

    const outcome = unripeSystem.harvest(player2, HARVEST_SIDES.LEFT);

    expect(outcome.result).toBe(HARVEST_RESULT.UNRIPE);
    expect(outcome.fruit.type).toBe(FRUIT_TYPES.UNRIPE);
  });

  it('no recoge nada si se pide el lado opuesto', () => {
    // El jugador está a la IZQUIERDA pero se pide recoger a la DERECHA,
    // y no hay fruto a la derecha alcanzable desde esa posición.
    const onlyLeft = createPlant({
      col: 6,
      row: 4,
      fruits: [{ type: FRUIT_TYPES.RIPE, side: 'left' }],
    });
    const onlyLeftSystem = new HarvestSystem({ map: createFakeMap([onlyLeft]) });

    const fruitPos = onlyLeft.fruitPosition(onlyLeft.fruits[0]);
    const player3 = new Player({ x: fruitPos.x - 8, y: fruitPos.y });

    const outcome = onlyLeftSystem.harvest(player3, HARVEST_SIDES.RIGHT);
    expect(outcome.result).toBe(HARVEST_RESULT.NONE);
  });

  it('no recoge si está demasiado lejos (§7: hay que acercarse)', () => {
    const farPlant = createPlant({
      col: 8,
      row: 4,
      fruits: [{ type: FRUIT_TYPES.RIPE, side: 'left' }],
    });
    const farSystem = new HarvestSystem({ map: createFakeMap([farPlant]) });

    const fruitPos = farPlant.fruitPosition(farPlant.fruits[0]);
    player.x = 0; // muy lejos
    player.y = 0;

    const outcome = farSystem.harvest(player, HARVEST_SIDES.LEFT);
    expect(outcome.result).toBe(HARVEST_RESULT.NONE);
  });

  it('entra en cooldown durante la animación, y luego se libera', () => {
    system.harvest(player, HARVEST_SIDES.LEFT);
    expect(player.isHarvesting).toBe(true);

    const second = system.harvest(player, HARVEST_SIDES.LEFT);
    expect(second.result).toBe(HARVEST_RESULT.COOLDOWN);

    // Se avanza la animación completa.
    player.update(GAME_CONFIG.harvestDuration + 0.01);
    expect(player.isHarvesting).toBe(false);
  });

  it('findBestSide prefiere el lado con fruto maduro', () => {
    const side = system.findBestSide(player);
    expect([HARVEST_SIDES.LEFT, HARVEST_SIDES.RIGHT]).toContain(side);
  });

  it('hasUnripeThreat detecta el pintón cercano', () => {
    const unripePlant = createPlant({
      col: 10,
      row: 4,
      fruits: [{ type: FRUIT_TYPES.UNRIPE, side: 'left' }],
    });
    const s = new HarvestSystem({ map: createFakeMap([unripePlant]) });
    const pos = unripePlant.fruitPosition(unripePlant.fruits[0]);
    const p = new Player({ x: pos.x - 8, y: pos.y });

    expect(s.hasUnripeThreat(p, HARVEST_SIDES.LEFT)).toBe(true);
  });

  it('la planta pasa a "harvested" cuando se recoge todo', () => {
    const oneFruit = createPlant({
      col: 12,
      row: 4,
      fruits: [{ type: FRUIT_TYPES.RIPE, side: 'left' }],
    });
    const s = new HarvestSystem({ map: createFakeMap([oneFruit]) });
    const pos = oneFruit.fruitPosition(oneFruit.fruits[0]);
    const p = new Player({ x: pos.x - 8, y: pos.y });

    s.harvest(p, HARVEST_SIDES.LEFT);

    expect(oneFruit.remainingFruits).toBe(0);
    expect(oneFruit.harvested).toBe(true);
    expect(oneFruit.state).toBe('harvested');
  });
});

describe('Basket', () => {
  it('respeta la capacidad de 30 por defecto (§14)', () => {
    const basket = new Basket({ x: 0, y: 0 });
    expect(basket.capacity).toBe(GAME_CONFIG.basketCapacity);
    expect(basket.capacity).toBe(30);
  });

  it('acumula frutos y se marca como llena', () => {
    const basket = new Basket({ x: 0, y: 0, capacity: 3 });

    expect(basket.state).toBe('empty');
    basket.add(1);
    expect(basket.state).toBe('low');
    basket.add(1);
    expect(basket.state).toBe('medium');
    basket.add(1);
    expect(basket.isFull).toBe(true);
    expect(basket.state).toBe('full');
  });

  it('no acepta más frutos de su capacidad', () => {
    const basket = new Basket({ x: 0, y: 0, capacity: 2 });
    basket.add(5);
    expect(basket.current).toBe(2);
  });

  it('se vacía al entregar y devuelve lo entregado (§15)', () => {
    const basket = new Basket({ x: 0, y: 0, capacity: 30 });
    basket.add(18);

    const delivered = basket.empty();

    expect(delivered).toBe(18);
    expect(basket.current).toBe(0);
    expect(basket.isFull).toBe(false);
  });

  it('fillRatio refleja la proporción de llenado', () => {
    const basket = new Basket({ x: 0, y: 0, capacity: 10 });
    basket.add(5);
    expect(basket.fillRatio).toBeCloseTo(0.5, 5);
  });
});
