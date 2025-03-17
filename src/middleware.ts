import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

  // Define public paths that don't require authentication
  const isPublicPath = path === '/auth/password-protection';

  // Check if the user is authenticated from the cookie
  const isAuthenticated = request.cookies.has('isAuthenticated');

  // Health check path
  if (path === '/health') {
    return new NextResponse('OK', { status: 200 });
  }

  // If the path is not public and the user is not authenticated, redirect to the password protection page
  if (!isPublicPath && !isAuthenticated) {
    return NextResponse.redirect(new URL('/auth/password-protection', request.url));
  }

  // If the path is public and the user is authenticated, redirect to the home page
  if (isPublicPath && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Continue with the request
  return NextResponse.next();
}

// Configure the paths that should be checked by the middleware
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