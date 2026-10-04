import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignore static files, images, icons, and API internal calls
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/manifest.json')
  ) {
    return NextResponse.next();
  }

  // 1. Inspect cookies for active session
  const sessionCookie = request.cookies.get('survsta_session')?.value;
  const roleCookie = request.cookies.get('user_role')?.value;

  let userRole: string | null = roleCookie || null;
  let userEmail: string | null = null;

  if (sessionCookie) {
    try {
      const decoded = decodeURIComponent(sessionCookie);
      const parsed = JSON.parse(decoded);
      if (parsed) {
        if (!userRole && parsed.role) userRole = parsed.role;
        if (parsed.email) userEmail = parsed.email;
      }
    } catch {
      // In case sessionCookie is raw string
      if (sessionCookie !== 'undefined') userEmail = sessionCookie;
    }
  }

  // Admin Override
  if (userEmail === 'ahmed@survsta.com') {
    userRole = 'admin';
  }

  // 2. Protect Admin Route
  if (pathname.startsWith('/admin')) {
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Protect Provider Route
  if (pathname.startsWith('/provider')) {
    const isAuthorized =
      userRole === 'provider' || userRole === 'admin' || userRole === 'super_admin';
    if (!isAuthorized) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Return standard response with refreshed headers
  const response = NextResponse.next();
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, svg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
