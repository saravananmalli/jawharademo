const mongoose = require('mongoose');

const mobileAssetSchema = new mongoose.Schema({
  screen:      { type: String, enum: ['onboarding', 'home', 'dashboard'], required: true },
  slot:        { type: String, default: '' },
  section:     { type: String, default: '' },
  title:       { type: String, default: '' },
  subtitle:    { type: String, default: '' },
  description: { type: String, default: '' },
  imageUrl:    { type: String, default: '' },
  ctaText:     { type: String, default: '' },
  ctaLink:     { type: String, default: '' },
  badge:       { type: String, default: '' },
  order:       { type: Number, default: 0 },
  active:      { type: Boolean, default: true },
  // Optional: links this asset back to a Product document (used by Most Loved suggestions)
  productId:   { type: String, default: '' },
}, { timestamps: true });

mobileAssetSchema.index({ screen: 1, active: 1, order: 1 });
mobileAssetSchema.index({ screen: 1, section: 1, order: 1 });

module.exports = mongoose.model('MobileAsset', mobileAssetSchema);
