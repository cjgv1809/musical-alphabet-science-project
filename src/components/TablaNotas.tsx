import { memo } from 'react';
import {
  SIMBOLOS_CROMATICOS,
  SIMBOLOS_PUNTUACION,
  obtenerFrecuenciaNota,
  obtenerNombreNota,
} from '../audio/cromatico.ts';

/** Tabla estática de notas: memoizada, no depende de ningún estado. */
const TablaNotas = memo(function TablaNotas(): React.JSX.Element {
  return (
    <table>
      <thead>
        <tr>
          <th scope="col">Letra</th>
          <th scope="col">Nota</th>
          <th scope="col">Hz</th>
        </tr>
      </thead>
      <tbody>
        {[...SIMBOLOS_CROMATICOS, ...SIMBOLOS_PUNTUACION].map((s) => (
          <tr key={s}>
            <td>{s}</td>
            <td>{obtenerNombreNota(s)}</td>
            <td>{obtenerFrecuenciaNota(s)}</td>
          </tr>
        ))}
        <tr>
          <td>␣ ESPACIO</td>
          <td>{obtenerNombreNota(' ')}</td>
          <td>{obtenerFrecuenciaNota(' ')}</td>
        </tr>
      </tbody>
    </table>
  );
});

export default TablaNotas;
