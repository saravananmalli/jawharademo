const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: String,
  description: String,
  featured: { type: Boolean, default: false },
  discount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Collection', collectionSchema);
