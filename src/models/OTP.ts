import mongoose, { Schema, Document } from 'mongoose';

export interface IOTP extends Document {
  email: string;
  otp: string;
  createdAt: Date;
  expiresAt: Date;
  verified: boolean;
  purpose: string;
  metadata?: Record<string, any>;
}

const OTPSchema = new Schema<IOTP>(
  {
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
      required: true,
      enum: ['registration', 'set-password', 'reset-password'],
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Set TTL index on expiresAt field to automatically remove expired records
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Create and export the OTP model
const OTP = mongoose.models.OTP || mongoose.model<IOTP>('OTP', OTPSchema);

export default OTP; 