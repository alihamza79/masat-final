import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import OTP from '@/models/OTP';

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();
    
    // Validate input
    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: 'Email and verification code are required' }, 
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Find the latest OTP record for this email
    const otpRecord = await OTP.findOne({ 
      email: email.toLowerCase(), 
      purpose: 'set-password'
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
    
    // Return success with an auth token for password setting
    return NextResponse.json({
      success: true, 
      message: 'Verification successful',
      data: {
        // This token will be used to authenticate the password setting request
        // It's a simple implementation - in production, you might want to use JWT
        token: Buffer.from(`${email}:${otpRecord._id}:${Date.now()}`).toString('base64')
      }
    });
    
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to verify code' }, 
      { status: 500 }
    );
  }
} 