const router = require('express').Router();
const protect = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const { createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { getAllOrders, updateOrderStatus } = require('../controllers/orderController');
const { getAllUsers, updateUser } = require('../controllers/userController');
const { getSummary, getSalesData, getTopProducts, getOrdersByStatus } = require('../controllers/analyticsController');
const { getAllReviews, adminCreateReview, updateReview, deleteReview, bulkDeleteReviews, bulkUpdateStatus } = require('../controllers/reviewController');
const { getAllBanners, createBanner, updateBanner, deleteBanner } = require('../controllers/bannerController');
const { getAllOffers, createOffer, updateOffer, deleteOffer } = require('../controllers/offerController');
const { getBrands: getAdminBrands, createBrand, updateBrand, deleteBrand } = require('../controllers/brandController');
const { getNotifications, markRead, markAllRead } = require('../controllers/notificationController');

router.use(protect, adminOnly);

router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

router.get('/orders', getAllOrders);
router.put('/orders/:id', updateOrderStatus);

router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);

router.get('/analytics/summary', getSummary);
router.get('/analytics/sales', getSalesData);
router.get('/analytics/products', getTopProducts);
router.get('/analytics/orders-by-status', getOrdersByStatus);

router.get('/reviews', getAllReviews);
router.post('/reviews', adminCreateReview);
router.delete('/reviews/bulk', bulkDeleteReviews);
router.put('/reviews/bulk', bulkUpdateStatus);
router.put('/reviews/:id', updateReview);
router.delete('/reviews/:id', deleteReview);

router.get('/banners', getAllBanners);
router.post('/banners', createBanner);
router.put('/banners/:id', updateBanner);
router.delete('/banners/:id', deleteBanner);

router.get('/offers', getAllOffers);
router.post('/offers', createOffer);
router.put('/offers/:id', updateOffer);
router.delete('/offers/:id', deleteOffer);

router.get('/brands', getAdminBrands);
router.post('/brands', createBrand);
router.put('/brands/:id', updateBrand);
router.delete('/brands/:id', deleteBrand);

router.get('/notifications', getNotifications);
router.put('/notifications/read-all', markAllRead);
router.put('/notifications/:id/read', markRead);

const mobileCtrl = require('../controllers/mobileAssetController');
router.get('/mobile-assets',         mobileCtrl.getAllAssets);
router.get('/mobile-assets/:screen', mobileCtrl.getAllAssets);
router.post('/mobile-assets',        mobileCtrl.createAsset);
router.put('/mobile-assets/reorder', mobileCtrl.reorderAssets);
router.put('/mobile-assets/:id',     mobileCtrl.updateAsset);
router.delete('/mobile-assets/:id',  mobileCtrl.deleteAsset);

module.exports = router;
