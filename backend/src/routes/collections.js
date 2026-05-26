const router = require('express').Router();
const Collection = require('../models/Collection');

router.get('/', async (req, res) => {
  const collections = await Collection.find().sort({ name: 1 });
  res.json({ success: true, data: collections });
});

module.exports = router;
