const router = require('express').Router();
const { getProducts, getProduct, getBrands, searchProducts } = require('../controllers/productController');

router.get('/brands', getBrands);
router.get('/search', searchProducts);
router.get('/', getProducts);
router.get('/:id', getProduct);

module.exports = router;
