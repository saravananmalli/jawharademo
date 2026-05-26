const Brand = require('../models/Brand');
const Product = require('../models/Product');

exports.getBrands = async (req, res) => {
  const filter = {};
  if (req.query.active === 'true') filter.isActive = true;
  const brands = await Brand.find(filter).sort({ name: 1 });
  res.json({ success: true, data: brands });
};

exports.getBrand = async (req, res) => {
  const brand = await Brand.findOne({ slug: req.params.slug, isActive: true });
  if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });
  res.json({ success: true, data: brand });
};

exports.getBrandProducts = async (req, res) => {
  const { slug } = req.params;
  const brand = await Brand.findOne({ slug, isActive: true });
  if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });

  const { metal, stone, category, minPrice, maxPrice, sort, page = 1, limit = 20 } = req.query;

  const filter = { brand: new RegExp(`^${brand.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
  if (category) filter.category = new RegExp(category, 'i');
  if (metal) filter.metal = new RegExp(metal, 'i');
  if (stone) filter.stone = new RegExp(stone, 'i');
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const sortMap = {
    price_asc:  { price: 1 },
    price_desc: { price: -1 },
    rating:     { rating: -1 },
    newest:     { createdAt: -1 },
  };
  const sortOption = sortMap[sort] || { createdAt: -1 };

  const skip = (Number(page) - 1) * Number(limit);
  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortOption).skip(skip).limit(Number(limit)),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: products,
    brand,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
  });
};

exports.createBrand = async (req, res) => {
  const brand = await Brand.create(req.body);
  res.status(201).json({ success: true, data: brand });
};

exports.updateBrand = async (req, res) => {
  const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });
  res.json({ success: true, data: brand });
};

exports.deleteBrand = async (req, res) => {
  const brand = await Brand.findByIdAndDelete(req.params.id);
  if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });
  res.json({ success: true, message: 'Brand deleted' });
};
