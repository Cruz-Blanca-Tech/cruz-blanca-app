import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { serverEnv } from '@/lib/env.server';

/**
 * Proxy AUTENTICADO de imágenes de documentos en la bóveda de Custodia.
 *
 * A diferencia de `/api/drive-image` (que solo sirve archivos PÚBLICOS de Drive),
 * estas imágenes son privadas: viven en un Shared Drive al que únicamente accede
 * el "robot" (cuenta de servicio de Google) del backend. Por eso NO se expone el
 * enlace de Drive al navegador; el backend resuelve el `custody_id` y devuelve los
 * bytes.
 *
 * No se puede usar el `/api/proxy` genérico porque este hace
 * `NextResponse.json(...)` y corrompería el binario; y un `<img>` no puede enviar
 * el header `Authorization`. Aquí leemos la cookie `access_token` (igual que el
 * proxy), llamamos al endpoint del backend con Bearer y reenviamos los bytes.
 *
 * Backend: GET {base}/api/v1/intake/api/v1/batches/{batchId}/dossiers/{dni}/documents/{docId}/image
 */

// UUID (batchId / docId). El `dni` puede ser un identificador estable alfanumérico.
const UUID = /^[0-9a-fA-F-]{16,40}$/;
const DNI_REF = /^[\w-]{1,40}$/;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const batchId = params.get('batchId');
  const dni = params.get('dni');
  const docId = params.get('docId');

  if (
    !batchId || !UUID.test(batchId) ||
    !docId || !UUID.test(docId) ||
    !dni || !DNI_REF.test(dni)
  ) {
    return NextResponse.json({ error: 'Parámetros inválidos.' }, { status: 400 });
  }

  const baseUrl = serverEnv.backendBaseUrl;
  if (!baseUrl) {
    return NextResponse.json(
      { error: 'Error de configuración. Por favor, contacta al administrador.' },
      { status: 500 }
    );
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  if (!accessToken) {
    return NextResponse.json(
      { error: 'No autorizado. Por favor, inicia sesión.' },
      { status: 401 }
    );
  }

  const backendUrl =
    `${baseUrl.replace(/\/$/, '')}/api/v1/intake/api/v1/batches/` +
    `${batchId}/dossiers/${encodeURIComponent(dni)}/documents/${docId}/image`;

  try {
    const upstream = await fetch(backendUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'image/*,application/pdf',
      },
      // FastAPI resuelve el slash con 307; seguimos la redirección.
      redirect: 'follow',
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: 'No se pudo obtener la imagen del documento.' },
        { status: upstream.status }
      );
    }

    const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream';
    const body = await upstream.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // Privado: contenido sensible por usuario; cacheable solo en el navegador.
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Error al obtener la imagen del documento.' },
      { status: 502 }
    );
  }
}
