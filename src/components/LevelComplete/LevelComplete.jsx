/**
 * LevelComplete.jsx — Pantalla de victoria (§25).
 *
 *   NIVEL COMPLETADO
 *   Cosecha: 100 / 100
 *   Calidad: 94%
 *   Errores: 2
 *   Puntos: 1840
 *   Tiempo: 01:42
 *   [ SIGUIENTE NIVEL ]
 */

import { useState } from 'react';
import ShareResult from '../ShareResult/ShareResult.jsx';
import { formatTime } from '../../utils/math.js';
import { TOTAL_LEVELS } from '../../data/levels.js';
import './LevelComplete.css';

export default function LevelComplete({ summary, onNextLevel, onRestart, onExit }) {
  const [sharing, setSharing] = useState(false);
  const isFinalLevel = summary.levelId >= TOTAL_LEVELS;

  return (
    <div className="result-screen result-screen--victory" role="dialog" aria-modal="true">
      <div className="result-screen__panel">
        {/* ---------- Encabezado ---------- */}
        <header className="result-screen__header">
          <span className="result-screen__badge">✅</span>
          <h2 className="result-screen__title">NIVEL COMPLETADO</h2>
          <p className="result-screen__subtitle">
            {summary.levelName} · Nivel {summary.levelId}/{TOTAL_LEVELS}
          </p>
        </header>

        {/* ---------- Estadísticas ---------- */}
        <dl className="result-screen__stats">
          <div className="result-row">
            <dt>Cosecha</dt>
            <dd>
              {summary.harvested} / {summary.target}
            </dd>
          </div>

          <div className="result-row">
            <dt>Calidad</dt>
            <dd className={summary.quality >= summary.minimumQuality ? 'is-ok' : 'is-warn'}>
              {summary.quality}%
            </dd>
          </div>

          <div className="result-row">
            <dt>Entregas</dt>
            <dd>{summary.deliveries}</dd>
          </div>

          <div className="result-row">
            <dt>Errores</dt>
            <dd className={summary.errors > 0 ? 'is-danger' : ''}>{summary.errors}</dd>
          </div>

          <div className="result-row">
            <dt>Pintones</dt>
            <dd className={summary.unripeCollected > 0 ? 'is-danger' : ''}>
              {summary.unripeCollected}
            </dd>
          </div>

          <div className="result-row">
            <dt>Tiempo usado</dt>
            <dd>{formatTime(summary.timeUsed)}</dd>
          </div>

          <div className="result-row result-row--total">
            <dt>Puntos del nivel</dt>
            <dd>{summary.levelScore}</dd>
          </div>

          <div className="result-row result-row--total">
            <dt>Puntos totales</dt>
            <dd>{summary.score}</dd>
          </div>
        </dl>

        {/* ---------- Cosecha perfecta ---------- */}
        {summary.perfectHarvest && (
          <div className="result-screen__perfect">⭐ COSECHA PERFECTA +250</div>
        )}

        {/* ---------- Acciones ---------- */}
        <nav className="result-screen__actions">
          {!isFinalLevel && (
            <button type="button" className="menu-btn menu-btn--primary" onClick={onNextLevel}>
              SIGUIENTE NIVEL
            </button>
          )}

          <button type="button" className="menu-btn" onClick={onRestart}>
            REPETIR NIVEL
          </button>

          <button
            type="button"
            className="menu-btn menu-btn--ghost"
            onClick={() => setSharing(true)}
          >
            COMPARTIR
          </button>

          <button type="button" className="menu-btn menu-btn--ghost" onClick={onExit}>
            MENÚ
          </button>
        </nav>

        {isFinalLevel && (
          <p className="result-screen__final">
            ¡Completaste los 12 niveles! Eres el mejor cosechador del fundo.
          </p>
        )}
      </div>

      {/* ---------- Compartir (§48) ---------- */}
      {sharing && (
        <ShareResult summary={summary} onClose={() => setSharing(false)} />
      )}
    </div>
  );
}
