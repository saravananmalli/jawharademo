const Offer = require('../models/Offer');

// ── Public: active offer with enabled products populated ──────────────────────
const getActiveOffer = async (req, res) => {
  try {
    const now = new Date();

    // Auto-expire: deactivate offers whose endDate has passed
    await Offer.updateMany(
      { autoExpire: true, active: true, endDate: { $lt: now } },
      { $set: { active: false } },
    );

    const offer = await Offer.findOne({ active: true })
      .sort({ updatedAt: -1 })
      .populate({
        path: 'products.product',
        model: 'Product',
        // Include all fields needed by ProductCard + FilterSidebar
        select: 'name price salePrice originalPrice discount images rating reviewCount inStock badge category subcategory brand deliveryDate arrivesBy metal metals stone stones metalKt tags styles featured createdAt',
      });

    if (!offer) return res.json({ success: true, data: null });

    // Filter to enabled products and sort by displayOrder
    const filteredProducts = offer.products
      .filter(p => p.enabled && p.product)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(p => ({ ...p.product.toObject(), featured: p.featured, displayOrder: p.displayOrder }));

    res.json({
      success: true,
      data: {
        _id:               offer._id,
        title:             offer.title,
        subtitle:          offer.subtitle,
        viewAllLink:       offer.viewAllLink,
        startDate:         offer.startDate,
        endDate:           offer.endDate,
        showCountdown:     offer.showCountdown,
        bannerImage:       offer.bannerImage,
        bannerTitle:       offer.bannerTitle,
        bannerDescription: offer.bannerDescription,
        bannerCtaText:     offer.bannerCtaText,
        bannerCtaLink:     offer.bannerCtaLink,
        bannerActive:      offer.bannerActive,
        products:          filteredProducts,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Admin: all offers (full detail, products populated) ───────────────────────
const getAllOffers = async (req, res) => {
  try {
    const offers = await Offer.find()
      .sort({ createdAt: -1 })
      .populate({
        path: 'products.product',
        model: 'Product',
        select: 'name price images discount category',
      });
    res.json({ success: true, data: offers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Admin: create ─────────────────────────────────────────────────────────────
const createOffer = async (req, res) => {
  try {
    const offer = await Offer.create(req.body);
    res.status(201).json({ success: true, data: offer });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ── Admin: update (including product list) ────────────────────────────────────
const updateOffer = async (req, res) => {
  try {
    const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    }).populate({
      path: 'products.product',
      model: 'Product',
      select: 'name price images discount category',
    });
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });
    res.json({ success: true, data: offer });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ── Admin: delete ─────────────────────────────────────────────────────────────
const deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id);
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });
    res.json({ success: true, message: 'Offer deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getActiveOffer, getAllOffers, createOffer, updateOffer, deleteOffer };
