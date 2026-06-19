import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import axios from 'axios';

export async function POST() {
  const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL ?? process.env.NEXT_PUBLIC_BACKEND_BASE_URL;
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refresh_token')?.value;
  const accessToken = cookieStore.get('access_token')?.value;

  if (BACKEND_BASE_URL && refreshToken) {
    try {
      await axios.post(
        `${BACKEND_BASE_URL.replace(/\/$/, '')}/auth/logout`,
        null,
        {
          headers: {
            Cookie: `refresh_token=${refreshToken}`,
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          validateStatus: () => true,
        }
      );
    } catch (error) {
      console.error('Error notificando logout al backend:', error);
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({ name: 'access_token', value: '', maxAge: 0, path: '/' });
  response.cookies.set({ name: 'refresh_token', value: '', maxAge: 0, path: '/' });
  return response;
}
