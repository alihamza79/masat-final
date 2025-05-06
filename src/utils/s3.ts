import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

// Get environment variables
const AWS_REGION = process.env.AWS_REGION || 'eu-central-1';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'masat-dev-bucket';
const IS_LOCAL_ENV = process.env.NODE_ENV === 'development';

/**
 * S3 Client Configuration
 * 
 * Note: Our application only needs specific permissions for the masat-dev-bucket:
 * - s3:PutObject (to upload files)
 * - s3:GetObject (to retrieve files)
 * - s3:ListObjects (to list files in the bucket)
 * - s3:DeleteObject (to delete files)
 * 
 * We DO NOT need broader permissions like:
 * - s3:ListAllMyBuckets
 * - s3:CreateBucket
 * - s3:DeleteBucket
 */

// Create configuration for S3 client
const s3Config: { region: string; credentials?: { accessKeyId: string; secretAccessKey: string } } = {
  region: AWS_REGION,
  // Important: In production/ECS environment, the IAM task role will be used automatically
  // Only provide explicit credentials in local development
};

// Add explicit credentials only in local development
if (IS_LOCAL_ENV && AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
  s3Config.credentials = {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  };
}

// Initialize the S3 client with the configuration
const s3Client = new S3Client(s3Config);

/**
 * Upload a file to S3
 * @param file - File data as Buffer or Blob
 * @param contentType - MIME type of the file
 * @param originalFilename - Original filename for reference
 * @returns The S3 key and presigned URL for the uploaded file
 */
export async function uploadFileToS3(file: Buffer | Blob, contentType: string, originalFilename: string): Promise<{ key: string; url: string }> {
  try {
    // Generate a unique filename to avoid collisions
    const fileExtension = originalFilename.split('.').pop() || '';
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;
    const key = `products/${uniqueFilename}`;

    // Convert Blob to Buffer if needed
    let fileBuffer: Buffer;
    if (file instanceof Blob) {
      fileBuffer = Buffer.from(await file.arrayBuffer());
    } else {
      fileBuffer = file;
    }

    // Upload the file to S3
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    });

    await s3Client.send(command);

    // Generate a presigned URL for viewing the file
    const url = await generatePresignedUrl(key);
    
    return { key, url };
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw error;
  }
}

/**
 * Generate a presigned URL for accessing a private object in S3
 * @param key - The S3 object key
 * @param expiresIn - How long the URL should be valid for (in seconds)
 * @returns A presigned URL that grants temporary access to the object
 */
export async function generatePresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  try {
    // Normalize the key by removing any leading slash
    const normalizedKey = key.startsWith('/') ? key.substring(1) : key;
    
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: normalizedKey,
    });
    
    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw error;
  }
}

/**
 * Delete a file from S3
 * @param key - The S3 object key
 * @returns True if deletion was successful, false otherwise
 */
export async function deleteFileFromS3(key: string): Promise<boolean> {
  try {
    // Normalize the key by removing any leading slash
    const normalizedKey = key.startsWith('/') ? key.substring(1) : key;
    
    // Only attempt to delete if the key is a valid S3 path
    // This prevents accidental deletion of default images
    if (!normalizedKey || 
        normalizedKey === 'products/default.jpg' || 
        key === '/products/default.jpg' || 
        !normalizedKey.startsWith('products/')) {
      console.log('Skipping deletion of non-S3 or default image:', key);
      return false;
    }
    
    // Use the normalized key for S3 operations
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: normalizedKey,
    });
    
    await s3Client.send(command);
    console.log('Successfully deleted file from S3:', normalizedKey);
    return true;
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    return false;
  }
}

/**
 * Get a presigned URL for an image if it's a valid S3 path
 * @param imagePath - The image path or S3 key
 * @returns A presigned URL or null if the path is not an S3 path
 */
export async function getImageUrl(imagePath: string): Promise<string | null> {
  try {
    // Check if this is already a full URL
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    // Check if this is a valid S3 path
    if (!imagePath || !imagePath.startsWith('products/')) {
      return null;
    }

    // Generate a presigned URL
    return await generatePresignedUrl(imagePath);
  } catch (error) {
    console.error('Error getting image URL:', error);
    return null;
  }
} 