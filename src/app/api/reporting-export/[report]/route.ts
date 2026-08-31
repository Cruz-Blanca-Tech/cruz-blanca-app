import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { serverEnv } from '@/lib/env.server';

export const dynamic = 'force-dynamic';

/**
 * Descarga AUTENTICADA de los reportes CSV de la Reporting & Analytics API.
 *
 * A diferencia de los dashboards (JSON), estos endpoints del backend devuelven un
 * `StreamingResponse` con `media_type="text/csv"` y `Content-Disposition:
 * attachment` (descargas de archivo). Por eso NO se consumen por el `/api/proxy`
 * genérico: ese handler hace `NextResponse.json(...)`, que reserializaría los
 * bytes y corrompería el CSV. Aquí, igual que en `case-doc-image`, leemos la
 * cookie `access_token`, llamamos al backend con Bearer y REENVIAMOS los bytes
 * crudos (`arrayBuffer`) tal cual, conservando el `Content-Disposition`.
 *
 * Allowlist anti-SSRF: solo se aceptan los 3 `report` conocidos; cualquier otro
 * valor del segmento dinámico se rechaza con 400 y nunca se compone una ruta
 * arbitraria del backend a partir de la entrada del cliente.
 *
 * Backend: GET {base}/api/v1/reporting/<contexto>/exports/<reporte>
 */

/**
 * Mapa de reportes permitidos → (ruta del backend, nombre del archivo de
 * descarga). Es la ÚNICA fuente de rutas: el `report` del path se usa solo como
 * clave de búsqueda, nunca se concatena a la URL directamente.
 */
const REPORTS: Record<string, { backendPath: string; filename: string }> = {
  'beneficiaries-master': {
    backendPath: '/api/v1/reporting/demographics/exports/beneficiaries-master',
    filename: 'reporte_maestro_beneficiarios.csv',
  },
  'rejected-cases': {
    backendPath: '/api/v1/reporting/operations/exports/rejected-cases',
    filename: 'operaciones_casos_rechazados.csv',
  },
  'ocr-audit': {
    backendPath: '/api/v1/reporting/operations/exports/ocr-audit',
    filename: 'operaciones_auditoria_ocr.csv',
  },
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ report: string }> }
) {
  const { report } = await params;

  // Allowlist: si la clave no está en el mapa, se rechaza sin tocar el backend.
  const descriptor = REPORTS[report];
  if (!descriptor) {
    return NextResponse.json({ error: 'Reporte no válido.' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  if (!accessToken) {
    return NextResponse.json(
      { error: 'No autorizado. Por favor, inicia sesión.' },
      { status: 401 }
    );
  }

  const baseUrl = serverEnv.backendBaseUrl;
  if (!baseUrl) {
    return NextResponse.json(
      { error: 'Error de configuración. Por favor, contacta al administrador.' },
      { status: 500 }
    );
  }

  const backendUrl = `${baseUrl.replace(/\/$/, '')}${descriptor.backendPath}`;

  try {
    const upstream = await fetch(backendUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'text/csv',
      },
      // FastAPI resuelve el slash final con 307; seguimos la redirección.
      redirect: 'follow',
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: 'No se pudo generar el reporte.' },
        { status: upstream.status }
      );
    }

    // Reenviamos los bytes CRUDOS (sin `.json()`) para no corromper el CSV.
    return new NextResponse(await upstream.arrayBuffer(), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${descriptor.filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Error al descargar el reporte.' },
      { status: 502 }
    );
  }
}
