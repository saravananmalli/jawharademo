const MobileAsset = require('../models/MobileAsset');

// Public: active assets for a screen (called by mobile app, no auth)
exports.getPublicAssets = async (req, res) => {
  try {
    const { screen } = req.params;
    const assets = await MobileAsset.find({ screen, active: true })
      .sort({ order: 1 })
      .select('-__v -updatedAt');
    res.json({ success: true, data: assets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin: all assets for a screen including inactive
exports.getAllAssets = async (req, res) => {
  try {
    const screen  = req.params.screen || req.query.screen;
    const section = req.query.section;
    const filter  = {};
    if (screen)  filter.screen  = screen;
    if (section) filter.section = section;
    const assets = await MobileAsset.find(filter).sort({ screen: 1, section: 1, order: 1, createdAt: -1 });
    res.json({ success: true, data: assets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin: create asset
exports.createAsset = async (req, res) => {
  try {
    const asset = await MobileAsset.create(req.body);
    res.status(201).json({ success: true, data: asset });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Admin: update asset
exports.updateAsset = async (req, res) => {
  try {
    const asset = await MobileAsset.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });
    res.json({ success: true, data: asset });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Admin: delete asset
exports.deleteAsset = async (req, res) => {
  try {
    const asset = await MobileAsset.findByIdAndDelete(req.params.id);
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });
    res.json({ success: true, message: 'Asset deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin: bulk reorder — body: { items: [{ _id, order }] }
exports.reorderAssets = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'items must be an array' });
    }
    await Promise.all(
      items.map(({ _id, order }) => MobileAsset.findByIdAndUpdate(_id, { order }))
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
