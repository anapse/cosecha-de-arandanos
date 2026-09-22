/**
 * generateSprites.js — Genera TODOS los sprites del juego como PNG.
 *
 * Uso:
 *   node tools/generateSprites.js
 *
 * Salida: archivos .png dentro de public/assets/<categoría>/<subcarpeta>/
 * siguiendo la estructura OFICIAL del proyecto (tools/assetPaths.js).
 *
 * Los spritesheets se generan como tira HORIZONTAL de N frames, que es
 * el formato que espera el motor (frames en fila).
 *
 * Sin dependencias externas: usa el codificador PNG propio
 * (tools/png.js, basado en zlib de Node) y el lienzo de pixel art
 * (tools/pixelCanvas.js).
 */

import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { encodePng } from './png.js';
import { PixelCanvas } from './pixelCanvas.js';
import { PAL } from './palette.js';
import { drawPlayerFrame, drawSupervisorFrame } from './artCharacters.js';
import * as W from './artWorld.js';
import * as P from './artPlants.js';
import * as HUD from './artHud.js';
import { ASSET_FOLDERS } from './assetPaths.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_ROOT = join(__dirname, '..', 'public', 'assets');

/* ---------- Estadísticas ---------- */
const stats = { files: 0, bytes: 0, byFolder: {} };

/** Guarda un PNG en disco dentro de una carpeta de la estructura. */
function save(group, filename, canvas) {
  const folder = ASSET_FOLDERS[group] ?? group;
  const dir = join(ASSETS_ROOT, folder);
  mkdirSync(dir, { recursive: true });

  const buffer = encodePng(canvas.toRgba(), canvas.width, canvas.height);
  writeFileSync(join(dir, filename), buffer);

  stats.files += 1;
  stats.bytes += buffer.length;
  stats.byFolder[folder] = (stats.byFolder[folder] ?? 0) + 1;
}

/** Compone una TIRA HORIZONTAL de frames en un solo PNG. */
function strip(frames) {
  const fw = frames[0].width;
  const fh = frames[0].height;
  const sheet = new PixelCanvas(fw * frames.length, fh);
  frames.forEach((frame, i) => sheet.drawCanvas(frame, i * fw, 0));
  return sheet;
}

/** Tira donde un frame se repite `times` veces. */
function repeat(canvas, times) {
  return Array.from({ length: times }, () => canvas);
}

/* ============================================================
   01. PLAYER
   ============================================================ */
