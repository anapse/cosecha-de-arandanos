/**
 * generateSprites.js — Genera TODOS los sprites del juego como PNG.
 *
 * Uso:
 *   node tools/generateSprites.js
 *
 * Salida: archivos .png reales dentro de public/assets/<carpeta>/
 * con los nombres EXACTOS de la referencia visual del proyecto.
 *
 * Los spritesheets se generan como tira HORIZONTAL de N frames, que es
 * el formato que espera el motor (frames en fila).
 *
 * No tiene dependencias externas: usa el codificador PNG propio
 * (tools/png.js, basado en zlib de Node) y el lienzo de pixel art
 * (tools/pixelCanvas.js).
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { encodePng } from './png.js';
import { PixelCanvas } from './pixelCanvas.js';
import { PAL } from './palette.js';
import { drawPlayerFrame, drawSupervisorFrame } from './artCharacters.js';
import * as W from './artWorld.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_ROOT = join(__dirname, '..', 'public', 'assets');

/* ---------- Contadores ---------- */
const stats = { files: 0, bytes: 0, byFolder: {} };

/** Guarda un PNG en disco. */
function save(folder, filename, canvas) {
  const dir = join(ASSETS_ROOT, folder);
  mkdirSync(dir, { recursive: true });

  const buffer = encodePng(canvas.toRgba(), canvas.width, canvas.height);
  writeFileSync(join(dir, filename), buffer);

  stats.files += 1;
  stats.bytes += buffer.length;
  stats.byFolder[folder] = (stats.byFolder[folder] ?? 0) + 1;
}

/**
 * Compone una TIRA HORIZONTAL de frames en un solo PNG.
 * @param {PixelCanvas[]} frames
 */
function strip(frames) {
  const fw = frames[0].width;
  const fh = frames[0].height;

  const sheet = new PixelCanvas(fw * frames.length, fh);
  frames.forEach((frame, i) => sheet.drawCanvas(frame, i * fw, 0));

  return sheet;
}

/**
 * Tira donde un frame se repite `times` veces.
 * Útil para dar movimiento a partir de una sola pose.
 */
function repeat(canvas, times) {
  return Array.from({ length: times }, () => canvas);
}

/* ============================================================
   01. PLAYER
   ============================================================ */
