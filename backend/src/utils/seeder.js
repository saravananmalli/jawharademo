require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const path = require('path');

const Product = require('../models/Product');
const Review = require('../models/Review');
const Category = require('../models/Category');
const Collection = require('../models/Collection');
const Store = require('../models/Store');
const User = require('../models/User');

const data = require(path.join(__dirname, '../../../frontend/src/utils/sample-data.json'));

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected');
};

const idMap = {};

const importData = async () => {
  await connectDB();

  await Promise.all([
    Product.deleteMany(),
    Review.deleteMany(),
    Category.deleteMany(),
    Collection.deleteMany(),
    Store.deleteMany(),
  ]);
  console.log('Cleared existing data');

  // Products
  const productDocs = data.products.map(({ _id, ...rest }) => rest);
  const insertedProducts = await Product.insertMany(productDocs);
  data.products.forEach((p, i) => { idMap[p._id] = insertedProducts[i]._id; });
  console.log(`Inserted ${insertedProducts.length} products`);

  // Reviews
  const reviewDocs = data.reviews.map(({ _id, productId, userId, ...rest }) => ({
    ...rest,
    product: idMap[productId] || insertedProducts[0]._id,
  }));
  await Review.insertMany(reviewDocs);
  console.log(`Inserted ${reviewDocs.length} reviews`);

  // Categories
  const categoryDocs = data.categories.map(({ _id, name, icon, subcategories, image, description }) => ({
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    icon,
    subcategories: subcategories || [],
    image,
    description,
  }));
  await Category.insertMany(categoryDocs);
  console.log(`Inserted ${categoryDocs.length} categories`);

  // Collections
  const collectionDocs = data.collections.map(({ _id, ...rest }) => rest);
  await Collection.insertMany(collectionDocs);
  console.log(`Inserted ${collectionDocs.length} collections`);

  // Stores
  const storeDocs = data.stores.map(({ _id, ...rest }) => rest);
  await Store.insertMany(storeDocs);
  console.log(`Inserted ${storeDocs.length} stores`);

  // Create default admin user
  const existing = await User.findOne({ email: 'admin@jawhara.com' });
  if (!existing) {
    await User.create({ name: 'Admin', email: 'admin@jawhara.com', password: 'Admin@123', role: 'admin' });
    console.log('Admin user created: admin@jawhara.com / Admin@123');
  }

  console.log('Seeding complete!');
  process.exit(0);
};

const destroyData = async () => {
  await connectDB();
  await Promise.all([
    Product.deleteMany(),
    Review.deleteMany(),
    Category.deleteMany(),
    Collection.deleteMany(),
    Store.deleteMany(),
  ]);
  console.log('All data destroyed');
  process.exit(0);
};

if (process.argv[2] === '--import') {
  importData().catch((err) => { console.error(err); process.exit(1); });
} else if (process.argv[2] === '--destroy') {
  destroyData().catch((err) => { console.error(err); process.exit(1); });
} else {
  console.log('Usage: node seeder.js --import | --destroy');
  process.exit(1);
}
