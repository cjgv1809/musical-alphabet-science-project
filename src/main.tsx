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
