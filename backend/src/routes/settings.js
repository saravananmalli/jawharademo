const router = require('express').Router();
const protect  = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const {
  getPublicDeliverySettings,
  getPublicBranding,
  getSettings,
  updateSettings,
} = require('../controllers/settingsController');

// Public — delivery config for frontend validation
router.get('/delivery', getPublicDeliverySettings);

// Public — branding (logos) for the mobile app
router.get('/branding', getPublicBranding);

// Admin — full read + write
router.get('/',   protect, adminOnly, getSettings);
router.put('/',   protect, adminOnly, updateSettings);

module.exports = router;
