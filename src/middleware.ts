import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Public paths that don't require authentication
const publicPaths = [
  '/auth/auth1/login',
  '/auth/auth1/register',
  '/auth/auth1/forgot-password',
  '/auth/auth1/error',
  '/test-session',
  '/health',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/health') {
    return new NextResponse('OK', { status: 200 });
  }
  

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

  // Multiple authentication detection methods for production reliability
  let isAuthenticated = false;
  
  try {
    // Method 1: Try getToken with multiple configurations
    let token = null;
    
    // Try with default configuration
    token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // If no token found, try with different cookie names
    if (!token) {
      token = await getToken({ 
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        cookieName: 'next-auth.session-token',
      });
    }

    // If still no token, try with __Secure prefix (common in production HTTPS)
    if (!token && process.env.NODE_ENV === 'production') {
      token = await getToken({ 
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        cookieName: '__Secure-next-auth.session-token',
      });
    }

    if (token) {
      isAuthenticated = true;
    }

    // No fallback methods - only trust NextAuth validated tokens

    // Log authentication status in development
    if (process.env.NODE_ENV === 'development') {
      console.log("Middleware - Path:", pathname);
      console.log("Authenticated:", isAuthenticated);
    }
    
  } catch (error) {
    console.error('Error in middleware authentication check:', error);
    isAuthenticated = false;
  }

  // Handle root path
  if (pathname === '/') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/auth/auth1/login', request.url));
    }
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (isAuthenticated && isPublicPath && !pathname.startsWith('/test-session')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user is not authenticated and trying to access protected pages, redirect to login
  if (!isAuthenticated && !isPublicPath) {
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