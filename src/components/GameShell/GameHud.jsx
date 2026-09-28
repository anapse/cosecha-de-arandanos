/**
 * GameHud.jsx
 * ---------------------------------------------------------------
 * HUD como capa React sobre el canvas (§34).
 *
 * ¿Por qué en React y no dibujado en el canvas?
 * Porque así los textos son seleccionables, accesibles y fáciles de
 * rediseñar sin tocar el motor. El canvas mantiene su propio HUD
 * compacto interno para las partidas sin React.
 *
 * Solo se actualiza cuando el motor emite una instantánea nueva, NO
 * cada frame (§41).
 */

import { useState } from 'react';
import { formatTime } from '../../utils/math.js';
import './GameHud.css';

export default function GameHud({ hud, onPause }) {
  const [expanded, setExpanded] = useState(false);

  if (!hud) return null;

  const qualityColor =
    hud.quality >= 90 ? 'ok' : hud.quality >= 75 ? 'warn' : 'danger';

  return (
    <div className="game-hud" role="region" aria-label="Panel de información">
      {/* ---------- Fila 1: nivel, tiempo, pausa ---------- */}
      <div className="game-hud__row game-hud__row--top">
        <span className="game-hud__level">
          NIVEL {hud.level}/{hud.totalLevels}
        </span>

        <span
          className={`game-hud__time ${hud.timeWarning ? 'is-warning' : ''}`}
        >
          {formatTime(hud.timeLeft)}
        </span>

        <button
          type="button"
          className="game-hud__pause"
          onClick={onPause}
          aria-label="Pausa"
        >
          II
        </button>
      </div>

      {/* ---------- Fila 2: métricas ---------- */}
      <div className="game-hud__row game-hud__row--stats">
        <span className="game-hud__stat">
          <span className="game-hud__stat-icon">🫐</span>
          <span className="game-hud__stat-value">
            {hud.harvested}/{hud.target}
          </span>
        </span>

        <span className={`game-hud__stat ${hud.errors > 0 ? 'is-danger' : ''}`}>
          <span className="game-hud__stat-icon">❌</span>
          <span className="game-hud__stat-value">{hud.errors}</span>
        </span>

        <span className="game-hud__stat">
          <span className="game-hud__stat-icon">🧺</span>
          <span className="game-hud__stat-value">
            {hud.basketCurrent}/{hud.basketCapacity}
          </span>
        </span>

        <span className="game-hud__lives" aria-label={`Vidas: ${hud.lives}`}>
          {Array.from({ length: hud.maxLives }, (_, index) => (
            <span
              key={index}
              className={`game-hud__life ${index < hud.lives ? 'is-full' : 'is-empty'}`}
            >
              ❤
            </span>
          ))}
        </span>
      </div>

      {/* ---------- Fila 3: calidad ---------- */}
      <div className="game-hud__row game-hud__row--quality">
        <span className="game-hud__quality-label">CALIDAD</span>
        <span className="game-hud__quality-track">
          <span
            className={`game-hud__quality-fill is-${qualityColor}`}
            style={{ width: `${Math.max(0, Math.min(100, hud.quality))}%` }}
          />
        </span>
        <span className={`game-hud__quality-value is-${qualityColor}`}>
          {hud.quality}%
        </span>
      </div>

      {/* ---------- Aviso de canasta llena ---------- */}
      {hud.basketFull && (
        <div className="game-hud__alert game-hud__alert--basket">
          CANASTA LLENA - REGRESA A ENTREGAR
        </div>
      )}

      {/* ---------- Temporizador del supervisor (§19) ---------- */}
      {!hud.supervisorActive && (
        <div className="game-hud__supervisor">
          <span className="game-hud__supervisor-label">REVISIÓN</span>
          <span className="game-hud__supervisor-bar">
            <span
              className="game-hud__supervisor-fill"
              style={{
                width: `${
                  Math.max(
                    0,
                    Math.min(
                      100,
                      (1 - hud.supervisorTimer / Math.max(1, hud.supervisorInterval)) * 100
                    )
                  )
                }%`,
              }}
            />
          </span>
          <span className="game-hud__supervisor-time">
            {formatTime(hud.supervisorTimer)}
          </span>
        </div>
      )}

      {/* ---------- Detalle desplegable (móvil: no estorba) ---------- */}
      <button
        type="button"
        className="game-hud__toggle"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        aria-label={expanded ? 'Ocultar detalle' : 'Mostrar detalle'}
      >
        {expanded ? '▲' : '▼'}
      </button>

      {expanded && (
        <div className="game-hud__detail">
          <div className="game-hud__detail-line">
            <span>Puntos</span>
            <strong>{hud.score}</strong>
          </div>
          <div className="game-hud__detail-line">
            <span>Entregas</span>
            <strong>
              {hud.deliveries}
              {hud.minimumQuality ? ` · mín. ${hud.minimumQuality}%` : ''}
            </strong>
          </div>
          <div className="game-hud__detail-line">
                      <span>Pintones</span>
                      <strong>{hud.unripeCollected}</strong>
                    </div>
        </div>
      )}
    </div>
  );
}
