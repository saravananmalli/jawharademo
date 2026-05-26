const Settings = require('../models/Settings');

async function getOrCreateSettings() {
  let s = await Settings.findOne({ key: 'global' });
  if (!s) s = await Settings.create({ key: 'global' });
  return s;
}

// Public — delivery restrictions only (no auth required)
const getPublicDeliverySettings = async (req, res) => {
  try {
    const s = await getOrCreateSettings();
    res.json({ success: true, data: s.delivery });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin — full settings
const getSettings = async (req, res) => {
  try {
    const s = await getOrCreateSettings();
    res.json({ success: true, data: s });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin — update (upsert)
const updateSettings = async (req, res) => {
  try {
    const s = await Settings.findOneAndUpdate(
      { key: 'global' },
      { $set: req.body },
      { new: true, upsert: true, runValidators: true },
    );
    res.json({ success: true, data: s });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = { getPublicDeliverySettings, getSettings, updateSettings };
