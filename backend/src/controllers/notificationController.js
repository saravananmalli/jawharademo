const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  const { limit = 20 } = req.query;
  const [notifications, unreadCount] = await Promise.all([
    Notification.find().sort({ createdAt: -1 }).limit(Number(limit)).lean(),
    Notification.countDocuments({ read: false }),
  ]);
  res.json({ success: true, data: notifications, unreadCount });
};

exports.markRead = async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { read: true });
  res.json({ success: true });
};

exports.markAllRead = async (req, res) => {
  await Notification.updateMany({ read: false }, { read: true });
  res.json({ success: true });
};
