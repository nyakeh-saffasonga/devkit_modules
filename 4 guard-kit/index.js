'use strict'

class ApiError extends Error {
    constructor(statusCode, message, details = null) {
        super(message)
        this.name = 'ApiError'
        this.statusCode = statusCode
        this.details = details
        this.isOperational = true
        Error.captureStackTrace(this, this.constructor)
    }

    static badRequest(message = 'Bad Request', details = null) {
        return new ApiError(400, message, details)
    }

    static unauthorized(message = 'Unauthorized', details = null) {
        return new ApiError(401, message, details)
    }

    static forbidden(message = 'Forbidden', details = null) {
        return new ApiError(403, message, details)
    }

    static notFound(message = 'Not Found', details = null) {
        return new ApiError(404, message, details)
    }

    static conflict(message = 'Conflict', details = null) {
        return new ApiError(409, message, details)
    }
}

function requireFields(data, fields) {
    if (!data || typeof data !== 'object') {
        throw ApiError.badRequest('Request payload must be an object')
    }
    const missing = fields.filter((field) => data[field] === undefined || data[field] === null || data[field] === '')
    if (missing.length > 0) {
        throw ApiError.badRequest('Missing required fields', { missing })
    }
    return true;
}

function createErrorHandler({ includeStack = false, logger = console.error } = {}) {
    // eslint-disable-next-line no-unused-vars
    return function errorHandler(err, req, res, next) {
        let statusCode = err.statusCode || 500
        let message = err.message || 'Internal Server Error'
        let details = err.details || null

        if (err.name === 'CastError') {
            statusCode = 400
            message = `Invalid ${err.path}: ${err.value}`
        }

        if (err.name === 'ValidationError' && err.errors) {
            statusCode = 400
            message = 'Validation Failed'
            details = Object.values(err.errors).map((e) => ({
                field: e.path,
                message: e.message
            }));
        }

        if (err.code === 11000) {
            statusCode = 409
            message = `Duplicate value for: ${Object.keys(err.keyValue || {}).join(', ')}`;
        }

        if (err.type === 'entity.parse.failed') {
            statusCode = 400
            message = 'Malformed JSON in request body';
        }

        if (err.type === 'entity.too.large') {
            statusCode = 413
            message = 'Request body too large';
        }

        if (statusCode >= 500 && logger) {
            logger('[error]', { message: err.message, stack: err.stack })
        }

        res.status(statusCode).json({
            success: false,
            error: {
                message,
                ...(details && { details }),
                ...(includeStack && statusCode >= 500 && { stack: err.stack })
            }
        });
    };
}

module.exports = {
    ApiError,
    requireFields,
    createErrorHandler
};
