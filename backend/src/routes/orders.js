const router = require('express').Router();
const { getMyOrders, getOrder, createOrder } = require('../controllers/orderController');
const protect = require('../middleware/auth');

router.use(protect);
router.get('/', getMyOrders);
router.post('/', createOrder);
router.get('/:id', getOrder);

module.exports = router;
