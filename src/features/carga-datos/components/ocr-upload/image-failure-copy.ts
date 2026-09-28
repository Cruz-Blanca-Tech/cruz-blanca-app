import type { ImageFailure } from '@/shared/drive/use-drive-image';

/**
 * Qué se le dice a la persona según por qué no se ve.
 *
 * Lo importante es que ninguna de estas dice "el archivo no se puede ver": con
 * esa frase el operador deduce que el escaneo está malo, cuando casi siempre lo
 * que pasó fue que se venció la sesión de Google o que Google se congestionó. Y
 * de esa conclusión falsa sale la peor acción posible: borrar el archivo.
 *
 * Vive aparte de `document-preview` porque lo usan dos pantallas —la vista
 * previa en su caja y la lupa que la abre— y si cada una tuviera la suya,
 * el mismo 401 terminaría dicho de dos formas en el mismo operatorio.
 */
export function failureCopy(
  failure: ImageFailure | undefined,
  fallback: string
) {
  switch (failure) {
    case 'session':
      return 'No pudimos acceder a Google Drive. Volvé a agregar archivos desde Drive para renovar el acceso.';
    case 'transient':
      return 'Google Drive no respondió. Puede ser un momento de carga.';
    case 'unrenderable':
      return fallback;
    default:
      return fallback;
  }
}
