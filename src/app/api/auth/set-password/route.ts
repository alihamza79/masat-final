import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/models/User';
import OTP from '@/models/OTP';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const { email, password, token } = await request.json();
    
    // Validate input
    if (!email || !password || !token) {
      return NextResponse.json(
        { success: false, message: 'Email, password and verification token are required' }, 
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
    if (!user.googleLinked) {
      return NextResponse.json(
        { success: false, message: 'Cannot set password for this account type' }, 
        { status: 403 }
      );
    }
    
    // If the account already has credentials linked, we should not allow setting a password
    // without a proper password reset flow
    if (user.credentialsLinked) {
      return NextResponse.json(
        { success: false, message: 'This account already has a password set. Use the forgot password feature to reset it.' }, 
        { status: 403 }
      );
    }
    
    // Verify the token
    try {
      const decodedToken = Buffer.from(token, 'base64').toString('utf-8');
      const [tokenEmail, otpId, timestamp] = decodedToken.split(':');
      
      // Check if the token is for the same email
      if (tokenEmail.toLowerCase() !== email.toLowerCase()) {
        return NextResponse.json(
          { success: false, message: 'Invalid verification token' }, 
          { status: 403 }
        );
      }
      
      // Check if the token is not too old (max 15 minutes)
      const tokenTime = parseInt(timestamp);
      if (Date.now() - tokenTime > 15 * 60 * 1000) {
        return NextResponse.json(
          { success: false, message: 'Verification token has expired. Please request a new verification code.' }, 
          { status: 403 }
        );
      }
      
      // Find the OTP record
      const otpRecord = await OTP.findOne({ 
        _id: new ObjectId(otpId),
        email: email.toLowerCase(),
        verified: true,
        purpose: 'set-password'
      });
      
      if (!otpRecord) {
        return NextResponse.json(
          { success: false, message: 'Invalid or expired verification. Please request a new verification code.' }, 
          { status: 403 }
        );
      }
    } catch (tokenError) {
      console.error('Token verification error:', tokenError);
      return NextResponse.json(
        { success: false, message: 'Invalid verification token format' }, 
        { status: 403 }
      );
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update user's password and mark credentials as linked
    user.password = hashedPassword;
    user.credentialsLinked = true;
    
    await user.save();
    
    // Delete all OTP records for this email with set-password purpose
    await OTP.deleteMany({ 
      email: email.toLowerCase(),
      purpose: 'set-password'
    });
    
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