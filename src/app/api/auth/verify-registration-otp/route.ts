import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import OTP from '@/models/OTP';
import bcrypt from 'bcryptjs';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  console.log('🔍 [API] Verify Registration OTP Request received');
  
  try {
    const { email, otp, password } = await request.json();
    console.log('🔐 Verifying registration OTP for:', { email, hasOtp: !!otp, hasPassword: !!password });
    
    // Validate input
    if (!email || !otp || !password) {
      console.log('❌ Validation failed: Missing required fields');
      return NextResponse.json(
        { success: false, message: 'Email, verification code, and password are required' }, 
        { status: 400 }
      );
    }
    
    // Validate password length
    if (password.length < 6) {
      console.log('❌ Validation failed: Password too short');
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters' }, 
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
    
    // Find the latest OTP record for this email
    console.log('🔍 Looking for OTP record...');
    const otpRecord = await OTP.findOne({ 
      email: email.toLowerCase(), 
      purpose: 'registration'
    }).sort({ createdAt: -1 });
    
    if (!otpRecord) {
      console.log('❌ No OTP record found for email:', email);
      return NextResponse.json(
        { success: false, message: 'No verification code found. Please request a new one.' }, 
        { status: 404 }
      );
    }
    
    console.log('✅ OTP record found with expiration:', otpRecord.expiresAt);
    
    // Check if OTP is expired
    const now = new Date();
    if (now > otpRecord.expiresAt) {
      console.log('⏰ OTP expired at:', otpRecord.expiresAt, 'Current time:', now);
      return NextResponse.json(
        { success: false, message: 'Verification code has expired. Please request a new one.' }, 
        { status: 400 }
      );
    }
    
    // Check if OTP is already verified
    if (otpRecord.verified) {
      console.log('⚠️ OTP already used');
      return NextResponse.json(
        { success: false, message: 'This verification code has already been used.' }, 
        { status: 400 }
      );
    }
    
    // Verify OTP
    console.log('🔐 Checking OTP match: provided:', otp, 'stored:', otpRecord.otp);
    if (otpRecord.otp !== otp) {
      console.log('❌ Invalid OTP provided');
      return NextResponse.json(
        { success: false, message: 'Invalid verification code.' }, 
        { status: 400 }
      );
    }
    
    // Mark OTP as verified
    console.log('✅ OTP verified, updating record...');
    otpRecord.verified = true;
    await otpRecord.save();
    
    // Get name from metadata or default to empty string
    const name = otpRecord.metadata?.name || '';
    
    // Hash password
    console.log('🔒 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    console.log('👤 Creating new user account...');
    const newUser = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      credentialsLinked: true,
      emailVerified: true
    });
    console.log('✅ User account created with ID:', newUser._id);
    
    // Delete all OTPs for this email with registration purpose
    console.log('🧹 Cleaning up used OTPs...');
    await OTP.deleteMany({ 
      email: email.toLowerCase(),
      purpose: 'registration'
    });
    
    console.log('🎉 Registration complete for:', email);
    
    // Return success response (excluding password)
    return NextResponse.json({
      success: true, 
      message: 'Email verified and account created successfully',
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('💥 Verify registration OTP error:', error);
    console.error('Error details:', {
      message: (error as Error).message,
      stack: (error as Error).stack,
      errorType: (error as Error).constructor?.name || 'UnknownError'
    });
    return NextResponse.json(
      { success: false, message: 'Failed to verify code' }, 
      { status: 500 }
    );
  }
} 