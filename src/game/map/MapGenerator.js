/**
 * MapGenerator.js
 * ---------------------------------------------------------------
 * Generación procedural del mapa (§19, §29).
 *
 * NO se crean 12 mapas a mano: generateLevel(levelConfig) construye
 * la parcela a partir de parámetros.
 *
 * Layout (especificación §4, §37):
 *
 *   ┌──────────────────────────────┐
 *   │  césped / borde / cerca       │  fila 0-1
 *   ├──────────────────────────────┤
 *   │  PLANT | CAMINO | PLANT | ... │  filas de cultivo
 *   │  PLANT | CAMINO | PLANT | ... │
 *   ├──────────────────────────────┤
 *   │  zona de entrega (grava)      │  filas finales
 *   └──────────────────────────────┘
 *
 * El jugador camina SOLO por los caminos.
 */

import { TILE_SIZE, TILE_TYPES, FRUIT_TYPES } from '../config/constants.js';
import {
  TILE_COLUMNS_FOR_VIEW,
  TILE_ROWS_FOR,
  GRASS_ROWS,
  TOP_CORRIDOR_ROWS,
  CROP_ROWS,
  CORRIDOR_ROWS,
  DELIVERY_ROWS,
  FIELD_ROWS_FOR,
} from './mapLayout.js';
import { TileMap } from './TileMap.js';
import { CollisionMap } from './CollisionMap.js';
import { randInt, weightedPick, createRng } from '../../utils/math.js';
import { FRUITS_PER_PLANT_WEIGHTS, UNRIPE_VARIANTS } from '../../data/fruits.js';

/**
 * Estructura de una parcela generada.
 * @typedef {object} GeneratedLevel
 * @property {TileMap} tileMap
 * @property {CollisionMap} collisionMap
 * @property {Array} plants        definiciones de plantas (Plant se instancia en systems)
 * @property {object} deliveryZone rectángulo en px lógicos
 * @property {object} basketSpot   posición de la canasta
 * @property {object} spawn        posición inicial del jugador
 * @property {object} supervisorSpawn
 * @property {Array}  crateSpots
 * @property {object} bounds       límites transitables del mapa
 * @property {number} seed
 */