function generatePlayer() {
  const f = (o) => drawPlayerFrame(o);

  save('player.idle', 'player_idle.png', strip([
    f({ facing: 'down', variant: 0, state: 'idle' }),
    f({ facing: 'down', variant: 1, state: 'idle' }),
    f({ facing: 'down', variant: 2, state: 'idle' }),
    f({ facing: 'down', variant: 3, state: 'idle' }),
  ]));

  save('player.walk', 'player_walk_down.png', strip([
    f({ facing: 'down', variant: 0, state: 'walk' }),
    f({ facing: 'down', variant: 1, state: 'walk' }),
    f({ facing: 'down', variant: 2, state: 'walk' }),
    f({ facing: 'down', variant: 3, state: 'walk' }),
  ]));

  save('player.walk', 'player_walk_up.png', strip([
    f({ facing: 'up', variant: 0, state: 'walk' }),
    f({ facing: 'up', variant: 1, state: 'walk' }),
    f({ facing: 'up', variant: 2, state: 'walk' }),
    f({ facing: 'up', variant: 3, state: 'walk' }),
  ]));

  save('player.walk', 'player_walk_left.png', strip([
    f({ facing: 'left', variant: 0, state: 'walk' }),
    f({ facing: 'left', variant: 1, state: 'walk' }),
    f({ facing: 'left', variant: 2, state: 'walk' }),
    f({ facing: 'left', variant: 3, state: 'walk' }),
  ]));

  save('player.walk', 'player_walk_right.png', strip([
    f({ facing: 'right', variant: 0, state: 'walk' }),
    f({ facing: 'right', variant: 1, state: 'walk' }),
    f({ facing: 'right', variant: 2, state: 'walk' }),
    f({ facing: 'right', variant: 3, state: 'walk' }),
  ]));

  save('player.harvest', 'player_harvest_left.png', strip([
    f({ facing: 'left', state: 'harvest', armSide: 'left', armReach: 0 }),
    f({ facing: 'left', state: 'harvest', armSide: 'left', armReach: 0.55 }),
    f({ facing: 'left', state: 'harvest', armSide: 'left', armReach: 1 }),
    f({ facing: 'left', state: 'harvest', armSide: 'left', armReach: 0.5 }),
  ]));

  save('player.harvest', 'player_harvest_right.png', strip([
    f({ facing: 'right', state: 'harvest', armSide: 'right', armReach: 0 }),
    f({ facing: 'right', state: 'harvest', armSide: 'right', armReach: 0.55 }),
    f({ facing: 'right', state: 'harvest', armSide: 'right', armReach: 1 }),
    f({ facing: 'right', state: 'harvest', armSide: 'right', armReach: 0.5 }),
  ]));

  save('player.states', 'player_wait.png', f({ facing: 'down', state: 'wait' }));
  save('player.states', 'player_full.png', f({ facing: 'down', state: 'full' }));
  save('player.states', 'player_tired.png', f({ facing: 'down', state: 'tired' }));
  save('player.states', 'player_error.png', f({ facing: 'down', state: 'error' }));
  save('player.states', 'player_victory.png', f({ facing: 'down', state: 'victory' }));
  save('player.states', 'player_defeat.png', f({ facing: 'down', state: 'defeat' }));
}

/* ============================================================
   02. SUPERVISOR
   ============================================================ */
function generateSupervisor() {
  const s = (o) => drawSupervisorFrame(o);

  const walkStrip = (facing) => strip([
    s({ facing, variant: 0, state: 'walk' }),
    s({ facing, variant: 1, state: 'walk' }),
    s({ facing, variant: 2, state: 'walk' }),
    s({ facing, variant: 3, state: 'walk' }),
  ]);

  save('supervisor.walk', 'supervisor_walk_down.png', walkStrip('down'));
  save('supervisor.walk', 'supervisor_walk_up.png', walkStrip('up'));
  save('supervisor.walk', 'supervisor_walk_left.png', walkStrip('left'));
  save('supervisor.walk', 'supervisor_walk_right.png', walkStrip('right'));

  save('supervisor.inspection', 'supervisor_review.png', strip(repeat(
    s({ facing: 'down', variant: 0, state: 'review' }), 4
  )));
  save('supervisor.inspection', 'supervisor_write.png', strip(repeat(
    s({ facing: 'down', variant: 0, state: 'write' }), 4
  )));
  save('supervisor.inspection', 'supervisor_detect_error.png', strip(repeat(
    s({ facing: 'down', variant: 0, state: 'detectError' }), 4
  )));
  save('supervisor.inspection', 'supervisor_approve.png', strip(repeat(
    s({ facing: 'down', variant: 0, state: 'approve' }), 4
  )));

  save('supervisor.states', 'supervisor_talk.png', strip(repeat(
    s({ facing: 'down', variant: 0, state: 'talk' }), 4
  )));
}

/* ============================================================
   03. PLANTS — las 8 variantes + base y fila
   ============================================================ */
function generatePlants() {
  const variants = P.buildPlantVariants();
  Object.entries(variants).forEach(([name, canvas]) => {
    save('plants', `${name}.png`, canvas);
  });

  // Base sin frutos (para la arquitectura planta + frutos)
  save('plants', 'plant_base.png', P.drawPlantBase({ density: 0.9, seed: 1 }));

  // Fila de cultivo alta (dos plantas apiladas) — setos tupidos
  save('plants', 'plant_row.png', P.drawPlantRow(3));
}

