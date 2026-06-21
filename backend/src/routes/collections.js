const router = require('express').Router();
const Collection = require('../models/Collection');
const Product = require('../models/Product');

// All collections
router.get('/', async (req, res) => {
  try {
    const collections = await Collection.find().sort({ name: 1 });
    res.json({ success: true, data: collections });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Products belonging to a collection (must come before /:id)
router.get('/:id/products', async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) return res.status(404).json({ success: false, message: 'Collection not found' });

    const { page = 1, limit = 20, sort } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const sortMap = {
      price_asc:  { price: 1 },
      price_desc: { price: -1 },
      rating:     { rating: -1 },
      newest:     { createdAt: -1 },
    };
    const sortOption = sortMap[sort] || { createdAt: -1 };
    const nameFilter = { collection: new RegExp(collection.name, 'i') };

    const [products, total] = await Promise.all([
      Product.find(nameFilter).sort(sortOption).skip(skip).limit(Number(limit)).lean(),
      Product.countDocuments(nameFilter),
    ]);

    res.json({
      success: true,
      data: products,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Single collection by _id
router.get('/:id', async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) return res.status(404).json({ success: false, message: 'Collection not found' });
    res.json({ success: true, data: collection });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
