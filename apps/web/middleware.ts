import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/share'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/onboarding', '/settings'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute && !isPublicRoute) {
    const sessionCookie = request.cookies.get('fp_session');

    if (!sessionCookie) {
      // Redirect to landing page if not authenticated
      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  const response = NextResponse.next();
  
  // Add noindex for staging environment (prevent Google from indexing staging.familyplate.ai)
  if (process.env.NEXT_PUBLIC_ENVIRONMENT !== 'production') {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
