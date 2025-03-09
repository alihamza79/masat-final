/**
 * Encryption Utility
 * Provides functions for encrypting and decrypting sensitive data
 * 
 * Note: In a production environment, use a more secure approach with proper key management
 */

import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm' as const;
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * Simple encryption function (for demonstration purposes)
 * In production, use a proper encryption library with secure key management
 * 
 * @param text The text to encrypt
 * @returns Encrypted text
 */
export function encrypt(text: string): string {
  try {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('Encryption key is not set in environment variables');
    }

    // Convert encryption key from hex to buffer and ensure it's the right size
    const keyBuffer = Buffer.from(key, 'hex');
    if (keyBuffer.length !== 32) {
      throw new Error(`Invalid encryption key length: ${keyBuffer.length} bytes. Expected: 32 bytes`);
    }

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
    console.error('Encryption error:', error);
    throw new Error(`Failed to encrypt data: ${error.message}`);
  }
}

/**
 * Simple decryption function (for demonstration purposes)
 * In production, use a proper decryption method with secure key management
 * 
 * @param encryptedData The encrypted data to decrypt
 * @returns Decrypted text
 */
export function decrypt(encryptedData: string): string {
  try {
    // Split the encrypted data into components
    const [ivHex, authTagHex, encryptedText] = encryptedData.split(':');
    
    // Convert components from hex to buffers
    const keyBuffer = Buffer.from(process.env.ENCRYPTION_KEY || '', 'hex');
    if (keyBuffer.length !== 32) {
      throw new Error('Invalid encryption key length');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer as Buffer, iv as Buffer);
    decipher.setAuthTag(authTag);
    
    // Decrypt the text
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

export default { encrypt, decrypt }; 