/**
 * GameHud.jsx
 * ---------------------------------------------------------------
 * HUD arcade compacto y estilizado de 3 paneles con acabado de madera y metal.
 * Proporciones armoniosas y tipografía refinada para máxima nitidez y confort.
 *
 *   [ PANEL VIDAS ]   [ PANEL PUNTUACIÓN & NIVEL ]   [ PANEL TIEMPO ]
 *   - 3 corazones     - Puntuación en 6 dígitos       - Icono reloj
 *   - "VIDAS 3"       - Nivel en píldora verde        - "02:35"
 *                     - Remaches dorados              - Botón de pausa
 */

import { formatTime } from '../../utils/math.js';
import './GameHud.css';

export default function GameHud({ hud, onPause }) {
  if (!hud) return null;

  const scoreFormatted = String(Math.max(0, hud.score ?? 0)).padStart(6, '0');
  const levelText = `${hud.level ?? 1}-1`;
  const timeFormatted = formatTime(hud.timeLeft ?? 180);
  const livesCount = Math.max(0, hud.lives ?? 3);

  return (
    <div className="arcade-hud" role="region" aria-label="HUD de juego">
      {/* ============================================================
          1. PANEL IZQUIERDO: VIDAS (Madera con tornillos y corazones)
          ============================================================ */}
      <div className="hud-panel hud-panel--wood hud-panel--lives">
        <span className="hud-screw hud-screw--tl" aria-hidden="true" />
        <span className="hud-screw hud-screw--tr" aria-hidden="true" />
        <span className="hud-screw hud-screw--bl" aria-hidden="true" />
        <span className="hud-screw hud-screw--br" aria-hidden="true" />

        <div className="hud-lives__hearts" aria-label={`Vidas: ${livesCount}`}>
          {Array.from({ length: 3 }).map((_, i) => (
            <span
              key={i}
              className={`hud-pixel-heart ${i < livesCount ? 'is-full' : 'is-empty'}`}
            >
              <svg viewBox="0 0 16 14" className="hud-heart-svg">
                <path
                  d="M2 2 H6 V4 H8 V4 H10 V2 H14 V6 H16 V8 H14 V10 H12 V12 H10 V14 H6 V12 H4 V10 H2 V8 H0 V6 H2 Z"
                  className="hud-heart-path"
                />
                <circle cx="4.5" cy="4.5" r="1.2" className="hud-heart-shine" />
              </svg>
            </span>
          ))}
        </div>

        <div className="hud-lives__text-row">
          <span className="hud-label hud-label--yellow">VIDAS</span>
          <span className="hud-value hud-value--lives">{livesCount}</span>
        </div>
      </div>

      {/* ============================================================
          2. PANEL CENTRAL: PUNTUACIÓN Y NIVEL (Chapa azul con remaches dorados)
          ============================================================ */}
      <div className="hud-panel hud-panel--blue hud-panel--center">
        {/* Remaches metálicos dorados sutiles */}
        <span className="hud-rivet hud-rivet--tl" aria-hidden="true" />
        <span className="hud-rivet hud-rivet--tc" aria-hidden="true" />
        <span className="hud-rivet hud-rivet--tr" aria-hidden="true" />
        <span className="hud-rivet hud-rivet--bl" aria-hidden="true" />
        <span className="hud-rivet hud-rivet--bc" aria-hidden="true" />
        <span className="hud-rivet hud-rivet--br" aria-hidden="true" />

        {/* Columna PUNTUACIÓN */}
        <div className="hud-center__score-col">
          <div className="hud-label hud-label--white">PUNTUACIÓN</div>
          <div className="hud-value hud-value--score" title={`Puntos: ${hud.score}`}>
            {scoreFormatted}
          </div>
        </div>

        {/* Columna NIVEL */}
        <div className="hud-center__level-col">
          <div className="hud-label hud-label--white">NIVEL</div>
          <div className="hud-level-pill" title={`Nivel ${hud.level}`}>
            {levelText}
          </div>
        </div>
      </div>

      {/* ============================================================
          3. PANEL DERECHO: TIEMPO (Madera con reloj analógico y contador)
          ============================================================ */}
      <div className="hud-panel hud-panel--wood hud-panel--time">
        <span className="hud-screw hud-screw--tl" aria-hidden="true" />
        <span className="hud-screw hud-screw--tr" aria-hidden="true" />
        <span className="hud-screw hud-screw--bl" aria-hidden="true" />
        <span className="hud-screw hud-screw--br" aria-hidden="true" />

        <div className="hud-label hud-label--white">TIEMPO</div>

        <div className="hud-time__content">
          <div className="hud-clock-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="hud-clock-svg">
              {/* Campanas */}
              <circle cx="5" cy="5" r="2.5" fill="#d97706" stroke="#451a03" strokeWidth="1" />
              <circle cx="19" cy="5" r="2.5" fill="#d97706" stroke="#451a03" strokeWidth="1" />
              {/* Patitas */}
              <rect x="4" y="20" width="3" height="3" rx="1" fill="#78350f" stroke="#451a03" strokeWidth="1" />
              <rect x="17" y="20" width="3" height="3" rx="1" fill="#78350f" stroke="#451a03" strokeWidth="1" />
              {/* Cuerpo del reloj */}
              <circle cx="12" cy="13" r="9" fill="#f59e0b" stroke="#451a03" strokeWidth="1.5" />
              <circle cx="12" cy="13" r="7.5" fill="#ffffff" stroke="#78350f" strokeWidth="1" />
              {/* Agujas */}
              <line x1="12" y1="13" x2="12" y2="8" stroke="#1c1917" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="12" y1="13" x2="15" y2="13" stroke="#1c1917" strokeWidth="1.6" strokeLinecap="round" />
              <circle cx="12" cy="13" r="1.2" fill="#dc2626" />
            </svg>
          </div>

          <div
            className={`hud-value hud-value--time ${hud.timeWarning ? 'is-warning' : ''}`}
            title={`Tiempo restante: ${timeFormatted}`}
          >
            {timeFormatted}
          </div>
        </div>

        {/* Botón de pausa discreto */}
        <button
          type="button"
          className="hud-pause-button"
          onClick={onPause}
          aria-label="Pausa"
          title="Pausar juego"
        >
          II
        </button>
      </div>

      {/* ---------- Aviso Canasta Llena ---------- */}
      {hud.basketFull && (
        <div className="hud-banner-alert hud-banner-alert--full">
          🧺 CANASTA LLENA — ENTREGA EN LA CESTA
        </div>
      )}
    </div>
  );
}
