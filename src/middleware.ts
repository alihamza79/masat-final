import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Public paths that don't require authentication
const publicPaths = [
  '/auth/auth1/login',
  '/auth/auth1/register',
  '/auth/auth1/forgot-password',
  '/auth/auth1/error'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the path is a public path
  if (publicPaths.some(path => pathname.startsWith(path))) {
    // Check if user is already authenticated
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });
    
    // If authenticated and trying to access auth pages, redirect to dashboard
    if (token) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Allow access to public paths for unauthenticated users
    return NextResponse.next();
  }
  
  // Check if the path is an API route or NextAuth route
  if (pathname.startsWith('/api') || pathname.includes('/api/auth')) {
    // Allow access to API routes - Authentication for API routes is handled 
    // in the API handlers themselves
    return NextResponse.next();
  }
  
  // Check if user is authenticated
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });
  
  // If not authenticated and not accessing public paths, redirect to login
  if (!token) {
    const url = new URL('/auth/auth1/login', request.url);
    // Set the return URL so we can redirect after login
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(url);
  }
  
  // Allow access to protected routes for authenticated users
  return NextResponse.next();
}

// Configure matcher to run middleware only on specific paths
// Make sure to exclude NextAuth API routes
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|api/auth).*)']
}; 