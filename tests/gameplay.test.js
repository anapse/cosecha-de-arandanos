/**
 * gameplay.test.js — Prueba el CICLO COMPLETO del juego (§36, §49).
 *
 *   MENÚ → NIVEL 1 → JUGADOR → CAMINAR → PLANTAS → FRUTOS →
 *   RECOGER → CANASTA → REGRESAR → ENTREGAR
 *
 * Se ejecuta el motor real con un canvas instrumentado. Es la prueba
 * que confirma que el prototipo funciona de punta a punta.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { GameEngine } from '../src/game/GameEngine.js';
import { GAME_STATES, HARVEST_SIDES, TILE_SIZE } from '../src/game/config/constants.js';
import { GAME_CONFIG } from '../src/game/config/gameConfig.js';

/* ---------- Instrumentación mínima del canvas 2D ---------- */
function installCanvasStub() {
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
    fillRect() {},
    strokeRect() {},
    clearRect() {},
    drawImage() {},
    fillText() {},
    measureText(t) {
      return { width: String(t).length * 6 };
    },
    setTransform() {},
    save() {},
    restore() {},
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
      const width = Math.max(1, w | 0);
      const height = Math.max(1, h | 0);
      const data = new Uint8ClampedArray(width * height * 4).fill(200);
      return { data, width, height };
    },
    putImageData() {},
  };

  HTMLCanvasElement.prototype.getContext = function getContext(type) {
    if (type === '2d') {
      ctxStub.canvas = this;
      return ctxStub;
    }
    return null;
  };
}

