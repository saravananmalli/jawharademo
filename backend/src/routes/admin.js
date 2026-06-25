const router = require('express').Router();
const protect = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const { createProduct, updateProduct, deleteProduct, getProductSuggestions, getProductCategories } = require('../controllers/productController');
const { getAllOrders, updateOrderStatus } = require('../controllers/orderController');
const { getAllUsers, updateUser } = require('../controllers/userController');
const { getSummary, getSalesData, getTopProducts, getOrdersByStatus } = require('../controllers/analyticsController');
const { getAllReviews, adminCreateReview, updateReview, deleteReview, bulkDeleteReviews, bulkUpdateStatus } = require('../controllers/reviewController');
const { getAllBanners, createBanner, updateBanner, deleteBanner } = require('../controllers/bannerController');
const { getAllOffers, createOffer, updateOffer, deleteOffer } = require('../controllers/offerController');
const { getBrands: getAdminBrands, createBrand, updateBrand, deleteBrand } = require('../controllers/brandController');
const { getNotifications, markRead, markAllRead } = require('../controllers/notificationController');
const { getAllAssets: getMobileAssets, createAsset: createMobileAsset, updateAsset: updateMobileAsset, deleteAsset: deleteMobileAsset, reorderAssets: reorderMobileAssets } = require('../controllers/mobileAssetController');
const { getSections, updateSection, reorderSections } = require('../controllers/dashboardController');

router.use(protect, adminOnly);

router.get('/products/suggestions',  getProductSuggestions);
router.get('/products/categories',   getProductCategories);
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

router.get('/mobile-assets',         getMobileAssets);
router.get('/mobile-assets/:screen', getMobileAssets);
router.post('/mobile-assets',        createMobileAsset);
router.put('/mobile-assets/reorder', reorderMobileAssets);
router.put('/mobile-assets/:id',     updateMobileAsset);
router.delete('/mobile-assets/:id',  deleteMobileAsset);

router.get('/dashboard-sections',          getSections);
router.put('/dashboard-sections/reorder',  reorderSections);
router.put('/dashboard-sections/:id',      updateSection);

module.exports = router;
