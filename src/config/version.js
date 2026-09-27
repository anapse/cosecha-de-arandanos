// ==========================================================
// version.js — Única fuente de verdad para la versión del juego
// ==========================================================

// GAME_VERSION formato: VERSION.ITERACION
// EJEMPLO: 0.001 = versión 0 aprobada, iteración 1 de prueba
//          1.001 = versión 1 aprobada, iteración 1 de prueba
//          2.001 = versión 2 aprobada, iteración 1 de prueba

// El número entero (antes del punto) solo cambia cuando el usuario
// dice explícitamente "APROBADO". Se reinicia la iteración a 1.

// El número decimal (después del punto) incrementa con cada nuevo
// deploy de prueba. No se debe reutilizar un número.

export const GAME_VERSION = '0.001';

// Helper para incrementar la iteración (llamado desde el despliegue)
export function nextIteration() {
  const [major, minor] = GAME_VERSION.split('.').map(Number);
  // Incrementar iteración, reiniciar a 1 si era 9
  const newMinor = (parseInt(minor, 10) || 0) + 1;
  return `${major}.${newMinor > 9 ? '01' : newMinor.toString().padStart(3, '0')}`;
}

// Helper para aprobar versión (incrementa entero, reinicia iteración)
export function approveVersion() {
  const [major] = GAME_VERSION.split('.').map(Number);
  const newMajor = major + 1;
  return `${newMajor}.001`;
}