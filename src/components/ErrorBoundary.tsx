import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { motorEscucha } from '../audio/escucha.ts';

interface Props {
  children: ReactNode;
}

interface Estado {
  fallo: boolean;
}

/**
 * Red de seguridad: si un componente lanza un error al pintar, en vez de
 * una pantalla en blanco se muestra un mensaje claro con un botón para
 * recargar. También suelta el micrófono para que no quede encendido.
 */
export default class ErrorBoundary extends Component<Props, Estado> {
  override state: Estado = { fallo: false };

  static getDerivedStateFromError(): Estado {
    return { fallo: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    motorEscucha.detener();
    console.error('Error en la interfaz:', error, info.componentStack);
  }

  override render(): ReactNode {
    if (!this.state.fallo) return this.props.children;
    return (
      <div
        role="alert"
        style={{ maxWidth: '32rem', margin: '3rem auto', padding: '1rem' }}
      >
        <h1>Algo salió mal</h1>
        <p>
          La aplicación tuvo un problema inesperado. Tus ajustes y frases guardadas siguen
          a salvo. Recarga para volver a empezar.
        </p>
        <button
          type="button"
          style={{ minHeight: 44, padding: '0.5rem 1.2rem', fontSize: '1rem' }}
          onClick={() => window.location.reload()}
        >
          Recargar la aplicación
        </button>
      </div>
    );
  }
}
