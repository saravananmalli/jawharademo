const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  icon: String,
  description: String,
  subcategories: [String],
  image: String,
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
