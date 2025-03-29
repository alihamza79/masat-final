import mongoose, { Schema, Document } from 'mongoose';

// Interface for Integration document
export interface IIntegration extends Document {
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
  accountName: {
    type: String,
    required: [true, 'Account name is required'],
    unique: true,
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

// Add compound index for username and region
IntegrationSchema.index({ username: 1, region: 1 }, { unique: true });

// Create and export the model
export default mongoose.models.Integration || mongoose.model<IIntegration>('Integration', IntegrationSchema); 