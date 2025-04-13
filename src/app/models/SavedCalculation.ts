import mongoose, { Schema } from 'mongoose';

// Define the schema for saved calculations
const SavedCalculationSchema = new Schema({
  title: {
    type: String,
    required: function() {
      return !this.emagProduct; // Title is required only if not an eMAG product
    },
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    default: '/products/default.jpg'
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  emagProduct: {
    type: Object,
    default: null
  },
  calculatorState: {
    type: Object,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create the model if it doesn't exist
const SavedCalculation = mongoose.models.SavedCalculation || mongoose.model('SavedCalculation', SavedCalculationSchema);

export default SavedCalculation; 