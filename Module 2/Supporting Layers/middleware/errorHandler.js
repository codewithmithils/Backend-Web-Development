const AppError = require('../utils/AppError');

module.exports = function errorHandler(err, req, res, next) {
  const isOperational =
    err instanceof AppError && err.isOperational === true;

  const status = isOperational ? err.statusCode : 500;
  const message = isOperational ? err.message : 'Internal Server Error';

  res.status(status).json({ error: message });
};
