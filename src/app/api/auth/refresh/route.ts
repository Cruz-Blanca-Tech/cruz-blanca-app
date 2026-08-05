import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { cookies } from 'next/headers';
import { serverEnv } from '@/lib/env.server';

export async function POST(request: NextRequest) {
  try {
    const BACKEND_BASE_URL = serverEnv.backendBaseUrl;
    if (!BACKEND_BASE_URL) {
      return NextResponse.json(
        { error: 'Configuración del backend ausente.' },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No se proporcionó refresh token.' },
        { status: 401 }
      );
    }

    const backendUrl = `${BACKEND_BASE_URL.replace(/\/$/, '')}/auth/refresh`;

    // Realizar POST al backend enviando el refresh token en las cookies
    const backendResponse = await axios.post(
      backendUrl,
      {},
      {
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': `refresh_token=${refreshToken}`
        },
        validateStatus: () => true, // Capturar todos los códigos HTTP sin lanzar excepción
      }
    );

    if (backendResponse.status >= 400) {
      // Si el backend rechaza el refresh token (vencido, revocado, etc)
      return NextResponse.json(backendResponse.data, { status: backendResponse.status });
    }

    const accessToken = backendResponse.data?.access_token as string | undefined;
    if (!accessToken) {
      return NextResponse.json(
        { error: 'El backend no devolvió un access_token durante el refresh.' },
        { status: 502 }
      );
    }

    const response = NextResponse.json({ ok: true });

    // Configurar la nueva cookie de access_token
    response.cookies.set({
      name: 'access_token',
      value: accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // Ajusta este tiempo si es necesario
    });

    // Reenviar cualquier cookie que el backend intente setear (idealmente el nuevo refresh_token)
    const setCookieHeader = backendResponse.headers['set-cookie'];
    if (setCookieHeader) {
      const cookiesArray = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
      for (const rawCookie of cookiesArray) {
        if (/^refresh_token=/i.test(rawCookie)) {
          response.headers.append('set-cookie', rawCookie);
        }
      }
    }

    return response;
  } catch (error) {
    console.error('Error en /api/auth/refresh:', error);
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(error.response.data, { status: error.response.status });
    }
    return NextResponse.json(
      { error: 'Error inesperado al refrescar el token.' },
      { status: 500 }
    );
  }
}
