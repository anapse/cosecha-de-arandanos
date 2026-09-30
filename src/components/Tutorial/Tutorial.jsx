/**
 * Tutorial.jsx — Tutorial interactivo actualizado con el diseño y mecánicas actuales.
 */

import { useEffect, useState } from 'react';
import './Tutorial.css';

/** Pasos del tutorial interactivo. */
export const TUTORIAL_STEPS = [
  {
    id: 1,
    icon: '🚶',
    title: 'CAMINA POR LAS CAMINERÍAS',
    text: 'Muévete con W A S D o las flechas del teclado en PC. En móvil usa los botones direccionales de los bordes o desliza tu dedo. Camina libremente por los caminos de tierra entre las hileras.',
    tip: 'Usa los pasillos superior e inferior para cruzar entre caminerías.',
  },
  {
    id: 2,
    icon: '🫐',
    title: 'COSECHA SOLO MADUROS (+10)',
    text: 'Los arándanos maduros son de color AZUL OSCURO. Pulsa E o Q en PC, haz clic sobre el fruto, o pulsa el botón COSECHAR en móvil para recolectar el más cercano.',
    tip: 'Cada arándano maduro suma +10 puntos a tu marcador.',
  },
  {
    id: 3,
    icon: '⚠️',
    title: 'EVITA LOS FRUTOS PINTONES',
    text: 'Los frutos VERDES o ROSADOS aún no maduran. Si cosechas un pintón perderás 25 puntos y acumularás faltas de calidad en tu canasta.',
    tip: '¡Cuidado! Cosechar pintones arriesga tus vidas ante el supervisor.',
  },
  {
    id: 4,
    icon: '🧺',
    title: 'LLENA TU CANASTA',
    text: 'Los frutos van a tu canasta personal. Revisa el contador en el HUD superior para saber cuántos frutos llevas acumulados.',
    tip: 'Cuando la canasta esté llena, el juego te avisará para que bajes a vaciarla.',
  },
  {
    id: 5,
    icon: '📦',
    title: 'ENTREGA EN LA ZONA INFERIOR',
    text: 'Baja a la zona de acopio y pulsa ESPACIO en PC o el botón ENTREGAR en móvil. Los frutos se guardarán en las cajas de embalaje y el camión.',
    tip: 'Cada entrega te otorga +100 puntos adicionales.',
  },
  {
    id: 6,
    icon: '👨‍💼',
    title: 'INSPECCIÓN DEL SUPERVISOR',
    text: 'La barra superior muestra la cuenta regresiva para la llegada del supervisor. Él revisará la calidad de los frutos acopiados.',
    tip: 'Cosecha perfecta = +50 pts de bono. Frutos verdes = -1/2 corazón (vida).',
  },
  {
    id: 7,
    icon: '❤️',
    title: 'VIDAS Y OBJETIVOS',
    text: 'Empiezas con 3 corazones (vidas). Pierdes medio corazón por cada sanción del supervisor. Si pierdes las vidas o se agota el tiempo, el nivel termina.',
    tip: 'Cosecha los arándanos maduros requeridos para superar los 12 niveles.',
  },
];

export default function Tutorial({ onFinish, onBackToMenu }) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = TUTORIAL_STEPS[stepIndex];
  const isLast = stepIndex === TUTORIAL_STEPS.length - 1;

  const goNext = () => {
    if (isLast) onFinish?.();
    else setStepIndex((index) => index + 1);
  };

  const goPrev = () => {
    setStepIndex((index) => Math.max(0, index - 1));
  };

  /* Navegación por teclado: flechas y espacio */
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.code === 'ArrowRight' || event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault();
        goNext();
      } else if (event.code === 'ArrowLeft') {
        event.preventDefault();
        goPrev();
      } else if (event.code === 'Escape') {
        event.preventDefault();
        onBackToMenu?.();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  return (
    <div className="tutorial">
      <div className="tutorial__inner">
        {/* ---------- Cabecera ---------- */}
        <header className="tutorial__header">
          <span className="tutorial__counter">
            PASO {step.id} / {TUTORIAL_STEPS.length}
          </span>
          <button
            type="button"
            className="tutorial__close"
            onClick={onBackToMenu}
            aria-label="Salir del tutorial"
          >
            ✕
          </button>
        </header>

        {/* ---------- Progreso ---------- */}
        <div className="tutorial__progress" aria-hidden="true">
          {TUTORIAL_STEPS.map((item, index) => (
            <span
              key={item.id}
              className={`tutorial__dot ${
                index === stepIndex ? 'is-active' : index < stepIndex ? 'is-done' : ''
              }`}
            />
          ))}
        </div>

        {/* ---------- Contenido ---------- */}
        <div className="tutorial__card">
          <div className="tutorial__icon" aria-hidden="true">
            {step.icon}
          </div>
          <h2 className="tutorial__title">{step.title}</h2>
          <p className="tutorial__text">{step.text}</p>
          <p className="tutorial__tip">{step.tip}</p>
        </div>

        {/* ---------- Navegación ---------- */}
        <nav className="tutorial__nav">
          <button
            type="button"
            className="menu-btn menu-btn--ghost"
            onClick={goPrev}
            disabled={stepIndex === 0}
          >
            ATRÁS
          </button>

          <button type="button" className="menu-btn menu-btn--primary" onClick={goNext}>
            {isLast ? '¡A COSECHAR!' : 'SIGUIENTE'}
          </button>
        </nav>
      </div>
    </div>
  );
}
