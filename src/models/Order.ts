import mongoose, { Schema, Document, Types } from 'mongoose';
import { IIntegration } from './Integration';

// Interface for Order document
export interface IOrder extends Document {
  integrationId: Types.ObjectId | IIntegration;
  emagOrderId: number;
  status: number;
  payment_mode_id: number;
  total_amount: number;
  created: string;
  details: any[];
  // Additional fields from the eMAG API
  customer?: any;
  date?: string;
  delivery_mode?: string;
  payment_mode?: string;
  products?: any[];
  // Any other fields from the eMAG API
  [key: string]: any;
}

// Order schema
const OrderSchema = new Schema<IOrder>({
  integrationId: {
    type: Schema.Types.ObjectId,
    ref: 'Integration',
    required: [true, 'Integration ID is required']
  },
  emagOrderId: {
    type: Number,
    required: [true, 'eMAG Order ID is required']
  },
  status: {
    type: Number,
    required: [true, 'Status is required']
  },
  payment_mode_id: Number,
  total_amount: Number,
  created: String,
  details: [{
    type: Schema.Types.Mixed
  }],
  // Store the entire eMAG order object as it comes from the API
  // We define key fields above for querying/indexing, but store everything
  customer: Schema.Types.Mixed,
  date: String,
  delivery_mode: String,
  payment_mode: String,
  products: [Schema.Types.Mixed],
  // Additional fields will be stored in the document
}, {
  timestamps: true, // Automatically manage createdAt and updatedAt fields
  strict: false // Allow storing additional fields not defined in the schema
});

// Add compound index for integrationId and emagOrderId
OrderSchema.index({ integrationId: 1, emagOrderId: 1 }, { unique: true });
// Add index for status for easy filtering
OrderSchema.index({ status: 1 });
// Add index for date for sorting
OrderSchema.index({ date: 1 });

// Create and export the model
export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
