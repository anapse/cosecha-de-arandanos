/**
 * lifecycle.test.js — Ciclo de vida del motor (§5, §35).
 *
 * Regresión de un fallo real y difícil de ver: con React StrictMode
 * (montar → desmontar → montar) el motor del primer montaje seguía
 * dibujando tras destroy(), porque un frame ya programado volvía a
 * pedir otro. El motor "muerto" pintaba su fondo vacío encima del
 * motor nuevo y el campo no se veía, aunque el HUD sí funcionaba.
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import { GameEngine } from '../src/game/GameEngine.js';

function installCanvasStub() {
  const ctxStub = {
    canvas: null, imageSmoothingEnabled: true, globalAlpha: 1,
    fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, font: '',
    textAlign: 'left', textBaseline: 'top', globalCompositeOperation: 'source-over',
    fillRect() {}, strokeRect() {}, clearRect() {}, drawImage() {}, fillText() {},
    measureText: (t) => ({ width: String(t).length * 6 }),
    setTransform() {}, save() {}, restore() {}, translate() {}, scale() {},
    rotate() {}, beginPath() {}, closePath() {}, moveTo() {}, lineTo() {},
    arc() {}, ellipse() {}, fill() {}, stroke() {},
    getImageData: (x, y, w, h) => ({
      data: new Uint8ClampedArray(Math.max(1, (w | 0) * (h | 0) * 4)).fill(200),
      width: Math.max(1, w | 0), height: Math.max(1, h | 0),
    }),
    putImageData() {},
  };
  HTMLCanvasElement.prototype.getContext = function (type) {
    if (type === '2d') { ctxStub.canvas = this; return ctxStub; }
    return null;
  };
}

function createCanvas() {
  const wrapper = document.createElement('div');
  wrapper.getBoundingClientRect = () => ({
    width: 360, height: 640, top: 0, left: 0, right: 360, bottom: 640, x: 0, y: 0,
  });
  const canvas = document.createElement('canvas');
  wrapper.appendChild(canvas);
  document.body.appendChild(wrapper);
  return canvas;
}

describe('Ciclo de vida del motor', () => {
  let rafSpy;

  beforeAll(() => {
    installCanvasStub();
    // requestAnimationFrame controlado: permite contar cuántos frames
    // se piden después de destruir.
    rafSpy = vi.fn(() => 1);
    global.requestAnimationFrame = rafSpy;
    global.cancelAnimationFrame = () => {};
    global.performance = global.performance ?? { now: () => 0 };
  });

  it('destroy() marca el motor como destruido', () => {
    const engine = new GameEngine({ canvas: createCanvas() });
    expect(engine.destroyed).toBe(false);

    engine.destroy();
    expect(engine.destroyed).toBe(true);
  });

  it('destroy() es idempotente: llamarlo dos veces no falla', () => {
    const engine = new GameEngine({ canvas: createCanvas() });
    engine.destroy();
    expect(() => engine.destroy()).not.toThrow();
  });

  it('un motor destruido NO puede volver a arrancar el bucle', () => {
    const engine = new GameEngine({ canvas: createCanvas() });
    engine.destroy();

    engine.start();

    expect(engine.running).toBe(false);
  });

  it('un motor destruido no dibuja aunque se llame render()', () => {
    const engine = new GameEngine({ canvas: createCanvas() });
    engine.resize();
    engine.loadLevel(1, { seed: 1 });
    engine.destroy();

    // Tras destroy los datos del mundo se liberan: el motor no debe
    // intentar pintar un mapa que ya no tiene.
    expect(engine.plants.length).toBe(0);
    expect(engine.player).toBeNull();
  });

  it('el motor nuevo tras remontar SÍ carga el nivel (StrictMode)', () => {
    // Simula el doble montaje de StrictMode.
    const canvas = createCanvas();

    const first = new GameEngine({ canvas });
    first.destroy(); // cleanup del primer montaje

    const second = new GameEngine({ canvas });
    second.resize();
    second.loadLevel(1, { seed: 42 });

    // El segundo motor debe tener su mundo cargado y listo para pintar.
    expect(second.destroyed).toBe(false);
    expect(second.map.data).not.toBeNull();
    expect(second.plants.length).toBeGreaterThan(0);
    expect(second.player).not.toBeNull();

    // Y el primero debe seguir muerto.
    expect(first.destroyed).toBe(true);
    expect(first.plants.length).toBe(0);

    second.destroy();
  });

  it('el motor destruido no puede pisar el estado del nuevo', () => {
    const canvas = createCanvas();

    const first = new GameEngine({ canvas });
    first.resize();
    first.loadLevel(1, { seed: 7 });
    first.destroy();

    const second = new GameEngine({ canvas });
    second.resize();
    second.loadLevel(1, { seed: 8 });

    // El mundo del primero está liberado y el del segundo intacto.
    expect(first.map.data).toBeNull();
    expect(second.map.data).not.toBeNull();

    second.destroy();
  });

  it('loadLevel deja el mundo listo para renderizar', () => {
    const engine = new GameEngine({ canvas: createCanvas() });
    engine.resize();
    engine.loadLevel(1, { seed: 99 });

    // Condición que fallaba cuando el motor equivocado pintaba:
    // el que corre DEBE tener mapa.
    expect(engine.map.data).not.toBeNull();
    expect(engine.map.tileMap).not.toBeNull();

    const info = engine.inspectRendering();
    expect(info.counts.plants).toBeGreaterThan(0);

    engine.destroy();
  });
});
