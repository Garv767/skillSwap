const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error to console for development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error Details:', err);
    console.error('Error Stack:', err.stack);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = createError(404, message);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    let message = 'Duplicate field value entered';
    
    // Extract field name from error
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    
    if (field === 'email') {
      message = 'Email address is already registered';
    } else if (field === 'name') {
      message = `${field} '${value}' already exists`;
    } else {
      message = `Duplicate value for ${field}: ${value}`;
    }
    
    error = createError(400, message);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    const message = messages.length > 1 ? messages : messages[0];
    error = createError(400, message);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = createError(401, message);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = createError(401, message);
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    error = createError(400, message);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Too many files uploaded';
    error = createError(400, message);
  }

  // Rate limiting errors
  if (err.status === 429) {
    const message = 'Too many requests, please try again later';
    error = createError(429, message);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    ...(error.errors && { errors: error.errors })
  });
};

const createError = (statusCode, message, errors = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (errors) {
    error.errors = errors;
  }
  return error;
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

const handleAsyncErrors = (controller) => {
  return async (req, res, next) => {
    try {
      await controller(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

// Validation error formatter
const formatValidationErrors = (errors) => {
  return errors.reduce((acc, error) => {
    const field = error.param || error.path;
    if (!acc[field]) {
      acc[field] = [];
    }
    acc[field].push(error.msg);
    return acc;
  }, {});
};

// Custom error classes
class BadRequestError extends ApiError {
  constructor(message = 'Bad Request', errors = null) {
    super(400, message);
    this.errors = errors;
  }
}

class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(403, message);
  }
}

class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(404, message);
  }
}

class ConflictError extends ApiError {
  constructor(message = 'Resource conflict') {
    super(409, message);
  }
}

class UnprocessableEntityError extends ApiError {
  constructor(message = 'Unprocessable Entity', errors = null) {
    super(422, message);
    this.errors = errors;
  }
}

class InternalServerError extends ApiError {
  constructor(message = 'Internal Server Error') {
    super(500, message);
  }
}

// Error response utility
const sendErrorResponse = (res, error, message = null) => {
  const statusCode = error.statusCode || 500;
  const errorMessage = message || error.message || 'Internal Server Error';
  
  const response = {
    success: false,
    message: errorMessage,
    timestamp: new Date().toISOString(),
    path: res.req?.originalUrl
  };

  // Add error details in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
    if (error.errors) {
      response.errors = error.errors;
    }
  }

  // Add validation errors if present
  if (error.errors && typeof error.errors === 'object') {
    response.errors = error.errors;
  }

  res.status(statusCode).json(response);
};

// Success response utility
const sendSuccessResponse = (res, data = null, message = 'Success', statusCode = 200) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== null) {
    response.data = data;
  }

  res.status(statusCode).json(response);
};

// Paginated response utility
const sendPaginatedResponse = (res, data, pagination, message = 'Success') => {
  res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      currentPage: pagination.page,
      totalPages: Math.ceil(pagination.total / pagination.limit),
      totalItems: pagination.total,
      itemsPerPage: pagination.limit,
      hasNextPage: pagination.page < Math.ceil(pagination.total / pagination.limit),
      hasPrevPage: pagination.page > 1
    },
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  errorHandler,
  createError,
  asyncHandler,
  ApiError,
  handleAsyncErrors,
  formatValidationErrors,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  UnprocessableEntityError,
  InternalServerError,
  sendErrorResponse,
  sendSuccessResponse,
  sendPaginatedResponse
};