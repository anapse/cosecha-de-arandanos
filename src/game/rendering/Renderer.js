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
  }

  /** Ajusta el tamaño lógico (por si cambia la configuración). */
  resize(width, height) {
    this.width = width;
    this.height = height;
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
  drawTerrain(tileMap, camera) {
    const ts = tileMap.tileSize;
    const view = camera.viewRect;

    const col0 = Math.max(0, Math.floor(view.x / ts));
    const col1 = Math.min(tileMap.cols - 1, Math.floor((view.x + view.w) / ts));
    const row0 = Math.max(0, Math.floor(view.y / ts));
    const row1 = Math.min(tileMap.rows - 1, Math.floor((view.y + view.h) / ts));

    for (let row = row0; row <= row1; row += 1) {
      for (let col = col0; col <= col1; col += 1) {
        const type = tileMap.grid[row][col];
        this.#drawTile(type, col * ts, row * ts, ts, col, row);
      }
    }
  }

  #drawTile(type, x, y, size, col, row) {
    const sprites = this.sprites;

    switch (type) {
      case TILE_TYPES.PLANT_ROW:
        // El suelo de la línea de cultivo: tierra oscura arada.
        sprites.draw('terrain.soilDark', x, y, { frameSize: size, width: size, height: size });
        // Surcos horizontales para marcar que es tierra trabajada.
        this.ctx.fillStyle = withAlpha(PALETTE.soilShadow, 0.5);
        this.ctx.fillRect(Math.round(x), Math.round(y + size * 0.45), size, 2);
        break;

      case TILE_TYPES.PATH:
        sprites.draw('terrain.path', x, y, { frameSize: size, width: size, height: size });
        break;

      case TILE_TYPES.PATH_H:
        sprites.draw('terrain.pathH', x, y, { frameSize: size, width: size, height: size });
        break;

      case TILE_TYPES.CROSS:
        sprites.draw('terrain.cross', x, y, { frameSize: size, width: size, height: size });
        break;

      case TILE_TYPES.GRASS:
        sprites.draw('terrain.grass', x, y, { frameSize: size, width: size, height: size });
        break;

      case TILE_TYPES.FENCE:
        sprites.draw('terrain.fence', x, y, { frameSize: size, width: size, height: size });
        break;

      case TILE_TYPES.BORDER:
        sprites.draw('terrain.border', x, y, { frameSize: size, width: size, height: size });
        break;

      case TILE_TYPES.DELIVERY:
        sprites.draw('terrain.delivery', x, y, { frameSize: size, width: size, height: size });
        break;

      case TILE_TYPES.SOIL_LIGHT:
        sprites.draw('terrain.soilLight', x, y, { frameSize: size, width: size, height: size });
        break;

      case TILE_TYPES.SOIL:
      default:
        // Variación determinista por posición: el campo no se ve plano.
        sprites.draw((col + row) % 2 === 0 ? 'terrain.soil' : 'terrain.soilLight', x, y, {
          frameSize: size,
          width: size,
          height: size,
        });
        break;
    }
  }

  /* ============================================================
     ENTIDADES
     ============================================================ */

  /**
   * Dibuja las plantas visibles. Solo las que ocupan la vista.
   * @param {Array<import('../entities/Plant.js').Plant>} plants
   * @param {import('./Camera.js').Camera} camera
   * @param {object} highlight info sobre la planta resaltada
   */
  drawPlants(plants, camera, highlight = null) {
    const ts = TILE_SIZE;

    for (let i = 0; i < plants.length; i += 1) {
      const plant = plants[i];
      const rect = { x: plant.x, y: plant.y, w: ts, h: ts };

      if (!camera.isVisible(rect, 16)) continue;

      this.sprites.draw(plant.spriteKey, plant.x, plant.y, {
        frameSize: ts,
        width: ts,
        height: Math.round(ts * 1.1),
      });

      // Marca sutil en la planta apuntada por el jugador.
      if (highlight && highlight.plantId === plant.id) {
        this.ctx.save();
        this.ctx.globalAlpha = 0.35;
        this.ctx.fillStyle = highlight.color ?? PALETTE.warn;
        this.ctx.fillRect(
          Math.round(plant.x),
          Math.round(plant.y),
          ts,
          Math.round(ts * 1.1)
        );
        this.ctx.restore();
      }
    }
  }

  /**
   * Dibuja los frutos que siguen en las plantas.
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
        const key = fruit.type === 'RIPE' ? 'fruit.ripe' : 'fruit.unripe';

        this.sprites.draw(key, pos.x - pos.size / 2, pos.y - pos.size / 2, {
          frameSize: 10,
          width: pos.size,
          height: pos.size,
        });
      }
    }
  }

  /**
   * Dibuja una entidad con sprite (jugador, supervisor).
   * @param {object} entity
   * @param {import('./Camera.js').Camera} camera
   * @param {object} [options]
   */
  drawEntity(entity, camera, options = {}) {
    const size = entity.width ?? 32;
    const drawW = options.width ?? size;
    const drawH = options.height ?? size;

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

  /** Canasta/caja de cosecha (§14). */
  drawBasket(basket) {
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

  /** Camión (§16). */
  drawTruck(truck) {
    if (!truck.isVisible) return;
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