/* ============================================================
   04. FRUITS
   ============================================================ */
function generateFruits() {
  // Maduro y pintón CON aro de resalte (los recogibles)
  save('fruits', 'fruit_ripe.png', P.drawFruit('ripe', { highlightRing: true }));
  save('fruits', 'fruit_unripe.png', P.drawFruit('unripe', { highlightRing: false }));

  // Sin aro (para colocar sobre las plantas sin el resalte)
  save('fruits', 'fruit_ripe_plain.png', P.drawFruit('ripe', { highlightRing: false }));
  save('fruits', 'fruit_unripe_green.png', P.drawFruit('unripeGreen', { highlightRing: false }));

  save('fruits', 'fruit_group_x2.png', P.drawFruitGroup(2));
  save('fruits', 'fruit_group_x3.png', P.drawFruitGroup(3));
  save('fruits', 'fruit_in_hand.png', P.drawFruitInHand());
  save('fruits', 'fruit_fall.png', P.drawFruitFall());
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
  save('basket', 'truck_side.png', W.drawTruck(false));
  save('basket', 'truck_loaded.png', W.drawTruck(true));
}

/* ============================================================
   07. UI
   ============================================================ */
function generateUi() {
  /* ---- icons ---- */
  save('ui.icons', 'heart_full.png', HUD.drawHeart('full'));
  save('ui.icons', 'heart_medium.png', HUD.drawHeart('medium'));
  save('ui.icons', 'heart_empty.png', HUD.drawHeart('empty'));
  save('ui.icons', 'icon_blueberry.png', HUD.drawIconBlueberry(16));
  save('ui.icons', 'icon_time.png', HUD.drawIconTime());
  save('ui.icons', 'icon_unripe.png', HUD.drawIconUnripe());
  save('ui.icons', 'icon_error.png', HUD.drawIconError());
  save('ui.icons', 'icon_alert.png', HUD.drawIconAlert());
  save('ui.icons', 'icon_check.png', HUD.drawIconCheck());

  /* ---- bars ---- */
  save('ui.bars', 'bar_track.png', HUD.drawBarTrack(64, 10));
  save('ui.bars', 'bar_fill_green.png', HUD.drawBarFill(64, 8, 'green'));
  save('ui.bars', 'bar_fill_yellow.png', HUD.drawBarFill(64, 8, 'yellow'));
  save('ui.bars', 'bar_fill_red.png', HUD.drawBarFill(64, 8, 'red'));
  save('ui.bars', 'bar_fill_blue.png', HUD.drawBarFill(64, 8, 'blue'));
  save('ui.bars', 'quality_bar.png', HUD.drawQualityBar(64, 8));
  save('ui.bars', 'progress_bar.png', HUD.drawBarTrack(64, 8));

  /* ---- buttons ---- */
  save('ui.buttons', 'button_pause.png', HUD.drawButton('pause', 32));
  save('ui.buttons', 'button_play.png', HUD.drawButton('play', 32));
  save('ui.buttons', 'button_continue.png', HUD.drawButton('continue', 32));
  save('ui.buttons', 'button_restart.png', HUD.drawButton('restart', 32));

  /* ---- panels ---- */
  save('ui.panels', 'panel_frame.png', HUD.drawWoodPanel(64, 40));
  save('ui.panels', 'panel_hud.png', HUD.drawHudPanel(96, 56));
  save('ui.panels', 'panel_hud_small.png', HUD.drawHudPanel(64, 32));
  save('ui.panels', 'panel_legend.png', HUD.drawLegendPanel(64, 78));

  /* ---- prompts ---- */
  save('ui.prompts', 'prompt_deliver_arrow.png', HUD.drawDeliverArrow());
  save('ui.prompts', 'prompt_selection.png', HUD.drawSelection(32));
  save('ui.prompts', 'prompt_speech_bubble.png', HUD.drawSpeechBubble(64, 24));

  /* ---- hud (elementos compuestos del HUD) ---- */
  save('ui.hud', 'hud_logo_panel.png', HUD.drawWoodPanel(110, 44));
  save('ui.hud', 'hud_logo_berry.png', HUD.drawIconBlueberry(32));
}

