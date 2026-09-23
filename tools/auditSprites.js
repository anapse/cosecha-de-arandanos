/**
 * auditSprites.js — Mide cuánto OCUPA realmente cada sprite en su lienzo.
 *
 * El problema visual del juego viene de que las plantas son PNG de
 * 32x32 con mucho espacio transparente alrededor: al dibujarlas en su
 * tile, la mata se ve pequena y rodeada de tierra.
 *
 * Esta herramienta decodifica los PNG, cuenta los pixeles opacos y
 * saca el rectangulo que ocupa el dibujo. Asi se sabe, con numeros,
 * que sprites hay que redibujar y cuanto margen desperdician.
 *
 * Uso: node tools/auditSprites.js [carpeta]
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { inflateSync } from 'node:zlib';

const PUBLIC = 'public/assets';
const ROOT = process.argv[2] ?? PUBLIC;

/* ---------- Decodificador PNG mínimo (RGBA 8 bits) ---------- */
function decodePng(file) {
  const buf = readFileSync(file);
  let pos = 8;

  let width = 0;
  let height = 0;
  const idat = [];

  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }

    pos += 12 + len;
  }

  const raw = inflateSync(Buffer.concat(idat));
  const bpp = 4;
  const stride = width * bpp;
  const out = Buffer.alloc(height * stride);

  // Desfiltrado de los scanlines (filtros PNG 0..4)
  let rp = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = raw[rp];
    rp += 1;
    const rowStart = y * stride;

    for (let x = 0; x < stride; x += 1) {
      const rawByte = raw[rp + x];
      const left = x >= bpp ? out[rowStart + x - bpp] : 0;
      const up = y > 0 ? out[rowStart - stride + x] : 0;
      const upLeft = y > 0 && x >= bpp ? out[rowStart - stride + x - bpp] : 0;

      let val;
      switch (filter) {
        case 0: val = rawByte; break;
        case 1: val = rawByte + left; break;
        case 2: val = rawByte + up; break;
        case 3: val = rawByte + ((left + up) >> 1); break;
        case 4: {
          const p = left + up - upLeft;
          const pa = Math.abs(p - left);
          const pb = Math.abs(p - up);
          const pc = Math.abs(p - upLeft);
          const pred = pa <= pb && pa <= pc ? left : (pb <= pc ? up : upLeft);
          val = rawByte + pred;
          break;
        }
        default: val = rawByte;
      }

      out[rowStart + x] = val & 0xff;
    }

    rp += stride;
  }

  return { width, height, data: out };
}

/* ---------- Mide el contenido opaco ---------- */
function measure(png) {
  const { width, height, data } = png;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  let opaque = 0;
  let semi = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const a = data[(y * width + x) * 4 + 3];
      if (a > 200) {
        opaque += 1;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      } else if (a > 20) {
        semi += 1;
      }
    }
  }

  if (maxX < 0) {
    return { empty: true, width, height, coverage: 0 };
  }

  const contentW = maxX - minX + 1;
  const contentH = maxY - minY + 1;

  return {
    empty: false,
    width,
    height,
    box: { x: minX, y: minY, w: contentW, h: contentH },
    // % del lienzo que ocupa el dibujo (por area del rectangulo)
    coverage: (contentW * contentH) / (width * height),
    // % de pixeles realmente pintados
    fill: (opaque + semi * 0.5) / (width * height),
    // margenes desperdiciados
    marginL: minX,
    marginR: width - 1 - maxX,
    marginT: minY,
    marginB: height - 1 - maxY,
  };
}

/* ---------- Recorre los PNG ---------- */
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.toLowerCase().endsWith('.png')) out.push(p);
  }
  return out;
}

/* ---------- Informe ---------- */
const files = walk(ROOT).sort();
const rows = [];

for (const file of files) {
  let info;
  try {
    info = measure(decodePng(file));
  } catch (e) {
    console.log(`  ERROR ${file}: ${e.message}`);
    continue;
  }
  // Solo interesan los que tienen marco propio (no spritesheets)
  rows.push({ file: relative(ROOT, file).replace(/\\/g, '/'), ...info });
}

/* Los spritesheets (128x32) se analizan por frame de 32x32 aparte. */
const singles = rows.filter((r) => r.width === r.height || r.width === 32);

console.log('');
console.log('============================================================');
console.log('  AUDITORIA DE SPRITES — ocupacion real del lienzo');
console.log('============================================================');
console.log('');
console.log('  Si "ocupa" es bajo, el sprite desperdicia lienzo: al');
console.log('  dibujarlo se ve pequeno y rodeado de vacio.');
console.log('');

const byFolder = {};
for (const r of rows) {
  const folder = r.file.split('/')[0];
  (byFolder[folder] ??= []).push(r);
}

for (const [folder, list] of Object.entries(byFolder)) {
  console.log(`--- ${folder} ---`);

  const worst = list
    .filter((r) => !r.empty && r.width === r.height)
    .sort((a, b) => a.coverage - b.coverage);

  for (const r of worst.slice(0, 12)) {
    const pct = (r.coverage * 100).toFixed(0).padStart(3);
    const fill = (r.fill * 100).toFixed(0).padStart(3);
    const flag = r.coverage < 0.7 ? '  <-- DESPERDICIA LIENZO' : '';
    console.log(
      `  ${r.file.padEnd(42)} ${String(r.width).padStart(3)}x${String(r.height).padEnd(3)}` +
      `  ocupa ${pct}%  pintado ${fill}%  borde L${r.marginL}/R${r.marginR}/T${r.marginT}/B${r.marginB}${flag}`
    );
  }

  const libros = list.filter((r) => r.width !== r.height);
  if (libros.length) {
    console.log(`  (${libros.length} spritesheets de ${libros[0].width}x${libros[0].height})`);
  }
  console.log('');
}

/* Resumen */
const cuadrados = rows.filter((r) => r.width === r.height && !r.empty);
const malos = cuadrados.filter((r) => r.coverage < 0.7);
const media = cuadrados.reduce((s, r) => s + r.coverage, 0) / (cuadrados.length || 1);

console.log('------------------------------------------------------------');
console.log(`  Sprites cuadrados analizados : ${cuadrados.length}`);
console.log(`  Ocupacion media del lienzo   : ${(media * 100).toFixed(0)}%`);
console.log(`  Con menos del 70% de ocupacion: ${malos.length}`);
console.log('');
if (malos.length) {
  console.log('  Sprite(s) que hay que redibujar ocupando todo el lienzo:');
  malos
    .sort((a, b) => a.coverage - b.coverage)
    .forEach((r) => console.log(`    ${r.file}  (${(r.coverage * 100).toFixed(0)}%)`));
  console.log('');
}
console.log('============================================================');
console.log('');
