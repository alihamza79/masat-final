import mongoose, { Schema, Document, Types } from 'mongoose';

// Interface for Integration document
export interface IIntegration extends Document {
  userId: Types.ObjectId | string; // Link to the user who owns this integration
  accountName: string;
  username: string;
  password: string;
  region: string;
  accountType: string;
  createdAt: Date;
  updatedAt: Date;
  // New fields for tracking counts and last import times
  ordersCount: number;
  productOffersCount: number;
  lastOrdersImport: Date | null;
  lastProductOffersImport: Date | null;
  importStatus: 'idle' | 'importing' | 'loading' | 'completed' | 'success' | 'error';
  importError?: string;
}

// Integration schema
const IntegrationSchema = new Schema<IIntegration>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  accountName: {
    type: String,
    required: [true, 'Account name is required'],
    trim: true
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  region: {
    type: String,
    required: [true, 'Region is required'],
    enum: ['Romania', 'Bulgaria', 'Hungary']
  },
  accountType: {
    type: String,
    required: [true, 'Account type is required'],
    enum: ['FBE', 'Non-FBE'],
    default: 'Non-FBE'
  },
  // New fields with default values
  ordersCount: {
    type: Number,
    default: 0
  },
  productOffersCount: {
    type: Number,
    default: 0
  },
  lastOrdersImport: {
    type: Date,
    default: null
  },
  lastProductOffersImport: {
    type: Date,
    default: null
  },
  importStatus: {
    type: String,
    enum: ['idle', 'importing', 'loading', 'completed', 'success', 'error'],
    default: 'idle'
  },
  importError: {
    type: String,
    default: null
  }
}, {
  timestamps: true // Automatically manage createdAt and updatedAt fields
});

// Update the compound index to include userId, making it unique per user
IntegrationSchema.index({ userId: 1, username: 1, region: 1 }, { unique: true });

// Add a compound index for accountName to make it unique per user
IntegrationSchema.index({ userId: 1, accountName: 1 }, { unique: true });

// Create and export the model
export default mongoose.models.Integration || mongoose.model<IIntegration>('Integration', IntegrationSchema); 