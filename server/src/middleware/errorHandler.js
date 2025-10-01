/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let error = "Error";

  // Log error for debugging (This implementation is fine for an MVP.)
  // In production, consider using a logging library like Winston
  console.error("Error:", {
    message: err.message,
    statusCode: statusCode,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
  });

  // Handle specific error types
  if (err.name === "ValidationError") {
    statusCode = 400;
    error = "Validation Error";
  } else if (err.name === "CastError") {
    statusCode = 404; // Changed from 400
    error = "Not Found";
    message = "We couldn't find that user. They may have been deleted.";
  } else if (err.code === 11000) {
    statusCode = 409;
    error = "Duplicate Entry";
    message = "A resource with this value already exists";
  } else if (
    err.code === "ECONNABORTED" ||
    /timeout/i.test(err.message || "")
  ) {
    statusCode = 400;
    error = "Bad Request";
    message = "The request timed out. Please try again with valid inputs.";
  } else if (/firebase|database/i.test(err.message || "")) {
    statusCode = 500;
    error = "Database Error";
    message =
      "We're having trouble connecting to the database. Please try again.";
  } else if ((err.message || "").includes("OpenWeather")) {
    statusCode = 503;
    error = "External Service Error";
    message = "Unable to fetch location data. Please try again later.";
  } else if (statusCode === 404) {
    error = "Not Found";
  } else if (statusCode === 400) {
    error = "Bad Request";
  } else if (statusCode === 401) {
    error = "Unauthorized";
  } else if (statusCode === 403) {
    error = "Forbidden";
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: error,
    message: message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      details: err,
    }),
  });
};

module.exports = errorHandler;
