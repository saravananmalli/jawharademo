const router = require('express').Router();
const protect  = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const {
  getPublicDeliverySettings,
  getSettings,
  updateSettings,
} = require('../controllers/settingsController');

// Public — delivery config for frontend validation
router.get('/delivery', getPublicDeliverySettings);

// Admin — full read + write
router.get('/',   protect, adminOnly, getSettings);
router.put('/',   protect, adminOnly, updateSettings);

module.exports = router;
