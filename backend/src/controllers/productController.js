const Product = require('../models/Product');

exports.searchProducts = async (req, res) => {
  const { q, flag, sort, limit = 8 } = req.query;

  const filter = {};

  if (q && q.trim()) {
    const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(escaped, 'i');
    filter.$or = [
      { name: re }, { brand: re }, { category: re },
      { collection: re }, { tags: re }, { styles: re },
      { metals: re }, { stones: re }, { metal: re }, { stone: re },
    ];
  }

  if (flag) filter.flags = flag;

  const sortOption = sort === 'rating'
    ? { rating: -1, createdAt: -1 }
    : { createdAt: -1 };

  const products = await Product.find(filter)
    .select('name category price images flags deliveryDate arrivesBy')
    .sort(sortOption)
    .limit(Number(limit))
    .lean();

  res.json({ success: true, data: products });
};

exports.getProducts = async (req, res) => {
  const { q, category, collection, metal, stone, brand, minPrice, maxPrice, sort, page = 1, limit = 20, inStock, badge, flag, minRating, forWho } = req.query;

  const filter = {};
  if (q) {
    const trimmed = q.trim();
    if (/^[a-f\d]{24}$/i.test(trimmed)) {
      filter._id = trimmed;
    } else {
      const re = new RegExp(trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { name: re }, { brand: re }, { category: re },
        { designCode: re }, { collection: re },
        { tags: re }, { flags: re }, { badge: re },
      ];
    }
  }
  if (category && category !== 'all') filter.category = new RegExp(category, 'i');
  if (metal) {
    const metalRe = new RegExp(metal, 'i');
    if (!filter.$and) filter.$and = [];
    filter.$and.push({ $or: [{ metal: metalRe }, { metals: metalRe }] });
  }
  if (stone) {
    const stoneRe = new RegExp(stone, 'i');
    if (!filter.$and) filter.$and = [];
    filter.$and.push({ $or: [{ stone: stoneRe }, { stones: stoneRe }] });
  }
  if (brand) {
    const brands = brand.split(',').map(b => b.trim()).filter(Boolean);
    filter.brand = brands.length === 1 ? new RegExp(brands[0], 'i') : { $in: brands.map(b => new RegExp(b, 'i')) };
  }
  if (collection) filter.collection = new RegExp(collection.trim(), 'i');
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (inStock === 'true') filter.inStock = true;
  if (badge) filter.badge = new RegExp(badge, 'i');
  if (flag) filter.flags = flag;
  if (forWho) filter.forWho = new RegExp(forWho, 'i');
  if (minRating) filter.rating = { $gte: Number(minRating) };

  const sortMap = {
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    rating: { rating: -1 },
    newest: { createdAt: -1 },
  };
  const sortOption = sortMap[sort] || { createdAt: -1 };

  const safeLimit = Math.min(Number(limit) || 20, 500);
  const skip = (Number(page) - 1) * safeLimit;
  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortOption).skip(skip).limit(safeLimit).lean(),
    Product.countDocuments(filter),
  ]);

  res.json({ success: true, data: products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
};

exports.getBrands = async (req, res) => {
  const brands = await Product.distinct('brand', { brand: { $nin: ['', null] } });
  res.json({ success: true, data: brands.sort() });
};

exports.getProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, data: product });
};

exports.createProduct = async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ success: true, data: product });
};

exports.updateProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, data: product });
};

exports.deleteProduct = async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, message: 'Product deleted' });
};