export class MapGenerator {
  /**
   * @param {object} levelConfig de src/data/levels.js
   * @param {object} [options] { seed }
   * @returns {GeneratedLevel}
   */
  generateLevel(levelConfig, options = {}) {
    const seed = options.seed ?? Math.floor(Math.random() * 1e9);
    const rng = createRng(seed);

    const rows = levelConfig.rows ?? 4;
    const plantsPerRow = levelConfig.plantsPerRow ?? 5;

    // Dimensiones del mapa en tiles: 9 columnas x 16 filas (432x768)
    const cols = TILE_COLUMNS_FOR_VIEW(rows);
    const totalRows = TILE_ROWS_FOR(plantsPerRow);

    const tileMap = new TileMap(cols, totalRows, TILE_SIZE);

    // ---------- Reparto vertical ----------
    const sceneryRows = GRASS_ROWS; // 3 filas de paisaje (cielo, montañas nevadas, árboles, cerca)
    const topCorridorRow = sceneryRows; // fila 3: pasillo horizontal superior
    const fieldStartRow = topCorridorRow + 1; // fila 4: inicio de cultivo
    const fieldEndRow = fieldStartRow + CROP_ROWS - 1; // fila 9: fin de cultivo (hileras más cortas)
    const bottomCorridorRow = fieldEndRow + 1; // fila 10: pasillo horizontal inferior
    const deliveryStartRow = bottomCorridorRow + 1; // fila 11: inicio zona de entrega amplia

    // ---------- Base: tierra ----------
    tileMap.fill(0, 0, cols - 1, totalRows - 1, TILE_TYPES.SOIL);

    // ---------- Paisaje superior ----------
    tileMap.fill(0, 0, cols - 1, sceneryRows - 1, TILE_TYPES.GRASS);

    // Cerca bloqueante en la franja de paisaje
    tileMap.fillRow(0, TILE_TYPES.FENCE, 0, cols - 1);
    tileMap.fillRow(1, TILE_TYPES.FENCE, 0, cols - 1);
    tileMap.fillRow(2, TILE_TYPES.FENCE, 0, cols - 1);

    // ---------- Columnas: plantas y caminos ----------
    // Layout: [pasillo][PLANTA][CAMINO][PLANTA][CAMINO][PLANTA][CAMINO][PLANTA][pasillo]
    const plantColumns = [];
    const pathColumns = [];

    for (let col = 1; col < cols - 1; col += 1) {
      if (col % 2 === 1) plantColumns.push(col);
      else pathColumns.push(col);
    }

    // Columnas de cultivo (filas 4 a 9)
    plantColumns.forEach((col) => {
      tileMap.fillCol(col, TILE_TYPES.PLANT_ROW, fieldStartRow, fieldEndRow);
    });

    // Caminos verticales (filas 3 a 10)
    pathColumns.forEach((col) => {
      tileMap.fillCol(col, TILE_TYPES.PATH, topCorridorRow, bottomCorridorRow);
    });

    // Pasillos exteriores transitables izquierda y derecha
    const leftPathCol = 0;
    const rightPathCol = cols - 1;
    tileMap.fillCol(leftPathCol, TILE_TYPES.PATH, topCorridorRow, bottomCorridorRow);
    tileMap.fillCol(rightPathCol, TILE_TYPES.PATH, topCorridorRow, bottomCorridorRow);

    // Pasillos horizontales superior e inferior
    tileMap.fillRow(topCorridorRow, TILE_TYPES.PATH_H, leftPathCol, rightPathCol);
    tileMap.fillRow(bottomCorridorRow, TILE_TYPES.PATH_H, leftPathCol, rightPathCol);

    // Intersecciones
    pathColumns.forEach((col) => {
      tileMap.set(col, topCorridorRow, TILE_TYPES.CROSS);
      tileMap.set(col, bottomCorridorRow, TILE_TYPES.CROSS);
    });

    // Zona de entrega amplia (filas 11 a 15)
    tileMap.fill(0, deliveryStartRow, cols - 1, totalRows - 1, TILE_TYPES.DELIVERY);

    // ---------- Generación de plantas y frutos ----------
    const plants = [];
    const {
      ripeChance = 0.8,
      unripeChance = 0.1,
      fruitChance = 0.9,
      maxFruitsPerPlant = 4,
      basketCapacity = 30,
    } = levelConfig;

    plantColumns.forEach((col) => {
      // HILERA DE ARBUSTOS BIEN ESPACIADOS:
      // Arbustos anchos y frondosos con paso vertical cómodo (38px)
      // para que NO se sobrepongan ni se amontonen verticalmente.
      const startY = fieldStartRow * TILE_SIZE + 8;
      const endY = (fieldEndRow + 1) * TILE_SIZE - 24;
      const stepY = 38; // Espaciado vertical natural sin amontonamiento
      const bushCount = Math.floor((endY - startY) / stepY);

      for (let i = 0; i <= bushCount; i += 1) {
        const posY = startY + i * stepY;
        const approxRow = Math.round(posY / TILE_SIZE);
        const hasFruit = rng() < Math.min(0.96, fruitChance + 0.15);
        const fruits = [];

        if (hasFruit) {
          const count = weightedPick(
            FRUITS_PER_PLANT_WEIGHTS.map((w) => ({ value: w.count, weight: w.weight })),
            rng
          );
          const capped = Math.max(1, Math.min(count, maxFruitsPerPlant));

          for (let f = 0; f < capped; f += 1) {
            const isRipe = rng() < ripeChance;
            const isUnripe = !isRipe && rng() < unripeChance + 0.22;
            const type = isRipe ? FRUIT_TYPES.RIPE : FRUIT_TYPES.UNRIPE;
            const side = rng() < 0.5 ? 'left' : 'right';
            const slot = capped === 1 ? 0.5 : f / (capped - 1 || 1);

            fruits.push({
              id: `${col}-${i}-${f}`,
              type,
              side,
              slot,
              jitter: (rng() - 0.5) * 5,
              variant:
                type === FRUIT_TYPES.UNRIPE
                  ? randInt(0, UNRIPE_VARIANTS.length - 1, rng)
                  : 0,
              collected: false,
            });
          }
        }

        plants.push({
          id: `p-${col}-${i}`,
          col,
          row: approxRow,
          x: col * TILE_SIZE,
          y: posY,
          width: TILE_SIZE,
          height: 36,
          fruits,
          harvested: false,
          visualVariant: 0, // Solo follaje verde saludable y frondoso
        });
      }
    });

    // ---------- Zona de entrega y puntos de interés ----------
    const deliveryZone = {
      x: 0,
      y: bottomCorridorRow * TILE_SIZE,
      w: cols * TILE_SIZE,
      h: (totalRows - bottomCorridorRow) * TILE_SIZE,
    };

    // Canasta en el centro exacto (columna 4)
    const basketCol = 4;

    const basketSpot = {
      x: basketCol * TILE_SIZE,
      y: (deliveryStartRow + 0.8) * TILE_SIZE,
      w: TILE_SIZE,
      h: TILE_SIZE,
    };

    // El jugador aparece en el pasillo inferior, sobre la columna central
    const spawn = {
      x: (basketCol + 0.5) * TILE_SIZE,
      y: (bottomCorridorRow + 0.5) * TILE_SIZE,
    };

    // Cajas apiladas a la izquierda en la zona de entrega
    const crateSpots = [];
    for (let i = 0; i < 3; i += 1) {
      crateSpots.push({
        x: (1.2 + i * 0.95) * TILE_SIZE,
        y: (deliveryStartRow + 0.8) * TILE_SIZE,
      });
    }

    // Supervisor a la derecha en la zona de entrega con amplio espacio
    const supervisorSpawn = {
      x: (cols - 2.2) * TILE_SIZE,
      y: (deliveryStartRow + 0.9) * TILE_SIZE,
    };

    // Límites transitables: desde el pasillo superior (fila 3) hasta el final (fila 15)
    const firstWalkableRow = topCorridorRow;
    const lastRow = totalRows - 1;

    const bounds = {
      x: 0,
      y: firstWalkableRow * TILE_SIZE,
      w: cols * TILE_SIZE,
      h: (lastRow - firstWalkableRow + 1) * TILE_SIZE,
    };

    const collisionMap = new CollisionMap(tileMap);

    return {
      tileMap,
      collisionMap,
      plants,
      deliveryZone,
      basketSpot,
      spawn,
      supervisorSpawn,
      crateSpots,
      bounds,
      seed,
      rows,
      cols,
      plantsPerRow,
      basketCapacity,
    };
  }
}

