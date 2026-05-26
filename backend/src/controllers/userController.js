const User = require('../models/User');
const Product = require('../models/Product');

exports.updateProfile = async (req, res) => {
  const { name, phone, address } = req.body;
  const user = await User.findByIdAndUpdate(req.user._id, { name, phone, address }, { new: true });
  res.json({ success: true, data: user });
};

exports.getWishlist = async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist');
  res.json({ success: true, data: user.wishlist });
};

exports.addToWishlist = async (req, res) => {
  const { productId } = req.body;
  const user = await User.findById(req.user._id);
  if (!user.wishlist.includes(productId)) {
    user.wishlist.push(productId);
    await user.save();
  }
  res.json({ success: true, data: user.wishlist });
};

exports.removeFromWishlist = async (req, res) => {
  const user = await User.findById(req.user._id);
  user.wishlist = user.wishlist.filter((id) => id.toString() !== req.params.productId);
  await user.save();
  res.json({ success: true, data: user.wishlist });
};

exports.getAllUsers = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find().sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(),
  ]);
  res.json({ success: true, data: users, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
};

exports.updateUser = async (req, res) => {
  const { isActive, role } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { isActive, role }, { new: true });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, data: user });
};
