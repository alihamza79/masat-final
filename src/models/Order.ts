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
  vendor_name?: string;
  type?: number;
  parent_id?: any;
  modified?: string;
  payment_status?: number;
  shipping_tax?: number;
  shipping_tax_voucher_split?: any[];
  vouchers?: any[];
  proforms?: any[];
  attachments?: any[];
  cashed_co?: number;
  cashed_cod?: number;
  cancellation_request?: any;
  has_editable_products?: number;
  refunded_amount?: string;
  is_complete?: number;
  reason_cancellation?: any;
  refund_status?: any;
  maximum_date_for_shipment?: string;
  late_shipment?: number;
  flags?: any[];
  emag_club?: number;
  finalization_date?: string;
  enforced_vendor_courier_accounts?: any;
  weekend_delivery?: number;
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
  vendor_name: String,
  type: Number,
  parent_id: Schema.Types.Mixed,
  modified: String,
  payment_status: Number,
  shipping_tax: Number,
  shipping_tax_voucher_split: [Schema.Types.Mixed],
  vouchers: [Schema.Types.Mixed],
  proforms: [Schema.Types.Mixed],
  attachments: [Schema.Types.Mixed],
  cashed_co: Number,
  cashed_cod: Number,
  cancellation_request: Schema.Types.Mixed,
  has_editable_products: Number,
  refunded_amount: String,
  is_complete: Number,
  reason_cancellation: Schema.Types.Mixed,
  refund_status: Schema.Types.Mixed,
  maximum_date_for_shipment: String,
  late_shipment: Number,
  flags: [Schema.Types.Mixed],
  emag_club: Number,
  finalization_date: String,
  enforced_vendor_courier_accounts: Schema.Types.Mixed,
  weekend_delivery: Number
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
