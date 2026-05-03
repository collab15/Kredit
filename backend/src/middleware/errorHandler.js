// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path} →`, err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
};