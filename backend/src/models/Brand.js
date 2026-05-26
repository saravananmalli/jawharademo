const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  name:           { type: String, required: true, trim: true },
  slug:           { type: String, required: true, unique: true, lowercase: true, trim: true },
  logo:           { type: String, default: '' },
  banner:         { type: String, default: '' },
  description:    { type: String, default: '' },
  seoTitle:       { type: String, default: '' },
  seoDescription: { type: String, default: '' },
  isActive:       { type: Boolean, default: true },
}, { timestamps: true });

brandSchema.index({ isActive: 1 });

module.exports = mongoose.model('Brand', brandSchema);
