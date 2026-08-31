import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { serverEnv } from '@/lib/env.server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const BACKEND_BASE_URL = serverEnv.backendBaseUrl;
    if (!BACKEND_BASE_URL) {
      return NextResponse.json(
        { error: 'Configuración del backend ausente.' },
        { status: 500 }
      );
    }

    const { google_token } = (await request.json()) as { google_token?: string };
    if (!google_token) {
      return NextResponse.json(
        { error: 'Token de Google requerido.' },
        { status: 400 }
      );
    }

    const backendUrl = `${BACKEND_BASE_URL.replace(/\/$/, '')}/auth/login`;

    const backendResponse = await axios.post(
      backendUrl,
      { google_token },
      {
        headers: { 'Content-Type': 'application/json' },
        validateStatus: () => true,
      }
    );

    if (backendResponse.status >= 400) {
      return NextResponse.json(backendResponse.data, { status: backendResponse.status });
    }

    const accessToken = backendResponse.data?.access_token as string | undefined;
    if (!accessToken) {
      return NextResponse.json(
        { error: 'El backend no devolvió un access_token.' },
        { status: 502 }
      );
    }

    const response = NextResponse.json({ ok: true });

    response.cookies.set({
      name: 'access_token',
      value: accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

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
    console.error('Error en /api/auth/google/callback:', error);
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(error.response.data, { status: error.response.status });
    }
    return NextResponse.json(
      { error: 'Error inesperado durante el inicio de sesión.' },
      { status: 500 }
    );
  }
}
