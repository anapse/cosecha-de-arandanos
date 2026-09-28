import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Configuración de Vite para COSECHA DE ARÁNDANOS.
 *
 * - React para la aplicación exterior (menús, resultados, controles).
 * - El motor del juego vive aislado en src/game y NO depende de React.
 *
 * IMPORTANTE — acceso desde la red local:
 * El juego es 100% INDIVIDUAL. Vite NO es un servidor de partidas:
 * solamente sirve los archivos (HTML, JS, CSS, sprites, sonidos) a los
 * dispositivos de la misma red. Cada dispositivo que abre la dirección
 * juega SU PROPIA partida, sin compartir nada con los demás.
 *
 * Con `host: true` Vite escucha en todas las interfaces de red y muestra
 * la dirección "Network" al arrancar. Esa es la que se abre desde otra PC
 * o desde un teléfono conectado a la misma Wi-Fi:
 *
 *     Local:   http://localhost:5173/
 *     Network: http://192.168.X.X:5173/   <- esta se usa desde el móvil
 *
 * La IP no se fija en el código: la detecta Vite en cada arranque, así
 * que si el router cambia la IP de la PC, la dirección sigue siendo
 * correcta sin tocar nada.
 */
export default defineConfig({
  plugins: [react()],

  base: './',

  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },

  preview: {
    host: '0.0.0.0',
    port: 3000,
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
    assetsInlineLimit: 0,
  },

  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.{test,spec}.{js,jsx}'],
  },
});
