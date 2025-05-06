import { NextRequest, NextResponse } from 'next/server';
import { getImageUrl } from '@/utils/s3';

/**
 * GET endpoint to fetch and serve images from S3
 * Required query parameter: path
 * This proxies S3 images through our application
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const path = searchParams.get('path');
    
    if (!path) {
      return NextResponse.json({ success: false, error: 'Image path is required' }, { status: 400 });
    }
    
    // Generate a presigned URL for the image
    const imageUrl = await getImageUrl(path);
    
    if (!imageUrl) {
      return NextResponse.json({ success: false, error: 'Invalid image path' }, { status: 400 });
    }
    
    // Redirect to the presigned URL
    return NextResponse.redirect(imageUrl);
  } catch (error: any) {
    console.error('Error fetching image:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch image' },
      { status: 500 }
    );
  }
} 