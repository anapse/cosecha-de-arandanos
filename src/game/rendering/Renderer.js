/**
 * Renderer.js
 * ---------------------------------------------------------------
 * Dibuja el mundo y el HUD en el canvas.
 *
 * Reglas de rendimiento (§34, §41):
 *   - Solo se dibujan tiles y entidades VISIBLES (culling por cámara).
 *   - El HUD se dibuja con rectángulos, no con imágenes escaladas.
 *   - Cero asignaciones pesadas dentro del bucle de dibujo.
 *
 * Orden de dibujo (de atrás hacia delante):
 *   1. Terreno (tiles)
 *   2. Zona de entrega / decoración de suelo
 *   3. Entidades ordenadas por Y (jugador, plantas, supervisor, cajas)
 *   4. Efectos (partículas, textos flotantes)
 *   5. HUD (en coordenadas de pantalla)
 */

import { TILE_SIZE, TILE_TYPES, BASKET_STATES } from './renderConstants.js';
import { PALETTE, withAlpha } from '../../utils/colors.js';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { formatTime } from '../../utils/math.js';

export class Renderer {
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {import('./SpriteRenderer.js').SpriteRenderer} sprites
   */
  constructor(ctx, sprites) {
    this.ctx = ctx;
    this.sprites = sprites;
    this.width = GAME_CONFIG.logicalWidth;
    this.height = GAME_CONFIG.logicalHeight;
    this.viewWidth = this.width;
    this.viewHeight = this.height;
  }

  /** Ajusta el tamaño lógico (por si cambia la configuración). */
  resize(width, height) {
    this.width = width;
    this.height = height;
    this.viewWidth = width;
    this.viewHeight = height;
  }

