const router = require('express').Router();
const { getPublicAssets } = require('../controllers/mobileAssetController');

// Public: active assets for a screen (no auth required — called by mobile app)
router.get('/:screen', getPublicAssets);

module.exports = router;
