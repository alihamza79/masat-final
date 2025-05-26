import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const environmentInfo = {
      nodeEnv: process.env.NODE_ENV,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      hasSecret: !!process.env.NEXTAUTH_SECRET,
      hasMongoUri: !!process.env.MONGODB_URI,
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasFacebookClientId: !!process.env.FACEBOOK_CLIENT_ID,
      buildTime: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      // Include some runtime information
      runtime: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime()
      }
    };

    return NextResponse.json(environmentInfo);
  } catch (error) {
    console.error('Error fetching environment info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch environment information' },
      { status: 500 }
    );
  }
} 