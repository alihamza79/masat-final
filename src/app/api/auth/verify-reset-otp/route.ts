import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import OTP from '@/models/OTP';

export async function POST(request: NextRequest) {
  try {
    // Parse request data based on content type
    let email, otp;
    
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      // Handle JSON data
      const body = await request.json();
      email = body.email;
      otp = body.otp;
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      // Handle form data
      const formData = await request.formData();
      email = formData.get('email')?.toString();
      otp = formData.get('otp')?.toString();
    } else {
      // Try to handle any other format
      const text = await request.text();
      try {
        // Try JSON parsing first
        const body = JSON.parse(text);
        email = body.email;
        otp = body.otp;
      } catch (e) {
        // Fall back to URL-encoded parsing
        const params = new URLSearchParams(text);
        email = params.get('email');
        otp = params.get('otp');
      }
    }
    
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
      purpose: 'reset-password'
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
    
    // Return success with an auth token for password resetting
    return NextResponse.json({
      success: true, 
      message: 'Verification successful',
      data: {
        token: Buffer.from(`${email}:${otpRecord._id}:${Date.now()}`).toString('base64')
      }
    });
    
  } catch (error) {
    console.error('Verify reset OTP error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to verify code' }, 
      { status: 500 }
    );
  }
} 