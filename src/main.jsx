/**
 * main.jsx — Punto de entrada de la aplicación.
 *
 * Orden de carga de estilos:
 *   1. variables  (tokens)
 *   2. global     (reset y base)
 *   3. responsive (tamaño del visor vertical)
 *   4. result-screen (estilos compartidos de resultados)
 *
 * Los estilos de cada componente se importan desde su propio .jsx.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './app/App.jsx';

import './styles/variables.css';
import './styles/global.css';
import './styles/responsive.css';
import './styles/result-screen.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('No se encontró el elemento #root en index.html');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
