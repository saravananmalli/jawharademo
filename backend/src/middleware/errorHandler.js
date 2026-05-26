const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  const status = err.statusCode || 500;
  const message = err.message || 'Server error';
  res.status(status).json({ success: false, message });
};

module.exports = errorHandler;
