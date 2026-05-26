const Order = require('../models/Order');

exports.getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: orders });
};

exports.getOrder = async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id }).populate('items.product', 'name images');
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  res.json({ success: true, data: order });
};

exports.createOrder = async (req, res) => {
  const { items, shippingAddress, subtotal, shippingFee, totalAmount } = req.body;
  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'No items in order' });
  }
  const order = await Order.create({ user: req.user._id, items, shippingAddress, subtotal, shippingFee, totalAmount });
  res.status(201).json({ success: true, data: order });
};

exports.getAllOrders = async (req, res) => {
  const { status, page = 1, limit = 20, startDate, endDate } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate)   filter.createdAt.$lte = new Date(endDate);
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [orders, total] = await Promise.all([
    Order.find(filter).populate('user', 'name email').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Order.countDocuments(filter),
  ]);
  res.json({ success: true, data: orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
};

exports.updateOrderStatus = async (req, res) => {
  const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status, paymentStatus: req.body.paymentStatus }, { new: true });
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  res.json({ success: true, data: order });
};
