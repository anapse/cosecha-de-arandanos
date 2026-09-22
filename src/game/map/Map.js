/**
 * Map.js
 * ---------------------------------------------------------------
 * Fachada del mundo del juego: agrupa el terreno, las colisiones,
 * las plantas y los puntos de interés (canasta, entrega, cajas).
 *
 * Los sistemas hablan con Map, no directamente con TileMap ni
 * CollisionMap. Así se puede cambiar la generación sin tocar el
 * resto del motor.
 */

import { MapGenerator } from './MapGenerator.js';
import { TILE_SIZE } from '../config/constants.js';

export class Map {
  constructor() {
    this.generator = new MapGenerator();
    this.data = null;
    this.plants = [];
  }

  /**
   * Genera (o regenera) el mundo a partir de la configuración del
   * nivel.
   * @param {object} levelConfig
   * @param {object} [options] { seed }
   */
  generate(levelConfig, options = {}) {
    this.data = this.generator.generateLevel(levelConfig, options);
    // OJO: `this.plants` empieza siendo la DEFINICIÓN cruda que devuelve
    // el generador (objetos planos). El motor debe sustituirla por las
    // instancias reales de Plant con setPlants(), porque los sistemas
    // (HarvestSystem) necesitan métodos como fruitsOnSide().
    this.plants = this.data.plants;
    return this.data;
  }

  /**
   * Registra las instancias reales de Plant que usa el motor.
   *
   * Sin esto habría DOS listas de plantas distintas: la definición
   * cruda del generador y las instancias del motor. HarvestSystem
   * consultaba la primera (sin métodos) y por eso nunca encontraba
   * nada que recoger.
   *
   * @param {Array} plants instancias de Plant
   */
  setPlants(plants) {
    this.plants = plants ?? [];
    return this;
  }

  get tileMap() {
    return this.data?.tileMap ?? null;
  }

  get collisionMap() {
    return this.data?.collisionMap ?? null;
  }

  get bounds() {
    return this.data?.bounds ?? { x: 0, y: 0, w: 0, h: 0 };
  }

  get width() {
    return this.tileMap?.pixelWidth ?? 0;
  }

  get height() {
    return this.tileMap?.pixelHeight ?? 0;
  }

  get deliveryZone() {
    return this.data?.deliveryZone ?? null;
  }

  get basketSpot() {
    return this.data?.basketSpot ?? null;
  }

  get spawn() {
    return this.data?.spawn ?? { x: 64, y: 64 };
  }

  get supervisorSpawn() {
    return this.data?.supervisorSpawn ?? { x: 64, y: 64 };
  }

  get crateSpots() {
    return this.data?.crateSpots ?? [];
  }

  /** ¿La posición (px lógicos) está dentro de la zona de entrega? */
  isInDeliveryZone(x, y) {
    const zone = this.deliveryZone;
    if (!zone) return false;
    return x >= zone.x && x <= zone.x + zone.w && y >= zone.y && y <= zone.y + zone.h;
  }

  /**
   * Plantas que el jugador puede alcanzar desde su posición.
   *
   * IMPORTANTE — no sirve un simple solapamiento de rectángulos:
   * el jugador camina por los CAMINOS y las plantas ocupan la casilla
   * CONTIGUA, así que sus rectángulos nunca se solapan. Si se exigiera
   * solapamiento, no se podría recoger nada.
   *
   * Por eso se usa un margen de una casilla alrededor del rect dado:
   * así se detectan las plantas de las columnas vecinas, que son las
   * que están al alcance del brazo (§7).
   *
   * @param {{x:number,y:number,w:number,h:number}} rect
   * @param {number} [margin] margen en px (por defecto 1 casilla)
   */
  plantsNear(rect, margin = TILE_SIZE) {
    const expanded = {
      x: rect.x - margin,
      y: rect.y - margin,
      w: rect.w + margin * 2,
      h: rect.h + margin * 2,
    };

    return this.plants.filter((plant) => {
      const pr = {
        x: plant.x,
        y: plant.y,
        w: TILE_SIZE,
        h: TILE_SIZE * 1.1,
      };
      return (
        pr.x < expanded.x + expanded.w &&
        pr.x + pr.w > expanded.x &&
        pr.y < expanded.y + expanded.h &&
        pr.y + pr.h > expanded.y
      );
    });
  }

  /** Todas las plantas (incluidas las ya cosechadas). */
  allPlants() {
    return this.plants;
  }

  /** Resumen de la generación, para depuración y README. */
  getSummary() {
    if (!this.data) return null;
    const totalFruits = this.plants.reduce((sum, p) => sum + p.fruits.length, 0);
    const ripe = this.plants.reduce(
      (sum, p) => sum + p.fruits.filter((f) => f.type === 'RIPE').length,
      0
    );
    const unripe = this.plants.reduce(
      (sum, p) => sum + p.fruits.filter((f) => f.type === 'UNRIPE').length,
      0
    );

    return {
      seed: this.data.seed,
      cols: this.data.cols,
      rows: this.data.rows,
      tileSize: TILE_SIZE,
      pxWidth: this.width,
      pxHeight: this.height,
      plants: this.plants.length,
      totalFruits,
      ripe,
      unripe,
    };
  }
}

export default Map;
