const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type:    { type: String, default: 'review' },
  message: { type: String, required: true },
  link:    { type: String, default: '/admin/reviews' },
  read:    { type: Boolean, default: false },
  data:    { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
