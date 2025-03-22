import { NextResponse } from 'next/server';
import { S3Client, HeadBucketCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

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

export async function GET() {
  try {
    // First check if the bucket exists using HeadBucket (doesn't require ListAllMyBuckets permission)
    try {
      const headBucketCommand = new HeadBucketCommand({ Bucket: S3_BUCKET_NAME });
      await s3Client.send(headBucketCommand);
    } catch (headError) {
      console.error('Error checking bucket:', headError);
      return NextResponse.json({
        success: false,
        message: 'Failed to access the S3 bucket',
        error: headError instanceof Error ? headError.message : String(headError),
        bucket: S3_BUCKET_NAME
      }, { status: 500 });
    }

    // If we got here, the bucket exists. Let's list up to 5 objects to further validate access
    const listCommand = new ListObjectsV2Command({
      Bucket: S3_BUCKET_NAME,
      MaxKeys: 5  // Just get a few objects to verify access
    });
    
    const listResponse = await s3Client.send(listCommand);

    return NextResponse.json({
      success: true,
      message: `Successfully connected to S3 bucket: ${S3_BUCKET_NAME}`,
      environment: IS_LOCAL_ENV ? 'development' : 'production',
      usingCredentials: !!AWS_ACCESS_KEY_ID && !!AWS_SECRET_ACCESS_KEY,
      bucket: S3_BUCKET_NAME,
      objectCount: listResponse.KeyCount || 0,
      objects: listResponse.Contents?.map(obj => ({ 
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified
      })) || []
    });
  } catch (error) {
    console.error('Error connecting to S3:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to connect to S3', 
        error: error instanceof Error ? error.message : String(error),
        bucket: S3_BUCKET_NAME
      },
      { status: 500 }
    );
  }
} 