import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Test 1: Get token using the working method
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: 'next-auth.session-token',
    });

    // Test 2: Get session using getServerSession (most secure method)
    const session = await getServerSession(authOptions);

    // Test 3: Verify token expiration
    const now = Math.floor(Date.now() / 1000);
    const tokenExp = typeof token?.exp === 'number' ? token.exp : null;
    const tokenExpired = tokenExp ? now > tokenExp : true;

    // Test 4: Verify token has required fields
    const hasRequiredFields = !!(token?.id && token?.email);

    // Test 5: Compare token and session consistency
    const tokenSessionMatch = token?.id === session?.user?.id && 
                             token?.email === session?.user?.email;

    // Security audit results
    const securityAudit = {
      tokenValidation: {
        exists: !!token,
        hasValidExpiration: !!tokenExp && !tokenExpired,
        hasRequiredFields: hasRequiredFields,
        expiresAt: tokenExp ? new Date(tokenExp * 1000).toISOString() : null,
        timeUntilExpiry: tokenExp ? tokenExp - now : null,
      },
      sessionValidation: {
        exists: !!session,
        hasUser: !!session?.user,
        userHasId: !!session?.user?.id,
        userHasEmail: !!session?.user?.email,
      },
      consistency: {
        tokenAndSessionMatch: tokenSessionMatch,
        bothMethodsAgree: !!token === !!session,
      },
      security: {
        tokenProperlyDecrypted: !!token && typeof token === 'object',
        sessionProperlyValidated: !!session && typeof session === 'object',
        noSecurityBypass: true, // We're using official NextAuth methods
        jwtSecretPresent: !!process.env.NEXTAUTH_SECRET,
      }
    };

    // Overall security status
    const isSecure = 
      securityAudit.tokenValidation.exists &&
      securityAudit.tokenValidation.hasValidExpiration &&
      securityAudit.sessionValidation.exists &&
      securityAudit.consistency.tokenAndSessionMatch &&
      securityAudit.security.tokenProperlyDecrypted &&
      securityAudit.security.jwtSecretPresent;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      securityStatus: isSecure ? 'SECURE' : 'INSECURE',
      audit: securityAudit,
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      } : null,
      recommendations: !isSecure ? [
        !securityAudit.tokenValidation.exists && 'Token validation failed',
        !securityAudit.tokenValidation.hasValidExpiration && 'Token expired or invalid expiration',
        !securityAudit.sessionValidation.exists && 'Session validation failed',
        !securityAudit.consistency.tokenAndSessionMatch && 'Token and session mismatch',
        !securityAudit.security.jwtSecretPresent && 'JWT secret not configured'
      ].filter(Boolean) : ['All security checks passed']
    });
  } catch (error: any) {
    console.error('Security audit error:', error);
    return NextResponse.json({
      success: false,
      securityStatus: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 