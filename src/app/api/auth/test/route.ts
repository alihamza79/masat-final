import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { 
        authenticated: false, 
        message: 'You are not authenticated' 
      }, 
      { status: 401 }
    );
  }
  
  return NextResponse.json({ 
    authenticated: true, 
    message: 'You are authenticated',
    session: {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      }
    }
  });
} 