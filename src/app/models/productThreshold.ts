import mongoose from 'mongoose';

const productThresholdSchema = new mongoose.Schema({
  thresholdRandom: Number,
  period: String,
  threshold: String,
  feePerCubicMeterPerDay: Number
});

export default mongoose.models.productThreshold || mongoose.model('productThreshold', productThresholdSchema);