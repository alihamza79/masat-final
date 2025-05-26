import mongoose, { Schema, Document } from 'mongoose';

export interface IFeature extends Document {
  subject: string;
  body: string;
  status: 'Proposed' | 'Development';
  userId: mongoose.Types.ObjectId;
  createdBy: string;
  voteCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const FeatureSchema: Schema = new Schema({
  subject: { type: String, required: true },
  body: { type: String, required: true },
  status: { 
    type: String, 
    required: true,
    enum: ['Proposed', 'Development'],
    default: 'Proposed'
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  createdBy: { type: String, required: true },
  voteCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt timestamp before saving
FeatureSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Safe model creation - check if models object exists
let Feature: mongoose.Model<IFeature>;

try {
  // Try to get existing model
  Feature = mongoose.model<IFeature>('Feature');
} catch (error) {
  // Model doesn't exist, create it
  Feature = mongoose.model<IFeature>('Feature', FeatureSchema);
}

export default Feature; 