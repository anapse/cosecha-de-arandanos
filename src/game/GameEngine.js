/**
 * GameEngine.js
 * ===============================================================
 * NÚCLEO DEL VIDEOJUEGO (§4, §15, §35).
 *
 * Este archivo NO importa React. Es JavaScript puro y se puede
 * ejecutar en un canvas suelto, en un test o en un worker. React
 * solo lo monta y lo destruye.
 *
 * Se encarga de:
 *   - el game loop con requestAnimationFrame;
 *   - la actualización de entidades y sistemas;
 *   - las colisiones;
 *   - la entrada (teclado + táctil);
 *   - la cámara;
 *   - el renderizado;
 *   - el estado del nivel.
 *
 * Comunicación con React: por CALLBACKS y eventos, nunca por
 * re-render. El HUD se emite como instantánea solo cuando cambia.
 */

import { GAME_STATES, ENGINE_EVENTS, HARVEST_SIDES, FRUIT_TYPES, TILE_SIZE } from './config/constants.js';
import { GAME_CONFIG } from './config/gameConfig.js';

import { Map } from './map/Map.js';
import { CollisionSystem } from './collision/CollisionSystem.js';

import { Player } from './entities/Player.js';
import { Plant } from './entities/Plant.js';
import { Basket } from './entities/Basket.js';
import { Box } from './entities/Box.js';
import { Supervisor } from './entities/Supervisor.js';
import { Truck } from './entities/Truck.js';

import { HarvestSystem, HARVEST_RESULT } from './systems/HarvestSystem.js';
import { DeliverySystem, DELIVERY_RESULT } from './systems/DeliverySystem.js';
import { QualitySystem } from './systems/QualitySystem.js';
import { ScoreSystem } from './systems/ScoreSystem.js';
import { TimerSystem } from './systems/TimerSystem.js';
import { SupervisorSystem } from './systems/SupervisorSystem.js';
import { LevelSystem } from './systems/LevelSystem.js';

import { GameState } from './state/GameState.js';

import { KeyboardInput } from './input/KeyboardInput.js';
import { TouchInput } from './input/TouchInput.js';

import { Camera } from './rendering/Camera.js';
import { Renderer } from './rendering/Renderer.js';
import { HudRenderer } from './rendering/HudRenderer.js';
import { SpriteRenderer } from './rendering/SpriteRenderer.js';
import { AssetLoader } from './rendering/AssetLoader.js';

import { EffectsManager } from './effects/EffectsManager.js';
import { AudioManager } from './audio/AudioManager.js';

import { getLevelConfig, TOTAL_LEVELS } from '../data/levels.js';

