const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true },
  subcategory: String,
  description: { type: String, default: '' },
  price: { type: Number, required: true },
  originalPrice: Number,
  discount: { type: Number, default: 0 },
  images: [String],
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  inStock: { type: Boolean, default: true },
  badge: String,
  deliveryDate: String,
  weight: Number,
  // Single-value legacy fields (kept for backwards-compat + filter queries)
  metal: String,
  metalKt: String,
  stone: String,
  // Multi-value fields written by the admin form
  metals: [String],
  stones: [String],
  diamondClarity: String,
  diamondColor:   String,
  diamondCt:      Number,
  brand: { type: String, default: '' },
  collection: [String],
  fulfilledBy: String,
  arrivesBy: String,
  tags: [String],
  forWho: [String],
  priceRange: String,
  certified: { type: Boolean, default: false },
  sizes: [String],
  designCode: String,
  // Frontend filter mapping — written by admin form, read by Category page matchesFilter
  featured: [String],
  styles:   [String],
  flags:    [String],
  // SEO
  slug:           { type: String, default: '' },
  seoTitle:       { type: String, default: '' },
  seoDescription: { type: String, default: '' },
}, { timestamps: true, suppressReservedKeysWarning: true });

productSchema.index({ name: 'text', description: 'text', tags: 'text', brand: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ flags: 1 });
productSchema.index({ forWho: 1 });
productSchema.index({ metals: 1 });
productSchema.index({ stones: 1 });
productSchema.index({ inStock: 1 });
productSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);
