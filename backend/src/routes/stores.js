const router = require('express').Router();
const Store = require('../models/Store');

router.get('/', async (req, res) => {
  const stores = await Store.find();
  res.json({ success: true, data: stores });
});

module.exports = router;
