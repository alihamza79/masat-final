import { NextRequest, NextResponse } from 'next/server';
import { deleteFileFromS3 } from '@/utils/s3';

// Set export configuration for Next.js
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Get the key from the request body
    const body = await request.json();
    const { key } = body;
    
    if (!key) {
      return NextResponse.json(
        { success: false, message: 'Image key is required' },
        { status: 400 }
      );
    }
    
    // Attempt to delete the file from S3
    const result = await deleteFileFromS3(key);
    
    if (result) {
      return NextResponse.json({
        success: true,
        message: 'File deleted successfully',
        key
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to delete file or file not eligible for deletion',
        key
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to delete file', 
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 