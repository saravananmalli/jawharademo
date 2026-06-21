const router = require('express').Router();
const protect = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const upload = require('../middleware/upload');
const { uploadImages, uploadAvatar, deleteUploadedImage } = require('../controllers/uploadController');

// Avatar upload — any authenticated user (not admin-only)
router.post('/avatar', protect, upload.single('images'), uploadAvatar);

router.use(protect, adminOnly);

router.post('/:category', upload.array('images', 10), uploadImages);
router.delete('/', deleteUploadedImage);

module.exports = router;
