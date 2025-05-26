import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Create a safe version of auth config without sensitive information
    const safeAuthConfig = {
      providers: authOptions.providers?.map(provider => ({
        id: provider.id,
        name: provider.name,
        type: provider.type,
        // Don't include client secrets or other sensitive data
      })),
      session: {
        strategy: authOptions.session?.strategy,
        maxAge: authOptions.session?.maxAge,
      },
      jwt: {
        maxAge: authOptions.jwt?.maxAge,
      },
      pages: authOptions.pages,
      debug: authOptions.debug,
      callbacks: Object.keys(authOptions.callbacks || {}),
      // Include environment-specific info
      environment: {
        hasSecret: !!process.env.NEXTAUTH_SECRET,
        nextAuthUrl: process.env.NEXTAUTH_URL,
        nodeEnv: process.env.NODE_ENV,
      }
    };

    return NextResponse.json(safeAuthConfig);
  } catch (error) {
    console.error('Error fetching auth config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch auth configuration' },
      { status: 500 }
    );
  }
} 