import mongoose, { Document, Model, Schema } from 'mongoose';

// Define the Company interface
export interface ICompany extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  taxId?: string;
  registrationNumber?: string;
  address?: string;
  town?: string;
  country?: string;
  taxRate?: number;
  isVatPayer?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Define the Company schema
const CompanySchema = new Schema<ICompany>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    taxId: {
      type: String,
      trim: true,
    },
    registrationNumber: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    town: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    taxRate: {
      type: Number,
      default: 0,
    },
    isVatPayer: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create and export the Company model
const Company: Model<ICompany> = mongoose.models.Company || mongoose.model<ICompany>('Company', CompanySchema);

export default Company; 