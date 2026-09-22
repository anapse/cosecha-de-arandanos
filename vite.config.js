import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuración de Vite para COSECHA DE ARÁNDANOS.
// - React para la aplicación exterior (menús, HUD de páginas, resultados).
// - El motor del juego vive aislado en src/game y NO depende de React.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Los assets pixel art deben copiarse tal cual, sin optimizaciones que
    // los reescalen o suavicen.
    assetsInlineLimit: 0,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.{test,spec}.{js,jsx}'],
  },
});
