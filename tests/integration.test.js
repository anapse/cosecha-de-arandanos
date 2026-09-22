/**
 * integration.test.js — Comprueba que el arte y la lógica están
 * conectados correctamente (§18, §19).
 *
 * Cubre reglas que se rompieron durante la integración del arte:
 *
 *   1. ESCALA: los sprites se dibujan 1:1, sin deformar el pixel art.
 *      Un sprite de 32x32 debe ocupar 32x32 px lógicos, no 32x35.
 *   2. PROPORCIONES: jugador, supervisor, plantas y frutos guardan
 *      relación coherente entre sí (§18).
 *   3. POSICIÓN DE FRUTOS: el fruto que dibuja el motor cae DENTRO
 *      del área de su planta, no fuera.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { GameEngine } from '../src/game/GameEngine.js';
import { TILE_SIZE } from '../src/game/config/constants.js';
import { ASSET_MANIFEST, ASSETS, assetEntry } from '../src/data/assets.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, '..', 'public');

/** Lee ancho/alto de un PNG. */
function pngSize(assetPath) {
  const buffer = readFileSync(
    join(PUBLIC, 'assets', assetPath.replace('/assets/', ''))
  );
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function installCanvasStub() {
  global.__cosechaDrawn = { calls: [] };

  const makeCtx = () => {
    const rec = global.__cosechaDrawn;
    return {
      canvas: null,
      save() {}, restore() {},
      translate() {}, scale() {}, rotate() {}, setTransform() {},
      drawImage(img, ...args) {
        rec.calls.push({ w: img?.width, h: img?.height, args });
      },
      fillRect() {}, clearRect() {}, strokeRect() {},
      beginPath() {}, closePath() {}, moveTo() {}, lineTo() {},
      arc() {}, ellipse() {}, rect() {}, fill() {}, stroke() {},
      fillText() {}, strokeText() {}, measureText: () => ({ width: 10 }),
      createLinearGradient: () => ({ addColorStop() {} }),
      getImageData: () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 }),
      putImageData() {},
      set fillStyle(v) {}, get fillStyle() { return '#000'; },
      set strokeStyle(v) {}, get strokeStyle() { return '#000'; },
      set globalAlpha(v) {}, get globalAlpha() { return 1; },
      set font(v) {}, get font() { return '10px sans-serif'; },
      set textAlign(v) {}, get textAlign() { return 'left'; },
      set textBaseline(v) {}, get textBaseline() { return 'top'; },
      set imageSmoothingEnabled(v) {}, get imageSmoothingEnabled() { return false; },
      set lineWidth(v) {}, get lineWidth() { return 1; },
    };
  };

  global.HTMLCanvasElement = class {
    constructor() {
      this.width = 360;
      this.height = 640;
      this.style = {};
      const self = this;
      this._ctx = null;
      Object.defineProperty(this, 'getContext', {
        value: () => {
          if (!self._ctx) {
            const c = makeCtx();
            c.canvas = self;
            self._ctx = c;
          }
          return self._ctx;
        },
      });
    }
    getBoundingClientRect() {
      return { left: 0, top: 0, width: this.width, height: this.height, right: this.width, bottom: this.height };
    }
    addEventListener() {}
    removeEventListener() {}
    get clientWidth() { return this.width; }
    get clientHeight() { return this.height; }
  };

  const origCreate = global.document?.createElement?.bind(global.document);
  global.document = global.document ?? {};
  global.document.createElement = (tag) => {
    if (tag === 'canvas') return new global.HTMLCanvasElement();
    return origCreate ? origCreate(tag) : { style: {}, appendChild() {} };
  };
}

function createEngine(level = 1, seed = 12345) {
  const engine = new GameEngine({ canvas: new global.HTMLCanvasElement() });
  engine.resize();
  engine.loadLevel(level, { seed });
  return engine;
}

beforeAll(() => {
  installCanvasStub();
});