function generatePlayer() {
  const f = (o) => drawPlayerFrame(o);

  // Idle: 4 frames con respiración sutil
  save('player', 'player_idle.png', strip([
    f({ facing: 'down', variant: 0, state: 'idle' }),
    f({ facing: 'down', variant: 1, state: 'idle' }),
    f({ facing: 'down', variant: 2, state: 'idle' }),
    f({ facing: 'down', variant: 3, state: 'idle' }),
  ]));

  // Caminar en 4 direcciones: 4 frames cada una
  save('player', 'player_walk_down.png', strip([
    f({ facing: 'down', variant: 0, state: 'walk' }),
    f({ facing: 'down', variant: 1, state: 'walk' }),
    f({ facing: 'down', variant: 2, state: 'walk' }),
    f({ facing: 'down', variant: 3, state: 'walk' }),
  ]));

  save('player', 'player_walk_up.png', strip([
    f({ facing: 'up', variant: 0, state: 'walk' }),
    f({ facing: 'up', variant: 1, state: 'walk' }),
    f({ facing: 'up', variant: 2, state: 'walk' }),
    f({ facing: 'up', variant: 3, state: 'walk' }),
  ]));

  save('player', 'player_walk_left.png', strip([
    f({ facing: 'left', variant: 0, state: 'walk' }),
    f({ facing: 'left', variant: 1, state: 'walk' }),
    f({ facing: 'left', variant: 2, state: 'walk' }),
    f({ facing: 'left', variant: 3, state: 'walk' }),
  ]));

  save('player', 'player_walk_right.png', strip([
    f({ facing: 'right', variant: 0, state: 'walk' }),
    f({ facing: 'right', variant: 1, state: 'walk' }),
    f({ facing: 'right', variant: 2, state: 'walk' }),
    f({ facing: 'right', variant: 3, state: 'walk' }),
  ]));

  // Recoger izquierda / derecha: el brazo se extiende y vuelve (4 frames)
  save('player', 'player_harvest_left.png', strip([
    f({ facing: 'left', variant: 0, state: 'harvest', armSide: 'left', armReach: 0 }),
    f({ facing: 'left', variant: 0, state: 'harvest', armSide: 'left', armReach: 0.55 }),
    f({ facing: 'left', variant: 0, state: 'harvest', armSide: 'left', armReach: 1 }),
    f({ facing: 'left', variant: 0, state: 'harvest', armSide: 'left', armReach: 0.5 }),
  ]));

  save('player', 'player_harvest_right.png', strip([
    f({ facing: 'right', variant: 0, state: 'harvest', armSide: 'right', armReach: 0 }),
    f({ facing: 'right', variant: 0, state: 'harvest', armSide: 'right', armReach: 0.55 }),
    f({ facing: 'right', variant: 0, state: 'harvest', armSide: 'right', armReach: 1 }),
    f({ facing: 'right', variant: 0, state: 'harvest', armSide: 'right', armReach: 0.5 }),
  ]));

  // Estados extra
  save('player', 'player_wait.png', f({ facing: 'down', state: 'wait' }));
  save('player', 'player_full.png', f({ facing: 'down', state: 'full' }));
  save('player', 'player_tired.png', f({ facing: 'down', state: 'tired' }));
  save('player', 'player_error.png', f({ facing: 'down', state: 'error' }));
  save('player', 'player_victory.png', f({ facing: 'down', state: 'victory' }));
  save('player', 'player_defeat.png', f({ facing: 'down', state: 'defeat' }));
}

/* ============================================================
   02. SUPERVISOR
   ============================================================ */
function generateSupervisor() {
  const s = (o) => drawSupervisorFrame(o);

  save('supervisor', 'supervisor_idle.png', strip([
    s({ facing: 'down', variant: 0, state: 'idle' }),
    s({ facing: 'down', variant: 1, state: 'idle' }),
    s({ facing: 'down', variant: 2, state: 'idle' }),
    s({ facing: 'down', variant: 3, state: 'idle' }),
  ]));

  save('supervisor', 'supervisor_walk_down.png', strip([
    s({ facing: 'down', variant: 0, state: 'walk' }),
    s({ facing: 'down', variant: 1, state: 'walk' }),
    s({ facing: 'down', variant: 2, state: 'walk' }),
    s({ facing: 'down', variant: 3, state: 'walk' }),
  ]));

  save('supervisor', 'supervisor_walk_up.png', strip([
    s({ facing: 'up', variant: 0, state: 'walk' }),
    s({ facing: 'up', variant: 1, state: 'walk' }),
    s({ facing: 'up', variant: 2, state: 'walk' }),
    s({ facing: 'up', variant: 3, state: 'walk' }),
  ]));

  save('supervisor', 'supervisor_walk_left.png', strip([
    s({ facing: 'left', variant: 0, state: 'walk' }),
    s({ facing: 'left', variant: 1, state: 'walk' }),
    s({ facing: 'left', variant: 2, state: 'walk' }),
    s({ facing: 'left', variant: 3, state: 'walk' }),
  ]));

  save('supervisor', 'supervisor_walk_right.png', strip([
    s({ facing: 'right', variant: 0, state: 'walk' }),
    s({ facing: 'right', variant: 1, state: 'walk' }),
    s({ facing: 'right', variant: 2, state: 'walk' }),
    s({ facing: 'right', variant: 3, state: 'walk' }),
  ]));

  // Revisar: mira el portapapeles
  save('supervisor', 'supervisor_review.png', strip(repeat(
    s({ facing: 'down', variant: 0, state: 'review' }), 4
  )));

  // Anotar
  save('supervisor', 'supervisor_write.png', strip(repeat(
    s({ facing: 'down', variant: 0, state: 'write' }), 4
  )));

  // Detectar error
  save('supervisor', 'supervisor_detect_error.png', strip(repeat(
    s({ facing: 'down', variant: 0, state: 'detectError' }), 4
  )));

  // Aprobar
  save('supervisor', 'supervisor_approve.png', strip(repeat(
    s({ facing: 'down', variant: 0, state: 'approve' }), 4
  )));

  // Hablar
  save('supervisor', 'supervisor_talk.png', strip(repeat(
    s({ facing: 'down', variant: 0, state: 'talk' }), 4
  )));
}

