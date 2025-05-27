import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getToken } from 'next-auth/jwt';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get session using getServerSession
    const session = await getServerSession(authOptions);
    
    // Get token using getToken
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      raw: false,
    });

    // Get raw token for debugging
    const rawToken = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      raw: true,
    });

    // Get all cookies for debugging
    const cookies = Object.fromEntries(
      request.cookies.getAll().map(cookie => [cookie.name, cookie.value])
    );

    // Get headers for debugging
    const relevantHeaders = {
      'user-agent': request.headers.get('user-agent'),
      'cookie': request.headers.get('cookie'),
      'x-forwarded-for': request.headers.get('x-forwarded-for'),
      'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
      'host': request.headers.get('host'),
    };

    const debugInfo = {
      success: true,
      timestamp: new Date().toISOString(),
      nodeEnvironment: process.env.NODE_ENV,
      session: {
        exists: !!session,
        user: session?.user || null,
      },
      token: {
        exists: !!token,
        id: token?.id || null,
        email: token?.email || null,
        exp: token?.exp || null,
      },
      rawToken: {
        exists: !!rawToken,
        length: rawToken ? rawToken.length : 0,
        preview: rawToken ? rawToken.substring(0, 50) + '...' : null,
      },
      cookies: {
        sessionToken: cookies['next-auth.session-token'] ? 'Present' : 'Missing',
        callbackUrl: cookies['next-auth.callback-url'] ? 'Present' : 'Missing',
        csrfToken: cookies['next-auth.csrf-token'] ? 'Present' : 'Missing',
        allCookies: Object.keys(cookies),
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        nextAuthUrl: process.env.NEXTAUTH_URL,
        hasSecret: !!process.env.NEXTAUTH_SECRET,
        secretLength: process.env.NEXTAUTH_SECRET?.length || 0,
      },
      headers: relevantHeaders,
      url: {
        pathname: request.nextUrl.pathname,
        origin: request.nextUrl.origin,
        host: request.nextUrl.host,
      }
    };

    return NextResponse.json(debugInfo);
  } catch (error: any) {
    console.error('Debug auth session error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 