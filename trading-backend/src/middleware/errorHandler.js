/**
 * @module middleware/errorHandler
 * @description Global Express error-handling middleware.
 * Returns a consistent JSON error format for all uncaught errors.
 */

const { logger } = require('./logger');

/**
 * Global error handler middleware.
 * @param {Error} err - The error object.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 */
const errorHandler = (err, req, res, _next) => {
  logger.error(`Unhandled error: ${err.message}`, {
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
  });

  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: err.message || 'An unexpected error occurred.',
    },
  });
};

module.exports = errorHandler;
