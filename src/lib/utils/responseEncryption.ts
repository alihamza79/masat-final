/**
 * Response Encryption Utility
 * Provides functions for encrypting and decrypting API response data
 */

import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm' as const;
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * Get the response encryption key
 */
function getResponseEncryptionKey(): Buffer {
  const key = process.env.NEXT_PUBLIC_RESPONSE_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('Response encryption key is not set in environment variables');
  }

  // Decode base64 key
  const keyBuffer = Buffer.from(key, 'base64');
  if (keyBuffer.length !== 32) {
    throw new Error(`Invalid response encryption key length: ${keyBuffer.length} bytes. Expected: 32 bytes`);
  }
  return keyBuffer;
}

/**
 * Encrypt response data
 * @param text The text to encrypt
 * @returns Encrypted text
 */
export function encryptResponse(text: string): string {
  try {
    const keyBuffer = getResponseEncryptionKey();

    // Generate IV and create cipher
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);
    
    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get the auth tag
    const authTag = cipher.getAuthTag();

    // Combine IV, auth tag, and encrypted data
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error: any) {
    console.error('Response encryption error:', error);
    throw new Error(`Failed to encrypt response data: ${error.message}`);
  }
}

/**
 * Decrypt response data
 * @param encryptedData The encrypted data to decrypt
 * @returns Decrypted text
 */
export function decryptResponse(encryptedData: string): string {
  try {
    // Split the encrypted data into components
    const [ivHex, authTagHex, encryptedText] = encryptedData.split(':');
    
    // Get the response encryption key
    const keyBuffer = getResponseEncryptionKey();

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt the text
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Response decryption error:', error);
    throw new Error('Failed to decrypt response data');
  }
}

export default { encryptResponse, decryptResponse }; 