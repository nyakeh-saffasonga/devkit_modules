'use strict';

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const MAX_BCRYPT_BYTES = 72;

// 1. bcryptjs hashing + edge cases + rehash detection
async function hashPassword(password, saltRounds = 10) {
    if (typeof password !== 'string' || password.length === 0) {
        throw new Error('Password must be a non-empty string');
    }
    if (Buffer.byteLength(password, 'utf8') > MAX_BCRYPT_BYTES) {
        throw new Error('Password exceeds 72-byte bcrypt limit');
    }
    const isHashedAlready = password.startsWith('$2');
    if (!isHashedAlready) {
        const newPassword = await bcrypt.hash(password, saltRounds);
        return newPassword;
    }
    return password;
}

function comparePassword(candidatePassword, hashedPassword) {
    if (typeof candidatePassword !== 'string' || typeof hashedPassword !== 'string') {
        return Promise.resolve(false);
    }
    if (!candidatePassword || !hashedPassword) {
        return Promise.resolve(false);
    }
    if (Buffer.byteLength(candidatePassword, 'utf8') > MAX_BCRYPT_BYTES) {
        return Promise.resolve(false);
    }
    return bcrypt.compare(candidatePassword, hashedPassword);
}

function needsRehash(hashedPassword, targetRounds = 10) {
    if (typeof hashedPassword !== 'string' || !hashedPassword) {
        return true;
    }
    try {
        return bcrypt.getRounds(hashedPassword) < targetRounds;
    } catch {
        return true;
    }
}

// 2. JWT signing, verification, and Bearer extraction
function signToken(user, jwtSecretHash, jwtExpiresIn = '7d') {
    if (!jwtSecretHash) {
        throw new Error('JWT secret is required');
    }
    if (!user || !user.id) {
        throw new Error('User object with an id is required');
    }
    const payload = { sub: String(user.id), role: user.role };
    return jwt.sign(payload, jwtSecretHash, { expiresIn: jwtExpiresIn });
}

function verifyToken(token, jwtSecretHash) {
    if (!jwtSecretHash) {
        throw new Error('JWT secret is required');
    }
    if (!token || typeof token !== 'string') {
        throw new Error('Token is required');
    }
    try {
        return jwt.verify(token, jwtSecretHash);
    } catch (err) {
        throw new Error(err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token');
    }
}

function extractToken(headerOrToken) {
    if (!headerOrToken || typeof headerOrToken !== 'string') {
        return null;
    }
    if (headerOrToken.startsWith('Bearer ')) {
        return headerOrToken.slice(7).trim();
    }
    return headerOrToken.trim();
}

// 3. localStorage getters and setters (injectable storage for Node compatibility)
function saveToken(key, token, storage = globalThis.localStorage) {
    if (!storage) {
        throw new Error('Storage is not available');
    }
    storage.setItem(key, token);
}

function loadToken(key, storage = globalThis.localStorage) {
    if (!storage) {
        return null;
    }
    return storage.getItem(key);
}

function clearToken(key, storage = globalThis.localStorage) {
    if (!storage) {
        return;
    }
    storage.removeItem(key);
}

module.exports = {
    hashPassword,
    comparePassword,
    needsRehash,
    signToken,
    verifyToken,
    extractToken,
    saveToken,
    loadToken,
    clearToken
};
