/**
 * visualCheck.js — Verificación visual por consola.
 *
 * Renderiza frames reales del motor en un canvas simulado y VOLCADA a
 * texto qué se dibuja en cada zona de la pantalla. Sirve para
 * comprobar la composición (HUD arriba, paisaje, campo, entrega, HUD
 * abajo) sin depender de capturas de pantalla.
 *
 * Uso:  node tools/visualCheck.js
 *
 * No forma parte del juego: es una herramienta de revisión.
 */

import { GameEngine } from '../src/game/GameEngine.js';
import { GAME_CONFIG } from '../src/game/config/gameConfig.js';

/* ---------- Canvas simulado que registra TODO ---------- */
const log = {
  images: [],
  texts: [],
  rects: [],
};

function makeCtx() {
  return {
    canvas: null,
    save() {}, restore() {},
    translate() {}, scale() {}, rotate() {}, setTransform() {},
    drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh) {
      log.images.push({ w: img?.width, dx, dy, dw, dh, key: img?.__key });
    },
    fillRect(x, y, w, h) { log.rects.push({ x, y, w, h }); },
    clearRect() {}, strokeRect() {},
    beginPath() {}, closePath() {}, moveTo() {}, lineTo() {},
    arc() {}, ellipse() {}, rect() {}, fill() {}, stroke() {},
    fillText(t, x, y) { log.texts.push({ t, x, y }); },
    strokeText() {},
    measureText: (t) => ({ width: String(t).length * 4 }),
    createLinearGradient: () => ({ addColorStop() {} }),
    getImageData: () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 }),
    putImageData() {},
    fillStyle: '', strokeStyle: '', globalAlpha: 1, font: '',
    textAlign: '', textBaseline: '', imageSmoothingEnabled: false, lineWidth: 1,
  };
}

globalThis.HTMLCanvasElement = class {
  constructor() {
    this.width = 360;
    this.height = 640;
    this.style = {};
    this._c = null;
  }
  getContext() {
    if (!this._c) {
      const c = makeCtx();
      c.canvas = this;
      this._c = c;
    }
    return this._c;
  }
  getBoundingClientRect() {
    return { left: 0, top: 0, width: 360, height: 640, right: 360, bottom: 640 };
  }
  addEventListener() {}
  removeEventListener() {}
  get clientWidth() { return this.width; }
  get clientHeight() { return this.height; }
};

globalThis.document = {
  createElement: (t) =>
    t === 'canvas' ? new HTMLCanvasElement() : { style: {}, appendChild() {} },
};
globalThis.performance = globalThis.performance ?? { now: () => 0 };

/* ---------- Render ---------- */
const engine = new GameEngine({ canvas: new HTMLCanvasElement() });
engine.resize();
engine.loadLevel(1, { seed: 20260101 });

// Se avanza un poco para que haya animación y estado reales.
for (let i = 0; i < 60; i += 1) engine.update(1 / 60);

log.images.length = 0;
log.texts.length = 0;
log.rects.length = 0;
engine.render();

/* ---------- Informe ---------- */
const C = GAME_CONFIG;
const H = C.logicalHeight;
const topHud = C.hudHeight;
const bottomHudTop = H - C.hudBottomHeight;

const line = (s = '') => console.log(s);
const rule = (ch = '─', n = 62) => console.log(ch.repeat(n));

line();
rule('═');
line('  VERIFICACIÓN VISUAL — Cosecha de Arándanos (nivel 1)');
rule('═');
line();

line(`Viewport lógico: ${C.logicalWidth} x ${C.logicalHeight}`);
line(`HUD superior:    y 0..${topHud}`);
line(`HUD inferior:    y ${bottomHudTop}..${H}   (alto ${C.hudBottomHeight})`);
line(`Franja de campo: y ${topHud}..${bottomHudTop}   (alto ${bottomHudTop - topHud})`);
line();

/* ---- 1. HUD superior ---- */
rule();
line('1. HUD SUPERIOR');
rule();
const topTexts = log.texts.filter((t) => t.y < topHud);
const wanted = [
  'COSECHA DE', 'ARÁNDANOS', 'FUNDO SAN JORGE - ICA',
  'NIVEL:', 'TIEMPO:', 'COSECHADOS:', 'ERRORES:', 'OBJETIVO:',
];
wanted.forEach((w) => {
  const found = topTexts.some((t) => t.t.includes(w));
  line(`  ${found ? '✓' : '✗'} ${w}`);
});
line(`  (${topTexts.length} textos dibujados en la franja)`);

