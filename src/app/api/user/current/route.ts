import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

/**
 * GET endpoint to fetch the current user's ID from MongoDB
 * This is more reliable than the Next-Auth session ID which may vary
 */
export async function GET(request: NextRequest) {
  try {
    // Get the user's session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Connect to MongoDB
    await connectToDatabase();
    
    // Look up the user with this email address
    const email = session.user.email;
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'No email in session' },
        { status: 400 }
      );
    }
    
    const user = await User.findOne({ email }).select('_id name email');
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found in database' },
        { status: 404 }
      );
    }
    
    // Return the database user info
    return NextResponse.json({
      success: true,
      user: {
        id: user._id?.toString(),
        name: user.name,
        email: user.email
      }
    });
  } catch (error: any) {
    console.error('Error getting current user:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get current user' },
      { status: 500 }
    );
  }
} 