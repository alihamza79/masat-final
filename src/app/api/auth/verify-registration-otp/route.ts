import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import OTP from '@/models/OTP';
import bcrypt from 'bcryptjs';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const { email, otp, password } = await request.json();
    
    // Validate input
    if (!email || !otp || !password) {
      return NextResponse.json(
        { success: false, message: 'Email, verification code, and password are required' }, 
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
    
    // Find the latest OTP record for this email
    const otpRecord = await OTP.findOne({ 
      email: email.toLowerCase(), 
      purpose: 'registration'
    }).sort({ createdAt: -1 });
    
    if (!otpRecord) {
      return NextResponse.json(
        { success: false, message: 'No verification code found. Please request a new one.' }, 
        { status: 404 }
      );
    }
    
    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      return NextResponse.json(
        { success: false, message: 'Verification code has expired. Please request a new one.' }, 
        { status: 400 }
      );
    }
    
    // Check if OTP is already verified
    if (otpRecord.verified) {
      return NextResponse.json(
        { success: false, message: 'This verification code has already been used.' }, 
        { status: 400 }
      );
    }
    
    // Verify OTP
    if (otpRecord.otp !== otp) {
      return NextResponse.json(
        { success: false, message: 'Invalid verification code.' }, 
        { status: 400 }
      );
    }
    
    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();
    
    // Get name from metadata or default to empty string
    const name = otpRecord.metadata?.name || '';
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      credentialsLinked: true,
      emailVerified: true,
      subscriptionStatus: null,
      subscriptionPlan: 'free',
      subscriptionId: null,
      subscriptionCreatedAt: null,
      subscriptionExpiresAt: null
    });
    
    // Delete all OTPs for this email with registration purpose
    await OTP.deleteMany({ 
      email: email.toLowerCase(),
      purpose: 'registration'
    });
    
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
    console.error('Verify registration OTP error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to verify code' }, 
      { status: 500 }
    );
  }
} 