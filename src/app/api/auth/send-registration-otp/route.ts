import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/models/User';
import OTP from '@/models/OTP';
import { generateOTP, sendOTPEmail } from '@/utils/ses';

export async function POST(request: NextRequest) {
  console.log('🔍 [API] Registration OTP Request received');
  
  try {
    const { email, name } = await request.json();
    console.log('📧 Processing registration OTP for:', { email, hasName: !!name });
    
    // Validate input
    if (!email) {
      console.log('❌ Email validation failed: Email is required');
      return NextResponse.json(
        { success: false, message: 'Email is required' }, 
        { status: 400 }
      );
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Email validation failed: Invalid email format');
      return NextResponse.json(
        { success: false, message: 'Invalid email format' }, 
        { status: 400 }
      );
    }
    
    // Connect to database
    console.log('🔌 Connecting to database...');
    try {
      await connectToDatabase();
      console.log('✅ Database connected');
    } catch (dbError) {
      console.error('💥 Database connection error:', dbError);
      throw dbError;
    }
    
    // Check if user already exists
    console.log('🔍 Checking if user exists...');
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('⚠️ User already exists with email:', email);
      return NextResponse.json(
        { success: false, message: 'User with this email already exists' }, 
        { status: 409 }
      );
    }
    
    // Generate OTP
    console.log('🔑 Generating OTP...');
    const otp = generateOTP();
    
    // Set expiration time (15 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);
    
    // Delete any existing OTPs for this email with the registration purpose
    console.log('🧹 Cleaning up existing OTPs...');
    await OTP.deleteMany({ 
      email: email.toLowerCase(), 
      purpose: 'registration' 
    });
    
    // Create new OTP record
    console.log('💾 Creating new OTP record...');
    const otpRecord = await OTP.create({
      email: email.toLowerCase(),
      otp,
      expiresAt,
      purpose: 'registration',
      metadata: { name } // Store name to use later during registration
    });
    console.log('✅ OTP record created with expiration:', expiresAt);
    
    // Send OTP via email with registration purpose
    console.log('📤 Sending OTP email...');
    const emailSent = await sendOTPEmail(email, otp, 'registration');
    
    if (!emailSent) {
      console.error('💥 Failed to send verification email');
      return NextResponse.json(
        { success: false, message: 'Failed to send verification email' }, 
        { status: 500 }
      );
    }
    
    console.log('✅ OTP email sent successfully');
    
    // Return success response
    return NextResponse.json({
      success: true, 
      message: 'Verification code sent to your email'
    });
    
  } catch (error) {
    console.error('💥 Registration OTP error:', error);
    console.error('Error details:', {
      message: (error as Error).message,
      stack: (error as Error).stack,
      errorType: error.constructor.name
    });
    return NextResponse.json(
      { success: false, message: 'Failed to send verification code' }, 
      { status: 500 }
    );
  }
} 