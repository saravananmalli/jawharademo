const router = require('express').Router();
const { getBrands, getBrand, getBrandProducts } = require('../controllers/brandController');

router.get('/', getBrands);
router.get('/:slug/products', getBrandProducts);
router.get('/:slug', getBrand);

module.exports = router;
