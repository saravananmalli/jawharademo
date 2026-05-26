const Banner = require('../models/Banner');

// ── Public: return active banners within their scheduled date window ──────────
// Optional ?placement=hero|offer to filter by placement (defaults to all)
const getActiveBanners = async (req, res) => {
  try {
    const now = new Date();
    const query = {
      active: true,
      $and: [
        { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: null },   { endDate:   { $gte: now } }] },
      ],
    };
    if (req.query.placement) query.placement = req.query.placement;
    const banners = await Banner.find(query).sort({ order: 1 });

    res.json({ success: true, data: banners });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Admin: all banners (including inactive / expired) ─────────────────────────
const getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ order: 1, createdAt: -1 });
    res.json({ success: true, data: banners });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Admin: create ─────────────────────────────────────────────────────────────
const createBanner = async (req, res) => {
  try {
    const banner = await Banner.create(req.body);
    res.status(201).json({ success: true, data: banner });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ── Admin: update ─────────────────────────────────────────────────────────────
const updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    res.json({ success: true, data: banner });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ── Admin: delete ─────────────────────────────────────────────────────────────
const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    res.json({ success: true, message: 'Banner deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getActiveBanners, getAllBanners, createBanner, updateBanner, deleteBanner };
