import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await connectToDatabase();
    
    // Use direct MongoDB update instead of Mongoose
    // This bypasses any schema validation issues
    const result = await User.collection.updateOne(
      { email: "hamzachaudhay79@gmail.com" },
      { $set: { credentialsLinked: true } }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found' }, 
        { status: 404 }
      );
    }
    
    // Fetch the updated user to verify
    const updatedUser = await User.findOne({ email: "hamzachaudhay79@gmail.com" });
    
    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: 'User found but could not be fetched after update' },
        { status: 500 }
      );
    }
    
    // Return success response
    return NextResponse.json({
      success: true, 
      message: `User updated successfully (${result.modifiedCount} documents modified)`,
      user: {
        email: updatedUser.email,
        googleLinked: updatedUser.googleLinked,
        credentialsLinked: updatedUser.credentialsLinked || 
          "Field may not be visible in response but should be set in database"
      },
      // Include raw document for debugging
      rawDocument: updatedUser.toObject ? updatedUser.toObject() : updatedUser
    });
    
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update user', error: String(error) }, 
      { status: 500 }
    );
  }
} 