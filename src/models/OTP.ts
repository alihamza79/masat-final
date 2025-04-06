import mongoose, { Schema, Document } from 'mongoose';

export interface IOTP extends Document {
  email: string;
  otp: string;
  createdAt: Date;
  expiresAt: Date;
  verified: boolean;
  purpose: string;
}

const OTPSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  purpose: {
    type: String,
    enum: ['set-password', 'reset-password'],
    default: 'set-password',
  },
});

// Set TTL index on expiresAt field to automatically remove expired records
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Create or retrieve the model
export default mongoose.models.OTP || mongoose.model<IOTP>('OTP', OTPSchema); 