const mongoose = require('mongoose');

const offerProductSchema = new mongoose.Schema({
  product:      { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  enabled:      { type: Boolean, default: true },
  featured:     { type: Boolean, default: false },
  displayOrder: { type: Number, default: 0 },
}, { _id: false });

const offerSchema = new mongoose.Schema({
  title:         { type: String, required: true, trim: true },
  subtitle:      { type: String, default: '' },
  viewAllLink:   { type: String, default: '/search?sale=true' },
  startDate:     { type: Date, default: null },
  endDate:       { type: Date, default: null },
  showCountdown: { type: Boolean, default: true },
  autoExpire:    { type: Boolean, default: true },
  active:        { type: Boolean, default: true },
  products:      [offerProductSchema],

  // ── Promotional campaign banner (left card) ──────────────────────────────
  bannerImage:       { type: String, default: '' },
  bannerTitle:       { type: String, default: '' },
  bannerDescription: { type: String, default: '' },
  bannerCtaText:     { type: String, default: 'See More Product' },
  bannerCtaLink:     { type: String, default: '/' },
  bannerActive:      { type: Boolean, default: true },
}, { timestamps: true });

// Only one offer can be active as the "homepage" offer at a time — enforced by controller logic
offerSchema.index({ active: 1 });

module.exports = mongoose.model('Offer', offerSchema);
