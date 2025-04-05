import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' }, 
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Use direct MongoDB query instead of Mongoose to bypass schema limitations
    const user = await User.collection.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return NextResponse.json({
        success: true,
        exists: false,
        message: 'Email not registered'
      });
    }
    
    // Return raw values from the database document
    return NextResponse.json({
      success: true,
      exists: true,
      googleLinked: !!user.googleLinked, // Convert to boolean
      credentialsLinked: !!user.credentialsLinked, // Convert to boolean
      // Add debugging info
      debug: {
        hasCredentialsLinked: 'credentialsLinked' in user,
        credentialsLinkedValue: user.credentialsLinked,
        allFields: Object.keys(user)
      }
    });
    
  } catch (error) {
    console.error('Email check error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to check email status', error: String(error) }, 
      { status: 500 }
    );
  }
} 