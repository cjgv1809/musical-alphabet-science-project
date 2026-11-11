import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';

const raiz = document.getElementById('root');

if (raiz === null) {
  throw new Error('No se encontró el elemento #root en index.html');
}

ReactDOM.createRoot(raiz).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);

// Service worker (solo en producción): permite instalar la app y usarla
// sin conexión. En desarrollo estorbaría con la recarga en caliente.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch(() => undefined);
  });
}
