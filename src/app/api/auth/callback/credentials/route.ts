import { NextRequest, NextResponse } from 'next/server';
import { signIn } from 'next-auth/react';
import { authOptions } from '@/app/lib/auth';
import { connectToDatabase } from '@/lib/db/mongodb';
import User, { IUser } from '@/models/User';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { encode } from 'next-auth/jwt';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get('email');
  const password = searchParams.get('password');
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  
  if (!email || !password) {
    return NextResponse.redirect(
      new URL(`/auth/auth1/login?error=MissingCredentials`, request.url)
    );
  }
  
  try {
    // Manual authentication process
    await connectToDatabase();
    const user = await User.findOne({ email: email.toLowerCase() }) as IUser;
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      // Authentication failed
      return NextResponse.redirect(
        new URL(`/auth/auth1/login?error=CredentialsSignin`, request.url)
      );
    }
    
    // Authentication succeeded, create session
    const userId = user._id as unknown as ObjectId;
    
    const token = await encode({
      token: {
        id: userId.toString(),
        email: user.email,
        name: user.name || '',
        picture: user.image || '',
      },
      secret: process.env.NEXTAUTH_SECRET || '',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
    
    // Set session cookie
    const cookieStore = cookies();
    cookieStore.set('next-auth.session-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });
    
    // Mark as having used credentials
    User.updateOne(
      { _id: userId },
      { $set: { credentialsLinked: true } }
    ).catch(error => console.error('Error updating credentialsLinked:', error));
    
    // Redirect to dashboard or requested callback URL
    return NextResponse.redirect(new URL(callbackUrl, request.url));
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.redirect(
      new URL(`/auth/auth1/login?error=AuthError`, request.url)
    );
  }
} 