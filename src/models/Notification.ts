import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: string;
  referenceId?: mongoose.Types.ObjectId;
  referenceType?: string;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['feature_update', 'feature_status_change', 'system', 'other']
  },
  referenceId: { 
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  referenceType: {
    type: String,
    required: false
  },
  read: { 
    type: Boolean, 
    default: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Add index for faster queries
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

// Use existing model if it exists or create a new one
const Notification = mongoose.models.Notification || 
  mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification; 