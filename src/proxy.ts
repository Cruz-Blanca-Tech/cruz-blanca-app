import { NextResponse, type NextRequest } from 'next/server';
import { canAccess, DEFAULT_PRIVATE_ROUTE, isPublicRoute } from '@/config/routes';
import { ROLES, type Role } from '@/features/auth/types';

const ACCESS_TOKEN_COOKIE = 'access_token';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getRoleFromToken(token: string): Role | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  const exp = payload.exp;
  if (typeof exp === 'number' && exp * 1000 < Date.now()) return null;
  const role = payload.role;
  if (typeof role !== 'string') return null;
  const allowedRoles = Object.values(ROLES) as string[];
  return allowedRoles.includes(role) ? (role as Role) : null;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const role = accessToken ? getRoleFromToken(accessToken) : null;
  const isAuthenticated = role !== null;
  const onPublicRoute = isPublicRoute(pathname);

  if (isAuthenticated && onPublicRoute) {
    return NextResponse.redirect(new URL(DEFAULT_PRIVATE_ROUTE, request.url));
  }

  if (!isAuthenticated && !onPublicRoute) {
    const loginUrl = new URL('/auth', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && !onPublicRoute && !canAccess(pathname, role)) {
    return NextResponse.redirect(new URL(DEFAULT_PRIVATE_ROUTE, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