/* ============================================================
   08. EFFECTS
   ============================================================ */
function generateEffects() {
  /* ---- harvest (partícula de recogida) ---- */
  save('effects.harvest', 'particle_harvest.png', strip([
    W.drawHarvestParticle(0), W.drawHarvestParticle(1),
    W.drawHarvestParticle(2), W.drawHarvestParticle(3),
  ]));

  /* ---- error ---- */
  save('effects.error', 'particle_error.png', strip([
    W.drawErrorParticle(0), W.drawErrorParticle(1),
    W.drawErrorParticle(2), W.drawErrorParticle(3),
  ]));
  save('effects.error', 'text_error.png', W.drawTextError());

  /* ---- inspection ---- */
  save('effects.inspection', 'inspect_flash.png', W.drawInspectFlash());

  /* ---- particles ---- */
  save('effects.particles', 'leaf.png', W.drawLeaf());

  /* ---- shadows ---- */
  save('effects.shadows', 'shadow_player.png', W.drawShadowPlayer());
  save('effects.shadows', 'shadow_supervisor.png', W.drawShadowSupervisor());

  /* ---- floating-text ---- */
  save('effects.floatingText', 'text_plus10.png', W.drawTextPlus10());
}

/* ============================================================
   09. ENVIRONMENT
   ============================================================ */
function generateEnvironment() {
  save('environment.sky', 'sky.png', W.drawSky());
  save('environment.clouds', 'clouds.png', W.drawClouds());
  save('environment.mountains', 'mountains.png', W.drawMountains());

  save('environment.trees', 'tree_01.png', W.drawTree(1));
  save('environment.trees', 'tree_02.png', W.drawTree(2));
  save('environment.trees', 'tree_03.png', W.drawTree(3));
  save('environment.trees', 'bush.png', W.drawBush());

  save('environment.signs', 'sign_fundo.png', W.drawSignFundo());
  save('environment.signs', 'sign_grupo.png', W.drawSignGrupo());

  save('environment.decorations', 'rock_large.png', W.drawRockLarge());
  save('environment.decorations', 'grass_detail2.png', W.drawGrassDetail2());
  save('environment.decorations', 'flowers.png', W.drawFlowers());
}

/* ============================================================
   EJECUCIÓN
   ============================================================ */
function main() {
  console.log('Generando sprites de COSECHA DE ARANDANOS...\n');

  // Se limpia la carpeta de assets (excepto sounds) para que no queden
  // archivos de estructuras anteriores.
  const soundsDir = join(ASSETS_ROOT, 'sounds');
  const soundsBackup = existsSync(soundsDir);

  if (existsSync(ASSETS_ROOT)) {
    const keep = ['ASSETS.md', 'ASSET_MANIFEST.md'];
    rmSync(ASSETS_ROOT, { recursive: true, force: true });
    mkdirSync(ASSETS_ROOT, { recursive: true });
    // Restaurar la carpeta de sonidos (los .wav son del usuario)
    if (soundsBackup) mkdirSync(soundsDir, { recursive: true });
    keep.forEach(() => {}); // los .md los reescribe el repo
  }

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
      console.log(`  ${folder.padEnd(28)} ${String(count).padStart(3)} archivos`);
    });

  console.log('');
  console.log(`TOTAL: ${stats.files} archivos PNG`);
  console.log(`Tamano total: ${(stats.bytes / 1024).toFixed(1)} KB`);
  console.log('Destino: public/assets/');
}

main();
