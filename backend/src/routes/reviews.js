const router = require('express').Router();
const {
  getLatestReviews, getPublicReviews, getProductReviews,
  createReview, getPendingReviews, getMyReviews,
} = require('../controllers/reviewController');
const protect = require('../middleware/auth');

router.get('/latest', getLatestReviews);
router.get('/pending-for-user', protect, getPendingReviews);
router.get('/my-reviews', protect, getMyReviews);
router.get('/', getPublicReviews);
router.get('/product/:productId', getProductReviews);
router.post('/', protect, createReview);

module.exports = router;
