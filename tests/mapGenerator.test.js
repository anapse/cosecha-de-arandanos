/**
 * mapGenerator.test.js — Comprueba la generación procedural (§19, §29).
 * Verifica que el mapa respete la estructura de la especificación:
 * líneas de cultivo separadas por caminos, zona de entrega abajo y
 * plantas alcanzables desde ambos lados.
 */

import { describe, it, expect } from 'vitest';
import { MapGenerator } from '../src/game/map/MapGenerator.js';
import { TILE_TYPES } from '../src/game/config/constants.js';
import { getLevelConfig } from '../src/data/levels.js';
import {
  TILE_COLUMNS_FOR_VIEW,
  TILE_ROWS_FOR,
  FIELD_ROWS_FOR,
  VIEW_HEIGHT,
} from '../src/game/map/mapLayout.js';

const generator = new MapGenerator();

describe('MapGenerator', () => {
  it('genera el nivel 1 con las dimensiones esperadas', () => {
    const level = getLevelConfig(1);
    const world = generator.generateLevel(level, { seed: 12345 });

    expect(world.cols).toBe(TILE_COLUMNS_FOR_VIEW(level.rows));
    expect(world.tileMap.rows).toBe(TILE_ROWS_FOR(level.plantsPerRow));
    // Cada línea tiene exactamente las plantas que define el nivel.
    expect(world.plants.length).toBe(level.rows * level.plantsPerRow);
  });

  it('el mapa CUBRE el viewport lógico de 360x640 (§7, §11)', () => {
    // Si el mundo fuese más pequeño que la vista, la cámara dejaría
    // franjas vacías y el juego no llenaría la pantalla del móvil.
    for (let id = 1; id <= 12; id += 1) {
      const world = generator.generateLevel(getLevelConfig(id), { seed: id });
      expect(world.tileMap.pixelWidth).toBeGreaterThanOrEqual(360);
      expect(world.tileMap.pixelHeight).toBeGreaterThanOrEqual(VIEW_HEIGHT);
    }
  });

  it('el alto del campo crece con las plantas por línea', () => {
    expect(FIELD_ROWS_FOR(12)).toBeGreaterThanOrEqual(FIELD_ROWS_FOR(6));
  });

  it('usa la misma semilla para el mismo mapa (repetibilidad)', () => {
    const level = getLevelConfig(1);
    const a = generator.generateLevel(level, { seed: 999 });
    const b = generator.generateLevel(level, { seed: 999 });

    expect(a.plants.length).toBe(b.plants.length);
    expect(a.seed).toBe(b.seed);

    const aFruits = a.plants.map((p) => p.fruits.length).join(',');
    const bFruits = b.plants.map((p) => p.fruits.length).join(',');
    expect(aFruits).toBe(bFruits);
  });

  it('con semillas distintas los mapas cambian', () => {
    const level = getLevelConfig(3);
    const a = generator.generateLevel(level, { seed: 1 });
    const b = generator.generateLevel(level, { seed: 2 });

    const aFruits = a.plants.map((p) => p.fruits.length).join(',');
    const bFruits = b.plants.map((p) => p.fruits.length).join(',');
    expect(aFruits).not.toBe(bFruits);
  });

  it('las líneas de cultivo son bloquecantes y los caminos transitables', () => {
    const world = generator.generateLevel(getLevelConfig(1), { seed: 42 });

    // Busca una columna de planta y una de camino en la zona del campo.
    const fieldRow = 4;

    const plantCols = [];
    const pathCols = [];
    for (let col = 0; col < world.cols; col += 1) {
      const type = world.tileMap.get(col, fieldRow);
      if (type === TILE_TYPES.PLANT_ROW) plantCols.push(col);
      if (type === TILE_TYPES.PATH) pathCols.push(col);
    }

    expect(plantCols.length).toBeGreaterThan(0);
    expect(pathCols.length).toBeGreaterThan(0);

    plantCols.forEach((col) => {
      expect(world.tileMap.isBlockingAt(col, fieldRow)).toBe(true);
    });
    pathCols.forEach((col) => {
      expect(world.tileMap.isBlockingAt(col, fieldRow)).toBe(false);
    });
  });

  it('existe una zona de entrega en la parte inferior (§4)', () => {
    const world = generator.generateLevel(getLevelConfig(1), { seed: 7 });

    expect(world.deliveryZone).toBeDefined();
    expect(world.deliveryZone.y).toBeGreaterThan(world.tileMap.pixelHeight * 0.6);
    expect(world.deliveryZone.h).toBeGreaterThan(0);
  });

  it('la canasta y el punto de aparición están dentro del mapa', () => {
    const world = generator.generateLevel(getLevelConfig(2), { seed: 3 });

    expect(world.basketSpot.x).toBeGreaterThan(0);
    expect(world.basketSpot.x).toBeLessThan(world.tileMap.pixelWidth);
    expect(world.basketSpot.y).toBeLessThan(world.tileMap.pixelHeight);

    expect(world.spawn.x).toBeGreaterThan(0);
    expect(world.spawn.y).toBeGreaterThan(0);
    expect(world.spawn.y).toBeLessThan(world.tileMap.pixelHeight);
  });

  it('genera frutos maduros y algunos pintones en el nivel 1', () => {
    const world = generator.generateLevel(getLevelConfig(1), { seed: 2024 });

    let ripe = 0;
    let unripe = 0;
    world.plants.forEach((plant) => {
      plant.fruits.forEach((fruit) => {
        if (fruit.type === 'RIPE') ripe += 1;
        else unripe += 1;
      });
    });

    expect(ripe).toBeGreaterThan(0);
    // El nivel 1 tiene pocos pintones pero no cero.
    expect(unripe).toBeGreaterThan(0);
    expect(ripe).toBeGreaterThan(unripe);
  });

  it('los frutos se reparten a ambos lados de la planta (§7)', () => {
    const world = generator.generateLevel(getLevelConfig(1), { seed: 555 });

    let left = 0;
    let right = 0;
    world.plants.forEach((plant) => {
      plant.fruits.forEach((fruit) => {
        if (fruit.side === 'left') left += 1;
        else right += 1;
      });
    });

    expect(left).toBeGreaterThan(0);
    expect(right).toBeGreaterThan(0);
  });

  it('el nivel 12 genera más plantas y más ancho que el nivel 1 (§27)', () => {
    const world1 = generator.generateLevel(getLevelConfig(1), { seed: 1 });
    const world12 = generator.generateLevel(getLevelConfig(12), { seed: 1 });

    expect(world12.plants.length).toBeGreaterThan(world1.plants.length);
    // Nivel 12 tiene más líneas de cultivo → más ancho de campo.
    expect(world12.tileMap.pixelWidth).toBeGreaterThan(world1.tileMap.pixelWidth);
    // Ambas parcelas cubren la pantalla, pero la del 12 está más
    // densamente plantada (misma altura, más plantas por fila).
    expect(world12.plantsPerRow).toBeGreaterThan(world1.plantsPerRow);
  });
});
