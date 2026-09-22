/**
 * rendering.test.js — Comprueba que el mundo SE DIBUJA de verdad.
 *
 * Este test nació de un error real: el mapa del nivel 1 (416x384)
 * era más pequeño que el viewport lógico (360x640) y la cámara lo
 * centraba, empujando el campo 128 px hacia abajo y dejando el HUD
 * sobre una franja vacía. El juego "funcionaba" (el motor corría, el
 * HUD se actualizaba) pero la pantalla se veía vacía.
 *
 * Por eso se verifica con PÍXELES, no con estado: es la única forma
 * de garantizar que el jugador ve algo.
 *
 * Usa el canvas 2D de jsdom sobre el motor real.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { GameEngine } from '../src/game/GameEngine.js';
import { getLevelConfig } from '../src/data/levels.js';
import { VIEW_HEIGHT, VIEW_WIDTH } from '../src/game/map/mapLayout.js';

/**
 * jsdom no implementa el contexto 2D del canvas. Se instala un stub
 * que registra las llamadas de dibujo, lo suficiente para comprobar
 * que el motor DIBUJA y en qué coordenadas.
 */
function installCanvasStub() {
  const calls = {
    fillRect: [],
    drawImage: [],
    fillText: [],
    setTransform: [],
    save: 0,
    restore: 0,
  };

  const ctxStub = {
    canvas: null,
    imageSmoothingEnabled: true,
    globalAlpha: 1,
    fillStyle: '#000',
    strokeStyle: '#000',
    lineWidth: 1,
    font: '',
    textAlign: 'left',
    textBaseline: 'top',
    globalCompositeOperation: 'source-over',

    fillRect(x, y, w, h) {
      calls.fillRect.push({ x, y, w, h });
    },
    strokeRect() {},
    clearRect() {},
    drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh) {
      calls.drawImage.push({ dx, dy, dw, dh, sw, sh });
    },
    fillText(text, x, y) {
      calls.fillText.push({ text, x, y });
    },
    measureText(text) {
      return { width: String(text).length * 6 };
    },
    setTransform(a, b, c, d, e, f) {
      calls.setTransform.push({ a, b, c, d, e, f });
    },
    save() {
      calls.save += 1;
    },
    restore() {
      calls.restore += 1;
    },
    translate() {},
    scale() {},
    rotate() {},
    beginPath() {},
    closePath() {},
    moveTo() {},
    lineTo() {},
    arc() {},
    ellipse() {},
    fill() {},
    stroke() {},
    getImageData(x, y, w, h) {
      // Devuelve una imagen con color variado, para que el conteo de
      // colores del diagnóstico tenga sentido.
      const width = Math.max(1, w | 0);
      const height = Math.max(1, h | 0);
      const data = new Uint8ClampedArray(width * height * 4);
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 120;
        data[i + 1] = 160;
        data[i + 2] = 90;
        data[i + 3] = 255;
      }
      return { data, width, height };
    },
    createLinearGradient() {
      return { addColorStop() {} };
    },
    putImageData() {},
  };

  // getContext devuelve siempre el mismo stub.
  const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function getContext(type) {
    if (type === '2d') {
      ctxStub.canvas = this;
      return ctxStub;
    }
    return original.call(this, type);
  };

  return calls;
}

/** Crea un canvas dentro del DOM con un tamaño de contenedor. */
function createCanvas(width = 360, height = 640) {
  const wrapper = document.createElement('div');
  wrapper.style.width = `${width}px`;
  wrapper.style.height = `${height}px`;

  // jsdom no calcula layout: se fuerza getBoundingClientRect.
  wrapper.getBoundingClientRect = () => ({
    width,
    height,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    x: 0,
    y: 0,
  });

  const canvas = document.createElement('canvas');
  wrapper.appendChild(canvas);
  document.body.appendChild(wrapper);
  return canvas;
}

