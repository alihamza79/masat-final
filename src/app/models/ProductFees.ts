// app/models/ProductFees.ts
import mongoose from 'mongoose';

const ProductFeesSchema = new mongoose.Schema({
    plcName: String,
    plcCode: String,
    weightLimit: String,
    weight: String,
    girth: Number,
    localOrderFee: Number,
    localReturnFee: Number,
    crossBorderOrderFee: Number,
    crossBorderReturnFee: Number,
    removalFee: Number,
    disposalFee: Number
});

export default mongoose.models.ProductFees || mongoose.model('ProductFees', ProductFeesSchema);