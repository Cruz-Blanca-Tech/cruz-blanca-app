import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy de imágenes públicas de Google Drive.
 *
 * El hotlink directo del navegador a `drive.google.com/thumbnail` /
 * `lh3.googleusercontent.com` es throttleado por Google (429 Too Many Requests),
 * sobre todo al cargar varias imágenes a la vez. Aquí las bajamos del lado del
 * servidor (un solo origen, sin referrer del browser) y las devolvemos cacheadas,
 * de modo que el navegador siempre pide a nuestro propio dominio.
 *
 * Solo sirve archivos públicos ("cualquier persona con el enlace"); no usa OAuth.
 */

// Acepta únicamente ids de Drive válidos para evitar SSRF a URLs arbitrarias.
const DRIVE_ID = /^[\w-]+$/;

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  const size = request.nextUrl.searchParams.get('sz') ?? 'w1000';

  if (!id || !DRIVE_ID.test(id) || !DRIVE_ID.test(size)) {
    return NextResponse.json({ error: 'Parámetro id inválido.' }, { status: 400 });
  }

  const source = `https://drive.google.com/thumbnail?id=${id}&sz=${size}`;

  try {
    const upstream = await fetch(source, {
      // Sin cookies/credenciales; seguimos el 302 hacia lh3 automáticamente.
      redirect: 'follow',
      headers: { Accept: 'image/*' },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: 'No se pudo obtener la imagen.' },
        { status: upstream.status === 429 ? 503 : upstream.status }
      );
    }

    // Cuando Drive throttlea responde 200 con una página HTML de error, no la
    // imagen. Si no es image/*, devolvemos error y NO cacheamos esa respuesta.
    const contentType = upstream.headers.get('content-type') ?? '';
    if (!contentType.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Drive no devolvió una imagen (posible rate-limit).' },
        { status: 503 }
      );
    }

    const body = await upstream.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // Cacheamos agresivamente: el preview de un tipo de documento es estable.
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Error al obtener la imagen de Drive.' },
      { status: 502 }
    );
  }
}
