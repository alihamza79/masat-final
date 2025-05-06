import mongoose, { Schema, Document, Types } from 'mongoose';

// Interface for Expense document
export interface IExpense extends Document {
  userId: Types.ObjectId; // Link to the user who created this expense - enforcing ObjectId type
  type: 'one-time' | 'monthly' | 'annually' | 'cogs';
  description: string;
  amount: number;
  date: Date;
  isRecurring?: boolean;
  // Optional fields for COGS (Cost of Goods Sold) expenses
  product?: {
    emagProductOfferId?: string;
    name: string;
    part_number?: string; // SKU
    part_number_key?: string; // PNK
    image?: string;
    unitsCount: number;
    costPerUnit: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Expense schema
const ExpenseSchema = new Schema<IExpense>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  type: {
    type: String,
    required: [true, 'Expense type is required'],
    enum: ['one-time', 'monthly', 'annually', 'cogs'],
  },
  description: {
    type: String,
    required: function(this: IExpense) {
      // Description is required for all expense types except COGS
      return this.type !== 'cogs';
    },
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  // Product data for COGS type expenses
  product: {
    type: {
      emagProductOfferId: String,
      name: {
        type: String,
        required: function(this: any) {
          return !!this.product;
        }
      },
      part_number: String, // SKU
      part_number_key: String, // PNK
      image: String,
      unitsCount: {
        type: Number,
        required: function(this: any) {
          return !!this.product;
        },
        min: 0
      },
      costPerUnit: {
        type: Number,
        required: function(this: any) {
          return !!this.product;
        },
        min: 0
      }
    },
    required: function(this: IExpense) {
      return this.type === 'cogs';
    }
  }
}, {
  timestamps: true // Automatically manage createdAt and updatedAt fields
});

// Create and export the model
export default mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema); 