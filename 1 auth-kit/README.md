# auth-kit

## What it does
HTTP does not remember who you are—tokens are the workaround bolted on top so the server knows who is asking. `auth-kit` handles password hashing with `bcryptjs` (including the 72-byte limit and rehash checks), JWT signing and verifying, and `localStorage` token helpers that won't crash when tested in Node.

## Install
Requires `bcryptjs` and `jsonwebtoken`. Run `npm install` from the root folder.

## Usage
```javascript
const {
    hashPassword,
    comparePassword,
    needsRehash,
    signToken,
    verifyToken,
    extractToken
} = require('./auth-kit');

async function demo() {
    // 1. Hash and verify a password
    const hash = await hashPassword('hunter2!', 10);
    const matches = await comparePassword('hunter2!', hash); // true
    const upgrade = needsRehash(hash, 12); // true (10 < 12)

    // 2. Sign and verify a JWT (secret is passed in, never read from process.env)
    const token = signToken({ id: 42, role: 'user' }, 'my-secret', '1h');
    const raw = extractToken(`Bearer ${token}`);
    const payload = verifyToken(raw, 'my-secret');
    console.log(payload.sub); // '42'
}

demo();
```

## API
* `hashPassword(password, saltRounds = 10)` - Hashes a password with `bcryptjs`. Rejects empty strings, non-strings, and passwords over 72 UTF-8 bytes.
* `comparePassword(candidatePassword, hashedPassword)` - Safely compares a plain password against a hash. Returns `false` instead of crashing on bad inputs or >72-byte strings.
* `needsRehash(hashedPassword, targetRounds = 10)` - Uses `bcrypt.getRounds()` to return `true` if an old password hash needs to be upgraded.
* `signToken(user, jwtSecretHash, jwtExpiresIn = '7d')` - Signs a tiny JWT payload (`{ sub, role }`) using the secret passed in by the caller.
* `verifyToken(token, jwtSecretHash)` - Verifies a JWT and returns the decoded payload, or throws a 401 error if it is expired or forged.
* `extractToken(headerOrToken)` - Strips `"Bearer "` from an Authorization header and returns the raw token string.
* `saveToken(key, token, storage)` / `loadToken(key, storage)` / `clearToken(key, storage)` - Wraps `localStorage` calls. Defaults to `globalThis.localStorage` or takes a mock storage object in Node.

## Decisions
* **Blocked passwords over 72 UTF-8 bytes:** `bcryptjs` silently chops off anything past 72 bytes, which means two different long passwords could match. Measuring `Buffer.byteLength(password, 'utf8')` catches multi-byte characters too.
* **No `process.env` inside the module:** Every secret and expiration time gets passed in by the caller so this file works in any project without editing it.
* **Injectable `storage` parameter:** Node has no `window` or `localStorage` global. Passing `storage` lets tests use a `Map` without throwing `ReferenceError`.
* **Uses `guard-kit` (`ApiError`):** Refactored validation and token failures to throw `ApiError.badRequest` (400) and `ApiError.unauthorized` (401) so Express routes get the right status codes automatically.

## Changes
* **v1.0.0** - Added password hashing, rehash detection, JWT helpers, and storage wrappers.
* **v1.1.0** - Refactored errors to use `ApiError` from `../guard-kit`.