/* ============================================================
   03. PLANTS
   ============================================================ */
function generatePlants() {
  // Vacía: solo follaje, sin frutos
  save('plants', 'plant_empty.png', W.drawPlant({ density: 0.5, berries: [] }));

  // Pocas: 1 fruto
  save('plants', 'plant_few.png', W.drawPlant({
    density: 0.65, berries: ['ripe'], seed: 2,
  }));

  // Media: 2 frutos
  save('plants', 'plant_medium.png', W.drawPlant({
    density: 0.8, berries: ['ripe', 'ripe'], seed: 3,
  }));

  // Abundante: 4 frutos
  save('plants', 'plant_abundant.png', W.drawPlant({
    density: 1, berries: ['ripe', 'ripe', 'ripe', 'ripe'], seed: 4,
  }));

  // Madura: solo frutos azules
  save('plants', 'plant_ripe.png', W.drawPlant({
    density: 0.9, berries: ['ripe', 'ripe', 'ripe'], seed: 5,
  }));

  // Pintona: solo frutos rosados
  save('plants', 'plant_unripe.png', W.drawPlant({
    density: 0.9, berries: ['unripe', 'unripe', 'unripe'], seed: 6,
  }));

  // Mixta: azules y rosados mezclados
  save('plants', 'plant_mixed.png', W.drawPlant({
    density: 0.95,
    berries: ['ripe', 'unripe', 'ripe', 'unripeGreen'],
    seed: 7,
  }));

  // Cosechada: follaje apagado, sin frutos
  save('plants', 'plant_harvested.png', W.drawPlant({
    density: 0.4, berries: [], harvested: true,
  }));
}

/* ============================================================
   04. FRUITS
   ============================================================ */
function generateFruits() {
  save('fruits', 'fruit_ripe.png', W.drawFruit('ripe'));
  save('fruits', 'fruit_unripe.png', W.drawFruit('unripe'));
  save('fruits', 'fruit_group_x2.png', W.drawFruitGroup(2));
  save('fruits', 'fruit_group_x3.png', W.drawFruitGroup(3));
  save('fruits', 'fruit_in_hand.png', W.drawFruitInHand());
  save('fruits', 'fruit_fall.png', W.drawFruitFall());
}

/* ============================================================
   05. TERRAIN
   ============================================================ */
function generateTerrain() {
  const tiles = [
    'ground_soil', 'path_vertical', 'path_horizontal', 'path_corner',
    'path_intersection', 'grass', 'grass_edge', 'fence_horizontal',
    'fence_vertical', 'fence_corner', 'delivery_zone', 'delivery_marker',
    'ground_detail', 'rock', 'flower',
  ];

  tiles.forEach((name) => {
    save('terrain', `${name}.png`, W.drawTerrain(name));
  });
}

/* ============================================================
   06. BASKET / BOXES / TRUCK
   ============================================================ */
function generateBasketAndTruck() {
  save('basket', 'basket_empty.png', W.drawBasket(0));
  save('basket', 'basket_low.png', W.drawBasket(0.3));
  save('basket', 'basket_medium.png', W.drawBasket(0.6));
  save('basket', 'basket_full.png', W.drawBasket(1));

  save('basket', 'box_empty.png', W.drawBox(false, false));
  save('basket', 'box_filled.png', W.drawBox(true, false));
  save('basket', 'box_stack.png', W.drawBox(false, true));
  save('basket', 'box_on_truck.png', W.drawBoxOnTruck());

  save('truck', 'truck_side.png', W.drawTruck(false));
  save('truck', 'truck_loaded.png', W.drawTruck(true));
}

