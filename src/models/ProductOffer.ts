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
  // Explicitly defined fields from the eMAG API
  attachments?: any[];
  auto_translated?: number;
  availability?: any[];
  barcode?: any[];
  best_offer_recommended_price?: number;
  best_offer_sale_price?: number;
  brand?: string;
  brand_name?: string;
  buy_button_rank?: number;
  category_id?: number;
  commission?: number;
  content_details?: any;
  currency?: string;
  currency_type?: string;
  description?: string;
  ean?: string[];
  eu_representative?: boolean;
  family?: any;
  genius_eligibility?: number;
  genius_eligibility_type?: number;
  handling_time?: any[];
  has_smart_deals_badge?: boolean;
  id?: number;
  images?: any[];
  manufacturer?: boolean;
  max_sale_price?: number;
  min_sale_price?: number;
  name?: string;
  number_of_offers?: number;
  offer_details?: any;
  offer_price_other_currency?: any;
  offer_properties?: any[];
  offer_validation_status?: any;
  ownership?: boolean;
  part_number?: string;
  part_number_key?: string;
  recycleWarranties?: number;
  rrp_guidelines?: string;
  safety_information?: string;
  start_date?: any[];
  start_date_other_currency?: any[];
  stock?: any[];
  translation_validation_status?: any[];
  url?: string;
  validation_status?: any[];
  vat_id?: number;
  vendor_category_id?: any;
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
  // Explicitly defined fields from the eMAG API
  attachments: [Schema.Types.Mixed],
  auto_translated: Number,
  availability: [Schema.Types.Mixed],
  barcode: [Schema.Types.Mixed],
  best_offer_recommended_price: Number,
  best_offer_sale_price: Number,
  brand: String,
  brand_name: String,
  buy_button_rank: Number,
  category_id: Number,
  commission: Number,
  content_details: Schema.Types.Mixed,
  currency: String,
  currency_type: String,
  description: String,
  ean: [String],
  eu_representative: Boolean,
  family: Schema.Types.Mixed,
  genius_eligibility: Number,
  genius_eligibility_type: Number,
  handling_time: [Schema.Types.Mixed],
  has_smart_deals_badge: Boolean,
  id: Number,
  images: [Schema.Types.Mixed],
  manufacturer: Boolean,
  max_sale_price: Number,
  min_sale_price: Number,
  name: String,
  number_of_offers: Number,
  offer_details: Schema.Types.Mixed,
  offer_price_other_currency: Schema.Types.Mixed,
  offer_properties: [Schema.Types.Mixed],
  offer_validation_status: Schema.Types.Mixed,
  ownership: Boolean,
  part_number: String,
  part_number_key: String,
  recycleWarranties: Number,
  rrp_guidelines: String,
  safety_information: String,
  start_date: [Schema.Types.Mixed],
  start_date_other_currency: [Schema.Types.Mixed],
  stock: [Schema.Types.Mixed],
  translation_validation_status: [Schema.Types.Mixed],
  url: String,
  validation_status: [Schema.Types.Mixed],
  vat_id: Number,
  vendor_category_id: Schema.Types.Mixed
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