  /** Limpia el frame completo. */
  clear() {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.fillStyle = PALETTE.soilDark;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /* ============================================================
     MUNDO
     ============================================================ */

  /**
   * Dibuja el terreno visible.
   * @param {import('../map/TileMap.js').TileMap} tileMap
   * @param {import('./Camera.js').Camera} camera
   */
  /**
   * Dibuja el terreno del campo: suelo uniforme de arena cálida,
   * surcos de cultivo alineados bajo las 5 hileras y bordes de césped limpios.
   * Sin mosaicos desiguales ni texturas discordantes.
   * @param {import('../map/TileMap.js').TileMap} tileMap
   * @param {import('./Camera.js').Camera} camera
   */
  drawTerrain(tileMap, camera) {
    const ts = tileMap.tileSize;
    const width = tileMap.pixelWidth;
    const height = tileMap.pixelHeight;
    const ctx = this.ctx;
    const fieldTopY = 3 * ts; // Empieza debajo del paisaje superior (144px)
    const plantTopY = 4 * ts; // Inicio de las plantas (192px)
    const plantBottomY = 10 * ts; // Fin de hileras de plantas más cortas (480px)
    const deliveryTopY = 11 * ts; // Inicio zona de entrega amplia (528px)

    // 1. Suelo base uniforme y limpio de tierra/arena cálida de Ica
    ctx.fillStyle = PALETTE.soil;
    ctx.fillRect(0, fieldTopY, width, height - fieldTopY);

    // 2. Lechos de cultivo bajo las 4 hileras más cortas (columnas 1, 3, 5, 7)
    // Se dibujan estrictamente entre plantTopY (192px) y plantBottomY (480px)
    const plantCols = [1, 3, 5, 7];
    plantCols.forEach((col) => {
      const bx = col * ts;
      // Camellón de cultivo enriquecido más oscuro
      ctx.fillStyle = '#c58d4e';
      ctx.fillRect(bx - 4, plantTopY - 4, ts + 8, plantBottomY - plantTopY + 8);

      // Centro más húmedo con línea de riego
      ctx.fillStyle = '#b3773a';
      ctx.fillRect(bx + 3, plantTopY, ts - 6, plantBottomY - plantTopY);

      // Surcos suaves de laboreo
      ctx.fillStyle = withAlpha('#7c4a16', 0.22);
      ctx.fillRect(bx + Math.round(ts * 0.25), plantTopY, 2, plantBottomY - plantTopY);
      ctx.fillRect(bx + Math.round(ts * 0.5), plantTopY, 2, plantBottomY - plantTopY);
      ctx.fillRect(bx + Math.round(ts * 0.75), plantTopY, 2, plantBottomY - plantTopY);
    });

    // 3. Caminos transitables limpios y anchos (columnas 0, 2, 4, 6, 8)
    const pathCols = [0, 2, 4, 6, 8];
    pathCols.forEach((col) => {
      const px = col * ts;
      ctx.fillStyle = withAlpha('#ecd1a8', 0.35);
      for (let y = fieldTopY + 14; y < plantBottomY - 10; y += 36) {
        const hash = ((col * 37 + y * 23) % 100);
        if (hash < 42) {
          ctx.fillRect(px + 10 + (hash % (ts - 20)), y, 4, 2);
        }
      }
    });

    // 4. Pasillos de cabecera horizontales (superior en fila 3, inferior en fila 10)
    ctx.fillStyle = withAlpha('#ecd1a8', 0.25);
    ctx.fillRect(0, fieldTopY, width, ts); // Fila 3: conexión superior
    ctx.fillRect(0, plantBottomY, width, ts); // Fila 10: conexión inferior

    // 5. Zona de entrega amplia e independiente (a partir de fila 11 / 528px)
    // Patio de acopio y carga espacioso para camión, cajas, canasta y supervisor
    ctx.fillStyle = '#cb995c';
    ctx.fillRect(0, deliveryTopY, width, height - deliveryTopY);

    // Viga rústica de madera que delimita el campo agrícola del patio de carga
    ctx.fillStyle = '#2d1805';
    ctx.fillRect(0, deliveryTopY - 3, width, 5);
    ctx.fillStyle = '#6b3c15';
    ctx.fillRect(0, deliveryTopY - 2, width, 3);
    ctx.fillStyle = '#a1612a';
    ctx.fillRect(0, deliveryTopY - 2, width, 1);

    // Textura de patio de carga afirmado
    ctx.fillStyle = withAlpha('#dfb074', 0.32);
    for (let x = 16; x < width - 16; x += 36) {
      for (let y = deliveryTopY + 12; y < height - 12; y += 28) {
        ctx.fillRect(x + ((y * 7) % 14), y, 5, 2.5);
      }
    }

    // 6. Cerca perimetral de postes de madera a los costados
    for (let y = fieldTopY + 12; y < height - 20; y += 48) {
      // Poste izquierdo
      ctx.fillStyle = '#3a200a';
      ctx.fillRect(0, y, 4, 18);
      ctx.fillStyle = '#784318';
      ctx.fillRect(1, y, 2.5, 16);

      // Poste derecho
      ctx.fillStyle = '#3a200a';
      ctx.fillRect(width - 4, y, 4, 18);
      ctx.fillStyle = '#784318';
      ctx.fillRect(width - 3.5, y, 2.5, 16);
    }
  }

  /* ============================================================
     PAISAJE DE FONDO (CIELO, MONTAÑAS NEVADAS, ÁRBOLES Y CERCA)
     ============================================================ */

  /**
   * Dibuja la franja superior de paisaje (cielo, montañas nevadas, árboles y cerca).
   * Ocupa 3 filas completas (144px) para ser siempre visible detrás y debajo del HUD.
   */
  drawLandscape(camera, layout = {}) {
    const ctx = this.ctx;
    const vw = this.viewWidth;
    const ts = TILE_SIZE;
    const landscapeHeight = 3 * ts; // Franja superior de 144px

    // 1. Cielo con degradado azul nítido (cielo despejado de Ica)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 80);
    skyGrad.addColorStop(0, '#4da2f5');
    skyGrad.addColorStop(0.65, '#87c3fc');
    skyGrad.addColorStop(1, '#bfe1ff');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, vw, 82);

    // 2. Nubes blancas suaves estilo pixel art
    const cloudPositions = [
      { x: 18, y: 12, w: 58, h: 14 },
      { x: 135, y: 10, w: 78, h: 16 },
      { x: 255, y: 14, w: 68, h: 14 },
      { x: 355, y: 9, w: 62, h: 14 },
    ];
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    cloudPositions.forEach(({ x, y, w, h }) => {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, h / 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + w * 0.45, y + 2, h * 0.6, 0, Math.PI * 2);
      ctx.arc(x + w * 0.65, y + 3, h * 0.48, 0, Math.PI * 2);
      ctx.fill();
    });

    // 3. Montañas púrpuras con picos nevados (cordillera de los Andes)
    // Claramente visibles debajo del HUD
    const mountainPeaks = [
      { x: -15, w: 110, h: 48, snowH: 16 },
      { x: 72, w: 130, h: 58, snowH: 20 },
      { x: 175, w: 120, h: 50, snowH: 17 },
      { x: 260, w: 135, h: 60, snowH: 22 },
      { x: 360, w: 105, h: 52, snowH: 18 },
    ];

    const mountainBaseY = 100;

    mountainPeaks.forEach(({ x, w, h, snowH }) => {
      const topY = mountainBaseY - h;
      const midX = x + w / 2;

      // Silueta montaña púrpura/azul
      ctx.fillStyle = '#5c67a3';
      ctx.beginPath();
      ctx.moveTo(x, mountainBaseY);
      ctx.lineTo(midX, topY);
      ctx.lineTo(x + w, mountainBaseY);
      ctx.closePath();
      ctx.fill();

      // Sombra lado derecho de la montaña
      ctx.fillStyle = '#434b80';
      ctx.beginPath();
      ctx.moveTo(midX, topY);
      ctx.lineTo(x + w, mountainBaseY);
      ctx.lineTo(midX, mountainBaseY);
      ctx.closePath();
      ctx.fill();

      // Pico nevado blanco
      const snowBottomY = topY + snowH;
      const snowLeftX = midX - (w * (snowH / h)) / 2;
      const snowRightX = midX + (w * (snowH / h)) / 2;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(snowLeftX, snowBottomY);
      ctx.lineTo(midX, topY);
      ctx.lineTo(snowRightX, snowBottomY);
      ctx.lineTo(midX, snowBottomY - 2);
      ctx.closePath();
      ctx.fill();
    });

