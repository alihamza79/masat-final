import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { generatePresignedUrl } from '@/utils/s3';

// Set export configuration for Next.js
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Get environment variables
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'masat-dev-bucket';
const IS_LOCAL_ENV = process.env.NODE_ENV === 'development';

// Initialize the S3 client
const s3Client = new S3Client({
  region: AWS_REGION,
  // Use credentials only in local development environment
  credentials: IS_LOCAL_ENV && AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY 
    ? {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      }
    : undefined // When undefined, the SDK will use the IAM role
});

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get('prefix') || '';
    const maxResults = parseInt(searchParams.get('maxResults') || '20', 10);
    
    // List objects in the S3 bucket
    const command = new ListObjectsV2Command({
      Bucket: S3_BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: maxResults
    });
    
    const response = await s3Client.send(command);
    
    // Format the response data with presigned URLs
    const images = await Promise.all(
      (response.Contents || []).map(async (item) => {
        // Generate a presigned URL for each object
        const url = await generatePresignedUrl(item.Key || '');
        
        return {
          key: item.Key,
          size: item.Size,
          lastModified: item.LastModified,
          url: url // Use presigned URL instead of direct S3 URL
        };
      })
    );
    
    return NextResponse.json({
      success: true,
      message: `Found ${images.length} image(s)`,
      bucket: S3_BUCKET_NAME,
      prefix: prefix || 'root',
      totalCount: response.KeyCount || 0,
      isTruncated: response.IsTruncated || false,
      nextContinuationToken: response.NextContinuationToken,
      images,
      urlsExpire: 'in 1 hour'
    });
  } catch (error) {
    console.error('Error listing images:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to list images', 
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 