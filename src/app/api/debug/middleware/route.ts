import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const cookies = request.cookies;
    const allCookies: { [key: string]: string } = {};
    
    // Get all cookie names and values
    const cookieNames = cookies.getAll().map(cookie => cookie.name);
    cookieNames.forEach(name => {
      const cookie = cookies.get(name);
      if (cookie) {
        allCookies[name] = cookie.value;
      }
    });

    // Try multiple token detection methods
    let tokenResults: any = {};

    // Method 1: Default getToken
    try {
      const token1 = await getToken({ 
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });
      tokenResults.defaultToken = {
        exists: !!token1,
        id: token1?.id || null,
        email: token1?.email || null,
      };
    } catch (error: any) {
      tokenResults.defaultToken = { error: error.message };
    }

    // Method 2: With explicit cookie name
    try {
      const token2 = await getToken({ 
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        cookieName: 'next-auth.session-token',
      });
      tokenResults.explicitCookieToken = {
        exists: !!token2,
        id: token2?.id || null,
        email: token2?.email || null,
      };
    } catch (error: any) {
      tokenResults.explicitCookieToken = { error: error.message };
    }

    // Method 3: Secure cookie name
    try {
      const token3 = await getToken({ 
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        cookieName: '__Secure-next-auth.session-token',
      });
      tokenResults.secureCookieToken = {
        exists: !!token3,
        id: token3?.id || null,
        email: token3?.email || null,
      };
    } catch (error: any) {
      tokenResults.secureCookieToken = { error: error.message };
    }

    // Direct cookie checks
    const sessionCookies = {
      'next-auth.session-token': cookies.get('next-auth.session-token')?.value || null,
      '__Secure-next-auth.session-token': cookies.get('__Secure-next-auth.session-token')?.value || null,
      '__Host-next-auth.session-token': cookies.get('__Host-next-auth.session-token')?.value || null,
    };

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      data: {
        tokenResults,
        sessionCookies: Object.fromEntries(
          Object.entries(sessionCookies).map(([key, value]) => [
            key, 
            value ? `${value.substring(0, 20)}...` : null
          ])
        ),
        allCookieNames: Object.keys(allCookies),
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        userAgent: request.headers.get('user-agent'),
        host: request.headers.get('host'),
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
      }
    });
  } catch (error: any) {
    console.error('Error in middleware debug:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 