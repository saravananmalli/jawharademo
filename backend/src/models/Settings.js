const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'global', unique: true },
    delivery: {
      enableInternationalDelivery: { type: Boolean, default: false },
      supportedCountryCodes: { type: [String], default: ['AE'] },
      supportedCountryNames: { type: [String], default: ['UAE'] },
      restrictionMessage: {
        type: String,
        default: 'Currently we deliver only within UAE. We will expand to more countries soon.',
      },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Settings', settingsSchema);
