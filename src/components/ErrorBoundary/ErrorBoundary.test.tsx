import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary.tsx';

function Roto(): React.JSX.Element {
  throw new Error('fallo de prueba');
}

describe('ErrorBoundary', () => {
  afterEach(() => vi.restoreAllMocks());

  it('muestra un mensaje claro en vez de una pantalla en blanco', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <ErrorBoundary>
        <Roto />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/algo salió mal/i);
    expect(screen.getByRole('button', { name: /recargar/i })).toBeInTheDocument();
  });

  it('no interfiere cuando todo va bien', () => {
    render(
      <ErrorBoundary>
        <p>todo bien</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('todo bien')).toBeInTheDocument();
  });
});
