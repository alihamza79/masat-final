import mongoose, { Schema } from 'mongoose';

// Define the schema for saved calculations
const SavedCalculationSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  calculatorState: {
    type: Object,
    required: true
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
  }
}, {
  timestamps: true
});

// Create the model if it doesn't exist
const SavedCalculation = mongoose.models.SavedCalculation || mongoose.model('SavedCalculation', SavedCalculationSchema);

export default SavedCalculation; 