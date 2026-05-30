require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Ensure DB is connected before every request (serverless safe)
app.use(async (req, res, next) => {
  try { await connectDB(); next(); }
  catch (err) { res.status(503).json({ error: 'Database unavailable', detail: err.message }); }
});

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : [];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // server-to-server / curl
    if (
      allowedOrigins.includes(origin) ||
      /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
      /\.vercel\.app$/.test(origin)
    ) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

// On Vercel new uploads go to /tmp (writable); committed images stay in ../uploads
if (process.env.VERCEL) {
  app.use('/uploads', express.static('/tmp/uploads'));
}
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/upload', require('./routes/upload'));
app.use('/api/banners', require('./routes/banners'));
app.use('/api/offers', require('./routes/offers'));
app.use('/api/products', require('./routes/products'));
app.use('/api/brands', require('./routes/brands'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/collections', require('./routes/collections'));
app.use('/api/stores', require('./routes/stores'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin',    require('./routes/admin'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/chat',       require('./routes/chat'));
app.use('/api/gold-price', require('./routes/goldPrice'));

app.get('/', (req, res) => res.json({ name: 'Jawhara Jewellery API', status: 'ok', version: '1.0.0' }));
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const dbState = states[mongoose.connection.readyState] || 'unknown';
  res.json({
    status: 'ok',
    db: dbState,
    dbHost: mongoose.connection.host || null,
    env: {
      hasMongoUri: !!process.env.MONGODB_URI,
      nodeEnv: process.env.NODE_ENV,
    },
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5001;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
module.exports = app;
