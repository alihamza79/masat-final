import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  stripeSessionId?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeInvoiceId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  plan: string;
  billingCycle: 'monthly' | 'yearly';
  paymentMethod?: string;
  paymentMethodDetails?: any;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    stripeSessionId: {
      type: String,
      required: false,
      sparse: true,
      index: true,
    },
    stripeCustomerId: {
      type: String,
      index: true,
    },
    stripeSubscriptionId: {
      type: String,
      index: true,
    },
    stripeInvoiceId: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: 'usd',
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'succeeded', 'failed', 'refunded'],
      default: 'pending',
    },
    plan: {
      type: String,
      required: true,
    },
    billingCycle: {
      type: String,
      required: true,
      enum: ['monthly', 'yearly'],
    },
    paymentMethod: {
      type: String,
    },
    paymentMethodDetails: {
      type: Schema.Types.Mixed,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

// Create indexes for faster queries
PaymentSchema.index({ createdAt: -1 });
PaymentSchema.index({ updatedAt: -1 });

const Payment = mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment; 