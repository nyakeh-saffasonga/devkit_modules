# guard-kit

## What it does
Client code branches on the status code, not on your message. `guard-kit` gives you one custom error class (`ApiError`) with status codes built in so you don't have to remember them, a quick helper to catch missing fields, and one Express error handler so every error comes back in the exact same JSON shape.

## Install
No extra packages needed. Just copy the `guard-kit` folder into your project, or run `npm install` in the main repo folder.

## Usage
```javascript
const { ApiError, requireFields, createErrorHandler } = require('./guard-kit');

// Check for missing fields (throws a 400 ApiError if anything is missing)
try {
    requireFields({ email: 'test@example.com' }, ['email', 'password']);
} catch (err) {
    console.log(err.statusCode); // 400
    console.log(err.details);    // { missing: ['password'] }
}

// Throw an error with the status code already attached
const err = ApiError.notFound('User not found');
console.log(err.statusCode, err.message); // 404 'User not found'

// Plug into Express at the very end of your middleware chain
const errorHandler = createErrorHandler({ includeStack: true });
```

## API
* `new ApiError(statusCode, message, details)` - Creates an error with an HTTP status code attached.
* `ApiError.badRequest(message, details)` - 400 (the request was wrong).
* `ApiError.unauthorized(message, details)` - 401 (we don't know who you are).
* `ApiError.forbidden(message, details)` - 403 (we know who you are, and you still can't).
* `ApiError.notFound(message, details)` - 404 (not found).
* `ApiError.conflict(message, details)` - 409 (conflicts with current state, like a duplicate email).
* `requireFields(data, fields)` - Checks that `data` is an object and has every key in `fields`. Throws a 400 `ApiError` if anything is missing.
* `createErrorHandler(options)` - Returns the 4-parameter Express error middleware `(err, req, res, next)`. Turns `ApiError` and Mongoose errors (`CastError`, `ValidationError`, duplicate key `11000`) into `{ success: false, error: { message } }`.
  * `options.includeStack` (default `false`) - Shows stack traces when `true`.
  * `options.logger` (default `console.error`) - Logs 500 errors. Pass `null` in tests so the terminal stays quiet.

## Decisions
* **Passed options instead of reading `process.env`:** An earlier version imported `config/env.js`. That breaks the moment you copy this folder into a new project. Passing `includeStack` into `createErrorHandler` keeps it standalone.
* **`0` and `false` count as valid values:** In `requireFields`, checking `!data[field]` would treat `0` or `false` as missing. It explicitly checks for `undefined`, `null`, and `''`.
* **Zero dependencies:** Only uses built-in Node stuff so the other modules in this toolkit can import it without extra bloat.

## Changes
* **v1.0.0** - Built `ApiError`, `requireFields`, and `createErrorHandler`. Fixed Mongo duplicate key check to look at `err.code === 11000` instead of `err.name`.
