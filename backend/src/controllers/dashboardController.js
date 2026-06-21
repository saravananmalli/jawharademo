const DashboardSection = require('../models/DashboardSection');
const MobileAsset = require('../models/MobileAsset');

const DEFAULT_SECTIONS = [
  { key: 'banner_slider', label: 'Top Banner Slider',     order: 1,  enabled: true },
  { key: 'categories',   label: 'Categories',             order: 2,  enabled: true },
  { key: 'offers',       label: 'Limited-Time Offers',    order: 3,  enabled: true },
  { key: 'collections',  label: 'Diamond Collections',    order: 4,  enabled: true },
  { key: 'most_loved',   label: 'Most Loved',             order: 5,  enabled: true },
  { key: 'gifting',      label: 'Gifting',                order: 6,  enabled: true },
  { key: 'trending',     label: 'Trending Now',           order: 7,  enabled: true },
  { key: 'moodboard',    label: 'Style Moodboard',        order: 8,  enabled: true },
  { key: 'iconic',       label: 'Iconic Collections',     order: 9,  enabled: true },
  { key: 'best_sellers', label: 'Diamond Best Sellers',   order: 10, enabled: true },
  { key: 'stories',      label: 'Customer Stories',       order: 11, enabled: true },
];

async function ensureSections() {
  const count = await DashboardSection.countDocuments();
  if (count === 0) {
    await DashboardSection.insertMany(DEFAULT_SECTIONS);
  }
  return DashboardSection.find().sort({ order: 1 });
}

// Admin: get all sections (initialises defaults on first call)
exports.getSections = async (req, res) => {
  try {
    const sections = await ensureSections();
    res.json({ success: true, data: sections });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin: update a single section (enabled toggle, label, order)
exports.updateSection = async (req, res) => {
  try {
    const section = await DashboardSection.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!section) return res.status(404).json({ success: false, message: 'Section not found' });
    res.json({ success: true, data: section });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Admin: bulk reorder sections — body: { items: [{ _id, order }] }
exports.reorderSections = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'items must be an array' });
    }
    await Promise.all(
      items.map(({ _id, order }) => DashboardSection.findByIdAndUpdate(_id, { order }))
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Public: full dashboard config — enabled sections with their active items
exports.getPublicDashboard = async (req, res) => {
  try {
    const sections = await ensureSections();
    const enabledSections = sections.filter(s => s.enabled);

    const items = await MobileAsset.find({ screen: 'dashboard', active: true })
      .sort({ order: 1 })
      .select('-__v');

    const data = enabledSections.map(s => ({
      key:   s.key,
      label: s.label,
      order: s.order,
      items: items.filter(item => item.section === s.key),
    }));

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
