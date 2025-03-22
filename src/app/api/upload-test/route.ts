import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed.' 
        },
        { status: 400 }
      );
    }
    
    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'File too large. Maximum size is 5MB.' 
        },
        { status: 400 }
      );
    }
    
    // Generate a unique file name
    const fileExtension = file.type.split('/')[1];
    const fileName = `${uuidv4()}.${fileExtension}`;
    
    // Get file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Upload to S3 - Note: We're only interacting with our specific bucket (masat-dev-bucket)
    // This requires only s3:PutObject permission on this specific bucket, not ListAllMyBuckets
    const s3Key = `test-uploads/${fileName}`;
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: file.type,
    });
    
    const s3Response = await s3Client.send(command);
    
    // Generate a presigned URL for viewing the file (valid for 1 hour)
    const presignedUrl = await generatePresignedUrl(s3Key);
    
    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      fileName,
      fileUrl: presignedUrl, // Use presigned URL instead of direct S3 URL
      s3Key,
      fileSize: file.size,
      fileType: file.type,
      environment: IS_LOCAL_ENV ? 'development' : 'production',
      usingCredentials: !!AWS_ACCESS_KEY_ID && !!AWS_SECRET_ACCESS_KEY,
      urlExpires: 'in 1 hour'
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to upload file',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 