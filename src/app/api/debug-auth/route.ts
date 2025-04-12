import { NextResponse } from 'next/server';

export async function GET() {
  // Only return masked values for security
  return NextResponse.json({
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    nextAuthSecretFirstChar: process.env.NEXTAUTH_SECRET ? process.env.NEXTAUTH_SECRET.charAt(0) : null,
    nextAuthSecretLength: process.env.NEXTAUTH_SECRET ? process.env.NEXTAUTH_SECRET.length : 0,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
} 