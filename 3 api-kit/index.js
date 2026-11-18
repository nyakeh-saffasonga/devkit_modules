'use strict';

const express = require('express');

// 1. Response envelope helpers
function sendSuccess(res, data, statusCode = 200, extra = {}) {
    return res.status(statusCode).json({ success: true, data, ...extra });
}

function sendCreate(res, data) {
    return sendSuccess(res, data, 201);
}

function sendNoContent(res) {
    return res.status(204).send();
}

// 2. Async wrapper
const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// 3. Reusable CRUD router for any repository
function createCrudRouter(repository, { middleware = [] } = {}) {
    if (!repository) {
        throw new Error('A repository instance is required.');
    }

    const router = express.Router();

    router.get('/', ...middleware, asyncHandler(async (req, res) => {
        const items = await repository.find(req.query);
        return sendSuccess(res, items);
    }));

    router.get('/:id', ...middleware, asyncHandler(async (req, res) => {
        const item = await repository.findById(req.params.id);
        if (!item) {
            const err = new Error('Record not found');
            err.statusCode = 404;
            throw err;
        }
        return sendSuccess(res, item);
    }));

    router.post('/', ...middleware, asyncHandler(async (req, res) => {
        const created = await repository.create(req.body);
        return sendCreate(res, created);
    }));

    router.patch('/:id', ...middleware, asyncHandler(async (req, res) => {
        const updated = await repository.update(req.params.id, req.body);
        if (!updated) {
            const err = new Error('Record not found');
            err.statusCode = 404;
            throw err;
        }
        return sendSuccess(res, updated);
    }));

    router.delete('/:id', ...middleware, asyncHandler(async (req, res) => {
        const deleted = await repository.delete(req.params.id);
        if (!deleted) {
            const err = new Error('Record not found');
            err.statusCode = 404;
            throw err;
        }
        return sendNoContent(res);
    }));

    return router;
}

module.exports = {
    sendSuccess,
    sendCreate,
    sendNoContent,
    asyncHandler,
    createCrudRouter
};
