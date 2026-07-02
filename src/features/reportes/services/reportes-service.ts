/**
 * Servicio de descarga de reportes CSV (feature `reportes`). A diferencia del
 * resto de features, NO usa `apiClient`/`/api/proxy` (que devuelven JSON): los
 * reportes son archivos binarios y se piden al route handler dedicado
 * `/api/reporting-export/[report]`, que reenvía los bytes crudos con su
 * `Content-Disposition`. Aquí convertimos la respuesta en un `Blob` y disparamos
 * la descarga en el navegador con un `<a download>` temporal.
 */

/**
 * Descarga el reporte `reportId` y lo guarda como `filename`.
 *
 * Lanza `Error` con un mensaje legible en español si la respuesta no es OK
 * (intentando leer `{ error }` del cuerpo JSON que devuelve el route handler en
 * los casos de fallo). En éxito, materializa el `Blob`, crea un object URL,
 * simula el clic de un `<a>` temporal y libera el URL al terminar.
 */
export async function downloadReport(
  reportId: string,
  filename: string
): Promise<void> {
  const res = await fetch(`/api/reporting-export/${reportId}`);

  if (!res.ok) {
    // El route handler responde `{ error }` en JSON cuando falla; si no se puede
    // leer, caemos a un mensaje genérico.
    let message = 'No se pudo descargar el reporte. Inténtalo de nuevo.';
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // Cuerpo no-JSON o vacío: nos quedamos con el mensaje genérico.
    }
    throw new Error(message);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}
