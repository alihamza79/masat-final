import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getImageUrl } from '@/utils/s3';

/**
 * This API route provides fresh session data with presigned URLs for S3 images
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }
    
    // Convert image path to presigned URL if needed, with better error handling
    if (session.user?.image) {
      try {
        const imageUrl = await getImageUrl(session.user.image);
        if (imageUrl) {
          session.user.image = imageUrl;
        }
      } catch (imageError) {
        console.error('Error getting image URL, using original image path:', imageError);
        // Keep the original image path, don't modify it
      }
    }
    
    return NextResponse.json({
      success: true,
      session
    });
  } catch (error: any) {
    console.error('Error getting session:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to get session'
    }, { status: 500 });
  }
}

/**
 * POST handler for session updates from next-auth
 * This is required for the updateSession() function to work
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    return NextResponse.json({
      success: true,
      session
    });
  } catch (error: any) {
    console.error('Error updating session:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to update session'
    }, { status: 500 });
  }
} 