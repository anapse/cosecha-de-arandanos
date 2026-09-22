/**
 * previewSheet.js — Genera una lámina HTML de previsualización con
 * TODOS los sprites generados, para revisarlos de un vistazo.
 *
 * Uso: node tools/previewSheet.js
 * Salida: tools/preview.html (ábrelo en el navegador)
 *
 * Es una herramienta de trabajo: sirve para comprobar que el arte se
 * ve bien sobre fondo claro y oscuro, y que los tiles encajan.
 */

import { readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(__dirname, '..', 'public', 'assets');

const FOLDERS = [
  'player', 'supervisor', 'plants', 'fruits', 'terrain',
  'basket', 'truck', 'ui', 'effects', 'environment',
];

/** Escala de visualización: el pixel art se ve mejor ampliado. */
const SCALE = 4;

function buildSection(folder) {
  const dir = join(ASSETS, folder);
  if (!existsSync(dir)) return '';

  const files = readdirSync(dir).filter((f) => f.endsWith('.png')).sort();
  if (files.length === 0) return '';

  const items = files.map((file) => `
      <figure class="item">
        <img src="../public/assets/${folder}/${file}"
             style="width:auto;height:${SCALE * 32}px;image-rendering:pixelated"
             alt="${file}">
        <figcaption>${file.replace('.png', '')}</figcaption>
      </figure>`).join('');

  return `
  <section>
    <h2>${folder.toUpperCase()} <span class="count">${files.length}</span></h2>
    <div class="grid">${items}</div>
  </section>`;
}

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Sprites — Cosecha de Arándanos</title>
<style>
  :root { color-scheme: dark; }
  body {
    margin: 0; padding: 24px;
    background: #16281a; color: #e8f0e8;
    font-family: 'Segoe UI', system-ui, sans-serif;
  }
  h1 { font-size: 22px; margin: 0 0 4px; letter-spacing: .02em; }
  .sub { color: #8fa394; font-size: 13px; margin-bottom: 20px; }
  h2 {
    font-size: 14px; letter-spacing: .08em; text-transform: uppercase;
    color: #7ec8ff; border-bottom: 2px solid #2b4a5a;
    padding-bottom: 6px; margin: 26px 0 12px;
  }
  .count {
    background: #2a4a5a; color: #cfe0d2; font-size: 11px;
    padding: 2px 7px; border-radius: 9px; margin-left: 6px;
  }
  .grid { display: flex; flex-wrap: wrap; gap: 10px; }
  .item {
    margin: 0; padding: 8px; border-radius: 8px;
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    /* Mitad claro / mitad oscuro: comprueba que el alfa funciona */
    background:
      linear-gradient(135deg, #d8e4d0 0 50%, #24301f 50% 100%);
    border: 1px solid #3a5540;
    min-width: 76px;
  }
  img { image-rendering: pixelated; display: block; }
  figcaption {
    font-size: 9px; color: #cfe0d2; text-align: center;
    max-width: 92px; word-break: break-all; line-height: 1.3;
    text-shadow: 0 1px 2px rgba(0,0,0,.9);
  }
  .tiles .item { background: #1d2a18; }
</style>
</head>
<body>
  <h1>🫐 Sprites — Cosecha de Arándanos</h1>
  <p class="sub">
    Fondo dividido claro/oscuro para comprobar la transparencia.
    Escala ${SCALE}x, sin suavizado (pixel art nativo).
  </p>
  ${FOLDERS.map(buildSection).join('')}
</body>
</html>`;

writeFileSync(join(__dirname, 'preview.html'), html, 'utf8');
console.log('Lámina generada: tools/preview.html');
console.log('Ábrela en el navegador para revisar todos los sprites.');