export class GameEngine {
  /**
   * @param {object} options
   * @param {HTMLCanvasElement} options.canvas
   * @param {object} [options.callbacks] callbacks hacia React
   */
  constructor({ canvas, callbacks = {} }) {
    if (!canvas) throw new Error('GameEngine necesita un <canvas>.');

    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });

    if (!this.ctx) throw new Error('No se pudo obtener el contexto 2D.');

    /* ---------- Configuración lógica (§11) ---------- */
    this.logicalWidth = GAME_CONFIG.logicalWidth;
    this.logicalHeight = GAME_CONFIG.logicalHeight;

    /* ---------- Dispositivo (§15) ----------
       Decide el radio de acierto al recolectar con el dedo. Se detecta
       una sola vez: si hay eventos táctiles, se asume pantalla táctil. */
    this.isTouchDevice =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || (navigator.maxTouchPoints ?? 0) > 0);

    /* ---------- Callbacks hacia React ---------- */
    this.callbacks = {
      onHudUpdate: callbacks.onHudUpdate ?? null,
      onStateChange: callbacks.onStateChange ?? null,
      onLevelComplete: callbacks.onLevelComplete ?? null,
      onGameOver: callbacks.onGameOver ?? null,
      onReady: callbacks.onReady ?? null,
      onToast: callbacks.onToast ?? null,
    };

    /* ---------- Núcleo ---------- */
    this.state = new GameState();
    this.map = new Map();

    /* ---------- Render ---------- */
    this.camera = new Camera({
      viewWidth: this.logicalWidth,
      viewHeight: this.logicalHeight,
    });
    this.assetLoader = new AssetLoader();
    this.sprites = new SpriteRenderer(this.ctx, this.assetLoader);
    this.renderer = new Renderer(this.ctx, this.sprites);
    // HUD dedicado: paneles, leyenda y barras (§2-§7).
    this.hud = new HudRenderer(this.sprites);
    this.hud.resize(this.logicalWidth, this.logicalHeight, {
      hudHeight: GAME_CONFIG.hudHeight,
      bottomHeight: GAME_CONFIG.hudBottomHeight,
    });

    /** Tiempo acumulado para animaciones del HUD (flecha, pulsos). */
    this.presentationTime = 0;

    /* ---------- Entidades (se crean al cargar el nivel) ---------- */
    this.player = null;
    this.plants = [];
    this.basket = null;
    this.boxes = [];
    this.supervisor = null;
    this.truck = null;

    /* ---------- Sistemas ---------- */
    this.collisionSystem = new CollisionSystem(null, { x: 0, y: 0, w: 0, h: 0 });
    this.harvestSystem = new HarvestSystem({ map: this.map });
    this.deliverySystem = new DeliverySystem({ map: this.map, basket: null, boxes: [] });
    this.qualitySystem = new QualitySystem();
    this.scoreSystem = new ScoreSystem(this.state);
    this.timerSystem = new TimerSystem();
    this.supervisorSystem = new SupervisorSystem({ supervisor: null });
    this.levelSystem = new LevelSystem(this.state);

    /* ---------- Efectos y audio ---------- */
    this.effects = new EffectsManager(this.camera);
    this.audio = new AudioManager({ assetLoader: this.assetLoader });

    /* ---------- Entrada (§25, §26) ---------- */
    this.keyboard = new KeyboardInput();
    this.touch = new TouchInput();

    /* ---------- Bucle ---------- */
    this.running = false;
    /** true tras destroy(): el motor ya no debe bucle ni render. */
    this.destroyed = false;
    this.rafId = null;
    this.lastTime = 0;
    this.accumulator = 0;
    this.fps = 0;
    this.frameCount = 0;
    this.fpsTimer = 0;

    /** Último aviso contextual calculado (para el render). */
    this.contextHint = null;

    /**
     * Recolección en curso: la deja #applyHarvestOutcome y la aplica
     * #completeHarvest al terminar la animación.
     * @type {{plant:object, fruit:object, position:object, side:string}|null}
     */
    this.pendingHarvest = null;

    this._boundLoop = this.#loop.bind(this);
  }

  /* ============================================================
     CICLO DE VIDA
     ============================================================ */

  /**
   * Inicializa el motor: carga assets, monta la entrada y arranca
   * el bucle.
   */
  async init() {
    // Los assets que falten se sustituyen por placeholders: el juego
    // arranca siempre (§28).
    await this.assetLoader.loadAll();

    this.resize();

    // Teclado: se conecta el atajo de pausa.
    this.keyboard.onPause = () => this.requestPause();
    this.keyboard.attach();

    // Estado inicial: menú (el motor queda listo pero sin nivel).
    this.state.setStatus(GAME_STATES.MENU);

    this.#startLoop();

    this.#emit(ENGINE_EVENTS.READY, {
      assets: this.assetLoader.getReport(),
    });

    if (this.callbacks.onReady) {
      this.callbacks.onReady({
        assets: this.assetLoader.getReport(),
        logicalSize: { width: this.logicalWidth, height: this.logicalHeight },
      });
    }

    return this;
  }

  /** Arranca el bucle de juego. */
  #startLoop() {
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this._boundLoop);
  }

  /** Detiene el bucle (al pausar o desmontar). */
  stop() {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /** Reanuda el bucle tras un stop. */
  start() {
    if (this.running || this.destroyed) return;
    this.#startLoop();
  }

  /**
   * Destruye el motor por completo. Lo llama React en el cleanup
   * del useEffect para no dejar bucles ni listeners vivos.
   *
   * IMPORTANTE: es IDEMPOTENTE y deja el motor marcado como destruido.
   * Con React StrictMode (montar → desmontar → montar) el cleanup del
   * primer montaje corría con un frame ya programado; ese frame volvía
   * a pedir otro y el motor "muerto" seguía dibujando sobre el mismo
   * canvas, pisando el render del motor nuevo con su fondo vacío.
   */
  destroy() {
    this.destroyed = true;
    this.stop();
    this.keyboard.detach();
    this.audio.dispose();
    this.effects.clear();
    this.assetLoader.dispose();
    this.plants = [];
    this.boxes = [];
    this.player = null;
    this.basket = null;
    this.supervisor = null;
    this.truck = null;

    // Se libera el mundo: así un motor destruido no puede pintar el
    // mapa de nadie (antes quedaba la referencia y el motor "muerto"
    // seguía dibujando el fondo vacío encima del motor nuevo).
    this.map.data = null;
    this.map.plants = [];
    this.harvestSystem.setMap(this.map);

    this.callbacks = {};
  }

  /* ============================================================
     BUCLE PRINCIPAL (§4)
     ============================================================ */

  #loop(timestamp) {
    // Un motor destruido nunca debe volver a dibujar ni reprogramarse:
    // pisaría el canvas del motor nuevo.
    if (!this.running || this.destroyed) return;

    this.rafId = requestAnimationFrame(this._boundLoop);

    // Delta time en segundos, acotado para evitar saltos enormes
    // cuando la pestaña ha estado en segundo plano.
    let dt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    if (!Number.isFinite(dt) || dt < 0) dt = 0;
    if (dt > GAME_CONFIG.maxDeltaTime) dt = GAME_CONFIG.maxDeltaTime;

    // FPS para el panel de depuración.
    this.frameCount += 1;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 0.5) {
      this.fps = Math.round(this.frameCount / this.fpsTimer);
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    this.update(dt);
    this.render();
  }

  /* ============================================================
     ACTUALIZACIÓN
     ============================================================ */

  /**
   * Actualiza un frame.
   * @param {number} dt segundos
   */
  update(dt) {
    const status = this.state.status;

    // Tiempo de presentación: anima la flecha de entrega y los pulsos
    // del HUD. No afecta a la lógica del juego.
    this.presentationTime += dt;

    // La cámara y los efectos siempre se actualizan (así la sacudida
    // y las partículas terminan aunque el juego esté pausado).
    this.camera.update(dt);

    switch (status) {
      case GAME_STATES.PLAYING:
      case GAME_STATES.INSPECTION:
        this.#updatePlaying(dt);
        break;

      case GAME_STATES.PAUSED:
        // Congelado: solo se comprueba la entrada de pausa.
        if (this.keyboard.wasPressed(['Escape']) || this.touch.consumePause()) {
          this.resume();
        }
        this.keyboard.endFrame();
        break;

      default:
        // MENU / TUTORIAL / LEVEL_COMPLETE / GAME_OVER: el mundo no
        // avanza, pero el bucle sigue vivo para poder reiniciar sin
        // recrear el motor.
        this.effects.update(dt);
        break;
    }
  }

  #updatePlaying(dt) {
    /* ---------- 1. Entrada de movimiento (§25, §26) ---------- */
    const axisX = this.keyboard.axisX + this.touch.axisX;
    const axisY = this.keyboard.axisY + this.touch.axisY;

    // Se acota a -1..1 por si se pulsan varias fuentes a la vez.
    const clampedX = Math.max(-1, Math.min(1, axisX));
    const clampedY = Math.max(-1, Math.min(1, axisY));

    /* ---------- 2. Movimiento con colisiones (§39) ---------- */
    if (this.player) {
      // Mientras cosecha, el jugador no camina (§6).
      if (this.player.isHarvesting) {
        this.player.setMoveIntent(0, 0);
      } else {
        this.player.setMoveIntent(clampedX, clampedY);
        this.player.updateFacing(clampedX, clampedY);

        // Se mueve solo el rect de los pies: colisiona más natural.
        const feet = this.player.feetRect;
        const dx = this.player.vx * dt;
        const dy = this.player.vy * dt;

        if (dx !== 0 || dy !== 0) {
          const moved = this.collisionSystem.moveRect(feet, dx, dy);

          // Se traslada el centro del jugador según el movimiento REAL
          // de los pies.
          //
          // Los pies están desplazados respecto al centro:
          //     feet.y = y + height/2 - feet.h        (feetOffset)
          // Por tanto la conversión inversa es exacta:
          //     y = feet.y - feetOffset
          //
          // IMPORTANTE: la conversión debe ser la inversa EXACTA de
          // feetRect. Si se aproxima, cada frame se acumula un error y
          // el jugador deriva (llegó a moverse al revés).
          const feetOffsetY = this.player.height / 2 - feet.h;
          this.player.x = moved.x + feet.w / 2;
          this.player.y = moved.y - feetOffsetY;
        }
      }
    }

    /* ---------- 3. Acciones de recolección (§6, §7) ---------- */
    this.#handleHarvestInput();

    /* ---------- 4. Entrega (§15) ---------- */
    this.#handleDeliveryInput();

    /* ---------- 5. Actualización de entidades ---------- */
    this.player?.update(dt);

    for (let i = 0; i < this.plants.length; i += 1) {
      // Las plantas no tienen lógica por frame propia salvo el estado
      // visual, que ya se recalcula al recoger.
    }

    this.basket?.update(dt);
    for (let i = 0; i < this.boxes.length; i += 1) this.boxes[i].update(dt);
    this.truck?.update(dt);

    /* ---------- 6. Temporizadores (§19, §22) ---------- */
    const timerEvents = this.timerSystem.update(dt);
    this.#syncTimersToState();

    if (timerEvents.timeWarning) {
      this.effects.showBanner('QUEDA POCO TIEMPO', { duration: 1.2, color: '#f2c14e' });
      this.audio.supervisorAlert();
    }

    /* ---------- 7. Supervisor (§17, §19) ---------- */
    this.#updateSupervisor(dt, timerEvents);

    /* ---------- 8. Cámara sigue al jugador (§38) ---------- */
    if (this.player) {
      this.camera.follow(this.player.x, this.player.y, dt);
    }

    /* ---------- 9. Efectos ---------- */
    this.effects.update(dt);

    /* ---------- 10. Pistas contextuales (§54) ---------- */
    this.#updateContextHint();

    /* ---------- 11. Comprobación de fin de nivel (§24) ---------- */
    const outcome = this.levelSystem.evaluate();
    if (outcome.finished) {
      this.#handleLevelEnd(outcome);
    }

    /* ---------- 12. Publicación del HUD (solo si cambió) ---------- */
    this.state.dirty = true; // los timers cambian cada frame
    this.#publishHud();

    /* ---------- 13. Fin de frame de entrada ---------- */
    this.keyboard.endFrame();
    this.touch.endFrame();
  }

  /* ============================================================
     ENTRADA
     ============================================================ */

  /**
   * Aplica el resultado de una recolección cuando termina la animación.
   *
   * Se llama desde el handler persistente del jugador. Lee
   * `pendingHarvest`, que dejó preparado #applyHarvestOutcome().
   */
  #completeHarvest() {
    const pending = this.pendingHarvest;
    this.pendingHarvest = null;

    // Sin resultado pendiente: la animación fue "al aire" (el jugador
    // recogió donde no había nada).
    if (!pending || !this.basket) return;

    const accepted = this.basket.add(1, { unripe: false });
    if (accepted <= 0) return;

    this.scoreSystem.addRipe(1);
    this.state.registerHarvest();

    this.effects.onHarvest(pending.position.x, pending.position.y);
    this.audio.harvest();

    if (pending.plant) {
      this.effects.particles.emitLeaves(pending.plant.centerX, pending.plant.centerY);
    }

    // Canasta llena: aviso para que el jugador regrese a entregar (§14).
    if (this.basket.isFull) {
      this.effects.onBasketFull(this.basket.centerX, this.basket.centerY - 10);
      this.audio.supervisorAlert();
      this.#toast('CANASTA LLENA - REGRESA A ENTREGAR');
    }

    this.#publishHud();
  }

  #handleHarvestInput() {
    if (!this.player || !this.state.isPlaying) return;

    const touchLeft = this.touch.consumeHarvestLeft();
    const touchRight = this.touch.consumeHarvestRight();
    const keyLeft = this.keyboard.harvestLeftPressed;
    const keyContext = this.keyboard.wasPressed(['KeyE', 'Space']);

    let side = null;

    if (touchLeft || keyLeft) {
      side = HARVEST_SIDES.LEFT;
    } else if (touchRight) {
      side = HARVEST_SIDES.RIGHT;
    } else if (keyContext) {
      // Acción contextual: el sistema elige el mejor lado (§25).
      side = this.harvestSystem.findBestSide(this.player);
    }

    if (!side) return;

    const outcome = this.harvestSystem.harvest(this.player, side);
    this.#applyHarvestOutcome(outcome, side);
  }

  /**
   * Recolecta el fruto que hay bajo un punto del mundo (click/toque).
   *
   * Es la vía principal de recolección (§5): en PC se hace click sobre
   * el arándano y en móvil se toca encima. Reutiliza exactamente la
   * misma lógica que la recolección por lado, así que las reglas
   * (alcance, puntuación, errores, efectos) son idénticas.
   *
   * Cada fruto es una unidad: un toque recoge UN fruto (§6), nunca el
   * grupo entero.
   *
   * @param {number} worldX x del punto pulsado, en px del mundo
   * @param {number} worldY y del punto pulsado
   * @param {number} radius radio extra de acierto (dedo en móvil)
   * @returns {boolean} true si había un fruto bajo el punto
   */
  harvestAt(worldX, worldY, radius = 0) {
    if (this.state.status !== GAME_STATES.PLAYING) return false;
    if (!this.player) return false;

    const target = this.harvestSystem.findFruitAt(
      this.player,
      worldX,
      worldY,
      radius
    );
    if (!target) return false;

    // Sin lado explícito: harvest() lo deduce de dónde está el jugador.
    const outcome = this.harvestSystem.harvest(this.player, null, target);
    this.#applyHarvestOutcome(outcome, outcome.side);
    return true;
  }

  /**
   * Recolecta a partir de un punto de la PANTALLA (px CSS relativos al
   * canvas). Es lo que llaman el ratón y el dedo.
   *
   * El canvas se dibuja en píxeles FÍSICOS (CSS × devicePixelRatio) y
   * luego se aplica una escala para pasar del espacio lógico (480x800)
   * a ese buffer. Por eso convertir "px del dedo" a "px del mundo" no
   * es una simple división: hay que deshacer el DPR, la escala y el
   * centrado del lienzo.
   *
   * @param {number} cssX x en px CSS, relativo a la esquina del canvas
   * @param {number} cssY y en px CSS, relativo a la esquina del canvas
   */
  harvestAtScreen(cssX, cssY) {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;

    const dpr = this.canvas.width / rect.width;
    const scale = this.scale > 0 ? this.scale : 1;

    // Centrado del lienzo (mismo cálculo que usa render()).
    const offsetX = (this.canvas.width - this.logicalWidth * scale) / 2;
    const offsetY = (this.canvas.height - this.logicalHeight * scale) / 2;

    // px CSS → px físicos → px lógicos del juego.
    const logicalX = (cssX * dpr - offsetX) / scale;
    const logicalY = (cssY * dpr - offsetY) / scale;

    // Fuera del área de juego: no se recolecta nada.
    if (
      logicalX < 0 || logicalY < 0 ||
      logicalX > this.logicalWidth || logicalY > this.logicalHeight
    ) {
      return false;
    }

    // px lógicos → mundo, descontando el desplazamiento del HUD.
    const world = this.camera.screenToWorldWithHud(logicalX, logicalY, 1);

    // En móvil el dedo no acierta al píxel: se perdona un radio extra.
    // En PC el ratón es preciso, así que el radio es pequeño.
    const radius = this.isTouchDevice
      ? GAME_CONFIG.clickToleranceTouch
      : GAME_CONFIG.clickToleranceMouse;

    return this.harvestAt(world.x, world.y, radius);
  }

  #applyHarvestOutcome(outcome, side) {
    switch (outcome.result) {
      case HARVEST_RESULT.RIPE: {
        // Animación de recoger → el fruto entra en la canasta al
        // terminar la animación (§6).
        //
        // El resultado se guarda en `pendingHarvest` y lo aplica el
        // handler PERSISTENTE que se instaló en loadLevel(). Así una
        // segunda pulsación durante la animación no puede borrar el
        // callback pendiente (fallo detectado con las pruebas).
        this.pendingHarvest = {
          plant: outcome.plant,
          fruit: outcome.fruit,
          position: outcome.position,
          side,
        };

        this.player.harvestCount += 1;
        break;
      }

      case HARVEST_RESULT.UNRIPE: {
        // Error de pintón (§12): consecuencias inmediatas, sin esperar
        // a la animación.
        this.pendingHarvest = null;

        this.scoreSystem.addUnripe();
        this.state.registerUnripe();
        this.state.registerError({
          qualityLoss: GAME_CONFIG.qualityLossPerUnripe,
        });

        this.qualitySystem.applyUnripePenalty();
        this.state.quality = this.qualitySystem.value;

        this.player.showError(0.55);
        this.effects.onUnripeError(outcome.position.x, outcome.position.y);
        this.audio.error();

        this.#toast('ERROR: PINTON RECOGIDO');

        // Error grave: se pierde una vida (§21).
        if (this.state.errors > 0 && this.state.errors % GAME_CONFIG.graveErrorThreshold === 0) {
          const lives = this.state.loseLife();
          this.effects.showBanner('VIDA PERDIDA', { duration: 1, color: '#e2453c' });
          if (lives <= 0) {
            this.#handleLevelEnd({
              finished: true,
              outcome: 'defeat',
              reason: 'noLives',
              message: 'Sin vidas.',
            });
          }
        }

        this.#publishHud();
        break;
      }

      case HARVEST_RESULT.COOLDOWN:
        // El jugador está animando: no pasa nada.
        break;

      case HARVEST_RESULT.NONE:
      case HARVEST_RESULT.NOTHING_ON_SIDE:
      default:
        // Se muestra la animación de recoger "al aire" para que el
        // gesto se vea aunque no haya fruto. El handler persistente
        // encontrará pendingHarvest = null y no hará nada.
        this.pendingHarvest = null;
        this.player.startHarvest(side, null);
        break;
    }
  }

  #handleDeliveryInput() {
    if (!this.player || !this.state.isPlaying) return;

    const touchDeliver = this.touch.consumeDeliver();
    const keyDeliver = this.keyboard.deliverPressed;

    if (!touchDeliver && !keyDeliver) return;

    const outcome = this.deliverySystem.deliver(this.player);

    if (outcome.result === DELIVERY_RESULT.DELIVERED) {
      this.scoreSystem.addDelivery();
      if (outcome.wasFull) this.scoreSystem.addFullDelivery();

      this.state.registerDelivery({
        delivered: outcome.delivered,
        full: outcome.wasFull,
      });

      this.qualitySystem.applyDeliveryBonus();
      this.state.quality = this.qualitySystem.value;

      this.effects.onDelivery(outcome.position.x, outcome.position.y);
      this.audio.delivery();

      this.#toast(`ENTREGA: ${outcome.delivered} arandanos`);
      this.#publishHud();
    } else if (outcome.result === DELIVERY_RESULT.EMPTY_BASKET) {
      this.#toast('LA CANASTA ESTA VACIA');
    }
  }

  /* ============================================================
     SUPERVISOR
     ============================================================ */

  #updateSupervisor(dt, timerEvents) {
    if (!this.supervisor) return;

    // Aviso visual unos segundos antes (§19).
    if (timerEvents.supervisorWarning && !this.supervisor.isActive) {
      this.effects.showBanner('REVISION DE CALIDAD EN CAMINO', {
        duration: 1.4,
        color: '#f2c14e',
      });
      this.audio.supervisorAlert();
    }

    // Activación cuando el temporizador llega a cero (§19).
    //
    // IMPORTANTE: TimerSystem es la ÚNICA fuente de verdad del tiempo.
    // Antes se pedía al Supervisor su propio contador (`tickTimer`), que
    // nadie decrementaba, así que la revisión NUNCA se activaba: dos
    // relojes independientes y uno de ellos parado.
    if (timerEvents.supervisorDue && !this.supervisor.isActive) {
      // El veredicto se calcula ahora; se mostrará al terminar la
      // revisión (§20: primero camina y revisa, luego dictamina).
      const stats = this.#inspectionStats();
      this.supervisor.lastResult = this.supervisor.evaluate(stats);
      this.supervisorSystem.pendingInspection = true;
      this.supervisor.startInspection();

      this.state.supervisorActive = true;
      this.state.setStatus(GAME_STATES.INSPECTION);
      this.effects.onSupervisorAlert(this.supervisor.x, this.supervisor.y - 20);
      this.audio.supervisorAlert();
      this.#publishHud();
    }

    // Actualización de la máquina de estados del supervisor.
    const result = this.supervisorSystem.update(dt);

    if (result) {
      this.#resolveInspection(result);
    }
  }

  /** Datos que el supervisor evalúa (§20). */
  #inspectionStats() {
    return {
      ripe: this.state.harvested + this.basket?.current ?? 0,
      unripe: this.state.unripeCollected,
      errors: this.state.errors,
      quality: Math.round(this.state.quality),
    };
  }

  /** Aplica el resultado de la revisión (§20). */
  #resolveInspection(result) {
    const effects = this.supervisorSystem.applyResult(result, {
      onReject: () => {
        // Rechazo: penalización de puntos y calidad.
        this.state.registerError({ qualityLoss: 4, pointsLoss: 0 });
        this.qualitySystem.adjust(-4);
        this.state.quality = this.qualitySystem.value;
      },
    });

    this.state.setInspectionResult(result);
    this.state.supervisorActive = false;
    this.state.setStatus(GAME_STATES.PLAYING);

    // El temporizador del supervisor se reinicia (§19).
    this.timerSystem.resetSupervisor();
    this.supervisorSystem.reset({
      interval: this.supervisorInterval,
      minimumQuality: this.state.levelConfig?.minimumQuality ?? 85,
    });

    this.effects.onInspectionResult(effects.approved, this.supervisor.x, this.supervisor.y - 24);
    this.#toast(result.message);

    if (effects.rejected) {
      this.audio.defeat();
    } else {
      this.audio.victory();
    }

    // Un rechazo con calidad crítica termina el nivel (§26).
    const check = this.levelSystem.checkQualityAfterInspection(effects);
    if (check.finished) this.#handleLevelEnd(check);

    this.#publishHud();
  }

  /* ============================================================
     PISTAS CONTEXTUALES (§54)
     ============================================================ */

  #updateContextHint() {
    if (!this.player) {
      this.contextHint = null;
      return;
    }

    const side = this.player.facing === 'left' ? HARVEST_SIDES.LEFT : HARVEST_SIDES.RIGHT;
    const target = this.harvestSystem.findTarget(this.player, side);

    if (target) {
      const isUnripe = target.fruit.type === FRUIT_TYPES.UNRIPE;
      this.contextHint = {
        type: isUnripe ? 'unripe' : 'ripe',
        side,
        x: target.position.x,
        y: target.position.y,
        text: isUnripe ? 'NO RECOGER PINTON' : 'RECOGE',
        plantId: target.plant.id,
      };
      return;
    }

    // ¿Está en la zona de entrega con la canasta llena?
    if (this.deliverySystem.canDeliver(this.player)) {
      this.contextHint = {
        type: 'deliver',
        x: this.player.x,
        y: this.player.y,
        text: 'ENTREGA',
        plantId: null,
      };
      return;
    }

    this.contextHint = null;
  }

  /* ============================================================
     FIN DE NIVEL
     ============================================================ */

  #handleLevelEnd(outcome) {
    if (this.state.isFinished) return;

    const isVictory = outcome.outcome === 'victory';

    if (isVictory) {
      if (this.player) this.player.showVictory();
      this.effects.onVictory(this.player?.x ?? this.logicalWidth / 2, this.player?.y ?? 300);
      this.audio.victory();
      this.effects.showBanner('NIVEL COMPLETADO', {
        duration: 2.4,
        color: '#4fbf5a',
        subtext: `Cosecha ${this.state.harvested}/${this.state.target}`,
      });
    } else {
      if (this.player) this.player.showDefeat();
      this.effects.onDefeat();
      this.audio.defeat();
      this.effects.showBanner('COSECHA RECHAZADA', {
        duration: 2.4,
        color: '#e2453c',
        subtext: outcome.message ?? '',
      });
    }

    // Snapshot final para React.
    const summary = this.levelSystem.buildSummary();
    this.#publishHud(true);

    this.#emit(
      isVictory ? ENGINE_EVENTS.LEVEL_COMPLETE : ENGINE_EVENTS.GAME_OVER,
      summary
    );

    if (isVictory && this.callbacks.onLevelComplete) {
      this.callbacks.onLevelComplete(summary);
    }
    if (!isVictory && this.callbacks.onGameOver) {
      this.callbacks.onGameOver(summary);
    }
  }

  /* ============================================================
     CONTROL DE NIVEL
     ============================================================ */

  /**
   * Carga y arranca un nivel (§27).
   * @param {number} levelId 1..12
   * @param {object} [options] { seed }
   */
  loadLevel(levelId = 1, options = {}) {
    const levelConfig = getLevelConfig(levelId);

    /* ---------- Estado ---------- */
    this.state.startLevel(levelConfig);

    /* ---------- Mundo (generación procedural, §19) ---------- */
    const world = this.map.generate(levelConfig, options);

    /* ---------- Plantas ---------- */
    // Se crean las instancias reales y se registran en el mapa: así el
    // motor, el HarvestSystem y el render trabajan sobre la MISMA lista
    // de plantas.
    this.plants = world.plants.map((def) => new Plant(def));
    this.map.setPlants(this.plants);
    this.harvestSystem.setMap(this.map);

    /* ---------- Colisiones ---------- */
    this.collisionSystem.setMap(this.map.collisionMap, this.map.bounds);

    /* ---------- Jugador ---------- */
    const spawn = world.spawn;
    this.player = new Player({ x: spawn.x, y: spawn.y });

    // Handler PERSISTENTE de recolección: se instala una sola vez y
    // aplica el resultado pendiente al terminar la animación. Antes se
    // reasignaba en cada pulsación y una segunda pulsación borraba el
    // callback pendiente, dejando la recolección sin efecto.
    this.pendingHarvest = null;
    this.player.onHarvestComplete = () => this.#completeHarvest();

    /* ---------- Canasta ---------- */
    const basketSpot = world.basketSpot;
    this.basket = new Basket({
      x: basketSpot.x,
      y: basketSpot.y,
      capacity: levelConfig.basketCapacity ?? GAME_CONFIG.basketCapacity,
    });

    /* ---------- Cajas (§16) ---------- */
    this.boxes = world.crateSpots.map(
      (spot, index) => new Box({ x: spot.x, y: spot.y, stackSize: index === 0 ? 3 : 1 })
    );

    /* ---------- Sistema de entrega ---------- */
    this.deliverySystem.setMap(this.map);
    this.deliverySystem.setBasket(this.basket);
    this.deliverySystem.setBoxes(this.boxes);

    /* ---------- Supervisor (§17) ---------- */
    const inspectionSpot = {
      x: this.basket.centerX + TILE_SIZE * 1.4,
      y: this.basket.centerY - 4,
    };

    this.supervisor = new Supervisor({
      x: world.supervisorSpawn.x,
      y: world.supervisorSpawn.y,
      homeSpot: world.supervisorSpawn,
      inspectionSpot,
    });

    this.supervisorInterval = levelConfig.supervisorInterval ?? GAME_CONFIG.supervisorInterval;
    this.supervisorSystem.setSupervisor(this.supervisor);
    this.supervisorSystem.reset({
      interval: this.supervisorInterval,
      minimumQuality: levelConfig.minimumQuality ?? 85,
    });

    /* ---------- Camión (§16) ---------- */
    const truckY = this.map.deliveryZone
      ? this.map.deliveryZone.y + TILE_SIZE * 0.6
      : this.logicalHeight - 60;
    this.truck = new Truck({
      x: -80,
      y: truckY,
      entryX: -80,
      exitX: this.logicalWidth + 100,
    });
    this.truck.setLoadingSpot(this.basket.centerX + TILE_SIZE * 1.6, truckY);

    /* ---------- Sistemas de puntuación y calidad ---------- */
    this.scoreSystem.reset();
    this.qualitySystem.reset(GAME_CONFIG.initialQuality);
    this.state.quality = this.qualitySystem.value;

    /* ---------- Temporizadores (§19, §22) ---------- */
    this.timerSystem.configure({
      timeLimit: levelConfig.timeLimit ?? 180,
      supervisorInterval: this.supervisorInterval,
    });
    this.timerSystem.start();
    this.#syncTimersToState();

    /* ---------- Sistemas de nivel ---------- */
    this.levelSystem.setState(this.state);
    this.levelSystem.reset();

    /* ---------- Cámara (§38) ---------- */
    // Se asegura la reserva del HUD aunque no se haya llamado a resize().
    this.#applyHudInsets();
    this.camera.setWorldSize(this.map.width, this.map.height);
    this.camera.snapTo(this.player.x, this.player.y);

    /* ---------- Paisaje (§8) ---------- */
    // La franja de paisaje vive en las primeras filas del mundo.
    // Se calcula a partir del alto de la zona de césped superior.
    this.#setupLandscape();

    /* ---------- Efectos ---------- */
    this.effects.clear();

    /* ---------- Entrada limpia ---------- */
    this.keyboard.reset();
    this.touch.reset();

    this.#publishHud();
    this.#publishState();

    return this.state.toHudSnapshot({
      basketCurrent: this.basket.current,
      basketCapacity: this.basket.capacity,
      basketFull: this.basket.isFull,
    });
  }

  /** Reinicia el nivel actual (§21: "se puede reiniciar"). */
  restartLevel(options = {}) {
    return this.loadLevel(this.state.levelId, options);
  }

  /** Pasa al siguiente nivel. */
  nextLevel() {
    const next = Math.min(TOTAL_LEVELS, this.state.levelId + 1);
    return this.loadLevel(next);
  }

  /* ============================================================
     PAUSA (§38)
     ============================================================ */

  pause() {
    if (!this.state.is(GAME_STATES.PLAYING, GAME_STATES.INSPECTION)) return false;

    this.state.paused = true;
    this.state.setStatus(GAME_STATES.PAUSED);
    this.timerSystem.pause();

    this.#publishState();
    return true;
  }

  resume() {
    if (!this.state.is(GAME_STATES.PAUSED)) return false;

    this.state.paused = false;
    this.state.setStatus(GAME_STATES.PLAYING);
    this.timerSystem.resume();
    this.keyboard.reset();

    this.#publishState();
    return true;
  }

  togglePause() {
    return this.state.is(GAME_STATES.PAUSED) ? this.resume() : this.pause();
  }

  /** React pide la pausa (tecla ESC o botón del HUD). */
  requestPause() {
    if (this.state.is(GAME_STATES.PLAYING, GAME_STATES.INSPECTION)) {
      this.pause();
      this.#emit(ENGINE_EVENTS.PAUSE_REQUEST, {});
    }
  }

  /** Vuelve al menú principal. */
  goToMenu() {
    this.state.setStatus(GAME_STATES.MENU);
    this.timerSystem.pause();
    this.effects.clear();
    this.#publishState();
    this.#publishHud();
  }

  /** Muestra el tutorial (React dibuja la capa). */
  showTutorial() {
    this.state.setStatus(GAME_STATES.TUTORIAL);
    this.#publishState();
  }

  /* ============================================================
     SINCRONIZACIÓN CON EL ESTADO
     ============================================================ */

  #syncTimersToState() {
    this.state.timeLeft = this.timerSystem.timeLeft;
    this.state.supervisorTimer = this.timerSystem.supervisorLeft;
    this.state.timeWarning = this.timerSystem.isWarning;
  }

  /**
   * Publica el HUD hacia React. Se llama solo cuando hay cambios
   * (§34, §41: React NO re-renderiza cada frame).
   */
  #publishHud(force = false) {
    if (!this.state.dirty && !force) return;

    const snapshot = this.state.toHudSnapshot({
      basketCurrent: this.basket?.current ?? 0,
      basketCapacity: this.basket?.capacity ?? GAME_CONFIG.basketCapacity,
      basketFull: this.basket?.isFull ?? false,
    });

    // Los temporizadores se copian ya sincronizados.
    snapshot.timeLeft = this.timerSystem.timeLeft;
    snapshot.supervisorTimer = this.timerSystem.supervisorLeft;
    snapshot.supervisorInterval = this.timerSystem.supervisorInterval;

    this.state.dirty = false;
    this.#emit(ENGINE_EVENTS.HUD_UPDATE, snapshot);

    if (this.callbacks.onHudUpdate) this.callbacks.onHudUpdate(snapshot);
  }

  #publishState() {
    this.#emit(ENGINE_EVENTS.STATE_CHANGE, { status: this.state.status });
    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange({ status: this.state.status });
    }
  }

  /** Aviso breve hacia la UI externa (§54). */
  #toast(text) {
    this.#emit(ENGINE_EVENTS.TOAST, { text });
    if (this.callbacks.onToast) this.callbacks.onToast({ text });
  }

  /**
   * Emite un evento del motor. Permite que React se suscriba sin
   * acoplarse a la implementación interna.
   */
  #emit(eventName, detail) {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }

  /* ============================================================
     RENDERIZADO (§12, §34, §41)
     ============================================================ */

  /**
   * Ajusta el tamaño del canvas al contenedor manteniendo la
   * resolución lógica interna (§11).
   */
  resize() {
    // La reserva de sitio para el HUD NO depende del tamaño del canvas:
    // se aplica siempre, antes de cualquier salida temprana. Si se
    // dejara dentro del cálculo de tamaño, un canvas sin contenedor
    // (o el motor usado sin DOM, como en las pruebas) se quedaría sin
    // franja útil y el campo se dibujaría debajo de los paneles.
    this.#applyHudInsets();

    const canvas = this.canvas;
    const parent = canvas.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // tope de 2: rendimiento

    const displayWidth = Math.max(1, Math.floor(rect.width));
    const displayHeight = Math.max(1, Math.floor(rect.height));

    // El canvas se dimensiona en píxeles físicos para verse nítido,
    // pero el juego sigue trabajando en 360x640 lógicos.
    canvas.width = Math.floor(displayWidth * dpr);
    canvas.height = Math.floor(displayHeight * dpr);
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    // Escala = cuánto hay que ampliar el mundo lógico para llenar el
    // canvas. Se usa la MENOR para no deformar nunca (§11).
    const scaleX = canvas.width / this.logicalWidth;
    const scaleY = canvas.height / this.logicalHeight;
    this.scale = Math.min(scaleX, scaleY);

    this.ctx.imageSmoothingEnabled = false;
    this.renderer.resize(this.logicalWidth, this.logicalHeight);

    // Recalcula límites de cámara por si cambió el tamaño.
    if (this.map.data) {
      this.camera.setWorldSize(this.map.width, this.map.height);
      if (this.player) this.camera.snapTo(this.player.x, this.player.y);
    }
  }

  render() {
    const ctx = this.ctx;
    const status = this.state.status;

    // Limpieza en coordenadas físicas.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#0d1b10';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Aplica la escala lógica. Se centra con una pequeña traslación
    // si la proporción no es exacta.
    const offsetX = (this.canvas.width - this.logicalWidth * this.scale) / 2;
    const offsetY = (this.canvas.height - this.logicalHeight * this.scale) / 2;

    ctx.setTransform(
      this.scale, 0, 0, this.scale,
      offsetX, offsetY
    );
    ctx.imageSmoothingEnabled = false;

    // Si no hay nivel cargado (menú), solo se dibuja el fondo.
    if (!this.map.data) {
      this.#renderEmptyBackground();
      return;
    }

    /* ---------- Mundo (con cámara) ---------- */
    // El mundo se dibuja en la franja entre el HUD superior y el
    // inferior: se traslada hacia abajo por el alto del HUD de arriba.
    ctx.save();
    ctx.translate(0, this.camera.worldOffsetY);
    ctx.translate(-this.camera.originX, -this.camera.originY);

    // Paisaje al fondo: cielo, montañas y árboles (§8). Va primero
    // para que el campo se dibuje encima.
    this.renderer.drawLandscape(this.camera, this.landscapeLayout);

    this.renderer.drawTerrain(this.map.tileMap, this.camera);
    this.renderer.drawFruits(this.plants, this.camera);

    // Entidades ordenadas por Y: las de más abajo se dibujan después
    // para dar sensación de profundidad.
    this.#drawEntitiesSorted();

    if (this.contextHint && this.contextHint.type !== 'deliver') {
      this.renderer.drawHarvestIndicator(
        this.contextHint.x,
        this.contextHint.y,
        this.contextHint.side,
        this.contextHint.type === 'unripe'
      );
    }

    this.effects.drawWorld(this.sprites);
    ctx.restore();

    /* ---------- HUD (coordenadas lógicas, sin cámara) ---------- */
        if (status !== GAME_STATES.MENU && status !== GAME_STATES.TUTORIAL) {
          const hudData = this.#hudData();

          // HUD superior: logo, stats, objetivo y calidad (§2)
          this.hud.drawTop(hudData);

          // Leyenda de frutos, flotando sobre la esquina derecha del campo (§3)
          this.hud.drawLegend(this.logicalWidth - 88, GAME_CONFIG.hudHeight + 4);
        }

    /* ---------- Efectos de pantalla ---------- */
    this.effects.drawScreen(this.sprites);

    /* ---------- Pista contextual sobre el jugador ---------- */
    if (this.contextHint && this.player && status === GAME_STATES.PLAYING) {
      // El mundo está trasladado por el HUD superior y la cámara.
      const screenX = this.player.x - this.camera.originX;
      const screenY = this.player.y - this.camera.originY + this.camera.worldOffsetY;

      this.renderer.drawContextHint(screenX, screenY, this.contextHint.text, {
        color: this.contextHint.type === 'unripe' ? '#e2453c' : '#f2c14e',
      });
    }

    /* ---------- Burbuja del supervisor (§6) ---------- */
    if (this.supervisor?.bubbleText) {
      const bx = this.supervisor.x - this.camera.originX;
      const by = this.supervisor.y - this.camera.originY + this.camera.worldOffsetY;
      this.renderer.drawBubble(bx, by, this.supervisor.bubbleText, {
        color: '#1a2c4e',
        borderColor: '#4a6fa5',
      });
    }

    /* ---------- Contador de canasta (§5) ---------- */
    if (this.basket && status === GAME_STATES.PLAYING) {
      const bx = this.basket.x + this.basket.width / 2 - this.camera.originX;
      const by = this.basket.y - this.camera.originY + this.camera.worldOffsetY;
      this.hud.drawBasketCounter(bx, by, this.basket.current, this.basket.capacity, this.basket.isFull);
    }

    /* ---------- Flecha de entrega (§4) ---------- */
    // Aparece cuando el jugador lleva fruta y está en la zona de entrega.
    if (this.basket && status === GAME_STATES.PLAYING && this.basket.current > 0) {
      const near =
        this.basket.current >= this.basket.capacity ||
        (this.deliverySystem?.isPlayerInZone?.(this.player) ?? false);

      if (near) {
        const bx = this.basket.x + this.basket.width / 2 - this.camera.originX - 11;
        const by = this.basket.y - this.camera.originY + this.camera.worldOffsetY - 34;
        this.hud.drawDeliverArrow(bx, by, this.presentationTime * 4);
      }
    }

    /* ---------- Panel de depuración ---------- */
    if (GAME_CONFIG.showFps) {
      this.sprites.drawText(`${this.fps} FPS`, 6, this.logicalHeight - 12, {
        size: 6,
        color: '#8fa394',
      });
    }
  }

  /** Datos compactos para el HUD del canvas. */
  #hudData() {
    const levelConfig = this.state.levelConfig ?? {};

    return {
      level: this.state.levelId,
      totalLevels: TOTAL_LEVELS,
      timeLeft: this.timerSystem.timeLeft,
      harvested: this.state.harvested,
      target: this.state.target,
      errors: this.state.errors,
      quality: this.state.quality,
      lives: this.state.lives,
      maxLives: this.state.maxLives,
      score: this.state.score,
      basketCurrent: this.basket?.current ?? 0,
      basketCapacity: this.basket?.capacity ?? 0,
      basketFull: this.basket?.isFull ?? false,
      supervisorTimer: this.timerSystem.supervisorLeft,
      supervisorInterval: this.timerSystem.supervisorInterval,
      supervisorActive: this.supervisor?.isActive ?? false,
      // Texto de objetivo del nivel (o el genérico del HUD)
      objective: levelConfig.objective ?? null,
    };
  }

  /**
   * Dibuja las entidades ordenadas por profundidad (Y).
   * Se construye una lista ligera cada frame: son pocas decenas de
   * entidades y evita ordenar objetos pesados.
   */
  #drawEntitiesSorted() {
    const drawables = [];

    // Plantas
    for (let i = 0; i < this.plants.length; i += 1) {
      const plant = this.plants[i];
      if (!this.camera.isVisible({ x: plant.x, y: plant.y, w: TILE_SIZE, h: TILE_SIZE })) continue;
      drawables.push({ y: plant.y, kind: 'plant', ref: plant });
    }

    // Cajas
    for (let i = 0; i < this.boxes.length; i += 1) {
      const box = this.boxes[i];
      if (!this.camera.isVisible(box.rect)) continue;
      drawables.push({ y: box.y, kind: 'box', ref: box });
    }

    // Canasta
    if (this.basket && this.camera.isVisible(this.basket.rect)) {
      drawables.push({ y: this.basket.y + this.basket.height * 0.5, kind: 'basket', ref: this.basket });
    }

    // Camión (siempre detrás de los personajes)
    if (this.truck?.isVisible) {
      drawables.push({ y: this.truck.y - 4, kind: 'truck', ref: this.truck });
    }

    // Supervisor
    if (this.supervisor && this.camera.isVisible(this.supervisor.rect)) {
      drawables.push({ y: this.supervisor.y, kind: 'supervisor', ref: this.supervisor });
    }

    // Jugador
    if (this.player) {
      drawables.push({ y: this.player.y, kind: 'player', ref: this.player });
    }

    drawables.sort((a, b) => a.y - b.y);

    for (let i = 0; i < drawables.length; i += 1) {
      const item = drawables[i];
      switch (item.kind) {
        case 'plant':
          this.sprites.draw(item.ref.spriteKey, item.ref.x, item.ref.y, {
            frameSize: TILE_SIZE,
            width: TILE_SIZE,
            height: Math.round(TILE_SIZE * 1.1),
          });
          break;

        case 'basket':
          this.renderer.drawBasket(item.ref);
          break;

        case 'box':
          this.renderer.drawBoxes([item.ref]);
          break;

        case 'truck':
          this.renderer.drawTruck(item.ref);
          break;

        case 'supervisor':
          this.renderer.drawEntity(item.ref, this.camera, {
            width: 26,
            height: 30,
            frameSize: 32,
          });
          break;

        case 'player':
          this.renderer.drawEntity(item.ref, this.camera, {
            width: 32,
            height: 32,
            frameSize: 32,
            tint: item.ref.errorFlash > 0 ? '#e2453c' : null,
          });
          break;

        default:
          break;
      }
    }
  }

  /**
   * Reserva en la cámara el alto de los dos HUD (§2, §7).
   *
   * El campo se dibuja SOLO en la franja entre el HUD superior y el
   * inferior; esta reserva es la que hace que la cámara no muestre el
   * mundo por debajo de los paneles y que el scroll vertical sea el
   * correcto.
   */
  #applyHudInsets() {
    this.camera.setInsets(GAME_CONFIG.hudHeight, GAME_CONFIG.hudBottomHeight);
    this.hud.resize(this.logicalWidth, this.logicalHeight, {
      hudHeight: GAME_CONFIG.hudHeight,
      bottomHeight: GAME_CONFIG.hudBottomHeight,
    });
  }

  /**
   * Calcula la franja de paisaje (§8).
   *
   * El paisaje ocupa las primeras filas del mundo (césped superior) y
   * muestra, de atrás hacia delante: cielo, nubes, montañas y árboles.
   * Se guarda en `this.landscapeLayout` y el Renderer lo usa cada frame.
   */
  #setupLandscape() {
    // Alto disponible: las filas de césped iniciales del mapa.
    const grassRows = this.map.data?.grassRows ?? 2;
    const height = Math.max(96, grassRows * TILE_SIZE + 64);

    this.landscapeLayout = {
      height,
      skyHeight: Math.round(height * 0.44),
      mountainHeight: Math.round(height * 0.31),
      treesY: Math.round(height * 0.78),
    };
  }

  #renderEmptyBackground() {
    const ctx = this.ctx;
    // Cielo
    ctx.fillStyle = '#4a9eff';
    ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight * 0.35);
    // Campo
    ctx.fillStyle = '#4e8f3f';
    ctx.fillRect(0, this.logicalHeight * 0.35, this.logicalWidth, this.logicalHeight * 0.65);

    // Nubes decorativas
    for (let i = 0; i < 3; i += 1) {
      const x = 40 + i * 110;
      const y = 30 + (i % 2) * 22;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(x, y, 16, 0, Math.PI * 2);
      ctx.arc(x + 18, y + 4, 12, 0, Math.PI * 2);
      ctx.arc(x - 16, y + 5, 11, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* ============================================================
     API PÚBLICA PARA REACT
     ============================================================ */

  /** Estado actual del motor (útil para sincronizar la UI). */
  getStatus() {
    return this.state.status;
  }

  /** Instantánea del HUD bajo demanda. */
  getHudSnapshot() {
    return this.state.toHudSnapshot({
      basketCurrent: this.basket?.current ?? 0,
      basketCapacity: this.basket?.capacity ?? GAME_CONFIG.basketCapacity,
      basketFull: this.basket?.isFull ?? false,
    });
  }

  /** Resumen del nivel actual (para resultados y "compartir"). */
  getLevelSummary() {
    return this.levelSystem.buildSummary();
  }

  /** Datos de depuración. */
  getDebugInfo() {
    return {
      fps: this.fps,
      status: this.state.status,
      scale: this.scale,
      canvas: { width: this.canvas.width, height: this.canvas.height },
      camera: { x: Math.round(this.camera.x), y: Math.round(this.camera.y) },
      world: this.map.getSummary(),
      effects: this.effects.getStats(),
      assets: this.assetLoader.getReport(),
    };
  }

  /**
   * Diagnóstico de render: comprueba que el mundo se está dibujando
   * de verdad. Muestrea píxeles del canvas y cuenta colores.
   *
   * Es una herramienta de verificación (tests y depuración): permite
   * detectar que "el juego se ve vacío" sin depender de una captura
   * de pantalla.
   */
  inspectRendering() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    if (!w || !h) {
      return { ok: false, reason: 'canvas sin tamaño' };
    }

    const data = ctx.getImageData(0, 0, w, h).data;
    const colors = new Set();
    let nonBackground = 0;
    let sampled = 0;

    // Muestreo disperso: suficiente para caracterizar la imagen sin
    // recorrer millones de píxeles.
    for (let y = 0; y < h; y += 3) {
      for (let x = 0; x < w; x += 3) {
        const i = (y * w + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        colors.add((r >> 3) << 10 | (g >> 3) << 5 | (b >> 3));
        sampled += 1;
        // El fondo del visor es #0d1b10.
        if (!(r === 13 && g === 27 && b === 16)) nonBackground += 1;
      }
    }

    const cameraView = this.camera.viewRect;

    return {
      ok: nonBackground > sampled * 0.3,
      canvasSize: { width: w, height: h },
      logicalSize: { width: this.logicalWidth, height: this.logicalHeight },
      scale: this.scale,
      distinctColors: colors.size,
      nonBackgroundRatio: +(nonBackground / Math.max(1, sampled)).toFixed(3),
      camera: {
        x: Math.round(this.camera.x),
        y: Math.round(this.camera.y),
        originX: this.camera.originX,
        originY: this.camera.originY,
        viewRect: cameraView,
      },
      world: {
        width: this.map.width,
        height: this.map.height,
        cols: this.map.tileMap?.cols ?? 0,
        rows: this.map.tileMap?.rows ?? 0,
      },
      counts: {
        plants: this.plants.length,
        visiblePlants: this.plants.filter((p) =>
          this.camera.isVisible({ x: p.x, y: p.y, w: TILE_SIZE, h: TILE_SIZE })
        ).length,
        fruits: this.plants.reduce((sum, p) => sum + p.remainingFruits, 0),
        boxes: this.boxes.length,
      },
      player: this.player
        ? {
            x: Math.round(this.player.x),
            y: Math.round(this.player.y),
            state: this.player.state,
            spriteKey: this.player.spriteKey,
          }
        : null,
      basket: this.basket ? { current: this.basket.current, capacity: this.basket.capacity } : null,
      assets: {
        total: this.assetLoader.totalCount,
        loaded: this.assetLoader.loadedCount,
        usingPlaceholders: this.assetLoader.placeholders.size,
      },
    };
  }

  /** Conecta/desconecta el audio (ajustes del usuario). */
  setSoundEnabled(enabled) {
    this.audio.setEnabled(enabled);
    if (enabled) this.audio.unlock();
    return this;
  }

  /** Entrada táctil: la capa React llama a estos métodos. */
  get touchInput() {
    return this.touch;
  }

  /** Activa el audio tras el primer gesto del usuario. */
  unlockAudio() {
    this.audio.unlock();
  }
}

export default GameEngine;
