import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Public paths that don't require authentication
const publicPaths = [
  '/auth/auth1/login',
  '/auth/auth1/register',
  '/auth/auth1/forgot-password',
  '/auth/auth1/error',
  '/test-session',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes and static files
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check if the path is public
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // Get the token with more robust configuration
  let token = null;
  try {
    token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      // Let NextAuth auto-detect the cookie name
      // Use raw mode for better compatibility
      raw: false,
    });
    
    // Log token status in development only
    if (process.env.NODE_ENV === 'development') {
      console.log("Middleware - Checking token for path:", pathname);
      console.log("Token exists:", !!token);
      console.log("Token ID:", token?.id || 'No ID');
    }
  } catch (error) {
    console.error('Error getting token in middleware:', error);
    // Continue without token if there's an error
    token = null;
  }

  // Handle root path
  if (pathname === '/') {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/auth/auth1/login', request.url));
    }
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (token && isPublicPath && !pathname.startsWith('/test-session')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user is not authenticated and trying to access protected pages, redirect to login
  if (!token && !isPublicPath) {
    const url = new URL('/auth/auth1/login', request.url);
    url.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
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