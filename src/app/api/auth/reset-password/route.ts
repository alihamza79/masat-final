import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/models/User';
import OTP from '@/models/OTP';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    // Parse request data based on content type
    let email, otp, password, token;
    
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      // Handle JSON data
      const body = await request.json();
      email = body.email;
      otp = body.otp;
      password = body.password;
      token = body.token;
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      // Handle form data
      const formData = await request.formData();
      email = formData.get('email')?.toString();
      otp = formData.get('otp')?.toString();
      password = formData.get('password')?.toString();
      token = formData.get('token')?.toString();
    } else {
      // Try to handle any other format
      const text = await request.text();
      try {
        // Try JSON parsing first
        const body = JSON.parse(text);
        email = body.email;
        otp = body.otp;
        password = body.password;
        token = body.token;
      } catch (e) {
        // Fall back to URL-encoded parsing
        const params = new URLSearchParams(text);
        email = params.get('email');
        otp = params.get('otp');
        password = params.get('password');
        token = params.get('token');
      }
    }
    
    // Validate input
    if (!email || !password || (!otp && !token)) {
      return NextResponse.json(
        { success: false, message: 'Email, password, and verification are required' }, 
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
    
    let otpRecord;
    
    // Verify either by direct OTP or token
    if (token) {
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
        otpRecord = await OTP.findOne({ 
          _id: new ObjectId(otpId),
          email: email.toLowerCase(),
          verified: true,
          purpose: 'reset-password'
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
    } else {
      // Direct OTP verification - find the latest OTP record
      otpRecord = await OTP.findOne({ 
        email: email.toLowerCase(), 
        otp,
        purpose: 'reset-password'
      }).sort({ createdAt: -1 });
      
      if (!otpRecord) {
        return NextResponse.json(
          { success: false, message: 'Invalid verification code. Please try again.' }, 
          { status: 403 }
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
      
      // Mark OTP as verified
      otpRecord.verified = true;
      await otpRecord.save();
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update user's password
    user.password = hashedPassword;
    
    // If the user doesn't have credentials linked yet, mark it now
    if (!user.credentialsLinked) {
      user.credentialsLinked = true;
    }
    
    await user.save();
    
    // Delete all OTP records for this email with reset-password purpose
    await OTP.deleteMany({ 
      email: email.toLowerCase(),
      purpose: 'reset-password'
    });
    
    // Return success response
    return NextResponse.json({
      success: true, 
      message: 'Password reset successfully'
    });
    
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to reset password' }, 
      { status: 500 }
    );
  }
} 