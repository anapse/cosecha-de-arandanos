/**
 * presentation.test.js — Comprueba la FASE DE PRESENTACIÓN visual.
 *
 * Estas pruebas nacieron de fallos reales vistos en pantalla:
 *
 *   1. DOS HUDs dibujándose a la vez (la capa React y la del canvas),
 *      que se pisaban y dejaban el HUD ilegible.
 *   2. La franja de paisaje no se dibujaba (campo marrón sin cielo).
 *   3. La cámara no reservaba sitio para los HUD, así que el campo se
 *      dibujaba por debajo de los paneles.
 *
 * Se verifica dibujando de verdad sobre un canvas simulado y contando
 * las llamadas de dibujo.
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { GameEngine } from '../src/game/GameEngine.js';
import { GAME_CONFIG } from '../src/game/config/gameConfig.js';
import { HudRenderer, OBJETIVO_TEXT } from '../src/game/rendering/HudRenderer.js';
import { ASSET_MANIFEST } from '../src/data/assets.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, '..', 'src');

/* ---------- Canvas simulado que registra las llamadas ---------- */
const calls = {
  drawImage: [],
  fillRect: [],
  fillText: [],
  translate: [],
};

beforeAll(() => {
  const makeCtx = () => ({
    canvas: null,
    save() {}, restore() {},
    translate(x, y) { calls.translate.push({ x, y }); },
    scale() {}, rotate() {}, setTransform() {},
    drawImage(img, ...args) {
      calls.drawImage.push({ w: img?.width, h: img?.height, args });
    },
    fillRect(x, y, w, h) { calls.fillRect.push({ x, y, w, h }); },
    clearRect() {}, strokeRect() {},
    beginPath() {}, closePath() {}, moveTo() {}, lineTo() {},
    arc() {}, ellipse() {}, rect() {}, fill() {}, stroke() {},
    fillText(t, x, y) { calls.fillText.push({ t, x, y }); },
    strokeText() {},
    measureText: (t) => ({ width: String(t).length * 4 }),
    createLinearGradient: () => ({ addColorStop() {} }),
    getImageData: () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 }),
    putImageData() {},
    set fillStyle(v) {}, get fillStyle() { return '#000'; },
    set strokeStyle(v) {}, get strokeStyle() { return '#000'; },
    set globalAlpha(v) {}, get globalAlpha() { return 1; },
    set font(v) {}, get font() { return '10px monospace'; },
    set textAlign(v) {}, get textAlign() { return 'left'; },
    set textBaseline(v) {}, get textBaseline() { return 'top'; },
    set imageSmoothingEnabled(v) {}, get imageSmoothingEnabled() { return false; },
    set lineWidth(v) {}, get lineWidth() { return 1; },
  });

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

  global.document = global.document ?? {};
  global.document.createElement = (tag) =>
    tag === 'canvas' ? new global.HTMLCanvasElement() : { style: {}, appendChild() {} };

  global.performance = global.performance ?? { now: () => 0 };
});

beforeEach(() => {
  calls.drawImage.length = 0;
  calls.fillRect.length = 0;
  calls.fillText.length = 0;
  calls.translate.length = 0;
});

function createEngine(level = 1, seed = 12345) {
  const engine = new GameEngine({ canvas: new global.HTMLCanvasElement() });
  engine.resize();
  engine.loadLevel(level, { seed });
  return engine;
}

/* ============================================================
   UN SOLO HUD (§2)
   ============================================================ */
describe('HUD único (se corrigió el doble HUD)', () => {
  it('GameShell NO renderiza la capa de HUD en React', () => {
    // Regresión: había dos HUDs a la vez (React + canvas) y se
    // pisaban, dejando el HUD ilegible.
    const shell = readFileSync(
      join(SRC, 'components', 'GameShell', 'GameShell.jsx'),
      'utf8'
    );

    // No debe importarse ni usarse el HUD de React.
    expect(shell).not.toMatch(/import\s+GameHud\s+from/);
    expect(shell).not.toMatch(/<GameHud\b/);
  });

  it('el motor dibuja el HUD dentro del canvas', () => {
    calls.fillText.length = 0;

    const engine = createEngine(1);
    engine.render();

    // El HUD del canvas escribe texto (etiquetas, valores, tiempos).
    expect(calls.fillText.length).toBeGreaterThan(10);
  });
});

/* ============================================================
   CONTENIDO DEL HUD (§2, §3, §7)
   ============================================================ */
