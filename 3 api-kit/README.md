# api-kit

## What it does
Keeps every API response in the same envelope (`{ success: true, data }` for wins, `{ success: false, error }` for errors) so your frontend only needs one parser. Also wraps async route handlers so you never have to write `try/catch` blocks over and over, and builds a standard CRUD router for any repository.

## Install
Requires `express`. Run `npm install` from the root folder.

## Usage
```javascript
const express = require('express');
const { sendSuccess, asyncHandler, createCrudRouter } = require('./api-kit');

const app = express();
app.use(express.json());

// 1. Wrap async routes cleanly
app.get('/ping', asyncHandler(async (req, res) => {
    sendSuccess(res, { pong: true });
}));

// 2. Wire a full CRUD router to any repository object
const fakeRepo = {
    find: async () => [{ id: '1', name: 'Sample' }],
    findById: async (id) => ({ id, name: 'Sample' }),
    create: async (body) => ({ id: '2', ...body }),
    update: async (id, body) => ({ id, ...body }),
    delete: async (id) => ({ id })
};

app.use('/items', createCrudRouter(fakeRepo));
```

## API
* `sendSuccess(res, data, statusCode = 200, extra = {})` - Sends `{ success: true, data, ...extra }`.
* `sendCreate(res, data)` - Shortcut for `sendSuccess(res, data, 201)`.
* `sendNoContent(res)` - Sends an empty `204` response.
* `asyncHandler(fn)` - Catches rejected promises in async Express routes and forwards them to `next(err)`.
* `createCrudRouter(repository, options)` - Returns an Express router with `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, and `DELETE /:id` wired to `repository`.
  * `options.middleware` (default `[]`) - Optional array of Express middleware (like `requireAuth`) applied to routes.

## Decisions
* **One consistent response envelope:** Matches `guard-kit`'s `{ success: false, error }` format so `api-client` can parse every endpoint the exact same way.
* **Repository injection in `createCrudRouter`:** Instead of importing a specific Mongoose model or controller, the router takes any repository object so it works for users, tasks, plants, or anything else.
* **Uses `guard-kit` (`ApiError`):** Refactored missing record checks (`GET /:id`, `PATCH /:id`, `DELETE /:id`) to throw `ApiError.notFound` (404).

## Changes
* **v1.0.0** - Added response envelope helpers, `asyncHandler`, and `createCrudRouter`.
* **v1.1.0** - Refactored 404 checks to throw `ApiError.notFound` from `../guard-kit`.
