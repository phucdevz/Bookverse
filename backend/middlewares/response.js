// ========================================
// BOOKVERSE RESPONSE STANDARDIZATION
// Consistent API response format
// ========================================

/**
 * Standardized response middleware
 * Ensures all API responses follow the same format
 */

const sendResponse = (res, statusCode, success, data = null, message = '', meta = null) => {
    const response = {
        success,
        timestamp: new Date().toISOString(),
        ...(data && { data }),
        ...(message && { message }),
        ...(meta && { meta })
    };

    return res.status(statusCode).json(response);
};

// Success responses
const success = {
    ok: (res, data = null, message = 'Success') => 
        sendResponse(res, 200, true, data, message),
    
    created: (res, data = null, message = 'Created successfully') => 
        sendResponse(res, 201, true, data, message),
    
    accepted: (res, data = null, message = 'Request accepted') => 
        sendResponse(res, 202, true, data, message),
    
    noContent: (res, message = 'No content') => 
        sendResponse(res, 204, true, null, message)
};

// Error responses
const error = {
    badRequest: (res, message = 'Bad request', data = null) => 
        sendResponse(res, 400, false, data, message),
    
    unauthorized: (res, message = 'Unauthorized', data = null) => 
        sendResponse(res, 401, false, data, message),
    
    forbidden: (res, message = 'Forbidden', data = null) => 
        sendResponse(res, 403, false, data, message),
    
    notFound: (res, message = 'Not found', data = null) => 
        sendResponse(res, 404, false, data, message),
    
    conflict: (res, message = 'Conflict', data = null) => 
        sendResponse(res, 409, false, data, message),
    
    unprocessableEntity: (res, message = 'Unprocessable entity', data = null) => 
        sendResponse(res, 422, false, data, message),
    
    tooManyRequests: (res, message = 'Too many requests', data = null) => 
        sendResponse(res, 429, false, data, message),
    
    internalServerError: (res, message = 'Internal server error', data = null) => 
        sendResponse(res, 500, false, data, message),
    
    serviceUnavailable: (res, message = 'Service unavailable', data = null) => 
        sendResponse(res, 503, false, data, message)
};

// Pagination helper
const paginated = (res, data, page, limit, total, message = 'Success') => {
    const totalPages = Math.ceil(total / limit);
    const meta = {
        pagination: {
            currentPage: page,
            totalPages,
            totalItems: total,
            itemsPerPage: limit,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        }
    };
    
    return sendResponse(res, 200, true, data, message, meta);
};

// Validation error helper
const validationError = (res, errors, message = 'Validation failed') => {
    const errorData = {
        errors: errors.array ? errors.array() : errors,
        type: 'validation'
    };
    
    return sendResponse(res, 422, false, errorData, message);
};

// Rate limit error helper
const rateLimitError = (res, message = 'Too many requests', retryAfter = null) => {
    const errorData = {
        type: 'rate_limit',
        ...(retryAfter && { retryAfter })
    };
    
    return sendResponse(res, 429, false, errorData, message);
};

// Database error helper
const databaseError = (res, message = 'Database error', originalError = null) => {
    const errorData = {
        type: 'database',
        ...(process.env.NODE_ENV === 'development' && originalError && { 
            originalError: originalError.message 
        })
    };
    
    return sendResponse(res, 500, false, errorData, message);
};

// Authentication error helper
const authError = (res, message = 'Authentication failed', code = 'AUTH_FAILED') => {
    const errorData = {
        type: 'authentication',
        code
    };
    
    return sendResponse(res, 401, false, errorData, message);
};

// Authorization error helper
const authzError = (res, message = 'Insufficient permissions', requiredRole = null) => {
    const errorData = {
        type: 'authorization',
        ...(requiredRole && { requiredRole })
    };
    
    return sendResponse(res, 403, false, errorData, message);
};

// Global error handler middleware
const globalErrorHandler = (err, req, res, next) => {
    console.error('Global Error Handler:', err);

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => ({
            field: e.path,
            message: e.message,
            value: e.value
        }));
        return validationError(res, errors);
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return error.conflict(res, `${field} already exists`);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return authError(res, 'Invalid token');
    }

    if (err.name === 'TokenExpiredError') {
        return authError(res, 'Token expired', 'TOKEN_EXPIRED');
    }

    // Rate limit errors
    if (err.status === 429) {
        return rateLimitError(res, err.message, err.retryAfter);
    }

    // Default to internal server error
    const message = process.env.NODE_ENV === 'development' 
        ? err.message 
        : 'Internal server error';
    
    return error.internalServerError(res, message);
};

// 404 handler
const notFoundHandler = (req, res) => {
    return error.notFound(res, `Route ${req.originalUrl} not found`);
};

module.exports = {
    success,
    error,
    paginated,
    validationError,
    rateLimitError,
    databaseError,
    authError,
    authzError,
    globalErrorHandler,
    notFoundHandler,
    sendResponse
};
