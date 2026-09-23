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
import { TILE_COLUMNS_FOR_VIEW, TILE_ROWS_FOR, GRASS_ROWS, DELIVERY_ROWS, CORRIDOR_ROWS, FIELD_ROWS_FOR } from './mapLayout.js';
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

    const rows = levelConfig.rows ?? 6;
    const plantsPerRow = levelConfig.plantsPerRow ?? 7;

    // Dimensiones del mapa en tiles.
    const cols = TILE_COLUMNS_FOR_VIEW(rows);
    const totalRows = TILE_ROWS_FOR(plantsPerRow);

    const tileMap = new TileMap(cols, totalRows, TILE_SIZE);

    // ---------- Reparto vertical ----------
    const fieldRows = FIELD_ROWS_FOR(plantsPerRow);  // filas de cultivo
    const fieldStartRow = GRASS_ROWS;
    const fieldEndRow = fieldStartRow + fieldRows - 1;
    const bottomCorridorRow = fieldEndRow + 1;
    const deliveryStartRow = fieldEndRow + 1;

    // ---------- Base: tierra ----------
    tileMap.fill(0, 0, cols - 1, totalRows - 1, TILE_TYPES.SOIL);

    // ---------- Césped superior ----------
    tileMap.fill(0, 0, cols - 1, GRASS_ROWS - 1, TILE_TYPES.GRASS);

    // ---------- Columnas: plantas y caminos ----------
    // Layout: [césped][PLANTA][CAMINO][PLANTA][CAMINO]...[PLANTA][césped]
    const plantColumns = [];
    const pathColumns = [];

    for (let col = 1; col < cols - 1; col += 1) {
      if (col % 2 === 1) plantColumns.push(col);
      else pathColumns.push(col);
    }

    // Columnas de cultivo
    plantColumns.forEach((col) => {
      tileMap.fillCol(col, TILE_TYPES.PLANT_ROW, GRASS_ROWS, fieldEndRow);
    });

    // Caminos verticales (incluye el borde transitable a los lados)
    pathColumns.forEach((col) => {
      tileMap.fillCol(col, TILE_TYPES.PATH, GRASS_ROWS, fieldEndRow);
    });

    // Pasillo exterior transitable izquierda y derecha
    const leftPathCol = 0;
    const rightPathCol = cols - 1;
    tileMap.fillCol(leftPathCol, TILE_TYPES.PATH, GRASS_ROWS, fieldEndRow);
    tileMap.fillCol(rightPathCol, TILE_TYPES.PATH, GRASS_ROWS, fieldEndRow);

    // ---------- Pasillo horizontal superior e inferior del campo ----------
    // Permite cambiar de línea por arriba y por abajo.
    const topCorridorRow = GRASS_ROWS - 1;

    tileMap.fillRow(topCorridorRow, TILE_TYPES.PATH_H, leftPathCol, rightPathCol);
    tileMap.fillRow(bottomCorridorRow, TILE_TYPES.PATH_H, leftPathCol, rightPathCol);

    // Intersecciones donde el camino horizontal cruza un camino vertical
    pathColumns.forEach((col) => {
      tileMap.set(col, topCorridorRow, TILE_TYPES.CROSS);
      tileMap.set(col, bottomCorridorRow, TILE_TYPES.CROSS);
    });

    // ---------- Cerca perimetral (bloqueante, §39) ----------
    tileMap.fillRow(0, TILE_TYPES.FENCE, 0, cols - 1);
    tileMap.set(0, 0, TILE_TYPES.BORDER);
    tileMap.set(cols - 1, 0, TILE_TYPES.BORDER);

    // Cercas laterales en las filas altas (deja hueco para los pasillos)
    tileMap.set(0, 1, TILE_TYPES.FENCE);
    tileMap.set(cols - 1, 1, TILE_TYPES.FENCE);

    // ---------- Zona de entrega inferior ----------
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
      // HILERA CONTINUA (§3).
      //
      // Antes se repartían solo `plantsPerRow` plantas a lo largo de la
      // línea, dejando filas vacías: en pantalla se veía "planta, hueco,
      // planta, hueco" en vez de una línea de cultivo tupida.
      //
      // Ahora se coloca una planta en CADA fila del campo, así que la
      // hilera se ve continua de arriba abajo. La dificultad del nivel
      // NO depende del número de matas (el objetivo es `targetHarvest`,
      // una cantidad de frutos), así que llenar el campo no la altera.
      //
      // `plantsPerRow` se conserva como densidad: define cuántos de
      // esos huecos de cultivo llevan frutos.
      const plantRows = [];
      for (let row = fieldStartRow; row <= fieldEndRow; row += 1) {
        plantRows.push(row);
      }

      // Filas que llevan frutos: las que marca el nivel, repartidas
      // uniformemente para que la cosecha quede bien distribuida.
      const fruitRows = new Set(distributeRows(plantsPerRow, fieldStartRow, fieldEndRow));

      plantRows.forEach((row) => {
        // La planta vive en el tile; los frutos se colocan a sus lados
        // accesibles desde los caminos contiguos.
        const hasFruit = fruitRows.has(row) && rng() < fruitChance;
        const fruits = [];

        if (hasFruit) {
          const count = weightedPick(
            FRUITS_PER_PLANT_WEIGHTS.map((w) => ({ value: w.count, weight: w.weight })),
            rng
          );
          const capped = Math.min(count, maxFruitsPerPlant);

          for (let i = 0; i < capped; i += 1) {
            const isRipe = rng() < ripeChance;
            const isUnripe = !isRipe && rng() < unripeChance + 0.18;
            const type = isRipe ? FRUIT_TYPES.RIPE : FRUIT_TYPES.UNRIPE;

            // Lado de recolección: la planta es alcanzable desde el
            // camino de su izquierda y el de su derecha.
            const side = rng() < 0.5 ? 'left' : 'right';

            // Altura relativa dentro de la planta (0 = arriba).
            const slot = capped === 1 ? 0.5 : i / (capped - 1 || 1);

            fruits.push({
              id: `${col}-${row}-${i}`,
              type,
              side,
              slot,
              // Desplazamiento para que no queden todos alineados (§11)
              jitter: (rng() - 0.5) * 6,
              variant:
                type === FRUIT_TYPES.UNRIPE
                  ? randInt(0, UNRIPE_VARIANTS.length - 1, rng)
                  : 0,
              collected: false,
            });
          }
        }

        plants.push({
          id: `p-${col}-${row}`,
          col,
          row,
          x: col * TILE_SIZE,
          y: (row - 0.55) * TILE_SIZE, // se dibuja algo más alta que su tile
          fruits,
          harvested: false,
          // Variación visual para que el campo no sea monótono
          visualVariant: randInt(0, 3, rng),
        });
      });
    });

    // ---------- Zona de entrega y puntos de interés ----------
    //
    // La zona de entrega cubre TODO el fondo transitable del mapa: desde
    // el pasillo inferior hasta la última fila. Si terminara antes, el
    // jugador podría bajar más allá y perder el aviso de "ENTREGAR" (§15).
    const deliveryZone = {
      x: 0,
      y: bottomCorridorRow * TILE_SIZE,
      w: cols * TILE_SIZE,
      h: (totalRows - bottomCorridorRow) * TILE_SIZE,
    };

    // La canasta se centra horizontalmente en la zona de entrega.
    //
    // IMPORTANTE: la columna de la canasta DEBE ser una columna de
    // CAMINO. Si cayera en una línea de cultivo, el jugador aparecería
    // dentro de las plantas y quedaría atascado sin poder moverse
    // (las plantas bloquean el paso, §39).
    //
    // En el layout las columnas IMPARES son cultivo y las PARES camino,
    // así que se busca la columna de camino más cercana al centro.
    const basketCol = nearestPathColumn(Math.floor(cols / 2), cols);

    const basketSpot = {
      x: basketCol * TILE_SIZE,
      y: (deliveryStartRow + 0.35) * TILE_SIZE,
      w: TILE_SIZE,
      h: TILE_SIZE,
    };

    // El jugador aparece en el pasillo inferior, sobre la misma columna
    // de camino que la canasta, listo para subir.
    const spawn = {
      x: (basketCol + 0.5) * TILE_SIZE,
      y: (bottomCorridorRow + 0.6) * TILE_SIZE,
    };

    // Cajas apiladas junto a la canasta (decorativas, §37)
    const crateSpots = [];
    for (let i = 0; i < 3; i += 1) {
      crateSpots.push({
        x: (basketCol - 2 - i * 1.1) * TILE_SIZE,
        y: (deliveryStartRow + 0.4) * TILE_SIZE,
      });
    }

    const supervisorSpawn = {
      x: (cols - 2.5) * TILE_SIZE,
      y: (deliveryStartRow + 0.5) * TILE_SIZE,
    };

    // Límites transitables en px lógicos.
    //
    // Se CALCULAN a partir de la primera y la última fila realmente
    // transitables, en lugar de fijarse a mano. Así los límites y el
    // terreno nunca se contradicen: un jugador centrado en un tile
    // transitable siempre cabe dentro del área válida.
    //
    // (Antes se usaba `TILE_SIZE * 1.5` como tope superior, que dejaba
    // fuera al jugador situado en el pasillo horizontal superior: sus
    // pies empezaban en y=46.8 con el límite en y=48.)
    const firstWalkableRow = GRASS_ROWS - 1;          // pasillo superior
    const lastRow = totalRows - 1;                    // última fila de entrega

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
