import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get the user's session
    const session = await getServerSession(authOptions);
    
    console.log('Test Session Endpoint - Session Data:', {
      exists: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id || 'none',
      userEmail: session?.user?.email || 'none'
    });
    
    // Return the session data for debugging
    return NextResponse.json({
      success: true,
      session: session ? {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name
        }
      } : null
    });
  } catch (error: any) {
    console.error('Error in test-session endpoint:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Session test failed' 
    }, { status: 500 });
  }
} 