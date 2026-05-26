const { processImage, deleteImage } = require('../utils/imageProcessor');

const VALID_CATEGORIES = ['products', 'categories', 'banners', 'brands'];

exports.uploadImages = async (req, res) => {
  try {
    const { category } = req.params;

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, error: 'Invalid upload category' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files provided' });
    }

    const results = await Promise.all(
      req.files.map(file => processImage(file.buffer, category))
    );

    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteUploadedImage = (req, res) => {
  try {
    const { category, filename } = req.body;

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, error: 'Invalid category' });
    }

    if (!filename || typeof filename !== 'string') {
      return res.status(400).json({ success: false, error: 'Invalid filename' });
    }

    deleteImage(category, filename);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
