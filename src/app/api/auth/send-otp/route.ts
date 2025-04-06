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
    
    // Generate OTP
    const otp = generateOTP();
    
    // Set expiration time (15 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);
    
    // Delete any existing OTPs for this email with the same purpose
    await OTP.deleteMany({ 
      email: email.toLowerCase(), 
      purpose: 'set-password' 
    });
    
    // Create new OTP record
    await OTP.create({
      email: email.toLowerCase(),
      otp,
      expiresAt,
      purpose: 'set-password'
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
      message: 'Verification code sent to your email'
    });
    
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send verification code' }, 
      { status: 500 }
    );
  }
} 