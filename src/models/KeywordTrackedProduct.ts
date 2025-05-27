import mongoose, { Schema, Document, Types } from 'mongoose';

// Interface for KeywordTrackedProduct document
export interface IKeywordTrackedProduct extends Document {
  userId: Types.ObjectId; // Link to the user who created this tracking entry
  productId: string; // eMAG Product Offer ID or internal product ID
  productName: string;
  productImage?: string;
  productSKU?: string; // part_number
  productPNK?: string; // part_number_key
  keywords: string[]; // Array of keywords being tracked
  organicTop10: number; // Count of keywords ranking in organic top 10
  organicTop50: number; // Count of keywords ranking in organic top 50
  sponsoredTop10: number; // Count of keywords ranking in sponsored top 10
  sponsoredTop50: number; // Count of keywords ranking in sponsored top 50
  createdAt: Date;
  updatedAt: Date;
}

// KeywordTrackedProduct schema
const KeywordTrackedProductSchema = new Schema<IKeywordTrackedProduct>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  productId: {
    type: String,
    required: [true, 'Product ID is required'],
    trim: true
  },
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  productImage: {
    type: String,
    default: null
  },
  productSKU: {
    type: String,
    default: null,
    trim: true
  },
  productPNK: {
    type: String,
    default: null,
    trim: true
  },
  keywords: {
    type: [String],
    required: [true, 'Keywords array is required'],
    validate: {
      validator: function(keywords: string[]) {
        return keywords.length > 0;
      },
      message: 'At least one keyword is required'
    }
  },
  organicTop10: {
    type: Number,
    default: 0,
    min: 0
  },
  organicTop50: {
    type: Number,
    default: 0,
    min: 0
  },
  sponsoredTop10: {
    type: Number,
    default: 0,
    min: 0
  },
  sponsoredTop50: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true // Automatically manage createdAt and updatedAt fields
});

// Create a compound index to prevent duplicate tracking of the same product by the same user
KeywordTrackedProductSchema.index({ userId: 1, productId: 1 }, { unique: true });

// Create and export the model
export default mongoose.models.KeywordTrackedProduct || mongoose.model<IKeywordTrackedProduct>('KeywordTrackedProduct', KeywordTrackedProductSchema); 