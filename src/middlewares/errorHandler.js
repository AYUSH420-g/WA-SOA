/**
 * Global Error Handling Middleware
 * Catch-all error handler for formatted JSON response messages.
 */

function errorHandler(err, req, res, next) {
  // Handle JSON syntax parsing error (e.g. malformed body)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      status: 400,
      error: 'Bad Request',
      message: 'Invalid JSON syntax in request body'
    });
  }

  const statusCode = err.status || 500;
  const errorTitle = statusCode === 404 ? 'Not Found' : statusCode === 400 ? 'Bad Request' : 'Internal Server Error';

  res.status(statusCode).json({
    status: statusCode,
    error: errorTitle,
    message: err.message || 'An unexpected error occurred on the server'
  });
}

function notFoundHandler(req, res, next) {
  res.status(404).json({
    status: 404,
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.originalUrl} does not exist on this server`
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
