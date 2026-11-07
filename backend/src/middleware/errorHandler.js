const errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error(err.stack || err.message);
  }

  // Handle Multer specific errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ success: false, message: 'File too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  }

  const status = err.status || err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  const isProduction = process.env.NODE_ENV === 'production';
  const message = isProduction && status === 500 ? 'Internal server error' : (err.message || 'Internal server error');

  res.status(status).json({
    success: false,
    message,
    ...(!isProduction && err.stack ? { stack: err.stack } : {}),
  });
};

const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
};

module.exports = { errorHandler, notFound };

