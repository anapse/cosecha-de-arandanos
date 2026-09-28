/**
 * gameConfig.js
 * ---------------------------------------------------------------
 * SECCIÓN CONFIG del juego (especificación §45 y §23).
 * Todos los valores modificables viven aquí para poder ajustar la
 * dificultad sin tocar la lógica.
 */

// constants.js no importa nada, así que no hay ciclo de imports.
import { TILE_SIZE } from './constants.js';

export const GAME_CONFIG = {
  /* ---------- Jugador ---------- */
  // Velocidad en píxeles lógicos por segundo. No se aumenta para
  // subir dificultad (§28).
  playerSpeed: 78,
  playerRunMultiplier: 1.45,
  playerWidth: 20,
  playerHeight: 24,

  /* ---------- Canasta ---------- */
  basketCapacity: 30,

  /* ---------- Puntuación (§23) ---------- */
  scoreRipe: 10,          // arándano maduro
  scoreDelivery: 100,     // entrega
  scoreFullDelivery: 100, // bonus por entregar canasta llena
  perfectHarvestScore: 250,
  scoreUnripe: -25,       // pintón recogido
  errorScore: -50,        // error de recolección

  /* ---------- Calidad (§13) ---------- */
  initialQuality: 100,
  qualityLossPerUnripe: 6,
  qualityLossPerError: 8,
  qualityGainPerDelivery: 1.5,

  /* ---------- Vidas (§21) ---------- */
  initialLives: 3,
  // Un error "grave" es alcanzar este nº de errores acumulados sin entregar.
  graveErrorThreshold: 3,

  /* ---------- Cosecha (§6) ---------- */
  // Distancia máxima (px lógicos) a la que se detecta un fruto.
  //
  // Debe ir en proporción al tamaño del tile: con tiles de 48px el
  // jugador se sitúa en el camino y el fruto cuelga dentro de la
  // hilera, así que el alcance tiene que cubrir algo más de un tile.
  // Con 34 (valor de cuando los tiles eran de 32) la recolección
  // fallaba en silencio.
  harvestReach: TILE_SIZE + 6,
  harvestDuration: 0.34,  // segundos de la animación de recoger
  harvestCooldown: 0.08,

  /* ---------- Recolección por click/toque (§5) ---------- */
  // Radio extra de acierto alrededor del fruto, en px lógicos.
  //
  // El fruto mide pocos píxeles: en PC el ratón es preciso y basta un
  // margen pequeño, pero en un teléfono el dedo es mucho más grueso y
  // hay que perdonar bastante o no se acierta nunca.
  clickToleranceMouse: 8,
  clickToleranceTouch: 22,

  /* ---------- Supervisor (§17, §19) ---------- */
  supervisorInterval: 45, // segundos por defecto
  supervisorWalkSpeed: 42,
  supervisorInspectionDuration: 4.5,

  /* ---------- Vista (§7, §11) ---------- */
/* ============================================================
   PRESENTACIÓN — escala del juego
   ------------------------------------------------------------
   El viewport lógico define cuánto ocupa cada cosa EN PANTALLA.
   432x768 (proporción 9:16 exacta):
   - 9 columnas de 48px = 432px de ancho exacto (4 hileras de cultivo).
   - 16 filas de 48px = 768px de alto exacto.
   El mapa coincide exactamente con el ancho de la pantalla,
   evitando cualquier movimiento horizontal de la cámara.
   ============================================================ */
  logicalWidth: 432,
  logicalHeight: 768,

  /* ---------- Bucle ---------- */
  fixedTimeStep: 1 / 60,
  maxDeltaTime: 0.1,      // evita saltos tras un freeze de pestaña

  /* ---------- Cámara (§38) ---------- */
  cameraLerp: 7.5,        // suavizado de seguimiento
  cameraDeadZone: 46,     // zona muerta vertical en px lógicos

  /* ---------- Presentación (§34) ----------
     Composición vertical, de arriba a abajo:
       Paisaje superior (cielo y montañas tras el HUD) · campo de cultivo · entrega
     La cámara es estática y el lienzo abarca desde y=0. */
  hudHeight: 0,            // Sin desplazamiento: el paisaje empieza en y=0
  hudBottomHeight: 0,
  touchControlsHeight: 132,
  showFps: false,
  debugCollisions: false,
};

/* Límites de seguridad: evitan estados raros si se edita el config. */
export const CONFIG_LIMITS = {
  minQuality: 0,
  maxQuality: 100,
  minSpeed: 10,
  maxSpeed: 400,
  minBasket: 1,
  maxBasket: 999,
};
