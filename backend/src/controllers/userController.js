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
  const { page = 1, limit = 20, search = '', role = '', status = '' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = {};
  if (search) filter.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
    { phone: { $regex: search, $options: 'i' } },
  ];
  if (role) filter.role = role;
  if (status === 'active') filter.isActive = true;
  if (status === 'blocked') filter.isActive = false;

  const [users, total, statsResult] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(filter),
    User.aggregate([{
      $group: {
        _id: null,
        total:   { $sum: 1 },
        active:  { $sum: { $cond: ['$isActive', 1, 0] } },
        blocked: { $sum: { $cond: ['$isActive', 0, 1] } },
        admin:   { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
      },
    }]),
  ]);

  const stats = statsResult[0]
    ? { total: statsResult[0].total, active: statsResult[0].active, blocked: statsResult[0].blocked, admin: statsResult[0].admin }
    : { total: 0, active: 0, blocked: 0, admin: 0 };

  res.json({ success: true, data: users, total, page: Number(page), pages: Math.ceil(total / Number(limit)), stats });
};

exports.updateUser = async (req, res) => {
  const { isActive, role } = req.body;
  const updates = {};
  if (isActive !== undefined) updates.isActive = isActive;
  if (role !== undefined) updates.role = role;
  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, data: user });
};
