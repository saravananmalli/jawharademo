const mongoose = require('mongoose');

// Cache connection across serverless warm invocations
let cached = global._mongooseCache;
if (!cached) cached = global._mongooseCache = { conn: null, promise: null };

const connectDB = async () => {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      bufferCommands: false,
    }).then(m => {
      console.log(`MongoDB Connected: ${m.connection.host}`);
      return m;
    }).catch(err => {
      cached.promise = null; // allow retry on next request
      console.error('MongoDB connection error:', err.message);
      throw err;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDB;
