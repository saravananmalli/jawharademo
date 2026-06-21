const mongoose = require('mongoose');

const dashboardSectionSchema = new mongoose.Schema({
  key:     { type: String, required: true, unique: true },
  label:   { type: String, required: true },
  enabled: { type: Boolean, default: true },
  order:   { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('DashboardSection', dashboardSectionSchema);
