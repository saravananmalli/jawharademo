const router = require('express').Router();
const { getActiveBanners } = require('../controllers/bannerController');

// Public: only active, in-schedule banners for the homepage carousel
router.get('/', getActiveBanners);

module.exports = router;
