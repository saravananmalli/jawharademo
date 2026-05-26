const router = require('express').Router();
const { getActiveOffer } = require('../controllers/offerController');

// Public: active offer for homepage
router.get('/active', getActiveOffer);

module.exports = router;
