require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

const app = express();

connectDB();

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());

// Serve uploaded images as static files
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

app.get('/', (req, res) => res.json({ name: 'Jawhara Jewelry API', status: 'ok', version: '1.0.0' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

const PORT = process.env.PORT || 5001;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
module.exports = app;
