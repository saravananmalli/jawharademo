const mongoose = require('mongoose');

const CAMPAIGNS = [
  'Christmas', 'Valentines', 'Eid', 'Mothers Day', 'Wedding Season',
  'National Day', 'Ramadan', 'New Year', 'Limited Time Offer', 'Other',
];

const BANNER_TYPES = ['category', 'collection', 'brand', 'custom'];

const bannerSchema = new mongoose.Schema({
  title:            { type: String, required: true, trim: true },
  description:      { type: String, default: '' },
  imageUrl:         { type: String, required: true },
  placement:        { type: String, enum: ['hero', 'offer'], default: 'hero' },
  bannerType:       { type: String, enum: BANNER_TYPES, default: 'custom' },
  campaign:         { type: String, enum: [...CAMPAIGNS, ''], default: '' },
  linkedCategory:   { type: String, default: '' },
  linkedCollection: { type: String, default: '' },
  linkedBrand:      { type: String, default: '' },
  redirectUrl:      { type: String, default: '' },
  startDate:        { type: Date, default: null },
  endDate:          { type: Date, default: null },
  active:           { type: Boolean, default: true },
  order:            { type: Number, default: 1 },
}, { timestamps: true });

// Index for fast active-banner queries
bannerSchema.index({ active: 1, order: 1 });

module.exports = mongoose.model('Banner', bannerSchema);