/* ============================================================
   07. UI
   ============================================================ */
function generateUi() {
  save('ui', 'heart_full.png', W.drawHeart('full'));
  save('ui', 'heart_medium.png', W.drawHeart('medium'));
  save('ui', 'heart_empty.png', W.drawHeart('empty'));
  save('ui', 'icon_blueberry.png', W.drawIconBlueberry());
  save('ui', 'icon_time.png', W.drawIconTime());
  save('ui', 'quality_bar.png', W.drawQualityBar());
  save('ui', 'progress_bar.png', W.drawProgressBar());
  save('ui', 'button_pause.png', W.drawButtonPause());
  save('ui', 'button_play.png', W.drawButton('play'));
  save('ui', 'button_continue.png', W.drawButton('continue'));
  save('ui', 'button_restart.png', W.drawButton('restart'));
  save('ui', 'panel_frame.png', W.drawPanelFrame());
}

/* ============================================================
   08. EFFECTS
   ============================================================ */
function generateEffects() {
  // Partículas: 4 frames cada una
  save('effects', 'particle_harvest.png', strip([
    W.drawHarvestParticle(0), W.drawHarvestParticle(1),
    W.drawHarvestParticle(2), W.drawHarvestParticle(3),
  ]));

  save('effects', 'particle_error.png', strip([
    W.drawErrorParticle(0), W.drawErrorParticle(1),
    W.drawErrorParticle(2), W.drawErrorParticle(3),
  ]));

  save('effects', 'inspect_flash.png', W.drawInspectFlash());
  save('effects', 'leaf.png', W.drawLeaf());
  save('effects', 'text_plus10.png', W.drawTextPlus10());
  save('effects', 'text_error.png', W.drawTextError());
  save('effects', 'shadow_player.png', W.drawShadowPlayer());
  save('effects', 'shadow_supervisor.png', W.drawShadowSupervisor());
  save('effects', 'selection.png', W.drawSelection());
}

/* ============================================================
   09. ENVIRONMENT
   ============================================================ */
function generateEnvironment() {
  save('environment', 'sky.png', W.drawSky());
  save('environment', 'clouds.png', W.drawClouds());
  save('environment', 'mountains.png', W.drawMountains());
  save('environment', 'tree_01.png', W.drawTree(1));
  save('environment', 'tree_02.png', W.drawTree(2));
  save('environment', 'tree_03.png', W.drawTree(3));
  save('environment', 'sign_fundo.png', W.drawSignFundo());
  save('environment', 'sign_grupo.png', W.drawSignGrupo());
  save('environment', 'bush.png', W.drawBush());
  save('environment', 'rock_large.png', W.drawRockLarge());
  save('environment', 'grass_detail2.png', W.drawGrassDetail2());
  save('environment', 'flowers.png', W.drawFlowers());
}

/* ============================================================
   EJECUCIÓN
   ============================================================ */
function main() {
  console.log('Generando sprites de COSECHA DE ARANDANOS...\n');

  generatePlayer();
  generateSupervisor();
  generatePlants();
  generateFruits();
  generateTerrain();
  generateBasketAndTruck();
  generateUi();
  generateEffects();
  generateEnvironment();

  console.log('Por carpeta:');
  Object.entries(stats.byFolder)
    .sort()
    .forEach(([folder, count]) => {
      console.log(`  ${folder.padEnd(14)} ${String(count).padStart(3)} archivos`);
    });

  console.log('');
  console.log(`TOTAL: ${stats.files} archivos PNG`);
  console.log(`Tamano total: ${(stats.bytes / 1024).toFixed(1)} KB`);
  console.log(`Destino: public/assets/`);
}

main();
