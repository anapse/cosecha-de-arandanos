/**
 * Tutorial.jsx — Tutorial corto e interactivo (§36).
 *
 * 8 pasos, uno por pantalla, con avance táctil/clic.
 * Los textos son EXACTAMENTE los de la especificación.
 */

import { useEffect, useState } from 'react';
import './Tutorial.css';

/** Pasos del tutorial (§36). */
export const TUTORIAL_STEPS = [
  {
    id: 1,
    icon: '🚶',
    title: 'CAMINA POR LOS CAMINOS',
    text: 'Muévete con W A S D o las flechas. Las plantas bloquean el paso: usa los caminos de tierra.',
    tip: 'En móvil usa la cruceta.',
  },
  {
    id: 2,
    icon: '🔍',
    title: 'BUSCA LOS FRUTOS',
    text: 'Los arándanos crecen a los lados de las líneas de cultivo. Acércate para poder alcanzarlos.',
    tip: 'Aparece un aviso sobre el fruto.',
  },
  {
    id: 3,
    icon: '🫐',
    title: 'RECOGE LOS MADUROS',
    text: 'Los maduros son AZULES. Pulsa Q para recoger a la izquierda y E para recoger a la derecha.',
    tip: 'Cada maduro suma +10 puntos.',
  },
  {
    id: 4,
    icon: '⚠️',
    title: 'NO RECOJAS LOS PINTONES',
    text: 'Los pintones son ROSADOS o VERDOSOS. Si los recoges pierdes puntos y baja la calidad.',
    tip: 'Cada pintón resta 25 puntos.',
  },
  {
    id: 5,
    icon: '🧺',
    title: 'LLENA LA CANASTA',
    text: 'Los arándanos van a tu canasta. Cuando llegue al tope, baja a entregarla.',
    tip: 'La canasta del nivel 1 aguanta 30 frutos.',
  },
  {
    id: 6,
    icon: '⬇️',
    title: 'REGRESA ABAJO',
    text: 'Vuelve caminando hasta la parte inferior del campo. La zona de entrega está al final.',
    tip: 'Sigue el camino central.',
  },
  {
    id: 7,
    icon: '📦',
    title: 'ENTREGA',
    text: 'Pulsa ESPACIO en la zona de entrega. Los frutos pasan a tu total y sumas 100 puntos.',
    tip: 'En móvil usa el botón ENTREGAR.',
  },
  {
    id: 8,
    icon: '👨\u200d💼',
    title: 'CUIDADO CON EL SUPERVISOR',
    text: 'Cada cierto tiempo llega el supervisor a revisar. Si la calidad es baja, rechaza tu cosecha.',
    tip: 'Mantén la calidad por encima del mínimo del nivel.',
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

  /* Navegación por teclado: flechas y espacio (§25). */
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

        {/* ---------- Contenido (altura estable) ---------- */}
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
