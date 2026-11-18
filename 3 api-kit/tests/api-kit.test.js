'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { sendSuccess, sendCreate, sendNoContent, asyncHandler, createCrudRouter } = require('../index');

function createMockRes() {
    return {
        statusCode: null,
        body: null,
        sent: false,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        },
        send() {
            this.sent = true;
            return this;
        }
    };
}

describe('api-kit contract tests', () => {
    // --- SUCCESS CASES ---

    it('wraps responses in the standard { success: true, data } envelope', () => {
        const res1 = createMockRes();
        sendSuccess(res1, { id: 1 }, 200, { meta: { page: 1 } });
        assert.equal(res1.statusCode, 200);
        assert.deepEqual(res1.body, { success: true, data: { id: 1 }, meta: { page: 1 } });

        const res2 = createMockRes();
        sendCreate(res2, { id: 2 });
        assert.equal(res2.statusCode, 201);
        assert.deepEqual(res2.body, { success: true, data: { id: 2 } });

        const res3 = createMockRes();
        sendNoContent(res3);
        assert.equal(res3.statusCode, 204);
        assert.equal(res3.sent, true);
    });

    it('builds an Express router with standard CRUD routes for a repository', () => {
        const fakeRepo = {
            find: async () => [],
            findById: async () => null,
            create: async (d) => d,
            update: async () => null,
            delete: async () => null
        };

        const router = createCrudRouter(fakeRepo);
        const paths = router.stack.filter((layer) => layer.route).map((layer) => layer.route.path);

        assert.ok(paths.includes('/'));
        assert.ok(paths.includes('/:id'));
    });

    // --- FAILURE & EDGE CASES ---

    it('forwards async errors from asyncHandler to next(err)', async () => {
        const boom = new Error('Async failure');
        const wrapped = asyncHandler(async () => {
            throw boom;
        });

        let caught = null;
        await wrapped({}, {}, (err) => {
            caught = err;
        });

        assert.equal(caught, boom);
    });

    it('throws when createCrudRouter is called without a repository', () => {
        assert.throws(() => createCrudRouter(), /repository instance is required/);
    });
});
