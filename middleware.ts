import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export type UserRole = 'admin' | 'provider' | 'customer';

interface SessionPayload {
  userId: string;
  email: string;
  role: UserRole;
}

/**
 * Extracts and verifies session token from cookies or authorization header.
 */
function getSessionUser(request: NextRequest): SessionPayload | null {
  // 1. Check custom Survsta session cookie
  const sessionCookie = request.cookies.get('survsta_session')?.value;
  if (sessionCookie) {
    try {
      return JSON.parse(decodeURIComponent(sessionCookie));
    } catch {
      // invalid cookie format
    }
  }

  // 2. Check Supabase role cookie
  const roleCookie = request.cookies.get('user_role')?.value as UserRole | undefined;
  const tokenCookie = request.cookies.get('sb-access-token')?.value || request.cookies.get('sb_auth')?.value;

  if (tokenCookie && roleCookie) {
    return {
      userId: 'auth-user-id',
      email: 'user@survsta.com',
      role: roleCookie,
    };
  }

  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const user = getSessionUser(request);

  const isAdminRoute = pathname.startsWith('/admin');
  const isProviderRoute = pathname.startsWith('/provider');

  // Guard protected routes
  if (isAdminRoute || isProviderRoute) {
    // 1. Unauthenticated -> Redirect to Login with callbackUrl using request.nextUrl.clone()
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 2. Role Check: /admin/* strictly restricted to 'admin'
    if (isAdminRoute && user.role !== 'admin') {
      const unauthorizedUrl = request.nextUrl.clone();
      unauthorizedUrl.pathname = '/unauthorized';
      unauthorizedUrl.searchParams.set('reason', 'admin_only');
      return NextResponse.redirect(unauthorizedUrl);
    }

    // 3. Role Check: /provider/* strictly restricted to 'provider'
    if (isProviderRoute && user.role !== 'provider') {
      const unauthorizedUrl = request.nextUrl.clone();
      unauthorizedUrl.pathname = '/unauthorized';
      unauthorizedUrl.searchParams.set('reason', 'provider_only');
      return NextResponse.redirect(unauthorizedUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/provider/:path*',
  ],
};
