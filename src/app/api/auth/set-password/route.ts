import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' }, 
        { status: 400 }
      );
    }
    
    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters' }, 
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' }, 
        { status: 404 }
      );
    }
    
    // Security check: Only allow setting password if the account has Google linked
    // This prevents random people from setting passwords on accounts they don't own
    if (!user.googleLinked) {
      return NextResponse.json(
        { success: false, message: 'Cannot set password for this account type' }, 
        { status: 403 }
      );
    }
    
    // If the account already has credentials linked, extra security is needed
    // In a production app, you would send a verification email first
    if (user.credentialsLinked) {
      return NextResponse.json(
        { success: false, message: 'This account already has a password set. Use the forgot password feature to reset it.' }, 
        { status: 403 }
      );
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update user's password and mark credentials as linked
    user.password = hashedPassword;
    user.credentialsLinked = true;
    
    await user.save();
    
    // Return success response
    return NextResponse.json({
      success: true, 
      message: 'Password set successfully'
    });
    
  } catch (error) {
    console.error('Set password error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to set password' }, 
      { status: 500 }
    );
  }
} 