const express = require('express');
const router  = express.Router();
const { getGoldPrice } = require('../controllers/goldPriceController');

router.get('/', getGoldPrice);

module.exports = router;
