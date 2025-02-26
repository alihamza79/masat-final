import mongoose from 'mongoose';

const productMaxWeightSchema = new mongoose.Schema({
  plcName: String,
  minWeight: Number,
  maxWeight: Number,
  localOrderFee: Number
});

export default mongoose.models.productMaxWeight || mongoose.model('productMaxWeight', productMaxWeightSchema);
