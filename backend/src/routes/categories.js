const router = require('express').Router();
const Category = require('../models/Category');

router.get('/', async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.json({ success: true, data: categories });
});

module.exports = router;
