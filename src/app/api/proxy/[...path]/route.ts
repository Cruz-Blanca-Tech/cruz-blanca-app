import { NextRequest, NextResponse } from 'next/server';
import axios, { AxiosRequestConfig } from 'axios';
import { cookies } from 'next/headers';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, await params, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, await params, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, await params, 'PUT');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, await params, 'PATCH');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, await params, 'DELETE');
}

const PUBLIC_BACKEND_PATHS = ['security/login'];

async function handleRequest(
  request: NextRequest,
  params: { path: string[] },
  method: Method
) {
  try {
    const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL ?? process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

    if (!BACKEND_BASE_URL) {
      return NextResponse.json(
        { error: 'Error de configuración. Por favor, contacta al administrador.' },
        { status: 500 }
      );
    }

    const pathSegments = params.path || [];
    const backendPath = pathSegments.join('/');
    const isPublic = PUBLIC_BACKEND_PATHS.includes(backendPath);

    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    const refreshTokenCookie = cookieStore.get('refresh_token')?.value;

    if (!isPublic && !accessToken) {
      return NextResponse.json(
        { error: 'No autorizado. Por favor, inicia sesión.' },
        { status: 401 }
      );
    }

    const backendUrl = `${BACKEND_BASE_URL.replace(/\/$/, '')}/${backendPath}`;
    const queryString = request.nextUrl.searchParams.toString();
    const fullBackendUrl = queryString ? `${backendUrl}?${queryString}` : backendUrl;

    let body: unknown = null;
    const contentType = request.headers.get('content-type') ?? '';
    if (method !== 'GET' && method !== 'DELETE') {
      try {
        if (contentType.includes('application/json')) {
          body = await request.json();
        } else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
          body = await request.formData();
        } else {
          body = await request.text();
        }
      } catch {
        body = null;
      }
    }

    const headers: Record<string, string> = {};
    if (contentType && !contentType.includes('multipart/form-data')) {
      headers['Content-Type'] = contentType || 'application/json';
    }

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    if (refreshTokenCookie) {
      headers['Cookie'] = `refresh_token=${refreshTokenCookie}`;
    }

    const config: AxiosRequestConfig = {
      method,
      url: fullBackendUrl,
      headers,
      ...(body !== null && { data: body }),
      validateStatus: () => true,
    };

    try {
      const response = await axios(config);

      const nextResponse = NextResponse.json(response.data, { status: response.status });

      const setCookieHeader = response.headers['set-cookie'];
      if (setCookieHeader) {
        const cookiesArray = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
        for (const rawCookie of cookiesArray) {
          if (/^refresh_token=/i.test(rawCookie)) {
            nextResponse.headers.append('set-cookie', rawCookie);
          }
        }
      }

      if (response.status >= 400) {
        console.error('Backend error:', {
          status: response.status,
          url: fullBackendUrl,
          data: response.data,
        });
      }

      return nextResponse;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status || 500;
        const errorData = error.response?.data || {
          error: 'Error al comunicarse con el servidor.',
        };
        return NextResponse.json(errorData, { status: statusCode });
      }
      return NextResponse.json(
        { error: 'Error inesperado al procesar la solicitud.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Proxy route fatal error:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud. Por favor, intenta nuevamente.' },
      { status: 500 }
    );
  }
}
