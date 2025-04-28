import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { getToken } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  try {
    // Get session using getServerSession
    const session = await getServerSession(authOptions);
    
    // Get the raw token using getToken
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });
    
    // Check key environment variables (without revealing sensitive values)
    const envCheck = {
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NODE_ENV: process.env.NODE_ENV,
    };
    
    return NextResponse.json({
      hasSession: !!session,
      sessionData: session ? {
        expires: session.expires,
        user: {
          id: session.user?.id,
          name: session.user?.name,
          email: session.user?.email,
          image: session.user?.image ? "****" : null,
          // Don't include other sensitive data
        }
      } : null,
      hasToken: !!token,
      tokenData: token ? {
        name: token.name,
        email: token.email,
        picture: token.picture ? "****" : null,
        exp: token.exp,
        iat: token.iat,
        jti: token.jti ? "****" : null,
        sub: token.sub ? "****" : null,
        // Type data but not values
        id: token.id ? "****" : null,
        phoneNumber: token.phoneNumber ? "****" : null,
        remember: token.remember,
      } : null,
      envCheck,
      cookies: {
        count: request.cookies.getAll().length,
        names: request.cookies.getAll().map(c => c.name),
      }
    });
  } catch (error: any) {
    console.error('Auth debug error:', error);
    return NextResponse.json({ 
      error: error.message || 'Unknown error', 
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
} 