function createCanvas(width = 360, height = 640) {
  const wrapper = document.createElement('div');
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

/** Crea el motor con un nivel cargado, listo para jugar. */
function createEngine(levelId = 1, seed = 4242) {
  const engine = new GameEngine({ canvas: createCanvas() });
  engine.resize();
  engine.loadLevel(levelId, { seed });
  return engine;
}

/** Teletransporta al jugador (evita simular cientos de frames). */
function teleport(engine, x, y) {
  engine.player.placeAt(x, y);
  engine.camera.snapTo(x, y);
}

/**
 * Coloca al jugador en el CAMINO contiguo a un fruto.
 *
 * Importante: no basta con desplazarse unos píxeles desde el fruto.
 * Hay que centrar al jugador en la COLUMNA de camino, porque si el
 * rect de los pies queda medio dentro de la línea de cultivo
 * (bloqueante) el jugador aparece atascado.
 *
 * Aquí se calcula la columna de camino adyacente y se centra al
 * jugador en ella, a la altura del fruto.
 */
function standNextToFruit(engine, plant, fruit) {
  const pos = plant.fruitPosition(fruit);
  const TILE = engine.map.tileMap.tileSize;

  // Columna de camino contigua: izquierda → col-1, derecha → col+1.
  const pathCol = fruit.side === 'left' ? plant.col - 1 : plant.col + 1;

  // Si esa columna no fuese transitable, se busca la más cercana
  // (la geometría del campo depende del tamaño de tile).
  let targetCol = pathCol;
  if (engine.map.tileMap.isBlockingAt(targetCol, plant.row)) {
    targetCol = findWalkableSpot(engine, { row: plant.row }).col;
  }

  const x = targetCol * TILE + TILE / 2;
  teleport(engine, x, pos.y);
  return pos;
}

/**
 * Busca un punto transitable real del mapa.
 *
 * Las columnas pares (y las dos de los extremos) son CAMINOS; las
 * impares son líneas de CULTIVO (bloqueantes). Colocar al jugador en
 * una columna de planta lo deja atascado, así que las pruebas deben
 * pedir una columna de camino explícitamente.
 *
 * `row` se acota al rango válido del mapa: las pruebas piden filas
 * "de la mitad del campo" sin conocer cuántas tiene el nivel, y el
 * número de filas depende del tamaño de tile.
 */
function findWalkableSpot(engine, { col = null, row = null } = {}) {
  const tileMap = engine.map.tileMap;
  const TILE = tileMap.tileSize;

  const cols = col !== null ? [col] : [...Array(tileMap.cols).keys()];
  const rows =
    row !== null
      ? [Math.max(0, Math.min(tileMap.rows - 1, Math.floor(row)))]
      : [...Array(tileMap.rows).keys()];

  for (const c of cols) {
    for (const r of rows) {
      if (!tileMap.isBlockingAt(c, r)) {
        return { x: c * TILE + TILE / 2, y: r * TILE + TILE / 2, col: c, row: r };
      }
    }
  }
  throw new Error('No se encontró un tile transitable');
}

/**
 * Primera columna que es camino Y admite al jugador en la zona del
 * campo. Se comprueban dos filas: los extremos pueden estar cercados
 * en alguna fila concreta.
 */
function firstPathColumn(engine, row = 5) {
  const tileMap = engine.map.tileMap;
  for (let c = 0; c < tileMap.cols; c += 1) {
    if (!tileMap.isBlockingAt(c, row)) return c;
  }
  return 0;
}

/**
 * Primera columna INTERIOR que es camino (excluye las de los
 * extremos, que llevan cerca en algunas filas).
 */
function firstInteriorPathColumn(engine, row = 5) {
  const tileMap = engine.map.tileMap;
  for (let c = 1; c < tileMap.cols - 1; c += 1) {
    if (!tileMap.isBlockingAt(c, row)) return c;
  }
  return 1;
}

describe('Ciclo de juego completo (§49)', () => {
  beforeAll(() => {
    installCanvasStub();
    global.requestAnimationFrame = () => 0;
    global.cancelAnimationFrame = () => {};
  });

  it('arranca en el nivel 1 con el estado PLAYING', () => {
    const engine = createEngine(1);

    expect(engine.state.status).toBe(GAME_STATES.PLAYING);
    expect(engine.state.levelId).toBe(1);
    expect(engine.player).not.toBeNull();
    expect(engine.basket.current).toBe(0);
    expect(engine.state.target).toBe(50);

    engine.destroy();
  });

  it('el jugador se mueve por el camino al aplicar entrada', () => {
    const engine = createEngine(1);

    // Se coloca explícitamente en una columna de CAMINO: si el jugador
    // empieza dentro de una línea de cultivo queda atascado.
    const spot = findWalkableSpot(engine, { col: firstPathColumn(engine), row: 10 });
    teleport(engine, spot.x, spot.y);

    const startY = engine.player.y;

    // Simula mantener "arriba" durante varios frames.
    engine.keyboard.pressed.add('KeyW');
    for (let i = 0; i < 30; i += 1) engine.update(1 / 60);
    engine.keyboard.pressed.delete('KeyW');

    expect(engine.player.y).toBeLessThan(startY);
    expect(engine.player.state).toMatch(/walkUp|idle/);

    engine.destroy();
  });

  it('el jugador NO puede atravesar las líneas de cultivo (§39)', () => {
    const engine = createEngine(1);

    // Se coloca en el CAMINO a la izquierda de una línea de cultivo.
    const plant = engine.plants.find((p) => p.col > 1);
    const pathCol = plant.col - 1;
    const spot = findWalkableSpot(engine, { col: pathCol, row: plant.row });
    teleport(engine, spot.x, spot.y);

    const startX = engine.player.x;

    // Empuja hacia la derecha (hacia la planta) durante muchos frames.
    engine.keyboard.pressed.add('KeyD');
    for (let i = 0; i < 120; i += 1) engine.update(1 / 60);
    engine.keyboard.pressed.delete('KeyD');

    // El jugador debe haberse frenado antes de invadir la línea:
    // su rect de pies no puede entrar en la columna de la planta.
    const plantLeftEdge = plant.x;
    expect(startX).toBeLessThan(plantLeftEdge);
    expect(engine.player.feetRect.x + engine.player.feetRect.w)
      .toBeLessThanOrEqual(plantLeftEdge + 1);
    expect(engine.player.x).toBeLessThan(plantLeftEdge);

    engine.destroy();
  });

  it('el jugador NO puede salir del área válida del mapa (§39)', () => {
    const engine = createEngine(1);

    // Se parte de un camino para que el avance no se detenga en una planta.
    const spot = findWalkableSpot(engine, { col: firstPathColumn(engine), row: 18 });
    teleport(engine, spot.x, spot.y);

    // Empuja hacia arriba durante mucho tiempo.
    engine.keyboard.pressed.add('KeyW');
    for (let i = 0; i < 600; i += 1) engine.update(1 / 60);
    engine.keyboard.pressed.delete('KeyW');

    // Nunca puede salir por arriba: el límite superior del mapa manda.
    expect(engine.player.feetRect.y).toBeGreaterThanOrEqual(engine.map.bounds.y - 1);
    expect(engine.player.y).toBeGreaterThan(0);

    engine.destroy();
  });

  it('recoger un maduro llena la canasta y suma puntos (§6, §23)', () => {
    const engine = createEngine(1);

    // Busca una planta con un fruto maduro.
    const plant = engine.plants.find((p) => p.ripeCount > 0);
    const fruit = plant.ripeFruits[0];
    standNextToFruit(engine, plant, fruit);

    const scoreBefore = engine.state.score;
    const basketBefore = engine.basket.current;

    // Recoge al lado correcto.
    engine.touch.pressHarvest(fruit.side);
    engine.update(1 / 60);

    // La animación debe haber empezado.
    expect(engine.player.isHarvesting).toBe(true);

    // Se completa la animación: el motor aplica las consecuencias.
    for (let i = 0; i < 40; i += 1) engine.update(1 / 60);

    expect(engine.basket.current).toBe(basketBefore + 1);
    expect(engine.state.score).toBe(scoreBefore + GAME_CONFIG.scoreRipe);
    expect(engine.state.harvestedThisRun).toBe(1);

    engine.destroy();
  });

  it('recoger un pintón genera error y baja la calidad (§12)', () => {
    const engine = createEngine(1);

    const plant = engine.plants.find((p) => p.unripeCount > 0);
    expect(plant).toBeDefined();

    const fruit = plant.unripeFruits[0];
    standNextToFruit(engine, plant, fruit);

    // Nivel 1 tiene pocos pintones: se generan de forma garantizada
    // localizando una planta que los tenga.
    const errorsBefore = engine.state.errors;
    const qualityBefore = engine.state.quality;
    const scoreBefore = engine.state.score;

    engine.touch.pressHarvest(fruit.side);
    for (let i = 0; i < 60; i += 1) engine.update(1 / 60);

    expect(engine.state.errors).toBe(errorsBefore + 1);
    expect(engine.state.unripeCollected).toBe(1);
    expect(engine.state.quality).toBeLessThan(qualityBefore);
    expect(engine.state.score).toBe(scoreBefore + GAME_CONFIG.scoreUnripe);

    engine.destroy();
  });

  it('la entrega vacía la canasta y suma al objetivo (§15)', () => {
    const engine = createEngine(1);

    // Se llena la canasta directamente.
    engine.basket.add(10, { unripe: false });

    // El jugador va a la zona de entrega.
    teleport(engine, engine.basket.centerX, engine.basket.centerY);

    expect(engine.deliverySystem.canDeliver(engine.player)).toBe(true);

    const scoreBefore = engine.state.score;
    const harvestedBefore = engine.state.harvested;

    engine.touch.pressDeliver();
    engine.update(1 / 60);

    expect(engine.basket.current).toBe(0);
    expect(engine.state.harvested).toBe(harvestedBefore + 10);
    expect(engine.state.deliveries).toBe(1);
    expect(engine.state.score).toBeGreaterThan(scoreBefore);

    engine.destroy();
  });

  it('no se puede entregar fuera de la zona de entrega', () => {
    const engine = createEngine(1);

    engine.basket.add(5);
    // El jugador se queda en el campo, lejos de la entrega.
    const spot = findWalkableSpot(engine, { col: firstPathColumn(engine), row: 5 });
    teleport(engine, spot.x, spot.y);

    expect(engine.deliverySystem.isPlayerInZone(engine.player)).toBe(false);

    engine.touch.pressDeliver();
    engine.update(1 / 60);

    expect(engine.basket.current).toBe(5);
    expect(engine.state.deliveries).toBe(0);

    engine.destroy();
  });

  it('el temporizador baja con el tiempo', () => {
    const engine = createEngine(1);
    const before = engine.timerSystem.timeLeft;

    for (let i = 0; i < 60; i += 1) engine.update(1 / 60);

    expect(engine.timerSystem.timeLeft).toBeLessThan(before);
    expect(engine.timerSystem.timeLeft).toBeGreaterThan(before - 2);

    engine.destroy();
  });

  it('se puede pausar y reanudar (§38)', () => {
    const engine = createEngine(1);

    engine.pause();
    expect(engine.state.status).toBe(GAME_STATES.PAUSED);

    const frozenTime = engine.timerSystem.timeLeft;
    for (let i = 0; i < 30; i += 1) engine.update(1 / 60);
    expect(engine.timerSystem.timeLeft).toBe(frozenTime);

    engine.resume();
    expect(engine.state.status).toBe(GAME_STATES.PLAYING);

    engine.destroy();
  });

  it('se puede reiniciar el nivel (§21)', () => {
    const engine = createEngine(1);

    engine.basket.add(8);
    engine.state.errors = 3;

    engine.restartLevel({ seed: 1 });

    expect(engine.basket.current).toBe(0);
    expect(engine.state.errors).toBe(0);
    expect(engine.state.harvested).toBe(0);
    expect(engine.state.status).toBe(GAME_STATES.PLAYING);

    engine.destroy();
  });

  it('se puede GANAR cumpliendo objetivo, calidad y entregas (§25)', () => {
    const engine = createEngine(1);
    const level = engine.state.levelConfig;

    // Se simula una partida perfecta.
    engine.state.harvested = level.targetHarvest;
    engine.state.deliveries = level.deliveries;
    engine.state.quality = 98;

    const outcome = engine.levelSystem.evaluate();

    expect(outcome.finished).toBe(true);
    expect(outcome.outcome).toBe('victory');
    expect(engine.state.status).toBe(GAME_STATES.LEVEL_COMPLETE);

    engine.destroy();
  });

  it('se puede PERDER por tiempo agotado (§26, §22)', () => {
    const engine = createEngine(1);

    engine.state.harvested = 0;
    engine.timerSystem.timeLeft = 0;
    engine.state.timeLeft = 0;

    const outcome = engine.levelSystem.evaluate();

    expect(outcome.finished).toBe(true);
    expect(outcome.outcome).toBe('defeat');
    expect(outcome.reason).toBe('timeUp');
    expect(engine.state.status).toBe(GAME_STATES.GAME_OVER);

    engine.destroy();
  });

  it('se puede PERDER por demasiados pintones (§26)', () => {
    const engine = createEngine(1);

    engine.state.unripeCollected = 10;

    const outcome = engine.levelSystem.evaluate();

    expect(outcome.finished).toBe(true);
    expect(outcome.outcome).toBe('defeat');
    expect(outcome.reason).toBe('tooManyUnripe');

    engine.destroy();
  });

  it('se puede PERDER sin vidas (§21)', () => {
    const engine = createEngine(1);

    engine.state.lives = 0;

    const outcome = engine.levelSystem.evaluate();

    expect(outcome.finished).toBe(true);
    expect(outcome.reason).toBe('noLives');
    expect(engine.state.status).toBe(GAME_STATES.GAME_OVER);

    engine.destroy();
  });

  it('el supervisor aparece cuando toca revisión (§19)', () => {
    const engine = createEngine(1, 31337);

    expect(engine.supervisor.isActive).toBe(false);

    // Se fuerza el temporizador del supervisor a cero.
    engine.timerSystem.supervisorLeft = 0.001;

    // Un frame para disparar la revisión.
    engine.update(1 / 60);

    expect(engine.supervisor.isActive).toBe(true);
    expect(engine.state.status).toBe(GAME_STATES.INSPECTION);

    engine.destroy();
  });

  it('el supervisor camina hasta la zona de revisión y produce un veredicto', () => {
    const engine = createEngine(1, 5150);

    engine.timerSystem.supervisorLeft = 0.001;
    engine.update(1 / 60);

    expect(engine.supervisor.isActive).toBe(true);

    // Se deja correr la inspección completa a través del motor, que es
    // quien resuelve el resultado y reinicia el ciclo.
    let resolved = null;
    for (let i = 0; i < 900 && !resolved; i += 1) {
      engine.update(1 / 60);
      resolved = engine.state.inspectionResult;
    }

    expect(resolved).not.toBeNull();
    expect(resolved.verdict).toBeDefined();
    expect(['approved', 'warning', 'rejected']).toContain(resolved.verdict);

    // Al terminar, el juego vuelve a PLAYING y el supervisor se retira.
    expect(engine.state.status).toBe(GAME_STATES.PLAYING);
    expect(engine.supervisor.isActive).toBe(false);

    engine.destroy();
  });

  it('con calidad perfecta el supervisor APRUEBA (§20)', () => {
    const engine = createEngine(1, 8888);

    const result = engine.supervisor.evaluate({
      ripe: 40,
      unripe: 0,
      errors: 0,
      quality: 100,
    });

    expect(result.verdict).toBe('approved');
    expect(result.message).toContain('APROBADA');

    engine.destroy();
  });

  it('con calidad muy baja el supervisor RECHAZA (§20)', () => {
    const engine = createEngine(1, 8888);

    const result = engine.supervisor.evaluate({
      ripe: 10,
      unripe: 12,
      errors: 10,
      quality: 40,
    });

    expect(result.verdict).toBe('rejected');
    expect(result.message).toContain('RECHAZADA');

    engine.destroy();
  });

  it('la canasta se marca llena y el motor lo comunica (§14)', () => {
    const engine = createEngine(1);

    engine.basket.add(engine.basket.capacity);

    expect(engine.basket.isFull).toBe(true);
    expect(engine.basket.state).toBe('full');

    const hud = engine.getHudSnapshot();
    expect(hud.basketFull).toBe(true);
    expect(hud.basketCurrent).toBe(hud.basketCapacity);

    engine.destroy();
  });

  it('la puntuación perfecta otorga el bono de 250 (§23)', () => {
    const engine = createEngine(1);
    const level = engine.state.levelConfig;

    engine.state.harvested = level.targetHarvest;
    engine.state.deliveries = level.deliveries;
    engine.state.quality = 100;
    engine.state.errors = 0;
    engine.state.unripeCollected = 0;

    const scoreBefore = engine.state.score;
    engine.levelSystem.evaluate();

    expect(engine.state.score).toBe(scoreBefore + GAME_CONFIG.perfectHarvestScore);

    engine.destroy();
  });

  it('puede pasar al siguiente nivel (§25)', () => {
    const engine = createEngine(1);

    engine.nextLevel();
    expect(engine.state.levelId).toBe(2);

    engine.destroy();
  });

  it('se puede jugar en los 12 niveles sin errores', () => {
    const engine = new GameEngine({ canvas: createCanvas() });
    engine.resize();

    for (let id = 1; id <= 12; id += 1) {
      expect(() => engine.loadLevel(id, { seed: id * 100 })).not.toThrow();
      expect(engine.plants.length).toBeGreaterThan(0);
      expect(engine.player).not.toBeNull();
      expect(engine.basket).not.toBeNull();
      expect(engine.supervisor).not.toBeNull();
    }

    engine.destroy();
  });
});

describe('Movimiento por caminos (§39, §5)', () => {
  beforeAll(() => {
    installCanvasStub();
    global.requestAnimationFrame = () => 0;
    global.cancelAnimationFrame = () => {};
  });

  it('el jugador puede subir y bajar por una línea de camino', () => {
    const engine = createEngine(1);

    // Columna de CAMINO real (las impares son líneas de cultivo).
    const spot = findWalkableSpot(engine, { col: firstPathColumn(engine), row: 10 });
    teleport(engine, spot.x, spot.y);

    const startY = engine.player.y;

    engine.keyboard.pressed.add('KeyW');
    for (let i = 0; i < 60; i += 1) engine.update(1 / 60);
    engine.keyboard.pressed.delete('KeyW');

    const afterUp = engine.player.y;
    expect(afterUp).toBeLessThan(startY);

    engine.keyboard.pressed.add('KeyS');
    for (let i = 0; i < 60; i += 1) engine.update(1 / 60);
    engine.keyboard.pressed.delete('KeyS');

    expect(engine.player.y).toBeGreaterThan(afterUp);

    engine.destroy();
  });

  it('el jugador puede desplazarse entre líneas por el pasillo superior', () => {
    const engine = createEngine(1);

    // El pasillo horizontal superior está en la fila GRASS_ROWS-1 = 1.
    // Ojo: en esa fila las columnas de los EXTREMOS son cerca (bloquean),
    // así que hay que buscar dentro del tramo interior.
    let spot = null;
    for (let c = 1; c < engine.map.tileMap.cols - 1 && !spot; c += 1) {
      if (!engine.map.tileMap.isBlockingAt(c, 1)) {
        const TILE = engine.map.tileMap.tileSize;
        spot = { x: c * TILE + TILE / 2, y: 1 * TILE + TILE / 2, col: c, row: 1 };
      }
    }
    expect(spot).not.toBeNull();
    teleport(engine, spot.x, spot.y);

    const startX = engine.player.x;

    engine.keyboard.pressed.add('KeyD');
    for (let i = 0; i < 60; i += 1) engine.update(1 / 60);
    engine.keyboard.pressed.delete('KeyD');

    expect(engine.player.x).toBeGreaterThan(startX);

    engine.destroy();
  });

  it('las colisiones usan el rect de los pies, no el sprite completo', () => {
    const engine = createEngine(1);

    // El rect de pies debe ser más pequeño que el rect total:
    // si no, el personaje se atascaría en los caminos estrechos.
    const feet = engine.player.feetRect;
    const full = engine.player.rect;

    expect(feet.w).toBeLessThan(full.w);
    expect(feet.h).toBeLessThan(full.h);

    engine.destroy();
  });

  it('la conversión pies ⇄ centro es una inversa EXACTA (sin deriva)', () => {
    // Regresión: la conversión del movimiento fue aproximada y cada
    // frame acumulaba +4.2 px de error, haciendo que el jugador se
    // moviese al revés al pulsar "arriba".
    const engine = createEngine(1);
    const player = engine.player;

    const feet = player.feetRect;
    const feetOffsetY = player.height / 2 - feet.h;

    // Reconstruir el centro desde los pies debe devolver el original
    // en ambos ejes. Es la condición que garantiza que no haya deriva:
    // feet debe ser la transformación EXACTA del centro, y su inversa
    // debe devolverlo sin pérdida.
    const recoveredX = feet.x + feet.w / 2;
    const recoveredY = feet.y - feetOffsetY;

    expect(recoveredX).toBeCloseTo(player.x, 6);
    expect(recoveredY).toBeCloseTo(player.y, 6);

    engine.destroy();
  });

  it('mantener una dirección NO desplaza al jugador en el eje contrario', () => {
    const engine = createEngine(1);

    // Subir no debe hacer bajar nunca. Se parte de una columna de camino.
    const spot = findWalkableSpot(engine, { col: firstPathColumn(engine), row: 14 });
    teleport(engine, spot.x, spot.y);

    const samples = [];
    engine.keyboard.pressed.add('KeyW');
    for (let i = 0; i < 40; i += 1) {
      engine.update(1 / 60);
      samples.push(engine.player.y);
    }
    engine.keyboard.pressed.delete('KeyW');

    // La posición en Y debe ser monótona descendente (sube sin retroceder).
    for (let i = 1; i < samples.length; i += 1) {
      expect(samples[i]).toBeLessThanOrEqual(samples[i - 1] + 0.001);
    }
    expect(samples[samples.length - 1]).toBeLessThan(samples[0]);

    engine.destroy();
  });

  it('el movimiento es simétrico: subir y bajar recorren distancias similares', () => {
    const engine = createEngine(1);

    const spot = findWalkableSpot(engine, { col: firstPathColumn(engine), row: 16 });
    teleport(engine, spot.x, spot.y);
    const y0 = engine.player.y;

    engine.keyboard.pressed.add('KeyW');
    for (let i = 0; i < 30; i += 1) engine.update(1 / 60);
    engine.keyboard.pressed.delete('KeyW');
    const yUp = engine.player.y;

    engine.keyboard.pressed.add('KeyS');
    for (let i = 0; i < 30; i += 1) engine.update(1 / 60);
    engine.keyboard.pressed.delete('KeyS');
    const yDown = engine.player.y;

    const upDistance = y0 - yUp;
    const downDistance = yDown - yUp;

    // En el mismo pasillo sin obstáculos, recorrer 30 frames arriba y
    // 30 abajo debe devolver al jugador cerca del punto de partida.
    expect(upDistance).toBeGreaterThan(0);
    expect(downDistance).toBeGreaterThan(0);
    expect(Math.abs(downDistance - upDistance)).toBeLessThan(1);

    engine.destroy();
  });
});
