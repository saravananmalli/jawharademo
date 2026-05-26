const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String, required: true },
  userInitial: String,
  location: String,
  avatar: String,
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: String,
  text: { type: String, required: true },
  verified: { type: Boolean, default: false },
  featured: { type: Boolean, default: false },
  status: { type: String, enum: ['published', 'pending', 'hidden'], default: 'pending' },
  helpful: { type: Number, default: 0 },
  notHelpful: { type: Number, default: 0 },
}, { timestamps: true });

reviewSchema.index({ product: 1 });
reviewSchema.index({ status: 1 });

module.exports = mongoose.model('Review', reviewSchema);