    // 4. Franja de árboles verdes cortavientos
    const treesY = 96;
    ctx.fillStyle = '#14532d';
    ctx.fillRect(0, treesY + 16, vw, 26);

    for (let x = -8; x < vw + 18; x += 20) {
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(x + 10, treesY + 12, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(x + 8, treesY + 9, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Cerca horizontal rústica de madera (separa el paisaje del campo)
    const fenceY = landscapeHeight - 8;
    // Rieles de madera horizontales
    ctx.fillStyle = '#3a200a';
    ctx.fillRect(0, fenceY - 1, vw, 7);
    ctx.fillStyle = '#784318';
    ctx.fillRect(0, fenceY, vw, 5);
    ctx.fillStyle = '#a1612a';
    ctx.fillRect(0, fenceY, vw, 1.5);

    // Postes de madera verticales cada 48px
    for (let px = 24; px < vw; px += 48) {
      ctx.fillStyle = '#3a200a';
      ctx.fillRect(px - 1, fenceY - 12, 6, 19);
      ctx.fillStyle = '#784318';
      ctx.fillRect(px, fenceY - 11, 4, 17);
      ctx.fillStyle = '#a1612a';
      ctx.fillRect(px, fenceY - 11, 1.5, 17);
      // Clavo metálico
      ctx.fillStyle = '#d4bb98';
      ctx.fillRect(px + 1, fenceY + 1, 2, 2);
    }
  }

  /**
   * Valla de madera que separa el campo de la zona de entrega (§4).
   * Se dibuja como una línea horizontal de tiles de cerca.
   *
   * @param {number} width ancho del mapa en px
   * @param {number} y fila del mundo donde va la cerca
   */
  drawDeliveryFence(width, y) {
    const ts = TILE_SIZE;
    for (let x = 0; x < width; x += ts) {
      this.sprites.draw('terrain.fenceH', x, y, {
        frameSize: ts, width: ts, height: ts,
      });
    }
  }

  /**
   * Carteles del fundo y del grupo, integrados en el escenario (§14).
   *
   * @param {number} x
   * @param {number} y
   * @param {'fundo'|'grupo'} kind
   */
  drawSign(x, y, kind = 'fundo') {
    const key = kind === 'grupo' ? 'env.signsGrupo' : 'env.signsFundo';
    this.sprites.draw(key, x, y, {
      frameSize: 64, width: 52, height: 52,
    });
  }

  /**
   * Decoración de suelo: rocas, matas y flores (§13).
   * Se colocan de forma determinista para que no parpadeen.
   *
   * @param {number} width
   * @param {number} height
   * @param {number} y0 fila inicial (bajo el paisaje)
   */
  drawSceneryDecoration(width, height, y0) {
    const items = [
      { key: 'env.decorationsRockLarge', x: 8, y: y0 + 6, w: 22 },
      { key: 'env.decorationsRockLarge', x: width - 30, y: y0 + 40, w: 20 },
      { key: 'env.decorationsFlowers', x: 40, y: y0 + 30, w: 20 },
      { key: 'env.decorationsFlowers', x: width - 70, y: y0 + 8, w: 20 },
      { key: 'env.decorationsGrassDetail', x: 90, y: y0 + 14, w: 20 },
      { key: 'env.decorationsGrassDetail', x: width - 110, y: y0 + 52, w: 20 },
    ];

    items.forEach((item) => {
      this.sprites.draw(item.key, item.x, item.y, {
        frameSize: 32, width: item.w, height: item.w,
      });
    });
  }

  /* ============================================================
     ENTIDADES
     ============================================================ */

  /**
   * Dibuja las plantas visibles con follaje frondoso continuo,
   * silueta lobulada y flores blancas idénticas a la muestra de referencia.
   * @param {Array<import('../entities/Plant.js').Plant>} plants
   * @param {import('./Camera.js').Camera} camera
   * @param {object} highlight info sobre la planta resaltada
   */
  drawPlants(plants, camera, highlight = null) {
    const ts = TILE_SIZE;
    const ctx = this.ctx;

    for (let i = 0; i < plants.length; i += 1) {
      const plant = plants[i];
      const rect = { x: plant.x, y: plant.y, w: ts, h: ts };

      if (!camera.isVisible(rect, 24)) continue;

      const px = Math.round(plant.x);
      const py = Math.round(plant.y);

      // Arbusto tupido de alta fidelidad con capas de hojas y flores
      this.#drawLushHedgeSegment(px, py, ts, plant);

      // Marca sutil en la planta apuntada por el jugador
      if (highlight && highlight.plantId === plant.id) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = highlight.color ?? PALETTE.warn;
        ctx.beginPath();
        ctx.arc(px + ts / 2, py + ts / 2, ts * 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  /**
   * Dibuja un segmento de seto continuo, frondoso y notablemente ancho.
   * Con 4 hileras los arbustos se extienden más horizontalmente (ancho ~62px),
   * con múltiples lóbulos de follaje verde vibrante y flores blancas.
   */
  #drawLushHedgeSegment(x, y, size, plant) {
    const ctx = this.ctx;
    const cx = x + size / 2;
    const cy = y + size / 2;
    // Arbustos más anchos y frondosos: radio horizontal ampliado a ~31px (ancho ~62px)
    const rx = size * 0.65;
    const ry = size * 0.50;

    ctx.save();

    // Sombra del follaje sobre el lecho arenoso
    ctx.fillStyle = 'rgba(50, 25, 8, 0.26)';
    ctx.beginPath();
    ctx.ellipse(cx, y + size * 0.88, rx * 0.95, ry * 0.36, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1. Capa base oscura del arbusto (fondo profundo de hojas verde bosque)
    ctx.fillStyle = '#113b14';
    ctx.beginPath();
    ctx.arc(cx - rx * 0.45, cy - ry * 0.2, rx * 0.48, 0, Math.PI * 2);
    ctx.arc(cx + rx * 0.45, cy - ry * 0.2, rx * 0.48, 0, Math.PI * 2);
    ctx.arc(cx, cy + ry * 0.25, rx * 0.52, 0, Math.PI * 2);
    ctx.arc(cx - rx * 0.55, cy + ry * 0.1, rx * 0.42, 0, Math.PI * 2);
    ctx.arc(cx + rx * 0.55, cy + ry * 0.1, rx * 0.42, 0, Math.PI * 2);
    ctx.arc(cx, cy - ry * 0.3, rx * 0.46, 0, Math.PI * 2);
    ctx.fill();

    // 2. Capa media: verde esmeralda denso y frondoso
    ctx.fillStyle = '#1e7021';
    ctx.beginPath();
    ctx.arc(cx - rx * 0.36, cy - ry * 0.16, rx * 0.42, 0, Math.PI * 2);
    ctx.arc(cx + rx * 0.36, cy - ry * 0.16, rx * 0.42, 0, Math.PI * 2);
    ctx.arc(cx, cy + ry * 0.15, rx * 0.45, 0, Math.PI * 2);
    ctx.arc(cx - rx * 0.46, cy + ry * 0.05, rx * 0.36, 0, Math.PI * 2);
    ctx.arc(cx + rx * 0.46, cy + ry * 0.05, rx * 0.36, 0, Math.PI * 2);
    ctx.arc(cx, cy - ry * 0.22, rx * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // 3. Capa de hojas iluminadas (verde hoja vibrante)
    ctx.fillStyle = '#38a632';
    ctx.beginPath();
    ctx.arc(cx - rx * 0.26, cy - ry * 0.26, rx * 0.28, 0, Math.PI * 2);
    ctx.arc(cx + rx * 0.26, cy - ry * 0.26, rx * 0.28, 0, Math.PI * 2);
    ctx.arc(cx - rx * 0.06, cy - ry * 0.06, rx * 0.3, 0, Math.PI * 2);
    ctx.arc(cx + rx * 0.28, cy + ry * 0.08, rx * 0.24, 0, Math.PI * 2);
    ctx.arc(cx - rx * 0.3, cy + ry * 0.12, rx * 0.24, 0, Math.PI * 2);
    ctx.fill();

    // 4. Puntas iluminadas por el sol (verde lima fresco)
    ctx.fillStyle = '#5ed154';
    ctx.beginPath();
    ctx.arc(cx - rx * 0.2, cy - ry * 0.32, rx * 0.13, 0, Math.PI * 2);
    ctx.arc(cx + rx * 0.18, cy - ry * 0.34, rx * 0.12, 0, Math.PI * 2);
    ctx.arc(cx - rx * 0.02, cy - ry * 0.14, rx * 0.14, 0, Math.PI * 2);
    ctx.arc(cx - rx * 0.38, cy - ry * 0.05, rx * 0.11, 0, Math.PI * 2);
    ctx.arc(cx + rx * 0.38, cy - ry * 0.05, rx * 0.11, 0, Math.PI * 2);
    ctx.fill();

    // 5. Pequeñas flores blancas de 5 pétalos con centro dorado
    const flowerSeed = (plant.col * 31 + plant.row * 19) % 100;
    const flowerPositions = [
      { fx: cx - rx * 0.42, fy: cy - ry * 0.2 },
      { fx: cx + rx * 0.4, fy: cy + ry * 0.12 },
      { fx: cx + (flowerSeed % 16 - 8), fy: cy - ry * 0.05 },
    ];

    flowerPositions.forEach(({ fx, fy }) => {
      ctx.fillStyle = '#ffffff';
      for (let a = 0; a < 5; a += 1) {
        const ang = (a * Math.PI * 2) / 5;
        ctx.beginPath();
        ctx.arc(fx + Math.cos(ang) * 2.2, fy + Math.sin(ang) * 2.2, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(fx, fy, 1.2, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  /**
   * Dibuja los frutos que siguen en las plantas con acabado de arándano
   * pixel art realista (azul brillante con cáliz, morados y verdes).
   * @param {Array} plants
   * @param {import('./Camera.js').Camera} camera
   */
  drawFruits(plants, camera) {
    for (let i = 0; i < plants.length; i += 1) {
      const plant = plants[i];
      if (!plant.hasFruits) continue;
      if (!camera.isVisible({ x: plant.x - 16, y: plant.y - 16, w: 64, h: 64 })) continue;

      const fruits = plant.fruits;
      for (let f = 0; f < fruits.length; f += 1) {
        const fruit = fruits[f];
        if (fruit.collected) continue;

        const pos = plant.fruitPosition(fruit);
        const fx = Math.round(pos.x);
        const fy = Math.round(pos.y);

        this.#drawBerry(fx, fy, fruit);
      }
    }
  }

  /**
   * Dibuja un arándano individual (maduro azul, pintón púrpura o verde inmaduro).
   */
  #drawBerry(x, y, fruit) {
    const ctx = this.ctx;
    const isRipe = fruit.type === 'RIPE';
    const isPurple = fruit.type === 'UNRIPE' && (fruit.variant % 2 === 1);
    const radius = 6.5;

    ctx.save();

    // Sombra del fruto en el follaje
    ctx.fillStyle = 'rgba(8, 24, 8, 0.4)';
    ctx.beginPath();
    ctx.arc(x + 1, y + 2, radius, 0, Math.PI * 2);
    ctx.fill();

    if (isRipe) {
      // Arándano maduro: azul zafiro/marino profundo con corona y reflejo
      ctx.fillStyle = '#0a1428';
      ctx.beginPath();
      ctx.arc(x, y, radius + 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Degradado azul
      const grad = ctx.createRadialGradient(x - 2, y - 2, 1, x, y, radius);
      grad.addColorStop(0, '#60a5fa');
      grad.addColorStop(0.35, '#2563eb');
      grad.addColorStop(0.85, '#1e3a8a');
      grad.addColorStop(1, '#172554');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Cáliz / corona central oscuro característico
      ctx.fillStyle = '#081024';
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(x - 2, y - 0.6, 4, 1.2);
      ctx.fillRect(x - 0.6, y - 2, 1.2, 4);

      // Brillo especular blanco en luna creciente superior izquierda
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(x - 2.5, y - 2.5, 1.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(191, 219, 254, 0.55)';
      ctx.beginPath();
      ctx.arc(x - 1.2, y - 3.2, 1, 0, Math.PI * 2);
      ctx.fill();
    } else if (isPurple) {
      // Arándano pintón violeta/púrpura
      ctx.fillStyle = '#2e1065';
      ctx.beginPath();
      ctx.arc(x, y, radius + 0.8, 0, Math.PI * 2);
      ctx.fill();

      const grad = ctx.createRadialGradient(x - 2, y - 2, 1, x, y, radius);
      grad.addColorStop(0, '#f0abfc');
      grad.addColorStop(0.45, '#a855f7');
      grad.addColorStop(1, '#581c87');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#2e1065';
      ctx.beginPath();
      ctx.arc(x, y, 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.arc(x - 2, y - 2, 1.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Arándano verde inmaduro
      ctx.fillStyle = '#14532d';
      ctx.beginPath();
      ctx.arc(x, y, radius + 0.8, 0, Math.PI * 2);
      ctx.fill();

      const grad = ctx.createRadialGradient(x - 2, y - 2, 1, x, y, radius);
      grad.addColorStop(0, '#bef264');
      grad.addColorStop(0.45, '#84cc16');
      grad.addColorStop(1, '#3f6212');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#14532d';
      ctx.beginPath();
      ctx.arc(x, y, 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.beginPath();
      ctx.arc(x - 2, y - 2, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Cartel rústico de madera sobre poste (CESTA, SUPERVISOR, CAMIÓN).
   */
  drawWoodenSign(x, y, text) {
    const ctx = this.ctx;
    ctx.save();

    // Poste de madera
    ctx.fillStyle = '#3a200a';
    ctx.fillRect(Math.round(x - 2), Math.round(y), 4, 14);

    // Tablón de madera
    const paddingX = 8;
    ctx.font = 'bold 9px "Outfit", "Segoe UI", sans-serif';
    const textMetrics = ctx.measureText(text);
    const w = Math.max(46, Math.round(textMetrics.width + paddingX * 2));
    const h = 17;
    const bx = Math.round(x - w / 2);
    const by = Math.round(y - h);

    // Borde oscuro
    ctx.fillStyle = '#1d0f04';
    ctx.fillRect(bx - 1, by - 1, w + 2, h + 2);

    // Cuerpo de madera
    ctx.fillStyle = '#784318';
    ctx.fillRect(bx, by, w, h);

    // Bisel superior iluminado
    ctx.fillStyle = '#a1612a';
    ctx.fillRect(bx, by, w, 2);

    // Bisel inferior en sombra
    ctx.fillStyle = '#45250b';
    ctx.fillRect(bx, by + h - 2, w, 2);

    // Clavos de esquina
    ctx.fillStyle = '#d4bb98';
    ctx.fillRect(bx + 2, by + 2, 2, 2);
    ctx.fillRect(bx + w - 4, by + 2, 2, 2);
    ctx.fillRect(bx + 2, by + h - 4, 2, 2);
    ctx.fillRect(bx + w - 4, by + h - 4, 2, 2);

    // Texto con contorno negro
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000000';
    for (let ox = -1; ox <= 1; ox += 1) {
      for (let oy = -1; oy <= 1; oy += 1) {
        if (ox !== 0 || oy !== 0) {
          ctx.fillText(text, x + ox, by + h / 2 + oy);
        }
      }
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, x, by + h / 2);

    ctx.restore();
  }

  /**
   * Burbuja de exclamación blanca con '!' rojo sobre el supervisor.
   */
  drawExclamationBubble(x, y) {
    const ctx = this.ctx;
    ctx.save();
    const w = 18;
    const h = 16;
    const bx = Math.round(x - w / 2);
    const by = Math.round(y - h);

    // Borde exterior oscuro
    ctx.fillStyle = '#1c1007';
    ctx.fillRect(bx - 1, by - 1, w + 2, h + 2);

    // Cuerpo blanco de la burbuja
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bx, by, w, h);

    // Rabito inferior
    ctx.fillStyle = '#1c1007';
    ctx.beginPath();
    ctx.moveTo(x - 3, by + h);
    ctx.lineTo(x, by + h + 5);
    ctx.lineTo(x + 3, by + h);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x - 2, by + h - 1);
    ctx.lineTo(x, by + h + 4);
    ctx.lineTo(x + 2, by + h - 1);
    ctx.fill();

    // Signo de exclamación rojo
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(Math.round(x - 1.5), by + 2, 3, 7);
    ctx.fillRect(Math.round(x - 1.5), by + 11, 3, 3);

    ctx.restore();
  }

  /**
   * Dibuja una entidad con sprite (jugador, supervisor).
   * @param {object} entity
   * @param {import('./Camera.js').Camera} camera
   * @param {object} [options]
   */
  drawEntity(entity, camera, options = {}) {
    const isSupervisor = entity.isSupervisor || entity.spriteKey?.includes('supervisor');
    const size = entity.width ?? 32;
    // Si la entidad es el supervisor, aumentamos su tamaño significativamente
    // para que se vea imponente, nítido y bien proporcionado
    const drawW = isSupervisor ? 46 : (options.width ?? size);
    const drawH = isSupervisor ? 50 : (options.height ?? size);

    // Si la entidad es el supervisor, dibujamos cartel y burbuja con '!'
    if (isSupervisor) {
      this.drawWoodenSign(entity.x, entity.y - 44, 'SUPERVISOR');
      this.drawExclamationBubble(entity.x, entity.y - 20);
    }

    // Sombra bajo el personaje
    this.sprites.drawShadow(
      Math.round(entity.x),
      Math.round(entity.y + drawH * 0.34),
      drawW * 0.32,
      drawH * 0.14,
      0.28
    );

    const frame = options.frame ?? entity.frame ?? 0;

    this.sprites.draw(entity.spriteKey, entity.renderX ?? entity.x, entity.renderY ?? entity.y, {
      frame,
      frameSize: options.frameSize ?? 32,
      width: drawW,
      height: drawH,
      flipX: options.flipX ?? false,
      alpha: options.alpha ?? 1,
      tint: options.tint ?? null,
    });
  }

  /** Canasta de cosecha (§14) con su cartel de madera "CESTA". */
  drawBasket(basket) {
    // Cartel "CESTA" sobre la canasta
    this.drawWoodenSign(basket.centerX, basket.y - 12, 'CESTA');

    this.sprites.drawShadow(
      Math.round(basket.centerX),
      Math.round(basket.y + basket.height * 0.85),
      basket.width * 0.4,
      basket.height * 0.16,
      0.25
    );

    this.sprites.draw(basket.spriteKey, basket.x, basket.y, {
      frameSize: TILE_SIZE,
      width: basket.width,
      height: basket.height,
    });

    // Destello al recibir frutos
    if (basket.flashTimer > 0) {
      this.ctx.save();
      this.ctx.globalAlpha = Math.min(0.5, basket.flashTimer * 2);
      this.ctx.fillStyle = PALETTE.warn;
      this.ctx.fillRect(basket.x - 2, basket.y - 2, basket.width + 4, basket.height + 4);
      this.ctx.restore();
    }
  }

  /** Cajas de cosecha (§16). */
  drawBoxes(boxes) {
    for (let i = 0; i < boxes.length; i += 1) {
      const box = boxes[i];
      this.sprites.draw(box.spriteKey, box.x, box.y + box.offsetY, {
        frameSize: TILE_SIZE,
        width: box.width,
        height: box.height,
      });
    }
  }

  /** Camión (§16) con su cartel "CAMIÓN". */
  drawTruck(truck) {
    if (!truck.isVisible) return;
    this.drawWoodenSign(truck.x + truck.width * 0.5, truck.y - 14, 'CAMIÓN');
    this.sprites.draw(truck.spriteKey, truck.x, truck.y, {
      frame: truck.animationFrame,
      frameSize: 64,
      width: truck.width,
      height: truck.height,
    });
  }

  /** Indicador de "puedes recoger" (§54). */
  drawHarvestIndicator(x, y, side, isUnripe = false) {
    const ctx = this.ctx;
    const color = isUnripe ? PALETTE.danger : PALETTE.warn;
    const dir = side === 'left' ? -1 : 1;

    ctx.save();
    ctx.globalAlpha = 0.9;

    // Triángulo apuntando al fruto
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(Math.round(x + dir * 4), Math.round(y - 5));
    ctx.lineTo(Math.round(x + dir * 4), Math.round(y + 5));
    ctx.lineTo(Math.round(x + dir * 11), Math.round(y));
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  /** Burbuja de diálogo (supervisor, avisos, §54). */
  drawBubble(cx, cy, text, {
    color = PALETTE.panel,
    borderColor = PALETTE.panelBorder,
    textColor = PALETTE.text,
    fontSize = 7,
  } = {}) {
    const ctx = this.ctx;
    const padding = 6;
    const textWidth = this.sprites.measureText(text, fontSize);
    const w = textWidth + padding * 2 + 4;
    const h = fontSize + padding * 2;

    // Se mantiene dentro de la pantalla lógica.
    const x = Math.round(Math.max(4, Math.min(this.width - w - 4, cx - w / 2)));
    const y = Math.round(Math.max(4, cy - h));

    ctx.save();
    // Panel
    this.sprites.drawRect(x, y, w, h, color, { borderColor, borderWidth: 1 });

    // Rabito inferior
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(cx - 2), y + h, 5, 4);

    this.sprites.drawText(text, x + w / 2, y + h / 2, {
      size: fontSize,
      color: textColor,
      align: 'center',
      baseline: 'middle',
    });
    ctx.restore();
  }

  /* ============================================================
     HUD (§34)
     ============================================================ */

  /**
   * Dibuja el HUD superior con los datos del nivel.
   * Diseñado primero para móvil: textos grandes y legibles.
   * @param {object} hud datos del estado
   */
  drawHud(hud) {
    const ctx = this.ctx;
    const h = GAME_CONFIG.hudHeight;

    // ---- Fondo del HUD ----
    ctx.save();
    ctx.fillStyle = withAlpha(PALETTE.panel, 0.94);
    ctx.fillRect(0, 0, this.width, h);
    ctx.fillStyle = PALETTE.panelBorder;
    ctx.fillRect(0, h - 2, this.width, 2);
    ctx.fillStyle = withAlpha('#000000', 0.3);
    ctx.fillRect(0, 0, this.width, 1);
    ctx.restore();

    // ---- Fila 1: NIVEL · TIEMPO · PAUSA ----
    const row1Y = 5;
    this.sprites.drawText(`NIVEL ${hud.level}/${hud.totalLevels}`, 6, row1Y, {
      size: 7,
      color: PALETTE.textSoft,
    });

    // Tiempo (centrado, cambia de color cuando queda poco — §22)
    const timeText = formatTime(hud.timeLeft);
    const dangerTime = hud.timeLeft <= 20;
    this.sprites.drawText(timeText, this.width / 2, row1Y, {
      size: 8,
      color: dangerTime ? PALETTE.danger : PALETTE.text,
      align: 'center',
    });

    // Botón de pausa visual (el toque lo maneja TouchControls/React)
    this.sprites.drawRect(this.width - 24, 3, 20, 16, PALETTE.panelLight, {
      borderColor: PALETTE.panelBorder,
      borderWidth: 1,
    });
    this.sprites.drawText('II', this.width - 14, 6, {
      size: 7,
      color: PALETTE.text,
      align: 'center',
    });

    // ---- Fila 2: COSECHADOS · ERRORES · CALIDAD · VIDAS ----
    const row2Y = 21;
    let x = 6;

    // Cosechados
    this.sprites.draw('ui.iconRipe', x, row2Y - 1, { frameSize: 16, width: 12, height: 12 });
    x += 15;
    const harvestText = `${hud.harvested}/${hud.target}`;
    this.sprites.drawText(harvestText, x, row2Y + 1, {
      size: 7,
      color: PALETTE.text,
    });
    x += this.sprites.measureText(harvestText, 7) + 8;

    // Errores
    this.sprites.draw('ui.iconError', x, row2Y - 1, { frameSize: 16, width: 12, height: 12 });
    x += 15;
    const errorText = `${hud.errors}`;
    this.sprites.drawText(errorText, x, row2Y + 1, {
      size: 7,
      color: hud.errors > 0 ? PALETTE.danger : PALETTE.textSoft,
    });
    x += this.sprites.measureText(errorText, 7) + 8;

    // Vidas (corazones)
    const lifeStartX = this.width - 6 - hud.lives * 13;
    for (let i = 0; i < hud.maxLives; i += 1) {
      this.sprites.draw(i < hud.lives ? 'ui.lifeFull' : 'ui.lifeEmpty', lifeStartX + i * 13, row2Y - 2, {
        frameSize: 16,
        width: 12,
        height: 12,
      });
    }

    // ---- Fila 3: Calidad (barra) + canasta ----
    const row3Y = 38;
    const barX = 6;
    const barW = this.width - 12;
    const barH = 7;

    // Etiqueta
    this.sprites.drawText('CALIDAD', barX, row3Y - 1, {
      size: 6,
      color: PALETTE.textDim,
    });
    const qualityLabelX = barX + 44;
    this.sprites.drawText(`${Math.round(hud.quality)}%`, qualityLabelX, row3Y - 1, {
      size: 6,
      color: hud.quality >= 90 ? PALETTE.ok : hud.quality >= 75 ? PALETTE.warn : PALETTE.danger,
    });

    // Barra
    const trackY = row3Y + 9;
    this.sprites.fillRect(barX, trackY, barW, barH, withAlpha('#000000', 0.5));
    const qualityColor =
      hud.quality >= 90 ? PALETTE.ok : hud.quality >= 75 ? PALETTE.warn : PALETTE.danger;
    const qualityW = Math.round((barW - 2) * clamp01(hud.quality / 100));
    this.sprites.fillRect(barX + 1, trackY + 1, qualityW, barH - 2, qualityColor);

    // Canasta: contador a la derecha de la barra
    const basketText = `CANASTA ${hud.basketCurrent}/${hud.basketCapacity}`;
    this.sprites.drawText(basketText, this.width - 6, trackY + barH + 2, {
      size: 6,
      color: hud.basketCurrent >= hud.basketCapacity ? PALETTE.warn : PALETTE.textSoft,
      align: 'right',
    });

    // Aviso de canasta llena (§14)
    if (hud.basketFull) {
      const pulse = 0.6 + Math.sin(Date.now() / 180) * 0.4;
      ctx.save();
      ctx.globalAlpha = pulse;
      this.sprites.drawText('CANASTA LLENA - REGRESA A ENTREGAR', this.width / 2, h - 10, {
        size: 6,
        color: PALETTE.warn,
        align: 'center',
      });
      ctx.restore();
    }

    // Alerta de tiempo (§22)
    if (dangerTime && hud.timeLeft > 0) {
      const pulse = 0.5 + Math.sin(Date.now() / 150) * 0.5;
      ctx.save();
      ctx.globalAlpha = pulse;
      this.sprites.fillRect(0, h - 2, this.width, 2, PALETTE.danger);
      ctx.restore();
    }
  }

  /**
   * Barra inferior con el temporizador del supervisor (§19).
   * Va sobre la zona de entrega, en la parte baja del canvas.
   */
  drawSupervisorTimer(hud) {
    if (hud.supervisorActive) return;

    const y = this.height - 26;
    const w = 150;
    const x = (this.width - w) / 2;

    this.sprites.drawRect(x, y, w, 20, withAlpha(PALETTE.panel, 0.9), {
      borderColor: PALETTE.panelBorder,
      borderWidth: 1,
    });

    this.sprites.drawText('SIGUIENTE REVISION', x + 6, y + 4, {
      size: 6,
      color: PALETTE.textDim,
    });

    this.sprites.drawText(formatTime(hud.supervisorTimer), x + w - 6, y + 4, {
      size: 7,
      color: hud.supervisorTimer <= 10 ? PALETTE.warn : PALETTE.text,
      align: 'right',
    });

    // Barra de progreso de la cuenta atrás
    const ratio = clamp01(1 - hud.supervisorTimer / Math.max(1, hud.supervisorInterval));
    this.sprites.fillRect(x + 5, y + 15, w - 10, 3, withAlpha('#000000', 0.5));
    this.sprites.fillRect(x + 5, y + 15, Math.round((w - 10) * ratio), 3, PALETTE.ok);
  }

  /**
   * Indicador contextual flotante sobre el jugador (§54):
   * "RECOGE", "ENTREGA", "NO RECOGER PINTÓN".
   */
  drawContextHint(x, y, text, { color = PALETTE.warn } = {}) {
    const w = this.sprites.measureText(text, 6) + 10;
    const h = 14;
    const px = Math.round(Math.max(4, Math.min(this.width - w - 4, x - w / 2)));
    const py = Math.round(y - 26);

    this.sprites.drawRect(px, py, w, h, withAlpha('#000000', 0.75), {
      borderColor: color,
      borderWidth: 1,
    });
    this.sprites.drawText(text, px + w / 2, py + h / 2, {
      size: 6,
      color,
      align: 'center',
      baseline: 'middle',
    });
  }

  /**
   * Overlay de pausa/estados (dentro del canvas, para que el juego
   * se vea congelado detrás).
   */
  drawOverlay(alpha = 0.6) {
    this.ctx.save();
    this.ctx.fillStyle = withAlpha('#000000', alpha);
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.restore();
  }
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

export default Renderer;
