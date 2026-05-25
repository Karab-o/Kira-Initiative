import { logger } from '../utils/logger.js';

export function notFound(req, res, _next) {
  res.status(404).json({ error: 'Not found', path: req.path });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const status = err.statusCode || err.status || 500;
  const isProd = process.env.NODE_ENV === 'production';

  if (status >= 500) {
    logger.error(`${req.method} ${req.path}`, err);
  } else {
    logger.warn(`${req.method} ${req.path} -> ${status}: ${err.message}`);
  }

  res.status(status).json({
    error: err.message || 'Internal error',
    ...(isProd ? {} : { stack: err.stack }),
  });
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.statusCode = status;
  }
}
