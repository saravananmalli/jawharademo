const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');

const UPLOADS_BASE = path.join(__dirname, '../../uploads');

const VALID_CATEGORIES = ['products', 'categories', 'banners', 'brands'];

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

async function processImage(buffer, category) {
  if (!VALID_CATEGORIES.includes(category)) throw new Error('Invalid image category');

  const filename = randomUUID();
  const categoryPath = path.join(UPLOADS_BASE, category);

  ensureDir(path.join(categoryPath, 'original'));
  ensureDir(path.join(categoryPath, 'webp'));
  ensureDir(path.join(categoryPath, 'thumbnails'));

  const image = sharp(buffer);
  const meta = await image.metadata();

  // Save original as JPEG (lossless preservation for source)
  const originalFile = `${filename}.jpg`;
  await sharp(buffer)
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(path.join(categoryPath, 'original', originalFile));

  // Save full WebP (max 1200px, optimized)
  const webpFile = `${filename}.webp`;
  const maxDim = category === 'banners' ? 1920 : 1200;
  await sharp(buffer)
    .resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85, effort: 4 })
    .toFile(path.join(categoryPath, 'webp', webpFile));

  // Save thumbnail (300x300 cover crop, WebP)
  await sharp(buffer)
    .resize(300, 300, { fit: 'cover', position: 'centre' })
    .webp({ quality: 80, effort: 4 })
    .toFile(path.join(categoryPath, 'thumbnails', webpFile));

  return {
    original: `/uploads/${category}/original/${originalFile}`,
    webp: `/uploads/${category}/webp/${webpFile}`,
    thumbnail: `/uploads/${category}/thumbnails/${webpFile}`,
    filename,
    width: meta.width || null,
    height: meta.height || null,
  };
}

function deleteImage(category, filename) {
  if (!VALID_CATEGORIES.includes(category)) return;
  // Guard against path traversal
  if (!filename || /[/\\.]\./.test(filename) || filename.includes('/')) return;

  const categoryPath = path.join(UPLOADS_BASE, category);
  const files = [
    path.join(categoryPath, 'original', `${filename}.jpg`),
    path.join(categoryPath, 'webp', `${filename}.webp`),
    path.join(categoryPath, 'thumbnails', `${filename}.webp`),
  ];
  for (const f of files) {
    try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch { /* ignore */ }
  }
}

module.exports = { processImage, deleteImage };
