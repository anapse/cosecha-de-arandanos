/**
 * ShareResult.jsx — Compartir el resultado (§48).
 *
 *   MI RÉCORD
 *   Nivel 8 · Puntos: 1842 · Calidad: 94% · Pintones: 0
 *   [ COMPARTIR ]
 *
 * En el MVP se copia el texto al portapapeles, sin servidor (§48).
 * Si el navegador no deja usar el portapapeles, se muestra el texto
 * en un campo para copiarlo a mano.
 */

import { useState } from 'react';
import './ShareResult.css';

export default function ShareResult({ summary, onClose }) {
  const [copied, setCopied] = useState(false);
  const [fallbackText, setFallbackText] = useState(null);

  /** Texto compartible, en el formato de la especificación (§48). */
  const shareText = buildShareText(summary);

  const handleShare = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2200);
        return;
      }
      throw new Error('Clipboard no disponible');
    } catch {
      // Respaldo: se muestra el texto para copiar manualmente.
      setFallbackText(shareText);
    }
  };

  return (
    <div className="share-result" role="dialog" aria-modal="true" aria-label="Compartir resultado">
      <div className="share-result__panel">
        <h3 className="share-result__title">MI RÉCORD</h3>

        {/* ---------- Ficha del resultado ---------- */}
        <div className="share-result__card">
          <span className="share-result__line">
            Nivel <strong>{summary.levelId}</strong>
          </span>
          <span className="share-result__line">
            Puntos: <strong>{summary.score}</strong>
          </span>
          <span className="share-result__line">
            Calidad: <strong>{summary.quality}%</strong>
          </span>
          <span className="share-result__line">
            Pintones: <strong>{summary.unripeCollected}</strong>
          </span>
        </div>

        {/* ---------- Texto a compartir ---------- */}
        <p className="share-result__preview">“{shareText}”</p>

        {fallbackText && (
          <textarea
            className="share-result__fallback"
            readOnly
            value={fallbackText}
            rows={3}
            onFocus={(event) => event.target.select()}
            aria-label="Texto para copiar"
          />
        )}

        {/* ---------- Acciones ---------- */}
        <div className="share-result__actions">
          <button type="button" className="menu-btn menu-btn--primary" onClick={handleShare}>
            {copied ? 'COPIADO ✓' : 'COMPARTIR'}
          </button>

          <button type="button" className="menu-btn menu-btn--ghost" onClick={onClose}>
            CERRAR
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Construye el mensaje de compartir.
 * Ejemplo de la especificación:
 *   "Conseguí 1842 puntos en Cosecha de Arándanos. ¿Puedes superarme?"
 */
export function buildShareText(summary) {
  const base = `Consegui ${summary.score} puntos en Cosecha de Arandanos. ¿Puedes superarme?`;
  const detail = `Nivel ${summary.levelId} | Calidad ${summary.quality}% | Pintones ${summary.unripeCollected}`;
  return `${base} (${detail})`;
}

export { buildShareText as default_shareText };
