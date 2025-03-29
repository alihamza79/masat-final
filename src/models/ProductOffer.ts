import mongoose, { Schema, Document, Types } from 'mongoose';
import { IIntegration } from './Integration';

// Interface for ProductOffer document
export interface IProductOffer extends Document {
  integrationId: Types.ObjectId | IIntegration;
  emagProductOfferId: number;
  status: number;
  sale_price: number;
  recommended_price: number;
  general_stock: number;
  estimated_stock: number;
  characteristics: Array<{ id: number; value: string }>;
  warranty: number;
  // Additional fields from the eMAG API
  name?: string;
  brand?: string;
  part_number?: string;
  // Any other fields from the eMAG API
  [key: string]: any;
}

// ProductOffer schema
const ProductOfferSchema = new Schema<IProductOffer>({
  integrationId: {
    type: Schema.Types.ObjectId,
    ref: 'Integration',
    required: [true, 'Integration ID is required']
  },
  emagProductOfferId: {
    type: Number,
    required: [true, 'eMAG Product Offer ID is required']
  },
  status: {
    type: Number,
    required: [true, 'Status is required']
  },
  sale_price: Number,
  recommended_price: Number,
  general_stock: Number,
  estimated_stock: Number,
  characteristics: [{
    id: Number,
    value: String
  }],
  warranty: Number,
  // Additional fields for easier querying/access
  name: String,
  brand: String,
  part_number: String,
  // Store the entire eMAG product offer object as it comes from the API
}, {
  timestamps: true, // Automatically manage createdAt and updatedAt fields
  strict: false // Allow storing additional fields not defined in the schema
});

// Add compound index for integrationId and emagProductOfferId
ProductOfferSchema.index({ integrationId: 1, emagProductOfferId: 1 }, { unique: true });
// Add index for status for easy filtering
ProductOfferSchema.index({ status: 1 });
// Add index for part_number for easy searching
ProductOfferSchema.index({ part_number: 1 });
// Add text index for name to enable text search
ProductOfferSchema.index({ name: 'text', brand: 'text', part_number: 'text' });

// Create and export the model
export default mongoose.models.ProductOffer || mongoose.model<IProductOffer>('ProductOffer', ProductOfferSchema);
