const mongoose = require('mongoose');

const mobileAssetSchema = new mongoose.Schema({
  screen:      { type: String, enum: ['onboarding', 'home'], required: true },
  slot:        { type: String, required: true },
  title:       { type: String, default: '' },
  description: { type: String, default: '' },
  imageUrl:    { type: String, required: true },
  order:       { type: Number, default: 0 },
  active:      { type: Boolean, default: true },
}, { timestamps: true });

mobileAssetSchema.index({ screen: 1, active: 1, order: 1 });

module.exports = mongoose.model('MobileAsset', mobileAssetSchema);