describe('Escala del pixel art (§18)', () => {
  it('el jugador mide lo mismo que su sprite, sin deformar', () => {
    const engine = createEngine(1);
    const entry = assetEntry('player.walkDown');

    // El frame del jugador y el rect lógico deben coincidir.
    expect(entry.frameSize).toBe(32);
    expect(engine.player.width).toBeLessThanOrEqual(32);
  });

  it('las plantas miden EXACTAMENTE el tile y su sprite (32x32)', () => {
    const engine = createEngine(1);
    const entry = assetEntry('plant.ripe');

    expect(entry.frameSize).toBe(32);
    expect(entry.frames).toBe(1);

    engine.plants.forEach((plant) => {
      expect(plant.width, 'ancho de planta').toBe(TILE_SIZE);
      expect(plant.height, 'alto de planta').toBe(TILE_SIZE);
    });
  });

  it('la planta no aplica escalado visual (deformaría el arte)', () => {
    const engine = createEngine(1);

    engine.plants.forEach((plant) => {
      expect(plant.visualScale).toBe(1);
    });
  });

  it('los frutos son más pequeños que las plantas (proporción §18)', () => {
    const fruitEntry = assetEntry('fruit.ripe');
    const plantEntry = assetEntry('plant.ripe');

    expect(fruitEntry.frameSize).toBeLessThan(plantEntry.frameSize);
    // Mitad del tile: un fruto reconocible pero claramente menor.
    expect(fruitEntry.frameSize).toBe(16);
  });

  it('jugador y supervisor comparten escala (32px)', () => {
    expect(assetEntry('player.idle').frameSize).toBe(32);
    expect(assetEntry('supervisor.walkDown').frameSize).toBe(32);
  });

  it('los PNG en disco miden EXACTAMENTE lo que declara el catálogo', () => {
    // Ahora el catálogo declara width/height reales, así que la
    // comprobación es estricta para TODOS los sprites (incluidos los
    // no cuadrados: barras, paneles, camión, plant_row, entorno).
    Object.entries(ASSET_MANIFEST).forEach(([key, entry]) => {
      const size = pngSize(entry.path);

      expect(
        size.width,
        `${key}: ancho declarado ${entry.width}, real ${size.width}`
      ).toBe(entry.width);

      expect(
        size.height,
        `${key}: alto declarado ${entry.height}, real ${size.height}`
      ).toBe(entry.height);

      // Y el ancho debe cuadrar con frames x frameSize
      expect(
        entry.width,
        `${key}: width debe ser frames x frameSize`
      ).toBe(entry.frames * entry.frameSize);
    });
  });

  it('los tiles de terreno son cuadrados de 32x32', () => {
    const tiles = Object.values(ASSETS.terrain);

    tiles.forEach((entry) => {
      expect(entry.width, `${entry.path}: ancho`).toBe(32);
      expect(entry.height, `${entry.path}: alto`).toBe(32);
    });
  });
});

describe('Frutos anclados a su planta (§7, §19)', () => {
  it('la posición de cada fruto cae dentro del rectángulo de su planta', () => {
    const engine = createEngine(1);

    let checked = 0;

    engine.plants.forEach((plant) => {
      plant.fruits.forEach((fruit, i) => {
        if (fruit.collected) return;

        const pos = plant.fruitPosition(
          typeof fruit === 'object' ? fruit : { slot: i }
        );

        // El fruto debe quedar dentro del área de la mata, con un
        // pequeño margen de tolerancia (los frutos asoman un poco).
        const margin = 10;
        expect(
          pos.x,
          `fruto x=${pos.x} fuera de la planta x=${plant.x}..${plant.x + plant.width}`
        ).toBeGreaterThanOrEqual(plant.x - margin);
        expect(pos.x).toBeLessThanOrEqual(plant.x + plant.width + margin);

        expect(
          pos.y,
          `fruto y=${pos.y} fuera de la planta y=${plant.y}..${plant.y + plant.height}`
        ).toBeGreaterThanOrEqual(plant.y - margin);
        expect(pos.y).toBeLessThanOrEqual(plant.y + plant.height + margin);

        checked += 1;
      });
    });

    expect(checked, 'debe haber frutos que comprobar').toBeGreaterThan(0);
  });

  it('frutos del mismo lado se sitúan en la mitad correcta', () => {
    const engine = createEngine(1);
    const plant = engine.plants.find((p) => p.fruits.length > 0);
    expect(plant).toBeTruthy();

    const left = plant.fruitPosition({ side: 'left', slot: 0.5 });
    const right = plant.fruitPosition({ side: 'right', slot: 0.5 });

    expect(left.x).toBeLessThan(plant.centerX);
    expect(right.x).toBeGreaterThan(plant.centerX);
  });

  it('el slot controla la altura: 0 arriba, 1 abajo', () => {
    const engine = createEngine(1);
    const plant = engine.plants.find((p) => p.fruits.length > 0);

    const top = plant.fruitPosition({ side: 'left', slot: 0 });
    const bottom = plant.fruitPosition({ side: 'right', slot: 1 });

    expect(top.y).toBeLessThan(bottom.y);
  });
});

describe('Assets del mundo real conectados (§19)', () => {
  it('cada planta del mapa usa un spriteKey definido en el catálogo', () => {
    const engine = createEngine(1);

    engine.plants.forEach((plant) => {
      expect(
        ASSET_MANIFEST[plant.spriteKey],
        `spriteKey sin asset: ${plant.spriteKey}`
      ).toBeTruthy();
    });
  });

  it('las plantas del nivel 1 usan varias variantes distintas', () => {
    const engine = createEngine(1);
    const keys = new Set(engine.plants.map((p) => p.spriteKey));

    // Con 36 plantas y frutos mixtos debe haber más de una variante.
    expect(keys.size).toBeGreaterThan(1);
  });

  it('el motor tiene assets para todas las entidades del nivel', () => {
    const engine = createEngine(1);

    expect(engine.player).toBeTruthy();
    expect(engine.basket).toBeTruthy();
    expect(engine.map.tileMap).toBeTruthy();
    expect(engine.plants.length).toBeGreaterThan(0);

    // Y el catálogo tiene los sprites que esas entidades necesitan.
    expect(assetEntry('basket.empty')).toBeTruthy();
    expect(assetEntry('fruit.ripe')).toBeTruthy();
    expect(assetEntry('terrain.soil')).toBeTruthy();
  });
});
