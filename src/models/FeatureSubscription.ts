import mongoose, { Schema, Document } from 'mongoose';

export interface IFeatureSubscription extends Document {
  featureId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const FeatureSubscriptionSchema: Schema = new Schema({
  featureId: { 
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Feature'
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  createdAt: { type: Date, default: Date.now }
});

// Add a compound index to prevent duplicate subscriptions
FeatureSubscriptionSchema.index({ featureId: 1, userId: 1 }, { unique: true });

// Use existing model if it exists or create a new one
const FeatureSubscription = mongoose.models.FeatureSubscription || 
  mongoose.model<IFeatureSubscription>('FeatureSubscription', FeatureSubscriptionSchema);

export default FeatureSubscription; 