/**
 * Devuelve la columna de CAMINO más cercana a `preferred`.
 *
 * En el layout del campo las columnas impares son líneas de cultivo
 * (bloqueantes) y las pares son caminos. Colocar algo importante —como
 * la canasta o la aparición del jugador— en una columna de cultivo
 * dejaría al jugador atascado dentro de las plantas.
 *
 * @param {number} preferred columna deseada
 * @param {number} cols total de columnas
 * @returns {number} columna de camino más cercana
 */
function nearestPathColumn(preferred, cols) {
  const candidates = [];
  for (let c = 0; c < cols; c += 1) {
    // Columnas de camino: pares, o los pasillos laterales.
    if (c % 2 === 0 || c === cols - 1) candidates.push(c);
  }
  if (candidates.length === 0) return 0;

  return candidates.reduce((best, c) =>
    Math.abs(c - preferred) < Math.abs(best - preferred) ? c : best
  );
}

/**
 * Reparte `count` plantas de forma uniforme entre las filas
 * [startRow, endRow], ambas incluidas.
 *
 * Se usa para que una línea de cultivo tenga exactamente las plantas
 * que define el nivel, aunque el campo sea más alto que ese número:
 * las plantas quedan repartidas y el campo se ve lleno.
 *
 * @param {number} count nº de plantas de la línea
 * @param {number} startRow primera fila de cultivo
 * @param {number} endRow última fila de cultivo
 * @returns {number[]} filas donde va cada planta
 */
function distributeRows(count, startRow, endRow) {
  const available = endRow - startRow + 1;
  const total = Math.max(0, Math.floor(count));

  if (total === 0) return [];

  // Si hay sitio para todas, se reparten con separación uniforme.
  if (total <= available) {
    const step = available / total;
    const rows = [];
    for (let i = 0; i < total; i += 1) {
      rows.push(startRow + Math.floor(i * step + step / 2));
    }
    return rows;
  }

  // Más plantas que filas: se llenan todas las filas disponibles.
  const rows = [];
  for (let row = startRow; row <= endRow; row += 1) rows.push(row);
  return rows;
}

export { distributeRows };
export default MapGenerator;
