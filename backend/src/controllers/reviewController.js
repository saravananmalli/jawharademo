const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Notification = require('../models/Notification');

async function recalcProductRating(productId) {
  try {
    const reviews = await Review.find({ product: productId, status: 'published' });
    const count = reviews.length;
    const avg = count
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10
      : 0;
    await Product.findByIdAndUpdate(productId, { rating: avg, reviewCount: count });
  } catch (err) {
    console.error(`recalcProductRating failed for product ${productId}:`, err.message);
  }
}

// ── Public ────────────────────────────────────────────────────────────────────

exports.getLatestReviews = async (req, res) => {
  const reviews = await Review.find({ status: 'published' })
    .populate('product', 'name images slug')
    .sort({ createdAt: -1 })
    .limit(10);
  res.json({ success: true, data: reviews });
};

exports.getPublicReviews = async (req, res) => {
  const { rating, product, q, page = 1, limit = 12, sort = 'newest' } = req.query;
  const filter = { status: 'published' };
  if (rating) filter.rating = { $gte: Number(rating) };
  if (product) filter.product = product;
  if (q) filter.$or = [
    { userName: { $regex: q, $options: 'i' } },
    { title: { $regex: q, $options: 'i' } },
    { text: { $regex: q, $options: 'i' } },
  ];

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    highest: { rating: -1 },
    lowest: { rating: 1 },
    helpful: { helpful: -1 },
  };
  const sortOrder = sortMap[sort] || sortMap.newest;
  const skip = (Number(page) - 1) * Number(limit);

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('product', 'name images slug')
      .sort(sortOrder)
      .skip(skip)
      .limit(Number(limit)),
    Review.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: reviews,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
  });
};

exports.getProductReviews = async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId, status: 'published' })
    .sort({ createdAt: -1 });
  res.json({ success: true, data: reviews });
};

exports.createReview = async (req, res) => {
  const { productId, rating, title, text, location, userName, verified } = req.body;
  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  const existing = await Review.findOne({ product: productId, user: req.user._id });
  if (existing) return res.status(400).json({ success: false, message: 'You have already reviewed this product' });

  const resolvedName = (userName || req.user.name || '').trim();
  const review = await Review.create({
    product: productId,
    user: req.user._id,
    userName: resolvedName,
    userInitial: resolvedName.charAt(0).toUpperCase(),
    location: location || '',
    rating: Number(rating),
    title: title || '',
    text,
    verified: verified !== false,
    status: 'pending',
  });

  await Notification.create({
    type: 'review',
    message: `New review received for ${product.name}`,
    link: '/admin/reviews',
    data: { reviewId: review._id, productId: product._id, productName: product.name },
  });

  res.status(201).json({ success: true, data: review });
};

// ── Customer helpers ───────────────────────────────────────────────────────────

exports.getPendingReviews = async (req, res) => {
  const deliveredOrders = await Order.find({ user: req.user._id, status: 'delivered' }).lean();

  const productMap = {};
  for (const order of deliveredOrders) {
    for (const item of order.items) {
      const pid = item.product?.toString();
      if (pid && !productMap[pid]) {
        productMap[pid] = {
          productId: pid,
          name: item.name,
          image: item.image,
          orderId: order._id,
          orderDate: order.createdAt,
        };
      }
    }
  }

  const productIds = Object.keys(productMap);
  if (!productIds.length) return res.json({ success: true, data: [] });

  const reviewed = await Review.find({ product: { $in: productIds }, user: req.user._id }, 'product').lean();
  const reviewedSet = new Set(reviewed.map(r => r.product.toString()));

  const pending = productIds.filter(pid => !reviewedSet.has(pid)).map(pid => productMap[pid]);
  res.json({ success: true, data: pending });
};

exports.getMyReviews = async (req, res) => {
  const reviews = await Review.find({ user: req.user._id })
    .populate('product', 'name images slug')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, data: reviews });
};

// ── Admin ─────────────────────────────────────────────────────────────────────

exports.getAllReviews = async (req, res) => {
  const { status, product, q, page = 1, limit = 20, sort = 'newest' } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (product) filter.product = product;
  if (q) filter.userName = { $regex: q, $options: 'i' };

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    highest: { rating: -1 },
    lowest: { rating: 1 },
  };
  const sortOrder = sortMap[sort] || sortMap.newest;

  const skip = (Number(page) - 1) * Number(limit);
  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('product', 'name images')
      .sort(sortOrder)
      .skip(skip)
      .limit(Number(limit)),
    Review.countDocuments(filter),
  ]);

  const [totalPublished, totalPending, totalHidden] = await Promise.all([
    Review.countDocuments({ status: 'published' }),
    Review.countDocuments({ status: 'pending' }),
    Review.countDocuments({ status: 'hidden' }),
  ]);

  res.json({
    success: true,
    data: reviews,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    stats: { published: totalPublished, pending: totalPending, hidden: totalHidden },
  });
};

exports.adminCreateReview = async (req, res) => {
  const { productId, userName, location, rating, title, text, verified, featured, status, avatar } = req.body;
  if (!productId || !userName || !text || !rating) {
    return res.status(400).json({ success: false, message: 'productId, userName, rating and text are required' });
  }
  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  const review = await Review.create({
    product: productId,
    userName,
    userInitial: userName.charAt(0).toUpperCase(),
    location: location || '',
    avatar: avatar || '',
    rating: Number(rating),
    title: title || '',
    text,
    verified: !!verified,
    featured: !!featured,
    status: 'pending',
  });

  await recalcProductRating(productId);
  res.status(201).json({ success: true, data: review });
};

exports.updateReview = async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

  const fields = ['userName', 'location', 'avatar', 'rating', 'title', 'text', 'verified', 'featured', 'status'];
  fields.forEach(f => { if (req.body[f] !== undefined) review[f] = req.body[f]; });
  if (req.body.userName) review.userInitial = req.body.userName.charAt(0).toUpperCase();

  await review.save();
  await recalcProductRating(review.product);
  res.json({ success: true, data: review });
};

exports.deleteReview = async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

  const productId = review.product;
  await review.deleteOne();
  await recalcProductRating(productId);
  res.json({ success: true, message: 'Review deleted' });
};

exports.bulkDeleteReviews = async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || !ids.length) {
    return res.status(400).json({ success: false, message: 'ids array required' });
  }
  const affected = await Review.find({ _id: { $in: ids } }, 'product');
  const productIds = [...new Set(affected.map(r => r.product.toString()))];
  await Review.deleteMany({ _id: { $in: ids } });
  await Promise.all(productIds.map(pid => recalcProductRating(pid)));
  res.json({ success: true, deleted: ids.length });
};

exports.bulkUpdateStatus = async (req, res) => {
  const { ids, status } = req.body;
  const allowed = ['published', 'pending', 'hidden'];
  if (!Array.isArray(ids) || !ids.length || !allowed.includes(status)) {
    return res.status(400).json({ success: false, message: 'ids array and valid status required' });
  }
  await Review.updateMany({ _id: { $in: ids } }, { status });
  const affected = await Review.find({ _id: { $in: ids } }, 'product');
  const productIds = [...new Set(affected.map(r => r.product.toString()))];
  await Promise.all(productIds.map(pid => recalcProductRating(pid)));
  res.json({ success: true, updated: ids.length });
};
