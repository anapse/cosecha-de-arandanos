import React from 'react';

/**
 * BlueberryIcon.jsx
 * Icono vectorial SVG de alta definición del arándano.
 * Sustituye al emoji nativo 🫐 para garantizar que se vea idéntico
 * en todas las plataformas (Windows, Linux, macOS, Android, iOS)
 * sin depender de fuentes del sistema que en PC muestran un cuadrado vacío.
 */
export default function BlueberryIcon({ size = 48, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
      aria-hidden="true"
    >
      <defs>
        {/* Degradado para la baya principal */}
        <radialGradient
          id="bbGrad"
          cx="35%"
          cy="32%"
          r="65%"
          fx="30%"
          fy="25%"
        >
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="25%" stopColor="#3b82f6" />
          <stop offset="70%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#0f172a" />
        </radialGradient>

        {/* Degradado para la hoja */}
        <linearGradient id="leafGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="50%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>

        {/* Sombra suave */}
        <filter id="bbShadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#091428" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Hoja verde decorativa superior */}
      <path
        d="M32 18 C30 8, 44 4, 52 8 C54 18, 42 22, 32 18 Z"
        fill="url(#leafGrad)"
        stroke="#14532d"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M34 17 Q42 12 50 9"
        stroke="#166534"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Sombra base del fruto */}
      <ellipse cx="32" cy="58" rx="20" ry="4" fill="rgba(0, 0, 0, 0.3)" />

      {/* Baya de arándano esférica */}
      <circle
        cx="32"
        cy="36"
        r="23"
        fill="url(#bbGrad)"
        stroke="#0b132b"
        strokeWidth="2.4"
      />

      {/* Cáliz / Corona superior oscura del arándano (5 puntas características) */}
      <path
        d="M26 21 L32 24 L38 21 L36 27 L41 31 L35 32 L32 37 L29 32 L23 31 L28 27 Z"
        fill="#080e1e"
        stroke="#172554"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="28" r="3.5" fill="#030712" />

      {/* Brillo especular blanco en luna creciente */}
      <ellipse cx="23" cy="26" rx="5.5" ry="3.5" transform="rotate(-30 23 26)" fill="rgba(255, 255, 255, 0.85)" />
      <circle cx="19" cy="33" r="2.2" fill="rgba(255, 255, 255, 0.6)" />

      {/* Reflejo azul claro inferior */}
      <path
        d="M20 48 Q32 55 44 48"
        stroke="rgba(147, 197, 253, 0.45)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
