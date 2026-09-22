/**
 * gameConfig.js
 * ---------------------------------------------------------------
 * SECCIÓN CONFIG del juego (especificación §45 y §23).
 * Todos los valores modificables viven aquí para poder ajustar la
 * dificultad sin tocar la lógica.
 */

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
  harvestReach: 34,
  harvestDuration: 0.34,  // segundos de la animación de recoger
  harvestCooldown: 0.08,

  /* ---------- Supervisor (§17, §19) ---------- */
  supervisorInterval: 45, // segundos por defecto
  supervisorWalkSpeed: 42,
  supervisorInspectionDuration: 4.5,

  /* ---------- Vista (§7, §11) ---------- */
  logicalWidth: 360,
  logicalHeight: 640,

  /* ---------- Bucle ---------- */
  fixedTimeStep: 1 / 60,
  maxDeltaTime: 0.1,      // evita saltos tras un freeze de pestaña

  /* ---------- Cámara (§38) ---------- */
  cameraLerp: 7.5,        // suavizado de seguimiento
  cameraDeadZone: 46,     // zona muerta vertical en px lógicos

  /* ---------- Presentación (§34) ----------
     Composición vertical, de arriba a abajo:
       HUD superior · paisaje · campo de cultivo · entrega · HUD inferior
     Estas alturas definen cuánto ocupa cada franja en px lógicos. */
  hudHeight: 62,          // alto del HUD superior en px lógicos
  hudBottomHeight: 46,    // alto del HUD inferior
  landscapeHeight: 46,    // franja de cielo + montañas tras el campo
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
