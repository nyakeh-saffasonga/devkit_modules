# api-client

## What it does
`fetch()` sends the request and hands you a promise, then makes you manually attach headers, check `res.ok`, and parse JSON every single time. `api-client` wraps `fetch` so every call automatically attaches your Bearer token, unwraps `{ success: true, data }`, handles empty `204` responses, and throws real errors with `statusCode` on failures.

## Install
No extra packages needed (uses native `fetch` in Node 18+ and browsers). Copy the `api-client` folder into your project or run `npm install` from the root folder.

## Usage
```javascript
const { createApiClient } = require('./api-client');

// Using a mock fetch so this runs standalone without a live server
const mockFetch = async () => ({
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ success: true, data: [{ id: 1, name: 'Demo' }] })
});

const api = createApiClient({
    baseUrl: 'http://localhost:3000/api',
    getToken: () => 'my-jwt-token',
    fetchImpl: mockFetch
});

api.get('/items').then((items) => {
    console.log(items); // [{ id: 1, name: 'Demo' }]
});
```

## API
* `createApiClient(options)` - Returns an HTTP client with `.request()`, `.get()`, `.post()`, `.patch()`, and `.delete()`.
  * `options.baseUrl` - Base URL prepended to relative paths.
  * `options.getToken` - Function returning the current JWT token (or `null`).
  * `options.defaultHeaders` - Extra headers sent on every request.
  * `options.fetchImpl` - Defaults to `globalThis.fetch`; pass a mock function in tests.

## Decisions
* **Reads `res.text()` before `JSON.parse()`:** Calling `res.json()` directly crashes if a server returns `204 No Content` or a plain-text error page. Reading text first handles empty bodies safely.
* **Unwraps `api-kit`'s envelope automatically:** If the response matches `{ success: true, data }`, the client returns `data` directly so callers don't have to write `res.data.data`.
* **Injectable `fetchImpl`:** Lets unit tests verify headers, URLs, and error handling offline without starting an Express server.

## Changes
* **v1.0.0** - Initial `createApiClient` wrapper supporting `get`, `post`, `patch`, `delete`, Bearer auth, and `api-kit` envelope parsing.
