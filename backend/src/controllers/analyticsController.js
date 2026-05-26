const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

function buildDateMatch(query) {
  const { startDate, endDate } = query;
  if (!startDate && !endDate) return {};
  const range = {};
  if (startDate) range.$gte = new Date(startDate);
  if (endDate)   range.$lte = new Date(endDate);
  return { createdAt: range };
}

exports.getSummary = async (req, res) => {
  const dateMatch = buildDateMatch(req.query);
  const orderMatch = { ...dateMatch, status: { $ne: 'cancelled' } };

  const [totalOrders, totalUsers, totalProducts, revenueResult] = await Promise.all([
    Order.countDocuments(dateMatch),
    User.countDocuments(),
    Product.countDocuments(),
    Order.aggregate([
      { $match: orderMatch },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      totalOrders,
      totalUsers,
      totalProducts,
      totalRevenue: revenueResult[0]?.total || 0,
    },
  });
};

exports.getSalesData = async (req, res) => {
  const { startDate, endDate } = req.query;
  const start = startDate ? new Date(startDate) : null;
  const end   = endDate   ? new Date(endDate)   : null;

  // Build match: exclude cancelled orders so revenue is consistent with getSummary
  const matchStage = { status: { $ne: 'cancelled' } };
  if (start || end) {
    matchStage.createdAt = {};
    if (start) matchStage.createdAt.$gte = start;
    if (end)   matchStage.createdAt.$lte = end;
  } else {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    matchStage.createdAt = { $gte: sixMonthsAgo };
  }

  // Pick granularity based on range duration
  let granularity = 'month';
  if (start && end) {
    const diffDays = (end - start) / 86400000;
    if (diffDays <= 1)       granularity = 'hour';
    else if (diffDays <= 90) granularity = 'day';
  }

  const groupId = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } };
  if (granularity === 'day'  || granularity === 'hour') groupId.day  = { $dayOfMonth: '$createdAt' };
  if (granularity === 'hour')                           groupId.hour = { $hour: '$createdAt' };

  const raw = await Order.aggregate([
    { $match: matchStage },
    { $group: { _id: groupId, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } },
  ]);

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const formatted = raw.map((s) => {
    let label;
    if (granularity === 'hour') {
      label = `${String(s._id.hour).padStart(2, '0')}:00`;
    } else if (granularity === 'day') {
      label = `${s._id.day} ${MONTHS[s._id.month - 1]}`;
    } else {
      label = MONTHS[s._id.month - 1];
    }
    return { month: label, revenue: s.revenue, orders: s.orders };
  });

  res.json({ success: true, data: formatted });
};

exports.getTopProducts = async (req, res) => {
  const dateMatch = buildDateMatch(req.query);
  const pipeline = [];
  if (Object.keys(dateMatch).length > 0) pipeline.push({ $match: dateMatch });
  pipeline.push(
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        name:    { $first: '$items.name' },
        sold:    { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        price:   { $avg: '$items.price' },
      },
    },
    { $sort: { sold: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from:         'products',
        localField:   '_id',
        foreignField: '_id',
        as:           'productDoc',
      },
    },
    {
      $addFields: {
        category: { $arrayElemAt: ['$productDoc.category', 0] },
        brand:    { $arrayElemAt: ['$productDoc.brand', 0] },
      },
    },
    { $project: { productDoc: 0 } },
  );

  const top = await Order.aggregate(pipeline);
  res.json({ success: true, data: top });
};

exports.getOrdersByStatus = async (req, res) => {
  const dateMatch = buildDateMatch(req.query);
  const pipeline = [];
  if (Object.keys(dateMatch).length > 0) pipeline.push({ $match: dateMatch });
  pipeline.push({ $group: { _id: '$status', count: { $sum: 1 } } });
  const data = await Order.aggregate(pipeline);
  res.json({ success: true, data: data.map((d) => ({ status: d._id, count: d.count })) });
};
