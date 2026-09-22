/**
 * math.js — Utilidades matemáticas y de aleatoriedad.
 * Separadas aquí para que el motor no dependa de librerías externas.
 */

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const lerp = (a, b, t) => a + (b - a) * t;

export const inverseLerp = (a, b, v) => (b === a ? 0 : (v - a) / (b - a));

/** Acerca un valor a otro de forma exponencial e independiente del framerate. */
export function damp(current, target, lambda, dt) {
  return lerp(current, target, 1 - Math.exp(-lambda * dt));
}

export const distance = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);

export const distanceSq = (ax, ay, bx, by) => {
  const dx = bx - ax;
  const dy = by - ay;
  return dx * dx + dy * dy;
};

/** Aleatorio decimal [0, 1) usando un PRNG inyectable (repetibilidad por semilla). */
export function rand(rng = Math.random) {
  return rng();
}

export function randInt(min, max, rng = Math.random) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function randRange(min, max, rng = Math.random) {
  return rng() * (max - min) + min;
}

export function pick(array, rng = Math.random) {
  return array[Math.floor(rng() * array.length)];
}

/** Elige un elemento según pesos: [{ value, weight }] */
export function weightedPick(items, rng = Math.random) {
  const total = items.reduce((sum, it) => sum + it.weight, 0);
  let roll = rng() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item.value ?? item;
  }
  return items[items.length - 1].value ?? items[items.length - 1];
}

/** Formatea segundos como MM:SS (§21, §34). */
export function formatTime(seconds) {
  const safe = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Crea un PRNG determinista (mulberry32).
 * Permite generar el mismo mapa a partir de una semilla, útil para
 * depurar y para futuros récords reproducibles.
 */
export function createRng(seed = Date.now()) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Rectángulos AABB: { x, y, w, h } */
export function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

export function rectContains(outer, inner) {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.w <= outer.x + outer.w &&
    inner.y + inner.h <= outer.y + outer.h
  );
}
