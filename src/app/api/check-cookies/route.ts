import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Read all cookies in the request
    const allCookies = request.cookies.getAll();
    
    // Create a more detailed report on cookies without exposing values
    const cookieReport = allCookies.map(cookie => ({
      name: cookie.name,
      // Replace the value with its length to avoid exposing sensitive data
      valueLength: cookie.value ? cookie.value.length : 0,
      // Show if cookie has secure attributes
      secure: cookie.secure,
      httpOnly: cookie.httpOnly,
      // Show expiration info
      expires: cookie.expires,
      maxAge: cookie.maxAge,
      // Show cookie domain and path
      domain: cookie.domain,
      path: cookie.path,
      // Show sameSite setting
      sameSite: cookie.sameSite,
    }));
    
    // Check for next-auth.session-token cookie which is essential for auth
    const hasSessionToken = allCookies.some(c => 
      c.name === 'next-auth.session-token' || 
      c.name === '__Secure-next-auth.session-token'
    );
    
    // Test that cookies can be set
    const response = NextResponse.json({
      cookies: {
        count: allCookies.length,
        hasSessionToken,
        report: cookieReport,
      },
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString(),
    });
    
    // Set a test cookie to verify cookies can be written
    response.cookies.set('cookie-test', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60, // 1 minute expiry
      path: '/',
    });
    
    return response;
  } catch (error: any) {
    console.error('Cookie check error:', error);
    return NextResponse.json({ 
      error: error.message || 'Unknown error'
    }, { status: 500 });
  }
} 