describe('Contenido del HUD', () => {
  it('el HUD superior muestra los datos del nivel', () => {
    const engine = createEngine(3);
    engine.render();

    const drawn = calls.fillText.map((c) => c.t).join(' | ');

    expect(drawn).toContain('NIVEL:');
    expect(drawn).toContain('TIEMPO:');
    expect(drawn).toContain('COSECHADOS:');
    expect(drawn).toContain('ERRORES:');
    expect(drawn).toContain('OBJETIVO');
  });

  it('el HUD lleva el cartel del fundo', () => {
    const engine = createEngine(1);
    engine.render();

    const drawn = calls.fillText.map((c) => c.t).join(' | ');

    expect(drawn).toMatch(/COSECHA DE/);
    expect(drawn).toMatch(/ARÁNDANOS/);
    expect(drawn).toContain('FUNDO SAN JORGE - ICA');
  });

  it('la leyenda explica Maduro, Pintón y Error', () => {
    const engine = createEngine(1);
    engine.render();

    const drawn = calls.fillText.map((c) => c.t).join(' | ');

    expect(drawn).toContain('Maduro');
    expect(drawn).toContain('Pintón');
    expect(drawn).toContain('Error');
    // Con su indicación de uso
    expect(drawn).toContain('(Recoge)');
    expect(drawn).toContain('(No recoger)');
    expect(drawn).toContain('(Baja puntos)');
  });

  it('el HUD inferior muestra vidas, puntuación y revisión', () => {
    const engine = createEngine(1);
    engine.render();

    const drawn = calls.fillText.map((c) => c.t).join(' | ');

    expect(drawn).toContain('VIDAS:');
    expect(drawn).toContain('PUNTUACIÓN:');
    expect(drawn).toContain('SIGUIENTE REVISIÓN:');
  });

  it('el HUD no tapa el campo: los textos viven en las franjas de HUD', () => {
    const engine = createEngine(1);
    engine.render();

    const top = GAME_CONFIG.hudHeight;
    const bottom = GAME_CONFIG.logicalHeight - GAME_CONFIG.hudBottomHeight;

    // Textos que caen DENTRO de la franja del campo (sin contar la
    // leyenda, que va a propósito sobre la esquina, ni el contador de
    // canasta, que va flotando sobre la canasta por diseño §5).
    const allowed = ['Maduro', 'Pintón', 'Error', '(Recoge)', '(No recoger)', '(Baja puntos)'];

    const intruders = calls.fillText.filter((c) => {
      const inField = c.y > top && c.y < bottom;
      if (!inField) return false;
      if (allowed.some((w) => String(c.t).includes(w))) return false;
      // El contador de la canasta ("n / m") flota sobre la canasta.
      if (/^\d+\s*\/\s*\d+$/.test(String(c.t))) return false;
      return true;
    });

    const unique = [...new Set(intruders.map((c) => c.t))];
    expect(unique, `textos de HUD dentro del campo: ${unique.join(', ')}`).toEqual([]);
  });

  it('el texto del objetivo es el de la especificación', () => {
    expect(OBJETIVO_TEXT).toContain('Recolecta arándanos maduros');
    expect(OBJETIVO_TEXT).toContain('Evita los pintones');
  });
});

/* ============================================================
   PAISAJE (§8)
   ============================================================ */
describe('Franja de paisaje', () => {
  it('el motor dibuja cielo, montañas y árboles', () => {
    calls.drawImage.length = 0;

    const engine = createEngine(1);
    engine.render();

    // El paisaje usa sprites del catálogo de entorno.
    const envSprites = [
      'env.sky', 'env.clouds', 'env.mountains',
      'env.treesTree1', 'env.treesTree2', 'env.treesTree3',
    ];

    envSprites.forEach((key) => {
      expect(ASSET_MANIFEST[key], `falta el asset ${key}`).toBeTruthy();
    });

    // Se dibuja bastantes veces (repetición horizontal + parallax).
    expect(calls.drawImage.length).toBeGreaterThan(5);
  });

  it('el motor guarda una franja de paisaje al cargar el nivel', () => {
    const engine = createEngine(1);

    expect(engine.landscapeLayout).toBeTruthy();
    expect(engine.landscapeLayout.height).toBeGreaterThan(0);
    expect(engine.landscapeLayout.skyHeight).toBeGreaterThan(0);
    expect(engine.landscapeLayout.mountainHeight).toBeGreaterThan(0);
  });
});

/* ============================================================
   CÁMARA Y ÁREA ÚTIL (§2, §7, §11)
   ============================================================ */
describe('Cámara reserva sitio para los HUD', () => {
  it('el área útil descuenta los dos HUD', () => {
    const engine = createEngine(1);

    const play = engine.camera.playHeight;

    expect(play).toBe(
      GAME_CONFIG.logicalHeight - GAME_CONFIG.hudHeight - GAME_CONFIG.hudBottomHeight
    );
    expect(play).toBeLessThan(GAME_CONFIG.logicalHeight);
  });

  it('el mundo del HUD se dibuja desplazado bajo el HUD superior', () => {
    calls.translate.length = 0;

    const engine = createEngine(1);
    engine.render();

    // La primera traslación del mundo incluye el alto del HUD superior.
    const worldShift = calls.translate.find((t) => t.x === 0 && t.y === engine.camera.worldOffsetY);
    expect(worldShift, 'el mundo no se desplaza bajo el HUD').toBeTruthy();
  });
});

/* ============================================================
   HUD RENDERER: piezas sueltas (§5, §6)
   ============================================================ */
describe('HudRenderer', () => {
  function makeHud() {
    const ctx = new global.HTMLCanvasElement().getContext('2d');
    const sprites = {
      ctx,
      // Se registran las llamadas para poder comprobarlas.
      drawText(t, x, y) { calls.fillText.push({ t, x, y }); },
      measureText: (t) => String(t).length * 4,
      draw() { return true; },
    };
    return new HudRenderer(sprites);
  }

  it('el contador de canasta muestra actual / capacidad', () => {
    calls.fillText.length = 0;
    const hud = makeHud();
    hud.drawBasketCounter(180, 100, 28, 50, false);

    const drawn = calls.fillText.map((c) => c.t);
    expect(drawn).toContain('28 / 50');
  });

  it('el contador refleja la canasta llena', () => {
    calls.fillText.length = 0;
    const hud = makeHud();
    hud.drawBasketCounter(180, 100, 50, 50, true);

    const drawn = calls.fillText.map((c) => c.t);
    expect(drawn).toContain('50 / 50');
  });

  it('la flecha de entrega usa el sprite del catálogo', () => {
    expect(ASSET_MANIFEST['ui.promptsDeliverArrow']).toBeTruthy();
  });

  it('el panel de vidas usa los 3 corazones del catálogo', () => {
    ['ui.heartFull', 'ui.heartMedium', 'ui.heartEmpty'].forEach((k) => {
      expect(ASSET_MANIFEST[k], `falta ${k}`).toBeTruthy();
    });
  });
});
