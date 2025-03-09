import mongoose, { Schema, Document } from 'mongoose';

// Interface for Integration document
export interface IIntegration extends Document {
  accountName: string;
  username: string;
  password: string;
  region: string;
  createdAt: Date;
  updatedAt: Date;
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
    unique: true,
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
  }
}, {
  timestamps: true // Automatically manage createdAt and updatedAt fields
});

// Create and export the model
export default mongoose.models.Integration || mongoose.model<IIntegration>('Integration', IntegrationSchema); 