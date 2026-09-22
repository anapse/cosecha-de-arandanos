/**
 * GameOver.jsx — Pantalla de derrota (§26).
 *
 *   COSECHA RECHAZADA
 *   Motivo: Demasiados pintones.
 *   Calidad: 61%
 *   Errores: 8
 *   Botones: INTENTAR DE NUEVO · MENÚ
 *
 * Motivos posibles: tiempo agotado, sin vidas, objetivo no
 * alcanzado, calidad insuficiente.
 */

import { useState } from 'react';
import ShareResult from '../ShareResult/ShareResult.jsx';
import { formatTime } from '../../utils/math.js';
import './GameOver.css';

/** Texto legible para cada motivo de derrota (§26). */
const REASON_LABELS = {
  timeUp: 'Tiempo agotado.',
  noLives: 'Sin vidas.',
  qualityLow: 'Calidad insuficiente.',
  tooManyUnripe: 'Demasiados pintones.',
  victory: '',
};

export default function GameOver({ summary, onRestart, onExit }) {
  const [sharing, setSharing] = useState(false);

  const reasonText =
    summary.message || REASON_LABELS[summary.reason] || 'Objetivo no alcanzado.';

  return (
    <div className="result-screen result-screen--defeat" role="dialog" aria-modal="true">
      <div className="result-screen__panel">
        {/* ---------- Encabezado ---------- */}
        <header className="result-screen__header">
          <span className="result-screen__badge">❌</span>
          <h2 className="result-screen__title">COSECHA RECHAZADA</h2>
          <p className="result-screen__subtitle">Nivel {summary.levelId}</p>
        </header>

        {/* ---------- Motivo ---------- */}
        <div className="result-screen__reason">
          <span className="result-screen__reason-label">Motivo</span>
          <span className="result-screen__reason-value">{reasonText}</span>
        </div>

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
            <dd className={summary.quality >= summary.minimumQuality ? 'is-ok' : 'is-danger'}>
              {summary.quality}%{' '}
              <span className="result-row__hint">(mín. {summary.minimumQuality}%)</span>
            </dd>
          </div>

          <div className="result-row">
            <dt>Errores</dt>
            <dd className="is-danger">{summary.errors}</dd>
          </div>

          <div className="result-row">
            <dt>Pintones</dt>
            <dd className="is-danger">{summary.unripeCollected}</dd>
          </div>

          <div className="result-row">
            <dt>Vidas restantes</dt>
            <dd>{summary.lives}</dd>
          </div>

          <div className="result-row">
            <dt>Tiempo restante</dt>
            <dd>{formatTime(summary.timeLeft)}</dd>
          </div>

          <div className="result-row result-row--total">
            <dt>Puntos</dt>
            <dd>{summary.score}</dd>
          </div>
        </dl>

        {/* ---------- Consejo ---------- */}
        <p className="result-screen__tip">
          Consejo: recoge solo los arándanos azules. Los rosados o verdosos son pintones.
        </p>

        {/* ---------- Acciones ---------- */}
        <nav className="result-screen__actions">
          <button type="button" className="menu-btn menu-btn--primary" onClick={onRestart}>
            INTENTAR DE NUEVO
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
      </div>

      {sharing && <ShareResult summary={summary} onClose={() => setSharing(false)} />}
    </div>
  );
}
