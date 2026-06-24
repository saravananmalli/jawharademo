require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const MAPPING = {
  'Same Day':  'Delivered Next Day',
  'Next Day':  'Delivered Next Day',
  '1–3 Days':  'Delivered in 1–3 Days',
  '1-3 Days':  'Delivered in 1–3 Days',
  '2–3 Days':  'Delivered in 2–3 Days',
  '2-3 Days':  'Delivered in 2–3 Days',
  '3–5 Days':  'Delivered in 2–3 Days',
  '3-5 Days':  'Delivered in 2–3 Days',
  '5–7 Days':  'Delivered in 2–3 Days',
  '7–14 Days': 'Delivered in 2–3 Days',
  '2–3 Weeks': 'Delivered in 2–3 Days',
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