/* ---- 2. Leyenda ---- */
rule();
line('2. LEYENDA DE FRUTOS');
rule();
const legendWords = ['Maduro', 'Pintón', 'Error', '(Recoge)', '(No recoger)', '(Baja puntos)'];
const allText = log.texts.map((t) => t.t);
legendWords.forEach((w) => {
  const found = allText.some((t) => t.includes(w));
  line(`  ${found ? '✓' : '✗'} ${w}`);
});

/* ---- 3. Paisaje ---- */
rule();
line('3. PAISAJE (cielo / montañas / árboles)');
rule();
// Los sprites de entorno se dibujan arriba del mundo.
const envDrawn = log.images.filter((i) => i.dy !== undefined && i.dy < 140);
line(`  Sprites de entorno dibujados en la franja alta: ${envDrawn.length}`);
line(`  ${envDrawn.length > 3 ? '✓' : '✗'} franja de paisaje presente`);

/* ---- 4. Campo ---- */
rule();
line('4. CAMPO');
rule();
line(`  Sprites totales dibujados: ${log.images.length}`);
const tiles = log.images.filter((i) => i.dw === 32);
line(`  Tiles/sprites de 32px (suelo, plantas): ${tiles.length}`);

/* ---- 5. HUD inferior ---- */
rule();
line('5. HUD INFERIOR');
rule();
const bottomTexts = log.texts.filter((t) => t.y >= bottomHudTop - 30);
const bottomWanted = ['VIDAS:', 'PUNTUACIÓN:', 'SIGUIENTE REVISIÓN:'];
bottomWanted.forEach((w) => {
  const found = log.texts.some((t) => t.t.includes(w));
  line(`  ${found ? '✓' : '✗'} ${w}`);
});
line(`  (${bottomTexts.length} textos en la franja inferior)`);

/* ---- 6. Solapamiento ---- */
rule();
line('6. COMPROBACIÓN DE SOLAPAMIENTO');
rule();

/**
 * El helper text() dibuja cada cadena DOS veces (sombra + principal),
 * así que hay que agrupar por posición aproximada antes de contar.
 */
function uniqueTexts(list) {
  const seen = new Map();
  list.forEach((t) => {
    const key = `${t.t}@${Math.round(t.x)},${Math.round(t.y)}`;
    if (!seen.has(key)) seen.set(key, t);
  });
  return [...seen.values()];
}

const fieldTop = topHud;
const fieldBottom = bottomHudTop;

// Textos que caen en la franja del campo.
const inField = uniqueTexts(
  log.texts.filter((t) => t.y > fieldTop && t.y < fieldBottom)
);

// La leyenda SÍ vive sobre el campo (esquina superior derecha, como en
// la referencia). Se separa del resto para no contarla como error.
const LEGEND_WORDS = ['Maduro', 'Pintón', 'Error', '(Recoge)', '(No recoger)', '(Baja puntos)'];
const legendTexts = inField.filter((t) => LEGEND_WORDS.some((w) => t.t.includes(w)));
const otherTexts = inField.filter((t) => !LEGEND_WORDS.some((w) => t.t.includes(w)));

line(`  Leyenda sobre el campo: ${legendTexts.length} textos (intencional, §3)`);
line(`  Otros textos sobre el campo: ${otherTexts.length}`);

if (otherTexts.length) {
  otherTexts.slice(0, 10).forEach((t) => line(`     "${t.t}" en y=${Math.round(t.y)}`));
}

line(
  `  ${otherTexts.length === 0
    ? '✓ campo despejado (solo la leyenda)'
    : '⚠ hay textos de HUD tapando el campo'}`
);

/* ---- 7. Estado del motor ---- */
rule();
line('7. MOTOR');
rule();
line(`  Jugador:    x=${Math.round(engine.player.x)} y=${Math.round(engine.player.y)}`);
line(`  Plantas:    ${engine.plants.length}`);
line(`  Frutos:     ${engine.plants.reduce((s, p) => s + p.remainingFruits, 0)}`);
line(`  Canasta:    ${engine.basket.current}/${engine.basket.capacity}`);
line(`  Mundo:      ${engine.map.width} x ${engine.map.height}`);
line(`  Franja vis: ${JSON.stringify(engine.camera.viewRect)}`);
line(`  Despl. HUD: ${engine.camera.worldOffsetY}`);
line();
rule('═');
line();
