const router = require('express').Router();
const { updateProfile, getWishlist, addToWishlist, removeFromWishlist } = require('../controllers/userController');
const protect = require('../middleware/auth');

router.use(protect);
router.put('/profile', updateProfile);
router.get('/wishlist', getWishlist);
router.post('/wishlist', addToWishlist);
router.delete('/wishlist/:productId', removeFromWishlist);

module.exports = router;