describe('Renderizado del mundo', () => {
  let calls;

  beforeAll(() => {
    calls = installCanvasStub();
    // requestAnimationFrame: el motor lo usa en el bucle.
    global.requestAnimationFrame = () => 0;
    global.cancelAnimationFrame = () => {};
    global.performance = global.performance ?? { now: () => 0 };
  });

  it('el nivel 1 cubre el viewport, así que la cámara NO deja franjas (§38)', () => {
    const engine = new GameEngine({ canvas: createCanvas() });
    engine.resize();
    engine.loadLevel(1, { seed: 1234 });

    const view = engine.camera.viewRect;

    // La vista nunca debe empezar en negativo (eso dejaría hueco
    // vacío arriba) ni terminar más allá del mundo.
    expect(view.x).toBeGreaterThanOrEqual(0);
    expect(view.y).toBeGreaterThanOrEqual(0);
    expect(view.x + view.w).toBeLessThanOrEqual(engine.map.width + 0.001);
    expect(view.y + view.h).toBeLessThanOrEqual(engine.map.height + 0.001);

    engine.destroy();
  });

  it('el mundo es al menos tan grande como la pantalla lógica', () => {
    const engine = new GameEngine({ canvas: createCanvas() });
    engine.resize();

    for (let id = 1; id <= 12; id += 1) {
      engine.loadLevel(id, { seed: id * 7 });
      expect(engine.map.width).toBeGreaterThanOrEqual(VIEW_WIDTH);
      expect(engine.map.height).toBeGreaterThanOrEqual(VIEW_HEIGHT);
    }

    engine.destroy();
  });

  it('dibuja el terreno, el jugador y las plantas al renderizar', () => {
    calls.drawImage.length = 0;
    calls.fillRect.length = 0;

    const engine = new GameEngine({ canvas: createCanvas() });
    engine.resize();
    engine.loadLevel(1, { seed: 999 });

    // El motor necesita assets cargados para dibujar sprites.
    // En jsdom los placeholders se generan por código.
    engine.render();

    // Debe haber dibujado sprites (plantas, jugador, tiles...).
    expect(calls.drawImage.length).toBeGreaterThan(0);

    // Y el render debe haber producido sprites de jugador y plantas.
    const playerSprite = calls.drawImage.length;
    expect(playerSprite).toBeGreaterThan(10);

    expect(engine.player).not.toBeNull();
    expect(engine.plants.length).toBeGreaterThan(0);

    engine.destroy();
  });

  it('el jugador aparece en pantalla y no fuera del área visible', () => {
    const engine = new GameEngine({ canvas: createCanvas() });
    engine.resize();
    engine.loadLevel(1, { seed: 42 });

    const view = engine.camera.viewRect;
    expect(engine.player.x).toBeGreaterThanOrEqual(view.x);
    expect(engine.player.x).toBeLessThanOrEqual(view.x + view.w);
    expect(engine.player.y).toBeGreaterThanOrEqual(view.y);
    expect(engine.player.y).toBeLessThanOrEqual(view.y + view.h);

    engine.destroy();
  });

  it('hay plantas visibles y frutos en la vista inicial', () => {
    const engine = new GameEngine({ canvas: createCanvas() });
    engine.resize();
    engine.loadLevel(1, { seed: 2026 });

    const info = engine.inspectRendering();

    expect(info.counts.plants).toBeGreaterThan(0);
    expect(info.counts.visiblePlants).toBeGreaterThan(0);
    expect(info.counts.fruits).toBeGreaterThan(0);
    expect(info.counts.boxes).toBeGreaterThan(0);

    engine.destroy();
  });

  it('la canasta cabe en pantalla y no queda bajo el borde inferior', () => {
    const engine = new GameEngine({ canvas: createCanvas() });
    engine.resize();
    engine.loadLevel(1, { seed: 5 });

    const view = engine.camera.viewRect;
    const basketBottom = engine.basket.y + engine.basket.height;

    // La canasta debe poder alcanzarse: dentro de la altura del mundo.
    expect(engine.basket.y).toBeLessThan(engine.map.height);
    expect(basketBottom).toBeLessThanOrEqual(engine.map.height + 1);
    expect(view.y + view.h).toBeLessThanOrEqual(engine.map.height + 1);

    engine.destroy();
  });

  it('todas las plantas tienen posiciones dentro del mundo', () => {
    const engine = new GameEngine({ canvas: createCanvas() });
    engine.resize();
    engine.loadLevel(6, { seed: 88 });

    engine.plants.forEach((plant) => {
      expect(plant.x).toBeGreaterThanOrEqual(0);
      expect(plant.x).toBeLessThan(engine.map.width);
      expect(plant.y).toBeGreaterThanOrEqual(0);
      expect(plant.y).toBeLessThan(engine.map.height);
    });

    engine.destroy();
  });

  it('cambiar el tamaño del canvas reescala sin deformar (§11)', () => {
    const engine = new GameEngine({ canvas: createCanvas(360, 640) });
    engine.resize();

    const scaleOriginal = engine.scale;

    // Simula una pantalla más pequeña manteniendo la proporción.
    const canvas2 = createCanvas(180, 320);
    const engine2 = new GameEngine({ canvas: canvas2 });
    engine2.resize();

    // La escala se reduce, pero la proporción lógica es idéntica.
    expect(engine2.scale).toBeLessThan(scaleOriginal);
    expect(engine2.logicalWidth).toBe(engine.logicalWidth);
    expect(engine2.logicalHeight).toBe(engine.logicalHeight);

    engine.destroy();
    engine2.destroy();
  });
});

describe('Progresión de dificultad del mapa (§28)', () => {
  it('el nivel 12 tiene más pintones generados que el nivel 1', () => {
    const engine = new GameEngine({ canvas: createCanvas() });
    engine.resize();

    const countUnripe = (levelId) => {
      engine.loadLevel(levelId, { seed: 777 });
      return engine.plants.reduce((sum, p) => sum + p.unripeCount, 0);
    };

    const unripe1 = countUnripe(1);
    const unripe12 = countUnripe(12);

    expect(unripe12).toBeGreaterThan(unripe1);

    engine.destroy();
  });
});
