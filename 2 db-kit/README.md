# db-kit

## What it does
Wraps Mongoose so you don't rewrite connection listeners, schema settings, and basic CRUD database queries in every new app. Gives you `connect`, `disconnect`, `isConnected`, a schema defaults helper, and a `Repository` class that works with any Mongoose model.

## Install
Requires `mongoose`. Run `npm install` from the root folder.

## Usage
```javascript
const mongoose = require('mongoose');
const { applySchemaDefaults, Repository, isConnected } = require('./db-kit');

// 1. Add timestamps and clean JSON formatting to any schema
const itemSchema = new mongoose.Schema({ name: String });
applySchemaDefaults(itemSchema);

const Item = mongoose.model('Item', itemSchema);

// 2. Wrap any model in a reusable Repository
const itemRepo = new Repository(Item);
console.log(typeof itemRepo.create, typeof itemRepo.findById); // 'function' 'function'
console.log(isConnected()); // false until connect(uri) is called
```

## API
* `connect(uri, options)` - Connects to MongoDB using the URI passed in and attaches connection event listeners once.
* `disconnect()` - Closes the active Mongoose connection.
* `isConnected()` - Returns `true` when `mongoose.connection.readyState === 1`.
* `applySchemaDefaults(schema)` - Turns on `timestamps: true` (`createdAt`, `updatedAt`) and sets a `toJSON` transform that renames `_id` to `id` and hides `__v`.
* `new Repository(model)` - Wraps any Mongoose model with standard methods:
  * `create(data)` - Saves a new document.
  * `findById(id)` - Validates the ObjectId and finds one document.
  * `find(query, options)` - Finds matching documents.
  * `update(id, data)` - Validates the ObjectId and updates with `{ new: true, runValidators: true }`.
  * `delete(id)` - Validates the ObjectId and deletes the document.

## Decisions
* **Caller passes the Mongo URI:** `connect(uri)` never reads `process.env.MONGODB_URI` directly so the module stays decoupled from app config files.
* **Listener guard (`listenersAttached`):** Prevents duplicate `connected`/`error` console logs if `connect()` gets called more than once.
* **Uses `guard-kit` (`ApiError`):** Refactored bad ObjectId checks to throw `ApiError.badRequest` (400) so invalid IDs in URLs return a 400 client error instead of a 500 crash.

## Changes
* **v1.0.0** - Added connection helpers, `applySchemaDefaults`, and generic `Repository`.
* **v1.1.0** - Refactored invalid ObjectId errors to throw `ApiError` from `../guard-kit`.
