'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
    hashPassword,
    comparePassword,
    needsRehash,
    signToken,
    verifyToken,
    extractToken,
    saveToken,
    loadToken,
    clearToken
} = require('../index');

describe('auth-kit contract tests', () => {
    const SECRET = 'super-secret-key';

    // --- SUCCESS CASES ---

    it('hashes and compares passwords cleanly', async () => {
        const hashed = await hashPassword('myPassword123', 4);
        assert.notEqual(hashed, 'myPassword123');
        assert.equal(await comparePassword('myPassword123', hashed), true);
        assert.equal(await comparePassword('wrongPassword', hashed), false);
    });

    it('detects when a password hash needs rehashing', async () => {
        const weakHash = await hashPassword('myPassword123', 4);
        assert.equal(needsRehash(weakHash, 10), true);
        assert.equal(needsRehash(weakHash, 4), false);
    });

    it('signs, verifies, extracts, and stores tokens', () => {
        const token = signToken({ id: 42, role: 'user' }, SECRET, '1h');
        const extracted = extractToken(`Bearer ${token}`);
        assert.equal(extracted, token);

        const decoded = verifyToken(extracted, SECRET);
        assert.equal(decoded.sub, '42');
        assert.equal(decoded.role, 'user');

        // Mock localStorage
        const map = new Map();
        const mockStorage = {
            setItem: (k, v) => map.set(k, v),
            getItem: (k) => map.get(k) ?? null,
            removeItem: (k) => map.delete(k)
        };

        saveToken('jwt', token, mockStorage);
        assert.equal(loadToken('jwt', mockStorage), token);
        clearToken('jwt', mockStorage);
        assert.equal(loadToken('jwt', mockStorage), null);
    });

    // --- FAILURE & EDGE CASES ---

    it('rejects passwords over the 72-byte bcrypt limit', async () => {
        await assert.rejects(() => hashPassword('a'.repeat(73), 4), /72-byte/);
        await assert.rejects(() => hashPassword('🔑'.repeat(19), 4), /72-byte/);
    });

    it('rejects empty or non-string passwords', async () => {
        await assert.rejects(() => hashPassword('', 4), /non-empty string/);
        await assert.rejects(() => hashPassword(null, 4), /non-empty string/);
        assert.equal(await comparePassword('', '$2a$04$abcdefghijklmnopqrstuu'), false);
    });

    it('throws on invalid or wrong-secret JWT tokens', () => {
        const token = signToken({ id: 42, role: 'user' }, SECRET);
        assert.throws(() => verifyToken(token, 'wrong-secret'), /Invalid token/);
        assert.throws(() => verifyToken('bad.token.here', SECRET), /Invalid token/);
    });
});
