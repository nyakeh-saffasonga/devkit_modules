'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { ApiError, requireFields, createErrorHandler } = require('../index');

// Minimal mock for Express response object
function createMockRes() {
    return {
        statusCode: null,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        }
    };
}

describe('guard-kit contract tests', () => {
    // --- SUCCESS CASES ---

    it('creates operational ApiError instances with static helpers', () => {
        const err = ApiError.notFound('User not found', { id: 42 });

        assert.ok(err instanceof Error);
        assert.ok(err instanceof ApiError);
        assert.equal(err.statusCode, 404);
        assert.equal(err.message, 'User not found');
        assert.deepEqual(err.details, { id: 42 });
        assert.equal(err.isOperational, true);
    });

    it('passes requireFields when all required keys have values', () => {
        const payload = { email: 'dev@example.com', age: 0, active: false };
        const result = requireFields(payload, ['email', 'age', 'active']);

        assert.equal(result, true);
    });

    it('formats operational ApiError cleanly in errorHandler middleware', () => {
        const handler = createErrorHandler({ includeStack: false, logger: null });
        const err = ApiError.forbidden('Admin role required');
        const res = createMockRes();

        handler(err, {}, res, () => {});

        assert.equal(res.statusCode, 403);
        assert.deepEqual(res.body, {
            success: false,
            error: {
                message: 'Admin role required'
            }
        });
    });

    // --- FAILURE & EDGE CASES ---

    it('throws 400 ApiError with missing field names when requireFields fails', () => {
        assert.throws(
            () => requireFields({ email: 'dev@example.com', name: '' }, ['email', 'name', 'password']),
            (err) => {
                assert.ok(err instanceof ApiError);
                assert.equal(err.statusCode, 400);
                assert.deepEqual(err.details, { missing: ['name', 'password'] });
                return true;
            }
        );
    });

    it('throws 400 ApiError when requireFields receives a non-object payload', () => {
        assert.throws(
            () => requireFields(null, ['email']),
            (err) => err instanceof ApiError && err.statusCode === 400
        );
    });

    it('maps Mongo duplicate key error (code 11000) to 409 Conflict and hides stack by default', () => {
        const handler = createErrorHandler({ includeStack: false, logger: null });
        const mongoDupError = Object.assign(new Error('E11000 duplicate key'), {
            code: 11000,
            keyValue: { email: 'taken@example.com' }
        });
        const res = createMockRes();

        handler(mongoDupError, {}, res, () => {});

        assert.equal(res.statusCode, 409);
        assert.equal(res.body.success, false);
        assert.equal(res.body.error.message, 'Duplicate value for: email');
        assert.equal(res.body.error.stack, undefined);
    });
});
