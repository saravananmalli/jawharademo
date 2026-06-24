require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const MAPPING = {
  'Same Day':           'Next Day Delivery',
  'Next Day':           'Next Day Delivery',
  'Delivered Next Day': 'Next Day Delivery',
  '1–3 Days':           '1–3 Day Delivery',
  '1-3 Days':           '1–3 Day Delivery',
  'Delivered in 1–3 Days': '1–3 Day Delivery',
  '2–3 Days':           '2–3 Day Delivery',
  '2-3 Days':           '2–3 Day Delivery',
  'Delivered in 2–3 Days': '2–3 Day Delivery',
  '3–5 Days':           '2–3 Day Delivery',
  '3-5 Days':           '2–3 Day Delivery',
  '5–7 Days':           '2–3 Day Delivery',
  '7–14 Days':          '2–3 Day Delivery',
  '2–3 Weeks':          '2–3 Day Delivery',
};

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const Product = require('../src/models/Product');
  let total = 0;

  for (const [oldVal, newVal] of Object.entries(MAPPING)) {
    const result = await Product.updateMany(
      { arrivesBy: oldVal },
      { $set: { arrivesBy: newVal } }
    );
    if (result.modifiedCount > 0) {
      console.log(`  "${oldVal}" → "${newVal}": ${result.modifiedCount} updated`);
      total += result.modifiedCount;
    }
  }

  // Also clear deliveryDate since arrivesBy is now the single source of truth
  const cleared = await Product.updateMany(
    { deliveryDate: { $exists: true, $ne: '' } },
    { $unset: { deliveryDate: '' } }
  );
  console.log(`  Cleared legacy deliveryDate field: ${cleared.modifiedCount} records`);

  console.log(`\nDone. ${total} products updated.`);
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
