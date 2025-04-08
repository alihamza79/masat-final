import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/models/User';
import OTP from '@/models/OTP';
import { generateOTP, sendOTPEmail } from '@/utils/ses';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    // Validate input
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' }, 
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // For security reasons, don't reveal if the email exists or not
      // Instead, pretend we sent an email even if the account doesn't exist
      return NextResponse.json({
        success: true, 
        message: 'If your email exists in our system, you will receive a password reset code'
      });
    }
    
    // Only allow password reset for accounts with credentials already set
    if (!user.credentialsLinked) {
      // For accounts without password (Google-only), suggest linking method
      if (user.googleLinked) {
        return NextResponse.json({
          success: false, 
          message: 'This account uses Google Sign-In. Please use "Set Password" option instead.',
          action: 'set-password'
        }, { status: 400 });
      }
      
      return NextResponse.json({
        success: false, 
        message: 'This account cannot reset password.'
      }, { status: 400 });
    }
    
    // Generate OTP
    const otp = generateOTP();
    
    // Set expiration time (15 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);
    
    // Delete any existing OTPs for this email with the reset-password purpose
    await OTP.deleteMany({ 
      email: email.toLowerCase(), 
      purpose: 'reset-password' 
    });
    
    // Create new OTP record
    await OTP.create({
      email: email.toLowerCase(),
      otp,
      expiresAt,
      purpose: 'reset-password'
    });
    
    // Send OTP via email
    const emailSent = await sendOTPEmail(email, otp);
    
    if (!emailSent) {
      return NextResponse.json(
        { success: false, message: 'Failed to send verification email' }, 
        { status: 500 }
      );
    }
    
    // Return success response
    return NextResponse.json({
      success: true, 
      message: 'Password reset code sent to your email'
    });
    
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process your request' }, 
      { status: 500 }
    );
  }
} 