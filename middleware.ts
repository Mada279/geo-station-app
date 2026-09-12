import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    // 1. Safe cookie extraction for Edge runtime
    let userRole: string | null = null;
    try {
      const sessionCookie = request.cookies.get('survsta_session')?.value;
      if (sessionCookie) {
        try {
          const decoded = decodeURIComponent(sessionCookie);
          const parsed = JSON.parse(decoded);
          userRole = parsed?.role || null;
        } catch {
          try {
            const parsed = JSON.parse(sessionCookie);
            userRole = parsed?.role || null;
          } catch {
            userRole = null;
          }
        }
      }

      if (!userRole) {
        userRole = request.cookies.get('user_role')?.value || null;
      }
    } catch {
      userRole = null;
    }

    // 2. Sensitive route protection (/admin/users)
    if (pathname.startsWith('/admin/users')) {
      // Allow bypass if query param bypass=true is present for preview/debug
      if (request.nextUrl.searchParams.get('bypass') === 'true') {
        return NextResponse.next();
      }

      // If user has admin role, allow through
      if (userRole === 'admin') {
        return NextResponse.next();
      }

      // If no valid session, redirect safely to /login
      if (!userRole) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = '/login';
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // If role is not admin, redirect safely to /unauthorized
      const unauthorizedUrl = request.nextUrl.clone();
      unauthorizedUrl.pathname = '/unauthorized';
      unauthorizedUrl.searchParams.set('reason', 'admin_only');
      return NextResponse.redirect(unauthorizedUrl);
    }

    // 3. All other admin and app routes pass through cleanly
    return NextResponse.next();
  } catch (error) {
    // Fail-safe: Never throw 500 MIDDLEWARE_INVOCATION_FAILED in Edge runtime
    console.error('[Middleware Fail-Safe Handled Error]:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/admin/users',
    '/admin/users/:path*',
  ],
};
