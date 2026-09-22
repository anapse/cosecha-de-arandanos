/**
 * fullCycle.test.js — Prueba de INTEGRACIÓN del ciclo completo (§49).
 *
 *   CAMINAR → BUSCAR → RECOGER → ACUMULAR → REGRESAR → ENTREGAR
 *
 * A diferencia de gameplay.test.js (que coloca al jugador), aquí el
 * jugador CAMINA de verdad usando la entrada, para comprobar que el
 * recorrido completo del jugador funciona sin teletransportes.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { GameEngine } from '../src/game/GameEngine.js';
import { GAME_STATES } from '../src/game/config/constants.js';

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

function createCanvas(width = 360, height = 640) {
  const wrapper = document.createElement('div');
  wrapper.getBoundingClientRect = () => ({
    width, height, top: 0, left: 0, right: width, bottom: height, x: 0, y: 0,
  });
  const canvas = document.createElement('canvas');
  wrapper.appendChild(canvas);
  document.body.appendChild(wrapper);
  return canvas;
}

/** Avanza N frames con las teclas indicadas pulsadas. */
function run(engine, frames, keys = []) {
  keys.forEach((k) => engine.keyboard.pressed.add(k));
  for (let i = 0; i < frames; i += 1) engine.update(1 / 60);
  keys.forEach((k) => engine.keyboard.pressed.delete(k));
}

describe('Ciclo completo caminando (§49)', () => {
  beforeAll(() => {
    installCanvasStub();
    global.requestAnimationFrame = () => 0;
    global.cancelAnimationFrame = () => {};
  });

  it('el jugador camina desde la entrega hasta una línea de cultivo', () => {
    const engine = new GameEngine({ canvas: createCanvas() });
    engine.resize();
    engine.loadLevel(1, { seed: 3131 });

    // Nivel 1: el jugador aparece en la zona de entrega (parte baja).
    const startY = engine.player.y;

    // Sube por el pasillo central durante 3 segundos.
    run(engine, 180, ['KeyW']);

    // Debe haber subido de verdad (no atascado).
    expect(engine.player.y).toBeLessThan(startY - 40);

    engine.destroy();
  });

  it('recoge frutos maduros caminando hasta la planta', () => {
    const engine = new GameEngine({ canvas: createCanvas() });
    engine.resize();
    engine.loadLevel(1, { seed: 20260101 });

    // Busca una planta con fruto maduro.
    const plant = engine.plants.find((p) => p.ripeCount > 0);
    const fruit = plant.ripeFruits[0];
    const TILE = engine.map.tileMap.tileSize;

    // Se coloca en el camino contiguo, un poco por DEBAJO del fruto, y
    // CAMINA hacia arriba hasta ponerse a su alcance (§7). Así se prueba
    // el movimiento real y no un teletransporte exacto.
    const pathCol = fruit.side === 'left' ? plant.col - 1 : plant.col + 1;
    const target = plant.fruitPosition(fruit);

    engine.player.placeAt(
      pathCol * TILE + TILE / 2,
      target.y + 26 // arranca por debajo, fuera de alcance
    );
    engine.camera.snapTo(engine.player.x, engine.player.y);

    // Camina hacia arriba hasta acercarse al fruto.
    for (let i = 0; i < 60; i += 1) {
      engine.keyboard.pressed.add('KeyW');
      engine.update(1 / 60);
      engine.keyboard.pressed.delete('KeyW');

      const dist = Math.hypot(
        engine.player.x - target.x,
        engine.player.y - target.y
      );
      if (dist <= 30) break;
    }

    // Ahora recoge con el botón de ese lado.
    const remainingBefore = plant.remainingFruits;
    engine.touch.pressHarvest(fruit.side);
    run(engine, 45);

    expect(engine.basket.current).toBeGreaterThan(0);
    expect(engine.state.score).toBeGreaterThan(0);
    // El fruto desapareció de la planta.
    expect(plant.remainingFruits).toBe(remainingBefore - 1);

    engine.destroy();
  });

  it('camina de vuelta y ENTREGA la cosecha (§15)', () => {
    const engine = new GameEngine({ canvas: createCanvas() });
    engine.resize();
    engine.loadLevel(1, { seed: 777 });

    // Se llena la canasta directamente (la recolección ya está probada
    // arriba) para centrar esta prueba en el regreso y la entrega.
    engine.basket.add(6, { unripe: false });

    // Camina hacia abajo hasta la zona de entrega.
    run(engine, 240, ['KeyS']);

    // Debe haber llegado a la zona de entrega.
    expect(engine.deliverySystem.isPlayerInZone(engine.player)).toBe(true);
    expect(engine.deliverySystem.canDeliver(engine.player)).toBe(true);

    // Entrega.
    const scoreBefore = engine.state.score;
    engine.touch.pressDeliver();
    run(engine, 2);

    // La canasta se vacía y el total sube.
    expect(engine.basket.current).toBe(0);
    expect(engine.state.harvested).toBe(6);
    expect(engine.state.deliveries).toBe(1);
    expect(engine.state.score).toBeGreaterThan(scoreBefore);

    engine.destroy();
  });

  it('la canasta llena obliga a regresar: se llena y se entrega', () => {
    const engine = new GameEngine({ canvas: createCanvas() });
    engine.resize();
    engine.loadLevel(1, { seed: 9001 });

    // Llena la canasta al máximo.
    engine.basket.add(engine.basket.capacity, { unripe: false });
    expect(engine.basket.isFull).toBe(true);

    // El HUD lo refleja (§14).
    const hud = engine.getHudSnapshot();
    expect(hud.basketFull).toBe(true);

    // Regresa caminando y entrega.
    run(engine, 300, ['KeyS']);
    engine.touch.pressDeliver();
    run(engine, 2);

    expect(engine.basket.current).toBe(0);
    expect(engine.state.harvested).toBe(30);

    engine.destroy();
  });

  it('el juego sigue en PLAYING durante una partida normal', () => {
    const engine = new GameEngine({ canvas: createCanvas() });
    engine.resize();
    engine.loadLevel(1, { seed: 555 });

    // Simula 5 segundos de juego moviéndose.
    run(engine, 150, ['KeyW', 'KeyD']);
    run(engine, 150, ['KeyS', 'KeyA']);

    expect(engine.state.status).toBe(GAME_STATES.PLAYING);
    expect(engine.state.errors).toBe(0); // caminar no genera errores

    engine.destroy();
  });

  it('recoger pintones a propósito reduce la calidad y suma errores', () => {
    const engine = new GameEngine({ canvas: createCanvas() });
    engine.resize();
    engine.loadLevel(1, { seed: 31415 });

    const plant = engine.plants.find((p) => p.unripeCount > 0);
    const fruit = plant.unripeFruits[0];
    const TILE = engine.map.tileMap.tileSize;

    const pathCol = fruit.side === 'left' ? plant.col - 1 : plant.col + 1;
    const target = plant.fruitPosition(fruit);
    engine.player.placeAt(pathCol * TILE + TILE / 2, target.y);
    engine.camera.snapTo(engine.player.x, engine.player.y);

    const qualityBefore = engine.state.quality;

    engine.touch.pressHarvest(fruit.side);
    run(engine, 45);

    expect(engine.state.unripeCollected).toBeGreaterThan(0);
    expect(engine.state.errors).toBeGreaterThan(0);
    expect(engine.state.quality).toBeLessThan(qualityBefore);
    // El pintón NO debe haber entrado en la canasta.
    expect(engine.basket.current).toBe(0);

    engine.destroy();
  });
});
