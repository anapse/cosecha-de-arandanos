/**
 * GameHud.jsx
 * ---------------------------------------------------------------
 * HUD arcade de 4 paneles estilizados con acabado azul acero y acentos dorados
 * idéntico al diseño de referencia (image.png):
 *
 *   [ VIDAS ]   [ ESTADÍSTICAS ]   [ PUNTUACIÓN ]   [ SIGUIENTE REVISIÓN EN ]
 *   - 3 corazones - Nivel 1/12      - Gran número     - Barra verde de progreso
 *                 - Tiempo mm:ss      dorado          - Cuenta atrás mm:ss
 *                 - Cosechados 28
 *                 - Errores 1
 */

import { formatTime } from '../../utils/math.js';
import './GameHud.css';

export default function GameHud({ hud, onPause }) {
  if (!hud) return null;

  const scoreFormatted = String(Math.max(0, hud.score ?? 0));
  const levelCurrent = hud.level ?? 1;
  const levelTotal = hud.totalLevels ?? 12;
  const timeFormatted = formatTime(hud.timeLeft ?? 180);
  const livesCount = Math.max(0, hud.lives ?? 3);
  const harvestedCount = hud.harvested ?? 0;
  const errorsCount = hud.errors ?? 0;

  // Temporizador de supervisión
  const supTimer = Math.max(0, hud.supervisorTimer ?? 25);
  const supInterval = hud.supervisorInterval ?? 30;
  const supProgress = Math.max(0, Math.min(100, (supTimer / supInterval) * 100));
  const supTimeFormatted = formatTime(supTimer);

  return (
    <div className="arcade-hud" role="region" aria-label="HUD de juego">
      {/* ============================================================
          1. PANEL IZQUIERDO: VIDAS
          ============================================================ */}
      <div className="hud-panel hud-panel--arcade hud-panel--lives">
        <div className="hud-title">VIDAS:</div>
        <div className="hud-lives__hearts" aria-label={`Vidas: ${livesCount}`}>
          {Array.from({ length: 3 }).map((_, i) => {
            const heartStatus =
              livesCount >= i + 1
                ? 'full'
                : livesCount >= i + 0.5
                ? 'half'
                : 'empty';

            return (
              <span
                key={i}
                className={`hud-pixel-heart is-${heartStatus}`}
                title={`Corazón ${i + 1}: ${heartStatus === 'full' ? 'Completo' : heartStatus === 'half' ? 'Medio' : 'Vacío'}`}
              >
                <svg viewBox="0 0 16 14" className="hud-heart-svg">
                  <defs>
                    <clipPath id={`heart-half-clip-${i}`}>
                      <rect x="0" y="0" width="8" height="14" />
                    </clipPath>
                  </defs>

                  {/* Silueta base oscura de fondo */}
                  <path
                    d="M2 2 H6 V4 H8 V4 H10 V2 H14 V6 H16 V8 H14 V10 H12 V12 H10 V14 H6 V12 H4 V10 H2 V8 H0 V6 H2 Z"
                    className="hud-heart-bg"
                  />

                  {/* Capa roja (completa o recortada a la mitad izquierda) */}
                  {heartStatus !== 'empty' && (
                    <g clipPath={heartStatus === 'half' ? `url(#heart-half-clip-${i})` : undefined}>
                      <path
                        d="M2 2 H6 V4 H8 V4 H10 V2 H14 V6 H16 V8 H14 V10 H12 V12 H10 V14 H6 V12 H4 V10 H2 V8 H0 V6 H2 Z"
                        className="hud-heart-red"
                      />
                      <circle cx="4.5" cy="4.5" r="1.3" className="hud-heart-shine" />
                    </g>
                  )}

                  {/* Línea divisoria vertical si está a la mitad */}
                  {heartStatus === 'half' && (
                    <line x1="8" y1="2" x2="8" y2="13" stroke="#0f172a" strokeWidth="1" />
                  )}
                </svg>
              </span>
            );
          })}
        </div>
      </div>

      {/* ============================================================
          2. PANEL MEDIO-IZQUIERDA: ESTADÍSTICAS (NIVEL, TIEMPO, COSECHADOS, ERRORES)
          ============================================================ */}
      <div className="hud-panel hud-panel--arcade hud-panel--stats">
        <div className="hud-stat-row">
          <span className="hud-stat-label">NIVEL:</span>
          <span className="hud-stat-value hud-stat-value--white">{levelCurrent} / {levelTotal}</span>
        </div>
        <div className="hud-stat-row">
          <span className="hud-stat-label">TIEMPO:</span>
          <span className="hud-stat-value hud-stat-value--gold">{timeFormatted}</span>
        </div>
        <div className="hud-stat-row">
          <span className="hud-stat-label">COSECHADOS:</span>
          <span className="hud-stat-value hud-stat-value--gold">{harvestedCount}</span>
        </div>
        <div className="hud-stat-row">
          <span className="hud-stat-label">ERRORES:</span>
          <span className="hud-stat-value hud-stat-value--red">{errorsCount}</span>
        </div>
      </div>

      {/* ============================================================
          3. PANEL MEDIO-DERECHA: PUNTUACIÓN
          ============================================================ */}
      <div className="hud-panel hud-panel--arcade hud-panel--score">
        <div className="hud-title">PUNTUACIÓN:</div>
        <div className="hud-score-number" title={`Puntos: ${hud.score}`}>
          {scoreFormatted}
        </div>
      </div>

      {/* ============================================================
          4. PANEL DERECHO: SIGUIENTE REVISIÓN EN
          ============================================================ */}
      <div className="hud-panel hud-panel--arcade hud-panel--review">
        <div className="hud-title">SIGUIENTE REVISIÓN EN:</div>
        <div className="hud-review-row">
          <div className="hud-progress-track">
            <div
              className="hud-progress-fill"
              style={{ width: `${supProgress}%` }}
            />
          </div>
          <span className="hud-review-time">{supTimeFormatted}</span>
        </div>
      </div>

      {/* ---------- Aviso Canasta Llena ---------- */}
      {hud.basketFull && (
        <div className="hud-banner-alert hud-banner-alert--full">
          🧺 CANASTA LLENA — ENTREGA EN EL BIN CENTRAL
        </div>
      )}
    </div>
  );
}
