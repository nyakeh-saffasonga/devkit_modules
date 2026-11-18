'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createApiClient } = require('../index');

describe('api-client contract tests', () => {
    // --- SUCCESS CASES ---

    it('attaches Bearer token, sends JSON body, and unwraps { success: true, data }', async () => {
        let capturedUrl = null;
        let capturedOptions = null;

        const mockFetch = async (url, options) => {
            capturedUrl = url;
            capturedOptions = options;
            return {
                ok: true,
                status: 201,
                text: async () => JSON.stringify({ success: true, data: { id: '99', title: 'Task' } })
            };
        };

        const client = createApiClient({
            baseUrl: 'https://example.com',
            getToken: () => 'my-jwt-token',
            fetchImpl: mockFetch
        });

        const data = await client.post('/tasks', { title: 'Task' });

        assert.equal(capturedUrl, 'https://example.comtasks');
        assert.equal(capturedOptions.headers.Authorization, 'Bearer my-jwt-token');
        assert.equal(capturedOptions.headers['Content-Type'], 'application/json');
        assert.deepEqual(data, { id: '99', title: 'Task' });
    });

    it('returns null cleanly on 204 No Content', async () => {
        const mockFetch = async () => ({
            ok: true,
            status: 204,
            text: async () => ''
        });

        const client = createApiClient({ baseUrl: 'https://example.com', fetchImpl: mockFetch });
        const result = await client.delete('/tasks/99');

        assert.equal(result, null);
    });

    // --- FAILURE CASES ---

    it('throws an error with statusCode and details when server returns non-2xx', async () => {
        const mockFetch = async () => ({
            ok: false,
            status: 400,
            text: async () => JSON.stringify({
                success: false,
                error: { message: 'Missing required fields', details: { missing: ['title'] } }
            })
        });

        const client = createApiClient({ baseUrl: 'https://example.com', fetchImpl: mockFetch });

        await assert.rejects(
            () => client.post('/tasks', {}),
            (err) => err.statusCode === 400 && err.message === 'Missing required fields' && err.details.missing[0] === 'title'
        );
    });

    it('throws if no fetch implementation is available', () => {
        assert.throws(() => createApiClient({ fetchImpl: null }), /fetch implementation is required/);
    });
});
