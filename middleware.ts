import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    const sessionCookie = request.cookies.get('survsta_session')?.value;
    let userRole: string | null = null;

    if (sessionCookie) {
      try {
        const parsed = JSON.parse(decodeURIComponent(sessionCookie));
        userRole = parsed.role;
      } catch {
        try {
          const parsed = JSON.parse(sessionCookie);
          userRole = parsed.role;
        } catch {
          userRole = null;
        }
      }
    }

    if (!userRole) {
      userRole = request.cookies.get('user_role')?.value || null;
    }

    // Protect sensitive user management route
    if (pathname.startsWith('/admin/users')) {
      if (!userRole) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }

      if (userRole !== 'admin') {
        const unauthorizedUrl = new URL('/unauthorized', request.url);
        unauthorizedUrl.searchParams.set('reason', 'admin_only');
        return NextResponse.redirect(unauthorizedUrl);
      }
    }

    return NextResponse.next();
  } catch (err) {
    console.error('Middleware error:', err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/admin/users/:path*',
  ],
};
