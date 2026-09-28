/**
 * levels.js
 * ---------------------------------------------------------------
 * Los 12 niveles (§20, §27, §28).
 *
 * NINGÚN valor de nivel debe estar desperdigado por el código.
 * Cada nivel es un objeto de configuración que MapGenerator y los
 * sistemas consumen.
 *
 * Escala de dificultad (§28): líneas, plantas, distancia, frutos,
 * proporción de pintones, tiempo, frecuencia de supervisión,
 * tolerancia a errores, capacidad de canasta y exigencia de calidad.
 * NO se sube la velocidad del personaje.
 *
 * Campos:
 *   id                 número de nivel (1-12)
 *   name               nombre mostrado
 *   rows               nº de líneas de cultivo
 *   plantsPerRow       plantas por línea
 *   ripeChance         0-1 probabilidad de fruto maduro
 *   unripeChance       0-1 probabilidad de fruto pintón
 *   fruitChance        0-1 probabilidad de que una planta tenga fruto
 *   maxFruitsPerPlant  frutos máximos por planta
 *   targetHarvest      arándanos maduros requeridos
 *   minimumQuality     calidad mínima para aprobar (%)
 *   deliveries         entregas necesarias
 *   timeLimit          segundos
 *   supervisorInterval segundos entre revisiones
 *   basketCapacity     capacidad de la canasta
 *   difficulty         1-12, etiqueta de dificultad
 */

export const LEVELS = [
  {
   id: 1,
   name: 'Primera jornada',
   rows: 4,
   plantsPerRow: 5,
   ripeChance: 0.8,
   unripeChance: 0.08,
   fruitChance: 0.85,
   maxFruitsPerPlant: 4,
   targetHarvest: 50,
   minimumQuality: 90,
   deliveries: 2,
   timeLimit: 180,
   supervisorInterval: 60,
   basketCapacity: 30,
   difficulty: 1,
  },
  {
   id: 2,
   name: 'Más plantas',
   rows: 4,
   plantsPerRow: 5,
   ripeChance: 0.78,
   unripeChance: 0.12,
   fruitChance: 0.88,
   maxFruitsPerPlant: 4,
   targetHarvest: 70,
   minimumQuality: 90,
   deliveries: 3,
   timeLimit: 180,
   supervisorInterval: 55,
   basketCapacity: 30,
   difficulty: 2,
  },
  {
   id: 3,
   name: 'Ojo con los pintones',
   rows: 4,
   plantsPerRow: 5,
   ripeChance: 0.72,
   unripeChance: 0.2,
   fruitChance: 0.9,
   maxFruitsPerPlant: 4,
   targetHarvest: 85,
   minimumQuality: 88,
   deliveries: 3,
   timeLimit: 180,
   supervisorInterval: 50,
   basketCapacity: 30,
   difficulty: 3,
  },
  {
   id: 4,
   name: 'Tiempo justo',
   rows: 4,
   plantsPerRow: 5,
   ripeChance: 0.72,
   unripeChance: 0.2,
   fruitChance: 0.9,
   maxFruitsPerPlant: 4,
   targetHarvest: 100,
   minimumQuality: 88,
   deliveries: 3,
   timeLimit: 150,
   supervisorInterval: 45,
   basketCapacity: 30,
   difficulty: 4,
  },
  {
   id: 5,
   name: 'Supervisión frecuente',
   rows: 4,
   plantsPerRow: 5,
   ripeChance: 0.7,
   unripeChance: 0.22,
   fruitChance: 0.9,
   maxFruitsPerPlant: 4,
   targetHarvest: 110,
   minimumQuality: 88,
   deliveries: 4,
   timeLimit: 160,
   supervisorInterval: 32,
   basketCapacity: 30,
   difficulty: 5,
  },
  {
   id: 6,
   name: 'Campo grande',
   rows: 4,
   plantsPerRow: 5,
   ripeChance: 0.7,
   unripeChance: 0.22,
   fruitChance: 0.92,
   maxFruitsPerPlant: 4,
   targetHarvest: 125,
   minimumQuality: 86,
   deliveries: 4,
   timeLimit: 170,
   supervisorInterval: 34,
   basketCapacity: 32,
   difficulty: 6,
  },
  {
   id: 7,
   name: 'Cosecha larga',
   rows: 4,
   plantsPerRow: 5,
   ripeChance: 0.7,
   unripeChance: 0.24,
   fruitChance: 0.92,
   maxFruitsPerPlant: 4,
   targetHarvest: 145,
   minimumQuality: 86,
   deliveries: 5,
   timeLimit: 180,
   supervisorInterval: 32,
   basketCapacity: 32,
   difficulty: 7,
  },
  {
   id: 8,
   name: 'Frutos mezclados',
   rows: 4,
   plantsPerRow: 5,
   ripeChance: 0.66,
   unripeChance: 0.3,
   fruitChance: 0.95,
   maxFruitsPerPlant: 4,
   targetHarvest: 160,
   minimumQuality: 85,
   deliveries: 5,
   timeLimit: 180,
   supervisorInterval: 30,
   basketCapacity: 32,
   difficulty: 8,
  },
  {
   id: 9,
   name: 'Contrarreloj',
   rows: 4,
   plantsPerRow: 5,
   ripeChance: 0.66,
   unripeChance: 0.3,
   fruitChance: 0.95,
   maxFruitsPerPlant: 4,
   targetHarvest: 175,
   minimumQuality: 85,
   deliveries: 5,
   timeLimit: 150,
   supervisorInterval: 28,
   basketCapacity: 34,
   difficulty: 9,
  },
  {
   id: 10,
   name: 'Sin margen de error',
   rows: 4,
   plantsPerRow: 5,
   ripeChance: 0.64,
   unripeChance: 0.32,
   fruitChance: 0.95,
   maxFruitsPerPlant: 4,
   targetHarvest: 190,
   minimumQuality: 90,
   deliveries: 6,
   timeLimit: 170,
   supervisorInterval: 26,
   basketCapacity: 34,
   difficulty: 10,
  },
  {
   id: 11,
   name: 'Alta dificultad',
   rows: 4,
   plantsPerRow: 5,
   ripeChance: 0.62,
   unripeChance: 0.34,
   fruitChance: 0.96,
   maxFruitsPerPlant: 4,
   targetHarvest: 210,
   minimumQuality: 90,
   deliveries: 6,
   timeLimit: 165,
   supervisorInterval: 24,
   basketCapacity: 34,
   difficulty: 11,
  },
  {
   id: 12,
   name: 'Gran cosecha',
   rows: 4,
   plantsPerRow: 5,
   ripeChance: 0.62,
   unripeChance: 0.36,
   fruitChance: 0.98,
   maxFruitsPerPlant: 4,
   targetHarvest: 240,
   minimumQuality: 90,
   deliveries: 7,
   timeLimit: 175,
   supervisorInterval: 20,
   basketCapacity: 36,
   difficulty: 12,
  },
];

export const TOTAL_LEVELS = LEVELS.length;

/** Devuelve la configuración de un nivel (1-indexado). */
export function getLevelConfig(levelId = 1) {
  const index = Math.max(1, Math.min(TOTAL_LEVELS, Number(levelId) || 1)) - 1;
  return LEVELS[index];
}

export default LEVELS;