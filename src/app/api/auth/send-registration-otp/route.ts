import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/models/User';
import OTP from '@/models/OTP';
import { generateOTP, sendOTPEmail } from '@/utils/ses';

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();
    
    // Validate input
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' }, 
        { status: 400 }
      );
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' }, 
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User with this email already exists' }, 
        { status: 409 }
      );
    }
    
    // Generate OTP
    const otp = generateOTP();
    
    // Set expiration time (15 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);
    
    // Delete any existing OTPs for this email with the registration purpose
    await OTP.deleteMany({ 
      email: email.toLowerCase(), 
      purpose: 'registration' 
    });
    
    // Create new OTP record
    const otpRecord = await OTP.create({
      email: email.toLowerCase(),
      otp,
      expiresAt,
      purpose: 'registration',
      metadata: { name } // Store name to use later during registration
    });
    
    // Send OTP via email with registration purpose
    const emailSent = await sendOTPEmail(email, otp, 'registration');
    
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
    console.error('Registration OTP error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send verification code' }, 
      { status: 500 }
    );
  }
} 