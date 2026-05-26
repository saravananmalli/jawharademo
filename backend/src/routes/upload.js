const router = require('express').Router();
const protect = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const upload = require('../middleware/upload');
const { uploadImages, deleteUploadedImage } = require('../controllers/uploadController');

router.use(protect, adminOnly);

router.post('/:category', upload.array('images', 10), uploadImages);
router.delete('/', deleteUploadedImage);

module.exports = router;
